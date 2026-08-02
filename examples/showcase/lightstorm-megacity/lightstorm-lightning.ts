// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getLightstormGuidedCameraSample,
  LIGHTSTORM_CAMERA_FIELD_OF_VIEW,
  type LightstormCameraSample,
  type LightstormGuidedCameraTour
} from './lightstorm-camera';

export const LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT = 16;
export const LIGHTSTORM_LIGHTNING_SEGMENT_CAPACITY = 96;
export const LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS = 29;
export const LIGHTSTORM_LIGHTNING_STRIKE_WIDTH_SECONDS = 0.085;
export const LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS = 0.26;
export const LIGHTSTORM_LIGHTNING_RETURN_STROKE_WIDTH_SECONDS = 0.065;
export const LIGHTSTORM_LIGHTNING_RETURN_STROKE_SCALE = 0.82;
export const LIGHTSTORM_CANYON_STRIKE_SECONDS = 5.6;
export const LIGHTSTORM_AVENUE_STRIKE_SECONDS = 8.6;
export const LIGHTSTORM_REVEAL_STRIKE_SECONDS = 15.65;
export const LIGHTSTORM_CANYON_SKY_PULSE_AMPLITUDE = 0.38;
export const LIGHTSTORM_AVENUE_SKY_PULSE_AMPLITUDE = 0.3;
export const LIGHTSTORM_REVEAL_SKY_PULSE_AMPLITUDE = 1;

type Vector3 = [number, number, number];
type LightstormLightningFramePoint = [normalizedX: number, normalizedY: number, depth: number];

export type LightstormLightningBoltRole = 'canyon' | 'avenue' | 'reveal';

export type LightstormLightningBoltDefinition = {
  role: LightstormLightningBoltRole;
  start: Vector3;
  end: Vector3;
  color: Vector3;
  intensity: number;
  phaseSeconds: number;
  periodSeconds: number;
  width: number;
  segmentCount: number;
  branchNodeIndices: readonly number[];
  branchSegmentCount: number;
  jitter: number;
  sizeScale: number;
  randomSeed: number;
};

export type LightstormLightningBoltSchedule = Omit<
  LightstormLightningBoltDefinition,
  'start' | 'end'
>;

export type LightstormLightningSegment = {
  start: Vector3;
  end: Vector3;
  width: number;
  seed: number;
  color: Vector3;
  intensity: number;
  phaseSeconds: number;
  periodSeconds: number;
  branchLevel: number;
  boltIndex: number;
};

/** Stable roles and phases shared by the visual and thunder timelines. */
export const LIGHTSTORM_LIGHTNING_SCHEDULE: readonly LightstormLightningBoltSchedule[] = [
  {
    role: 'canyon',
    color: [0.82, 0.91, 1],
    intensity: 32,
    phaseSeconds: LIGHTSTORM_CANYON_STRIKE_SECONDS,
    periodSeconds: LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS,
    width: 0.22,
    segmentCount: 16,
    branchNodeIndices: [4, 8, 12],
    branchSegmentCount: 3,
    jitter: 12,
    sizeScale: 1,
    randomSeed: 0x7d31a2f5
  },
  {
    role: 'avenue',
    color: [0.86, 0.93, 1],
    intensity: 24,
    phaseSeconds: LIGHTSTORM_AVENUE_STRIKE_SECONDS,
    periodSeconds: LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS,
    width: 0.24,
    segmentCount: 15,
    branchNodeIndices: [4, 9, 12],
    branchSegmentCount: 3,
    jitter: 14,
    sizeScale: 1,
    randomSeed: 0x41c6ce57
  },
  {
    role: 'reveal',
    color: [0.9, 0.96, 1],
    intensity: 64,
    phaseSeconds: LIGHTSTORM_REVEAL_STRIKE_SECONDS,
    periodSeconds: LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS,
    width: 0.44,
    segmentCount: 24,
    branchNodeIndices: [5, 10, 15, 20],
    branchSegmentCount: 4,
    jitter: 24,
    sizeScale: 2,
    randomSeed: 0xb5297a4d
  }
];

