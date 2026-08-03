// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getCanyonCenterX, getCanyonTerrainHeight} from './canyon-data';

export const CANYON_CAMERA_FIELD_OF_VIEW = Math.PI / 3.15;
export const CANYON_CAMERA_NEAR_PLANE = 1;
export const CANYON_CAMERA_FAR_PLANE = 7000;

export type CanyonVector3 = [number, number, number];

export type CanyonCameraPose = {
  eye: CanyonVector3;
  target: CanyonVector3;
  duration: number;
  shot: string;
};

export type CanyonCameraRoute = {
  poses: readonly CanyonCameraPose[];
  duration: number;
};

export type CanyonCameraSample = CanyonCameraPose & {
  progress: number;
};

/** Builds a closed cinematic path that follows the canyon before climbing above its rim. */
export function makeCanyonCameraRoute(): CanyonCameraRoute {
  const poses: CanyonCameraPose[] = [
    makeRoutePose(-1780, 320, 80, -1340, 0, 220, 5.5, 'desert threshold'),
    makeRoutePose(-1380, -40, 145, -1040, 10, 78, 5, 'canyon ingress'),
    makeRoutePose(-920, 28, 88, -610, -16, 70, 4.6, 'first narrows'),
    makeRoutePose(-430, -24, 76, -80, 22, 72, 4.8, 'strata passage'),
    makeRoutePose(90, 34, 82, 430, -28, 78, 4.8, 'river bend'),
    makeRoutePose(610, -42, 105, 930, 24, 128, 4.6, 'cliff ascent'),
    makeRoutePose(1080, 150, 160, 1360, -20, 170, 5.2, 'rim climb'),
    makeRoutePose(1510, -360, 180, 1110, 20, 180, 6.4, 'great canyon reveal'),
    makeRoutePose(1760, 520, 240, 1020, 0, 160, 7.2, 'high desert return')
  ];
  return Object.freeze({
    poses: Object.freeze(poses),
    duration: poses.reduce((total, pose) => total + pose.duration, 0)
  });
}

/** Samples the guided loop with a zero-velocity smootherstep at every authored pose. */
export function getCanyonGuidedCameraSample(
  route: CanyonCameraRoute,
  timeSeconds: number
): CanyonCameraSample {
  const wrappedTime = wrap(timeSeconds, route.duration);
  let segmentTime = wrappedTime;
  for (let poseIndex = 0; poseIndex < route.poses.length; poseIndex++) {
    const start = route.poses[poseIndex];
    if (segmentTime <= start.duration) {
      const end = route.poses[(poseIndex + 1) % route.poses.length];
      const amount = smootherstep(segmentTime / start.duration);
      return {
        eye: mixVector3(start.eye, end.eye, amount),
        target: mixVector3(start.target, end.target, amount),
        duration: start.duration,
        shot: start.shot,
        progress: wrappedTime / route.duration
      };
    }
    segmentTime -= start.duration;
  }
  const first = route.poses[0];
  return {...first, progress: 0};
}

/** Constrains manual navigation to a route position plus bounded look offsets. */
export function getConstrainedCanyonCameraSample(
  route: CanyonCameraRoute,
  progress: number,
  yawOffset: number,
  pitchOffset: number
): CanyonCameraSample {
  const constrainedProgress = clamp(progress, 0, 0.999_999);
  const base = getCanyonGuidedCameraSample(route, constrainedProgress * route.duration);
  const direction = subtractVector3(base.target, base.eye);
  const distance = Math.max(1, getVectorLength(direction));
  const baseYaw = Math.atan2(direction[0], direction[2]);
  const basePitch = Math.asin(clamp(direction[1] / distance, -1, 1));
  const yaw = baseYaw + clamp(yawOffset, -0.82, 0.82);
  const pitch = clamp(basePitch + clamp(pitchOffset, -0.4, 0.4), -0.48, 0.52);
  const lookDistance = Math.max(260, Math.min(520, distance));
  const horizontalScale = Math.cos(pitch) * lookDistance;
  const target: CanyonVector3 = [
    base.eye[0] + Math.sin(yaw) * horizontalScale,
    base.eye[1] + Math.sin(pitch) * lookDistance,
    base.eye[2] + Math.cos(yaw) * horizontalScale
  ];
  return {...base, target, progress: constrainedProgress, shot: 'manual canyon track'};
}

