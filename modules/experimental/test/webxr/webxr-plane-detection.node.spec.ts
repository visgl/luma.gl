// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getWebXRPlaneDetectionSessionInit,
  WebXRPlaneDetectionManager
} from '../../src/webxr/webxr-plane-detection';

type MockXRSession = XRSession & {
  roomCaptureCount: number;
};

test('webxr#WebXRPlaneDetectionManager resolves plane poses, polygons, and frame diffs', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const firstPlane = makeMockXRPlane({
    orientation: 'horizontal',
    lastChangedTime: 1,
    semanticLabel: 'floor',
    polygon: [
      makeMockDOMPoint(-1, 0, -1),
      makeMockDOMPoint(1, 0, -1),
      makeMockDOMPoint(1, 0, 1),
      makeMockDOMPoint(-1, 0, 1)
    ]
  });
  const secondPlane = makeMockXRPlane({
    orientation: 'vertical',
    lastChangedTime: 2,
    semanticLabel: 'wall'
  });
  const firstPose = makeMockXRPose([1, 0, 0, 0]);
  const secondPose = makeMockXRPose([2, 0, 0, 0]);
  const session = makeMockXRSession();
  const frame = makeMockXRFrame(
    session,
    new Set([firstPlane, secondPlane]),
    new Map([
      [firstPlane.planeSpace, firstPose],
      [secondPlane.planeSpace, secondPose]
    ])
  );
  const updatedFirstPlane = makeMockXRPlane({
    planeSpace: firstPlane.planeSpace,
    orientation: 'horizontal',
    lastChangedTime: 3,
    semanticLabel: 'floor'
  });
  const nextFrame = makeMockXRFrame(
    session,
    new Set([updatedFirstPlane]),
    new Map([[updatedFirstPlane.planeSpace, firstPose]])
  );
  const manager = new WebXRPlaneDetectionManager();

  manager.setSession(session, referenceSpace);
  const planeState = manager.getPlaneDetectionState(frame);
  const nextPlaneState = manager.getPlaneDetectionState(nextFrame);

  testCase.equal(manager.session, session, 'retains active session');
  testCase.equal(manager.referenceSpace, referenceSpace, 'retains app reference space');
  testCase.equal(planeState?.xrFrame, frame, 'retains source frame');
  testCase.equal(planeState?.session, session, 'retains source session');
  testCase.equal(planeState?.planes.length, 2, 'resolves all detected planes with poses');
  testCase.equal(planeState?.added.length, 2, 'initial planes are added');
  testCase.equal(planeState?.updated.length, 0, 'initial planes are not updated');
  testCase.equal(planeState?.removed.length, 0, 'initial planes are not removed');
  testCase.equal(planeState?.planes[0]?.xrPlane, firstPlane, 'retains raw plane');
  testCase.equal(planeState?.planes[0]?.pose, firstPose, 'retains plane pose');
  testCase.equal(planeState?.planes[0]?.matrix, firstPose.transform.matrix, 'exposes pose matrix');
  testCase.deepEqual(
    planeState?.planes[0]?.polygon,
    [
      [-1, 0, -1],
      [1, 0, -1],
      [1, 0, 1],
      [-1, 0, 1]
    ],
    'converts polygon points'
  );
  testCase.equal(planeState?.planes[0]?.orientation, 'horizontal', 'exposes orientation');
  testCase.equal(planeState?.planes[0]?.semanticLabel, 'floor', 'exposes semantic label');
  testCase.equal(planeState?.planes[0]?.lastChangedTime, 1, 'exposes changed time');
  testCase.equal(nextPlaneState?.planes.length, 1, 'tracks next frame planes');
  testCase.equal(nextPlaneState?.added.length, 1, 'changed object identity is added');
  testCase.equal(nextPlaneState?.updated.length, 0, 'new object identity is not updated');
  testCase.equal(nextPlaneState?.removed.length, 2, 'previous plane identities are removed');

  session.dispatchEvent(new Event('end'));
  testCase.equal(manager.getPlaneDetectionState(frame), null, 'ended sessions expose no planes');
  testCase.end();
});

