// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUVisibilityWorkflow,
  type GraphDataView
} from '@luma.gl/experimental';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUVisibilityWorkflow composes predicates and publishes indirect-ready results', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const predicateValues = {
    timeRange: Uint32Array.from([1, 4, 1, 1, 0, 1, 1, 1]),
    bounds: Uint32Array.from([1, 0, 1, 3, 1, 1, 1, 0]),
    lod: Uint32Array.from([1, 1, 8, 0, 1, 1, 1, 1]),
    selection: Uint32Array.from([0, 1, 1, 1, 1, 5, 0, 1])
  };
  const predicateBuffers = Object.fromEntries(
    Object.entries(predicateValues).map(([name, values]) => [
      name,
      device.createBuffer({
        id: `visibility-${name}`,
        data: values,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      })
    ])
  ) as Record<keyof typeof predicateValues, Buffer>;
  const outputBuffer = device.createBuffer({
    id: 'visibility-output',
    byteLength: predicateValues.timeRange.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const outputMaskBuffer = device.createBuffer({
    id: 'visibility-output-mask',
    byteLength: predicateValues.timeRange.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const drawCommands = new DrawCommandBuffer(device, {
    id: 'visibility-draw-command',
    type: 'draw',
    commands: [{vertexCount: 6, instanceCount: 0}]
  });
  const graph = new GPUCommandGraph(device, {id: 'visibility-workflow'});
  const predicateViews = Object.fromEntries(
    Object.entries(predicateBuffers).map(([name, buffer]) => {
      const handle = graph.importBuffer(
        {id: name, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      );
      return [
        name,
        graph.createDataView(handle, {format: 'uint32', length: predicateValues.timeRange.length})
      ];
    })
  ) as Record<keyof typeof predicateValues, GraphDataView<'uint32'>>;
  const output = graph.importGPUData(
    'visible-ids',
    new GPUData({
      buffer: outputBuffer,
      format: 'uint32',
      length: predicateValues.timeRange.length,
      ownsBuffer: false
    })
  );
  const outputMask = graph.importGPUData(
    'visible-mask',
    new GPUData({
      buffer: outputMaskBuffer,
      format: 'uint32',
      length: predicateValues.timeRange.length,
      ownsBuffer: false
    })
  );
  const count = graph.importGPUData('visible-count', drawCommands.getInstanceCountData(0));
  const workflow = new GPUVisibilityWorkflow({
    id: 'objects',
    predicates: [
      {kind: 'time-range', mask: predicateViews.timeRange},
      {kind: 'bounds', mask: predicateViews.bounds},
      {kind: 'lod', mask: predicateViews.lod},
      {kind: 'selection', mask: predicateViews.selection}
    ],
    output,
    outputMask,
    count,
    firstSourceIndex: 40
  });
  workflow.addToGraph(graph);
  const compiled = graph.compile();

  await encodeAndSubmit(device, compiled, 'visibility-first');
  t.deepEqual(await readUint32(outputBuffer, 2), [42, 45], 'stable generated IDs preserve order');
  t.deepEqual(
    await readUint32(outputMaskBuffer, predicateValues.timeRange.length),
    [0, 0, 1, 0, 0, 1, 0, 0],
    'fused nonzero predicates publish one canonical mask'
  );
  t.equal(await readDrawCount(drawCommands), 2, 'visible count writes the indirect command slot');

  predicateBuffers.selection.write(Uint32Array.from({length: 8}, () => 1));
  await encodeAndSubmit(device, compiled, 'visibility-updated');
  t.deepEqual(
    await readUint32(outputBuffer, 4),
    [40, 42, 45, 46],
    'predicate data updates without graph recompilation'
  );
  t.equal(await readDrawCount(drawCommands), 4, 'the indirect count updates with the predicates');
  t.ok(
    compiled.stats.nodeOrder.some(id => id === 'objects-identity'),
    'workflow owns stable identity generation'
  );
  t.ok(
    compiled.stats.nodeOrder.some(id => id === 'objects-compose'),
    'workflow owns predicate composition'
  );
  t.ok(
    compiled.stats.nodeOrder.some(id => id.startsWith('objects-compact')),
    'workflow owns scan and stable compaction'
  );

  compiled.destroy();
  for (const buffer of Object.values(predicateBuffers)) buffer.destroy();
  outputBuffer.destroy();
  outputMaskBuffer.destroy();
  drawCommands.destroy();
  t.end();
});

test('GPUVisibilityWorkflow preserves chunk topology while generating global IDs', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const maskFixture = createVectorFixture(device, 'mask', [
    Uint32Array.from([1, 0, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 1])
  ]);
  const outputFixture = createVectorFixture(
    device,
    'output',
    [new Uint32Array(3), new Uint32Array(0), new Uint32Array(2)],
    0xffffffff
  );
  const countBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'chunked-visibility'});
  const mask = graph.importGPUVector('mask', maskFixture.vector);
  const output = graph.importGPUVector('output', outputFixture.vector);
  const countHandle = graph.importBuffer(
    {id: 'count', byteLength: countBuffer.byteLength, usage: countBuffer.usage},
    countBuffer
  );
  new GPUVisibilityWorkflow({
    predicates: [{kind: 'bounds', mask}],
    output,
    count: graph.createDataView(countHandle, {format: 'uint32', length: 1})
  }).addToGraph(graph);
  const compiled = graph.compile();
  await encodeAndSubmit(device, compiled, 'chunked-visibility');

  t.deepEqual(
    await readVectorFixture(outputFixture),
    [[0, 2, 3], [], [4, 0xffffffff]],
    'identity generation and compaction preserve global order across chunks'
  );
  t.deepEqual(await readUint32(countBuffer, 1), [4], 'one count spans the complete vector');
  t.deepEqual(
    compiled.stats.nodeOrder.filter(id => id.includes('identity')),
    ['gpu-visibility-identity-chunk-0', 'gpu-visibility-identity-chunk-2'],
    'empty chunks retain topology without an unnecessary dispatch'
  );

  compiled.destroy();
  destroyVectorFixture(maskFixture);
  destroyVectorFixture(outputFixture);
  countBuffer.destroy();
  t.end();
});

