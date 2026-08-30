// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  getRasterRegionWorldCentroid,
  GPURasterCrossTileComponents,
  type GPURasterConnectivity,
  type GPURasterCrossTile,
  type GPURasterMetadata,
  type GPURasterPixelBounds,
  type GPURasterRegionMeasurementOutputs
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type ScalarFormat = 'uint32' | 'float32';

type GuardedBuffer<Format extends ScalarFormat = ScalarFormat> = {
  buffer: Buffer;
  format: Format;
  length: number;
  prefixLength: number;
};

type MeasurementBuffers = {
  [Property in keyof GPURasterRegionMeasurementOutputs]: GuardedBuffer<
    Property extends 'pixelCounts' | 'intensityCounts' ? 'uint32' : 'float32'
  >;
};

type TileFixture = {
  bounds: GPURasterPixelBounds;
  labels: readonly number[];
  validity?: readonly number[];
  intensities: readonly number[];
  intensityValidity?: readonly number[];
  localCapacity?: number;
};

type TileExecution = {
  bounds: GPURasterPixelBounds;
  labels: GuardedBuffer<'uint32'>;
  validity: GuardedBuffer<'uint32'>;
  componentCount: GuardedBuffer<'uint32'>;
  converged: GuardedBuffer<'uint32'>;
  overflow: GuardedBuffer<'uint32'>;
  measurements: MeasurementBuffers;
  outputLabels: GuardedBuffer<'uint32'>;
  outputValidity: GuardedBuffer<'uint32'>;
};

type CrossExecution = {
  graph: GPUCommandGraph;
  compiled: ReturnType<GPUCommandGraph['compile']>;
  metadata: GPURasterMetadata;
  tiles: TileExecution[];
  output: MeasurementBuffers;
  componentCount: GuardedBuffer<'uint32'>;
  requiredComponentCount: GuardedBuffer<'uint32'>;
  converged: GuardedBuffer<'uint32'>;
  overflow: GuardedBuffer<'uint32'>;
  owned: GuardedBuffer[];
};

type CrossFixture = {
  id: string;
  metadata: GPURasterMetadata;
  tiles: readonly TileFixture[];
  connectivity?: GPURasterConnectivity;
  regionCapacity?: number;
  capacity?: number;
  maximumIterations?: number;
};

const GUARD_VALUE = 4000000001;