const LIGHTSTORM_LIGHTNING_FRAMING: Record<
  LightstormLightningBoltRole,
  {start: LightstormLightningFramePoint; end: LightstormLightningFramePoint}
> = {
  canyon: {
    start: [0.36, 0.88, 280],
    end: [0.02, 0.18, 190]
  },
  avenue: {
    start: [-0.4, 0.9, 280],
    end: [-0.04, 0.22, 190]
  },
  reveal: {
    start: [-0.78, 0.58, 380],
    end: [0.78, 0.3, 380]
  }
};

export const LIGHTSTORM_LIGHTNING_BOLT_COUNT = LIGHTSTORM_LIGHTNING_SCHEDULE.length;
export const LIGHTSTORM_LIGHTNING_SEGMENT_COUNT = LIGHTSTORM_LIGHTNING_SCHEDULE.reduce(
  (segmentCount, bolt) =>
    segmentCount + bolt.segmentCount + bolt.branchNodeIndices.length * bolt.branchSegmentCount,
  0
);

/** Places every authored bolt relative to its capacity-specific camera pose. */
export function makeLightstormLightningBolts(
  tour: LightstormGuidedCameraTour,
  aspect: number
): LightstormLightningBoltDefinition[] {
  return LIGHTSTORM_LIGHTNING_SCHEDULE.map(bolt => {
    const cameraSample = getLightstormGuidedCameraSample(tour, bolt.phaseSeconds);
    const framing = LIGHTSTORM_LIGHTNING_FRAMING[bolt.role];
    return {
      ...bolt,
      start: makeCameraFramedWorldPoint(cameraSample, framing.start, aspect),
      end: makeCameraFramedWorldPoint(cameraSample, framing.end, aspect)
    };
  });
}

/** Returns bounded double flashes synchronized to each camera-framed lightning strike. */
export function getLightstormLightningSkyPulse(
  timeSeconds: number,
  lightstormEnabled = true
): number {
  if (!lightstormEnabled || !Number.isFinite(timeSeconds)) {
    return 0;
  }
  const pulseDefinitions = [
    [LIGHTSTORM_CANYON_STRIKE_SECONDS, LIGHTSTORM_CANYON_SKY_PULSE_AMPLITUDE],
    [LIGHTSTORM_AVENUE_STRIKE_SECONDS, LIGHTSTORM_AVENUE_SKY_PULSE_AMPLITUDE],
    [LIGHTSTORM_REVEAL_STRIKE_SECONDS, LIGHTSTORM_REVEAL_SKY_PULSE_AMPLITUDE]
  ] as const;
  let skyPulse = 0;
  for (const [phaseSeconds, amplitude] of pulseDefinitions) {
    skyPulse = Math.max(
      skyPulse,
      amplitude * getLightstormLightningStrikeEnvelope(timeSeconds, phaseSeconds)
    );
  }
  return Math.min(1, skyPulse);
}

function getLightstormLightningStrikeEnvelope(timeSeconds: number, phaseSeconds: number): number {
  const cycleTime =
    (((timeSeconds - phaseSeconds) % LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS) +
      LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS) %
    LIGHTSTORM_LIGHTNING_TOUR_DURATION_SECONDS;
  const firstStrike = Math.exp(-Math.pow(cycleTime / LIGHTSTORM_LIGHTNING_STRIKE_WIDTH_SECONDS, 2));
  const returnStroke =
    Math.exp(
      -Math.pow(
        (cycleTime - LIGHTSTORM_LIGHTNING_RETURN_STROKE_DELAY_SECONDS) /
          LIGHTSTORM_LIGHTNING_RETURN_STROKE_WIDTH_SECONDS,
        2
      )
    ) * LIGHTSTORM_LIGHTNING_RETURN_STROKE_SCALE;
  return Math.max(firstStrike, returnStroke);
}

