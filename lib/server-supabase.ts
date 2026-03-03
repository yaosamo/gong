import { createClient } from "@supabase/supabase-js";
import { buildLocationLabel } from "@/lib/utils";
import type { Celebration, CelebrationInput } from "@/lib/types";

type Row = {
  id: string;
  name: string;
  comment: string;
  created_at: string;
  city: string | null;
  region: string | null;
  country: string | null;
};

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return null;
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
    },
  });
}

function mapRow(row: Row): Celebration {
  return {
    id: row.id,
    name: row.name,
    comment: row.comment,
    createdAt: row.created_at,
    city: row.city,
    region: row.region,
    country: row.country,
    locationLabel: buildLocationLabel(row),
  };
}

export async function listSupabaseCelebrations() {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("celebrations")
    .select("id, name, comment, created_at, city, region, country")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRow);
}

export async function createSupabaseCelebration(
  input: CelebrationInput,
  location: { city: string | null; region: string | null; country: string | null },
) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("celebrations")
    .insert({
      name: input.name.trim(),
      comment: input.comment.trim(),
      city: location.city,
      region: location.region,
      country: location.country,
    })
    .select("id, name, comment, created_at, city, region, country")
    .single();

  if (error) {
    throw error;
  }

  return mapRow(data as Row);
}
