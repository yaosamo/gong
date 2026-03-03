"use client";

import { useEffect, useState } from "react";
import { CelebrationBoard } from "@/components/celebration-board";
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
import type { Celebration } from "@/lib/types";

export default function HomePage() {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [hasRung, setHasRung] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [cameraPosition, setCameraPosition] = useState(DEFAULT_CAMERA_POSITION);
  const [lightSettings, setLightSettings] = useState(INITIAL_LIGHT_SETTINGS);
  const [confettiSettings, setConfettiSettings] = useState(INITIAL_CONFETTI_SETTINGS);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [copyConfettiStatus, setCopyConfettiStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [headlineEntered, setHeadlineEntered] = useState(false);
  const [ambientConfettiEnabled, setAmbientConfettiEnabled] = useState(false);

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
    setHasRung(true);
    setIsStriking(true);
    window.setTimeout(() => setIsStriking(false), 850);
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
      <CelebrationBoard celebrations={celebrations} />

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
          copyStatus={copyStatus}
          copyConfettiStatus={copyConfettiStatus}
          onOpenLog={() => setIsLogOpen(true)}
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

      {hasRung ? (
        <div
          style={{
            position: "absolute",
            top: 96,
            right: 32,
            bottom: 96,
            zIndex: 12,
            width: "min(380px, 34vw)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {celebrations.length ? (
              celebrations.slice(0, 8).map((celebration) => (
                <article
                  key={celebration.id}
                  style={{
                    padding: 14,
                    borderRadius: 20,
                    border: "1px solid rgba(16, 17, 18, 0.08)",
                    background: "rgba(255, 255, 255, 0.74)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 14px 34px rgba(17, 24, 39, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      fontSize: 13,
                      color: "rgba(16, 17, 18, 0.5)",
                    }}
                  >
                    <span>{celebration.name}</span>
                    <span>{celebration.locationLabel}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 15,
                      lineHeight: 1.45,
                      color: "rgba(16, 17, 18, 0.88)",
                    }}
                  >
                    {celebration.comment}
                  </div>
                </article>
              ))
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 20,
                  border: "1px dashed rgba(16, 17, 18, 0.16)",
                  background: "rgba(255, 255, 255, 0.44)",
                  color: "rgba(16, 17, 18, 0.5)",
                  fontSize: 15,
                  lineHeight: 1.45,
                }}
              >
                No celebrations yet. Ring the gong to start the page.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: 48,
            transform: "translateY(-54%)",
            zIndex: 12,
            width: "min(520px, 42vw)",
            pointerEvents: "none",
            textAlign: "left",
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
      )}

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 34,
          transform: "translateX(-50%)",
          zIndex: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          borderRadius: 999,
          border: "1px solid rgba(16, 17, 18, 0.08)",
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(16px)",
          padding: "12px 16px",
          boxShadow: "0 18px 40px rgba(17, 24, 39, 0.08)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#c63a29",
            boxShadow: "0 0 18px rgba(198, 58, 41, 0.42)",
          }}
        />
        <div style={{ fontSize: 16, color: "rgba(16, 17, 18, 0.62)" }}>Tap the gong</div>
      </div>

      <CelebrationLog
        celebrations={celebrations}
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
      />
    </main>
  );
}
