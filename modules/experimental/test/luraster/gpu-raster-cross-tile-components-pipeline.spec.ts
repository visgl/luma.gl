// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterConnectedComponents,
  GPURasterCrossTileComponents,
  GPURasterDenseComponents,
  GPURasterRegionMeasurements,
  getRasterRegionWorldCentroid,
  type GPURasterConnectivity,
  type GPURasterCrossTile,
  type GPURasterMetadata,
  type GPURasterPixelBounds,
  type GPURasterRegionMeasurementOutputs
} from '@luma.gl/experimental/luraster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type OutputRecord<Format extends 'float32' | 'uint32'> = {
  view: GraphDataView<Format>;
  buffer: Buffer;
  prefixLength: number;
};

type MeasurementRecords = {
  pixelCounts: OutputRecord<'uint32'>;
  intensityCounts: OutputRecord<'uint32'>;
  intensitySums: OutputRecord<'float32'>;
  intensityMinimums: OutputRecord<'float32'>;
  intensityMaximums: OutputRecord<'float32'>;
  intensityMeans: OutputRecord<'float32'>;
  columnSums: OutputRecord<'float32'>;
  rowSums: OutputRecord<'float32'>;
  centroidColumns: OutputRecord<'float32'>;
  centroidRows: OutputRecord<'float32'>;
  areas: OutputRecord<'float32'>;
};

type RegionReference = {
  pixelCounts: number[];
  intensityCounts: number[];
  intensitySums: number[];
  intensityMinimums: number[];
  intensityMaximums: number[];
  intensityMeans: number[];
  columnSums: number[];
  rowSums: number[];
  centroidColumns: number[];
  centroidRows: number[];
  areas: number[];
};

type CrossTileScenario = {
  metadata: GPURasterMetadata;
  bounds: readonly GPURasterPixelBounds[];
  foreground: Uint32Array;
  validity: Uint32Array;
  intensity: Float32Array;
  intensityValidity: Uint32Array;
  connectivity: GPURasterConnectivity;
  capacity: number;
  reverseArrival?: boolean;
  maximumIterations?: number;
};

type CrossTileResult = {
  labels: number[];
  validity: number[];
  count: number;
  required: number;
  converged: number;
  overflow: number;
  measurements: RegionReference;
  outputGuards: number[];
};

type TileRecords = {
  tile: GPURasterCrossTile;
  bounds: GPURasterPixelBounds;
  outputLabels: OutputRecord<'uint32'>;
  outputValidity: OutputRecord<'uint32'>;
};

const GUARD_VALUE = 4000000001;
const NO_DATA_VALUE = -999;
const INTENSITY_SCALE = 0.5;
const INTENSITY_OFFSET = 2;

