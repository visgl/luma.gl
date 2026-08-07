// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterNeighborhood,
  GPURasterTileCache,
  GPURasterTileReader,
  type GPURasterDecodedTile,
  type GPURasterPixelBounds,
  type GPURasterResidentBand,
  type GPURasterTileGraphEntry,
  type GPURasterTileLease,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata
} from '@luma.gl/experimental/luraster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from '../../../../test/utils/vitest-tape';

type OwnedNeighborhood = {
  values: Buffer;
  validity: Buffer;
};

test('LuRaster bounded residency safely rebinds an evicted imported WebGPU tile without recompilation', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const source = new WebGPUTileSource();
  const cache = new GPURasterTileCache({
    device,
    reader: new GPURasterTileReader(source),
    maxTiles: 2,
    maxGraphs: 1,
    maxCpuBytes: 1024,
    maxGpuBytes: 1024
  });

  const west = await cache.acquire({level: 0, column: 0, row: 0});
  const westSamples = west.bands[0].buffer;
  const westValidity = west.bands[0].validity as Buffer;
  const firstGraph = await cache.acquireGraph(west, {
    pipelineKey: 'validity-aware-neighborhood',
    estimatedByteLength: 256,
    create: () => makeNeighborhoodGraph(device, west)
  });
  const firstOwner = firstGraph.value;

  encodeTile(device, firstGraph.graph, west, 'bounded-west-encoding');
  const firstFence = device.createFence();
  await Promise.all([west.releaseAfter(firstFence), firstGraph.releaseAfter(firstFence)]);
  testCase.deepEqual(
    await readValues(firstOwner.values, 4),
    [1, Number.NaN, 3, 4],
    'first native float32 tile remains GPU-resident and honors its validity mask'
  );
  testCase.deepEqual(
    await readValidity(firstOwner.validity, 4),
    [1, 0, 1, 1],
    'first decoded mask is consumed directly from resident GPU storage'
  );

  const east = await cache.acquire({level: 0, column: 1, row: 0});
  const reused = await cache.acquireGraph(east, {
    pipelineKey: 'validity-aware-neighborhood',
    estimatedByteLength: 256,
    create: () => {
      throw new Error('Compatible east tile must reuse its existing compiled graph');
    }
  });
  testCase.equal(reused.value, firstOwner, 'same tile shape borrows the original graph owner');
  testCase.equal(cache.stats.graphCompilations, 1, 'west and east compile exactly one graph');
  testCase.equal(cache.stats.graphHits, 1, 'east acquisition reuses the existing graph shape');

  cache.setBudgets({maxTiles: 1});
  testCase.ok(westSamples.destroyed, 'deterministic LRU eviction destroys old cached samples');
  testCase.ok(westValidity.destroyed, 'eviction destroys the old cached source-validity mask');
  testCase.notOk(east.bands[0].buffer.destroyed, 'the active encoded replacement remains pinned');
  testCase.equal(cache.stats.tileEvictions, 1, 'cache records the ownership-correct eviction');

  encodeTile(device, reused.graph, east, 'bounded-east-replacement-encoding');
  const secondFence = device.createFence();
  const releaseGate = makeCompletionGate();
  const submittedCompletion = secondFence.signaled.then(() => releaseGate.promise);
  const graphReleased = reused.releaseAfter(submittedCompletion);
  const tileReleased = east.releaseAfter(submittedCompletion);

  cache.destroy();
  testCase.notOk(
    firstOwner.values.destroyed,
    'teardown retains compiled graph outputs while pinned'
  );
  testCase.notOk(
    east.bands[0].buffer.destroyed,
    'teardown retains submitted source imports while pinned'
  );
  testCase.deepEqual(
    await readValues(firstOwner.values, 4),
    [11, 12, Number.NaN, 14],
    'compiled graph resolves east replacements even after its original imports were destroyed'
  );
  testCase.deepEqual(
    await readValidity(firstOwner.validity, 4),
    [1, 1, 0, 1],
    'same compiled graph rebinds the replacement tile validity independently'
  );

  releaseGate.resolve();
  await Promise.all([graphReleased, tileReleased]);
  testCase.ok(
    firstOwner.values.destroyed,
    'application-owned graph outputs release after completion'
  );
  testCase.ok(
    firstOwner.validity.destroyed,
    'all graph-owned outputs release exactly after completion'
  );
  testCase.ok(
    east.bands[0].buffer.destroyed,
    'cache-owned replacement buffers release after completion'
  );
  testCase.equal(
    source.readCount,
    2,
    'two distinct windows perform exactly two application-owned reads'
  );
  testCase.equal(cache.stats.gpuBytes, 0, 'all explicitly owned GPU bytes are released');
  testCase.end();
});

class WebGPUTileSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata = {
    id: 'webgpu-bounded-tile-cache',
    width: 8,
    height: 1,
    affine: [1, 0, 0, 0, 1, 0],
    pixelInterpretation: 'area',
    bands: [{id: 'source', format: 'float32'}],
    levels: [{level: 0, width: 8, height: 1, tileWidth: 4, tileHeight: 1, downsample: [1, 1]}]
  };

  readCount = 0;

  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    signal.throwIfAborted();
    this.readCount++;
    const bounds = request.pixelBounds as GPURasterPixelBounds;
    const east = request.column === 1;
    const values = Float32Array.from(east ? [11, 12, 13, 14] : [1, 2, 3, 4]);
    const validity = Uint32Array.from(east ? [1, 1, 0, 1] : [1, 0, 1, 1]);
    return {
      level: 0,
      column: request.column ?? 0,
      row: request.row ?? 0,
      pixelBounds: bounds,
      levelZeroBounds: bounds,
      metadata: {
        width: bounds[2] - bounds[0],
        height: bounds[3] - bounds[1],
        affine: [1, 0, bounds[0], 0, 1, bounds[1]],
        pixelInterpretation: 'area',
        level: 0,
        levelZeroOrigin: [bounds[0], bounds[1]]
      },
      bands: [{id: 'source', format: 'float32', values, validity}]
    };
  }
}

function makeNeighborhoodGraph(
  device: Device,
  lease: GPURasterTileLease
): GPURasterTileGraphEntry<OwnedNeighborhood> {
  const band = lease.bands[0];
  const values = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_SRC});
  const validity = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_SRC});
  const graph = new GPUCommandGraph(device, {id: 'bounded-reusable-neighborhood'});
  const input = importResidentBand(graph, band);
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: values.byteLength, usage: values.usage},
    values
  );
  const validityHandle = graph.importBuffer(
    {id: 'output-validity', byteLength: validity.byteLength, usage: validity.usage},
    validity
  );
  new GPURasterNeighborhood({
    width: 4,
    height: 1,
    input,
    output: graph.createDataView(outputHandle, {format: 'float32', length: 4}),
    outputValidity: graph.createDataView(validityHandle, {format: 'uint32', length: 4}),
    radius: 0,
    kernel: [1]
  }).addToGraph(graph);
  const compiled = graph.compile();
  return {
    graph: compiled,
    value: {values, validity},
    byteLength: values.byteLength + validity.byteLength,
    destroy: () => {
      compiled.destroy();
      values.destroy();
      validity.destroy();
    }
  };
}

function importResidentBand(graph: GPUCommandGraph, band: GPURasterResidentBand) {
  const sourceHandle = graph.importBuffer(
    {id: 'source', byteLength: band.buffer.byteLength, usage: band.buffer.usage},
    band.buffer
  );
  const mask = band.validity as Buffer;
  const validityHandle = graph.importBuffer(
    {id: 'source-validity', byteLength: mask.byteLength, usage: mask.usage},
    mask
  );
  const source: GraphDataView<'float32'> = graph.createDataView(sourceHandle, {
    format: 'float32',
    length: 4
  });
  return {
    id: 'source-band',
    format: 'float32' as const,
    storage: {kind: 'buffer' as const, values: source},
    validity: graph.createDataView(validityHandle, {format: 'uint32', length: 4})
  };
}

function encodeTile(
  device: Device,
  graph: GPURasterTileGraphEntry<OwnedNeighborhood>['graph'],
  tile: GPURasterTileLease,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  graph.encode(encoder, {
    parameters: undefined,
    buffers: {
      source: tile.bands[0].buffer,
      'source-validity': tile.bands[0].validity as Buffer
    }
  });
  device.submit(encoder.finish());
}

async function readValues(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readValidity(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

function makeCompletionGate(): {promise: Promise<void>; resolve: () => void} {
  let resolve = () => {};
  const promise = new Promise<void>(resolvePromise => {
    resolve = resolvePromise;
  });
  return {promise, resolve};
}
