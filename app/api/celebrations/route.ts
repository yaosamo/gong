import { NextResponse } from "next/server";
import {
  createLocalCelebration,
  deleteAllLocalCelebrations,
  deleteLocalCelebration,
  incrementLocalCelebrationReaction,
  listLocalCelebrations,
  updateLocalCelebration,
  updateLocalCelebrationPosition,
} from "@/lib/store";
import { resolveLocationFromRequest } from "@/lib/geolocation";
import {
  createSupabaseCelebration,
  deleteAllSupabaseCelebrations,
  deleteSupabaseCelebration,
  getSupabaseErrorMessage,
  incrementSupabaseCelebrationReaction,
  listSupabaseCelebrations,
  updateSupabaseCelebration,
  updateSupabaseCelebrationPosition,
} from "@/lib/server-supabase";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function GET(request: Request) {
  try {
    const viewerLocation = await resolveLocationFromRequest(request);
    const remoteItems = await listSupabaseCelebrations().catch(() => null);

    if (remoteItems) {
      return NextResponse.json({ celebrations: remoteItems, viewerLocation });
    }

    if (isProductionRuntime()) {
      return NextResponse.json({ celebrations: [], viewerLocation });
    }

    const items = await listLocalCelebrations();
    return NextResponse.json({ celebrations: items, viewerLocation });
  } catch {
    return NextResponse.json(
      {
        celebrations: [],
        viewerLocation: {
          city: null,
          region: null,
          country: null,
          locationLabel: "Unknown location",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      name?: string;
      comment?: string;
      authorSessionId?: string;
    };

    const name = payload.name?.trim() ?? "";
    const comment = payload.comment?.trim() ?? "";
    const authorSessionId = payload.authorSessionId?.trim() ?? "";

    if (!name || !comment || !authorSessionId) {
      return NextResponse.json(
        { error: "Name, comment, and session are required." },
        { status: 400 },
      );
    }

    const location = await resolveLocationFromRequest(request);

    let remoteError: string | null = null;

    const remoteCelebration = await createSupabaseCelebration(
      { name, comment, authorSessionId },
      {
        city: location.city,
        region: location.region,
        country: location.country,
      },
    ).catch((error) => {
      remoteError = getSupabaseErrorMessage(error);
      return null;
    });

    if (remoteCelebration) {
      return NextResponse.json({ celebration: remoteCelebration }, { status: 201 });
    }

    if (isProductionRuntime()) {
      return NextResponse.json(
        { error: remoteError ?? "Celebration storage is not available." },
        { status: remoteError ? 500 : 503 },
      );
    }

    const celebration = await createLocalCelebration(
      { name, comment, authorSessionId },
      {
        city: location.city,
        region: location.region,
        country: location.country,
      },
    );

    return NextResponse.json({ celebration }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create celebration." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const clearAll = url.searchParams.get("all")?.trim() === "1";
    const id = url.searchParams.get("id")?.trim() ?? "";
    const authorSessionId = url.searchParams.get("authorSessionId")?.trim() ?? "";

    if (clearAll) {
      const deletedRemote = await deleteAllSupabaseCelebrations().catch(() => null);

      if (deletedRemote) {
        return NextResponse.json({ ok: true });
      }

      if (isProductionRuntime()) {
        return NextResponse.json(
          { error: "Celebration storage is not available." },
          { status: 503 },
        );
      }

      await deleteAllLocalCelebrations();
      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Celebration id is required." }, { status: 400 });
    }
    if (!authorSessionId) {
      return NextResponse.json({ error: "Author session is required." }, { status: 400 });
    }

    const deletedRemote = await deleteSupabaseCelebration(id, authorSessionId).catch(() => null);

    if (deletedRemote) {
      return NextResponse.json({ ok: true });
    }

    if (isProductionRuntime()) {
      return NextResponse.json(
        { error: "Celebration storage is not available." },
        { status: 503 },
      );
    }

    const deleted = await deleteLocalCelebration(id, authorSessionId);

    if (!deleted) {
      return NextResponse.json({ error: "Celebration not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not delete celebration." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as {
      id?: string;
      action?: string;
      name?: string;
      comment?: string;
      authorSessionId?: string;
      noteX?: number;
      noteY?: number;
      noteRotate?: number;
    };

    const id = payload.id?.trim() ?? "";
    const authorSessionId = payload.authorSessionId?.trim() ?? "";

    if (!id) {
      return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
    }

    if (payload.action === "react") {
      let remoteError: string | null = null;

      const remoteCelebration = await incrementSupabaseCelebrationReaction(id).catch((error) => {
        remoteError = getSupabaseErrorMessage(error);
        return null;
      });

      if (remoteCelebration) {
        return NextResponse.json({ celebration: remoteCelebration });
      }

      if (isProductionRuntime()) {
        return NextResponse.json(
          { error: remoteError ?? "Celebration storage is not available." },
          { status: remoteError ? 500 : 503 },
        );
      }

      const celebration = await incrementLocalCelebrationReaction(id);

      if (!celebration) {
        return NextResponse.json({ error: "Celebration not found." }, { status: 404 });
      }

      return NextResponse.json({ celebration });
    }

    if (payload.action === "update") {
      const name = payload.name?.trim() ?? "";
      const comment = payload.comment?.trim() ?? "";
      if (!authorSessionId) {
        return NextResponse.json({ error: "Author session is required." }, { status: 400 });
      }

      if (!name || !comment) {
        return NextResponse.json(
          { error: "Name and comment are required." },
          { status: 400 },
        );
      }

      let remoteError: string | null = null;

      const remoteCelebration = await updateSupabaseCelebration(id, {
        name,
        comment,
        authorSessionId,
      }).catch((error) => {
        remoteError = getSupabaseErrorMessage(error);
        return null;
      });

      if (remoteCelebration) {
        return NextResponse.json({ celebration: remoteCelebration });
      }

      if (isProductionRuntime()) {
        return NextResponse.json(
          { error: remoteError ?? "Celebration storage is not available." },
          { status: remoteError ? 500 : 503 },
        );
      }

      const celebration = await updateLocalCelebration(id, { name, comment, authorSessionId });

      if (!celebration) {
        return NextResponse.json({ error: "Celebration not found." }, { status: 404 });
      }

      return NextResponse.json({ celebration });
    }

    if (payload.action === "update_position") {
      const noteX = Number(payload.noteX);
      const noteY = Number(payload.noteY);
      const noteRotate = Number(payload.noteRotate);

      if (
        !Number.isFinite(noteX) ||
        !Number.isFinite(noteY) ||
        !Number.isFinite(noteRotate)
      ) {
        return NextResponse.json({ error: "Valid position is required." }, { status: 400 });
      }

      let remoteError: string | null = null;

      const remoteCelebration = await updateSupabaseCelebrationPosition(id, {
        noteX,
        noteY,
        noteRotate,
      }).catch((error) => {
        remoteError = getSupabaseErrorMessage(error);
        return null;
      });

      if (remoteCelebration) {
        return NextResponse.json({ celebration: remoteCelebration });
      }

      if (isProductionRuntime()) {
        return NextResponse.json(
          { error: remoteError ?? "Celebration storage is not available." },
          { status: remoteError ? 500 : 503 },
        );
      }

      const celebration = await updateLocalCelebrationPosition(id, {
        noteX,
        noteY,
        noteRotate,
      });

      if (!celebration) {
        return NextResponse.json({ error: "Celebration not found." }, { status: 404 });
      }

      return NextResponse.json({ celebration });
    }

    return NextResponse.json({ error: "Valid action is required." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Could not update celebration." },
      { status: 500 },
    );
  }
}
