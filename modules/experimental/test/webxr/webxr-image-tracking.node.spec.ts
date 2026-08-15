// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getWebXRImageTrackingSessionInit,
  WebXRImageTrackingManager
} from '../../src/webxr/webxr-image-tracking';

type MockXRSession = XRSession & {
  imageTrackability: readonly XRImageTrackability[];
};

test('webxr#WebXRImageTrackingManager resolves tracked image poses and frame diffs', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const firstResult = makeMockXRImageTrackingResult({
    index: 0,
    trackingState: 'tracked',
    measuredWidthInMeters: 0.25
  });
  const secondResult = makeMockXRImageTrackingResult({
    index: 1,
    trackingState: 'emulated',
    measuredWidthInMeters: 0.4
  });
  const firstPose = makeMockXRPose([1, 0, 0, 0]);
  const secondPose = makeMockXRPose([2, 0, 0, 0]);
  const session = makeMockXRSession(['trackable', 'trackable']);
  const frame = makeMockXRFrame(
    session,
    [firstResult, secondResult],
    new Map([
      [firstResult.imageSpace, firstPose],
      [secondResult.imageSpace, secondPose]
    ])
  );
  const updatedFirstResult = makeMockXRImageTrackingResult({
    imageSpace: firstResult.imageSpace,
    index: 0,
    trackingState: 'emulated',
    measuredWidthInMeters: 0.25
  });
  const nextFrame = makeMockXRFrame(
    session,
    [updatedFirstResult],
    new Map([[updatedFirstResult.imageSpace, firstPose]])
  );
  const manager = new WebXRImageTrackingManager();

  manager.setSession(session, referenceSpace);
  const imageState = manager.getImageTrackingState(frame);
  const nextImageState = manager.getImageTrackingState(nextFrame);

  testCase.equal(manager.session, session, 'retains active session');
  testCase.equal(manager.referenceSpace, referenceSpace, 'retains app reference space');
  testCase.equal(imageState?.xrFrame, frame, 'retains source frame');
  testCase.equal(imageState?.session, session, 'retains source session');
  testCase.equal(imageState?.images.length, 2, 'resolves tracked images with poses');
  testCase.equal(imageState?.added.length, 2, 'initial images are added');
  testCase.equal(imageState?.updated.length, 0, 'initial images are not updated');
  testCase.equal(imageState?.removed.length, 0, 'initial images are not removed');
  testCase.equal(imageState?.images[0]?.result, firstResult, 'retains raw result');
  testCase.equal(imageState?.images[0]?.pose, firstPose, 'retains image pose');
  testCase.equal(imageState?.images[0]?.matrix, firstPose.transform.matrix, 'exposes pose matrix');
  testCase.equal(imageState?.images[0]?.index, 0, 'exposes tracked image index');
  testCase.equal(imageState?.images[0]?.trackingState, 'tracked', 'exposes tracking state');
  testCase.equal(imageState?.images[0]?.measuredWidthInMeters, 0.25, 'exposes measured width');
  testCase.equal(nextImageState?.images.length, 1, 'tracks next frame results');
  testCase.equal(nextImageState?.added.length, 0, 'same index is not added');
  testCase.equal(nextImageState?.updated.length, 1, 'same index can be updated');
  testCase.equal(nextImageState?.removed.length, 1, 'missing index is removed');

  session.dispatchEvent(new Event('end'));
  testCase.equal(manager.getImageTrackingState(frame), null, 'ended sessions expose no images');
  testCase.end();
});

test('webxr#WebXRImageTrackingManager forwards trackability and builds session init', async testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const trackedImages = [
    {image: {} as ImageBitmap, widthInMeters: 0.2},
    {image: {} as ImageBitmap, widthInMeters: 0.4}
  ];
  const session = makeMockXRSession(['trackable', 'untrackable']);
  const manager = new WebXRImageTrackingManager({trackedImages});

  manager.setSession(session, referenceSpace);
  testCase.deepEqual(
    await manager.getImageTrackability(),
    ['trackable', 'untrackable'],
    'forwards image trackability'
  );
  testCase.deepEqual(
    getWebXRImageTrackingSessionInit({required: true, trackedImages}),
    {requiredFeatures: ['image-tracking'], trackedImages},
    'builds required image-tracking session init'
  );
  testCase.deepEqual(
    getWebXRImageTrackingSessionInit(),
    {optionalFeatures: ['image-tracking'], trackedImages: undefined},
    'builds optional image-tracking session init'
  );

  manager.clearSession();
  testCase.equal(await manager.getImageTrackability(), null, 'missing session returns null');
  testCase.end();
});

test('webxr#WebXRImageTrackingManager handles unsupported and invalid frames', testCase => {
  const referenceSpace = {} as XRReferenceSpace;
  const session = makeMockXRSession([]);
  const otherSession = makeMockXRSession([]);
  const manager = new WebXRImageTrackingManager();

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
    manager.getImageTrackingState({session} as XRFrame),
    null,
    'frames without getImageTrackingResults expose no state'
  );
  testCase.throws(
    () =>
      manager.getImageTrackingState({
        session: otherSession,
        getImageTrackingResults: () => []
      } as XRFrame),
    /different XRSession/,
    'rejects foreign frames'
  );

  manager.clearSession();
  manager.clearSession();
  testCase.equal(manager.session, null, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRSession(imageTrackability: readonly XRImageTrackability[]): MockXRSession {
  return Object.assign(new EventTarget(), {
    enabledFeatures: ['image-tracking'],
    imageTrackability,
    inputSources: [],
    async getImageTrackability(): Promise<readonly XRImageTrackability[]> {
      return this.imageTrackability;
    }
  }) as MockXRSession;
}

function makeMockXRFrame(
  session: XRSession,
  results: readonly XRImageTrackingResult[],
  poses: Map<XRSpace, XRPose>
): XRFrame {
  return {
    session,
    getImageTrackingResults(): readonly XRImageTrackingResult[] {
      return results;
    },
    getPose(space: XRSpace): XRPose | undefined {
      return poses.get(space);
    }
  } as XRFrame;
}

function makeMockXRImageTrackingResult(
  props: Partial<XRImageTrackingResult> & {
    index: number;
    trackingState: XRImageTrackingState;
    measuredWidthInMeters: number;
  }
): XRImageTrackingResult {
  return {
    imageSpace: props.imageSpace || ({} as XRSpace),
    index: props.index,
    trackingState: props.trackingState,
    measuredWidthInMeters: props.measuredWidthInMeters
  } as XRImageTrackingResult;
}

function makeMockXRPose(matrix: number[]): XRPose {
  return {
    transform: {
      matrix: new Float32Array(matrix),
      inverse: {matrix: new Float32Array(matrix)}
    } as XRRigidTransform
  } as XRPose;
}
