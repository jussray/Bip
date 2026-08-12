export const FRONT_DOOR_MOTION = Object.freeze({
  pulseDurationMs: 3200,
  driftDurationMs: 4200,
  reducedPulseRestValue: 0.35,
  ambientOpacity: [0.72, 1] as const,
  ambientScale: [1, 1.08] as const,
  heroTranslateY: [0, -8] as const,
  heroScale: [1, 1.018] as const,
  sparkOpacity: [0.62, 1] as const,
  sparkTranslateY: [0, -5] as const,
  sparkRotate: ['0deg', '9deg'] as const,
});
