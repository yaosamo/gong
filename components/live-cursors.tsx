"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { CursorPresence } from "@/lib/types";

const palette = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#111827"];
const botDefinitions = [
  {
    id: "bot-drift",
    name: "Drift bot",
    color: "#f97316",
    anchorX: 0.28,
    anchorY: 0.3,
    radiusX: 0.09,
    radiusY: 0.07,
    speed: 0.00024,
    phase: 0.2,
  },
  {
    id: "bot-echo",
    name: "Echo bot",
    color: "#22c55e",
    anchorX: 0.72,
    anchorY: 0.36,
    radiusX: 0.08,
    radiusY: 0.06,
    speed: 0.00019,
    phase: 1.3,
  },
  {
    id: "bot-orbit",
    name: "Orbit bot",
    color: "#3b82f6",
    anchorX: 0.54,
    anchorY: 0.7,
    radiusX: 0.11,
    radiusY: 0.05,
    speed: 0.00021,
    phase: 2.1,
  },
] as const;
const cursorNames = [
  "Cool dude",
  "Wizard",
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
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildBotCursor(
  definition: (typeof botDefinitions)[number],
  timestamp: number,
): CursorPresence {
  const angle = timestamp * definition.speed + definition.phase;

  return {
    id: definition.id,
    name: definition.name,
    color: definition.color,
    x: clamp(definition.anchorX + Math.cos(angle) * definition.radiusX, 0.1, 0.9),
    y: clamp(definition.anchorY + Math.sin(angle * 1.18) * definition.radiusY, 0.12, 0.88),
    updatedAt: new Date(timestamp).toISOString(),
  };
}

function useBotCursors(enabled: boolean) {
  const [bots, setBots] = useState<CursorPresence[]>([]);

  useEffect(() => {
    if (!enabled) {
      setBots([]);
      return;
    }

    function updateBots() {
      const timestamp = performance.now();
      setBots(botDefinitions.map((definition) => buildBotCursor(definition, timestamp)));
    }

    updateBots();
    const intervalId = window.setInterval(updateBots, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  return bots;
}

function SmoothCursor({ cursor, opacity = 1 }: { cursor: CursorPresence; opacity?: number }) {
  const [{ x, y }, setPosition] = useState({ x: cursor.x, y: cursor.y });
  const targetRef = useRef({ x: cursor.x, y: cursor.y });

  useEffect(() => {
    targetRef.current = { x: cursor.x, y: cursor.y };
  }, [cursor.x, cursor.y]);

  useEffect(() => {
    let frameId = 0;

    function tick() {
      setPosition((current) => {
        const nextX = current.x + (targetRef.current.x - current.x) * 0.18;
        const nextY = current.y + (targetRef.current.y - current.y) * 0.18;

        return {
          x: Math.abs(nextX - targetRef.current.x) < 0.0005 ? targetRef.current.x : nextX,
          y: Math.abs(nextY - targetRef.current.y) < 0.0005 ? targetRef.current.y : nextY,
        };
      });

      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(${x * 100}% - 6px)`,
        top: `calc(${y * 100}% - 8px)`,
        transform: "translate(-50%, -50%)",
        transition: "opacity 240ms ease",
        willChange: "left, top",
        opacity,
      }}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <g transform="rotate(-28 13 13)">
          <rect
            x="4.2"
            y="4.8"
            width="11.2"
            height="7.2"
            rx="2.4"
            fill={cursor.color}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <rect
            x="12.8"
            y="10.4"
            width="9.6"
            height="3.2"
            rx="1.6"
            fill="#7c4a22"
            stroke="#ffffff"
            strokeWidth="1.1"
          />
          <rect
            x="18.6"
            y="8.8"
            width="2.8"
            height="6.4"
            rx="1.4"
            fill={cursor.color}
            stroke="#ffffff"
            strokeWidth="1"
          />
        </g>
      </svg>
      <div
        style={{
          marginTop: 2,
          marginLeft: 12,
          display: "inline-flex",
          borderRadius: 999,
          padding: "4px 8px",
          background: cursor.color,
          color: "#ffffff",
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        {cursor.name}
      </div>
    </div>
  );
}

export function LiveCursors() {
  const [cursors, setCursors] = useState<CursorPresence[]>([]);
  const idRef = useRef<string>("");
  const colorRef = useRef<string>("");
  const lastTrackRef = useRef(0);

  if (!idRef.current) {
    idRef.current = makeId();
    colorRef.current = palette[Math.floor(Math.random() * palette.length)] ?? "#111827";
  }

  const label = useMemo(() => {
    const seed = idRef.current
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return cursorNames[seed % cursorNames.length] ?? "Cool dude";
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();

    if (!client) {
      console.warn("[live-cursors] Supabase browser env is missing.");
      return;
    }

    const channel = client.channel("live-cursors", {
      config: {
        presence: {
          key: idRef.current,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<CursorPresence>();
        const next = Object.values(state)
          .flat()
          .map((item) => ({
            id: item.id,
            name: item.name,
            x: item.x,
            y: item.y,
            updatedAt: item.updatedAt,
            color: item.color,
          }))
          .filter((item) => Date.now() - new Date(item.updatedAt).getTime() < 12000);

        setCursors(next);
      })
      .subscribe(async (status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.error("[live-cursors] channel status:", status);
        }

        if (status === "SUBSCRIBED") {
          await channel.track({
            id: idRef.current,
            name: label,
            x: 0.5,
            y: 0.5,
            updatedAt: new Date().toISOString(),
            color: colorRef.current,
          });
        }
      });

    function onMove(event: PointerEvent) {
      const now = performance.now();

      if (now - lastTrackRef.current < 32) {
        return;
      }

      lastTrackRef.current = now;

      void channel.track({
        id: idRef.current,
        name: label,
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
        updatedAt: new Date().toISOString(),
        color: colorRef.current,
      });
    }

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      void channel.untrack();
      void channel.unsubscribe();
    };
  }, [label]);

  const remoteCursors = cursors.filter((cursor) => cursor.id !== idRef.current);
  const botCursors = useBotCursors(remoteCursors.length === 0);
  const visibleCursors = remoteCursors.length > 0 ? remoteCursors : botCursors;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {visibleCursors.map((cursor) => (
        <SmoothCursor
          key={cursor.id}
          cursor={cursor}
          opacity={remoteCursors.length > 0 ? 1 : 0.76}
        />
      ))}
    </div>
  );
}
