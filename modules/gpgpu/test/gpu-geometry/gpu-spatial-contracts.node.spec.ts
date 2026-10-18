// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPUMeshNormals, GPUMeshVertexNormals, GPUMeshSmoothing} from '@luma.gl/gpgpu/gpu-geometry';
import {
  GPUPointCloudVoxelDownsample,
  GPUPointCloudRadiusFilter
} from '@luma.gl/gpgpu/gpu-pointcloud';

function makeFixture() {
  const device = {
    type: 'webgpu',
    isLost: false,
    features: new Set(),
    wgslLanguageFeatures: new Set(),
    info: {},
    limits: {
      maxBufferSize: 268435456,
      maxStorageBufferBindingSize: 134217728,
      maxComputeWorkgroupsPerDimension: 65535
    }
  } as Device;
  const graph = new GPUCommandGraph(device);
  let nextId = 0;
  function view<Format extends 'float32x3' | 'uint32'>(
    format: Format,
    length: number,
    byteStride = format === 'float32x3' ? 12 : 4
  ) {
    const buffer = graph.importBuffer({
      id: `buffer-${nextId++}`,
      byteLength: Math.max(16, length * byteStride),
      usage: Buffer.STORAGE
    });
    return graph.createDataView(buffer, {format, length, byteStride});
  }
  return {graph, view};
}

describe('GPU spatial operation contracts', () => {
  it('rejects malformed mesh capacities and smoothing factors', () => {
    const {graph, view} = makeFixture();
    const positions = view('float32x3', 3);
    const normals = view('float32x3', 1);
    expect(() => new GPUMeshNormals({positions, indices: view('uint32', 4), normals})).toThrow();
    expect(
      () =>
        new GPUMeshVertexNormals({
          faceNormals: normals,
          offsets: view('uint32', 3),
          faceIndices: view('uint32', 3),
          normals: positions
        })
    ).toThrow();
    const props = {
      positions,
      offsets: view('uint32', 4),
      neighbors: view('uint32', 6),
      output: view('float32x3', 3)
    };
    for (const factor of [-1, 2, NaN, Infinity])
      expect(() => new GPUMeshSmoothing({...props, factor})).toThrow();
    expect(() => new GPUMeshSmoothing({...props, pinned: view('uint32', 2)})).toThrow();
    expect(() => graph.add(new GPUMeshSmoothing({...props, output: positions}))).toThrow(
      /separate buffers/
    );
    expect(() =>
      graph.add(new GPUMeshSmoothing({...props, positions: view('float32x3', 3, 16)}))
    ).toThrow(/packed/);
    const foreign = makeFixture().view('float32x3', 3);
    expect(() => graph.add(new GPUMeshSmoothing({...props, output: foreign}))).toThrow(
      /target graph/
    );
  });

  it('validates voxel capacity, geometry, aliasing and finite parameters', () => {
    const {graph, view} = makeFixture();
    const props = {
      positions: view('float32x3', 2),
      representatives: view('uint32', 8),
      counts: view('uint32', 8),
      output: view('float32x3', 8),
      origin: [0, 0, 0] as const,
      gridSize: [2, 2, 2] as const,
      voxelSize: 1
    };
    expect(new GPUPointCloudVoxelDownsample(props).getCommandNodes(graph)).toHaveLength(3);
    for (const voxelSize of [0, -1, NaN, Infinity, 1e-50])
      expect(() => new GPUPointCloudVoxelDownsample({...props, voxelSize})).toThrow();
    expect(() => new GPUPointCloudVoxelDownsample({...props, gridSize: [2, 2, 3]})).toThrow();
    expect(() => new GPUPointCloudVoxelDownsample({...props, origin: [NaN, 0, 0]})).toThrow();
    expect(() =>
      new GPUPointCloudVoxelDownsample({...props, counts: props.representatives}).getCommandNodes(
        graph
      )
    ).toThrow(/overlap/);
  });

  it('validates radius thresholds and preserves empty cloud semantics', () => {
    const {graph, view} = makeFixture();
    const props = {
      positions: view('float32x3', 0),
      counts: view('uint32', 0),
      mask: view('uint32', 0),
      radius: 1
    };
    expect(new GPUPointCloudRadiusFilter(props).getCommandNodes(graph)).toHaveLength(0);
    for (const radius of [0, -1, NaN, Infinity, 1e30, 1e-30])
      expect(() => new GPUPointCloudRadiusFilter({...props, radius})).toThrow();
    expect(() => new GPUPointCloudRadiusFilter({...props, minimumNeighbors: -1})).toThrow();
    expect(() => new GPUPointCloudRadiusFilter({...props, validity: view('uint32', 1)})).toThrow();
  });
});

it('rejects overlapping aligned writable bindings while allowing aligned shared outputs', () => {
  const {graph, view} = makeFixture();
  const positions = view('float32x3', 2);
  const shared = graph.importBuffer({id: 'shared-outputs', byteLength: 264, usage: Buffer.STORAGE});
  const counts = graph.createDataView(shared, {format: 'uint32', length: 2});
  const mask = graph.createDataView(shared, {format: 'uint32', length: 2, byteOffset: 8});
  expect(() =>
    graph.add(new GPUPointCloudRadiusFilter({positions, counts, mask, radius: 1}))
  ).toThrow();
  const alignedMask = graph.createDataView(shared, {format: 'uint32', length: 2, byteOffset: 256});
  expect(() =>
    graph.add(new GPUPointCloudRadiusFilter({positions, counts, mask: alignedMask, radius: 1}))
  ).not.toThrow();
});
