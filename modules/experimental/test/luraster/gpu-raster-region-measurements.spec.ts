// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  getRasterRegionWorldCentroid,
  GPURasterRegionMeasurements,
  type GPURasterMetadata,
  type GPURasterRegionMeasurementOutputs
} from '@luma.gl/experimental/luraster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type ScalarFormat = 'uint32' | 'float32';

type GuardedBuffer<Format extends ScalarFormat = ScalarFormat> = {
  buffer: Buffer;
  format: Format;
  length: number;
  prefixLength: number;
};

type RegionFixture = {
  id: string;
  metadata: GPURasterMetadata;
  labels: readonly number[];
  labelValidity: readonly number[];
  intensity: readonly number[];
  intensityValidity?: readonly number[];
  noDataValue?: number;
  scale?: number;
  offset?: number;
  componentCount: number;
  regionCount: number;
  capacity?: number;
  converged?: number;
  overflow?: number;
};

type RegionOutputs = {
  [Property in keyof GPURasterRegionMeasurementOutputs]: GuardedBuffer<
    Property extends 'pixelCounts' | 'intensityCounts' ? 'uint32' : 'float32'
  >;
};

type RegionExecution = {
  graph: GPUCommandGraph;
  compiled: ReturnType<GPUCommandGraph['compile']>;
  metadata: GPURasterMetadata;
  labels: GuardedBuffer<'uint32'>;
  labelValidity: GuardedBuffer<'uint32'>;
  intensity: GuardedBuffer<'float32'>;
  intensityValidity?: GuardedBuffer<'uint32'>;
  converged: GuardedBuffer<'uint32'>;
  componentCount: GuardedBuffer<'uint32'>;
  overflow: GuardedBuffer<'uint32'>;
  output: RegionOutputs;
  owned: GuardedBuffer[];
};

const GUARD_VALUE = 4000000001;

test('LuRaster region topology, finite calibrated intensities, rotated affine areas and local centroids stay independent', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const execution = makeExecution(device, {
    id: 'calibrated-rotated-area-regions',
    metadata: {
      width: 4,
      height: 3,
      affine: [2, 1, 10000000.25, -1, 3, -20000000.75],
      pixelInterpretation: 'area',
      coordinateReferenceSystem: {authority: 'EPSG:4326'},
      levelZeroOrigin: [2048, 4096]
    },
    labels: [1, 1, 0, 2, 1, 0, 2, 2, 3, 3, 0, 0],
    labelValidity: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    intensity: [1, 999, 4, 2, Number.NaN, 8, 3, Number.POSITIVE_INFINITY, 5, 6, 7, 9],
    intensityValidity: [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
    noDataValue: 999,
    scale: 2,
    offset: 1,
    componentCount: 3,
    regionCount: 4
  });
  submitGraph(device, execution.compiled, 'submit-calibrated-rotated-regions');

  testCase.deepEqual(
    await readLogical(execution.output.pixelCounts),
    [3, 3, 2, 0],
    'region geometry counts valid dense members without treating zero background as region zero'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensityCounts),
    [1, 1, 1, 0],
    'independent raw nodata, explicit source mask, NaN, and infinity reduce only intensity population'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensitySums),
    [3, 5, 11, 0],
    'float intensities apply raw * scale + offset exactly once before grouped sums'
  );
  await assertFinitePrefix(
    testCase,
    execution.output.intensityMinimums,
    [3, 5, 11],
    'intensity minimum'
  );
  await assertFinitePrefix(
    testCase,
    execution.output.intensityMaximums,
    [3, 5, 11],
    'intensity maximum'
  );
  await assertFinitePrefix(testCase, execution.output.intensityMeans, [3, 5, 11], 'intensity mean');
  testCase.deepEqual(
    await readLogical(execution.output.columnSums),
    [2.5, 9.5, 2, 0],
    'area-grid column moments use pixel centers independently of intensity holes'
  );
  testCase.deepEqual(
    await readLogical(execution.output.rowSums),
    [2.5, 3.5, 5, 0],
    'area-grid row moments preserve mergeable geometric partials'
  );
  const centroidColumns = await readLogical(execution.output.centroidColumns);
  const centroidRows = await readLogical(execution.output.centroidRows);
  assertClose(testCase, centroidColumns[0]!, 2.5 / 3, 'first local centroid column');
  assertClose(testCase, centroidColumns[1]!, 9.5 / 3, 'second local centroid column');
  assertClose(testCase, centroidColumns[2]!, 1, 'third local centroid column');
  assertClose(testCase, centroidRows[0]!, 2.5 / 3, 'first local centroid row');
  assertClose(testCase, centroidRows[1]!, 3.5 / 3, 'second local centroid row');
  assertClose(testCase, centroidRows[2]!, 2.5, 'third local centroid row');
  testCase.ok(Number.isNaN(centroidColumns[3]), 'empty centroid column is canonical NaN');
  testCase.ok(Number.isNaN(centroidRows[3]), 'empty centroid row is canonical NaN');
  testCase.deepEqual(
    await readLogical(execution.output.areas),
    [21, 21, 14, 0],
    'affine determinant yields square coordinate units even for a geographic-degree CRS'
  );
  const absoluteCentroid = getRasterRegionWorldCentroid(
    execution.metadata,
    centroidColumns[2]!,
    centroidRows[2]!
  );
  testCase.deepEqual(
    absoluteCentroid,
    [10000004.75, -19999994.25],
    'JavaScript double precision applies translated/sheared affine exactly once without tile-origin drift'
  );
  await assertAllGuards(testCase, execution, 'rotated calibrated region outputs');
  destroyExecution(testCase, execution);
  testCase.end();
});

