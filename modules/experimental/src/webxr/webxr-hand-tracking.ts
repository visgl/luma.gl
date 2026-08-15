// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const WEBXR_HAND_JOINTS: readonly XRHandJoint[] = [
  'wrist',
  'thumb-metacarpal',
  'thumb-phalanx-proximal',
  'thumb-phalanx-distal',
  'thumb-tip',
  'index-finger-metacarpal',
  'index-finger-phalanx-proximal',
  'index-finger-phalanx-intermediate',
  'index-finger-phalanx-distal',
  'index-finger-tip',
  'middle-finger-metacarpal',
  'middle-finger-phalanx-proximal',
  'middle-finger-phalanx-intermediate',
  'middle-finger-phalanx-distal',
  'middle-finger-tip',
  'ring-finger-metacarpal',
  'ring-finger-phalanx-proximal',
  'ring-finger-phalanx-intermediate',
  'ring-finger-phalanx-distal',
  'ring-finger-tip',
  'pinky-finger-metacarpal',
  'pinky-finger-phalanx-proximal',
  'pinky-finger-phalanx-intermediate',
  'pinky-finger-phalanx-distal',
  'pinky-finger-tip'
];

export type WebXRHandTrackingState = {
  xrFrame: XRFrame;
  inputSource: XRInputSource;
  handedness: XRHandedness;
  hand: XRHand;
  joints: readonly WebXRHandJointState[];
  matrices: Float32Array;
  radii: Float32Array;
  allJointsTracked: boolean;
};

export type WebXRHandJointState = {
  jointName: XRHandJoint;
  jointSpace: XRJointSpace;
  pose: XRJointPose | null;
  matrix: Float32Array | null;
  radius: number | null;
};

/** Experimental v10 WebXR articulated hand pose helper. */
export class WebXRHandTrackingManager {
  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;

  private _sessionEndListener = () => this.clearSession();

  setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null): this {
    this.clearSession();

    if (!session) {
      return this;
    }
    if (!referenceSpace) {
      throw new Error('WebXRHandTrackingManager requires an app reference space');
    }

    this.session = session;
    this.referenceSpace = referenceSpace;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  getHandsState(
    xrFrame: XRFrame,
    inputSources: readonly XRInputSource[] = Array.from(this.session?.inputSources || [])
  ): readonly WebXRHandTrackingState[] | null {
    if (!this.session || !this.referenceSpace) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }

    return inputSources
      .map(inputSource => this.getHandState(xrFrame, inputSource))
      .filter((handState): handState is WebXRHandTrackingState => Boolean(handState));
  }

  getHandState(xrFrame: XRFrame, inputSource: XRInputSource): WebXRHandTrackingState | null {
    if (!this.session || !this.referenceSpace) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }

    const hand = inputSource.hand;
    if (!hand) {
      return null;
    }

    const jointEntries = WEBXR_HAND_JOINTS.map(jointName => ({
      jointName,
      jointSpace: hand.get(jointName)
    })).filter((entry): entry is {jointName: XRHandJoint; jointSpace: XRJointSpace} =>
      Boolean(entry.jointSpace)
    );
    if (jointEntries.length === 0) {
      return null;
    }

    const jointSpaces = jointEntries.map(entry => entry.jointSpace);
    const matrices = new Float32Array(jointEntries.length * 16);
    const radii = new Float32Array(jointEntries.length);
    const batchPoseResult = fillJointMatrices(xrFrame, jointSpaces, this.referenceSpace, matrices);
    const batchRadiusResult = fillJointRadii(xrFrame, jointSpaces, radii);
    const joints = jointEntries.map((entry, index) =>
      makeWebXRHandJointState(
        xrFrame,
        this.referenceSpace!,
        entry.jointName,
        entry.jointSpace,
        index,
        matrices,
        radii,
        batchPoseResult,
        batchRadiusResult
      )
    );

    return {
      xrFrame,
      inputSource,
      handedness: inputSource.handedness,
      hand,
      joints,
      matrices,
      radii,
      allJointsTracked: joints.every(joint => joint.matrix && joint.radius !== null)
    };
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.session = null;
    this.referenceSpace = null;
  }

  destroy(): void {
    this.clearSession();
  }
}

function makeWebXRHandJointState(
  xrFrame: XRFrame,
  referenceSpace: XRReferenceSpace,
  jointName: XRHandJoint,
  jointSpace: XRJointSpace,
  index: number,
  matrices: Float32Array,
  radii: Float32Array,
  batchPoseResult: boolean | null,
  batchRadiusResult: boolean | null
): WebXRHandJointState {
  const pose =
    batchPoseResult === null ? xrFrame.getJointPose?.(jointSpace, referenceSpace) || null : null;
  const matrixOffset = index * 16;
  const matrix =
    batchPoseResult === null
      ? pose?.transform.matrix || null
      : getMatrixSlice(matrices, matrixOffset, batchPoseResult);
  const radius =
    batchRadiusResult === null
      ? (pose?.radius ?? null)
      : Number.isFinite(radii[index]!) && !Number.isNaN(radii[index]!)
        ? radii[index]!
        : null;

  return {
    jointName,
    jointSpace,
    pose,
    matrix,
    radius
  };
}

function fillJointMatrices(
  xrFrame: XRFrame,
  jointSpaces: readonly XRJointSpace[],
  referenceSpace: XRReferenceSpace,
  matrices: Float32Array
): boolean | null {
  if (!xrFrame.fillPoses) {
    return null;
  }

  try {
    return xrFrame.fillPoses(jointSpaces, referenceSpace, matrices);
  } catch {
    return null;
  }
}

function fillJointRadii(
  xrFrame: XRFrame,
  jointSpaces: readonly XRJointSpace[],
  radii: Float32Array
): boolean | null {
  if (!xrFrame.fillJointRadii) {
    return null;
  }

  try {
    return xrFrame.fillJointRadii(jointSpaces, radii);
  } catch {
    return null;
  }
}

function getMatrixSlice(
  matrices: Float32Array,
  matrixOffset: number,
  batchPoseResult: boolean
): Float32Array | null {
  if (!batchPoseResult) {
    return null;
  }

  return matrices.subarray(matrixOffset, matrixOffset + 16);
}
