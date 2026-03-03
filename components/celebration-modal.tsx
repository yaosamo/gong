"use client";

import { useEffect, useState, useTransition } from "react";
import type { Celebration, CelebrationInput } from "@/lib/types";

export function CelebrationModal({
  isOpen,
  onClose,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (celebration: Celebration) => void;
}) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setComment("");
      setName("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function submit() {
    const payload: CelebrationInput = {
      name: name.trim(),
      comment: comment.trim(),
    };

    if (!payload.name || !payload.comment) {
      setError("Both fields are required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/celebrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("Could not save celebration.");
        return;
      }

      const data = (await response.json()) as { celebration: Celebration };
      onSubmitted(data.celebration);
      onClose();
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          borderRadius: 28,
          border: "1px solid rgba(16, 17, 18, 0.08)",
          background: "rgba(255, 255, 255, 0.94)",
          boxShadow: "0 24px 80px rgba(17, 24, 39, 0.12)",
          padding: 28,
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Strike and Celebrate
        </div>
        <h2
          style={{
            margin: "10px 0 0",
            fontSize: "clamp(28px, 4vw, 40px)",
            lineHeight: 1.02,
            fontWeight: 500,
          }}
        >
          What are you celebrating today?
        </h2>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 14, color: "rgba(16, 17, 18, 0.58)" }}>Your name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={48}
              placeholder="Jamie"
              style={{
                borderRadius: 18,
                border: "1px solid rgba(16, 17, 18, 0.12)",
                padding: "15px 16px",
                background: "#fff",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 14, color: "rgba(16, 17, 18, 0.58)" }}>Celebration</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={220}
              placeholder="Shipped a launch, survived a hard week, finished a draft."
              rows={4}
              style={{
                borderRadius: 18,
                border: "1px solid rgba(16, 17, 18, 0.12)",
                padding: "15px 16px",
                background: "#fff",
                resize: "vertical",
              }}
            />
          </label>
        </div>

        {error ? (
          <div style={{ marginTop: 12, fontSize: 14, color: "#9a3412" }}>{error}</div>
        ) : null}

        <div style={{ marginTop: 22, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            type="button"
            style={{
              borderRadius: 999,
              border: "1px solid rgba(16, 17, 18, 0.12)",
              background: "transparent",
              padding: "12px 18px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            type="button"
            style={{
              borderRadius: 999,
              border: "none",
              background: "#111111",
              color: "#ffffff",
              padding: "12px 18px",
            }}
          >
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
