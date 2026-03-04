"use client";

import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, OrbitControls, useTexture } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import type { TCanvasConfettiInstance } from "react-canvas-confetti/dist/types";
import { DEFAULT_CAMERA_POSITION, type ConfettiSettings, type LightSettings } from "@/lib/scene-config";
import { SRGBColorSpace } from "three";
import type { Group, Mesh } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

function GongModel({
  isStriking,
  isMobile,
}: {
  isStriking: boolean;
  isMobile: boolean;
}) {
  const gongRef = useRef<Group>(null);
  const suspendedRef = useRef<Group>(null);
  const phaseRef = useRef(0);
  const gongTexture = useTexture("/gong-texture-2.png");

  useEffect(() => {
    gongTexture.colorSpace = SRGBColorSpace;
    gongTexture.flipY = false;
  }, [gongTexture]);

  useEffect(() => {
    if (isStriking) {
      phaseRef.current = 1;
    }
  }, [isStriking]);

  useFrame((state, delta) => {
    const gong = gongRef.current;
    const suspended = suspendedRef.current;

    if (!gong || !suspended) {
      return;
    }

    const t = state.clock.elapsedTime;
    const idle = Math.sin(t * 0.85) * 0.01;
    const strike = phaseRef.current;

    if (strike > 0.001) {
      phaseRef.current = Math.max(0, strike - delta * 0.72);
    }

    const swingPhase = 1 - phaseRef.current;
    const primarySwing = Math.sin(swingPhase * 11) * strike * 0.34;
    const secondarySwing = Math.sin(swingPhase * 22) * strike * 0.06;
    const swing = primarySwing + secondarySwing;
    suspended.rotation.z = idle + swing;
    suspended.position.y = Math.cos(suspended.rotation.z) * -0.035 - strike * 0.018;

    gong.position.z = Math.sin(swingPhase * 24) * strike * 0.13;
    gong.rotation.y = Math.sin(swingPhase * 18) * strike * 0.055;
    gong.rotation.x = Math.sin(swingPhase * 28) * strike * 0.028;
  });

  return (
    <group position={isMobile ? [-0.28, 0.7, 0] : [-1.4, 0.35, 0]} scale={isMobile ? 0.42 : 0.49}>
      <mesh position={[0, 2.38, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 0.24, 0.34]} />
        <meshStandardMaterial color="#c63a29" roughness={0.58} />
      </mesh>

      <mesh position={[0, 2.08, -0.22]} castShadow receiveShadow>
        <boxGeometry args={[4.65, 0.18, 0.26]} />
        <meshStandardMaterial color="#111111" roughness={0.42} metalness={0.08} />
      </mesh>

      <mesh position={[-2.02, 0.12, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 4.2, 0.28]} />
        <meshStandardMaterial color="#d64531" roughness={0.56} />
      </mesh>

      <mesh position={[2.02, 0.12, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 4.2, 0.28]} />
        <meshStandardMaterial color="#d64531" roughness={0.56} />
      </mesh>

      <mesh position={[-2.14, -2.04, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.16, 0.46]} />
        <meshStandardMaterial color="#111111" roughness={0.42} metalness={0.08} />
      </mesh>

      <mesh position={[2.14, -2.04, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.16, 0.46]} />
        <meshStandardMaterial color="#111111" roughness={0.42} metalness={0.08} />
      </mesh>

      <mesh position={[-0.74, 1.5, -0.3]} rotation={[0, 0, 0.02]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.85, 18]} />
        <meshStandardMaterial color="#b89a62" roughness={0.9} />
      </mesh>

      <mesh position={[0.74, 1.5, -0.3]} rotation={[0, 0, -0.02]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.85, 18]} />
        <meshStandardMaterial color="#b89a62" roughness={0.9} />
      </mesh>

      <Float speed={1.2} rotationIntensity={0.03} floatIntensity={0.06}>
        <group ref={suspendedRef} position={[0, 1.36, 0]}>
          <group ref={gongRef} position={[0, -0.18, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.52, 1.52, 0.22, 96]} />
              <meshStandardMaterial color="#050505" metalness={0.12} roughness={0.88} />
            </mesh>

            <mesh position={[0, 0, 0.113]} castShadow receiveShadow>
              <circleGeometry args={[1.48, 96]} />
              <meshPhysicalMaterial
                map={gongTexture}
                color="#d0a243"
                metalness={0.78}
                roughness={0.26}
                clearcoat={0.9}
                clearcoatRoughness={0.14}
                emissive="#5b3e10"
                emissiveIntensity={0.05}
                polygonOffset
                polygonOffsetFactor={-2}
              />
            </mesh>

            <mesh position={[0, 0, -0.17]} receiveShadow>
              <torusGeometry args={[1.36, 0.05, 20, 96]} />
              <meshStandardMaterial color="#875f1c" metalness={0.72} roughness={0.34} />
            </mesh>
          </group>
        </group>
      </Float>
    </group>
  );
}

