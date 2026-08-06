// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  VolumetricFireEmitter,
  VolumetricFireSimulationStepOptions
} from '@luma.gl/experimental';

export const VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS = {
  minimum: [-6, 0, -5],
  maximum: [6, 12, 5]
} as const;

export const VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS = 1 / 60;
export const VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME = 3;

export type VolumetricFireForgeBox = {
  id: string;
  center: readonly [number, number, number];
  halfSize: readonly [number, number, number];
  color: readonly [number, number, number];
  emissiveColor: readonly [number, number, number];
  emissiveTopOnly?: boolean;
  surfaceTreatment?: 'refractory-masonry';
  metallic: number;
  roughness: number;
};

/**
 * Authored solid forge pieces. The renderer and obstacle-volume upload both consume this array so
 * visible geometry cannot drift away from the simulation collision mask.
 */
export const VOLUMETRIC_FIRE_FORGE_BOXES: readonly VolumetricFireForgeBox[] = [
  {
    id: 'hearth-floor',
    center: [0, 0.1, 0],
    halfSize: [5.8, 0.1, 4.8],
    color: [0.042, 0.046, 0.054],
    emissiveColor: [0.0025, 0.001, 0.0004],
    metallic: 0.05,
    roughness: 0.94
  },
  {
    id: 'rear-refractory-wall',
    center: [0, 1.65, 4.55],
    halfSize: [5.8, 1.65, 0.25],
    color: [0.082, 0.05, 0.034],
    emissiveColor: [0.004, 0.0015, 0.00045],
    surfaceTreatment: 'refractory-masonry',
    metallic: 0.03,
    roughness: 0.92
  },
  {
    id: 'left-forge-cheek',
    center: [-5.55, 1.6, 1.3],
    halfSize: [0.25, 1.6, 3.25],
    color: [0.071, 0.044, 0.032],
    emissiveColor: [0.0025, 0.001, 0.0004],
    surfaceTreatment: 'refractory-masonry',
    metallic: 0.04,
    roughness: 0.9
  },
  {
    id: 'right-forge-cheek',
    center: [5.55, 1.6, 1.3],
    halfSize: [0.25, 1.6, 3.25],
    color: [0.071, 0.044, 0.032],
    emissiveColor: [0.0025, 0.001, 0.0004],
    surfaceTreatment: 'refractory-masonry',
    metallic: 0.04,
    roughness: 0.9
  },
  {
    id: 'front-left-lip',
    center: [-4.15, 0.7, -4.5],
    halfSize: [1.65, 0.7, 0.3],
    color: [0.058, 0.053, 0.05],
    emissiveColor: [0.004, 0.0015, 0.0005],
    metallic: 0.38,
    roughness: 0.64
  },
  {
    id: 'front-right-lip',
    center: [4.15, 0.7, -4.5],
    halfSize: [1.65, 0.7, 0.3],
    color: [0.058, 0.053, 0.05],
    emissiveColor: [0.004, 0.0015, 0.0005],
    metallic: 0.38,
    roughness: 0.64
  },
  {
    id: 'left-front-burner',
    center: [-1.7, 0.55, -0.9],
    halfSize: [0.55, 0.45, 0.55],
    color: [0.042, 0.046, 0.052],
    emissiveColor: [1.6, 0.65, 0.14],
    emissiveTopOnly: true,
    metallic: 0.8,
    roughness: 0.38
  },
  {
    id: 'right-front-burner',
    center: [1.7, 0.55, -0.9],
    halfSize: [0.55, 0.45, 0.55],
    color: [0.042, 0.046, 0.052],
    emissiveColor: [1.6, 0.65, 0.14],
    emissiveTopOnly: true,
    metallic: 0.8,
    roughness: 0.38
  },
  {
    id: 'left-rear-burner',
    center: [-1.3, 0.55, 1.1],
    halfSize: [0.55, 0.45, 0.55],
    color: [0.042, 0.046, 0.052],
    emissiveColor: [1.6, 0.65, 0.14],
    emissiveTopOnly: true,
    metallic: 0.8,
    roughness: 0.38
  },
  {
    id: 'right-rear-burner',
    center: [1.3, 0.55, 1.1],
    halfSize: [0.55, 0.45, 0.55],
    color: [0.042, 0.046, 0.052],
    emissiveColor: [1.6, 0.65, 0.14],
    emissiveTopOnly: true,
    metallic: 0.8,
    roughness: 0.38
  }
] as const;

