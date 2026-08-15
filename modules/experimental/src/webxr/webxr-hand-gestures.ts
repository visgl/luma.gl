// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WebXRHandJointState, WebXRHandTrackingState} from './webxr-hand-tracking';

export type WebXRHandPinchProps = {
  thumbJointName?: XRHandJoint;
  fingerJointName?: XRHandJoint;
  activeDistance?: number;
  strengthDistance?: number;
};

export type WebXRHandPinchState = {
  inputSource: XRInputSource;
  handedness: XRHandedness;
  thumbJoint: WebXRHandJointState;
  fingerJoint: WebXRHandJointState;
  distance: number;
  pinchActive: boolean;
  strength: number;
  position: [number, number, number];
};

/** Returns a simple thumb-to-index pinch gesture state for one tracked hand. */
export function getWebXRHandPinch(
  handState: WebXRHandTrackingState,
  props: WebXRHandPinchProps = {}
): WebXRHandPinchState | null {
  const thumbJoint = getHandJoint(handState, props.thumbJointName || 'thumb-tip');
  const fingerJoint = getHandJoint(handState, props.fingerJointName || 'index-finger-tip');
  if (!thumbJoint?.matrix || !fingerJoint?.matrix) {
    return null;
  }

  const thumbPosition = getMatrixPosition(thumbJoint.matrix);
  const fingerPosition = getMatrixPosition(fingerJoint.matrix);
  const distance = getDistance(thumbPosition, fingerPosition);
  const activeDistance = props.activeDistance ?? 0.025;
  const strengthDistance = Math.max(props.strengthDistance ?? 0.07, activeDistance);
  const strength =
    strengthDistance === activeDistance
      ? Number(distance <= activeDistance)
      : clamp((strengthDistance - distance) / (strengthDistance - activeDistance), 0, 1);

  return {
    inputSource: handState.inputSource,
    handedness: handState.handedness,
    thumbJoint,
    fingerJoint,
    distance,
    pinchActive: distance <= activeDistance,
    strength,
    position: [
      (thumbPosition[0] + fingerPosition[0]) * 0.5,
      (thumbPosition[1] + fingerPosition[1]) * 0.5,
      (thumbPosition[2] + fingerPosition[2]) * 0.5
    ]
  };
}

function getHandJoint(
  handState: WebXRHandTrackingState,
  jointName: XRHandJoint
): WebXRHandJointState | null {
  return handState.joints.find(joint => joint.jointName === jointName) || null;
}

function getMatrixPosition(matrix: Float32Array): [number, number, number] {
  return [matrix[12] || 0, matrix[13] || 0, matrix[14] || 0];
}

function getDistance(a: [number, number, number], b: [number, number, number]): number {
  const deltaX = a[0] - b[0];
  const deltaY = a[1] - b[1];
  const deltaZ = a[2] - b[2];
  return Math.hypot(deltaX, deltaY, deltaZ);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