function CameraReporter({
  onCameraChange,
}: {
  onCameraChange: (position: { x: number; y: number; z: number }) => void;
}) {
  const { camera } = useThree();
  const lastRef = useRef("");

  useFrame(() => {
    const next = {
      x: Number(camera.position.x.toFixed(2)),
      y: Number(camera.position.y.toFixed(2)),
      z: Number(camera.position.z.toFixed(2)),
    };
    const key = `${next.x}|${next.y}|${next.z}`;

    if (lastRef.current !== key) {
      lastRef.current = key;
      onCameraChange(next);
    }
  });

  return null;
}

function CameraShake({
  isStriking,
}: {
  isStriking: boolean;
}) {
  const { camera } = useThree();
  const phaseRef = useRef(0);
  const lastOffsetRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (isStriking) {
      phaseRef.current = 1;
    }
  }, [isStriking]);

  useFrame((state, delta) => {
    const lastOffset = lastOffsetRef.current;

    camera.position.x -= lastOffset.x;
    camera.position.y -= lastOffset.y;
    camera.position.z -= lastOffset.z;

    const shake = phaseRef.current;

    if (shake > 0.001) {
      phaseRef.current = Math.max(0, shake - delta * 2.4);
    }

    const t = state.clock.elapsedTime;
    const amplitude = shake * 0.11;
    const nextOffset = {
      x: Math.sin(t * 38) * amplitude,
      y: Math.cos(t * 45) * amplitude * 0.75,
      z: Math.sin(t * 30) * amplitude * 0.45,
    };

    camera.position.x += nextOffset.x;
    camera.position.y += nextOffset.y;
    camera.position.z += nextOffset.z;
    lastOffsetRef.current = nextOffset;
  });

  return null;
}

function CameraIntro({
  controlsRef,
  initialPosition,
  introStartPosition,
  target,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  initialPosition: { x: number; y: number; z: number };
  introStartPosition: { x: number; y: number; z: number };
  target: [number, number, number];
}) {
  const { camera } = useThree();
  const progressRef = useRef(0);

  useEffect(() => {
    camera.position.set(introStartPosition.x, introStartPosition.y, introStartPosition.z);
  }, [camera, introStartPosition]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    if (!controls || progressRef.current >= 1) {
      return;
    }

    progressRef.current = Math.min(1, progressRef.current + delta * 0.42);
    const eased = 1 - Math.pow(1 - progressRef.current, 4);

    camera.position.set(
      introStartPosition.x + (initialPosition.x - introStartPosition.x) * eased,
      introStartPosition.y + (initialPosition.y - introStartPosition.y) * eased,
      introStartPosition.z + (initialPosition.z - introStartPosition.z) * eased,
    );

    controls.target.set(
      target[0],
      1.35 + (target[1] - 1.35) * eased,
      0.6 + (target[2] - 0.6) * eased,
    );
    controls.update();
  });

  return null;
}