test('LuRaster point-pixel regions preserve signed-zero extrema, negative intensities, and exact local moments', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const execution = makeExecution(device, {
    id: 'point-grid-negative-intensities',
    metadata: {
      width: 3,
      height: 2,
      affine: [0, -2, 20000000.125, 3, 0, -30000000.625],
      pixelInterpretation: 'point'
    },
    labels: [1, 1, 2, 2, 0, 3],
    labelValidity: [1, 1, 1, 1, 1, 1],
    intensity: [-0, 0, -2, 4, 100, 7],
    componentCount: 3,
    regionCount: 3
  });
  submitGraph(device, execution.compiled, 'submit-point-grid-negative-regions');

  testCase.deepEqual(
    await readLogical(execution.output.pixelCounts),
    [2, 2, 1],
    'point-grid region populations ignore genuine background'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensityCounts),
    [2, 2, 1],
    'all finite point observations participate'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensitySums),
    [0, 2, 7],
    'negative floating intensities retain signed contributions'
  );
  const minimums = await readLogical(execution.output.intensityMinimums);
  const maximums = await readLogical(execution.output.intensityMaximums);
  testCase.ok(Object.is(minimums[0], -0), 'ordered grouped minimum preserves negative zero');
  testCase.ok(Object.is(maximums[0], 0), 'ordered grouped maximum preserves positive zero');
  testCase.deepEqual(minimums.slice(1), [-2, 7], 'negative minimum and singleton are exact');
  testCase.deepEqual(maximums.slice(1), [4, 7], 'positive maximum and singleton are exact');
  testCase.deepEqual(
    await readLogical(execution.output.intensityMeans),
    [0, 1, 7],
    'means divide by valid intensity count'
  );
  testCase.deepEqual(
    await readLogical(execution.output.columnSums),
    [1, 2, 2],
    'point-grid columns use zero-centered pixel coordinates'
  );
  testCase.deepEqual(
    await readLogical(execution.output.rowSums),
    [0, 1, 1],
    'point-grid rows use zero-centered pixel coordinates'
  );
  testCase.deepEqual(
    await readLogical(execution.output.centroidColumns),
    [0.5, 1, 2],
    'point centroids omit the area-pixel half offset'
  );
  testCase.deepEqual(
    await readLogical(execution.output.centroidRows),
    [0, 0.5, 1],
    'point row centroids omit the area-pixel half offset'
  );
  testCase.deepEqual(
    await readLogical(execution.output.areas),
    [12, 12, 6],
    'absolute rotated determinant handles sign and non-square pixels'
  );
  testCase.deepEqual(
    getRasterRegionWorldCentroid(execution.metadata, 1, 0.5),
    [19999999.125, -29999997.625],
    'large translations retain sub-unit coordinates beyond float32 precision'
  );
  await assertAllGuards(testCase, execution, 'point-pixel region outputs');
  destroyExecution(testCase, execution);
  testCase.end();
});