test('LuRaster global dense IDs use true monolithic row-major roots and merge weighted cross-tile partials', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const metadata: GPURasterMetadata = {
    width: 6,
    height: 3,
    affine: [2, 1, 10000000.25, -1, 3, -20000000.75],
    pixelInterpretation: 'area'
  };
  const west: TileFixture = {
    bounds: [0, 0, 3, 3],
    labels: [0, 0, 0, 1, 0, 2, 0, 0, 0],
    validity: [0, 1, 1, 1, 1, 1, 1, 1, 1],
    intensities: [0, 0, 0, 50, 0, 30, 0, 0, 0]
  };
  const east: TileFixture = {
    bounds: [3, 0, 6, 3],
    labels: [1, 1, 0, 1, 0, 0, 0, 2, 0],
    intensities: [10, 20, 0, 40, 0, 0, 0, 60, 0],
    intensityValidity: [1, 0, 1, 1, 1, 1, 1, 1, 1]
  };

  for (const [index, tiles] of [
    [west, east],
    [east, west]
  ].entries()) {
    const execution = makeExecution(device, {
      id: `monolithic-root-order-${index}`,
      metadata,
      tiles,
      regionCapacity: 4
    });
    submitGraph(device, execution.compiled, `submit-monolithic-root-order-${index}`);
    const westResult = execution.tiles.find(tile => tile.bounds[0] === 0)!;
    const eastResult = execution.tiles.find(tile => tile.bounds[0] === 3)!;
    testCase.deepEqual(
      await readLogical(westResult.outputLabels),
      [0, 0, 0, 2, 0, 1, 0, 0, 0],
      `arrival order ${index}: eastern first-row root precedes a western later-row root globally`
    );
    testCase.deepEqual(
      await readLogical(eastResult.outputLabels),
      [1, 1, 0, 1, 0, 0, 0, 3, 0],
      `arrival order ${index}: seam members share the same globally ordered dense identifier`
    );
    testCase.deepEqual(
      await readLogical(westResult.outputValidity),
      [0, 1, 1, 1, 1, 1, 1, 1, 1],
      `arrival order ${index}: nodata validity remains separate from legitimate zero background`
    );
    testCase.equal(
      (await readLogical(execution.componentCount))[0],
      3,
      'global component count is exact'
    );
    testCase.equal(
      (await readLogical(execution.requiredComponentCount))[0],
      3,
      'unclamped global count remains available'
    );
    testCase.equal((await readLogical(execution.converged))[0], 1, 'bounded seam unions converge');
    testCase.equal(
      (await readLogical(execution.overflow))[0],
      0,
      'adequate global capacity does not overflow'
    );
    testCase.deepEqual(
      await readLogical(execution.output.pixelCounts),
      [4, 1, 1, 0],
      'merged geometry counts preserve all seam-connected observations'
    );
    testCase.deepEqual(
      await readLogical(execution.output.intensityCounts),
      [3, 1, 1, 0],
      'missing intensities alter only valid intensity populations'
    );
    testCase.deepEqual(
      await readLogical(execution.output.intensitySums),
      [80, 50, 60, 0],
      'merged sums retain every calibrated tile partial'
    );
    const means = await readLogical(execution.output.intensityMeans);
    assertClose(
      testCase,
      means[0]!,
      80 / 3,
      'merged mean weights exact valid-intensity population'
    );
    testCase.deepEqual(means.slice(1, 3), [50, 60], 'singleton means remain exact');
    testCase.ok(Number.isNaN(means[3]), 'unused global group receives canonical NaN');
    testCase.deepEqual(
      (await readLogical(execution.output.intensityMinimums)).slice(0, 3),
      [10, 50, 60],
      'merged minimum is not a per-tile mean'
    );
    testCase.deepEqual(
      (await readLogical(execution.output.intensityMaximums)).slice(0, 3),
      [40, 50, 60],
      'merged maximum spans both tile populations'
    );
    testCase.equal(
      (await readLogical(execution.output.columnSums))[0],
      14,
      'tile-local column moments receive the eastern origin exactly once'
    );
    testCase.equal(
      (await readLogical(execution.output.rowSums))[0],
      4,
      'global row moments sum mergeable tile partials'
    );
    testCase.equal(
      (await readLogical(execution.output.centroidColumns))[0],
      3.5,
      'global centroid remains local to the full-level metadata'
    );
    testCase.equal(
      (await readLogical(execution.output.centroidRows))[0],
      1,
      'global row centroid is count-weighted'
    );
    testCase.deepEqual(
      await readLogical(execution.output.areas),
      [28, 7, 7, 0],
      'affine determinant yields square coordinate units without duplicate halo pixels'
    );
    testCase.deepEqual(
      getRasterRegionWorldCentroid(metadata, 3.5, 1),
      [10000008.25, -20000001.25],
      'retained full-level affine converts merged centroids at double precision'
    );
    await assertGuards(testCase, execution, `monolithic order ${index}`);
    destroyExecution(testCase, execution);
  }

  testCase.end();
});

