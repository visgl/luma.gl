// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  LIGHTSTORM_GRID_SPACING,
  LIGHTSTORM_INSTANCE_WORD_COUNT,
  type LightstormCityData
} from './lightstorm-data';

export const LIGHTSTORM_CAMERA_FIELD_OF_VIEW = Math.PI / 3.15;

type Vector3 = [number, number, number];

export type LightstormCameraPose = {
  eye: Vector3;
  target: Vector3;
  duration: number;
  shot: string;
};

export type LightstormCameraSample = LightstormCameraPose & {
  yaw: number;
  pitch: number;
  distance: number;
};

export type LightstormGuidedCameraTour = {
  poses: readonly LightstormCameraPose[];
  duration: number;
  primaryAvenue: number;
  secondaryAvenue: number;
  maximumRoofHeight: number;
  skyscraper: {
    position: Vector3;
    roofHeight: number;
  };
};

/** Builds a capacity-aware tour whose low shots stay on deterministic avenue centerlines. */
export function makeLightstormGuidedCameraTour(
  city: LightstormCityData
): LightstormGuidedCameraTour {
  const [primaryAvenue, secondaryAvenue] = getCentralAvenues(city.gridSize);
  const {maximumRoofHeight, skyscraper} = findRevealSkyscraper(city, secondaryAvenue);
  const safeAltitude = maximumRoofHeight + 8;
  const firstAvenueStart = secondaryAvenue - 68;
  const verticalDirection = Math.sign(secondaryAvenue - primaryAvenue) || 1;
  const towerDirection = Math.sign(skyscraper.position[0] - secondaryAvenue) || 1;
  const towerApproachDistance = Math.min(
    18,
    Math.max(10, Math.abs(skyscraper.position[0] - secondaryAvenue) * 0.45)
  );
  const towerRevealEye = skyscraper.position[0] - towerDirection * towerApproachDistance;
  const towerMidpoint = Math.max(18, skyscraper.roofHeight * 0.58);
  const towerCrown = Math.max(towerMidpoint + 4, skyscraper.roofHeight * 0.92);
  const avenueEyeHeight = 16;
  const avenueTargetHeight = 12;
  const skyscraperApproachEyeHeight = 12;

  const poses: LightstormCameraPose[] = [
    {
      shot: 'avenue establish',
      eye: [firstAvenueStart, safeAltitude + 10, primaryAvenue],
      target: [secondaryAvenue, avenueTargetHeight, primaryAvenue],
      duration: 3.2
    },
    {
      shot: 'elevated avenue ingress',
      eye: [firstAvenueStart, avenueEyeHeight, primaryAvenue],
      target: [secondaryAvenue - 16, avenueTargetHeight, primaryAvenue],
      duration: 3.4
    },
    {
      shot: 'first intersection',
      eye: [secondaryAvenue, avenueEyeHeight, primaryAvenue],
      target: [secondaryAvenue + 44, avenueTargetHeight, primaryAvenue],
      duration: 0.8
    },
    {
      shot: 'avenue turn',
      eye: [secondaryAvenue, avenueEyeHeight, primaryAvenue],
      target: [secondaryAvenue, avenueTargetHeight, secondaryAvenue + verticalDirection * 28],
      duration: 2.4
    },
    {
      shot: 'second intersection',
      eye: [secondaryAvenue, avenueEyeHeight, secondaryAvenue],
      target: [secondaryAvenue, avenueTargetHeight, secondaryAvenue + verticalDirection * 36],
      duration: 0.8
    },
    {
      shot: 'skyscraper turn',
      eye: [secondaryAvenue, avenueEyeHeight, secondaryAvenue],
      target: [skyscraper.position[0], avenueTargetHeight, secondaryAvenue],
      duration: 1.6
    },
    {
      shot: 'skyscraper approach',
      eye: [towerRevealEye, skyscraperApproachEyeHeight, secondaryAvenue],
      target: [
        skyscraper.position[0],
        Math.max(16, skyscraper.roofHeight * 0.48),
        skyscraper.position[2]
      ],
      duration: 1.8
    },
    {
      shot: 'vertical reveal',
      eye: [skyscraper.position[0], 10, secondaryAvenue],
      target: [skyscraper.position[0], towerMidpoint, skyscraper.position[2]],
      duration: 4
    },
    {
      shot: 'crown reveal',
      eye: [skyscraper.position[0], safeAltitude, secondaryAvenue],
      target: [skyscraper.position[0], towerCrown, skyscraper.position[2]],
      duration: 4
    },
    {
      shot: 'roof clear',
      eye: [
        skyscraper.position[0] + towerDirection * 30,
        safeAltitude + 13,
        secondaryAvenue - verticalDirection * 34
      ],
      target: [skyscraper.position[0], towerMidpoint, skyscraper.position[2]],
      duration: 5
    },
    {
      shot: 'aerial return',
      eye: [firstAvenueStart, safeAltitude + 17, primaryAvenue],
      target: [secondaryAvenue, 12, primaryAvenue],
      duration: 2
    }
  ];

  return {
    poses,
    duration: poses.reduce((duration, pose) => duration + pose.duration, 0),
    primaryAvenue,
    secondaryAvenue,
    maximumRoofHeight,
    skyscraper
  };
}

