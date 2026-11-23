import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getGPUGraphTraversalDispatchLayout,
  getGPUGraphTraversalInvocationIndexSource
} from '../../src/gpu-core/gpu-graph-traversal';

it('GPUGraphTraversal plans bounded multidimensional dispatches', () => {
  const maximumWorkgroupsPerDimension = 65_535;
  const maximumOneDimensionalRowCount = maximumWorkgroupsPerDimension * 256;

  expect(getGPUGraphTraversalDispatchLayout(0, maximumWorkgroupsPerDimension)).toEqual({
    x: 1,
    y: 1,
    z: 1
  });
  expect(
    getGPUGraphTraversalDispatchLayout(
      maximumOneDimensionalRowCount,
      maximumWorkgroupsPerDimension
    ),
    'the largest single-dimensional dispatch exactly reaches its final row'
  ).toEqual({x: maximumWorkgroupsPerDimension, y: 1, z: 1});
  expect(
    getGPUGraphTraversalDispatchLayout(
      maximumOneDimensionalRowCount + 1,
      maximumWorkgroupsPerDimension
    ),
    'one additional row expands into the second dispatch dimension'
  ).toEqual({x: maximumWorkgroupsPerDimension, y: 2, z: 1});
  expect(
    getGPUGraphTraversalDispatchLayout(4 * 256 + 1, 2),
    'a synthetic device limit exercises the third dispatch dimension'
  ).toEqual({x: 2, y: 2, z: 2});
  expect(
    () => getGPUGraphTraversalDispatchLayout(8 * 256 + 1, 2),
    'dispatches exceeding every available dimension fail explicitly'
  ).toThrow(/exceeding the 3D dispatch limit/);
  expect(
    () => getGPUGraphTraversalDispatchLayout(0x1_0000_0000, maximumWorkgroupsPerDimension),
    'row identifiers remain bounded unsigned 32-bit values'
  ).toThrow(/non-negative uint32/);
});

it('GPUGraphTraversal flattens workgroups before bounded invocation indexing', () => {
  const source = getGPUGraphTraversalInvocationIndexSource({x: 3, y: 2, z: 2});

  expect(source).toMatch(/workgroupId\.z \* 2u \+ workgroupId\.y/);
  expect(source).toMatch(/\* 3u \+ workgroupId\.x/);
  expect(source, 'padded workgroups cannot wrap their uint32 invocation index').toMatch(
    /workgroupIndex >= 16777216u/
  );
  expect(
    Boolean(
      source.indexOf('workgroupIndex >= 16777216u') <
        source.indexOf('workgroupIndex * 256u + localInvocationIndex')
    ),
    'the overflow guard executes before multiplication'
  ).toBe(true);
});
