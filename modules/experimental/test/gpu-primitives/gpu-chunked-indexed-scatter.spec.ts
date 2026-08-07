// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUChunkedIndexedScatter, GPUCommandGraph} from '@luma.gl/experimental';
import {GPUData} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const INVALID_ROUTE = 0xffffffff;

test('GPUChunkedIndexedScatter routes compacted IDs into indirect-ready chunk ranges', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const sourceIds = Uint32Array.from([5, 1, 4, 0, 0, 0]);
  const routes = Uint32Array.from([
    0,
    INVALID_ROUTE,
    2,
    7,
    INVALID_ROUTE,
    INVALID_ROUTE,
    INVALID_ROUTE,
    INVALID_ROUTE,
    10,
    3,
    4,
    11
  ]);
  const sourceIdsBuffer = device.createBuffer({
    id: 'chunked-scatter-source-ids',
    data: sourceIds,
    usage: Buffer.STORAGE
  });
  const sourceCountBuffer = device.createBuffer({
    id: 'chunked-scatter-source-count',
    data: Uint32Array.from([3]),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const routesBuffer = device.createBuffer({
    id: 'chunked-scatter-routes',
    data: routes,
    usage: Buffer.STORAGE
  });
  const outputBuffer = device.createBuffer({
    id: 'chunked-scatter-output',
    byteLength: sourceIds.length * 2 * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'chunked-scatter-graph'});
  const importView = (id: string, buffer: Buffer, length: number) =>
    graph.importGPUData(id, new GPUData({buffer, format: 'uint32', length, ownsBuffer: false}));
  const scatter = new GPUChunkedIndexedScatter({
    id: 'routes',
    sourceIds: importView('source-ids', sourceIdsBuffer, sourceIds.length),
    sourceCount: importView('source-count', sourceCountBuffer, 1),
    routes: importView('routes', routesBuffer, routes.length),
    routeLayout: {wordStride: 2, firstRouteWordOffset: 0, routeCount: 2},
    chunkEnds: [4, 8, 12],
    output: importView('output', outputBuffer, sourceIds.length * 2)
  });
  scatter.addToGraph(graph);
  const compiled = graph.compile();

  try {
    await encodeAndSubmit(device, compiled, 'chunked-scatter-first');
    const firstOutput = await readUint32(outputBuffer, 6);
    t.deepEqual(
      firstOutput.slice(0, 2).sort((a, b) => a - b),
      [2, 9],
      'chunk zero jobs'
    );
    t.deepEqual(
      firstOutput.slice(2, 4).sort((a, b) => a - b),
      [3, 10],
      'chunk one jobs'
    );
    t.deepEqual(
      firstOutput.slice(4, 6).sort((a, b) => a - b),
      [8, 11],
      'chunk two jobs'
    );

    sourceCountBuffer.write(Uint32Array.from([1]));
    await encodeAndSubmit(device, compiled, 'chunked-scatter-updated');
    t.deepEqual(
      (await readUint32(outputBuffer, 2)).sort((a, b) => a - b),
      [10, 11],
      'GPU-resident counts update routed work without recompilation'
    );
  } finally {
    compiled.destroy();
    sourceIdsBuffer.destroy();
    sourceCountBuffer.destroy();
    routesBuffer.destroy();
    outputBuffer.destroy();
  }

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
