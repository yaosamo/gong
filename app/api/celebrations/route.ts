import { NextResponse } from "next/server";
import {
  createLocalCelebration,
  deleteLocalCelebration,
  listLocalCelebrations,
} from "@/lib/store";
import { resolveLocationFromRequest } from "@/lib/geolocation";
import {
  createSupabaseCelebration,
  deleteSupabaseCelebration,
  listSupabaseCelebrations,
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
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";

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
