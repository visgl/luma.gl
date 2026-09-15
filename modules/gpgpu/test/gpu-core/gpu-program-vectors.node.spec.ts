// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUData, GPUVector, type GPUVectorLike} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUProgram,
  GPUProgramCompiler,
  GPUProgramVectorMADD,
  GPUProgramDotProduct,
  GPUProgramScalarLiteral,
  GPUConditionalOperation
} from '@luma.gl/gpgpu/gpu-core';

function makeDevice() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {...device.limits, maxComputeWorkgroupsPerDimension: 65535}
  });
  return device;
}

function makeChunk(
  device: NullDevice,
  length: number,
  byteOffset = 0,
  byteStride = 4,
  buffer: GPUData<'float32'>['buffer'] = device.createBuffer({
    byteLength: 128,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  })
) {
  return new GPUData({buffer, format: 'float32', length, byteOffset, byteStride});
}

test('program binding preserves zero-copy chunks, empty batches, shared buffers and layouts', () => {
  const device = makeDevice();
  const first = makeChunk(device, 2, 8, 8);
  const empty = makeChunk(device, 0, 24, 8, first.buffer);
  const last = makeChunk(device, 3, 32, 8, first.buffer);
  const data = [first, empty, last] as const;
  const source = new GPUVector({type: 'data', name: 'source', data});
  const allocate = vi.spyOn(device, 'createBuffer');
  const structural: GPUVectorLike<'float32'> = {format: 'float32', length: 5, data};
  for (const binding of [data, source, structural]) {
    const program = new GPUProgram();
    program.vector('input', 'float32', 5, {external: true, chunkLengths: [2, 0, 3]});
    const compilation = new GPUProgramCompiler(device).compile(program, {
      vectors: {input: binding}
    });
    const vector = compilation.vectors.get('input')!;
    expect(vector.valueLength).toBe(5);
    expect(vector.stride).toBe(first.stride);
    expect(vector.name).toBe(binding === source ? 'source' : 'input');
    expect(vector.chunks.map(chunk => [chunk.offset, chunk.length])).toEqual([
      [0, 2],
      [2, 0],
      [2, 3]
    ]);
    expect(
      vector.data.map(chunk => [chunk.byteOffset, chunk.byteStride, chunk.rowByteLength])
    ).toEqual([
      [8, 8, 4],
      [24, 8, 4],
      [32, 8, 4]
    ]);
    expect(vector.data.every(chunk => chunk.buffer === vector.data[0].buffer)).toBe(true);
    expect(vector.data[0].buffer.defaultBuffer).toBe(first.buffer);
    expect(source.chunks.map(chunk => chunk.offset)).toEqual([0, 2, 2]);
    expect(source.data[0]).toBe(first);
  }
  expect(allocate).not.toHaveBeenCalled();
  device.destroy();
});

test('program transients retain explicit partition lengths and binding shape is checked', () => {
  const device = makeDevice();
  const program = new GPUProgram();
  program.vector('scratch', 'float32', 5, {chunkLengths: [2, 0, 3]});
  expect(
    new GPUProgramCompiler(device)
      .compile(program)
      .vectors.get('scratch')!
      .data.map(chunk => chunk.length)
  ).toEqual([2, 0, 3]);
  expect(() => program.vector('invalid', 'float32', 5, {chunkLengths: [2, 2]})).toThrow(
    /chunk lengths/
  );
  const external = new GPUProgram();
  external.vector('input', 'float32', 5, {external: true, chunkLengths: [2, 3]});
  expect(() =>
    new GPUProgramCompiler(device).compile(external, {vectors: {input: makeChunk(device, 4)}})
  ).toThrow(/length/);
  expect(() =>
    new GPUProgramCompiler(device).compile(external, {vectors: {input: makeChunk(device, 5)}})
  ).toThrow(/topology/);
  const wrongFormat = new GPUData({
    buffer: makeChunk(device, 5).buffer,
    format: 'uint32',
    length: 5
  });
  expect(() =>
    new GPUProgramCompiler(device).compile(external, {vectors: {input: wrongFormat}})
  ).toThrow(/format/i);
  device.destroy();
});

test('MADD and dot product lower differing chunk boundaries, including GPU predicates', () => {
  const device = makeDevice();
  const program = new GPUProgram();
  const input = program.vector('input', 'float32', 5, {external: true});
  const addend = program.vector('addend', 'float32', 5, {external: true});
  const output = program.vector('output', 'float32', 5, {chunkLengths: [3, 2]});
  const scale = program.scalar('scale', 'float32');
  const total = program.scalar('total', 'float32');
  const active = program.scalar('active', 'uint32');
  program.add([
    new GPUProgramScalarLiteral({output: active, value: 1}),
    new GPUProgramScalarLiteral({output: scale, value: 2}),
    new GPUConditionalOperation({
      predicate: {id: 'enabled', source: 'gpu', value: active},
      body: [
        new GPUProgramVectorMADD({id: 'madd', input, addend, output, scale}),
        new GPUProgramDotProduct({id: 'dot', left: input, right: addend, output: total})
      ]
    })
  ]);
  const compilation = new GPUProgramCompiler(device).compile(program, {
    vectors: {
      input: [makeChunk(device, 2), makeChunk(device, 0), makeChunk(device, 3)],
      addend: [makeChunk(device, 1), makeChunk(device, 4)]
    }
  });
  const ids = compilation.lowering.nodes.map(node => node.nodeId);
  expect(ids.filter(id => /^madd-chunk-\d+$/.test(id))).toHaveLength(4);
  expect(ids.filter(id => /^dot-chunk-\d+$/.test(id))).toHaveLength(3);
  expect(compilation.vectors.get('input')!.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
  device.destroy();
});

test('an empty chunk array remains an empty logical vector and dot writes zero', () => {
  const device = makeDevice();
  const program = new GPUProgram();
  const input = program.vector('empty', 'float32', 0, {external: true});
  const output = program.scalar('total', 'float32');
  program.add(new GPUProgramDotProduct({left: input, right: input, output}));
  const compilation = new GPUProgramCompiler(device).compile(program, {vectors: {empty: []}});
  expect(compilation.vectors.get('empty')!.data).toHaveLength(0);
  expect(compilation.lowering.nodes).toHaveLength(1);
  device.destroy();
});

test('implicit transient topology respects storage binding capacity', () => {
  const device = makeDevice();
  Object.defineProperty(device, 'limits', {
    value: {...device.limits, maxStorageBufferBindingSize: 16}
  });
  const program = new GPUProgram();
  program.vector('large', 'float32', 11);
  const compilation = new GPUProgramCompiler(device).compile(program);
  expect(
    compilation.vectors.get('large')!.chunks.map(chunk => [chunk.offset, chunk.length])
  ).toEqual([
    [0, 4],
    [4, 4],
    [8, 3]
  ]);
  device.destroy();
});