test('webxr#WebXRPlaneDetectionManager filters planes and tracks updates by identity', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const plane = makeMockXRPlane({
    orientation: 'horizontal',
    semanticLabel: 'table',
    lastChangedTime: 4
  });
  const verticalPlane = makeMockXRPlane({
    orientation: 'vertical',
    semanticLabel: 'wall',
    lastChangedTime: 4
  });
  const pose = makeMockXRPose([1, 0, 0, 0]);
  const session = makeMockXRSession();
  const frame = makeMockXRFrame(
    session,
    new Set([plane, verticalPlane]),
    new Map([
      [plane.planeSpace, pose],
      [verticalPlane.planeSpace, pose]
    ])
  );
  const manager = new WebXRPlaneDetectionManager({
    orientations: ['horizontal'],
    semanticLabels: ['table']
  });

  manager.setSession(session, referenceSpace);
  const planeState = manager.getPlaneDetectionState(frame);
  (plane as {lastChangedTime: number}).lastChangedTime = 5;
  const updatedPlaneState = manager.getPlaneDetectionState(frame);

  testCase.equal(planeState?.planes.length, 1, 'keeps matching planes');
  testCase.equal(planeState?.planes[0]?.xrPlane, plane, 'keeps requested plane');
  testCase.equal(updatedPlaneState?.updated.length, 1, 'same plane identity can be updated');
  testCase.equal(updatedPlaneState?.updated[0]?.lastChangedTime, 5, 'captures updated timestamp');
  testCase.end();
});

test('webxr#WebXRPlaneDetectionManager handles unsupported frames and room capture', async testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession();
  const otherSession = makeMockXRSession();
  const manager = new WebXRPlaneDetectionManager();

  try {
    manager.setSession(session, null);
    testCase.fail('missing reference space should reject');
  } catch (error) {
    testCase.match(
      error instanceof Error ? error.message : '',
      /reference space/,
      'reports missing reference space'
    );
  }

  manager.setSession(session, referenceSpace);
  testCase.equal(
    manager.getPlaneDetectionState({session} as XRFrame),
    null,
    'frames without detected planes expose no state'
  );
  testCase.throws(
    () =>
      manager.getPlaneDetectionState({
        session: otherSession,
        detectedPlanes: new Set()
      } as XRFrame),
    /different XRSession/,
    'rejects foreign frames'
  );
  testCase.equal(await manager.initiateRoomCapture(), true, 'initiates room capture');
  testCase.equal(session.roomCaptureCount, 1, 'forwards room capture to session');
  testCase.deepEqual(
    getWebXRPlaneDetectionSessionInit({required: true}),
    {requiredFeatures: ['plane-detection']},
    'builds required plane-detection session init'
  );
  testCase.deepEqual(
    getWebXRPlaneDetectionSessionInit(),
    {optionalFeatures: ['plane-detection']},
    'builds optional plane-detection session init'
  );

  manager.clearSession();
  testCase.equal(await manager.initiateRoomCapture(), false, 'reports missing room capture');
  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRSession(): MockXRSession {
  return Object.assign(new EventTarget(), {
    enabledFeatures: ['plane-detection'],
    inputSources: [],
    roomCaptureCount: 0,
    async initiateRoomCapture(): Promise<void> {
      this.roomCaptureCount++;
    }
  }) as MockXRSession;
}

function makeMockXRFrame(
  session: XRSession,
  detectedPlanes: XRPlaneSet,
  poses: Map<XRSpace, XRPose>
): XRFrame {
  return {
    session,
    detectedPlanes,
    getPose(space: XRSpace): XRPose | undefined {
      return poses.get(space);
    }
  } as XRFrame;
}

function makeMockXRPlane(
  props: Partial<XRPlane> & {
    orientation: XRPlaneOrientation;
    lastChangedTime: number;
  }
): XRPlane {
  return {
    planeSpace: props.planeSpace || ({} as XRSpace),
    polygon: props.polygon || [
      makeMockDOMPoint(0, 0, 0),
      makeMockDOMPoint(1, 0, 0),
      makeMockDOMPoint(1, 0, 1)
    ],
    orientation: props.orientation,
    semanticLabel: props.semanticLabel,
    lastChangedTime: props.lastChangedTime
  } as XRPlane;
}

function makeMockXRPose(matrix: number[]): XRPose {
  return {
    transform: {
      matrix: new Float32Array(matrix),
      inverse: {matrix: new Float32Array(matrix)}
    } as XRRigidTransform
  } as XRPose;
}

function makeMockDOMPoint(x: number, y: number, z: number): DOMPointReadOnly {
  return {x, y, z, w: 1} as DOMPointReadOnly;
}
