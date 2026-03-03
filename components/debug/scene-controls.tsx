"use client";

import type { CameraPosition, ConfettiSettings, LightSettings } from "@/lib/scene-config";

const lightControlSpecs = [
  ["ambientIntensity", "Ambient", 0, 2.5, 0.05],
  ["hemisphereIntensity", "Hemisphere", 0, 2.5, 0.05],
  ["directionalIntensity", "Directional Intensity", 0, 4, 0.05],
  ["directionalX", "Directional X", -12, 12, 0.1],
  ["directionalY", "Directional Y", -2, 12, 0.1],
  ["directionalZ", "Directional Z", -12, 12, 0.1],
  ["spotIntensity", "Spot Intensity", 0, 4, 0.05],
  ["spotX", "Spot X", -12, 12, 0.1],
  ["spotY", "Spot Y", -2, 12, 0.1],
  ["spotZ", "Spot Z", -12, 12, 0.1],
  ["spotAngle", "Spot Angle", 0.1, 1.2, 0.01],
  ["spotPenumbra", "Spot Penumbra", 0, 1, 0.01],
  ["pointIntensity", "Point Intensity", 0, 3, 0.05],
  ["pointX", "Point X", -12, 12, 0.1],
  ["pointY", "Point Y", -2, 12, 0.1],
  ["pointZ", "Point Z", -12, 12, 0.1],
] as const satisfies ReadonlyArray<
  readonly [keyof LightSettings, string, number, number, number]
>;

const confettiControlSpecs = [
  ["alwaysParticleCount", "Always Count", 1, 20, 1],
  ["alwaysIntervalMs", "Always Interval", 60, 600, 10],
  ["alwaysSpread", "Always Spread", 4, 60, 1],
  ["alwaysStartVelocity", "Always Velocity", 1, 20, 0.5],
  ["alwaysDecay", "Always Decay", 0.88, 0.99, 0.005],
  ["alwaysGravity", "Always Gravity", 0.05, 1.2, 0.01],
  ["alwaysScalar", "Always Scalar", 0.3, 1.5, 0.01],
  ["alwaysTicks", "Always Ticks", 80, 500, 5],
  ["burstParticleCount", "Burst Count", 20, 320, 5],
  ["burstSpread", "Burst Spread", 20, 180, 1],
  ["burstStartVelocity", "Burst Velocity", 4, 50, 0.5],
  ["burstDecay", "Burst Decay", 0.86, 0.99, 0.005],
  ["burstGravity", "Burst Gravity", 0.05, 1.4, 0.01],
  ["burstScalar", "Burst Scalar", 0.3, 1.8, 0.01],
  ["burstTicks", "Burst Ticks", 80, 420, 5],
] as const satisfies ReadonlyArray<
  readonly [keyof ConfettiSettings, string, number, number, number]
>;

type CopyStatus = "idle" | "copied" | "failed";

export function SceneControls({
  cameraPosition,
  lightSettings,
  confettiSettings,
  copyStatus,
  copyConfettiStatus,
  onOpenLog,
  onCopySceneSettings,
  onCopyConfettiSettings,
  onUpdateLightSetting,
  onUpdateConfettiSetting,
}: {
  cameraPosition: CameraPosition;
  lightSettings: LightSettings;
  confettiSettings: ConfettiSettings;
  copyStatus: CopyStatus;
  copyConfettiStatus: CopyStatus;
  onOpenLog: () => void;
  onCopySceneSettings: () => void;
  onCopyConfettiSettings: () => void;
  onUpdateLightSetting: <K extends keyof LightSettings>(key: K, value: number) => void;
  onUpdateConfettiSetting: <K extends keyof ConfettiSettings>(key: K, value: number) => void;
}) {
  return (
    <>
      <header
        style={{
          position: "absolute",
          inset: "24px 24px auto 24px",
          zIndex: 12,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 24,
        }}
      >
        <button
          onClick={onOpenLog}
          type="button"
          style={{
            position: "relative",
            zIndex: 12,
            borderRadius: 999,
            border: "1px solid rgba(16, 17, 18, 0.12)",
            background: "rgba(255, 255, 255, 0.76)",
            padding: "14px 18px",
            boxShadow: "0 18px 30px rgba(17, 24, 39, 0.06)",
          }}
        >
          Celebration Log
        </button>
      </header>

      <aside
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 12,
          width: 320,
          maxHeight: "min(72vh, 860px)",
          overflowY: "auto",
          borderRadius: 24,
          border: "1px solid rgba(16, 17, 18, 0.08)",
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 24px 50px rgba(17, 24, 39, 0.08)",
          padding: 18,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(16, 17, 18, 0.45)",
            marginBottom: 14,
          }}
        >
          Light Controls (Test)
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <button
            type="button"
            onClick={onCopySceneSettings}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(16, 17, 18, 0.12)",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "10px 14px",
              fontSize: 13,
              color: "rgba(16, 17, 18, 0.82)",
              boxShadow: "0 10px 24px rgba(17, 24, 39, 0.06)",
            }}
          >
            Copy Scene Settings
          </button>
          <span
            style={{
              fontSize: 12,
              color:
                copyStatus === "failed" ? "rgba(177, 38, 38, 0.9)" : "rgba(16, 17, 18, 0.48)",
            }}
          >
            {copyStatus === "copied"
              ? "Copied"
              : copyStatus === "failed"
                ? "Copy failed"
                : "Includes camera + lights + confetti"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lightControlSpecs.map(([key, label, min, max, step]) => (
            <label
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 13,
                  color: "rgba(16, 17, 18, 0.72)",
                }}
              >
                <span>{label}</span>
                <span>{lightSettings[key].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={lightSettings[key]}
                onChange={(event) => onUpdateLightSetting(key, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
        <div
          style={{
            marginTop: 18,
            paddingTop: 18,
            borderTop: "1px solid rgba(16, 17, 18, 0.08)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(16, 17, 18, 0.45)",
              marginBottom: 14,
            }}
          >
            Confetti Controls (Test)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              onClick={onCopyConfettiSettings}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(16, 17, 18, 0.12)",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "10px 14px",
                fontSize: 13,
                color: "rgba(16, 17, 18, 0.82)",
                boxShadow: "0 10px 24px rgba(17, 24, 39, 0.06)",
              }}
            >
              Copy Confetti Params
            </button>
            <span
              style={{
                fontSize: 12,
                color:
                  copyConfettiStatus === "failed"
                    ? "rgba(177, 38, 38, 0.9)"
                    : "rgba(16, 17, 18, 0.48)",
              }}
            >
              {copyConfettiStatus === "copied"
                ? "Copied"
                : copyConfettiStatus === "failed"
                  ? "Copy failed"
                  : "Confetti params only"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {confettiControlSpecs.map(([key, label, min, max, step]) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: 13,
                    color: "rgba(16, 17, 18, 0.72)",
                  }}
                >
                  <span>{label}</span>
                  <span>{confettiSettings[key].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={confettiSettings[key]}
                  onChange={(event) => onUpdateConfettiSetting(key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </div>
      </aside>

      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 24,
          zIndex: 12,
          display: "flex",
          justifyContent: "flex-start",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(16, 17, 18, 0.08)",
            background: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "blur(16px)",
            padding: "10px 14px",
            boxShadow: "0 18px 40px rgba(17, 24, 39, 0.08)",
            fontSize: 13,
            color: "rgba(16, 17, 18, 0.62)",
          }}
        >
          {`camera: x ${cameraPosition.x}, y ${cameraPosition.y}, z ${cameraPosition.z}`}
        </div>
      </div>
    </>
  );
}
