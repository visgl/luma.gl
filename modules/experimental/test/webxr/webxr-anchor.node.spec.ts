// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WebXRAnchorManager} from '../../src/webxr/webxr-anchor';

type MockXRAnchor = XRAnchor & {deleteCount: number};

test('webxr#WebXRAnchorManager creates anchors and resolves tracked poses', async testCase => {
  const session = new EventTarget() as XRSession;
  const referenceSpace = {} as XRReferenceSpace;
  const anchorSpace = {} as XRSpace;
  const anchor = makeMockXRAnchor(anchorSpace);
  const anchorPose = makeMockXRPose([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 0, -2, 1]);
  let receivedAnchorPose: XRRigidTransform | undefined;
  let receivedAnchorSpace: XRSpace | undefined;
  const frame = {
    session,
    trackedAnchors: new Set<XRAnchor>([anchor]),
    async createAnchor(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor> {
      receivedAnchorPose = pose;
      receivedAnchorSpace = space;
      return anchor;
    },
    getPose(space: XRSpace, baseSpace: XRReferenceSpace): XRPose | undefined {
      testCase.equal(space, anchor.anchorSpace, 'queries anchor space');
      testCase.equal(baseSpace, referenceSpace, 'queries app reference space');
      return anchorPose;
    }
  } as XRFrame;
  const manager = new WebXRAnchorManager();
  const createdPose = makeMockXRPose([1]);

  manager.setSession(session, referenceSpace);
  const createdAnchor = await manager.createAnchor(frame, createdPose.transform);
  const anchorState = manager.getAnchorState(frame);

  testCase.equal(createdAnchor, anchor, 'returns created anchor');
  testCase.equal(receivedAnchorPose, createdPose.transform, 'passes pose to XRFrame.createAnchor');
  testCase.equal(receivedAnchorSpace, referenceSpace, 'defaults to app reference space');
  testCase.equal(manager.anchors.has(anchor), true, 'tracks created anchor');
  testCase.equal(anchorState?.xrFrame, frame, 'retains source frame');
  testCase.equal(anchorState?.anchors.length, 1, 'resolves tracked anchor');
  testCase.equal(anchorState?.anchors[0]?.anchor, anchor, 'retains raw anchor');
  testCase.equal(anchorState?.anchors[0]?.pose, anchorPose, 'retains anchor pose');
  testCase.equal(anchorState?.anchors[0]?.matrix, anchorPose.transform.matrix, 'exposes matrix');

  manager.deleteAnchor(anchor);
  testCase.equal(anchor.deleteCount, 1, 'deleteAnchor deletes tracked anchors');
  testCase.equal(manager.anchors.size, 0, 'deleteAnchor removes tracked anchors');
  testCase.end();
});

test('webxr#WebXRAnchorManager creates anchors from hit-test results and syncs tracked anchors', async testCase => {
  const session = new EventTarget() as XRSession;
  const referenceSpace = {} as XRReferenceSpace;
  const hitTestAnchor = makeMockXRAnchor({} as XRSpace);
  const staleAnchor = makeMockXRAnchor({} as XRSpace);
  const hitTestResult = {
    async createAnchor(): Promise<XRAnchor> {
      return hitTestAnchor;
    },
    getPose: () => undefined
  } as XRHitTestResult;
  const frame = {
    session,
    trackedAnchors: new Set<XRAnchor>([hitTestAnchor]),
    getPose: () => makeMockXRPose([2])
  } as XRFrame;
  const manager = new WebXRAnchorManager();

  manager.setSession(session, referenceSpace);
  manager.anchors.add(staleAnchor);
  const anchor = await manager.createAnchorFromHitTestResult(hitTestResult);
  const anchorState = manager.getAnchorState(frame);

  testCase.equal(anchor, hitTestAnchor, 'returns hit-test anchor');
  testCase.equal(manager.anchors.has(hitTestAnchor), true, 'tracks hit-test anchor');
  testCase.equal(manager.anchors.has(staleAnchor), false, 'drops anchors missing from tracked set');
  testCase.equal(anchorState?.anchors.length, 1, 'resolves remaining tracked anchor');

  session.dispatchEvent(new Event('end'));
  testCase.equal(hitTestAnchor.deleteCount, 1, 'session end deletes tracked anchors');
  testCase.equal(staleAnchor.deleteCount, 0, 'stale anchors already removed are not deleted');
  testCase.equal(manager.session, null, 'session end clears session');
  testCase.end();
});

test('webxr#WebXRAnchorManager rejects invalid sessions and unsupported anchors', async testCase => {
  const session = new EventTarget() as XRSession;
  const referenceSpace = {} as XRReferenceSpace;
  const manager = new WebXRAnchorManager();

  testCase.throws(
    () => manager.setSession(session, null),
    /reference space/,
    'rejects missing app reference space'
  );
  testCase.equal(manager.setSession(null, null), manager, 'clears null sessions');
  testCase.equal(
    manager.getAnchorState({session} as XRFrame),
    null,
    'inactive sessions return null'
  );

  manager.setSession(session, referenceSpace);
  try {
    await manager.createAnchor({session} as XRFrame, makeMockXRPose([1]).transform);
    testCase.fail('unsupported XRFrame.createAnchor should be rejected');
  } catch (error) {
    testCase.match(error instanceof Error ? error.message : '', /not supported/, 'reports support');
  }

  try {
    await manager.createAnchorFromHitTestResult({getPose: () => undefined} as XRHitTestResult);
    testCase.fail('unsupported hit-test anchors should be rejected');
  } catch (error) {
    testCase.match(error instanceof Error ? error.message : '', /not supported/, 'reports support');
  }

  testCase.throws(
    () =>
      manager.getAnchorState({
        session: new EventTarget() as XRSession,
        getPose: () => undefined
      } as XRFrame),
    /different XRSession/,
    'rejects foreign frames'
  );

  manager.clearSession();
  manager.clearSession();
  testCase.equal(manager.anchors.size, 0, 'clearSession is idempotent');
  testCase.end();
});

function makeMockXRAnchor(anchorSpace: XRSpace): MockXRAnchor {
  return {
    anchorSpace,
    deleteCount: 0,
    delete() {
      this.deleteCount++;
    }
  };
}

function makeMockXRPose(matrix: number[]): XRPose {
  return {
    transform: {
      matrix: new Float32Array(matrix),
      inverse: {matrix: new Float32Array(matrix)}
    }
  } as XRPose;
}
