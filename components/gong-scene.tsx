"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Group, Mesh } from "three";

function GongModel({
  isStriking,
}: {
  isStriking: boolean;
}) {
  const gongRef = useRef<Mesh>(null);
  const suspendedRef = useRef<Group>(null);
  const phaseRef = useRef(0);

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
      phaseRef.current = Math.max(0, strike - delta * 1.2);
    }

    const swing = Math.sin((1 - phaseRef.current) * 12) * strike * 0.24;
    suspended.rotation.z = idle + swing;
    suspended.position.y = Math.cos(suspended.rotation.z) * -0.02;

    gong.position.z = Math.sin((1 - phaseRef.current) * 20) * strike * 0.08;
  });

  return (
    <group position={[-1.4, 0.35, 0]} scale={0.49}>
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

      <mesh position={[-2.14, -1.86, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.16, 0.46]} />
        <meshStandardMaterial color="#111111" roughness={0.42} metalness={0.08} />
      </mesh>

      <mesh position={[2.14, -1.86, -0.2]} castShadow receiveShadow>
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
          <mesh ref={gongRef} position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.52, 1.52, 0.3, 96]} />
            <meshPhysicalMaterial
              color="#c4922c"
              metalness={0.82}
              roughness={0.24}
              clearcoat={0.9}
              clearcoatRoughness={0.12}
              emissive="#71501b"
              emissiveIntensity={0.1}
            />
          </mesh>

          <mesh position={[0, -0.18, 0.2]} castShadow>
            <circleGeometry args={[0.24, 64]} />
            <meshPhysicalMaterial
              color="#e5c56d"
              metalness={0.92}
              roughness={0.16}
              clearcoat={0.88}
              emissive="#7a5a1a"
              emissiveIntensity={0.08}
            />
          </mesh>

          <mesh position={[0, -0.18, -0.17]} receiveShadow>
            <torusGeometry args={[1.36, 0.05, 20, 96]} />
            <meshStandardMaterial color="#875f1c" metalness={0.72} roughness={0.34} />
          </mesh>
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

export function GongScene({
  isStriking,
  onStrike,
  onCameraChange,
}: {
  isStriking: boolean;
  onStrike: () => void;
  onCameraChange: (position: { x: number; y: number; z: number }) => void;
}) {
  return (
    <div
      aria-label="Strike the gong scene"
      onClick={onStrike}
      style={{
        background: "transparent",
        padding: 0,
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    >
      <Canvas
        camera={{ position: [-6.17, -0.26, 6.24], fov: 33 }}
        dpr={[1, 1.8]}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#f7f5ef"]} />
        <fog attach="fog" args={["#f4f0e6", 12, 20]} />
        <ambientLight intensity={0.8} color="#fff8ee" />
        <hemisphereLight
          color="#fff8e7"
          groundColor="#ded3bf"
          intensity={0.9}
        />
        <directionalLight
          castShadow
          intensity={1.6}
          color="#fff0d1"
          position={[4, 6, 5]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <spotLight
          castShadow
          intensity={1.35}
          color="#fff4de"
          position={[0, 5.5, 4]}
          angle={0.36}
          penumbra={0.95}
        />
        <pointLight intensity={0.45} color="#dcb15d" position={[0, 1.6, 3]} />
        <Environment preset="city" />
        <CameraReporter onCameraChange={onCameraChange} />
        <GongModel isStriking={isStriking} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          target={[0, 0.35, 0]}
          minDistance={4.8}
          maxDistance={8.8}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.68}
        />
      </Canvas>
    </div>
  );
}
