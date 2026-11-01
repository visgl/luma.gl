// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {BufferTransform, GPUVectorModel} from '@luma.gl/engine';
import {DynamicBuffer} from '@luma.gl/core/dynamic';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {Buffer, Device} from '@luma.gl/core';

const VS = /* glsl */ `\
#version 300 es
in float src;
out float dst;
void main() { dst = src * src; }
`;

const FS = /* glsl */ `\
#version 300 es
in float dst;
out vec4 fragColor;
void main() { fragColor.x = dst; }
`;

it('BufferTransform#constructor', async () => {
  const webglDevice = await getWebGLTestDevice();

  const transform = createBufferTransform(webglDevice);
  expect(transform, 'WebGL succeeds').toBeTruthy();
  expect(transform.model.constructor).toBe(GPUVectorModel);
  transform.destroy();
});

it('BufferTransform#run', async () => {
  const webglDevice = await getWebGLTestDevice();

  const SRC_ARRAY = new Float32Array([0, 1, 2, 3, 4, 5]);
  const DST_ARRAY = new Float32Array([0, 1, 4, 9, 16, 25]);

  const src = webglDevice.createBuffer({data: SRC_ARRAY});
  const dst = webglDevice.createBuffer({byteLength: 24});
  const elementCount = 6;
  const transform = createBufferTransform(webglDevice, src, dst, elementCount);

  transform.run();

  const bytes = await transform.readAsync('dst');
  const array = new Float32Array(bytes.buffer, bytes.byteOffset, elementCount);
  expect(array, 'output transformed').toEqual(DST_ARRAY);
});

function createBufferTransform(
  webglDevice: Device,
  src?: Buffer,
  dst?: Buffer,
  vertexCount?: number
): BufferTransform {
  return new BufferTransform(webglDevice, {
    vs: VS,
    fs: FS,
    vertexCount,
    attributes: src ? {src} : undefined,
    bufferLayout: [{name: 'src', format: 'float32'}],
    outputs: ['dst'],
    topology: 'point-list',
    feedbackBuffers: dst ? {dst} : undefined
  });
}

it('BufferTransform borrows vector ranges and infers the input vertex count', async () => {
  const device = await getWebGLTestDevice();
  const inputBuffer = device.createBuffer({data: new Float32Array([-1, 2, 3, 4, -1])});
  const outputBuffer = device.createBuffer({data: new Float32Array([-1, -1, -1, -1, -1])});
  const input = new GPUVector({
    type: 'data',
    name: 'src',
    format: 'float32',
    data: [new GPUData({buffer: inputBuffer, byteOffset: 4, length: 3, format: 'float32'})]
  });
  const output = new GPUVector({
    type: 'data',
    name: 'dst',
    format: 'float32',
    data: [new GPUData({buffer: outputBuffer, byteOffset: 4, length: 3, format: 'float32'})]
  });
  const transform = new BufferTransform(device, {
    vs: VS,
    fs: FS,
    bufferLayout: [{name: 'src', format: 'float32'}],
    outputs: ['dst'],
    inputVectors: {src: input},
    outputVectors: {dst: output}
  });
  expect(transform.model.vertexCount).toBe(3);
  transform.run({inputVectors: {src: input}, outputVectors: {dst: output}});
  const bytes = await outputBuffer.readAsync();
  expect(new Float32Array(bytes.buffer, bytes.byteOffset, 5)).toEqual(
    new Float32Array([-1, 4, 9, 16, -1])
  );
  transform.destroy();
  expect(inputBuffer.destroyed).toBe(false);
  expect(outputBuffer.destroyed).toBe(false);
  input.destroy();
  output.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
});

it('BufferTransform merges raw outputs with vector outputs and refreshes resized buffers', async () => {
  const device = await getWebGLTestDevice();
  const inputBuffer = device.createBuffer({data: new Float32Array([2, 3])});
  const rawOutput = device.createBuffer({byteLength: 8});
  const ignoredOutput = device.createBuffer({data: new Float32Array([-1, -1])});
  const dynamicOutput = new DynamicBuffer(device, {byteLength: 16});
  const output = new GPUVector({
    type: 'data',
    name: 'squared',
    format: 'float32',
    data: [new GPUData({buffer: dynamicOutput, byteOffset: 4, length: 2, format: 'float32'})]
  });
  const transform = new BufferTransform(device, {
    vs: `#version 300 es
in float src;
out float incremented;
out float squared;
void main() { incremented = src + 1.0; squared = src * src; }`,
    bufferLayout: [{name: 'src', format: 'float32'}],
    attributes: {src: inputBuffer},
    vertexCount: 2,
    outputs: ['incremented', 'squared']
  });
  transform.run({
    outputBuffers: {incremented: rawOutput, squared: ignoredOutput},
    outputVectors: {squared: output}
  });
  let bytes = await rawOutput.readAsync();
  expect(new Float32Array(bytes.buffer, bytes.byteOffset, 2)).toEqual(new Float32Array([3, 4]));
  bytes = await dynamicOutput.readAsync(4, 8);
  expect(new Float32Array(bytes.buffer, bytes.byteOffset, 2)).toEqual(new Float32Array([4, 9]));
  bytes = await ignoredOutput.readAsync();
  expect(new Float32Array(bytes.buffer, bytes.byteOffset, 2)).toEqual(new Float32Array([-1, -1]));
  const previousBuffer = dynamicOutput.buffer;
  dynamicOutput.resize({byteLength: 32});
  inputBuffer.write(new Float32Array([3, 4]));
  transform.run();
  expect(previousBuffer.destroyed).toBe(true);
  bytes = await dynamicOutput.readAsync(4, 8);
  expect(new Float32Array(bytes.buffer, bytes.byteOffset, 2)).toEqual(new Float32Array([9, 16]));
  bytes = await rawOutput.readAsync();
  expect(new Float32Array(bytes.buffer, bytes.byteOffset, 2)).toEqual(new Float32Array([4, 5]));
  transform.destroy();
  expect(dynamicOutput.buffer.destroyed).toBe(false);
  inputBuffer.destroy();
  rawOutput.destroy();
  ignoredOutput.destroy();
  output.destroy();
  dynamicOutput.destroy();
});

it('BufferTransform supports raw interleaved outputs', async () => {
  const device = await getWebGLTestDevice();
  const inputBuffer = device.createBuffer({data: new Float32Array([2, 3])});
  const outputBuffer = device.createBuffer({byteLength: 8});
  const transform = new BufferTransform(device, {
    vs: VS,
    fs: FS,
    vertexCount: 2,
    attributes: {src: inputBuffer},
    bufferLayout: [{name: 'src', format: 'float32'}],
    outputs: ['dst'],
    feedbackBufferMode: 'interleaved'
  });
  transform.run({outputBuffers: {dst: outputBuffer}});
  const bytes = await outputBuffer.readAsync();
  expect(new Float32Array(bytes.buffer, bytes.byteOffset, 2)).toEqual(new Float32Array([4, 9]));
  transform.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
});
