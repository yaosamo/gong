import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { buildLocationLabel } from "@/lib/utils";
import type {
  Celebration,
  CelebrationInput,
  CelebrationPositionInput,
} from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "celebrations.json");
const reactionsPath = path.join(dataDir, "reactions.json");

type StoredCelebration = Omit<Celebration, "locationLabel">;

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, "[]", "utf8");
  }

  try {
    await readFile(reactionsPath, "utf8");
  } catch {
    await writeFile(reactionsPath, "{}", "utf8");
  }
}

async function readCelebrations() {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as StoredCelebration[];
  return parsed;
}

async function writeCelebrations(items: StoredCelebration[]) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(items, null, 2), "utf8");
}

async function readReactions() {
  await ensureStore();
  const raw = await readFile(reactionsPath, "utf8");
  return JSON.parse(raw) as Record<string, number>;
}

async function writeReactions(items: Record<string, number>) {
  await ensureStore();
  await writeFile(reactionsPath, JSON.stringify(items, null, 2), "utf8");
}

function applyReactionCounts(items: StoredCelebration[], reactionCounts: Record<string, number>) {
  return items.map((item) => ({
    ...item,
    reactions: reactionCounts[item.id] ?? item.reactions ?? 0,
    locationLabel: buildLocationLabel(item),
  }));
}

export async function listLocalCelebrations() {
  const items = await readCelebrations();
  const reactions = await readReactions();
  return applyReactionCounts(
    items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    reactions,
  );
}

export async function createLocalCelebration(
  input: CelebrationInput,
  location: { city: string | null; region: string | null; country: string | null },
) {
  const items = await readCelebrations();

  const created: StoredCelebration = {
    id: randomUUID(),
    name: input.name.trim(),
    comment: input.comment.trim(),
    createdAt: new Date().toISOString(),
    reactions: 0,
    noteX: null,
    noteY: null,
    noteRotate: null,
    city: location.city,
    region: location.region,
    country: location.country,
  };

  await writeCelebrations([created, ...items].slice(0, 300));

  return {
    ...created,
    locationLabel: buildLocationLabel(created),
  } satisfies Celebration;
}

export async function deleteLocalCelebration(id: string) {
  const items = await readCelebrations();
  const reactions = await readReactions();
  const nextItems = items.filter((item) => item.id !== id);
  const deleted = nextItems.length !== items.length;

  if (deleted) {
    await writeCelebrations(nextItems);
    delete reactions[id];
    await writeReactions(reactions);
  }

  return deleted;
}

export async function incrementLocalCelebrationReaction(id: string) {
  const items = await readCelebrations();

  if (!items.some((item) => item.id === id)) {
    return null;
  }

  const reactions = await readReactions();
  const nextCount = (reactions[id] ?? 0) + 1;
  reactions[id] = nextCount;
  await writeReactions(reactions);

  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return null;
  }

  return {
    ...item,
    reactions: nextCount,
    locationLabel: buildLocationLabel(item),
  } satisfies Celebration;
}

export async function updateLocalCelebration(id: string, input: CelebrationInput) {
  const items = await readCelebrations();
  const reactions = await readReactions();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = items[index];

  if (!current) {
    return null;
  }

  const updated: StoredCelebration = {
    ...current,
    name: input.name.trim(),
    comment: input.comment.trim(),
  };

  const nextItems = [...items];
  nextItems[index] = updated;
  await writeCelebrations(nextItems);

  return {
    ...updated,
    reactions: reactions[id] ?? updated.reactions ?? 0,
    locationLabel: buildLocationLabel(updated),
  } satisfies Celebration;
}

export async function updateLocalCelebrationPosition(
  id: string,
  position: CelebrationPositionInput,
) {
  const items = await readCelebrations();
  const reactions = await readReactions();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = items[index];

  if (!current) {
    return null;
  }

  const updated: StoredCelebration = {
    ...current,
    noteX: position.noteX,
    noteY: position.noteY,
    noteRotate: position.noteRotate,
  };

  const nextItems = [...items];
  nextItems[index] = updated;
  await writeCelebrations(nextItems);

  return {
    ...updated,
    reactions: reactions[id] ?? updated.reactions ?? 0,
    locationLabel: buildLocationLabel(updated),
  } satisfies Celebration;
}

export async function deleteAllLocalCelebrations() {
  await writeCelebrations([]);
  await writeReactions({});
  return true;
}
