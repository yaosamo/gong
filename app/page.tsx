"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { CelebrationLog } from "@/components/celebration-log";
import { SceneControls } from "@/components/debug/scene-controls";
import { GongScene } from "@/components/gong-scene";
import { LiveCursors } from "@/components/live-cursors";
import {
  DEFAULT_CAMERA_POSITION,
  INITIAL_CONFETTI_SETTINGS,
  INITIAL_LIGHT_SETTINGS,
  type ConfettiSettings,
  type LightSettings,
} from "@/lib/scene-config";
import type { Celebration, CelebrationInput } from "@/lib/types";
import { formatCelebrationDate } from "@/lib/utils";

type SampleRecord = {
  id: string;
  location: string;
  reactions: number;
  comment?: string;
  author?: string;
};

type FloatingRecord = {
  id: string;
  title: string;
  comment?: string;
  author?: string;
  emoji: string;
  reactions: number;
  isPersisted?: boolean;
  isActive?: boolean;
};

type DragPosition = {
  x: number;
  y: number;
};

type SettledPosition = {
  x: number;
  y: number;
  rotate: number;
};

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
} | null;

type RecordTheme = {
  card: string;
  border: string;
  bubble: string;
  text: string;
  muted: string;
  accent: string;
  shadow: string;
};

const recordEmojis = ["🎉", "🍬", "🧃", "✨", "🍡", "🍭", "🌼", "🍓"];
const recordThemes: RecordTheme[] = [
  {
    card: "#fff4db",
    border: "rgba(221, 172, 72, 0.28)",
    bubble: "#fff9eb",
    text: "#5f4820",
    muted: "rgba(95, 72, 32, 0.62)",
    accent: "#c27a1d",
    shadow: "0 10px 24px rgba(221, 172, 72, 0.14)",
  },
  {
    card: "#ffe6ef",
    border: "rgba(222, 124, 162, 0.26)",
    bubble: "#fff1f6",
    text: "#6e344c",
    muted: "rgba(110, 52, 76, 0.6)",
    accent: "#cf5d8e",
    shadow: "0 10px 24px rgba(222, 124, 162, 0.14)",
  },
  {
    card: "#e8f7ee",
    border: "rgba(104, 171, 122, 0.26)",
    bubble: "#f3fbf6",
    text: "#2f5a3a",
    muted: "rgba(47, 90, 58, 0.58)",
    accent: "#4c9a67",
    shadow: "0 10px 24px rgba(104, 171, 122, 0.14)",
  },
  {
    card: "#e9f2ff",
    border: "rgba(101, 142, 209, 0.24)",
    bubble: "#f4f8ff",
    text: "#304c74",
    muted: "rgba(48, 76, 116, 0.58)",
    accent: "#4c76c3",
    shadow: "0 10px 24px rgba(101, 142, 209, 0.14)",
  },
  {
    card: "#f6ebff",
    border: "rgba(165, 126, 210, 0.24)",
    bubble: "#fbf5ff",
    text: "#5d4377",
    muted: "rgba(93, 67, 119, 0.58)",
    accent: "#8d62bf",
    shadow: "0 10px 24px rgba(165, 126, 210, 0.14)",
  },
];
const recordLeads = [
  "Cool bean",
  "Sweet legend",
  "Joy goblin",
  "Happy camper",
  "Party wizard",
  "Bright soul",
  "Good egg",
  "Shiny human",
  "Sparkle gremlin",
  "Cheer machine",
  "Delight unit",
  "Tiny hero",
  "Lucky noodle",
  "Magic pal",
  "Sunny rascal",
  "Confetti captain",
  "Fresh icon",
  "Cosmic buddy",
  "Golden menace",
  "Peach champion",
] as const;