export const VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS = [
  {
    position: [0.358333, 0.098333, 0.41],
    radius: 0.055,
    density: 0.52,
    temperature: 2.8,
    fuel: 2.1,
    rate: 1,
    velocity: [0.12, 1.8, -0.05],
    impulse: 1.15
  },
  {
    position: [0.641667, 0.098333, 0.41],
    radius: 0.055,
    density: 0.52,
    temperature: 2.8,
    fuel: 2.1,
    rate: 1,
    velocity: [-0.12, 1.8, -0.05],
    impulse: 1.15
  },
  {
    position: [0.391667, 0.098333, 0.61],
    radius: 0.06,
    density: 0.58,
    temperature: 3.05,
    fuel: 2.35,
    rate: 1,
    velocity: [0.16, 1.9, 0.08],
    impulse: 1.2
  },
  {
    position: [0.608333, 0.098333, 0.61],
    radius: 0.06,
    density: 0.58,
    temperature: 3.05,
    fuel: 2.35,
    rate: 1,
    velocity: [-0.16, 1.9, 0.08],
    impulse: 1.2
  }
] as const satisfies readonly VolumetricFireEmitter[];

/** Visible flame centers used by click picking and distance-aware flare audio. */
export const VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS =
  VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS.map(emitter => {
    const {minimum, maximum} = VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS;
    return [
      minimum[0] + emitter.position[0] * (maximum[0] - minimum[0]),
      minimum[1] + emitter.position[1] * (maximum[1] - minimum[1]) + 0.55,
      minimum[2] + emitter.position[2] * (maximum[2] - minimum[2])
    ] as const;
  });

type VolumetricFireForgeSimulationSettings = Omit<
  VolumetricFireSimulationStepOptions,
  'deltaTime' | 'time' | 'emitters' | 'reset'
>;

export type VolumetricFireForgePreset = {
  id: string;
  label: string;
  description: string;
  emitters: readonly VolumetricFireEmitter[];
  simulation: VolumetricFireForgeSimulationSettings;
};

export const VOLUMETRIC_FIRE_FORGE_PRESETS = [
  {
    id: 'foundry',
    label: 'Foundry',
    description: 'Stable burner plumes with rolling smoke and readable flame structure.',
    emitters: VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS,
    simulation: {
      buoyancy: 5.8,
      smokeWeight: 0.54,
      turbulence: 1.55,
      vorticity: 2.1,
      velocityDissipation: 0.992,
      densityDissipation: 0.993,
      temperatureDissipation: 0.987,
      fuelDissipation: 0.995,
      reactionRate: 2.4,
      heatRelease: 2.8,
      smokeYield: 0.74,
      cooling: 0.34,
      boundaryDamping: 0.25,
      noiseScale: 7.2
    }
  },
  {
    id: 'blast',
    label: 'Blast Furnace',
    description: 'A hotter, faster forge with hard turbulence and a towering HDR core.',
    emitters: VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS.map(emitter => ({
      ...emitter,
      density: emitter.density * 1.18,
      temperature: emitter.temperature * 1.32,
      fuel: emitter.fuel * 1.28,
      rate: 1.22,
      impulse: emitter.impulse * 1.3
    })),
    simulation: {
      buoyancy: 7.4,
      smokeWeight: 0.48,
      turbulence: 2.35,
      vorticity: 3,
      velocityDissipation: 0.994,
      densityDissipation: 0.995,
      temperatureDissipation: 0.99,
      fuelDissipation: 0.996,
      reactionRate: 3.15,
      heatRelease: 3.6,
      smokeYield: 0.82,
      cooling: 0.29,
      boundaryDamping: 0.28,
      noiseScale: 8.4
    }
  },
  {
    id: 'smolder',
    label: 'Smolder',
    description: 'Heavy smoke, deep orange flame pockets, and slower furnace circulation.',
    emitters: VOLUMETRIC_FIRE_FORGE_BURNER_EMITTERS.map(emitter => ({
      ...emitter,
      density: emitter.density * 1.55,
      temperature: emitter.temperature * 0.72,
      fuel: emitter.fuel * 0.84,
      rate: 0.82,
      impulse: emitter.impulse * 0.74
    })),
    simulation: {
      buoyancy: 4.2,
      smokeWeight: 0.76,
      turbulence: 1.1,
      vorticity: 1.75,
      velocityDissipation: 0.989,
      densityDissipation: 0.997,
      temperatureDissipation: 0.981,
      fuelDissipation: 0.992,
      reactionRate: 1.65,
      heatRelease: 2.05,
      smokeYield: 1.18,
      cooling: 0.42,
      boundaryDamping: 0.22,
      noiseScale: 5.8
    }
  }
] as const satisfies readonly VolumetricFireForgePreset[];

