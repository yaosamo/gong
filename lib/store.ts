import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { buildLocationLabel } from "@/lib/utils";
import type { Celebration, CelebrationInput } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "celebrations.json");

type StoredCelebration = Omit<Celebration, "locationLabel">;

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, "[]", "utf8");
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

export async function listLocalCelebrations() {
  const items = await readCelebrations();
  return items
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((item) => ({
      ...item,
      locationLabel: buildLocationLabel(item),
    }));
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