test('LuRaster region replay fail-closes convergence, dense overflow and capacity before recovering clean rows', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const execution = makeExecution(device, {
    id: 'replayed-region-gates',
    metadata: {width: 3, height: 2, affine: [1, 0, 0, 0, 1, 0], pixelInterpretation: 'area'},
    labels: [1, 1, 0, 2, 2, 0],
    labelValidity: [1, 1, 1, 1, 1, 1],
    intensity: [1, 2, 9, 3, 4, 8],
    componentCount: 2,
    regionCount: 3,
    capacity: 2
  });
  submitGraph(device, execution.compiled, 'submit-initial-valid-regions');
  testCase.deepEqual(
    await readLogical(execution.output.pixelCounts),
    [2, 2, 0],
    'initial bounded groups are valid'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensitySums),
    [3, 7, 0],
    'initial region sums are populated'
  );

  writeLogical(execution.overflow, [1]);
  submitGraph(device, execution.compiled, 'reencode-overflowed-regions');
  await assertAllRegionsInvalid(testCase, execution, 'dense overflow');

  writeLogical(execution.overflow, [0]);
  writeLogical(execution.converged, [0]);
  submitGraph(device, execution.compiled, 'reencode-unconverged-regions');
  await assertAllRegionsInvalid(testCase, execution, 'nonconverged dense roots');

  writeLogical(execution.converged, [1]);
  writeLogical(execution.componentCount, [3]);
  submitGraph(device, execution.compiled, 'reencode-out-of-capacity-regions');
  await assertAllRegionsInvalid(testCase, execution, 'component count above configured capacity');

  writeLogical(execution.componentCount, [1]);
  writeLogical(execution.labels, [0, 1, 1, 0, 0, 0]);
  writeLogical(execution.intensity, [9, 10, 20, 7, 8, 6]);
  submitGraph(device, execution.compiled, 'reencode-recovered-region');
  testCase.deepEqual(
    await readLogical(execution.output.pixelCounts),
    [2, 0, 0],
    'recovery removes all stale topological populations'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensityCounts),
    [2, 0, 0],
    'recovery removes all stale intensity populations'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensitySums),
    [30, 0, 0],
    'replacement observations become the only mergeable sum'
  );
  testCase.equal(
    (await readLogical(execution.output.intensityMeans))[0],
    15,
    'replacement mean is recomputed from current intensity count'
  );
  testCase.equal(
    (await readLogical(execution.output.areas))[0],
    2,
    'replacement affine area uses current topology only'
  );
  await assertAllGuards(testCase, execution, 'convergence-safe region replay');
  destroyExecution(testCase, execution);

  const zeroCapacity = makeExecution(device, {
    id: 'zero-active-region-capacity',
    metadata: {width: 2, height: 1, affine: [1, 0, 0, 0, 1, 0], pixelInterpretation: 'area'},
    labels: [0, 0],
    labelValidity: [1, 1],
    intensity: [4, 5],
    componentCount: 0,
    regionCount: 2,
    capacity: 0
  });
  submitGraph(device, zeroCapacity.compiled, 'submit-zero-region-capacity');
  await assertAllRegionsInvalid(testCase, zeroCapacity, 'explicit zero active capacity');
  destroyExecution(testCase, zeroCapacity);
  testCase.end();
});

