// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WEBXR_HAND_JOINTS, WebXRHandTrackingManager} from '../../src/webxr/webxr-hand-tracking';

test('webxr#WebXRHandTrackingManager resolves batched hand joint poses and radii', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const jointSpaces = new Map<XRHandJoint, XRJointSpace>([
    ['wrist', makeMockXRJointSpace('wrist')],
    ['index-finger-tip', makeMockXRJointSpace('index-finger-tip')]
  ]);
  const hand = makeMockXRHand(jointSpaces);
  const handInputSource = makeMockXRInputSource({handedness: 'left', hand});
  const controllerInputSource = makeMockXRInputSource({handedness: 'right'});
  const session = makeMockXRSession(referenceSpace, [handInputSource, controllerInputSource]);
  const frame = {
    session,
    fillPoses(spaces: readonly XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean {
      testCase.deepEqual(spaces, Array.from(jointSpaces.values()), 'fills discovered joint spaces');
      testCase.equal(baseSpace, referenceSpace, 'fills matrices in app reference space');
      for (let jointIndex = 0; jointIndex < spaces.length; jointIndex++) {
        const matrixOffset = jointIndex * 16;
        transforms[matrixOffset] = 1;
        transforms[matrixOffset + 5] = 1;
        transforms[matrixOffset + 10] = 1;
        transforms[matrixOffset + 12] = jointIndex + 1;
        transforms[matrixOffset + 15] = 1;
      }
      return true;
    },
    fillJointRadii(spaces: readonly XRJointSpace[], radii: Float32Array): boolean {
      testCase.deepEqual(spaces, Array.from(jointSpaces.values()), 'fills radii for joint spaces');
      radii[0] = 0.01;
      radii[1] = 0.02;
      return true;
    }
  } as XRFrame;
  const manager = new WebXRHandTrackingManager();

  manager.setSession(session, referenceSpace);
  const handStates = manager.getHandsState(frame);

  testCase.equal(WEBXR_HAND_JOINTS.length, 25, 'exports the standard WebXR joint list');
  testCase.equal(handStates?.length, 1, 'filters non-hand input sources');
  testCase.equal(handStates?.[0]?.inputSource, handInputSource, 'retains input source');
  testCase.equal(handStates?.[0]?.handedness, 'left', 'retains handedness');
  testCase.equal(handStates?.[0]?.hand, hand, 'retains hand object');
  testCase.equal(handStates?.[0]?.joints.length, 2, 'keeps discovered joints');
  testCase.equal(handStates?.[0]?.joints[0]?.jointName, 'wrist', 'keeps joint ordering');
  testCase.deepEqual(
    Array.from(handStates?.[0]?.joints[0]?.matrix || []),
    Array.from(handStates?.[0]?.matrices.subarray(0, 16) || []),
    'joint matrix references batched matrix storage'
  );
  testCase.ok(
    Math.abs((handStates?.[0]?.joints[0]?.radius || 0) - 0.01) < 1e-6,
    'keeps wrist radius'
  );
  testCase.equal(handStates?.[0]?.joints[1]?.matrix?.[12], 2, 'keeps index-tip matrix');
  testCase.ok(
    Math.abs((handStates?.[0]?.joints[1]?.radius || 0) - 0.02) < 1e-6,
    'keeps index-tip radius'
  );
  testCase.equal(handStates?.[0]?.allJointsTracked, true, 'reports complete tracked batch');

  session.dispatchEvent(new Event('end'));
  testCase.equal(manager.session, null, 'session end clears session');
  testCase.end();
});