test('LuRaster four-tile diagonal seam junctions respect connectivity, nodata barriers, and bounded IDs', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const metadata: GPURasterMetadata = {
    width: 2,
    height: 2,
    affine: [1, 0, 0, 0, 1, 0],
    pixelInterpretation: 'point'
  };
  const tiles: TileFixture[] = [
    {bounds: [0, 0, 1, 1], labels: [1], intensities: [2]},
    {bounds: [1, 0, 2, 1], labels: [0], intensities: [0]},
    {bounds: [0, 1, 1, 2], labels: [0], intensities: [0]},
    {bounds: [1, 1, 2, 2], labels: [1], intensities: [8]}
  ];

  for (const connectivity of [4, 8] as const) {
    const execution = makeExecution(device, {
      id: `four-tile-corners-${connectivity}`,
      metadata,
      tiles,
      connectivity,
      regionCapacity: 2
    });
    submitGraph(device, execution.compiled, `submit-four-tile-corners-${connectivity}`);
    testCase.equal(
      (await readLogical(execution.componentCount))[0],
      connectivity === 8 ? 1 : 2,
      `${connectivity}-connectivity ${connectivity === 8 ? 'joins' : 'separates'} opposite corners despite missing orthogonal tiles`
    );
    testCase.deepEqual(
      (await readLogical(execution.output.pixelCounts)).slice(0, connectivity === 8 ? 1 : 2),
      connectivity === 8 ? [2] : [1, 1],
      'four-way tile junctions contribute each owned core exactly once'
    );
    destroyExecution(testCase, execution);
  }

  const truncated = makeExecution(device, {
    id: 'bounded-four-way-regions',
    metadata,
    tiles,
    connectivity: 4,
    regionCapacity: 2,
    capacity: 1
  });
  submitGraph(device, truncated.compiled, 'submit-bounded-four-way-regions');
  testCase.equal(
    (await readLogical(truncated.componentCount))[0],
    1,
    'global count clamps to explicit capacity'
  );
  testCase.equal(
    (await readLogical(truncated.requiredComponentCount))[0],
    2,
    'required count retains exact global population'
  );
  testCase.equal(
    (await readLogical(truncated.overflow))[0],
    1,
    'insufficient global output capacity is explicit'
  );
  testCase.equal(
    (await readLogical(truncated.converged))[0],
    1,
    'capacity overflow does not fabricate union nonconvergence'
  );
  testCase.deepEqual(
    await readLogical(truncated.tiles[3]!.outputLabels),
    [0],
    'over-capacity foreground never aliases background labels'
  );
  testCase.deepEqual(
    await readLogical(truncated.tiles[3]!.outputValidity),
    [0],
    'over-capacity foreground is independently invalidated'
  );
  testCase.deepEqual(
    await readLogical(truncated.output.pixelCounts),
    [1, 0],
    'only globally in-capacity rows merge into bounded output arrays'
  );
  destroyExecution(testCase, truncated);

  const blocked = makeExecution(device, {
    id: 'nodata-corner-barrier',
    metadata,
    tiles: [
      {bounds: [0, 0, 1, 1], labels: [1], validity: [1], intensities: [2]},
      {bounds: [1, 0, 2, 1], labels: [0], intensities: [0]},
      {bounds: [0, 1, 1, 2], labels: [0], intensities: [0]},
      {bounds: [1, 1, 2, 2], labels: [0], validity: [0], intensities: [8]}
    ],
    connectivity: 8,
    regionCapacity: 2
  });
  submitGraph(device, blocked.compiled, 'submit-nodata-corner-barrier');
  testCase.equal(
    (await readLogical(blocked.componentCount))[0],
    1,
    'a missing diagonal never creates a seam equivalence'
  );
  testCase.deepEqual(
    await readLogical(blocked.tiles[3]!.outputValidity),
    [0],
    'missing corner validity remains missing'
  );
  destroyExecution(testCase, blocked);
  testCase.end();
});