test('LuRaster tiled segmentation reproduces monolithic global-row-major labels and weighted region measurements', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const metadata: GPURasterMetadata = {
    width: 6,
    height: 4,
    affine: [2, 0.25, 1000000000.125, -0.5, -3, -2000000000.375],
    pixelInterpretation: 'area',
    coordinateReferenceSystem: {authority: 'EPSG:32610'},
    levelZeroOrigin: [512, 1024],
    level: 0
  };
  const foreground = makeForeground(['1...1.', '.111..', '..111.', '1....1']);
  const validity = makeValidity(foreground.length);
  validity[15] = 0;
  const intensity = Float32Array.from(
    Array.from({length: foreground.length}, (_, pixelIndex) => pixelIndex * 2.25 - 5)
  );
  intensity[7] = NO_DATA_VALUE;
  intensity[14] = Number.NaN;
  const intensityValidity = makeValidity(foreground.length);
  intensityValidity[9] = 0;

  const scenario: CrossTileScenario = {
    metadata,
    bounds: [
      [0, 0, 3, 4],
      [3, 0, 6, 4]
    ],
    foreground,
    validity,
    intensity,
    intensityValidity,
    connectivity: 4,
    capacity: 12
  };
  const reference = makeMonolithicReference(scenario);
  const forward = await runCrossTileScenario(device, scenario);
  const reversed = await runCrossTileScenario(device, {...scenario, reverseArrival: true});

  testCase.equal(forward.converged, 1, 'every local and cross-tile equivalence converges');
  testCase.equal(forward.overflow, 0, 'the bounded global region domain fits');
  testCase.equal(forward.count, reference.count, 'merged global region count matches monolithic');
  testCase.equal(forward.required, reference.count, 'exact required global count is published');
  testCase.deepEqual(
    forward.labels,
    reference.labels,
    'global IDs exactly match monolithic row-major roots rather than tile-major prefixes'
  );
  testCase.deepEqual(
    forward.validity,
    reference.validity,
    'masked seams and valid background retain independent pixel validity'
  );
  testCase.deepEqual(
    reversed.labels,
    reference.labels,
    'reversing tile arrival does not change canonical global dense IDs'
  );
  testCase.equal(reversed.count, forward.count, 'arrival order does not change global count');
  assertMeasurements(testCase, forward.measurements, reference.measurements, 'forward merge');
  assertMeasurements(testCase, reversed.measurements, reference.measurements, 'reverse merge');

  testCase.equal(forward.labels[4], 2, 'an early-row EAST root precedes a later-row WEST root');
  testCase.equal(forward.labels[7], 3, 'the later WEST root receives its true global rank');
  testCase.ok(
    forward.measurements.pixelCounts[2]! > forward.measurements.intensityCounts[2]!,
    'intensity holes never erase classified region geometry'
  );
  const centroid = getRasterRegionWorldCentroid(
    metadata,
    forward.measurements.centroidColumns[2]!,
    forward.measurements.centroidRows[2]!
  );
  testCase.notEqual(
    centroid[0],
    Math.fround(centroid[0]),
    'global merged moments keep large projected translations in JavaScript double precision'
  );
  testCase.ok(
    forward.outputGuards.every(value => value === GUARD_VALUE),
    'globally relabeled and measured caller-owned buffer guards remain intact'
  );
  testCase.end();
});

test('LuRaster four-way tile junctions reconcile diagonal corner contacts only for eight-connectivity', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const metadata: GPURasterMetadata = {
    width: 4,
    height: 4,
    affine: [3, 0.5, 700000.25, -0.25, -4, 4187600.75],
    pixelInterpretation: 'area',
    coordinateReferenceSystem: {authority: 'EPSG:32610'},
    level: 0
  };
  const foreground = makeForeground(['1..1', '.1..', '..1.', '1..1']);
  const base = {
    metadata,
    bounds: [
      [0, 0, 2, 2],
      [2, 0, 4, 2],
      [0, 2, 2, 4],
      [2, 2, 4, 4]
    ] satisfies GPURasterPixelBounds[],
    foreground,
    validity: makeValidity(foreground.length),
    intensity: Float32Array.from(foreground, (_, index) => index + 1),
    intensityValidity: makeValidity(foreground.length),
    capacity: 8
  };

  for (const connectivity of [4, 8] as const) {
    const scenario: CrossTileScenario = {...base, connectivity, reverseArrival: true};
    const reference = makeMonolithicReference(scenario);
    const actual = await runCrossTileScenario(device, scenario);
    testCase.equal(actual.count, reference.count, `${connectivity}-connected global count`);
    testCase.deepEqual(
      actual.labels,
      reference.labels,
      `${connectivity}-connected exact monolithic labels across the four-core junction`
    );
    assertMeasurements(
      testCase,
      actual.measurements,
      reference.measurements,
      `${connectivity}-connected corner-region merge`
    );
    testCase.equal(
      actual.count,
      connectivity === 4 ? 6 : 3,
      `${connectivity}-connected diagonal-only corner contact has the declared topology`
    );
  }

  const blockedValidity = makeValidity(foreground.length);
  blockedValidity[5] = 0;
  const blockedScenario: CrossTileScenario = {
    ...base,
    validity: blockedValidity,
    connectivity: 8
  };
  const blockedReference = makeMonolithicReference(blockedScenario);
  const blocked = await runCrossTileScenario(device, blockedScenario);
  testCase.deepEqual(blocked.labels, blockedReference.labels, 'nodata blocks the diagonal seam');
  testCase.equal(blocked.validity[5], 0, 'the removed bridge remains missing, not background');
  testCase.end();
});