/** Creates connected jagged trunks and first-order branches without mutable global state. */
export function makeLightstormLightningSegments(
  bolts: readonly LightstormLightningBoltDefinition[]
): LightstormLightningSegment[] {
  const segments: LightstormLightningSegment[] = [];

  for (let boltIndex = 0; boltIndex < bolts.length; boltIndex++) {
    const bolt = bolts[boltIndex]!;
    const random = makeDeterministicRandom(bolt.randomSeed);
    const trunkNodes = makeJaggedPath(bolt.start, bolt.end, bolt.segmentCount, bolt.jitter, random);

    appendPathSegments(segments, trunkNodes, bolt, boltIndex, 0, random);

    for (const branchNodeIndex of bolt.branchNodeIndices) {
      const branchStart = trunkNodes[branchNodeIndex]!;
      const previousNode = trunkNodes[Math.max(0, branchNodeIndex - 1)]!;
      const nextNode = trunkNodes[Math.min(trunkNodes.length - 1, branchNodeIndex + 1)]!;
      const trunkDirection = normalizeVector(subtractVectors(nextNode, previousNode));
      const lateralDirection = getPerpendicularDirections(trunkDirection)[0];
      const branchSign = random() < 0.5 ? -1 : 1;
      const branchLength = (38 + random() * 28) * bolt.sizeScale;
      const branchDirection = normalizeVector(
        addVectors(
          scaleVector(trunkDirection, 0.34),
          scaleVector(lateralDirection, branchSign * 0.82),
          [0, -0.24, 0]
        )
      );
      const branchEnd = addVectors(branchStart, scaleVector(branchDirection, branchLength));
      const branchNodes = makeJaggedPath(
        branchStart,
        branchEnd,
        bolt.branchSegmentCount,
        bolt.jitter * 0.32,
        random
      );
      appendPathSegments(segments, branchNodes, bolt, boltIndex, 1, random);
    }
  }

  if (segments.length > LIGHTSTORM_LIGHTNING_SEGMENT_CAPACITY) {
    throw new Error('Lightstorm lightning segment capacity exceeded');
  }
  return segments;
}

/**
 * Packs four shader-aligned vec4 values per segment:
 * `[start.xyz, width]`, `[end.xyz, seed]`, `[color.rgb, intensity]`, and
 * `[phaseSeconds, periodSeconds, branchLevel, boltIndex]`.
 */
export function makeLightstormLightningBufferData(
  segments: readonly LightstormLightningSegment[]
): Float32Array {
  const data = new Float32Array(segments.length * LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT);
  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex]!;
    const wordOffset = segmentIndex * LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT;
    data.set(
      [
        segment.start[0],
        segment.start[1],
        segment.start[2],
        segment.width,
        segment.end[0],
        segment.end[1],
        segment.end[2],
        segment.seed,
        segment.color[0],
        segment.color[1],
        segment.color[2],
        segment.intensity,
        segment.phaseSeconds,
        segment.periodSeconds,
        segment.branchLevel,
        segment.boltIndex
      ],
      wordOffset
    );
  }
  return data;
}

function appendPathSegments(
  segments: LightstormLightningSegment[],
  nodes: readonly Vector3[],
  bolt: LightstormLightningBoltDefinition,
  boltIndex: number,
  branchLevel: number,
  random: () => number
): void {
  const segmentCount = nodes.length - 1;
  const branchScale = branchLevel === 0 ? 1 : 0.56;
  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
    const pathProgress = segmentCount > 1 ? segmentIndex / (segmentCount - 1) : 0;
    segments.push({
      start: nodes[segmentIndex]!,
      end: nodes[segmentIndex + 1]!,
      width: bolt.width * branchScale * (1 - pathProgress * 0.38),
      seed: random(),
      color: [...bolt.color],
      intensity: bolt.intensity * branchScale * (1 - pathProgress * 0.14),
      phaseSeconds: bolt.phaseSeconds,
      periodSeconds: bolt.periodSeconds,
      branchLevel,
      boltIndex
    });
  }
}