test('webxr#WebXRHandTrackingManager falls back to getJointPose', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const wristSpace = makeMockXRJointSpace('wrist');
  const hand = makeMockXRHand(new Map([['wrist', wristSpace]]));
  const handInputSource = makeMockXRInputSource({handedness: 'right', hand});
  const session = makeMockXRSession(referenceSpace, [handInputSource]);
  const jointPose = makeMockXRJointPose([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 4, 5, 1], 0.04);
  const frame = {
    session,
    getJointPose(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose | null {
      testCase.equal(joint, wristSpace, 'queries fallback joint space');
      testCase.equal(baseSpace, referenceSpace, 'queries fallback reference space');
      return jointPose;
    }
  } as XRFrame;
  const manager = new WebXRHandTrackingManager();

  manager.setSession(session, referenceSpace);
  const handState = manager.getHandState(frame, handInputSource);

  testCase.equal(handState?.joints.length, 1, 'resolves fallback joint');
  testCase.equal(handState?.joints[0]?.pose, jointPose, 'retains fallback joint pose');
  testCase.equal(handState?.joints[0]?.matrix, jointPose.transform.matrix, 'uses fallback matrix');
  testCase.equal(handState?.joints[0]?.radius, 0.04, 'uses fallback radius');
  testCase.equal(handState?.allJointsTracked, true, 'fallback pose marks joint tracked');
  testCase.end();
});

test('webxr#WebXRHandTrackingManager handles invalid and partial hand sessions', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession(referenceSpace, []);
  const inactiveManager = new WebXRHandTrackingManager();
  const manager = new WebXRHandTrackingManager();
  const inputSource = makeMockXRInputSource({handedness: 'none'});
  const handInputSource = makeMockXRInputSource({
    handedness: 'left',
    hand: makeMockXRHand(new Map([['wrist', makeMockXRJointSpace('wrist')]]))
  });
  const frame = {
    session,
    fillPoses: () => false,
    fillJointRadii(spaces: readonly XRJointSpace[], radii: Float32Array): boolean {
      radii[0] = Number.NaN;
      return false;
    }
  } as XRFrame;

  testCase.throws(
    () => manager.setSession(session, null),
    /reference space/,
    'rejects missing app reference space'
  );
  testCase.equal(
    inactiveManager.getHandsState(frame),
    null,
    'inactive manager returns null hand snapshots'
  );

  manager.setSession(session, referenceSpace);
  testCase.equal(manager.getHandState(frame, inputSource), null, 'non-hand input returns null');
  const handState = manager.getHandState(frame, handInputSource);
  testCase.equal(handState?.joints[0]?.matrix, null, 'invalid batch matrix becomes null');
  testCase.equal(handState?.joints[0]?.radius, null, 'invalid radius becomes null');
  testCase.equal(handState?.allJointsTracked, false, 'partial hand is marked incomplete');
  testCase.throws(
    () =>
      manager.getHandsState({
        session: makeMockXRSession(referenceSpace, [])
      } as XRFrame),
    /different XRSession/,
    'rejects foreign frames'
  );

  manager.clearSession();
  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRSession(
  referenceSpace: XRReferenceSpace,
  inputSources: XRInputSource[]
): XRSession & {inputSources: XRInputSource[]} {
  return Object.assign(new EventTarget(), {
    inputSources,
    async requestReferenceSpace(): Promise<XRReferenceSpace> {
      return referenceSpace;
    }
  }) as XRSession & {inputSources: XRInputSource[]};
}

function makeMockXRInputSource(options: {handedness: XRHandedness; hand?: XRHand}): XRInputSource {
  return {
    handedness: options.handedness,
    targetRayMode: 'tracked-pointer',
    targetRaySpace: {} as XRSpace,
    profiles: options.hand ? ['generic-hand-select'] : ['generic-trigger'],
    hand: options.hand
  } as XRInputSource;
}

function makeMockXRHand(jointSpaces: Map<XRHandJoint, XRJointSpace>): XRHand {
  return {
    size: jointSpaces.size,
    get(jointName: XRHandJoint): XRJointSpace | undefined {
      return jointSpaces.get(jointName);
    },
    [Symbol.iterator](): IterableIterator<[XRHandJoint, XRJointSpace]> {
      return jointSpaces[Symbol.iterator]();
    }
  };
}

function makeMockXRJointSpace(jointName: XRHandJoint): XRJointSpace {
  return {
    jointName
  } as XRJointSpace;
}

function makeMockXRJointPose(matrix: number[], radius: number): XRJointPose {
  return {
    radius,
    transform: {
      matrix: new Float32Array(matrix),
      inverse: {matrix: new Float32Array(matrix)}
    }
  } as XRJointPose;
}