test('LuRaster cross-tile replay fail-closes upstream and union convergence and saturates merged unsigned populations', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const metadata: GPURasterMetadata = {
    width: 2,
    height: 1,
    affine: [1, 0, 0, 0, 1, 0],
    pixelInterpretation: 'area'
  };
  const fixture: CrossFixture = {
    id: 'replayed-cross-tile-status',
    metadata,
    tiles: [
      {bounds: [0, 0, 1, 1], labels: [1], intensities: [3]},
      {bounds: [1, 0, 2, 1], labels: [1], intensities: [9]}
    ],
    regionCapacity: 2,
    maximumIterations: 4
  };
  const execution = makeExecution(device, fixture);
  submitGraph(device, execution.compiled, 'submit-cross-tile-converged');
  testCase.equal(
    (await readLogical(execution.componentCount))[0],
    1,
    'touching edges form one global region'
  );
  testCase.deepEqual(
    await readLogical(execution.output.intensityMeans),
    [6, Number.NaN],
    'valid touching regions merge weighted intensity'
  );

  writeLogical(execution.tiles[0]!.converged, [0]);
  submitGraph(device, execution.compiled, 'reencode-upstream-nonconvergence');
  await assertCleared(testCase, execution, 'upstream nonconvergence');
  testCase.equal(
    (await readLogical(execution.converged))[0],
    0,
    'global convergence exposes invalid upstream union'
  );

  writeLogical(execution.tiles[0]!.converged, [1]);
  writeLogical(execution.tiles[1]!.overflow, [1]);
  submitGraph(device, execution.compiled, 'reencode-upstream-capacity-overflow');
  await assertCleared(testCase, execution, 'upstream local overflow');
  testCase.equal(
    (await readLogical(execution.overflow))[0],
    1,
    'local truncation is an explicit global overflow'
  );

  writeLogical(execution.tiles[1]!.overflow, [0]);
  submitGraph(device, execution.compiled, 'reencode-recovered-cross-tile-components');
  testCase.equal(
    (await readLogical(execution.componentCount))[0],
    1,
    'graph replay restores the true component count'
  );
  testCase.equal(
    (await readLogical(execution.overflow))[0],
    0,
    'overflow is reset between successful encodings'
  );

  writeLogical(execution.tiles[0]!.measurements.pixelCounts, [4294967295, 0]);
  submitGraph(device, execution.compiled, 'reencode-saturated-global-population');
  testCase.equal(
    (await readLogical(execution.output.pixelCounts))[0],
    4294967295,
    'merged unsigned population saturates at maximum uint32'
  );
  testCase.equal(
    (await readLogical(execution.overflow))[0],
    1,
    'merged population overflow never silently wraps'
  );
  await assertGuards(testCase, execution, 'cross-tile convergence and saturation');
  destroyExecution(testCase, execution);

  const insufficient = makeExecution(device, {
    ...fixture,
    id: 'insufficient-seam-rounds',
    maximumIterations: 1
  });
  submitGraph(device, insufficient.compiled, 'submit-insufficient-seam-rounds');
  await assertCleared(testCase, insufficient, 'insufficient seam propagation rounds');
  testCase.equal(
    (await readLogical(insufficient.converged))[0],
    0,
    'bounded seam propagation cannot claim stabilization too early'
  );
  destroyExecution(testCase, insufficient);
  testCase.end();
});

function makeExecution(device: Device, fixture: CrossFixture): CrossExecution {
  const graph = new GPUCommandGraph(device, {id: fixture.id});
  const owned: GuardedBuffer[] = [];
  const globalCapacity = fixture.regionCapacity ?? 4;
  const componentCount = makeBuffer(device, owned, `${fixture.id}-count`, 'uint32', 1, 1);
  const requiredComponentCount = makeBuffer(
    device,
    owned,
    `${fixture.id}-required`,
    'uint32',
    1,
    2
  );
  const converged = makeBuffer(device, owned, `${fixture.id}-converged`, 'uint32', 1, 3);
  const overflow = makeBuffer(device, owned, `${fixture.id}-overflow`, 'uint32', 1, 1);
  const output = makeMeasurementBuffers(device, owned, `${fixture.id}-global`, globalCapacity);
  const tiles = fixture.tiles.map((tile, index) =>
    makeTileExecution(device, owned, fixture.metadata, tile, `${fixture.id}-tile-${index}`)
  );
  const tileDescriptors: GPURasterCrossTile[] = tiles.map((tile, index) => ({
    metadata: makeTileMetadata(fixture.metadata, tile.bounds),
    pixelBounds: tile.bounds,
    labels: importView(graph, tile.labels),
    labelValidity: importView(graph, tile.validity),
    componentCount: importView(graph, tile.componentCount),
    converged: importView(graph, tile.converged),
    overflow: importView(graph, tile.overflow),
    measurements: importMeasurements(graph, tile.measurements),
    outputLabels: importView(graph, tile.outputLabels),
    outputValidity: importView(graph, tile.outputValidity)
  }));

  new GPURasterCrossTileComponents({
    id: fixture.id,
    metadata: fixture.metadata,
    tiles: tileDescriptors,
    ...(fixture.connectivity ? {connectivity: fixture.connectivity} : {}),
    ...(fixture.maximumIterations !== undefined
      ? {maximumIterations: fixture.maximumIterations}
      : {}),
    componentCount: importView(graph, componentCount),
    requiredComponentCount: importView(graph, requiredComponentCount),
    converged: importView(graph, converged),
    overflow: importView(graph, overflow),
    output: importMeasurements(graph, output),
    ...(fixture.capacity !== undefined ? {capacity: fixture.capacity} : {})
  }).addToGraph(graph);

  return {
    graph,
    compiled: graph.compile(),
    metadata: fixture.metadata,
    tiles,
    output,
    componentCount,
    requiredComponentCount,
    converged,
    overflow,
    owned
  };
}

