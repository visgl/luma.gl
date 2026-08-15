// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WebXRHitTestManager} from '../../src/webxr/webxr-hit-test';

type MockXRHitTestSource = XRHitTestSource & {cancelCount: number};
type MockXRSession = XRSession & {
  requestedReferenceSpaceTypes: XRReferenceSpaceType[];
  receivedHitTestOptions: XRHitTestOptionsInit | null;
  nextHitTestSource: XRHitTestSource | null;
};

test('webxr#WebXRHitTestManager resolves AR hit-test poses', async testCase => {
  const appReferenceSpace = {} as XRReferenceSpace;
  const viewerReferenceSpace = {} as XRReferenceSpace;
  const offsetRay = {} as XRRay;
  const hitTestSource = makeMockXRHitTestSource();
  const firstPose = makeMockXRPose([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, -3, 1]);
  const firstResult = makeMockXRHitTestResult(firstPose);
  const missingPoseResult = makeMockXRHitTestResult(undefined);
  const session = makeMockXRSession({
    appReferenceSpace,
    viewerReferenceSpace,
    hitTestSource
  });
  const frame = {
    session,
    getHitTestResults(receivedHitTestSource: XRHitTestSource): XRHitTestResult[] {
      testCase.equal(receivedHitTestSource, hitTestSource, 'queries configured hit-test source');
      return [firstResult, missingPoseResult];
    }
  } as XRFrame;

  const manager = new WebXRHitTestManager({
    entityTypes: ['plane', 'point'],
    offsetRay
  });
  await manager.setSession(session, appReferenceSpace);
  const hitTestState = manager.getHitTestState(frame);

  testCase.deepEqual(
    session.requestedReferenceSpaceTypes,
    ['viewer'],
    'requests viewer space for hit tests'
  );
  testCase.deepEqual(
    session.receivedHitTestOptions,
    {
      space: viewerReferenceSpace,
      offsetRay,
      entityTypes: ['plane', 'point']
    },
    'requests hit-test source with caller options'
  );
  testCase.equal(manager.session, session, 'retains active session');
  testCase.equal(manager.referenceSpace, appReferenceSpace, 'retains app reference space');
  testCase.equal(manager.viewerSpace, viewerReferenceSpace, 'retains viewer space');
  testCase.equal(manager.hitTestSource, hitTestSource, 'retains hit-test source');
  testCase.equal(hitTestState?.xrFrame, frame, 'retains source frame');
  testCase.equal(hitTestState?.hits.length, 1, 'filters hits without poses');
  testCase.equal(hitTestState?.hits[0]?.xrHitTestResult, firstResult, 'retains raw hit result');
  testCase.equal(hitTestState?.hits[0]?.pose, firstPose, 'retains hit pose');
  testCase.equal(hitTestState?.hits[0]?.matrix, firstPose.transform.matrix, 'exposes hit matrix');

  session.dispatchEvent(new Event('end'));
  testCase.equal(hitTestSource.cancelCount, 1, 'session end cancels source');
  testCase.equal(manager.getHitTestState(frame), null, 'ended sessions expose no hit state');
  testCase.end();
});

test('webxr#WebXRHitTestManager handles unsupported and invalid hit-test sessions', async testCase => {
  const appReferenceSpace = {} as XRReferenceSpace;
  const viewerReferenceSpace = {} as XRReferenceSpace;
  const hitTestSource = makeMockXRHitTestSource();
  const session = makeMockXRSession({appReferenceSpace, viewerReferenceSpace, hitTestSource});
  const manager = new WebXRHitTestManager();

  try {
    await manager.setSession(session, null);
    testCase.fail('missing app reference space should be rejected');
  } catch (error) {
    testCase.match(
      error instanceof Error ? error.message : '',
      /reference space/,
      'reports missing app reference space'
    );
  }

  const unsupportedSession = {
    ...makeMockXRSession({appReferenceSpace, viewerReferenceSpace, hitTestSource}),
    requestHitTestSource: undefined
  } as unknown as XRSession;
  try {
    await manager.setSession(unsupportedSession, appReferenceSpace);
    testCase.fail('unsupported hit-test source requests should be rejected');
  } catch (error) {
    testCase.match(
      error instanceof Error ? error.message : '',
      /not supported/,
      'reports unsupported hit-test source requests'
    );
  }

  session.nextHitTestSource = null;
  try {
    await manager.setSession(session, appReferenceSpace);
    testCase.fail('null hit-test source should be rejected');
  } catch (error) {
    testCase.match(error instanceof Error ? error.message : '', /no source/, 'reports null source');
  }

  const validSession = makeMockXRSession({appReferenceSpace, viewerReferenceSpace, hitTestSource});
  await manager.setSession(validSession, appReferenceSpace);
  testCase.equal(
    manager.getHitTestState({session: validSession} as XRFrame),
    null,
    'frames without getHitTestResults expose no hit state'
  );
  testCase.throws(
    () =>
      manager.getHitTestState({
        session: makeMockXRSession({appReferenceSpace, viewerReferenceSpace, hitTestSource}),
        getHitTestResults: () => []
      } as XRFrame),
    /different XRSession/,
    'rejects foreign frames'
  );

  manager.clearSession();
  manager.clearSession();
  testCase.equal(hitTestSource.cancelCount, 1, 'clearSession cancels source once');
  testCase.equal(manager.session, null, 'clears session');
  testCase.end();
});

function makeMockXRSession(props: {
  appReferenceSpace: XRReferenceSpace;
  viewerReferenceSpace: XRReferenceSpace;
  hitTestSource: XRHitTestSource;
}): MockXRSession {
  const session = Object.assign(new EventTarget(), {
    enabledFeatures: ['hit-test'],
    inputSources: [],
    requestedReferenceSpaceTypes: [] as XRReferenceSpaceType[],
    receivedHitTestOptions: null as XRHitTestOptionsInit | null,
    nextHitTestSource: props.hitTestSource,
    async requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace> {
      session.requestedReferenceSpaceTypes.push(type);
      return type === 'viewer' ? props.viewerReferenceSpace : props.appReferenceSpace;
    },
    async requestHitTestSource(options: XRHitTestOptionsInit): Promise<XRHitTestSource | null> {
      session.receivedHitTestOptions = options;
      return session.nextHitTestSource;
    }
  }) as MockXRSession;

  return session;
}

function makeMockXRHitTestSource(): MockXRHitTestSource {
  return {
    cancelCount: 0,
    cancel() {
      this.cancelCount++;
    }
  };
}

function makeMockXRHitTestResult(pose: XRPose | undefined): XRHitTestResult {
  return {
    getPose() {
      return pose;
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
