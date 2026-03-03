"use client";

export type CameraPosition = {
  x: number;
  y: number;
  z: number;
};

export type LightSettings = {
  ambientIntensity: number;
  hemisphereIntensity: number;
  directionalIntensity: number;
  directionalX: number;
  directionalY: number;
  directionalZ: number;
  spotIntensity: number;
  spotX: number;
  spotY: number;
  spotZ: number;
  spotAngle: number;
  spotPenumbra: number;
  pointIntensity: number;
  pointX: number;
  pointY: number;
  pointZ: number;
};

export type ConfettiSettings = {
  alwaysParticleCount: number;
  alwaysIntervalMs: number;
  alwaysSpread: number;
  alwaysStartVelocity: number;
  alwaysDecay: number;
  alwaysGravity: number;
  alwaysScalar: number;
  alwaysTicks: number;
  burstParticleCount: number;
  burstSpread: number;
  burstStartVelocity: number;
  burstDecay: number;
  burstGravity: number;
  burstScalar: number;
  burstTicks: number;
};

export const DEFAULT_CAMERA_POSITION: CameraPosition = {
  x: -6.17,
  y: -0.26,
  z: 6.24,
};

export const INITIAL_LIGHT_SETTINGS: LightSettings = {
  ambientIntensity: 1.8,
  hemisphereIntensity: 0.45,
  directionalIntensity: 1.25,
  directionalX: 1.7,
  directionalY: -0.3,
  directionalZ: 2.1,
  spotIntensity: 2.75,
  spotX: 8.8,
  spotY: 11,
  spotZ: -4.6,
  spotAngle: 0.83,
  spotPenumbra: 0.96,
  pointIntensity: 2.35,
  pointX: 7.3,
  pointY: 5,
  pointZ: 3.4,
};

export const INITIAL_CONFETTI_SETTINGS: ConfettiSettings = {
  alwaysParticleCount: 8,
  alwaysIntervalMs: 220,
  alwaysSpread: 22,
  alwaysStartVelocity: 8,
  alwaysDecay: 0.97,
  alwaysGravity: 0.31,
  alwaysScalar: 1.13,
  alwaysTicks: 500,
  burstParticleCount: 180,
  burstSpread: 120,
  burstStartVelocity: 28,
  burstDecay: 0.94,
  burstGravity: 0.72,
  burstScalar: 0.95,
  burstTicks: 240,
};
