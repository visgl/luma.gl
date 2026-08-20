// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUFiniteDifference2D,
  makeGPUFiniteDifference2DStats
} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';
import {getGPUFiniteDifference2DShaderSource} from '../../src/gpu-core/gpu-finite-difference-2d';

test('GPUFiniteDifference2D plans explicit second-order numerical policies', t => {
  t.deepEqual(
    makeGPUFiniteDifference2DStats({
      width: 12,
      height: 8,
      spacing: [0.25, 0.5],
      operator: 'gradient'
    }),
    {
      width: 12,
      height: 8,
      elementCount: 96,
      spacing: [0.25, 0.5],
      operator: 'gradient',
      boundary: 'one-sided',
      stencilOrder: 2,
      inputComponentCount: 1,
      outputComponentCount: 2
    }
  );
  t.throws(
    () =>
      makeGPUFiniteDifference2DStats({
        width: 3,
        height: 8,
        spacing: [1, 1],
        operator: 'curl'
      }),
    /at least 4/
  );
  t.throws(
    () =>
      makeGPUFiniteDifference2DStats({
        width: 8,
        height: 8,
        spacing: [0, 1],
        operator: 'laplacian'
      }),
    /positive finite/
  );
  t.end();
});

test('GPUFiniteDifference2D validates topology and generated WGSL', t => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const scalarInput = makeView(graph, 'scalar-input', 'float32', 64);
  const scalarOutput = makeView(graph, 'scalar-output', 'float32', 64);
  const vectorInput = makeView(graph, 'vector-input', 'float32x2', 64);
  const vectorOutput = makeView(graph, 'vector-output', 'float32x2', 64);
  const gradient = new GPUFiniteDifference2D({
    input: scalarInput,
    output: vectorOutput,
    width: 8,
    height: 8,
    spacing: [0.25, 0.25],
    operator: 'gradient'
  });
  const curl = new GPUFiniteDifference2D({
    input: vectorInput,
    output: scalarOutput,
    width: 8,
    height: 8,
    spacing: [0.25, 0.25],
    operator: 'curl',
    boundary: 'periodic'
  });
  for (const operation of [gradient, curl]) {
    const source = getGPUFiniteDifference2DShaderSource(operation, {x: 1, y: 1, z: 1});
    t.deepEqual(
      new WgslReflect(source).entry.compute.map(entry => entry.name),
      ['main']
    );
  }
  t.match(
    getGPUFiniteDifference2DShaderSource(gradient, {x: 1, y: 1, z: 1}),
    /-3\.0 \* sampleField/,
    'one-sided first derivative is explicit'
  );
  t.match(
    getGPUFiniteDifference2DShaderSource(curl, {x: 1, y: 1, z: 1}),
    /% i32\(WIDTH\)/,
    'periodic wrapping is explicit'
  );
  t.throws(
    () =>
      new GPUFiniteDifference2D({
        input: scalarInput,
        output: scalarOutput,
        width: 8,
        height: 8,
        spacing: [1, 1],
        operator: 'gradient'
      }),
    /output/
  );
  t.end();
});

function makeView(
  graph: GPUCommandGraph,
  id: string,
  format: 'float32' | 'float32x2',
  length: number
) {
  const components = format === 'float32' ? 1 : 2;
  const handle = graph.importBuffer({
    id,
    byteLength: length * components * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(handle, {format, length});
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
