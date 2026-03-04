import { createClient } from "@supabase/supabase-js";
import { buildLocationLabel } from "@/lib/utils";
import type { Celebration, CelebrationInput, CelebrationPositionInput } from "@/lib/types";

type Row = {
  id: string | number;
  name: string;
  comment: string;
  created_at: string;
  reactions: number | null;
  author_session_id: string | null;
  note_x: number | null;
  note_y: number | null;
  note_rotate: number | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

function normalizeId(value: string) {
  return /^\d+$/.test(value) ? Number(value) : value;
}

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

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Unknown Supabase error";
}

function mapRow(row: Row): Celebration {
  return {
    id: String(row.id),
    name: row.name,
    comment: row.comment,
    createdAt: row.created_at,
    reactions: row.reactions ?? 0,
    authorSessionId: row.author_session_id,
    noteX: row.note_x,
    noteY: row.note_y,
    noteRotate: row.note_rotate,
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
    .select("id, name, comment, created_at, reactions, author_session_id, note_x, note_y, note_rotate, city, region, country")
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
      reactions: 0,
      author_session_id: input.authorSessionId,
      note_x: null,
      note_y: null,
      note_rotate: null,
      city: location.city,
      region: location.region,
      country: location.country,
    })
    .select("id, name, comment, created_at, reactions, author_session_id, note_x, note_y, note_rotate, city, region, country")
    .single();

  if (error) {
    throw error;
  }

  return mapRow(data as Row);
}

export async function deleteSupabaseCelebration(id: string, authorSessionId: string) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { error, count } = await client
    .from("celebrations")
    .delete({ count: "exact" })
    .eq("id", normalizeId(id))
    .eq("author_session_id", authorSessionId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

export async function updateSupabaseCelebration(id: string, input: CelebrationInput) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("celebrations")
    .update({
      name: input.name.trim(),
      comment: input.comment.trim(),
    })
    .eq("id", normalizeId(id))
    .eq("author_session_id", input.authorSessionId)
    .select("id, name, comment, created_at, reactions, author_session_id, note_x, note_y, note_rotate, city, region, country")
    .single();

  if (error) {
    throw error;
  }

  return mapRow(data as Row);
}

export async function incrementSupabaseCelebrationReaction(id: string) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { data: current, error: currentError } = await client
    .from("celebrations")
    .select("id, name, comment, created_at, reactions, author_session_id, note_x, note_y, note_rotate, city, region, country")
    .eq("id", normalizeId(id))
    .single();

  if (currentError) {
    throw currentError;
  }

  const nextReactions = (current.reactions ?? 0) + 1;

  const { data, error } = await client
    .from("celebrations")
    .update({ reactions: nextReactions })
    .eq("id", normalizeId(id))
    .select("id, name, comment, created_at, reactions, author_session_id, note_x, note_y, note_rotate, city, region, country")
    .single();

  if (error) {
    throw error;
  }

  return mapRow(data as Row);
}

export async function updateSupabaseCelebrationPosition(
  id: string,
  position: CelebrationPositionInput,
) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("celebrations")
    .update({
      note_x: position.noteX,
      note_y: position.noteY,
      note_rotate: position.noteRotate,
    })
    .eq("id", normalizeId(id))
    .select("id, name, comment, created_at, reactions, author_session_id, note_x, note_y, note_rotate, city, region, country")
    .single();

  if (error) {
    throw error;
  }

  return mapRow(data as Row);
}

export async function deleteAllSupabaseCelebrations() {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { error } = await client.from("celebrations").delete().not("id", "is", null);

  if (error) {
    throw error;
  }

  return true;
}

export { toErrorMessage as getSupabaseErrorMessage };
