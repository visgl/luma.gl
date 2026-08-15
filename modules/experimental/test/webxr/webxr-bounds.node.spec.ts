// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getWebXRBoundsState,
  isPointInWebXRBounds,
  isWebXRBoundedReferenceSpace
} from '../../src/webxr/webxr-bounds';

test('webxr#getWebXRBoundsState resolves bounded reference-space geometry', testCase => {
  const boundsGeometry = [
    makeDOMPoint(-1, 0, -1),
    makeDOMPoint(1, 0, -1),
    makeDOMPoint(1, 0, 1),
    makeDOMPoint(-1, 0, 1)
  ];
  const referenceSpace = {boundsGeometry} as XRBoundedReferenceSpace;
  const boundsState = getWebXRBoundsState(referenceSpace);

  testCase.ok(isWebXRBoundedReferenceSpace(referenceSpace), 'detects bounded reference spaces');
  testCase.equal(boundsState?.referenceSpace, referenceSpace, 'retains reference-space identity');
  testCase.deepEqual(
    boundsState?.bounds,
    [
      [-1, 0, -1],
      [1, 0, -1],
      [1, 0, 1],
      [-1, 0, 1]
    ],
    'converts bounds geometry to numeric points'
  );
  testCase.deepEqual(boundsState?.center, [0, 0, 0], 'computes bounds center');
  testCase.deepEqual(boundsState?.size, [2, 0, 2], 'computes bounds size');
  testCase.equal(boundsState?.radius, Math.SQRT2, 'computes horizontal bounds radius');
  testCase.equal(
    isPointInWebXRBounds([0.25, 0, -0.25], boundsState?.bounds || []),
    true,
    'accepts points inside bounds'
  );
  testCase.equal(
    isPointInWebXRBounds([2, 0, 0], boundsState?.bounds || []),
    false,
    'rejects points outside bounds'
  );
  testCase.end();
});

test('webxr#getWebXRBoundsState handles unbounded reference spaces', testCase => {
  const referenceSpace = {} as XRReferenceSpace;

  testCase.equal(
    isWebXRBoundedReferenceSpace(referenceSpace),
    false,
    'plain reference spaces are not bounded'
  );
  testCase.equal(getWebXRBoundsState(referenceSpace), null, 'plain reference spaces have no state');
  testCase.equal(getWebXRBoundsState(null), null, 'null reference spaces have no state');
  testCase.equal(isPointInWebXRBounds([0, 0, 0], []), false, 'empty bounds cannot contain points');
  testCase.end();
});

function makeDOMPoint(x: number, y: number, z: number): DOMPointReadOnly {
  return {x, y, z, w: 1} as DOMPointReadOnly;
}
