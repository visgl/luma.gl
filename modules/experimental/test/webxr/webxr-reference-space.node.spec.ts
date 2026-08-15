// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  WebXRReferenceSpaceManager,
  makeWebXRReferenceSpaceState
} from '../../src/webxr/webxr-reference-space';

type MockXRReferenceSpace = XRReferenceSpace & {
  requestedOriginOffsets: XRRigidTransform[];
};

test('webxr#WebXRReferenceSpaceManager tracks reset events', testCase => {
  const referenceSpace = makeMockXRReferenceSpace();
  const transform = makeMockXRRigidTransform([1, 0, 0, 0]);
  const manager = new WebXRReferenceSpaceManager();

  manager.setReferenceSpace(referenceSpace);
  referenceSpace.dispatchEvent(makeMockXRReferenceSpaceEvent(referenceSpace, transform));
  const referenceSpaceState = manager.getReferenceSpaceState();

  testCase.equal(manager.referenceSpace, referenceSpace, 'retains active reference space');
  testCase.equal(
    referenceSpaceState?.referenceSpace,
    referenceSpace,
    'keeps reference-space identity'
  );
  testCase.equal(referenceSpaceState?.resetCount, 1, 'counts reset events');
  testCase.equal(referenceSpaceState?.transform, transform, 'keeps the last reset transform');
  testCase.equal(referenceSpaceState?.matrix, transform.matrix, 'exposes the last reset matrix');

  const originOffset = makeMockXRRigidTransform([2, 0, 0, 0]);
  const offsetReferenceSpace = manager.getOffsetReferenceSpace(originOffset);
  testCase.equal(
    offsetReferenceSpace,
    referenceSpace,
    'forwards offset reference-space creation to the active reference space'
  );
  testCase.deepEqual(
    referenceSpace.requestedOriginOffsets,
    [originOffset],
    'passes the origin offset through unchanged'
  );

  manager.destroy();
  referenceSpace.dispatchEvent(makeMockXRReferenceSpaceEvent(referenceSpace, transform));
  testCase.equal(manager.getReferenceSpaceState(), null, 'destroy removes reset state');
  testCase.end();
});

test('webxr#WebXRReferenceSpaceManager handles clear and unsupported offsets', testCase => {
  const referenceSpace = Object.assign(new EventTarget(), {}) as XRReferenceSpace;
  const otherReferenceSpace = makeMockXRReferenceSpace();
  const manager = new WebXRReferenceSpaceManager();

  manager.setReferenceSpace(referenceSpace);
  referenceSpace.dispatchEvent(makeMockXRReferenceSpaceEvent(otherReferenceSpace, null));
  testCase.equal(
    manager.getReferenceSpaceState()?.resetCount,
    0,
    'ignores reset events for another reference space'
  );
  testCase.equal(
    manager.getOffsetReferenceSpace(makeMockXRRigidTransform([1])),
    null,
    'missing offset API returns null'
  );

  referenceSpace.dispatchEvent(makeMockXRReferenceSpaceEvent(referenceSpace, null));
  testCase.equal(manager.getReferenceSpaceState()?.resetCount, 1, 'counts active reference reset');

  manager.clearReferenceSpace();
  referenceSpace.dispatchEvent(makeMockXRReferenceSpaceEvent(referenceSpace, null));
  testCase.equal(manager.referenceSpace, null, 'clearReferenceSpace is idempotent');
  testCase.equal(manager.getReferenceSpaceState(), null, 'cleared manager has no state');

  testCase.deepEqual(
    makeWebXRReferenceSpaceState(referenceSpace, 2, null),
    {
      referenceSpace,
      resetCount: 2,
      lastResetEvent: null,
      transform: null,
      matrix: null
    },
    'state helper handles missing reset event'
  );
  testCase.end();
});

function makeMockXRReferenceSpace(): MockXRReferenceSpace {
  const referenceSpace = Object.assign(new EventTarget(), {
    requestedOriginOffsets: [] as XRRigidTransform[],
    getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace {
      referenceSpace.requestedOriginOffsets.push(originOffset);
      return referenceSpace;
    }
  }) as MockXRReferenceSpace;

  return referenceSpace;
}

function makeMockXRReferenceSpaceEvent(
  referenceSpace: XRReferenceSpace,
  transform: XRRigidTransform | null
): XRReferenceSpaceEvent {
  return Object.assign(new Event('reset'), {
    referenceSpace,
    transform
  }) as XRReferenceSpaceEvent;
}

function makeMockXRRigidTransform(matrix: number[]): XRRigidTransform {
  return {
    matrix: new Float32Array(matrix),
    inverse: {} as XRRigidTransform
  };
}
