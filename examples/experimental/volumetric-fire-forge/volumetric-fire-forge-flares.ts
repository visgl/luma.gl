// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {VolumetricFireEmitter} from '@luma.gl/experimental';

export const VOLUMETRIC_FIRE_FORGE_FLARE_SEED = 0x464f5247;
export const VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS = 0.14;
export const VOLUMETRIC_FIRE_FORGE_FLARE_DECAY_SECONDS = 2.4;

const INITIAL_FLARE_INTERVAL_SECONDS: readonly [number, number] = [3.8, 6.4];
const REPEATING_FLARE_INTERVAL_SECONDS: readonly [number, number] = [5.2, 10.8];
const AUTOMATIC_FLARE_INTENSITY: readonly [number, number] = [0.82, 1.16];

export type VolumetricFireForgeFlareSchedule = {
  seed: number;
  sequence: number;
  previousBurnerIndex: number;
  nextBurnerIndex: number;
  nextFlareTimeSeconds: number;
  nextIntensity: number;
};

export type VolumetricFireForgeBurnerProjection = {
  burnerIndex: number;
  screenX: number;
  screenY: number;
  normalizedDeviceX: number;
  normalizedDeviceY: number;
  normalizedDeviceDepth: number;
};

type SelectProjectedBurnerOptions = {
  pointerX: number;
  pointerY: number;
  viewportWidth: number;
  viewportHeight: number;
  viewProjectionMatrix: readonly number[];
  burnerWorldPositions: readonly (readonly [number, number, number])[];
  maximumDistancePixels?: number;
};

/** Creates the first repeatable, deliberately non-periodic automatic flare. */
export function makeVolumetricFireForgeFlareSchedule(
  burnerCount: number,
  seed = VOLUMETRIC_FIRE_FORGE_FLARE_SEED,
  startTimeSeconds = 0
): VolumetricFireForgeFlareSchedule {
  return makeNextSchedule(
    {
      seed,
      sequence: 0,
      previousBurnerIndex: -1,
      nextBurnerIndex: -1,
      nextFlareTimeSeconds: startTimeSeconds,
      nextIntensity: 0
    },
    burnerCount,
    INITIAL_FLARE_INTERVAL_SECONDS
  );
}

/** Consumes the scheduled event and deterministically chooses the following burner and delay. */
export function advanceVolumetricFireForgeFlareSchedule(
  schedule: VolumetricFireForgeFlareSchedule,
  burnerCount: number
): VolumetricFireForgeFlareSchedule {
  return makeNextSchedule(
    {
      ...schedule,
      sequence: schedule.sequence + 1,
      previousBurnerIndex: schedule.nextBurnerIndex
    },
    burnerCount,
    REPEATING_FLARE_INTERVAL_SECONDS
  );
}

/** Fast ignition followed by a longer, smooth combustion tail. */
export function getVolumetricFireForgeFlareEnvelope(elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    return 0;
  }
  if (elapsedSeconds < VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS) {
    const attack = elapsedSeconds / VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS;
    return attack * attack * (3 - 2 * attack);
  }

  const decay =
    (elapsedSeconds - VOLUMETRIC_FIRE_FORGE_FLARE_ATTACK_SECONDS) /
    VOLUMETRIC_FIRE_FORGE_FLARE_DECAY_SECONDS;
  if (decay >= 1) {
    return 0;
  }
  const cutoff = 1 - smoothstep(0.68, 1, decay);
  return Math.exp(-2.35 * decay) * cutoff;
}

/** Applies an individual flare to the actual solver sources, not only to postprocessing. */
export function makeVolumetricFireForgeFlaredEmitters(
  emitters: readonly VolumetricFireEmitter[],
  flareIntensities: readonly number[]
): VolumetricFireEmitter[] {
  return emitters.map((emitter, burnerIndex) => {
    const flareIntensity = Math.max(flareIntensities[burnerIndex] || 0, 0);
    if (flareIntensity === 0) {
      return emitter;
    }
    const velocity = emitter.velocity ?? [0, 1, 0];
    return {
      ...emitter,
      radius: emitter.radius * (1 + flareIntensity * 0.16),
      density: (emitter.density ?? 1) * (1 + flareIntensity * 0.72),
      temperature: (emitter.temperature ?? 1) * (1 + flareIntensity * 1.7),
      fuel: (emitter.fuel ?? 1) * (1 + flareIntensity * 2.15),
      rate: (emitter.rate ?? 1) * (1 + flareIntensity * 1.35),
      velocity: [
        velocity[0] * (1 + flareIntensity * 0.35),
        velocity[1] * (1 + flareIntensity * 0.92),
        velocity[2] * (1 + flareIntensity * 0.35)
      ],
      impulse: (emitter.impulse ?? 1) * (1 + flareIntensity * 0.88)
    };
  });
}

