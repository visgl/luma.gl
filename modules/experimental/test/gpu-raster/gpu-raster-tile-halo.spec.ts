// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterTileCache,
  GPURasterTileCoreExtract,
  GPURasterTileHaloAssembler,
  GPURasterTileHaloFill,
  GPURasterTileReader,
  type GPURasterBufferBand,
  type GPURasterDecodedBand,
  type GPURasterDecodedTile,
  type GPURasterPixelBounds,
  type GPURasterScalarFormat,
  type GPURasterTileHaloSource,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type RasterSamples = Float32Array | Uint32Array | Int32Array;

const SOURCE_REGIONS: readonly GPURasterPixelBounds[] = [
  [1, 2, 3, 3],
  [3, 2, 5, 3],
  [1, 3, 3, 5],
  [3, 3, 5, 5]
];

test('GPURaster tile halo gather preserves exact scalar formats, masks, raw nodata, and offset guards', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  for (const format of ['float32', 'uint32', 'sint32'] as const) {
    await assertExactHaloTransfer(testCase, device, format);
  }
  testCase.end();
});

test('GPURaster tile halo pins diagonal/ragged WebGPU imports through core publication and fencing', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const source = new WebGPUHaloSource();
  const cache = new GPURasterTileCache({
    reader: new GPURasterTileReader(source),
    device,
    maxTiles: 6,
    maxGraphs: 1,
    maxCpuBytes: 4096,
    maxGpuBytes: 4096
  });
  const assembler = new GPURasterTileHaloAssembler(cache);
  const lease = await assembler.acquire({
    level: 0,
    column: 1,
    row: 0,
    bandIds: ['unsigned'],
    stages: [{requiredHalo: 1}]
  });

  testCase.deepEqual(lease.plan.corePixelBounds, [2, 0, 4, 2], 'half-open owning core');
  testCase.deepEqual(lease.plan.availablePixelBounds, [1, 0, 5, 3], 'ragged clipped neighborhood');
  testCase.equal(
    lease.tiles.length,
    6,
    'all horizontal, vertical, and diagonal imports are pinned'
  );
  testCase.equal(source.requests.length, 6, 'one bounded decode per full canonical source tile');

  const graph = new GPUCommandGraph(device, {id: 'resident-tile-halo'});
  const availableLength = lease.plan.width * lease.plan.height;
  const coreLength = lease.plan.coreWidth * lease.plan.coreHeight;
  const assembled = makeGuardedBuffer(device, 'uint32', [], availableLength, 1);
  const assembledValidity = makeGuardedBuffer(device, 'uint32', [], availableLength, 1);
  const core = makeGuardedBuffer(device, 'uint32', [], coreLength, 1);
  const coreValidity = makeGuardedBuffer(device, 'uint32', [], coreLength, 1);
  const sources: GPURasterTileHaloSource<'uint32'>[] = lease.tiles.map((tile, index) => {
    const resident = tile.bands[0];
    const pixelCount = tile.decoded.metadata.width * tile.decoded.metadata.height;
    const input: GPURasterBufferBand<'uint32'> = {
      id: 'unsigned',
      format: 'uint32',
      noDataValue: 4294967295,
      scale: 0.5,
      offset: 9,
      storage: {
        kind: 'buffer',
        values: importView(graph, `tile-${index}`, resident.buffer, 'uint32', pixelCount)
      },
      validity: importView(
        graph,
        `tile-validity-${index}`,
        resident.validity!,
        'uint32',
        pixelCount
      )
    };
    return {pixelBounds: tile.decoded.pixelBounds, input};
  });
  const assembledValues = importView(graph, 'assembled', assembled, 'uint32', availableLength, 4);
  const assembledMask = importView(
    graph,
    'assembled-validity',
    assembledValidity,
    'uint32',
    availableLength,
    4
  );
  new GPURasterTileHaloFill({
    id: 'gather-resident',
    pixelBounds: lease.plan.availablePixelBounds,
    sources,
    output: assembledValues,
    outputValidity: assembledMask
  }).addToGraph(graph);
  new GPURasterTileCoreExtract({
    id: 'publish-core',
    availablePixelBounds: lease.plan.availablePixelBounds,
    corePixelBounds: lease.plan.corePixelBounds,
    input: {
      id: 'unsigned',
      format: 'uint32',
      noDataValue: 4294967295,
      scale: 0.5,
      offset: 9,
      storage: {kind: 'buffer', values: assembledValues},
      validity: assembledMask
    },
    output: importView(graph, 'core', core, 'uint32', coreLength, 4),
    outputValidity: importView(graph, 'core-validity', coreValidity, 'uint32', coreLength, 4)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'submit-resident-halo'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  const submittedFence = device.createFence();
  const gate = makeDeferred<void>();
  const completion = submittedFence.signaled.then(() => gate.promise);
  const released = lease.releaseAfter(completion);
  const importedBuffers = lease.tiles.flatMap(tile => [
    tile.bands[0].buffer,
    tile.bands[0].validity!
  ]);
  cache.destroy();

  testCase.ok(
    importedBuffers.every(buffer => !buffer.destroyed),
    'submitted source imports remain pinned'
  );
  testCase.deepEqual(
    (await readSamples(assembled, 'uint32')).slice(1, availableLength + 1),
    makeRegionValues('uint32', lease.plan.availablePixelBounds),
    'GPU assembles every neighboring raw native uint32 sample without CPU staging'
  );
  testCase.deepEqual(
    (await readSamples(core, 'uint32')).slice(1, coreLength + 1),
    makeRegionValues('uint32', lease.plan.corePixelBounds),
    'only half-open owned core samples are published'
  );
  testCase.deepEqual(
    (await readSamples(coreValidity, 'uint32')).slice(1, coreLength + 1),
    makeRegionValidity(lease.plan.corePixelBounds),
    'native decoded nodata/validity flags survive gather and publication'
  );

  gate.resolve();
  await released;
  testCase.ok(
    importedBuffers.every(buffer => buffer.destroyed),
    'all six source leases release after one fence'
  );
  testCase.equal(cache.stats.gpuBytes, 0, 'composite teardown returns all resident GPU bytes');
  compiled.destroy();
  for (const buffer of [assembled, assembledValidity, core, coreValidity]) buffer.destroy();
  testCase.end();
});

async function assertExactHaloTransfer(
  testCase: Test,
  device: Device,
  format: GPURasterScalarFormat
): Promise<void> {
  const graph = new GPUCommandGraph(device, {id: `offset-halo-${format}`});
  const ownedBuffers: Buffer[] = [];
  const sources: GPURasterTileHaloSource[] = SOURCE_REGIONS.map((pixelBounds, index) => {
    const values = makeRegionValues(format, pixelBounds);
    const validity = makeRegionValidity(pixelBounds);
    const valuesBuffer = makeGuardedBuffer(device, format, values, values.length, 1);
    const validityBuffer = makeGuardedBuffer(device, 'uint32', validity, validity.length, 2);
    ownedBuffers.push(valuesBuffer, validityBuffer);
    const input = {
      id: 'sample',
      format,
      noDataValue: getNoDataValue(format),
      scale: 0.5,
      offset: 9,
      storage: {
        kind: 'buffer',
        values: importView(graph, `source-${index}`, valuesBuffer, format, values.length, 4)
      },
      validity: importView(
        graph,
        `source-mask-${index}`,
        validityBuffer,
        'uint32',
        validity.length,
        8
      )
    } as GPURasterBufferBand;
    return {pixelBounds, input};
  });
  const availableBounds: GPURasterPixelBounds = [1, 2, 5, 5];
  const coreBounds: GPURasterPixelBounds = [2, 3, 4, 5];
  const availableLength = 12;
  const coreLength = 4;
  const assembled = makeGuardedBuffer(device, format, [], availableLength, 1);
  const assembledValidity = makeGuardedBuffer(device, 'uint32', [], availableLength, 2);
  const output = makeGuardedBuffer(device, format, [], coreLength, 1);
  const outputValidity = makeGuardedBuffer(device, 'uint32', [], coreLength, 1);
  ownedBuffers.push(assembled, assembledValidity, output, outputValidity);
  const assembledValues = importView(graph, 'assembled', assembled, format, availableLength, 4);
  const assembledMask = importView(
    graph,
    'assembled-validity',
    assembledValidity,
    'uint32',
    availableLength,
    8
  );

  new GPURasterTileHaloFill({
    id: `gather-${format}`,
    pixelBounds: availableBounds,
    sources,
    output: assembledValues,
    outputValidity: assembledMask
  }).addToGraph(graph);
  new GPURasterTileCoreExtract({
    id: `extract-${format}`,
    availablePixelBounds: availableBounds,
    corePixelBounds: coreBounds,
    input: {
      id: 'sample',
      format,
      noDataValue: getNoDataValue(format),
      scale: 0.5,
      offset: 9,
      storage: {kind: 'buffer', values: assembledValues},
      validity: assembledMask
    } as GPURasterBufferBand,
    output: importView(graph, 'core', output, format, coreLength, 4),
    outputValidity: importView(graph, 'core-validity', outputValidity, 'uint32', coreLength, 4)
  }).addToGraph(graph);
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: `submit-offset-halo-${format}`});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const valueGuard = getGuardValue(format);
  const maskGuard = getGuardValue('uint32');
  testCase.deepEqual(
    await readSamples(assembled, format),
    [valueGuard, ...makeRegionValues(format, availableBounds), valueGuard],
    `${format} exact raw scalar values and nonzero destination offset`
  );
  testCase.deepEqual(
    await readSamples(assembledValidity, 'uint32'),
    [maskGuard, maskGuard, ...makeRegionValidity(availableBounds), maskGuard],
    `${format} exact source validity with independently offset storage bindings`
  );
  testCase.deepEqual(
    await readSamples(output, format),
    [valueGuard, ...makeRegionValues(format, coreBounds), valueGuard],
    `${format} core excludes every padded halo sample and preserves guards`
  );
  testCase.deepEqual(
    await readSamples(outputValidity, 'uint32'),
    [maskGuard, ...makeRegionValidity(coreBounds), maskGuard],
    `${format} core publishes only owned validity flags`
  );

  compiled.destroy();
  testCase.ok(
    ownedBuffers.every(buffer => !buffer.destroyed),
    `${format} graph borrows all storage`
  );
  for (const buffer of ownedBuffers) buffer.destroy();
}

class WebGPUHaloSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata = {
    id: 'webgpu-native-halo',
    width: 5,
    height: 4,
    affine: [1, 0, 0, 0, 1, 0],
    pixelInterpretation: 'area',
    bands: [{id: 'unsigned', format: 'uint32', noDataValue: 4294967295, scale: 0.5, offset: 9}],
    levels: [{level: 0, width: 5, height: 4, tileWidth: 2, tileHeight: 2, downsample: [1, 1]}]
  };

  readonly requests: GPURasterTileRequest[] = [];

  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    signal.throwIfAborted();
    this.requests.push(request);
    const bounds = request.pixelBounds!;
    const values = Uint32Array.from(makeRegionValues('uint32', bounds));
    const validity = Uint32Array.from(makeRegionValidity(bounds));
    const band: GPURasterDecodedBand<'uint32'> = {
      id: 'unsigned',
      format: 'uint32',
      noDataValue: 4294967295,
      scale: 0.5,
      offset: 9,
      values,
      validity
    };
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
      bands: [band]
    };
  }
}

function makeRegionValues(format: GPURasterScalarFormat, bounds: GPURasterPixelBounds): number[] {
  const result: number[] = [];
  for (let row = bounds[1]; row < bounds[3]; row++) {
    for (let column = bounds[0]; column < bounds[2]; column++) {
      const index = row * 10 + column;
      if (column === 3 && row === 3) {
        result.push(getNoDataValue(format));
      } else if (format === 'uint32') {
        result.push(4294967000 + index);
      } else if (format === 'sint32') {
        result.push(-2147483600 + index);
      } else {
        result.push(index + 0.25);
      }
    }
  }
  return result;
}