test('LuRaster cross-tile global capacity publishes exact demand and fails closed on exhausted local convergence', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const metadata: GPURasterMetadata = {
    width: 6,
    height: 2,
    affine: [0.25, 0.1, -122.125, 0.05, -0.5, 37.375],
    pixelInterpretation: 'point',
    coordinateReferenceSystem: {authority: 'EPSG:4326'}
  };
  const foreground = makeForeground(['111.11', '..1..1']);
  const scenario: CrossTileScenario = {
    metadata,
    bounds: [
      [0, 0, 3, 2],
      [3, 0, 6, 2]
    ],
    foreground,
    validity: makeValidity(foreground.length),
    intensity: Float32Array.from(foreground, (_, index) => index + 1),
    intensityValidity: makeValidity(foreground.length),
    connectivity: 4,
    capacity: 1
  };
  const reference = makeMonolithicReference({...scenario, capacity: 8});
  const bounded = await runCrossTileScenario(device, scenario);
  testCase.equal(bounded.converged, 1, 'bounded discovery still converges');
  testCase.equal(bounded.required, reference.count, 'exact demand survives bounded publication');
  testCase.equal(bounded.count, 1, 'published global component count is capacity-clamped');
  testCase.equal(bounded.overflow, 1, 'capacity truncation is explicit, never silent');
  testCase.equal(bounded.labels[0], 1, 'the first canonical global component remains published');
  testCase.equal(bounded.labels[4], 0, 'over-capacity foreground never aliases real background');
  testCase.equal(bounded.validity[4], 0, 'dropped foreground is explicitly invalidated');

  const zero = await runCrossTileScenario(device, {...scenario, capacity: 0});
  testCase.equal(zero.count, 0, 'zero capacity publishes no global component');
  testCase.equal(zero.required, reference.count, 'zero capacity still reports exact demand');
  testCase.equal(zero.overflow, 1, 'zero capacity declares overflow for nonempty foreground');

  const unconverged = await runCrossTileScenario(device, {
    ...scenario,
    capacity: 8,
    maximumIterations: 1
  });
  testCase.equal(unconverged.converged, 0, 'insufficient local rounds never publish valid roots');
  testCase.equal(unconverged.count, 0, 'unverified global component count is cleared');
  testCase.ok(
    unconverged.labels.every(value => value === 0),
    'unverified labels are cleared'
  );
  testCase.ok(
    unconverged.validity.every(value => value === 0),
    'unverified foreground and background are globally invalidated'
  );
  testCase.ok(
    unconverged.measurements.pixelCounts.every(value => value === 0),
    'unverified region geometry is never fabricated'
  );
  testCase.end();
});

async function runCrossTileScenario(
  device: Device,
  scenario: CrossTileScenario
): Promise<CrossTileResult> {
  const graph = new GPUCommandGraph(device, {
    id: `cross-tile-integration-${scenario.connectivity}-${scenario.capacity}`
  });
  const ownedBuffers: Buffer[] = [];
  const tiles = scenario.bounds.map((bounds, tileIndex) =>
    makeTileRecords(graph, device, ownedBuffers, scenario, bounds, tileIndex)
  );
  const globalCapacity = Math.max(1, scenario.capacity);
  const measurements = makeMeasurementRecords(
    graph,
    device,
    ownedBuffers,
    'global',
    globalCapacity
  );
  const count = makeOutputRecord(graph, device, ownedBuffers, 'global-count', 'uint32', 1, 1);
  const required = makeOutputRecord(graph, device, ownedBuffers, 'global-required', 'uint32', 1, 2);
  const convergence = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    'global-convergence',
    'uint32',
    1,
    1
  );
  const overflow = makeOutputRecord(graph, device, ownedBuffers, 'global-overflow', 'uint32', 1, 2);

  new GPURasterCrossTileComponents({
    id: 'integrated-global-components',
    metadata: scenario.metadata,
    tiles: (scenario.reverseArrival ? [...tiles].reverse() : tiles).map(record => record.tile),
    connectivity: scenario.connectivity,
    maximumIterations: scenario.maximumIterations ?? 24,
    componentCount: count.view,
    requiredComponentCount: required.view,
    converged: convergence.view,
    overflow: overflow.view,
    output: getMeasurementViews(measurements),
    capacity: scenario.capacity
  }).addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'cross-tile-integration-submit'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const pixelCount = scenario.metadata.width * scenario.metadata.height;
  const labels = new Array<number>(pixelCount).fill(0);
  const validity = new Array<number>(pixelCount).fill(0);
  for (const record of tiles) {
    const tileLabels = await readRecord(record.outputLabels);
    const tileValidity = await readRecord(record.outputValidity);
    const [minimumColumn, minimumRow, maximumColumn, maximumRow] = record.bounds;
    const width = maximumColumn - minimumColumn;
    for (let row = minimumRow; row < maximumRow; row++) {
      for (let column = minimumColumn; column < maximumColumn; column++) {
        const localIndex = (row - minimumRow) * width + column - minimumColumn;
        const globalIndex = row * scenario.metadata.width + column;
        labels[globalIndex] = tileLabels[localIndex]!;
        validity[globalIndex] = tileValidity[localIndex]!;
      }
    }
  }

  const result: CrossTileResult = {
    labels,
    validity,
    count: (await readRecord(count))[0]!,
    required: (await readRecord(required))[0]!,
    converged: (await readRecord(convergence))[0]!,
    overflow: (await readRecord(overflow))[0]!,
    measurements: await readMeasurements(measurements),
    outputGuards: [
      ...(await readPrefixGuards(count)),
      ...(await readPrefixGuards(required)),
      ...(await readPrefixGuards(measurements.pixelCounts)),
      ...(await readPrefixGuards(measurements.intensityCounts)),
      ...(await Promise.all(tiles.map(record => readPrefixGuards(record.outputLabels)))).flat()
    ]
  };
  compiled.destroy();
  for (const buffer of ownedBuffers) buffer.destroy();
  return result;
}

