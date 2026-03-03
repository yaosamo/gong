"use client";

import { useEffect, useMemo, useState } from "react";
import type { Celebration } from "@/lib/types";
import { formatCelebrationDate } from "@/lib/utils";

type PositionedCelebration = Celebration & {
  x: number;
  y: number;
  opacity: number;
  ageIndex: number;
};

function hashValue(value: string) {
  return value.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7);
}

function positionCelebrations(items: Celebration[]) {
  const recent = items.slice(0, 40);
  const occupied: Array<{ x: number; y: number }> = [];

  return recent.map((item, index) => {
    const seed = hashValue(item.id);
    let x = 10 + (seed % 76);
    let y = 10 + (Math.floor(seed / 10) % 76);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const overlap = occupied.some(
        (point) => Math.abs(point.x - x) < 18 && Math.abs(point.y - y) < 12,
      );

      if (!overlap) {
        break;
      }

      x = 8 + ((x + 13) % 82);
      y = 12 + ((y + 9) % 72);
    }

    occupied.push({ x, y });

    return {
      ...item,
      x,
      y,
      ageIndex: index,
      opacity: Math.max(0.18, 1 - index * 0.06),
    };
  });
}

export function CelebrationBoard({
  celebrations,
}: {
  celebrations: Celebration[];
}) {
  const positioned = useMemo(() => positionCelebrations(celebrations), [celebrations]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {positioned.map((item) => (
        <article
          key={item.id}
          style={{
            position: "absolute",
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: "min(280px, 38vw)",
            padding: "14px 16px",
            border: "1px solid rgba(16, 17, 18, 0.08)",
            borderRadius: 20,
            background: `rgba(255, 255, 255, ${0.82 * item.opacity})`,
            boxShadow: "0 18px 40px rgba(17, 24, 39, 0.07)",
            backdropFilter: "blur(12px)",
            transform: mounted
              ? `translate(-50%, -50%) rotate(${(item.ageIndex % 7) - 3}deg)`
              : "translate(-50%, -48%) scale(0.96)",
            opacity: mounted ? item.opacity : 0,
            transition: "opacity 600ms ease, transform 600ms ease",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(16, 17, 18, 0.45)",
            }}
          >
            {item.locationLabel}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 16,
              lineHeight: 1.45,
              color: "rgba(16, 17, 18, 0.88)",
            }}
          >
            {item.comment}
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 13,
              color: "rgba(16, 17, 18, 0.52)",
            }}
          >
            <span>{item.name}</span>
            <span>{formatCelebrationDate(item.createdAt)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
