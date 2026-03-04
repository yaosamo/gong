"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { CursorPresence } from "@/lib/types";

const palette = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#111827"];

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

  const label = useMemo(() => `Guest ${idRef.current.slice(0, 4)}`, []);

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
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <path
                d="M2 1L15 13H9L7 22L4.5 21L6.5 12H2V1Z"
                fill={cursor.color}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
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