function makeCameraFramedWorldPoint(
  cameraSample: LightstormCameraSample,
  framePoint: LightstormLightningFramePoint,
  aspect: number
): Vector3 {
  const cameraForward = normalizeVector(subtractVectors(cameraSample.target, cameraSample.eye));
  let cameraRight = crossVectors(cameraForward, [0, 1, 0]);
  if (vectorLength(cameraRight) < 0.00001) {
    cameraRight = [1, 0, 0];
  } else {
    cameraRight = normalizeVector(cameraRight);
  }
  const cameraUp = normalizeVector(crossVectors(cameraRight, cameraForward));
  const [normalizedX, normalizedY, depth] = framePoint;
  const halfHeight = depth * Math.tan(LIGHTSTORM_CAMERA_FIELD_OF_VIEW / 2);
  const halfWidth = halfHeight * aspect;
  return addVectors(
    cameraSample.eye,
    scaleVector(cameraForward, depth),
    scaleVector(cameraRight, normalizedX * halfWidth),
    scaleVector(cameraUp, normalizedY * halfHeight)
  );
}

function makeJaggedPath(
  start: Vector3,
  end: Vector3,
  segmentCount: number,
  jitter: number,
  random: () => number
): Vector3[] {
  const direction = normalizeVector(subtractVectors(end, start));
  const [firstPerpendicular, secondPerpendicular] = getPerpendicularDirections(direction);
  const nodes: Vector3[] = [];

  for (let nodeIndex = 0; nodeIndex <= segmentCount; nodeIndex++) {
    const progress = nodeIndex / segmentCount;
    const center = mixVectors(start, end, progress);
    const jitterEnvelope = Math.sin(progress * Math.PI);
    const firstOffset = (random() * 2 - 1) * jitter * jitterEnvelope;
    const secondOffset = (random() * 2 - 1) * jitter * 0.45 * jitterEnvelope;
    nodes.push(
      addVectors(
        center,
        scaleVector(firstPerpendicular, firstOffset),
        scaleVector(secondPerpendicular, secondOffset)
      )
    );
  }

  nodes[0] = [...start];
  nodes[nodes.length - 1] = [...end];
  return nodes;
}

function getPerpendicularDirections(direction: Vector3): [Vector3, Vector3] {
  let firstPerpendicular = crossVectors(direction, [0, 1, 0]);
  if (vectorLength(firstPerpendicular) < 0.00001) {
    firstPerpendicular = crossVectors(direction, [1, 0, 0]);
  }
  firstPerpendicular = normalizeVector(firstPerpendicular);
  return [firstPerpendicular, normalizeVector(crossVectors(direction, firstPerpendicular))];
}

function makeDeterministicRandom(randomSeed: number): () => number {
  let randomState = randomSeed >>> 0;
  return () => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 0x100000000;
  };
}

function mixVectors(start: Vector3, end: Vector3, progress: number): Vector3 {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
    start[2] + (end[2] - start[2]) * progress
  ];
}

function addVectors(...vectors: readonly Vector3[]): Vector3 {
  const sum: Vector3 = [0, 0, 0];
  for (const vector of vectors) {
    sum[0] += vector[0];
    sum[1] += vector[1];
    sum[2] += vector[2];
  }
  return sum;
}

function subtractVectors(left: Vector3, right: Vector3): Vector3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function scaleVector(vector: Vector3, scale: number): Vector3 {
  return [vector[0] * scale, vector[1] * scale, vector[2] * scale];
}

function normalizeVector(vector: Vector3): Vector3 {
  const length = vectorLength(vector);
  return length > 0 ? scaleVector(vector, 1 / length) : [0, 1, 0];
}

function vectorLength(vector: Vector3): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

function crossVectors(left: Vector3, right: Vector3): Vector3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0]
  ];
}