function makeTileRecords(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  scenario: CrossTileScenario,
  bounds: GPURasterPixelBounds,
  tileIndex: number
): TileRecords {
  const [minimumColumn, minimumRow, maximumColumn, maximumRow] = bounds;
  const width = maximumColumn - minimumColumn;
  const height = maximumRow - minimumRow;
  const pixelCount = width * height;
  const values = new Uint32Array(pixelCount);
  const validity = new Uint32Array(pixelCount);
  const intensity = new Float32Array(pixelCount);
  const intensityValidity = new Uint32Array(pixelCount);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const localIndex = row * width + column;
      const globalIndex = (minimumRow + row) * scenario.metadata.width + minimumColumn + column;
      values[localIndex] = scenario.foreground[globalIndex]!;
      validity[localIndex] = scenario.validity[globalIndex]!;
      intensity[localIndex] = scenario.intensity[globalIndex]!;
      intensityValidity[localIndex] = scenario.intensityValidity[globalIndex]!;
    }
  }

  const source = importInput(graph, device, ownedBuffers, `source-${tileIndex}`, 'uint32', values);
  const sourceValidity = importInput(
    graph,
    device,
    ownedBuffers,
    `source-validity-${tileIndex}`,
    'uint32',
    validity
  );
  const intensityValues = importInput(
    graph,
    device,
    ownedBuffers,
    `intensity-${tileIndex}`,
    'float32',
    intensity
  );
  const intensityMask = importInput(
    graph,
    device,
    ownedBuffers,
    `intensity-validity-${tileIndex}`,
    'uint32',
    intensityValidity
  );
  const sparseLabels = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `sparse-${tileIndex}`,
    'uint32',
    pixelCount,
    1
  );
  const sparseValidity = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `sparse-validity-${tileIndex}`,
    'uint32',
    pixelCount,
    2
  );
  const convergence = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `convergence-${tileIndex}`,
    'uint32',
    1,
    1
  );
  new GPURasterConnectedComponents({
    id: `local-sparse-${tileIndex}`,
    width,
    height,
    input: {
      id: `foreground-${tileIndex}`,
      format: 'uint32',
      storage: {kind: 'buffer', values: source},
      validity: sourceValidity
    },
    output: sparseLabels.view,
    outputValidity: sparseValidity.view,
    converged: convergence.view,
    connectivity: scenario.connectivity,
    maximumIterations: scenario.maximumIterations ?? 24
  }).addToGraph(graph);

  const denseLabels = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `dense-${tileIndex}`,
    'uint32',
    pixelCount,
    1
  );
  const denseValidity = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `dense-validity-${tileIndex}`,
    'uint32',
    pixelCount,
    2
  );
  const componentCount = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `count-${tileIndex}`,
    'uint32',
    1,
    1
  );
  const overflow = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `overflow-${tileIndex}`,
    'uint32',
    1,
    2
  );
  new GPURasterDenseComponents({
    id: `local-dense-${tileIndex}`,
    width,
    height,
    input: sparseLabels.view,
    inputValidity: sparseValidity.view,
    converged: convergence.view,
    output: denseLabels.view,
    outputValidity: denseValidity.view,
    componentCount: componentCount.view,
    overflow: overflow.view,
    capacity: pixelCount
  }).addToGraph(graph);

  const metadata = makeTileMetadata(scenario.metadata, bounds);
  const measurements = makeMeasurementRecords(
    graph,
    device,
    ownedBuffers,
    `local-${tileIndex}`,
    pixelCount
  );
  new GPURasterRegionMeasurements({
    id: `local-measurements-${tileIndex}`,
    metadata,
    labels: denseLabels.view,
    labelValidity: denseValidity.view,
    converged: convergence.view,
    componentCount: componentCount.view,
    overflow: overflow.view,
    intensity: {
      id: `local-intensity-${tileIndex}`,
      format: 'float32',
      storage: {kind: 'buffer', values: intensityValues},
      validity: intensityMask,
      noDataValue: NO_DATA_VALUE,
      scale: INTENSITY_SCALE,
      offset: INTENSITY_OFFSET
    },
    output: getMeasurementViews(measurements),
    capacity: pixelCount
  }).addToGraph(graph);

  const outputLabels = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `global-labels-${tileIndex}`,
    'uint32',
    pixelCount,
    1
  );
  const outputValidity = makeOutputRecord(
    graph,
    device,
    ownedBuffers,
    `global-validity-${tileIndex}`,
    'uint32',
    pixelCount,
    2
  );
  return {
    bounds,
    outputLabels,
    outputValidity,
    tile: {
      metadata,
      pixelBounds: bounds,
      labels: denseLabels.view,
      labelValidity: denseValidity.view,
      componentCount: componentCount.view,
      converged: convergence.view,
      overflow: overflow.view,
      measurements: getMeasurementViews(measurements),
      outputLabels: outputLabels.view,
      outputValidity: outputValidity.view
    }
  };
}

