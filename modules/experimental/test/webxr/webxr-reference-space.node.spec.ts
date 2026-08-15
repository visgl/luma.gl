// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  WebXRReferenceSpaceManager,
  getWebXRTeleportState,
  getWebXRTeleportTranslation,
  isWebXRTeleportTargetAllowed,
  makeWebXRTeleportOffset,
  makeWebXRReferenceSpaceState
} from '../../src/webxr/webxr-reference-space';

type MockXRReferenceSpace = XRReferenceSpace & {
  requestedOriginOffsets: XRRigidTransform[];
};

type MockXRRigidTransform = XRRigidTransform & {
  position?: DOMPointInit;
  orientation?: DOMPointInit;
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

test('webxr#teleport helpers create bounded offset reference spaces', testCase => {
  const originalXRRigidTransform = globalThis.XRRigidTransform;
  globalThis.XRRigidTransform = MockXRRigidTransformConstructor;

  try {
    const referenceSpace = makeMockXRReferenceSpace();
    const manager = new WebXRReferenceSpaceManager().setReferenceSpace(referenceSpace);
    const bounds = [
      [-1, 0, -1],
      [1, 0, -1],
      [1, 0, 1],
      [-1, 0, 1]
    ] as const;
    const teleportState = manager.getTeleportReferenceSpace([0.25, 1.8, -0.5], {bounds});

    testCase.ok(teleportState, 'creates teleport state for in-bounds target');
    testCase.equal(
      teleportState?.referenceSpace,
      referenceSpace,
      'keeps source reference-space identity'
    );
    testCase.equal(
      teleportState?.offsetReferenceSpace,
      referenceSpace,
      'returns offset reference space'
    );
    testCase.deepEqual(teleportState?.target, [0.25, 1.8, -0.5], 'copies teleport target');
    testCase.deepEqual(
      teleportState?.translation,
      [-0.25, 0, 0.5],
      'defaults to inverted X/Z translation while preserving height'
    );
    testCase.deepEqual(
      (teleportState?.originOffset as MockXRRigidTransform | undefined)?.position,
      {x: -0.25, y: 0, z: 0.5},
      'creates XRRigidTransform with teleport translation'
    );
    testCase.deepEqual(
      referenceSpace.requestedOriginOffsets,
      [teleportState?.originOffset],
      'passes origin offset to reference-space API'
    );
    testCase.equal(
      manager.getTeleportReferenceSpace([2, 0, 0], {bounds}),
      null,
      'rejects out-of-bounds targets'
    );
  } finally {
    globalThis.XRRigidTransform = originalXRRigidTransform;
  }

  testCase.end();
});

test('webxr#teleport helpers handle constructor, offset, and option variants', testCase => {
  const originalXRRigidTransform = globalThis.XRRigidTransform;
  globalThis.XRRigidTransform = MockXRRigidTransformConstructor;

  try {
    const referenceSpace = makeMockXRReferenceSpace();
    const orientation = {x: 0, y: 0.707, z: 0, w: 0.707};
    const originOffset = makeWebXRTeleportOffset([1, 2, 3], {
      invert: false,
      preserveY: false,
      orientation
    }) as MockXRRigidTransform;

    testCase.deepEqual(
      getWebXRTeleportTranslation([1, 2, 3]),
      [-1, 0, -3],
      'defaults to inverted horizontal translation'
    );
    testCase.deepEqual(
      getWebXRTeleportTranslation([1, 2, 3], {invert: false, preserveY: false}),
      [1, 2, 3],
      'can keep sign and include Y translation'
    );
    testCase.deepEqual(
      originOffset.position,
      {x: 1, y: 2, z: 3},
      'creates non-inverted full-position offset'
    );
    testCase.equal(originOffset.orientation, orientation, 'passes orientation through');
    testCase.equal(
      isWebXRTeleportTargetAllowed([0, 0, 0], null),
      true,
      'missing bounds allow teleport targets'
    );
    testCase.equal(
      getWebXRTeleportState(referenceSpace, [0, 0, 0])?.offsetReferenceSpace,
      referenceSpace,
      'standalone helper applies teleport offset'
    );

    const referenceSpaceWithoutOffset = {} as XRReferenceSpace;
    testCase.equal(
      getWebXRTeleportState(referenceSpaceWithoutOffset, [0, 0, 0]),
      null,
      'returns null without offset-reference-space support'
    );
  } finally {
    globalThis.XRRigidTransform = originalXRRigidTransform;
  }

  globalThis.XRRigidTransform = undefined;
  try {
    testCase.equal(
      makeWebXRTeleportOffset([0, 0, 0]),
      null,
      'returns null when XRRigidTransform is unavailable'
    );
  } finally {
    globalThis.XRRigidTransform = originalXRRigidTransform;
  }

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

function MockXRRigidTransformConstructor(
  this: MockXRRigidTransform,
  position?: DOMPointInit,
  orientation?: DOMPointInit
): void {
  this.position = position;
  this.orientation = orientation;
  this.matrix = new Float32Array([position?.x || 0, position?.y || 0, position?.z || 0, 1]);
  this.inverse = {} as XRRigidTransform;
}
