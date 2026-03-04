import { NextResponse } from "next/server";
import {
  createLocalCelebration,
  deleteAllLocalCelebrations,
  deleteLocalCelebration,
  incrementLocalCelebrationReaction,
  listLocalCelebrations,
  updateLocalCelebration,
} from "@/lib/store";
import { resolveLocationFromRequest } from "@/lib/geolocation";
import {
  createSupabaseCelebration,
  deleteAllSupabaseCelebrations,
  deleteSupabaseCelebration,
  listSupabaseCelebrations,
  updateSupabaseCelebration,
} from "@/lib/server-supabase";

export async function GET() {
  const remoteItems = await listSupabaseCelebrations().catch(() => null);
  const items = remoteItems ?? (await listLocalCelebrations());
  return NextResponse.json({ celebrations: items });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    name?: string;
    comment?: string;
  };

  const name = payload.name?.trim() ?? "";
  const comment = payload.comment?.trim() ?? "";

  if (!name || !comment) {
    return NextResponse.json(
      { error: "Name and comment are required." },
      { status: 400 },
    );
  }

  const location = await resolveLocationFromRequest(request);

  const celebration =
    (await createSupabaseCelebration(
      { name, comment },
      {
        city: location.city,
        region: location.region,
        country: location.country,
      },
    ).catch(() => null)) ??
    (await createLocalCelebration(
      { name, comment },
      {
        city: location.city,
        region: location.region,
        country: location.country,
      },
    ));

  return NextResponse.json({ celebration }, { status: 201 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const clearAll = url.searchParams.get("all")?.trim() === "1";
  const id = url.searchParams.get("id")?.trim() ?? "";

  if (clearAll) {
    await (
      deleteAllSupabaseCelebrations().catch(() => null) ?? deleteAllLocalCelebrations()
    );

    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Celebration id is required." }, { status: 400 });
  }

  const deleted =
    (await deleteSupabaseCelebration(id).catch(() => null)) ?? (await deleteLocalCelebration(id));

  if (!deleted) {
    return NextResponse.json({ error: "Celebration not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
    action?: string;
    name?: string;
    comment?: string;
  };

  const id = payload.id?.trim() ?? "";

  if (!id) {
    return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
  }

  if (payload.action === "react") {
    const celebration = await incrementLocalCelebrationReaction(id);

    if (!celebration) {
      return NextResponse.json({ error: "Celebration not found." }, { status: 404 });
    }

    return NextResponse.json({ celebration });
  }

  if (payload.action === "update") {
    const name = payload.name?.trim() ?? "";
    const comment = payload.comment?.trim() ?? "";

    if (!name || !comment) {
      return NextResponse.json(
        { error: "Name and comment are required." },
        { status: 400 },
      );
    }

    const celebration =
      (await updateSupabaseCelebration(id, { name, comment }).catch(() => null)) ??
      (await updateLocalCelebration(id, { name, comment }));

    if (!celebration) {
      return NextResponse.json({ error: "Celebration not found." }, { status: 404 });
    }

    return NextResponse.json({ celebration });
  }

  return NextResponse.json({ error: "Valid action is required." }, { status: 400 });
}