/** Returns the nearest on-screen burner inside a click radius, or null for empty space. */
export function selectNearestVolumetricFireForgeBurner({
  pointerX,
  pointerY,
  viewportWidth,
  viewportHeight,
  viewProjectionMatrix,
  burnerWorldPositions,
  maximumDistancePixels = 64
}: SelectProjectedBurnerOptions): VolumetricFireForgeBurnerProjection | null {
  if (
    !Number.isFinite(pointerX) ||
    !Number.isFinite(pointerY) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    viewProjectionMatrix.length < 16
  ) {
    return null;
  }

  let nearestProjection: VolumetricFireForgeBurnerProjection | null = null;
  let nearestDistanceSquared = maximumDistancePixels * maximumDistancePixels;
  for (let burnerIndex = 0; burnerIndex < burnerWorldPositions.length; burnerIndex++) {
    const projection = projectBurner(
      burnerIndex,
      burnerWorldPositions[burnerIndex],
      viewProjectionMatrix,
      viewportWidth,
      viewportHeight
    );
    if (!projection) {
      continue;
    }
    const deltaX = projection.screenX - pointerX;
    const deltaY = projection.screenY - pointerY;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    if (distanceSquared <= nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestProjection = projection;
    }
  }
  return nearestProjection;
}

function makeNextSchedule(
  schedule: VolumetricFireForgeFlareSchedule,
  burnerCount: number,
  intervalRange: readonly [number, number]
): VolumetricFireForgeFlareSchedule {
  if (!Number.isInteger(burnerCount) || burnerCount <= 0) {
    throw new Error('Fire Forge flares require at least one burner.');
  }
  const intervalRandom = advanceRandom(schedule.seed);
  const burnerRandom = advanceRandom(intervalRandom.seed);
  const intensityRandom = advanceRandom(burnerRandom.seed);
  const intervalSeconds = mix(intervalRange[0], intervalRange[1], intervalRandom.value);
  let burnerIndex = Math.min(Math.floor(burnerRandom.value * burnerCount), burnerCount - 1);
  if (burnerCount > 1 && burnerIndex === schedule.previousBurnerIndex) {
    burnerIndex =
      (burnerIndex + 1 + Math.floor(intensityRandom.value * (burnerCount - 1))) % burnerCount;
  }

  return {
    seed: intensityRandom.seed,
    sequence: schedule.sequence,
    previousBurnerIndex: schedule.previousBurnerIndex,
    nextBurnerIndex: burnerIndex,
    nextFlareTimeSeconds: schedule.nextFlareTimeSeconds + intervalSeconds,
    nextIntensity: mix(
      AUTOMATIC_FLARE_INTENSITY[0],
      AUTOMATIC_FLARE_INTENSITY[1],
      intensityRandom.value
    )
  };
}

function advanceRandom(seed: number): {seed: number; value: number} {
  const nextSeed = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
  return {seed: nextSeed, value: nextSeed / 0x100000000};
}

function projectBurner(
  burnerIndex: number,
  position: readonly [number, number, number],
  matrix: readonly number[],
  viewportWidth: number,
  viewportHeight: number
): VolumetricFireForgeBurnerProjection | null {
  const [x, y, z] = position;
  const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  const clipZ = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  if (!Number.isFinite(clipW) || clipW <= 0.0001) {
    return null;
  }
  const normalizedDeviceX = clipX / clipW;
  const normalizedDeviceY = clipY / clipW;
  const normalizedDeviceDepth = clipZ / clipW;
  if (
    !Number.isFinite(normalizedDeviceX) ||
    !Number.isFinite(normalizedDeviceY) ||
    !Number.isFinite(normalizedDeviceDepth) ||
    normalizedDeviceX < -1 ||
    normalizedDeviceX > 1 ||
    normalizedDeviceY < -1 ||
    normalizedDeviceY > 1 ||
    normalizedDeviceDepth < 0 ||
    normalizedDeviceDepth > 1
  ) {
    return null;
  }
  return {
    burnerIndex,
    screenX: (normalizedDeviceX * 0.5 + 0.5) * viewportWidth,
    screenY: (0.5 - normalizedDeviceY * 0.5) * viewportHeight,
    normalizedDeviceX,
    normalizedDeviceY,
    normalizedDeviceDepth
  };
}

function mix(minimum: number, maximum: number, amount: number): number {
  return minimum + (maximum - minimum) * amount;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return amount * amount * (3 - 2 * amount);
}
