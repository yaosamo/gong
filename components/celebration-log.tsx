"use client";

import { useTransition } from "react";
import type { Celebration } from "@/lib/types";
import { formatCelebrationDate } from "@/lib/utils";

export function CelebrationLog({
  celebrations,
  isOpen,
  onClose,
  onDeleteAll,
}: {
  celebrations: Celebration[];
  isOpen: boolean;
  onClose: () => void;
  onDeleteAll: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <aside
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        bottom: 24,
        width: "min(440px, calc(100vw - 32px))",
        padding: 20,
        borderRadius: 28,
        border: "1px solid rgba(16, 17, 18, 0.08)",
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 24px 60px rgba(17, 24, 39, 0.12)",
        transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 32px))",
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
        transition: "transform 280ms ease, opacity 280ms ease",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Celebration Log
          </div>
          <div style={{ marginTop: 4, fontSize: 14, color: "rgba(16, 17, 18, 0.56)" }}>
            Full feed, newest first.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => startTransition(async () => onDeleteAll())}
            disabled={isPending || !celebrations.length}
            type="button"
            style={{
              border: "1px solid rgba(154, 52, 18, 0.14)",
              background: "rgba(255, 245, 240, 0.9)",
              color: "rgba(154, 52, 18, 0.92)",
              borderRadius: 999,
              padding: "0 14px",
              height: 40,
            }}
          >
            {isPending ? "Deleting..." : "Delete All"}
          </button>
          <button
            onClick={onClose}
            type="button"
            style={{
              border: "1px solid rgba(16, 17, 18, 0.12)",
              background: "#fff",
              borderRadius: 999,
              height: 40,
              width: 40,
            }}
          >
            Close
          </button>
        </div>
      </div>

      <div
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingRight: 4,
        }}
      >
        {celebrations.map((item) => (
          <article
            key={item.id}
            style={{
              padding: 16,
              borderRadius: 20,
              border: "1px solid rgba(16, 17, 18, 0.08)",
              background: "rgba(250, 249, 244, 0.9)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                fontSize: 13,
                color: "rgba(16, 17, 18, 0.5)",
              }}
            >
              <span>{item.name}</span>
              <span>{formatCelebrationDate(item.createdAt)}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5 }}>{item.comment}</div>
            <div style={{ marginTop: 10, fontSize: 13, color: "rgba(16, 17, 18, 0.5)" }}>
              {item.locationLabel}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