export function GongScene({
  isStriking,
  onStrike,
  onCameraChange,
  ambientConfettiEnabled,
  lightSettings,
  confettiSettings,
  isMobile,
}: {
  isStriking: boolean;
  onStrike: () => void;
  onCameraChange: (position: { x: number; y: number; z: number }) => void;
  ambientConfettiEnabled: boolean;
  lightSettings: LightSettings;
  confettiSettings: ConfettiSettings;
  isMobile: boolean;
}) {
  const [cursorState, setCursorState] = useState({
    visible: false,
    x: 0,
    y: 0,
    striking: false,
  });
  const [strikeMarker, setStrikeMarker] = useState({
    visible: false,
    x: 0,
    y: 0,
    scale: 0,
  });
  const confettiRef = useRef<TCanvasConfettiInstance | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [confettiReady, setConfettiReady] = useState(false);
  const sceneCamera = isMobile
    ? { x: -2.9, y: 0.1, z: 7.7 }
    : DEFAULT_CAMERA_POSITION;
  const introCamera = isMobile
    ? { x: -8.6, y: 2.4, z: 13.6 }
    : { x: -13.4, y: 3.6, z: 18.5 };
  const orbitTarget: [number, number, number] = isMobile ? [0.18, 0.62, 0] : [0, 0.35, 0];

  function fireConfetti() {
    const confetti = confettiRef.current;

    if (!confetti) {
      return;
    }

    const colors = ["#f7d871", "#e4bb44", "#c9971b", "#fff0a8"];
    confetti({
      particleCount: confettiSettings.burstParticleCount,
      spread: confettiSettings.burstSpread,
      startVelocity: confettiSettings.burstStartVelocity,
      decay: confettiSettings.burstDecay,
      scalar: confettiSettings.burstScalar,
      gravity: confettiSettings.burstGravity,
      ticks: confettiSettings.burstTicks,
      origin: { x: 0.5, y: 0.32 },
      colors,
      zIndex: 2,
    });
    confetti({
      particleCount: Math.round(confettiSettings.burstParticleCount * 0.5),
      angle: 120,
      spread: Math.max(20, confettiSettings.burstSpread * 0.7),
      startVelocity: Math.max(4, confettiSettings.burstStartVelocity * 0.85),
      decay: confettiSettings.burstDecay,
      scalar: Math.max(0.2, confettiSettings.burstScalar * 0.93),
      gravity: confettiSettings.burstGravity * 1.05,
      ticks: Math.max(80, confettiSettings.burstTicks * 0.92),
      origin: { x: 0.16, y: 0.3 },
      colors,
      zIndex: 2,
    });
    confetti({
      particleCount: Math.round(confettiSettings.burstParticleCount * 0.5),
      angle: 60,
      spread: Math.max(20, confettiSettings.burstSpread * 0.7),
      startVelocity: Math.max(4, confettiSettings.burstStartVelocity * 0.85),
      decay: confettiSettings.burstDecay,
      scalar: Math.max(0.2, confettiSettings.burstScalar * 0.93),
      gravity: confettiSettings.burstGravity * 1.05,
      ticks: Math.max(80, confettiSettings.burstTicks * 0.92),
      origin: { x: 0.84, y: 0.3 },
      colors,
      zIndex: 2,
    });
  }

  useEffect(() => {
    if (!confettiReady || !ambientConfettiEnabled) {
      return;
    }

    function emitAmbientConfetti(originY?: number) {
      const confetti = confettiRef.current;

      if (!confetti) {
        return;
      }

      confetti({
        particleCount: Math.round(confettiSettings.alwaysParticleCount),
        angle: 90,
        spread: confettiSettings.alwaysSpread,
        startVelocity: confettiSettings.alwaysStartVelocity,
        decay: confettiSettings.alwaysDecay,
        gravity: confettiSettings.alwaysGravity,
        drift: -0.08 + Math.random() * 0.16,
        scalar: confettiSettings.alwaysScalar * (0.9 + Math.random() * 0.2),
        ticks: confettiSettings.alwaysTicks,
        origin: { x: 0.08 + Math.random() * 0.84, y: originY ?? -0.04 },
        colors: ["#f7d871", "#e4bb44", "#c9971b", "#fff0a8"],
        zIndex: 2,
      });
    }

    for (let index = 0; index < 14; index += 1) {
      emitAmbientConfetti(0.04 + Math.random() * 0.82);
    }

    const intervalId = window.setInterval(() => {
      emitAmbientConfetti();
    }, confettiSettings.alwaysIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [ambientConfettiEnabled, confettiReady, confettiSettings]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    setCursorState((current) => ({
      ...current,
      visible: true,
      x: event.clientX,
      y: event.clientY,
    }));
  }

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    setCursorState((current) => ({
      ...current,
      visible: true,
      x: event.clientX,
      y: event.clientY,
    }));
  }

  function handlePointerLeave() {
    setCursorState((current) => ({
      ...current,
      visible: false,
      striking: false,
    }));
  }

  function handleStrike() {
    onStrike();
    setCursorState((current) => ({
      ...current,
      striking: true,
    }));
    setStrikeMarker({
      visible: true,
      x: cursorState.x,
      y: cursorState.y,
      scale: 0,
    });
    fireConfetti();
    window.setTimeout(() => {
      setStrikeMarker((current) => ({
        ...current,
        scale: 1,
      }));
    }, 0);
    window.setTimeout(() => {
      setCursorState((current) => ({
        ...current,
        striking: false,
      }));
    }, 220);
    window.setTimeout(() => {
      setStrikeMarker((current) => ({
        ...current,
        visible: false,
      }));
    }, 100);
  }

  return (
    <div
      aria-label="Strike the gong scene"
      onClick={handleStrike}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        background: "transparent",
        padding: 0,
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        cursor: "none",
      }}
    >
      <ReactCanvasConfetti
        onInit={({ confetti }) => {
          confettiRef.current = confetti;
          setConfettiReady(true);
        }}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 6,
        }}
      />
      {strikeMarker.visible ? (
        <Image
          aria-hidden="true"
          alt=""
          src="/strike.png"
          width={144}
          height={144}
          unoptimized
          style={{
            position: "fixed",
            left: strikeMarker.x - 60,
            top: strikeMarker.y,
            transform: `translate(-50%, -50%) scale(${strikeMarker.scale})`,
            zIndex: 998,
            pointerEvents: "none",
            filter: "drop-shadow(0 0 18px rgba(211, 31, 31, 0.26))",
            objectFit: "contain",
            transition: "transform 100ms cubic-bezier(0.2, 0.9, 0.2, 1)",
          }}
        />
      ) : null}
      {cursorState.visible ? (
        <Image
          aria-hidden="true"
          alt=""
          src="/cursor.png"
          width={140}
          height={140}
          unoptimized
          style={{
            position: "fixed",
            left: cursorState.x,
            top: cursorState.y,
            pointerEvents: "none",
            userSelect: "none",
            transform: cursorState.striking
              ? `translate(-58%, -38%) rotate(-34deg) scale(${isMobile ? 0.72 : 0.88})`
              : `translate(-50%, -50%) rotate(-10deg) scale(${isMobile ? 0.82 : 1})`,
            transformOrigin: "50% 50%",
            transition: "transform 200ms cubic-bezier(0.22, 0.84, 0.24, 1)",
            zIndex: 999,
            filter: "drop-shadow(0 12px 18px rgba(17, 24, 39, 0.18))",
            objectFit: "contain",
          }}
        />
      ) : null}
      <Canvas
        camera={{
          position: [sceneCamera.x, sceneCamera.y, sceneCamera.z],
          fov: isMobile ? 38 : 33,
        }}
        dpr={[1, 1.8]}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#f7f5ef"]} />
        <fog attach="fog" args={["#f4f0e6", 12, 20]} />
        <ambientLight intensity={lightSettings.ambientIntensity} color="#fff8ee" />
        <hemisphereLight
          color="#fff8e7"
          groundColor="#ded3bf"
          intensity={lightSettings.hemisphereIntensity}
        />
        <directionalLight
          castShadow
          intensity={lightSettings.directionalIntensity}
          color="#fff0d1"
          position={[lightSettings.directionalX, lightSettings.directionalY, lightSettings.directionalZ]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <spotLight
          castShadow
          intensity={lightSettings.spotIntensity}
          color="#fff4de"
          position={[lightSettings.spotX, lightSettings.spotY, lightSettings.spotZ]}
          angle={lightSettings.spotAngle}
          penumbra={lightSettings.spotPenumbra}
        />
        <pointLight
          intensity={lightSettings.pointIntensity}
          color="#dcb15d"
          position={[lightSettings.pointX, lightSettings.pointY, lightSettings.pointZ]}
        />
        <Environment preset="city" />
        <CameraIntro
          controlsRef={controlsRef}
          initialPosition={sceneCamera}
          introStartPosition={introCamera}
          target={orbitTarget}
        />
        <CameraReporter onCameraChange={onCameraChange} />
        <CameraShake isStriking={isStriking} />
        <GongModel isStriking={isStriking} isMobile={isMobile} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          target={orbitTarget}
          minDistance={isMobile ? 5.8 : 4.8}
          maxDistance={isMobile ? 10.2 : 8.8}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.68}
        />
      </Canvas>
    </div>
  );
}
