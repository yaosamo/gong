import { NextResponse } from "next/server";
import { createLocalCelebration, listLocalCelebrations } from "@/lib/store";
import { resolveLocationFromRequest } from "@/lib/geolocation";
import {
  createSupabaseCelebration,
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
