import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUFiniteDifference3D,
  makeGPUFiniteDifference3DStats
} from '@luma.gl/gpgpu/gpu-core';
import {WgslReflect} from 'wgsl_reflect';
import {getGPUFiniteDifference3DShaderSource} from '../../src/gpu-core/gpu-finite-difference-3d';

it('GPUFiniteDifference3D plans explicit volumetric numerical policies', () => {
  expect(
    makeGPUFiniteDifference3DStats({
      width: 8,
      height: 7,
      depth: 6,
      spacing: [0.25, 0.5, 0.75],
      operator: 'curl'
    })
  ).toEqual({
    width: 8,
    height: 7,
    depth: 6,
    elementCount: 336,
    spacing: [0.25, 0.5, 0.75],
    operator: 'curl',
    boundary: 'one-sided',
    stencilOrder: 2,
    inputComponentCount: 4,
    outputComponentCount: 4
  });
  expect(() =>
    makeGPUFiniteDifference3DStats({
      width: 8,
      height: 3,
      depth: 6,
      spacing: [1, 1, 1],
      operator: 'gradient'
    })
  ).toThrow(/at least 4/);
});

it('GPUFiniteDifference3D generates valid scalar and vector kernels', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const scalar = makeView(graph, 'scalar', 'float32', 64);
  const vector = makeView(graph, 'vector', 'float32x4', 64);
  const gradient = new GPUFiniteDifference3D({
    input: scalar,
    output: vector,
    width: 4,
    height: 4,
    depth: 4,
    spacing: [0.5, 0.5, 0.5],
    operator: 'gradient'
  });
  const curl = new GPUFiniteDifference3D({
    input: vector,
    output: makeView(graph, 'curl-output', 'float32x4', 64, 16),
    width: 4,
    height: 4,
    depth: 4,
    spacing: [0.5, 0.5, 0.5],
    operator: 'curl',
    boundary: 'periodic'
  });
  for (const operation of [gradient, curl]) {
    const source = getGPUFiniteDifference3DShaderSource(operation, {x: 1, y: 1, z: 1});
    expect(new WgslReflect(source).entry.compute.map(entry => entry.name)).toEqual(['main']);
  }
  expect(getGPUFiniteDifference3DShaderSource(curl, {x: 1, y: 1, z: 1})).toMatch(
    /OUTPUT_OFFSET: u32 = 1u/
  );
});

function makeView(
  graph: GPUCommandGraph,
  id: string,
  format: 'float32' | 'float32x4',
  length: number,
  byteOffset = 0
) {
  const componentCount = format === 'float32' ? 1 : 4;
  const handle = graph.importBuffer({
    id,
    byteLength: byteOffset + length * componentCount * 4,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(handle, {format, length, byteOffset});
}

function makeSupportDevice(): Device {
  return {
    type: 'webgpu',
    limits: {
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupsPerDimension: 65535,
      maxStorageBufferBindingSize: 1 << 30,
      maxBufferSize: 1 << 30
    }
  } as Device;
}