function makeExecution(device: Device, fixture: RegionFixture): RegionExecution {
  const graph = new GPUCommandGraph(device, {id: fixture.id});
  const owned: GuardedBuffer[] = [];
  const pixelCount = fixture.metadata.width * fixture.metadata.height;
  const labels = makeGuardedBuffer(device, owned, `${fixture.id}-labels`, 'uint32', pixelCount, 1);
  const labelValidity = makeGuardedBuffer(
    device,
    owned,
    `${fixture.id}-label-validity`,
    'uint32',
    pixelCount,
    2
  );
  const intensity = makeGuardedBuffer(
    device,
    owned,
    `${fixture.id}-intensity`,
    'float32',
    pixelCount,
    3
  );
  const intensityValidity = fixture.intensityValidity
    ? makeGuardedBuffer(device, owned, `${fixture.id}-intensity-validity`, 'uint32', pixelCount, 1)
    : undefined;
  const converged = makeGuardedBuffer(device, owned, `${fixture.id}-converged`, 'uint32', 1, 2);
  const componentCount = makeGuardedBuffer(device, owned, `${fixture.id}-count`, 'uint32', 1, 3);
  const overflow = makeGuardedBuffer(device, owned, `${fixture.id}-overflow`, 'uint32', 1, 1);
  const output = makeRegionOutputs(device, owned, fixture.id, fixture.regionCount);
  writeLogical(labels, fixture.labels);
  writeLogical(labelValidity, fixture.labelValidity);
  writeLogical(intensity, fixture.intensity);
  if (intensityValidity && fixture.intensityValidity)
    writeLogical(intensityValidity, fixture.intensityValidity);
  writeLogical(converged, [fixture.converged ?? 1]);
  writeLogical(componentCount, [fixture.componentCount]);
  writeLogical(overflow, [fixture.overflow ?? 0]);

  new GPURasterRegionMeasurements({
    id: fixture.id,
    metadata: fixture.metadata,
    labels: importView(graph, labels),
    labelValidity: importView(graph, labelValidity),
    converged: importView(graph, converged),
    componentCount: importView(graph, componentCount),
    overflow: importView(graph, overflow),
    intensity: {
      id: `${fixture.id}-float-band`,
      format: 'float32',
      storage: {kind: 'buffer', values: importView(graph, intensity)},
      ...(intensityValidity ? {validity: importView(graph, intensityValidity)} : {}),
      ...(fixture.noDataValue !== undefined ? {noDataValue: fixture.noDataValue} : {}),
      ...(fixture.scale !== undefined ? {scale: fixture.scale} : {}),
      ...(fixture.offset !== undefined ? {offset: fixture.offset} : {})
    },
    output: {
      pixelCounts: importView(graph, output.pixelCounts),
      intensityCounts: importView(graph, output.intensityCounts),
      intensitySums: importView(graph, output.intensitySums),
      intensityMinimums: importView(graph, output.intensityMinimums),
      intensityMaximums: importView(graph, output.intensityMaximums),
      intensityMeans: importView(graph, output.intensityMeans),
      columnSums: importView(graph, output.columnSums),
      rowSums: importView(graph, output.rowSums),
      centroidColumns: importView(graph, output.centroidColumns),
      centroidRows: importView(graph, output.centroidRows),
      areas: importView(graph, output.areas)
    },
    ...(fixture.capacity !== undefined ? {capacity: fixture.capacity} : {})
  }).addToGraph(graph);

  return {
    graph,
    compiled: graph.compile(),
    metadata: fixture.metadata,
    labels,
    labelValidity,
    intensity,
    intensityValidity,
    converged,
    componentCount,
    overflow,
    output,
    owned
  };
}

function makeRegionOutputs(
  device: Device,
  owned: GuardedBuffer[],
  id: string,
  regionCount: number
): RegionOutputs {
  return {
    pixelCounts: makeGuardedBuffer(device, owned, `${id}-pixel-counts`, 'uint32', regionCount, 1),
    intensityCounts: makeGuardedBuffer(
      device,
      owned,
      `${id}-intensity-counts`,
      'uint32',
      regionCount,
      2
    ),
    intensitySums: makeGuardedBuffer(
      device,
      owned,
      `${id}-intensity-sums`,
      'float32',
      regionCount,
      3
    ),
    intensityMinimums: makeGuardedBuffer(
      device,
      owned,
      `${id}-minimums`,
      'float32',
      regionCount,
      1
    ),
    intensityMaximums: makeGuardedBuffer(
      device,
      owned,
      `${id}-maximums`,
      'float32',
      regionCount,
      2
    ),
    intensityMeans: makeGuardedBuffer(device, owned, `${id}-means`, 'float32', regionCount, 3),
    columnSums: makeGuardedBuffer(device, owned, `${id}-column-sums`, 'float32', regionCount, 1),
    rowSums: makeGuardedBuffer(device, owned, `${id}-row-sums`, 'float32', regionCount, 2),
    centroidColumns: makeGuardedBuffer(
      device,
      owned,
      `${id}-centroid-columns`,
      'float32',
      regionCount,
      3
    ),
    centroidRows: makeGuardedBuffer(
      device,
      owned,
      `${id}-centroid-rows`,
      'float32',
      regionCount,
      1
    ),
    areas: makeGuardedBuffer(device, owned, `${id}-areas`, 'float32', regionCount, 2)
  };
}