function makeTileExecution(
  device: Device,
  owned: GuardedBuffer[],
  metadata: GPURasterMetadata,
  fixture: TileFixture,
  id: string
): TileExecution {
  const pixelCount = fixture.labels.length;
  const validity = fixture.validity ?? Array.from({length: pixelCount}, () => 1);
  const localCount = fixture.labels.reduce(
    (maximum, label, index) => (validity[index] !== 0 ? Math.max(maximum, label) : maximum),
    0
  );
  const capacity = fixture.localCapacity ?? Math.max(2, localCount);
  const labels = makeBuffer(device, owned, `${id}-labels`, 'uint32', pixelCount, 1);
  const labelValidity = makeBuffer(device, owned, `${id}-validity`, 'uint32', pixelCount, 2);
  const componentCount = makeBuffer(device, owned, `${id}-count`, 'uint32', 1, 1);
  const converged = makeBuffer(device, owned, `${id}-converged`, 'uint32', 1, 2);
  const overflow = makeBuffer(device, owned, `${id}-overflow`, 'uint32', 1, 3);
  const measurements = makeMeasurementBuffers(device, owned, `${id}-measurements`, capacity);
  const outputLabels = makeBuffer(device, owned, `${id}-output-labels`, 'uint32', pixelCount, 3);
  const outputValidity = makeBuffer(
    device,
    owned,
    `${id}-output-validity`,
    'uint32',
    pixelCount,
    1
  );
  writeLogical(labels, fixture.labels);
  writeLogical(labelValidity, validity);
  writeLogical(componentCount, [localCount]);
  writeLogical(converged, [1]);
  writeLogical(overflow, [0]);
  initializeMeasurements(metadata, fixture, measurements, capacity, validity);
  return {
    bounds: fixture.bounds,
    labels,
    validity: labelValidity,
    componentCount,
    converged,
    overflow,
    measurements,
    outputLabels,
    outputValidity
  };
}

