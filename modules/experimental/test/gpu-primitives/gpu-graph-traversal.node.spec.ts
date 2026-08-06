// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getGPUGraphTraversalDispatchLayout,
  getGPUGraphTraversalInvocationIndexSource
} from '../../src/gpu-primitives/gpu-graph-traversal';

test('GPUGraphTraversal plans bounded multidimensional dispatches', testCase => {
  const maximumWorkgroupsPerDimension = 65_535;
  const maximumOneDimensionalRowCount = maximumWorkgroupsPerDimension * 256;

  testCase.deepEqual(getGPUGraphTraversalDispatchLayout(0, maximumWorkgroupsPerDimension), {
    x: 1,
    y: 1,
    z: 1
  });
  testCase.deepEqual(
    getGPUGraphTraversalDispatchLayout(
      maximumOneDimensionalRowCount,
      maximumWorkgroupsPerDimension
    ),
    {x: maximumWorkgroupsPerDimension, y: 1, z: 1},
    'the largest single-dimensional dispatch exactly reaches its final row'
  );
  testCase.deepEqual(
    getGPUGraphTraversalDispatchLayout(
      maximumOneDimensionalRowCount + 1,
      maximumWorkgroupsPerDimension
    ),
    {x: maximumWorkgroupsPerDimension, y: 2, z: 1},
    'one additional row expands into the second dispatch dimension'
  );
  testCase.deepEqual(
    getGPUGraphTraversalDispatchLayout(4 * 256 + 1, 2),
    {x: 2, y: 2, z: 2},
    'a synthetic device limit exercises the third dispatch dimension'
  );
  testCase.throws(
    () => getGPUGraphTraversalDispatchLayout(8 * 256 + 1, 2),
    /exceeding the 3D dispatch limit/,
    'dispatches exceeding every available dimension fail explicitly'
  );
  testCase.throws(
    () => getGPUGraphTraversalDispatchLayout(0x1_0000_0000, maximumWorkgroupsPerDimension),
    /non-negative uint32/,
    'row identifiers remain bounded unsigned 32-bit values'
  );
  testCase.end();
});

test('GPUGraphTraversal flattens workgroups before bounded invocation indexing', testCase => {
  const source = getGPUGraphTraversalInvocationIndexSource({x: 3, y: 2, z: 2});

  testCase.match(source, /workgroupId\.z \* 2u \+ workgroupId\.y/);
  testCase.match(source, /\* 3u \+ workgroupId\.x/);
  testCase.match(
    source,
    /workgroupIndex >= 16777216u/,
    'padded workgroups cannot wrap their uint32 invocation index'
  );
  testCase.ok(
    source.indexOf('workgroupIndex >= 16777216u') <
      source.indexOf('workgroupIndex * 256u + localInvocationIndex'),
    'the overflow guard executes before multiplication'
  );
  testCase.end();
});
