// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUGraph} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

test('GPUGraph preserves caller-owned WebGPU graph chunks without executing GPU work', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const buffers: Buffer[] = [];
  const sourceVertices = createGraphVector(device, buffers, 'sources', 'uint32', [
    Uint32Array.from([0, 2]),
    new Uint32Array(0),
    Uint32Array.from([2, 3, 6])
  ]);
  const targetVertices = createGraphVector(device, buffers, 'targets', 'uint32', [
    Uint32Array.from([1, 4]),
    new Uint32Array(0),
    Uint32Array.from([3, 5, 7])
  ]);
  const edgeWeights = createGraphVector(device, buffers, 'weights', 'float32', [
    Float32Array.from([0.5, 2]),
    new Float32Array(0),
    Float32Array.from([1, 4, 8])
  ]);
  const edgeIds = createGraphVector(device, buffers, 'edge-ids', 'uint32', [
    Uint32Array.from([10, 42]),
    new Uint32Array(0),
    Uint32Array.from([99, 101, 102])
  ]);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');
  const readbackSpies = buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

  try {
    const graph = new GPUGraph({
      vertexCount: 9,
      sourceVertices,
      targetVertices,
      edgeWeights,
      edgeIds,
      directed: false
    });

    tapeTest.equal(graph.vertexCount, 9, 'explicit vertex counts retain isolated vertices');
    tapeTest.equal(graph.edgeCount, 5, 'undirected metadata does not symmetrize source edges');
    tapeTest.equal(graph.directed, false, 'caller-selected directedness remains explicit');
    tapeTest.equal(graph.sourceVertices, sourceVertices, 'source vector identity is preserved');
    tapeTest.equal(graph.targetVertices, targetVertices, 'target vector identity is preserved');
    tapeTest.equal(graph.edgeWeights, edgeWeights, 'float32 weight vector identity is preserved');
    tapeTest.equal(graph.edgeIds, edgeIds, 'stable uint32 edge ID vector identity is preserved');

    for (const vector of [sourceVertices, targetVertices, edgeWeights, edgeIds]) {
      tapeTest.deepEqual(
        vector.data.map(chunk => chunk.length),
        [2, 0, 3],
        `${vector.name} retains its empty middle GPUData chunk`
      );
      for (const chunk of vector.data) {
        tapeTest.ok(
          buffers.some(buffer => buffer === chunk.buffer),
          `${vector.name} borrows its original buffer`
        );
      }
    }

    tapeTest.equal(createBufferSpy.mock.calls.length, 0, 'construction allocates no GPU buffers');
    tapeTest.equal(submitSpy.mock.calls.length, 0, 'construction submits no GPU commands');
    tapeTest.ok(
      readbackSpies.every(spy => spy.mock.calls.length === 0),
      'construction never reads source buffers back to the CPU'
    );

    for (const vector of [sourceVertices, targetVertices, edgeWeights, edgeIds]) {
      vector.destroy();
    }
    tapeTest.ok(
      buffers.every(buffer => !buffer.destroyed),
      'destroying borrowed vectors leaves every WebGPU buffer under caller ownership'
    );
  } finally {
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
    for (const spy of readbackSpies) {
      spy.mockRestore();
    }
    for (const vector of [sourceVertices, targetVertices, edgeWeights, edgeIds]) {
      vector.destroy();
    }
    for (const buffer of buffers) {
      buffer.destroy();
    }
  }

  tapeTest.end();
});

/** Creates borrowed scalar GPU vectors without changing empty source chunk boundaries. */
function createGraphVector<Format extends 'uint32' | 'float32'>(
  device: Device,
  buffers: Buffer[],
  name: string,
  format: Format,
  chunks: readonly (Uint32Array | Float32Array)[]
): GPUVector<Format> {
  const data = chunks.map((values, chunkIndex) => {
    const buffer = device.createBuffer({
      id: `${name}-chunk-${chunkIndex}`,
      data: values.length > 0 ? values : new Uint32Array(1),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    buffers.push(buffer);
    return new GPUData<Format>({
      buffer,
      format,
      length: values.length,
      ownsBuffer: false
    });
  });

  return new GPUVector<Format>({type: 'data', name, format, data, ownsData: false});
}