export type VolumetricFireForgeFixedStepResult = {
  stepCount: number;
  accumulatorSeconds: number;
  droppedSeconds: number;
};

/** Advances wall-clock time while discarding backlog beyond three simulation steps. */
export function advanceVolumetricFireForgeFixedStep(
  accumulatorSeconds: number,
  frameDeltaSeconds: number
): VolumetricFireForgeFixedStepResult {
  const safeAccumulatorSeconds =
    Number.isFinite(accumulatorSeconds) && accumulatorSeconds > 0 ? accumulatorSeconds : 0;
  const safeFrameDeltaSeconds =
    Number.isFinite(frameDeltaSeconds) && frameDeltaSeconds > 0 ? frameDeltaSeconds : 0;
  const availableSeconds = safeAccumulatorSeconds + safeFrameDeltaSeconds;
  const maximumAccumulatedSeconds =
    VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS * VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME;
  const clampedSeconds = Math.min(availableSeconds, maximumAccumulatedSeconds);
  const stepCount = Math.min(
    VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME,
    Math.floor(
      (clampedSeconds + Number.EPSILON * maximumAccumulatedSeconds) /
        VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS
    )
  );

  return {
    stepCount,
    accumulatorSeconds: clampedSeconds - stepCount * VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS,
    droppedSeconds: availableSeconds - clampedSeconds
  };
}

/** Creates an x-major r8unorm collision mask from the same boxes drawn by the example. */
export function makeObstacleVolumeData(dimensions: readonly [number, number, number]): Uint8Array {
  for (const dimension of dimensions) {
    if (!Number.isInteger(dimension) || dimension <= 0) {
      throw new Error('Obstacle volume dimensions must be positive integers.');
    }
  }

  const [width, height, depth] = dimensions;
  const obstacleData = new Uint8Array(width * height * depth);
  const {minimum, maximum} = VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS;
  const worldSize = [
    maximum[0] - minimum[0],
    maximum[1] - minimum[1],
    maximum[2] - minimum[2]
  ] as const;

  for (let depthIndex = 0; depthIndex < depth; depthIndex++) {
    const worldZ = minimum[2] + ((depthIndex + 0.5) / depth) * worldSize[2];
    for (let heightIndex = 0; heightIndex < height; heightIndex++) {
      const worldY = minimum[1] + ((heightIndex + 0.5) / height) * worldSize[1];
      for (let widthIndex = 0; widthIndex < width; widthIndex++) {
        const worldX = minimum[0] + ((widthIndex + 0.5) / width) * worldSize[0];
        if (isInsideForgeBox(worldX, worldY, worldZ)) {
          const voxelIndex = widthIndex + width * (heightIndex + height * depthIndex);
          obstacleData[voxelIndex] = 255;
        }
      }
    }
  }

  return obstacleData;
}

function isInsideForgeBox(worldX: number, worldY: number, worldZ: number): boolean {
  return VOLUMETRIC_FIRE_FORGE_BOXES.some(
    box =>
      Math.abs(worldX - box.center[0]) <= box.halfSize[0] &&
      Math.abs(worldY - box.center[1]) <= box.halfSize[1] &&
      Math.abs(worldZ - box.center[2]) <= box.halfSize[2]
  );
}