function makeTileMetadata(
  metadata: GPURasterMetadata,
  bounds: GPURasterPixelBounds
): GPURasterMetadata {
  const [minimumColumn, minimumRow, maximumColumn, maximumRow] = bounds;
  const [first, second, third, fourth, fifth, sixth] = metadata.affine;
  return {
    ...metadata,
    width: maximumColumn - minimumColumn,
    height: maximumRow - minimumRow,
    affine: [
      first,
      second,
      third + first * minimumColumn + second * minimumRow,
      fourth,
      fifth,
      sixth + fourth * minimumColumn + fifth * minimumRow
    ],
    ...(metadata.levelZeroOrigin
      ? {
          levelZeroOrigin: [
            metadata.levelZeroOrigin[0] + minimumColumn,
            metadata.levelZeroOrigin[1] + minimumRow
          ] as const
        }
      : {})
  };
}

function makeMeasurementRecords(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  prefix: string,
  length: number
): MeasurementRecords {
  return {
    pixelCounts: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-pixels`,
      'uint32',
      length,
      1
    ),
    intensityCounts: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-intensity-count`,
      'uint32',
      length,
      2
    ),
    intensitySums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-sums`,
      'float32',
      length,
      1
    ),
    intensityMinimums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-minimum`,
      'float32',
      length,
      2
    ),
    intensityMaximums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-maximum`,
      'float32',
      length,
      1
    ),
    intensityMeans: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-mean`,
      'float32',
      length,
      2
    ),
    columnSums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-column-sum`,
      'float32',
      length,
      1
    ),
    rowSums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-row-sum`,
      'float32',
      length,
      2
    ),
    centroidColumns: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-centroid-column`,
      'float32',
      length,
      1
    ),
    centroidRows: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      `${prefix}-centroid-row`,
      'float32',
      length,
      2
    ),
    areas: makeOutputRecord(graph, device, ownedBuffers, `${prefix}-area`, 'float32', length, 1)
  };
}

function getMeasurementViews(records: MeasurementRecords): GPURasterRegionMeasurementOutputs {
  return {
    pixelCounts: records.pixelCounts.view,
    intensityCounts: records.intensityCounts.view,
    intensitySums: records.intensitySums.view,
    intensityMinimums: records.intensityMinimums.view,
    intensityMaximums: records.intensityMaximums.view,
    intensityMeans: records.intensityMeans.view,
    columnSums: records.columnSums.view,
    rowSums: records.rowSums.view,
    centroidColumns: records.centroidColumns.view,
    centroidRows: records.centroidRows.view,
    areas: records.areas.view
  };
}

function makeMonolithicReference(scenario: CrossTileScenario): {
  labels: number[];
  validity: number[];
  count: number;
  measurements: RegionReference;
} {
  const {width, height} = scenario.metadata;
  const labels = new Array<number>(width * height).fill(0);
  const validity = Array.from(scenario.validity, value => Number(value !== 0));
  const directions =
    scenario.connectivity === 4
      ? [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]
      : [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1]
        ];
  let componentCount = 0;
  for (let pixelIndex = 0; pixelIndex < labels.length; pixelIndex++) {
    if (!validity[pixelIndex] || !scenario.foreground[pixelIndex] || labels[pixelIndex]) continue;
    componentCount++;
    const pending = [pixelIndex];
    labels[pixelIndex] = componentCount;
    for (let pendingIndex = 0; pendingIndex < pending.length; pendingIndex++) {
      const current = pending[pendingIndex]!;
      const column = current % width;
      const row = Math.floor(current / width);
      for (const [columnOffset, rowOffset] of directions) {
        const nextColumn = column + columnOffset!;
        const nextRow = row + rowOffset!;
        if (nextColumn < 0 || nextRow < 0 || nextColumn >= width || nextRow >= height) continue;
        const neighbor = nextRow * width + nextColumn;
        if (!validity[neighbor] || !scenario.foreground[neighbor] || labels[neighbor]) continue;
        labels[neighbor] = componentCount;
        pending.push(neighbor);
      }
    }
  }

  const outputLength = Math.max(1, scenario.capacity);
  const measurements = makeEmptyReference(outputLength);
  const centerOffset = scenario.metadata.pixelInterpretation === 'area' ? 0.5 : 0;
  for (let pixelIndex = 0; pixelIndex < labels.length; pixelIndex++) {
    const label = labels[pixelIndex]!;
    if (!label || label > scenario.capacity) continue;
    const groupIndex = label - 1;
    measurements.pixelCounts[groupIndex]!++;
    measurements.columnSums[groupIndex]! += (pixelIndex % width) + centerOffset;
    measurements.rowSums[groupIndex]! += Math.floor(pixelIndex / width) + centerOffset;
    const rawIntensity = scenario.intensity[pixelIndex]!;
    if (
      !scenario.intensityValidity[pixelIndex] ||
      !Number.isFinite(rawIntensity) ||
      rawIntensity === NO_DATA_VALUE
    ) {
      continue;
    }
    const intensity = rawIntensity * INTENSITY_SCALE + INTENSITY_OFFSET;
    measurements.intensityCounts[groupIndex]!++;
    measurements.intensitySums[groupIndex]! += intensity;
    measurements.intensityMinimums[groupIndex] = Number.isNaN(
      measurements.intensityMinimums[groupIndex]
    )
      ? intensity
      : Math.min(measurements.intensityMinimums[groupIndex]!, intensity);
    measurements.intensityMaximums[groupIndex] = Number.isNaN(
      measurements.intensityMaximums[groupIndex]
    )
      ? intensity
      : Math.max(measurements.intensityMaximums[groupIndex]!, intensity);
  }

  const [first, second, , fourth, fifth] = scenario.metadata.affine;
  const pixelArea = Math.abs(first * fifth - second * fourth);
  for (let groupIndex = 0; groupIndex < outputLength; groupIndex++) {
    const pixelCount = measurements.pixelCounts[groupIndex]!;
    const intensityCount = measurements.intensityCounts[groupIndex]!;
    if (pixelCount) {
      measurements.centroidColumns[groupIndex] = measurements.columnSums[groupIndex]! / pixelCount;
      measurements.centroidRows[groupIndex] = measurements.rowSums[groupIndex]! / pixelCount;
      measurements.areas[groupIndex] = pixelCount * pixelArea;
    }
    if (intensityCount) {
      measurements.intensityMeans[groupIndex] =
        measurements.intensitySums[groupIndex]! / intensityCount;
    }
  }
  return {labels, validity, count: componentCount, measurements};
}

function makeEmptyReference(length: number): RegionReference {
  return {
    pixelCounts: Array.from({length}, () => 0),
    intensityCounts: Array.from({length}, () => 0),
    intensitySums: Array.from({length}, () => 0),
    intensityMinimums: Array.from({length}, () => Number.NaN),
    intensityMaximums: Array.from({length}, () => Number.NaN),
    intensityMeans: Array.from({length}, () => Number.NaN),
    columnSums: Array.from({length}, () => 0),
    rowSums: Array.from({length}, () => 0),
    centroidColumns: Array.from({length}, () => Number.NaN),
    centroidRows: Array.from({length}, () => Number.NaN),
    areas: Array.from({length}, () => 0)
  };
}

function assertMeasurements(
  testCase: Test,
  actual: RegionReference,
  expected: RegionReference,
  label: string
): void {
  testCase.deepEqual(actual.pixelCounts, expected.pixelCounts, `${label}: exact geometry counts`);
  testCase.deepEqual(
    actual.intensityCounts,
    expected.intensityCounts,
    `${label}: valid intensity counts`
  );
  for (const property of [
    'intensitySums',
    'intensityMinimums',
    'intensityMaximums',
    'intensityMeans',
    'columnSums',
    'rowSums',
    'centroidColumns',
    'centroidRows',
    'areas'
  ] as const) {
    for (let index = 0; index < actual[property].length; index++) {
      const value = actual[property][index]!;
      const reference = expected[property][index]!;
      if (Number.isNaN(reference)) {
        testCase.ok(Number.isNaN(value), `${label}: ${property}[${index}] remains invalid`);
      } else {
        testCase.ok(
          Math.abs(value - reference) <= 0.0001 * Math.max(1, Math.abs(reference)),
          `${label}: ${property}[${index}] matches the monolithic weighted reference`
        );
      }
    }
  }
}

function makeForeground(rows: readonly string[]): Uint32Array {
  return Uint32Array.from(rows.join(''), character => Number(character === '1'));
}

function makeValidity(length: number): Uint32Array {
  return new Uint32Array(length).fill(1);
}

function makeOutputRecord<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  format: Format,
  length: number,
  prefixLength: number
): OutputRecord<Format> {
  const data = new Uint32Array(prefixLength + length + 1).fill(GUARD_VALUE);
  const buffer = device.createBuffer({
    id,
    data,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  ownedBuffers.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {
    buffer,
    prefixLength,
    view: graph.createDataView(handle, {
      format,
      length,
      byteOffset: prefixLength * Uint32Array.BYTES_PER_ELEMENT
    })
  };
}

function importInput<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  format: Format,
  data: Float32Array | Uint32Array
): GraphDataView<Format> {
  const buffer = device.createBuffer({
    id,
    data,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  ownedBuffers.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length: data.length});
}

async function readRecord(
  record: OutputRecord<'float32'> | OutputRecord<'uint32'>
): Promise<number[]> {
  const bytes = await record.buffer.readAsync();
  const values =
    record.view.format === 'float32'
      ? new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
      : new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  return Array.from(values.slice(record.prefixLength, record.prefixLength + record.view.length));
}

async function readPrefixGuards(
  record: OutputRecord<'float32'> | OutputRecord<'uint32'>
): Promise<number[]> {
  const bytes = await record.buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)).slice(
    0,
    record.prefixLength
  );
}

async function readMeasurements(records: MeasurementRecords): Promise<RegionReference> {
  return {
    pixelCounts: await readRecord(records.pixelCounts),
    intensityCounts: await readRecord(records.intensityCounts),
    intensitySums: await readRecord(records.intensitySums),
    intensityMinimums: await readRecord(records.intensityMinimums),
    intensityMaximums: await readRecord(records.intensityMaximums),
    intensityMeans: await readRecord(records.intensityMeans),
    columnSums: await readRecord(records.columnSums),
    rowSums: await readRecord(records.rowSums),
    centroidColumns: await readRecord(records.centroidColumns),
    centroidRows: await readRecord(records.centroidRows),
    areas: await readRecord(records.areas)
  };
}