const sampleRecords: SampleRecord[] = [
  {
    id: "sample-1",
    location: "Oregon",
    reactions: 4,
  },
  {
    id: "sample-2",
    location: "Portland",
    reactions: 18,
    comment: "I just launched gong web app! gong.yaosamo.com",
    author: "Yaroslav",
  },
  {
    id: "sample-3",
    location: "Bend",
    reactions: 2,
    comment: "Wrapped a project that was dragging for weeks.",
    author: "Avery",
  },
  {
    id: "sample-4",
    location: "Seattle",
    reactions: 7,
  },
  {
    id: "sample-5",
    location: "Eugene",
    reactions: 5,
    comment: "Closed three loose threads and finally got a quiet evening.",
    author: "Nina",
  },
  {
    id: "sample-6",
    location: "Tokyo",
    reactions: 11,
  },
  {
    id: "sample-7",
    location: "Los Angeles",
    reactions: 9,
    comment: "Sent the deck, stopped overthinking, and called it done.",
    author: "Maya",
  },
  {
    id: "sample-8",
    location: "Oregon",
    reactions: 14,
  },
  {
    id: "sample-9",
    location: "Vancouver",
    reactions: 6,
    comment: "Got the feature stable on mobile and it finally feels solid.",
    author: "Theo",
  },
  {
    id: "sample-10",
    location: "Kyoto",
    reactions: 8,
  },
];

function hashString(value: string) {
  return value.split("").reduce((accumulator, char) => accumulator * 31 + char.charCodeAt(0), 7);
}

function getRecordEmoji(key: string) {
  return recordEmojis[Math.abs(hashString(key)) % recordEmojis.length] ?? "🎉";
}

function getRecordLead(key: string) {
  return recordLeads[Math.abs(hashString(`${key}-lead`)) % recordLeads.length] ?? "Cool bean";
}

function getRecordTheme(key: string) {
  return recordThemes[Math.abs(hashString(`${key}-theme`)) % recordThemes.length] ?? recordThemes[0];
}

const fallbackRecordId = "fallback-active";

function layoutFloatingRecords(records: FloatingRecord[]) {
  const anchors = [
    { x: 10, y: 15 },
    { x: 13, y: 82 },
    { x: 28, y: 10 },
    { x: 36, y: 86 },
    { x: 49, y: 13 },
    { x: 50, y: 82 },
    { x: 63, y: 18 },
    { x: 78, y: 24 },
    { x: 70, y: 44 },
    { x: 83, y: 56 },
    { x: 68, y: 75 },
    { x: 84, y: 84 },
    { x: 58, y: 62 },
    { x: 41, y: 92 },
    { x: 22, y: 90 },
    { x: 57, y: 32 },
  ];
  const occupied: Array<{ x: number; y: number; width: number; height: number }> = [];

  return records.map((record, index) => {
    const seed = Math.abs(hashString(record.id));
    const startIndex = seed % anchors.length;
    const width = record.comment ? 28 : 22;
    const height = record.comment ? (record.isActive ? 20 : 11) : record.isActive ? 16 : 8;

    let x = 62;
    let y = 20;

    for (let attempt = 0; attempt < anchors.length; attempt += 1) {
      const anchor = anchors[(startIndex + attempt) % anchors.length] ?? anchors[0];
      const jitterX = ((seed + attempt * 17) % 7) - 3;
      const jitterY = ((seed + attempt * 11) % 5) - 2;
      const nextX = anchor.x + jitterX;
      const nextY = anchor.y + jitterY;
      const overlaps = occupied.some(
        (box) =>
          Math.abs(box.x - nextX) < (box.width + width) * 0.5 &&
          Math.abs(box.y - nextY) < (box.height + height) * 0.5,
      );

      if (!overlaps) {
        x = nextX;
        y = nextY;
        break;
      }
    }

    occupied.push({ x, y, width, height });

    return {
      ...record,
      x,
      y,
      rotate: ((seed + index * 5) % 5) - 2,
    };
  });
}

