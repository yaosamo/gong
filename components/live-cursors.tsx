"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { CursorPresence } from "@/lib/types";

const palette = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#111827"];
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

export function LiveCursors() {
  const [cursors, setCursors] = useState<CursorPresence[]>([]);
  const idRef = useRef<string>("");
  const colorRef = useRef<string>("");

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
      channel.track({
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
      {cursors
        .filter((cursor) => cursor.id !== idRef.current)
        .map((cursor) => (
          <div
            key={cursor.id}
            style={{
              position: "absolute",
              left: `calc(${cursor.x * 100}% - 6px)`,
              top: `calc(${cursor.y * 100}% - 8px)`,
              transform: "translate(-50%, -50%)",
              transition: "left 120ms linear, top 120ms linear, opacity 240ms ease",
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
        ))}
    </div>
  );
}
