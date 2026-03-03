"use client";

import { useEffect, useState, useTransition } from "react";
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
  date: string;
  hits: string;
  comment?: string;
  author?: string;
};

const recordEmojis = ["🎉", "🍬", "🧃", "✨", "🍡", "🍭", "🌼", "🍓"];
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
    date: "Mar 3, 2026 at 4:44 PM",
    hits: "3 gong hits",
  },
  {
    id: "sample-2",
    location: "Portland",
    date: "Mar 3, 2026 at 6:12 PM",
    hits: "12 gong hits",
    comment: "I just launched gong web app! gong.yaosamo.com",
    author: "Yaroslav",
  },
  {
    id: "sample-3",
    location: "Bend",
    date: "Mar 3, 2026 at 7:08 PM",
    hits: "1 gong hit",
    comment: "Wrapped a project that was dragging for weeks.",
    author: "Avery",
  },
  {
    id: "sample-4",
    location: "Seattle",
    date: "Mar 3, 2026 at 7:34 PM",
    hits: "8 gong hits",
  },
  {
    id: "sample-5",
    location: "Eugene",
    date: "Mar 3, 2026 at 8:01 PM",
    hits: "2 gong hits",
    comment: "Closed three loose threads and finally got a quiet evening.",
    author: "Nina",
  },
  {
    id: "sample-6",
    location: "Tokyo",
    date: "Mar 3, 2026 at 8:22 PM",
    hits: "21 gong hits",
  },
  {
    id: "sample-7",
    location: "Los Angeles",
    date: "Mar 3, 2026 at 8:48 PM",
    hits: "5 gong hits",
    comment: "Sent the deck, stopped overthinking, and called it done.",
    author: "Maya",
  },
  {
    id: "sample-8",
    location: "Oregon",
    date: "Mar 3, 2026 at 9:05 PM",
    hits: "11 gong hits",
  },
  {
    id: "sample-9",
    location: "Vancouver",
    date: "Mar 3, 2026 at 9:31 PM",
    hits: "4 gong hits",
    comment: "Got the feature stable on mobile and it finally feels solid.",
    author: "Theo",
  },
  {
    id: "sample-10",
    location: "Kyoto",
    date: "Mar 3, 2026 at 9:52 PM",
    hits: "6 gong hits",
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
  const [cameraPosition, setCameraPosition] = useState(DEFAULT_CAMERA_POSITION);
  const [lightSettings, setLightSettings] = useState(INITIAL_LIGHT_SETTINGS);
  const [confettiSettings, setConfettiSettings] = useState(INITIAL_CONFETTI_SETTINGS);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [copyConfettiStatus, setCopyConfettiStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [headlineEntered, setHeadlineEntered] = useState(false);
  const [ambientConfettiEnabled, setAmbientConfettiEnabled] = useState(false);
  const [isSubmittingInline, startInlineSubmit] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

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

      if (stored) {
        setSessionHitCounts(JSON.parse(stored) as Record<string, number>);
      }

      if (storedFallbackHits) {
        setSessionFallbackHits(Number(storedFallbackHits) || 0);
      }
    } catch {
      setSessionHitCounts({});
      setSessionFallbackHits(0);
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

  function strike() {
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
      title: formatCelebrationTitle("Oregon", `fallback-${fallbackCount}-${suffix}`),
      date: formatCelebrationDate(new Date().toISOString()),
    };
  }

  const activeCelebrationLine = getActiveCelebrationLine();
  const activeRecordEmoji = getRecordEmoji(selectedCelebration?.id ?? `fallback-${sessionFallbackHits || 1}`);

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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setInlineError("Could not save celebration.");
        return;
      }

      const data = (await response.json()) as { celebration: Celebration };
      setCelebrations((current) =>
        [data.celebration, ...current].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
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
          display: "flex",
          flexDirection: "column",
          gap: 28,
          maxHeight: "min(72vh, 860px)",
          overflowY: "auto",
          overflowX: "hidden",
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

        {hasRung ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingRight: 4,
              paddingTop: 4,
              pointerEvents: "auto",
            }}
          >
            {activeCelebrationLine ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  maxWidth: "100%",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    fontSize: "clamp(16px, 1.8vw, 22px)",
                    lineHeight: 1,
                    transform: "translateY(0.22em)",
                    flexShrink: 0,
                  }}
                >
                  {activeRecordEmoji}
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
                  {selectedCelebration?.comment ? (
                    <div
                      style={{
                        maxWidth: "100%",
                        padding: "7px 14px",
                        borderRadius: 999,
                        border: "1px solid rgba(16, 17, 18, 0.08)",
                        background: "rgba(255, 255, 255, 0.78)",
                        boxShadow: "0 1px 0 rgba(16, 17, 18, 0.04)",
                        fontSize: 16,
                        lineHeight: 1.25,
                        color: "rgba(17, 17, 17, 0.9)",
                        textWrap: "pretty",
                      }}
                    >
                      <span style={{ fontStyle: "italic" }}>{selectedCelebration.comment}</span>
                      <span style={{ color: "rgba(17, 17, 17, 0.54)" }}> - </span>
                      <span style={{ fontWeight: 600 }}>{selectedCelebration.name}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 16,
                        lineHeight: 1.28,
                        fontWeight: 400,
                        color: "rgba(17, 17, 17, 0.88)",
                        textWrap: "pretty",
                      }}
                    >
                      {activeCelebrationLine.title}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 14,
                      color: "rgba(16, 17, 18, 0.5)",
                    }}
                  >
                    {`${activeCelebrationLine.date} • ${formatGongHits(getActiveHitCount())}`}
                  </div>
                  <button
                    onClick={openInlineForm}
                    type="button"
                    style={{
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      fontSize: 15,
                      color: "#c63a29",
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
                        color: "rgba(154, 52, 18, 0.92)",
                        textDecoration: "underline",
                        textUnderlineOffset: "0.18em",
                        pointerEvents: "auto",
                        cursor: "pointer",
                      }}
                    >
                      {isDeleting ? "deleting..." : "delete"}
                    </button>
                  ) : null}
                  {deleteError ? (
                    <div style={{ fontSize: 13, color: "#9a3412" }}>{deleteError}</div>
                  ) : null}
                </div>
                {isInlineFormOpen ? (
                  <div
                    style={{
                      marginTop: 8,
                      marginLeft: 32,
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
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 14,
                  color: "rgba(16, 17, 18, 0.5)",
                  fontSize: 15,
                  lineHeight: 1.45,
                }}
              >
                No celebrations yet.
                <button
                  onClick={openInlineForm}
                  type="button"
                  style={{
                    marginTop: 14,
                    display: "inline-block",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    fontSize: 15,
                    color: "#c63a29",
                    textDecoration: "underline",
                    textUnderlineOffset: "0.18em",
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                >
                  add comment
                </button>
                {isInlineFormOpen ? (
                  <div
                    style={{
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
              </div>
            )}
            {showSampleRecords ? (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  opacity: 0.78,
                }}
              >
                {sampleRecords.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      maxWidth: "100%",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        fontSize: "clamp(16px, 1.8vw, 22px)",
                        lineHeight: 1,
                        transform: "translateY(0.22em)",
                        flexShrink: 0,
                      }}
                    >
                      {getRecordEmoji(record.id)}
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
                            borderRadius: 999,
                            border: "1px solid rgba(16, 17, 18, 0.08)",
                            background: "rgba(255, 255, 255, 0.78)",
                            boxShadow: "0 1px 0 rgba(16, 17, 18, 0.04)",
                            fontSize: 16,
                            lineHeight: 1.25,
                            color: "rgba(17, 17, 17, 0.9)",
                            textWrap: "pretty",
                          }}
                        >
                          <span style={{ fontStyle: "italic" }}>{record.comment}</span>
                          <span style={{ color: "rgba(17, 17, 17, 0.54)" }}> - </span>
                          <span style={{ fontWeight: 600 }}>{record.author}</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: 16,
                            lineHeight: 1.28,
                            fontWeight: 400,
                            color: "rgba(17, 17, 17, 0.88)",
                            textWrap: "pretty",
                          }}
                        >
                          {formatCelebrationTitle(record.location, record.id)}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 14,
                          color: "rgba(16, 17, 18, 0.5)",
                        }}
                      >
                        {`${record.date} • ${record.hits}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <CelebrationLog
        celebrations={celebrations}
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
      />
    </main>
  );
}