export default function HomePage() {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [selectedCelebration, setSelectedCelebration] = useState<Celebration | null>(null);
  const [sessionHitCounts, setSessionHitCounts] = useState<Record<string, number>>({});
  const [sessionFallbackHits, setSessionFallbackHits] = useState(0);
  const [isInlineFormOpen, setIsInlineFormOpen] = useState(false);
  const [inlineName, setInlineName] = useState("");
  const [inlineComment, setInlineComment] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [hasRung, setHasRung] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showSampleRecords, setShowSampleRecords] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [cameraPosition, setCameraPosition] = useState(DEFAULT_CAMERA_POSITION);
  const [lightSettings, setLightSettings] = useState(INITIAL_LIGHT_SETTINGS);
  const [confettiSettings, setConfettiSettings] = useState(INITIAL_CONFETTI_SETTINGS);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [copyConfettiStatus, setCopyConfettiStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [headlineEntered, setHeadlineEntered] = useState(false);
  const [ambientConfettiEnabled, setAmbientConfettiEnabled] = useState(false);
  const [sampleReactionCounts, setSampleReactionCounts] = useState<Record<string, number>>({});
  const [reactedRecordIds, setReactedRecordIds] = useState<string[]>([]);
  const [hoveredReactionId, setHoveredReactionId] = useState<string | null>(null);
  const [draggingRecordId, setDraggingRecordId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSubmittingInline, startInlineSubmit] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dragPositions, setDragPositions] = useState<Record<string, DragPosition>>({});
  const [settledPositions, setSettledPositions] = useState<Record<string, SettledPosition>>({});
  const dragStateRef = useRef<DragState>(null);
  const gongAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const headlineTimeoutId = window.setTimeout(() => {
      setHeadlineEntered(true);
    }, 1000);
    const confettiTimeoutId = window.setTimeout(() => {
      setAmbientConfettiEnabled(true);
    }, 1000);

    return () => {
      window.clearTimeout(headlineTimeoutId);
      window.clearTimeout(confettiTimeoutId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCelebrations() {
      const response = await fetch("/api/celebrations", { cache: "no-store" });
      const data = (await response.json()) as { celebrations: Celebration[] };

      if (!cancelled) {
        setCelebrations(data.celebrations);
      }
    }

    loadCelebrations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem("gong-session-hit-counts");
      const storedFallbackHits = window.sessionStorage.getItem("gong-session-fallback-hits");
      const storedDragPositions = window.sessionStorage.getItem("gong-drag-positions");
      const storedReactedRecordIds = window.sessionStorage.getItem("gong-reacted-record-ids");
      const storedSettledPositions = window.sessionStorage.getItem("gong-settled-record-positions");

      if (stored) {
        setSessionHitCounts(JSON.parse(stored) as Record<string, number>);
      }

      if (storedFallbackHits) {
        setSessionFallbackHits(Number(storedFallbackHits) || 0);
      }

      if (storedDragPositions) {
        setDragPositions(JSON.parse(storedDragPositions) as Record<string, DragPosition>);
      }

      if (storedReactedRecordIds) {
        setReactedRecordIds(JSON.parse(storedReactedRecordIds) as string[]);
      }

      if (storedSettledPositions) {
        setSettledPositions(JSON.parse(storedSettledPositions) as Record<string, SettledPosition>);
      }
    } catch {
      setSessionHitCounts({});
      setSessionFallbackHits(0);
      setDragPositions({});
      setReactedRecordIds([]);
      setSettledPositions({});
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("gong-session-hit-counts", JSON.stringify(sessionHitCounts));
    } catch {
      return;
    }
  }, [sessionHitCounts]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("gong-session-fallback-hits", String(sessionFallbackHits));
    } catch {
      return;
    }
  }, [sessionFallbackHits]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("gong-drag-positions", JSON.stringify(dragPositions));
    } catch {
      return;
    }
  }, [dragPositions]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("gong-reacted-record-ids", JSON.stringify(reactedRecordIds));
    } catch {
      return;
    }
  }, [reactedRecordIds]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        "gong-settled-record-positions",
        JSON.stringify(settledPositions),
      );
    } catch {
      return;
    }
  }, [settledPositions]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowControls((current) => {
          const next = !current;
          if (!next) {
            setIsLogOpen(false);
          }
          return next;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const audio = new Audio("/gongHit.mp3");
    audio.preload = "auto";
    audio.volume = 0.85;
    gongAudioRef.current = audio;

    return () => {
      audio.pause();
      gongAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gongAudioRef.current) {
      gongAudioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      setDragPositions((current) => ({
        ...current,
        [dragState.id]: {
          x: event.clientX - dragState.offsetX,
          y: event.clientY - dragState.offsetY,
        },
      }));
    }

    function onPointerUp() {
      dragStateRef.current = null;
      setDraggingRecordId(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  function strike() {
    if (!isMuted && gongAudioRef.current) {
      gongAudioRef.current.currentTime = 0;
      void gongAudioRef.current.play().catch(() => {});
    }

    const nextCelebration =
      selectedCelebration ??
      (() => {
        const pool = celebrations;
        const index = Math.floor(Math.random() * pool.length);
        return pool[index] ?? null;
      })();

    if (!nextCelebration) {
      setSessionFallbackHits((current) => current + 1);
      setHasRung(true);
      setIsStriking(true);
      window.setTimeout(() => setIsStriking(false), 850);
      return;
    }

    setSelectedCelebration(nextCelebration);
    setSessionHitCounts((current) => ({
      ...current,
      [nextCelebration.id]: (current[nextCelebration.id] ?? 0) + 1,
    }));
    setHasRung(true);
    setIsStriking(true);
    window.setTimeout(() => setIsStriking(false), 850);
  }

  function getCelebrationLocationLabel(celebration: Celebration) {
    return celebration.region || celebration.city || celebration.country || "Oregon";
  }

  function getHitCountLabel(celebration: Celebration) {
    const count = sessionHitCounts[celebration.id] ?? 0;
    const suffix = count === 1 ? "time" : "times";

    return `${count} ${suffix}`;
  }

  function getActiveHitCount() {
    if (selectedCelebration) {
      return sessionHitCounts[selectedCelebration.id] ?? 0;
    }

    if (!hasRung) {
      return 0;
    }

    return sessionFallbackHits > 0 ? sessionFallbackHits : 1;
  }

  function formatGongHits(count: number) {
    return `${count} gong ${count === 1 ? "hit" : "hits"}`;
  }

  function formatCelebrationTitle(location: string, key: string) {
    return `${getRecordLead(key)} in ${location} celebrating!`;
  }

  function getReactionEmojiSize(reactions: number) {
    return Math.min(46, 18 + reactions * 2);
  }

  function getActiveCelebrationLine() {
    if (selectedCelebration) {
      return {
        title: formatCelebrationTitle(
          getCelebrationLocationLabel(selectedCelebration),
          selectedCelebration.id,
        ),
        date: formatCelebrationDate(selectedCelebration.createdAt),
      };
    }

    if (!hasRung) {
      return null;
    }

    const fallbackCount = sessionFallbackHits > 0 ? sessionFallbackHits : 1;
    const suffix = fallbackCount === 1 ? "time" : "times";

    return {
      title: formatCelebrationTitle("Oregon", fallbackRecordId),
      date: formatCelebrationDate(new Date().toISOString()),
    };
  }

  const activeCelebrationLine = getActiveCelebrationLine();
  const activeRecordEmoji = getRecordEmoji(selectedCelebration?.id ?? fallbackRecordId);
  const floatingRecords = layoutFloatingRecords([
    ...(activeCelebrationLine
      ? [
          {
            id: selectedCelebration?.id ?? fallbackRecordId,
            title: activeCelebrationLine.title,
            comment: selectedCelebration?.comment,
            author: selectedCelebration?.name,
            emoji: activeRecordEmoji,
            reactions: selectedCelebration?.reactions ?? 0,
            isPersisted: Boolean(selectedCelebration),
            isActive: true,
          } satisfies FloatingRecord,
        ]
      : []),
    ...celebrations
      .filter((celebration) => celebration.id !== selectedCelebration?.id)
      .slice(0, 12)
      .map(
        (celebration) =>
          ({
            id: celebration.id,
            title: formatCelebrationTitle(getCelebrationLocationLabel(celebration), celebration.id),
            comment: celebration.comment,
            author: celebration.name,
            emoji: getRecordEmoji(celebration.id),
            reactions: celebration.reactions,
            isPersisted: true,
          }) satisfies FloatingRecord,
      ),
    ...(showSampleRecords
      ? sampleRecords.map(
          (record) =>
          ({
            id: record.id,
              title: formatCelebrationTitle(record.location, record.id),
              comment: record.comment,
              author: record.author,
              emoji: getRecordEmoji(record.id),
              reactions: sampleReactionCounts[record.id] ?? record.reactions,
            }) satisfies FloatingRecord,
        )
      : []),
  ]);

  useEffect(() => {
    if (!floatingRecords.length) {
      return;
    }

    setSettledPositions((current) => {
      let changed = false;
      const next = { ...current };

      for (const record of floatingRecords) {
        if (!next[record.id]) {
          next[record.id] = {
            x: record.x,
            y: record.y,
            rotate: record.rotate,
          };
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [floatingRecords]);

  function openInlineForm() {
    setInlineError("");
    setDeleteError("");
    setInlineName(selectedCelebration?.name ?? "");
    setInlineComment(selectedCelebration?.comment ?? "");
    setIsInlineFormOpen(true);
  }

  function closeInlineForm() {
    setInlineError("");
    setDeleteError("");
    setIsInlineFormOpen(false);
    setInlineName("");
    setInlineComment("");
  }

  function submitInlineComment() {
    const payload: CelebrationInput = {
      name: inlineName.trim(),
      comment: inlineComment.trim(),
    };

    if (!payload.name || !payload.comment) {
      setInlineError("Both fields are required.");
      return;
    }

    startInlineSubmit(async () => {
      const response = await fetch("/api/celebrations", {
        method: selectedCelebration ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          selectedCelebration
            ? {
                id: selectedCelebration.id,
                action: "update",
                ...payload,
              }
            : payload,
        ),
      });

      if (!response.ok) {
        setInlineError("Could not save celebration.");
        return;
      }

      const data = (await response.json()) as { celebration: Celebration };
      setCelebrations((current) =>
        selectedCelebration
          ? current.map((celebration) =>
              celebration.id === data.celebration.id ? data.celebration : celebration,
            )
          : [data.celebration, ...current].sort(
              (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
            ),
      );
      setSelectedCelebration(data.celebration);
      setSessionHitCounts((current) => ({
        ...current,
        [data.celebration.id]: current[data.celebration.id] ?? 1,
      }));
      setHasRung(true);
      closeInlineForm();
    });
  }

  function deleteSelectedCelebration() {
    if (!selectedCelebration) {
      return;
    }

    setDeleteError("");

    startDeleteTransition(async () => {
      const response = await fetch(
        `/api/celebrations?id=${encodeURIComponent(selectedCelebration.id)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        setDeleteError("Could not delete celebration.");
        return;
      }

      setCelebrations((current) => current.filter((item) => item.id !== selectedCelebration.id));
      setSessionHitCounts((current) => {
        const next = { ...current };
        delete next[selectedCelebration.id];
        return next;
      });
      setSelectedCelebration(null);
      setIsInlineFormOpen(false);
      setInlineError("");
      setInlineName("");
      setInlineComment("");
    });
  }

  function reactToRecord(record: FloatingRecord) {
    if (reactedRecordIds.includes(record.id)) {
      return;
    }

    setReactedRecordIds((current) => [...current, record.id]);

    if (!record.isPersisted) {
      setSampleReactionCounts((current) => ({
        ...current,
        [record.id]: (current[record.id] ?? record.reactions) + 1,
      }));
      return;
    }

    void (async () => {
      const response = await fetch("/api/celebrations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: record.id,
          action: "react",
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { celebration: Celebration };
      setCelebrations((current) =>
        current.map((celebration) =>
          celebration.id === data.celebration.id
            ? { ...celebration, reactions: data.celebration.reactions }
            : celebration,
        ),
      );
      setSelectedCelebration((current) =>
        current?.id === data.celebration.id
          ? { ...current, reactions: data.celebration.reactions }
          : current,
      );
    })();
  }

  function startDraggingRecord(recordId: string, event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;

    if (target?.closest("button, input, textarea")) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      id: recordId,
      offsetX: event.clientX - (rect.left + rect.width / 2),
      offsetY: event.clientY - (rect.top + rect.height / 2),
    };
    setDraggingRecordId(recordId);
  }

  function updateLightSetting<K extends keyof LightSettings>(key: K, value: number) {
    setLightSettings((current) => ({ ...current, [key]: value }));
  }

  function updateConfettiSetting<K extends keyof ConfettiSettings>(key: K, value: number) {
    setConfettiSettings((current) => ({ ...current, [key]: value }));
  }

  async function copySceneSettings() {
    const payload = JSON.stringify(
      {
        camera: cameraPosition,
        lights: lightSettings,
        confetti: confettiSettings,
      },
      null,
      2,
    );

    try {
      await navigator.clipboard.writeText(payload);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("failed");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    }
  }

  async function copyConfettiSettings() {
    const payload = JSON.stringify(confettiSettings, null, 2);

    try {
      await navigator.clipboard.writeText(payload);
      setCopyConfettiStatus("copied");
      window.setTimeout(() => setCopyConfettiStatus("idle"), 1800);
    } catch {
      setCopyConfettiStatus("failed");
      window.setTimeout(() => setCopyConfettiStatus("idle"), 1800);
    }
  }

  async function deleteAllCelebrations() {
    const response = await fetch("/api/celebrations?all=1", {
      method: "DELETE",
    });

    if (!response.ok) {
      return;
    }

    setCelebrations([]);
    setSelectedCelebration(null);
    setSessionHitCounts({});
    setSessionFallbackHits(0);
    setReactedRecordIds([]);
    setDragPositions({});
    setSettledPositions({});
    setSampleReactionCounts({});
    setIsInlineFormOpen(false);
    setInlineError("");
    setDeleteError("");
    setInlineName("");
    setInlineComment("");
  }

  return (
    <main
      style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        padding: 0,
      }}
    >
      <LiveCursors />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 52%, rgba(214, 176, 91, 0.16), transparent 18%), radial-gradient(circle at 50% 16%, rgba(255, 255, 255, 0.28), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(244,240,230,0.08) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(255, 255, 255, 0.26) 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {showControls ? (
        <SceneControls
          cameraPosition={cameraPosition}
          lightSettings={lightSettings}
          confettiSettings={confettiSettings}
          showSampleRecords={showSampleRecords}
          copyStatus={copyStatus}
          copyConfettiStatus={copyConfettiStatus}
          onOpenLog={() => setIsLogOpen(true)}
          onToggleSampleRecords={() => setShowSampleRecords((current) => !current)}
          onCopySceneSettings={copySceneSettings}
          onCopyConfettiSettings={copyConfettiSettings}
          onUpdateLightSetting={updateLightSetting}
          onUpdateConfettiSetting={updateConfettiSetting}
        />
      ) : null}

      <section
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          width: "100vw",
          height: "100vh",
        }}
      >
        <GongScene
          isStriking={isStriking}
          onStrike={strike}
          onCameraChange={setCameraPosition}
          ambientConfettiEnabled={ambientConfettiEnabled}
          lightSettings={lightSettings}
          confettiSettings={confettiSettings}
        />
      </section>

      <div
        style={{
          position: "absolute",
          top: "50%",
          right: 48,
          transform: "translateY(-60%)",
          zIndex: 12,
          width: "min(520px, 42vw)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            textAlign: "left",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: headlineEntered ? "translateX(0)" : "translateX(300px)",
              opacity: headlineEntered ? 1 : 0,
              transition:
                "transform 1000ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1000ms ease-out",
              willChange: "transform, opacity",
              fontSize: "clamp(44px, 7vw, 108px)",
              lineHeight: 0.9,
              letterSpacing: "-0.06em",
              fontWeight: 500,
              color: "rgba(17, 17, 17, 0.94)",
              textWrap: "balance",
            }}
          >
            Gong to celebrate!
          </div>
        </div>
      </div>

      {hasRung && showNotes ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 12,
            pointerEvents: "none",
          }}
        >
          {floatingRecords.map((record) => (
            (() => {
              const settled = settledPositions[record.id];
              const left = dragPositions[record.id]?.x ?? `${(settled?.x ?? record.x)}%`;
              const top = dragPositions[record.id]?.y ?? `${(settled?.y ?? record.y)}%`;
              const rotate = settled?.rotate ?? record.rotate;
              const theme = getRecordTheme(record.id);

              return (
            <div
              key={record.id}
              data-record-id={record.id}
              onPointerDown={(event) => startDraggingRecord(record.id, event)}
              style={{
                position: "absolute",
                left,
                top,
                transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
                maxWidth: record.comment ? "min(360px, 34vw)" : "min(260px, 24vw)",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                background: theme.card,
                boxShadow: theme.shadow,
                pointerEvents: "auto",
                cursor: draggingRecordId === record.id ? "grabbing" : "grab",
                userSelect: "none",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  fontSize: getReactionEmojiSize(record.reactions),
                  lineHeight: 1,
                  transform: "translateY(0.18em)",
                  flexShrink: 0,
                  transition: "font-size 220ms cubic-bezier(0.2, 0.9, 0.2, 1)",
                }}
              >
                {record.emoji}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                {record.comment ? (
                  <div
                    style={{
                      maxWidth: "100%",
                      padding: "7px 14px",
                      borderRadius: 16,
                      border: `1px solid ${theme.border}`,
                      background: theme.bubble,
                      boxShadow: "0 1px 0 rgba(255, 255, 255, 0.42) inset",
                      fontSize: 16,
                      lineHeight: 1.25,
                      color: theme.text,
                      textWrap: "pretty",
                    }}
                  >
                    <span style={{ fontStyle: "italic" }}>{record.comment}</span>
                    {record.author ? (
                      <>
                        <span style={{ color: theme.muted }}> - </span>
                        <span style={{ fontWeight: 600 }}>{record.author}</span>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 16,
                      lineHeight: 1.28,
                      fontWeight: 400,
                      color: theme.text,
                      textWrap: "pretty",
                    }}
                    >
                      {record.title}
                    </div>
                )}
                {!record.isActive ? (
                  <button
                    onClick={() => reactToRecord(record)}
                    onMouseEnter={() => setHoveredReactionId(record.id)}
                    onMouseLeave={() =>
                      setHoveredReactionId((current) => (current === record.id ? null : current))
                    }
                    disabled={reactedRecordIds.includes(record.id)}
                    type="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      fontSize: 14,
                      color:
                        hoveredReactionId === record.id
                          ? theme.accent
                          : reactedRecordIds.includes(record.id)
                            ? theme.accent
                            : theme.muted,
                      pointerEvents: "auto",
                      cursor: reactedRecordIds.includes(record.id) ? "default" : "pointer",
                      transform:
                        hoveredReactionId === record.id && !reactedRecordIds.includes(record.id)
                          ? "scale(1.08)"
                          : "scale(1)",
                      transformOrigin: "left center",
                      transition:
                        "color 160ms ease, transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1)",
                      opacity: reactedRecordIds.includes(record.id) ? 0.9 : 1,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        transform: hoveredReactionId === record.id ? "translateY(-1px)" : "translateY(0)",
                        transition: "transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1)",
                      }}
                    >
                      ❤
                    </span>
                    <span>{record.reactions}</span>
                  </button>
                ) : null}
                {record.isActive ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => reactToRecord(record)}
                        onMouseEnter={() => setHoveredReactionId(record.id)}
                        onMouseLeave={() =>
                          setHoveredReactionId((current) => (current === record.id ? null : current))
                        }
                        disabled={reactedRecordIds.includes(record.id)}
                        type="button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          fontSize: 14,
                          color:
                            hoveredReactionId === record.id
                              ? theme.accent
                              : reactedRecordIds.includes(record.id)
                                ? theme.accent
                                : theme.muted,
                          pointerEvents: "auto",
                          cursor: reactedRecordIds.includes(record.id) ? "default" : "pointer",
                          transform:
                            hoveredReactionId === record.id && !reactedRecordIds.includes(record.id)
                              ? "scale(1.08)"
                              : "scale(1)",
                          transformOrigin: "left center",
                          transition:
                            "color 160ms ease, transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1)",
                          opacity: reactedRecordIds.includes(record.id) ? 0.9 : 1,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            transform:
                              hoveredReactionId === record.id ? "translateY(-1px)" : "translateY(0)",
                            transition: "transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1)",
                          }}
                        >
                          ❤
                        </span>
                        <span>{record.reactions}</span>
                      </button>
                      <button
                        onClick={openInlineForm}
                        type="button"
                        style={{
                          padding: 0,
                          border: "none",
                        background: "transparent",
                        fontSize: 15,
                        color: theme.accent,
                        textDecoration: "underline",
                        textUnderlineOffset: "0.18em",
                        pointerEvents: "auto",
                          cursor: "pointer",
                        }}
                      >
                        {selectedCelebration ? "edit" : "add comment"}
                      </button>
                      {selectedCelebration ? (
                        <button
                          onClick={deleteSelectedCelebration}
                          disabled={isDeleting}
                          type="button"
                          style={{
                            padding: 0,
                            border: "none",
                            background: "transparent",
                            fontSize: 15,
                            color: theme.accent,
                            textDecoration: "underline",
                            textUnderlineOffset: "0.18em",
                            pointerEvents: "auto",
                            cursor: "pointer",
                          }}
                        >
                          {isDeleting ? "deleting..." : "delete"}
                        </button>
                      ) : null}
                    </div>
                    {deleteError ? (
                      <div style={{ fontSize: 13, color: "#9a3412" }}>{deleteError}</div>
                    ) : null}
                    {isInlineFormOpen ? (
                      <div
                        style={{
                          marginTop: 8,
                          width: "min(360px, 100%)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          pointerEvents: "auto",
                        }}
                      >
                        <input
                          value={inlineName}
                          onChange={(event) => setInlineName(event.target.value)}
                          maxLength={48}
                          placeholder="Your name"
                          style={{
                            border: "1px solid rgba(16, 17, 18, 0.16)",
                            borderRadius: 14,
                            background: "rgba(255, 255, 255, 0.8)",
                            padding: "12px 14px",
                            fontSize: 14,
                            color: "rgba(17, 17, 17, 0.92)",
                          }}
                        />
                        <textarea
                          value={inlineComment}
                          onChange={(event) => setInlineComment(event.target.value)}
                          maxLength={220}
                          placeholder="What are you celebrating today?"
                          rows={3}
                          style={{
                            border: "1px solid rgba(16, 17, 18, 0.16)",
                            borderRadius: 14,
                            background: "rgba(255, 255, 255, 0.8)",
                            padding: "12px 14px",
                            fontSize: 14,
                            lineHeight: 1.4,
                            color: "rgba(17, 17, 17, 0.92)",
                            resize: "vertical",
                          }}
                        />
                        {inlineError ? (
                          <div style={{ fontSize: 13, color: "#9a3412" }}>{inlineError}</div>
                        ) : null}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <button
                            onClick={submitInlineComment}
                            disabled={isSubmittingInline}
                            type="button"
                            style={{
                              padding: "10px 14px",
                              border: "none",
                              borderRadius: 999,
                              background: "#111111",
                              color: "#ffffff",
                              fontSize: 14,
                              cursor: "pointer",
                            }}
                          >
                            {isSubmittingInline ? "Submitting..." : "Submit"}
                          </button>
                          <button
                            onClick={closeInlineForm}
                            type="button"
                            style={{
                              padding: 0,
                              border: "none",
                              background: "transparent",
                              fontSize: 14,
                              color: "rgba(16, 17, 18, 0.56)",
                              textDecoration: "underline",
                              textUnderlineOffset: "0.18em",
                              cursor: "pointer",
                            }}
                          >
                            cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
              );
            })()
          ))}
        </div>
      ) : null}

      {hasRung ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 28,
            transform: "translateX(-50%)",
            zIndex: 20,
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setShowNotes((current) => !current)}
            type="button"
            style={{
              border: "1px solid rgba(16, 17, 18, 0.12)",
              background: "rgba(255, 255, 255, 0.9)",
              color: "rgba(17, 17, 17, 0.84)",
              borderRadius: 999,
              padding: "12px 18px",
              boxShadow: "0 10px 24px rgba(17, 24, 39, 0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            {showNotes ? "Hide notes" : "Show notes"}
          </button>
          <button
            onClick={() => setIsMuted((current) => !current)}
            type="button"
            aria-label={isMuted ? "Unmute gong sound" : "Mute gong sound"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              border: "1px solid rgba(16, 17, 18, 0.12)",
              background: "rgba(255, 255, 255, 0.9)",
              color: "rgba(17, 17, 17, 0.84)",
              borderRadius: 999,
              boxShadow: "0 10px 24px rgba(17, 24, 39, 0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Image
              alt=""
              aria-hidden="true"
              src="/sound-icon.svg"
              width={18}
              height={18}
              style={{
                opacity: isMuted ? 0.45 : 0.92,
                filter: isMuted ? "grayscale(1)" : "none",
              }}
            />
          </button>
        </div>
      ) : null}

      <CelebrationLog
        celebrations={celebrations}
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onDeleteAll={deleteAllCelebrations}
      />
    </main>
  );
}
