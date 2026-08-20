// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUTranspose,
  GPU_TRANSPOSE_TILE_SIZE,
  makeGPUTransposeStats
} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';
import {getGPUTransposeShaderSource} from '../../src/gpu-core/gpu-transpose';

test('GPUTranspose publishes a rectangular tiled plan', testCase => {
  const stats = makeGPUTransposeStats(17, 35);
  testCase.deepEqual(stats, {
    rows: 17,
    columns: 35,
    elementCount: 595,
    tileRowCount: 2,
    tileColumnCount: 3,
    tileCount: 6,
    workgroupSize: [16, 16, 1]
  });
  testCase.ok(Object.isFrozen(stats), 'stats are immutable');
  testCase.ok(Object.isFrozen(stats.workgroupSize), 'workgroup size is immutable');
  testCase.equal(GPU_TRANSPOSE_TILE_SIZE, 16, 'tile dimension is explicit');
  testCase.deepEqual(
    makeGPUTransposeStats(0, 23),
    {
      rows: 0,
      columns: 23,
      elementCount: 0,
      tileRowCount: 0,
      tileColumnCount: 2,
      tileCount: 0,
      workgroupSize: [16, 16, 1]
    },
    'zero rows produce an empty plan'
  );
  testCase.throws(() => makeGPUTransposeStats(-1, 2), /rows must be a non-negative/);
  testCase.throws(() => makeGPUTransposeStats(2.5, 2), /rows must be a non-negative/);
  testCase.throws(() => makeGPUTransposeStats(0x100000000, 2), /uint32 index range/);
  testCase.end();
});

test('GPUTranspose validates packed capacity, format, aliasing, and graph ownership', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({
    id: 'input',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({
    id: 'output',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const input = graph.createDataView(inputHandle, {format: 'float32', length: 12});
  const output = graph.createDataView(outputHandle, {format: 'float32', length: 12});
  const transpose = new GPUTranspose({input, output, rows: 3, columns: 4});
  testCase.doesNotThrow(() => transpose.addToGraph(graph), 'valid transpose adds one graph node');

  const shortOutput = graph.createDataView(outputHandle, {format: 'float32', length: 11});
  testCase.throws(
    () => new GPUTranspose({input, output: shortOutput, rows: 3, columns: 4}),
    /output must contain at least/
  );
  const integerOutput = graph.createDataView(outputHandle, {format: 'uint32', length: 12});
  testCase.throws(
    () => new GPUTranspose({input, output: integerOutput as never, rows: 3, columns: 4}),
    /formats must match/
  );
  const stridedInput = graph.createDataView(inputHandle, {
    format: 'float32',
    length: 6,
    byteStride: 8
  });
  testCase.throws(
    () => new GPUTranspose({input: stridedInput, output, rows: 2, columns: 3}),
    /must be packed/
  );
  const overlappingOutput = graph.createDataView(inputHandle, {
    format: 'float32',
    length: 12,
    byteOffset: 4
  });
  testCase.throws(
    () => new GPUTranspose({input, output: overlappingOutput, rows: 2, columns: 3}),
    /separate buffers/
  );

  const otherGraph = new GPUCommandGraph(makeSupportDevice());
  const otherHandle = otherGraph.importBuffer({
    id: 'other-output',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const otherOutput = otherGraph.createDataView(otherHandle, {format: 'float32', length: 12});
  const crossGraphTranspose = new GPUTranspose({input, output: otherOutput, rows: 3, columns: 4});
  testCase.throws(() => crossGraphTranspose.addToGraph(graph), /different GPUCommandGraph/);

  const emptyGraph = new GPUCommandGraph(makeSupportDevice());
  const emptyInputHandle = emptyGraph.importBuffer({
    id: 'empty-input',
    byteLength: 4,
    usage: Buffer.STORAGE
  });
  const emptyOutputHandle = emptyGraph.importBuffer({
    id: 'empty-output',
    byteLength: 4,
    usage: Buffer.STORAGE
  });
  const emptyInput = emptyGraph.createDataView(emptyInputHandle, {format: 'uint32', length: 0});
  const emptyOutput = emptyGraph.createDataView(emptyOutputHandle, {format: 'uint32', length: 0});
  new GPUTranspose({input: emptyInput, output: emptyOutput, rows: 0, columns: 7}).addToGraph(
    emptyGraph
  );
  const compiledEmptyGraph = emptyGraph.compile();
  testCase.equal(
    compiledEmptyGraph.stats.nodeOrder.length,
    0,
    'empty transpose adds no graph node'
  );
  compiledEmptyGraph.destroy();
  testCase.end();
});

test('GPUTranspose shader uses padded workgroup tiles and bounded tile indexing', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({
    id: 'input',
    byteLength: 17 * 35 * 4,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({
    id: 'output',
    byteLength: 17 * 35 * 4,
    usage: Buffer.STORAGE
  });
  const input = graph.createDataView(inputHandle, {format: 'sint32', length: 17 * 35});
  const output = graph.createDataView(outputHandle, {format: 'sint32', length: 17 * 35});
  const transpose = new GPUTranspose({input, output, rows: 17, columns: 35});
  const source = getGPUTransposeShaderSource(transpose, {x: 6, y: 1, z: 1});
  const reflection = new WgslReflect(source);

  testCase.deepEqual(
    reflection.entry.compute.map(entry => entry.name),
    ['main'],
    'shader exposes one compute entry point'
  );
  testCase.match(source, /array<array<i32, 17>, 16>/, 'tile is padded by one column');
  testCase.match(source, /workgroupBarrier/, 'tile load is synchronized before writing');
  testCase.match(source, /tileIndex >= 6u/, 'partial bounded dispatch workgroups are guarded');
  testCase.match(
    source,
    /outputRow \* ROWS \+ outputColumn/,
    'rectangular output stride uses rows'
  );
  testCase.end();
});

function makeSupportDevice(): Device {
  return {
    type: 'webgpu',
    isLost: false,
    features: new Set(),
    wgslLanguageFeatures: new Set(),
    info: {},
    limits: {
      maxBufferSize: 256 * 1024 * 1024,
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupsPerDimension: 65_535
    }
  } as Device;
}