/** Samples the same explicit path used by the renderer, including deterministic loop wrapping. */
export function getLightstormGuidedCameraSample(
  tour: LightstormGuidedCameraTour,
  timeSeconds: number
): LightstormCameraSample {
  let localTime = ((timeSeconds % tour.duration) + tour.duration) % tour.duration;
  for (let poseIndex = 0; poseIndex < tour.poses.length; poseIndex++) {
    const startPose = tour.poses[poseIndex]!;
    if (localTime <= startPose.duration) {
      const endPose = tour.poses[(poseIndex + 1) % tour.poses.length]!;
      const progress = smoothstep(localTime / startPose.duration);
      const eye = mixVector3(startPose.eye, endPose.eye, progress);
      const target = mixVector3(startPose.target, endPose.target, progress);
      return makeCameraSample(eye, target, startPose.duration, startPose.shot);
    }
    localTime -= startPose.duration;
  }
  const firstPose = tour.poses[0]!;
  return makeCameraSample(firstPose.eye, firstPose.target, firstPose.duration, firstPose.shot);
}

function getCentralAvenues(gridSize: number): [number, number] {
  const centeredGridCoordinate = (gridSize - 1) / 2;
  const nearestRoadCycle = Math.round((centeredGridCoordinate - 0.5) / 12);
  const primaryAvenue = getAvenueCenter(nearestRoadCycle, centeredGridCoordinate);
  const oppositeRoadCycle = nearestRoadCycle + (primaryAvenue >= 0 ? -1 : 1);
  const secondaryAvenue = getAvenueCenter(oppositeRoadCycle, centeredGridCoordinate);
  return [primaryAvenue, secondaryAvenue];
}

function getAvenueCenter(roadCycle: number, centeredGridCoordinate: number): number {
  return (roadCycle * 12 + 0.5 - centeredGridCoordinate) * LIGHTSTORM_GRID_SPACING;
}

function findRevealSkyscraper(
  city: LightstormCityData,
  avenueCenter: number
): {maximumRoofHeight: number; skyscraper: LightstormGuidedCameraTour['skyscraper']} {
  let maximumRoofHeight = 0;
  let bestScore = -Infinity;
  let skyscraper: LightstormGuidedCameraTour['skyscraper'] | null = null;
  const centralExtent = Math.min(120, city.fieldHalfExtent * 0.45);
  const instanceCount = city.instances.length / LIGHTSTORM_INSTANCE_WORD_COUNT;

  for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
    const wordOffset = instanceIndex * LIGHTSTORM_INSTANCE_WORD_COUNT;
    if (city.instances[wordOffset + 11] !== 0) {
      continue;
    }
    const worldX = city.instances[wordOffset]!;
    const centerY = city.instances[wordOffset + 1]!;
    const worldZ = city.instances[wordOffset + 2]!;
    const halfHeight = city.instances[wordOffset + 5]!;
    const roofHeight = centerY + halfHeight;
    maximumRoofHeight = Math.max(maximumRoofHeight, roofHeight);

    const distanceFromAvenue = Math.abs(worldZ - avenueCenter);
    const distanceFromCenter = Math.abs(worldX);
    if (distanceFromAvenue > 6 || distanceFromCenter > centralExtent) {
      continue;
    }
    const score = roofHeight - distanceFromCenter * 0.002;
    if (score > bestScore) {
      bestScore = score;
      skyscraper = {position: [worldX, centerY, worldZ], roofHeight};
    }
  }

  if (!skyscraper) {
    // Every supported city contains central towers beside this avenue.
    throw new Error('Lightstorm guided tour requires a skyscraper beside the central avenue');
  }
  return {maximumRoofHeight, skyscraper};
}

function makeCameraSample(
  eye: Vector3,
  target: Vector3,
  duration: number,
  shot: string
): LightstormCameraSample {
  const offsetX = eye[0] - target[0];
  const offsetY = eye[1] - target[1];
  const offsetZ = eye[2] - target[2];
  const distance = Math.hypot(offsetX, offsetY, offsetZ);
  return {
    eye,
    target,
    yaw: Math.atan2(offsetX, offsetZ),
    pitch: Math.asin(offsetY / distance),
    distance,
    duration,
    shot
  };
}

function mixVector3(start: Vector3, end: Vector3, amount: number): Vector3 {
  return [
    mix(start[0], end[0], amount),
    mix(start[1], end[1], amount),
    mix(start[2], end[2], amount)
  ];
}

function smoothstep(value: number): number {
  const clampedValue = Math.max(0, Math.min(1, value));
  return clampedValue * clampedValue * (3 - 2 * clampedValue);
}

function mix(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
