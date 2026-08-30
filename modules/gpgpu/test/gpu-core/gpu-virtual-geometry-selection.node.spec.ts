// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {makeGPUVirtualGeometrySelectionPlan} from '@luma.gl/gpgpu/gpu-core';

test('GPU virtual geometry publishes an immutable breadth-level plan', testCase => {
  const levelOffsets = [0, 2, 6, 10];
  const plan = makeGPUVirtualGeometrySelectionPlan(levelOffsets, 10);

  testCase.deepEqual(plan, {
    nodeCount: 10,
    rootCount: 2,
    levelCount: 3,
    traversalPassCount: 3,
    levelOffsets: [0, 2, 6, 10]
  });
  testCase.ok(Object.isFrozen(plan), 'the plan is immutable');
  testCase.ok(Object.isFrozen(plan.levelOffsets), 'the copied level offsets are immutable');

  levelOffsets[1] = 4;
  testCase.deepEqual(plan.levelOffsets, [0, 2, 6, 10], 'caller mutation cannot change the plan');
  testCase.end();
});

test('GPU virtual geometry rejects invalid CPU-known hierarchy layouts', testCase => {
  testCase.throws(
    () => makeGPUVirtualGeometrySelectionPlan([1, 2], 2),
    /begin with zero/,
    'the first breadth level begins at node zero'
  );
  testCase.throws(
    () => makeGPUVirtualGeometrySelectionPlan([0, 2, 2], 2),
    /strictly increasing/,
    'empty or overlapping breadth levels are rejected'
  );
  testCase.throws(
    () => makeGPUVirtualGeometrySelectionPlan([0, 2, 5], 6),
    /end at nodeCount/,
    'the final level must cover every node'
  );
  testCase.throws(
    () => makeGPUVirtualGeometrySelectionPlan([0, 1], 0),
    /positive safe integer/,
    'empty hierarchies are rejected'
  );
  testCase.end();
});