/** Returns six normalized inward planes for the selector's sphere-frustum test. */
export function getCanyonFrustumPlanes(
  eye: CanyonVector3,
  target: CanyonVector3,
  aspect: number,
  fieldOfView = CANYON_CAMERA_FIELD_OF_VIEW,
  nearPlane = CANYON_CAMERA_NEAR_PLANE,
  farPlane = CANYON_CAMERA_FAR_PLANE
): Float32Array {
  if (!(aspect > 0) || !(fieldOfView > 0) || !(nearPlane > 0) || !(farPlane > nearPlane)) {
    throw new Error('Canyon frustum requires positive camera dimensions and far > near');
  }
  const forward = normalizeVector3(subtractVector3(target, eye));
  const right = normalizeVector3(crossVector3([0, 1, 0], forward));
  const up = normalizeVector3(crossVector3(forward, right));
  const nearCenter = addScaledVector3(eye, forward, nearPlane);
  const farCenter = addScaledVector3(eye, forward, farPlane);
  const nearHalfHeight = Math.tan(fieldOfView / 2) * nearPlane;
  const nearHalfWidth = nearHalfHeight * aspect;
  const farHalfHeight = Math.tan(fieldOfView / 2) * farPlane;
  const farHalfWidth = farHalfHeight * aspect;

  const nearTopLeft = offsetCorner(nearCenter, right, up, -nearHalfWidth, nearHalfHeight);
  const nearTopRight = offsetCorner(nearCenter, right, up, nearHalfWidth, nearHalfHeight);
  const nearBottomLeft = offsetCorner(nearCenter, right, up, -nearHalfWidth, -nearHalfHeight);
  const nearBottomRight = offsetCorner(nearCenter, right, up, nearHalfWidth, -nearHalfHeight);
  const farTopLeft = offsetCorner(farCenter, right, up, -farHalfWidth, farHalfHeight);
  const farBottomLeft = offsetCorner(farCenter, right, up, -farHalfWidth, -farHalfHeight);
  const farBottomRight = offsetCorner(farCenter, right, up, farHalfWidth, -farHalfHeight);
  const insidePoint = addScaledVector3(eye, forward, (nearPlane + farPlane) / 2);

  return new Float32Array([
    ...makeInwardPlane(eye, nearBottomLeft, nearTopLeft, insidePoint),
    ...makeInwardPlane(eye, nearTopRight, nearBottomRight, insidePoint),
    ...makeInwardPlane(eye, nearBottomRight, nearBottomLeft, insidePoint),
    ...makeInwardPlane(eye, nearTopLeft, nearTopRight, insidePoint),
    ...makeInwardPlane(nearBottomLeft, nearBottomRight, nearTopRight, insidePoint),
    ...makeInwardPlane(farBottomRight, farBottomLeft, farTopLeft, insidePoint)
  ]);
}

export function getCanyonProjectionScale(viewportHeightPixels: number): number {
  return viewportHeightPixels / (2 * Math.tan(CANYON_CAMERA_FIELD_OF_VIEW / 2));
}

function makeRoutePose(
  eyeZ: number,
  eyeLateralOffset: number,
  eyeAltitude: number,
  targetZ: number,
  targetLateralOffset: number,
  targetAltitude: number,
  duration: number,
  shot: string
): CanyonCameraPose {
  const eyeCenterX = getCanyonCenterX(eyeZ);
  const targetCenterX = getCanyonCenterX(targetZ);
  const eyeX = eyeCenterX + eyeLateralOffset;
  const targetX = targetCenterX + targetLateralOffset;
  return {
    eye: [eyeX, getCanyonTerrainHeight(eyeX, eyeZ) + eyeAltitude, eyeZ],
    target: [targetX, getCanyonTerrainHeight(targetX, targetZ) + targetAltitude, targetZ],
    duration,
    shot
  };
}

function makeInwardPlane(
  pointA: CanyonVector3,
  pointB: CanyonVector3,
  pointC: CanyonVector3,
  insidePoint: CanyonVector3
): [number, number, number, number] {
  let normal = normalizeVector3(
    crossVector3(subtractVector3(pointB, pointA), subtractVector3(pointC, pointA))
  );
  let distance = -dotVector3(normal, pointA);
  if (dotVector3(normal, insidePoint) + distance < 0) {
    normal = [-normal[0], -normal[1], -normal[2]];
    distance = -distance;
  }
  return [normal[0], normal[1], normal[2], distance];
}

function offsetCorner(
  center: CanyonVector3,
  right: CanyonVector3,
  up: CanyonVector3,
  rightAmount: number,
  upAmount: number
): CanyonVector3 {
  return [
    center[0] + right[0] * rightAmount + up[0] * upAmount,
    center[1] + right[1] * rightAmount + up[1] * upAmount,
    center[2] + right[2] * rightAmount + up[2] * upAmount
  ];
}

function mixVector3(start: CanyonVector3, end: CanyonVector3, amount: number): CanyonVector3 {
  return [
    mix(start[0], end[0], amount),
    mix(start[1], end[1], amount),
    mix(start[2], end[2], amount)
  ];
}

function addScaledVector3(
  vector: CanyonVector3,
  direction: CanyonVector3,
  scale: number
): CanyonVector3 {
  return [
    vector[0] + direction[0] * scale,
    vector[1] + direction[1] * scale,
    vector[2] + direction[2] * scale
  ];
}

function subtractVector3(left: CanyonVector3, right: CanyonVector3): CanyonVector3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function crossVector3(left: CanyonVector3, right: CanyonVector3): CanyonVector3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0]
  ];
}

function dotVector3(left: CanyonVector3, right: CanyonVector3): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function getVectorLength(vector: CanyonVector3): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

function normalizeVector3(vector: CanyonVector3): CanyonVector3 {
  const length = getVectorLength(vector);
  if (length < 1e-9) {
    throw new Error('Canyon camera vectors must have nonzero length');
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function smootherstep(value: number): number {
  const amount = clamp(value, 0, 1);
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function wrap(value: number, range: number): number {
  return ((value % range) + range) % range;
}

function mix(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