function makeGuardedBuffer<Format extends ScalarFormat>(
  device: Device,
  owned: GuardedBuffer[],
  id: string,
  format: Format,
  length: number,
  prefixLength: number
): GuardedBuffer<Format> {
  const initial = new Uint32Array(prefixLength + length + 1).fill(GUARD_VALUE);
  const entry = {
    buffer: device.createBuffer({
      id,
      data: initial,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    }),
    format,
    length,
    prefixLength
  };
  owned.push(entry);
  return entry;
}

function importView<Format extends ScalarFormat>(
  graph: GPUCommandGraph,
  entry: GuardedBuffer<Format>
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: entry.buffer.id, byteLength: entry.buffer.byteLength, usage: entry.buffer.usage},
    entry.buffer
  );
  return graph.createDataView(handle, {
    format: entry.format,
    length: entry.length,
    byteOffset: entry.prefixLength * Uint32Array.BYTES_PER_ELEMENT
  });
}

function writeLogical(entry: GuardedBuffer, values: readonly number[]): void {
  const words = new Uint32Array(entry.prefixLength + entry.length + 1).fill(GUARD_VALUE);
  if (entry.format === 'float32') {
    new Float32Array(words.buffer).set(values, entry.prefixLength);
  } else {
    words.set(values, entry.prefixLength);
  }
  entry.buffer.write(words);
}

async function readLogical(entry: GuardedBuffer): Promise<number[]> {
  const bytes = await entry.buffer.readAsync();
  const ArrayType = entry.format === 'float32' ? Float32Array : Uint32Array;
  const values = new ArrayType(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  return Array.from(values.slice(entry.prefixLength, entry.prefixLength + entry.length));
}

async function assertFinitePrefix(
  testCase: Test,
  entry: GuardedBuffer<'float32'>,
  expected: readonly number[],
  label: string
): Promise<void> {
  const values = await readLogical(entry);
  testCase.deepEqual(
    values.slice(0, expected.length),
    [...expected],
    `${label} excludes invalid intensity observations`
  );
  testCase.ok(
    Number.isNaN(values[expected.length]),
    `${label} marks the empty trailing region NaN`
  );
}

function assertClose(testCase: Test, actual: number, expected: number, label: string): void {
  testCase.ok(
    Math.abs(actual - expected) < 0.00001,
    `${label}: ${actual} is within float32 tolerance of ${expected}`
  );
}

async function assertAllRegionsInvalid(
  testCase: Test,
  execution: RegionExecution,
  label: string
): Promise<void> {
  const zeroNames = [
    'pixelCounts',
    'intensityCounts',
    'intensitySums',
    'columnSums',
    'rowSums',
    'areas'
  ] as const;
  const nanNames = [
    'intensityMinimums',
    'intensityMaximums',
    'intensityMeans',
    'centroidColumns',
    'centroidRows'
  ] as const;
  for (const name of zeroNames) {
    const values = await readLogical(execution.output[name]);
    testCase.deepEqual(
      values,
      Array.from({length: values.length}, () => 0),
      `${label}: ${name} clears every group`
    );
  }
  for (const name of nanNames) {
    const values = await readLogical(execution.output[name]);
    testCase.ok(values.every(Number.isNaN), `${label}: ${name} marks every group invalid`);
  }
}

async function assertAllGuards(
  testCase: Test,
  execution: RegionExecution,
  label: string
): Promise<void> {
  for (const entry of execution.owned) {
    const bytes = await entry.buffer.readAsync();
    const words = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    testCase.deepEqual(
      Array.from(words.slice(0, entry.prefixLength)),
      Array.from({length: entry.prefixLength}, () => GUARD_VALUE),
      `${label}: ${entry.buffer.id} preserves every physical prefix`
    );
    testCase.equal(words.at(-1), GUARD_VALUE, `${label}: ${entry.buffer.id} preserves its suffix`);
  }
}

function submitGraph(
  device: Device,
  compiled: ReturnType<GPUCommandGraph['compile']>,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

function destroyExecution(testCase: Test, execution: RegionExecution): void {
  execution.compiled.destroy();
  for (const {buffer} of execution.owned) {
    testCase.notOk(buffer.destroyed, 'region graph destruction does not destroy borrowed storage');
    buffer.destroy();
  }
}