function initializeMeasurements(
  metadata: GPURasterMetadata,
  fixture: TileFixture,
  outputs: MeasurementBuffers,
  capacity: number,
  validity: readonly number[]
): void {
  const width = fixture.bounds[2] - fixture.bounds[0];
  const centers = metadata.pixelInterpretation === 'area' ? 0.5 : 0;
  const [a, b, , d, e] = metadata.affine;
  const pixelArea = Math.abs(a * e - b * d);
  const pixelCounts = Array.from({length: capacity}, () => 0);
  const intensityCounts = Array.from({length: capacity}, () => 0);
  const sums = Array.from({length: capacity}, () => 0);
  const minimums = Array.from({length: capacity}, () => Number.POSITIVE_INFINITY);
  const maximums = Array.from({length: capacity}, () => Number.NEGATIVE_INFINITY);
  const columnSums = Array.from({length: capacity}, () => 0);
  const rowSums = Array.from({length: capacity}, () => 0);
  for (let index = 0; index < fixture.labels.length; index++) {
    const label = fixture.labels[index]!;
    if (validity[index] === 0 || label === 0 || label > capacity) continue;
    const group = label - 1;
    pixelCounts[group]!++;
    columnSums[group]! += (index % width) + centers;
    rowSums[group]! += Math.floor(index / width) + centers;
    const value = fixture.intensities[index]!;
    if ((fixture.intensityValidity?.[index] ?? 1) === 0 || !Number.isFinite(value)) continue;
    intensityCounts[group]!++;
    sums[group]! += value;
    minimums[group] = Math.min(minimums[group]!, value);
    maximums[group] = Math.max(maximums[group]!, value);
  }
  writeLogical(outputs.pixelCounts, pixelCounts);
  writeLogical(outputs.intensityCounts, intensityCounts);
  writeLogical(outputs.intensitySums, sums);
  writeLogical(
    outputs.intensityMinimums,
    minimums.map((value, index) => (intensityCounts[index] ? value : Number.NaN))
  );
  writeLogical(
    outputs.intensityMaximums,
    maximums.map((value, index) => (intensityCounts[index] ? value : Number.NaN))
  );
  writeLogical(
    outputs.intensityMeans,
    sums.map((value, index) =>
      intensityCounts[index] ? value / intensityCounts[index]! : Number.NaN
    )
  );
  writeLogical(outputs.columnSums, columnSums);
  writeLogical(outputs.rowSums, rowSums);
  writeLogical(
    outputs.centroidColumns,
    columnSums.map((value, index) =>
      pixelCounts[index] ? value / pixelCounts[index]! : Number.NaN
    )
  );
  writeLogical(
    outputs.centroidRows,
    rowSums.map((value, index) => (pixelCounts[index] ? value / pixelCounts[index]! : Number.NaN))
  );
  writeLogical(
    outputs.areas,
    pixelCounts.map(value => value * pixelArea)
  );
}

function makeMeasurementBuffers(
  device: Device,
  owned: GuardedBuffer[],
  id: string,
  length: number
): MeasurementBuffers {
  return {
    pixelCounts: makeBuffer(device, owned, `${id}-pixels`, 'uint32', length, 1),
    intensityCounts: makeBuffer(device, owned, `${id}-intensity-counts`, 'uint32', length, 2),
    intensitySums: makeBuffer(device, owned, `${id}-sums`, 'float32', length, 3),
    intensityMinimums: makeBuffer(device, owned, `${id}-minimums`, 'float32', length, 1),
    intensityMaximums: makeBuffer(device, owned, `${id}-maximums`, 'float32', length, 2),
    intensityMeans: makeBuffer(device, owned, `${id}-means`, 'float32', length, 3),
    columnSums: makeBuffer(device, owned, `${id}-columns`, 'float32', length, 1),
    rowSums: makeBuffer(device, owned, `${id}-rows`, 'float32', length, 2),
    centroidColumns: makeBuffer(device, owned, `${id}-centroid-columns`, 'float32', length, 3),
    centroidRows: makeBuffer(device, owned, `${id}-centroid-rows`, 'float32', length, 1),
    areas: makeBuffer(device, owned, `${id}-areas`, 'float32', length, 2)
  };
}

function importMeasurements(
  graph: GPUCommandGraph,
  outputs: MeasurementBuffers
): GPURasterRegionMeasurementOutputs {
  return {
    pixelCounts: importView(graph, outputs.pixelCounts),
    intensityCounts: importView(graph, outputs.intensityCounts),
    intensitySums: importView(graph, outputs.intensitySums),
    intensityMinimums: importView(graph, outputs.intensityMinimums),
    intensityMaximums: importView(graph, outputs.intensityMaximums),
    intensityMeans: importView(graph, outputs.intensityMeans),
    columnSums: importView(graph, outputs.columnSums),
    rowSums: importView(graph, outputs.rowSums),
    centroidColumns: importView(graph, outputs.centroidColumns),
    centroidRows: importView(graph, outputs.centroidRows),
    areas: importView(graph, outputs.areas)
  };
}