test('GPUVisibilityWorkflow rejects incompatible contracts', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'visibility-validation'});
  const firstBuffer = graph.createTransientBuffer({
    id: 'first',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const secondBuffer = graph.createTransientBuffer({
    id: 'second',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const first = graph.createDataView(firstBuffer, {format: 'uint32', length: 4});
  const short = graph.createDataView(secondBuffer, {format: 'uint32', length: 3});
  const output = graph.createDataView(secondBuffer, {format: 'uint32', length: 4});
  const count = graph.createDataView(firstBuffer, {format: 'uint32', length: 1});

  t.throws(
    () => new GPUVisibilityWorkflow({predicates: [], output, count}),
    /at least one visibility predicate/,
    'at least one fixed-contract predicate is required'
  );
  t.throws(
    () =>
      new GPUVisibilityWorkflow({
        predicates: [
          {kind: 'bounds', mask: first},
          {kind: 'selection', mask: short}
        ],
        output,
        count
      }),
    /length must match/,
    'predicate masks remain source aligned'
  );
  t.throws(
    () =>
      new GPUVisibilityWorkflow({
        predicates: [{kind: 'bounds', mask: first}],
        output,
        count,
        firstSourceIndex: 0xffffffff
      }),
    /exceed uint32 range/,
    'generated identities cannot overflow uint32'
  );
  t.throws(
    () =>
      new GPUVisibilityWorkflow({
        predicates: [{kind: 'bounds', mask: first}],
        output,
        count,
        sourceIds: first,
        firstSourceIndex: 1
      }),
    /cannot be used with explicit source IDs/,
    'explicit source IDs and generated offsets are mutually exclusive'
  );
  t.end();
});

async function encodeAndSubmit(
  device: Device,
  compiled: ReturnType<GPUCommandGraph<void>['compile']>,
  id: string
): Promise<void> {
  const commandEncoder = device.createCommandEncoder({id});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync(0, Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readDrawCount(drawCommands: DrawCommandBuffer): Promise<number> {
  const bytes = await drawCommands.buffer.readAsync(
    drawCommands.getInstanceCountByteOffset(0),
    Uint32Array.BYTES_PER_ELEMENT
  );
  return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
}

type VectorFixture = {
  vector: GPUVector<'uint32'>;
  buffers: Buffer[];
  lengths: number[];
};

function createVectorFixture(
  device: Device,
  name: string,
  chunks: Uint32Array[],
  fill?: number
): VectorFixture {
  const lengths = chunks.map(chunk => chunk.length);
  const buffers = chunks.map(chunk =>
    device.createBuffer({
      data:
        fill === undefined
          ? chunk.length > 0
            ? chunk
            : new Uint32Array(1)
          : Uint32Array.from({length: Math.max(chunk.length, 1)}, () => fill),
      usage: Buffer.STORAGE | Buffer.COPY_DST | (fill === undefined ? 0 : Buffer.COPY_SRC)
    })
  );
  const vector = new GPUVector({
    type: 'data',
    name,
    format: 'uint32',
    data: buffers.map(
      (buffer, chunkIndex) =>
        new GPUData({
          buffer,
          format: 'uint32',
          length: lengths[chunkIndex],
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  return {vector, buffers, lengths};
}

async function readVectorFixture(fixture: VectorFixture): Promise<number[][]> {
  return Promise.all(
    fixture.buffers.map((buffer, chunkIndex) => readUint32(buffer, fixture.lengths[chunkIndex]))
  );
}

function destroyVectorFixture(fixture: VectorFixture): void {
  fixture.vector.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}