function makeRegionValidity(bounds: GPURasterPixelBounds): number[] {
  const result: number[] = [];
  for (let row = bounds[1]; row < bounds[3]; row++) {
    for (let column = bounds[0]; column < bounds[2]; column++) {
      result.push((column + row) % 4 === 0 ? 0 : 1);
    }
  }
  return result;
}

function makeGuardedBuffer(
  device: Device,
  format: GPURasterScalarFormat,
  values: readonly number[],
  length: number,
  prefixLength: number
): Buffer {
  const totalLength = prefixLength + length + 1;
  const data = makeTypedSamples(format, totalLength);
  data.fill(getGuardValue(format));
  data.set(values, prefixLength);
  return device.createBuffer({
    data,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
}

function makeTypedSamples(format: GPURasterScalarFormat, length: number): RasterSamples {
  if (format === 'float32') return new Float32Array(length);
  if (format === 'uint32') return new Uint32Array(length);
  return new Int32Array(length);
}

function importView<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  byteOffset: number = 0
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

function getNoDataValue(format: GPURasterScalarFormat): number {
  if (format === 'float32') return -9999;
  if (format === 'uint32') return 4294967295;
  return -2147483648;
}

function getGuardValue(format: GPURasterScalarFormat): number {
  if (format === 'float32') return -123456;
  if (format === 'uint32') return 4000000001;
  return -2000000001;
}

async function readSamples(buffer: Buffer, format: GPURasterScalarFormat): Promise<number[]> {
  const bytes = await buffer.readAsync();
  const length = bytes.byteLength / 4;
  if (format === 'float32') {
    return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
  }
  if (format === 'uint32') {
    return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
  }
  return Array.from(new Int32Array(bytes.buffer, bytes.byteOffset, length));
}

function makeDeferred<Value>(): {promise: Promise<Value>; resolve: (value: Value) => void} {
  let resolve = (_value: Value): void => {};
  const promise = new Promise<Value>(resolvePromise => {
    resolve = resolvePromise;
  });
  return {promise, resolve};
}