function makeTileMetadata(
  metadata: GPURasterMetadata,
  bounds: GPURasterPixelBounds
): GPURasterMetadata {
  const [a, b, c, d, e, f] = metadata.affine;
  return {
    width: bounds[2] - bounds[0],
    height: bounds[3] - bounds[1],
    affine: [a, b, c + a * bounds[0] + b * bounds[1], d, e, f + d * bounds[0] + e * bounds[1]],
    pixelInterpretation: metadata.pixelInterpretation,
    ...(metadata.coordinateReferenceSystem
      ? {coordinateReferenceSystem: metadata.coordinateReferenceSystem}
      : {}),
    ...(metadata.level !== undefined ? {level: metadata.level} : {})
  };
}

function makeBuffer<Format extends ScalarFormat>(
  device: Device,
  owned: GuardedBuffer[],
  id: string,
  format: Format,
  length: number,
  prefixLength: number
): GuardedBuffer<Format> {
  const words = new Uint32Array(prefixLength + length + 1).fill(GUARD_VALUE);
  const entry = {
    buffer: device.createBuffer({
      id,
      data: words,
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
  if (entry.format === 'float32') new Float32Array(words.buffer).set(values, entry.prefixLength);
  else words.set(values, entry.prefixLength);
  entry.buffer.write(words);
}

async function readLogical(entry: GuardedBuffer): Promise<number[]> {
  const bytes = await entry.buffer.readAsync();
  const Type = entry.format === 'float32' ? Float32Array : Uint32Array;
  const values = new Type(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  return Array.from(values.slice(entry.prefixLength, entry.prefixLength + entry.length));
}

async function assertCleared(
  testCase: Test,
  execution: CrossExecution,
  label: string
): Promise<void> {
  testCase.equal(
    (await readLogical(execution.componentCount))[0],
    0,
    `${label}: global component count clears`
  );
  testCase.equal(
    (await readLogical(execution.requiredComponentCount))[0],
    0,
    `${label}: exact required count clears`
  );
  testCase.deepEqual(
    await readLogical(execution.output.pixelCounts),
    Array.from({length: execution.output.pixelCounts.length}, () => 0),
    `${label}: all grouped populations clear`
  );
  for (const tile of execution.tiles) {
    testCase.deepEqual(
      await readLogical(tile.outputLabels),
      Array.from({length: tile.outputLabels.length}, () => 0),
      `${label}: globally relabeled pixels clear`
    );
    testCase.deepEqual(
      await readLogical(tile.outputValidity),
      Array.from({length: tile.outputValidity.length}, () => 0),
      `${label}: valid background is withheld until global convergence`
    );
  }
}

async function assertGuards(
  testCase: Test,
  execution: CrossExecution,
  label: string
): Promise<void> {
  for (const entry of execution.owned) {
    const bytes = await entry.buffer.readAsync();
    const words = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    testCase.deepEqual(
      Array.from(words.slice(0, entry.prefixLength)),
      Array.from({length: entry.prefixLength}, () => GUARD_VALUE),
      `${label}: ${entry.buffer.id} retains offset prefix`
    );
    testCase.equal(words.at(-1), GUARD_VALUE, `${label}: ${entry.buffer.id} retains suffix`);
  }
}

function assertClose(testCase: Test, actual: number, expected: number, label: string): void {
  testCase.ok(Math.abs(actual - expected) < 0.00001, `${label}: ${actual} ≈ ${expected}`);
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

function destroyExecution(testCase: Test, execution: CrossExecution): void {
  execution.compiled.destroy();
  for (const {buffer} of execution.owned) {
    testCase.notOk(
      buffer.destroyed,
      'cross-tile graph destruction leaves caller-owned resources alive'
    );
    buffer.destroy();
  }
}
