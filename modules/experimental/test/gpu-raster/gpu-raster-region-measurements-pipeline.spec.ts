// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterConnectedComponents,
  GPURasterDenseComponents,
  GPURasterRegionMeasurements,
  GPURasterThreshold,
  getRasterRegionWorldCentroid,
  type GPURasterBufferBand,
  type GPURasterMetadata,
  type GPURasterRegionMeasurementOutputs
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type OutputRecord<Format extends 'float32' | 'uint32'> = {
  view: GraphDataView<Format>;
  buffer: Buffer;
  prefixLength: number;
};

type MeasurementOutputRecords = {
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

type RegionFixture = {
  metadata: GPURasterMetadata;
  labels: Uint32Array;
  labelValidity: Uint32Array;
  intensity: Float32Array;
  intensityValidity: Uint32Array;
  componentCount: number;
  capacity: number;
  noDataValue?: number;
  scale?: number;
  offset?: number;
};

const GUARD_VALUE = 4000000001;
const PROJECTED_METADATA: GPURasterMetadata = {
  width: 7,
  height: 4,
  affine: [2, 0.25, 1000000000.125, -0.5, -3, -2000000000.375],
  pixelInterpretation: 'area',
  coordinateReferenceSystem: {authority: 'EPSG:32610'},
  levelZeroOrigin: [512, 1024],
  level: 0
};

test('GPURaster grouped measurements independently preserve geometry, calibrated intensity validity, and double-precision affine centroids', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const labels = Uint32Array.from([
    1, 1, 0, 2, 2, 0, 3, 1, 0, 0, 2, 0, 0, 3, 0, 4, 4, 0, 5, 5, 0, 0, 4, 0, 0, 5, 0, 6
  ]);
  const labelValidity = Uint32Array.from(Array.from({length: labels.length}, () => 1));
  labelValidity[2] = 0;
  const intensity = Float32Array.from(
    Array.from({length: labels.length}, (_, pixelIndex) => pixelIndex * 0.75 - 8)
  );
  intensity[0] = -9999;
  intensity[1] = Number.NaN;
  intensity[7] = Number.POSITIVE_INFINITY;
  intensity[4] = -9999;
  const intensityValidity = Uint32Array.from(Array.from({length: labels.length}, () => 1));
  intensityValidity[10] = 0;

  const fixture: RegionFixture = {
    metadata: PROJECTED_METADATA,
    labels,
    labelValidity,
    intensity,
    intensityValidity,
    componentCount: 6,
    capacity: 8,
    noDataValue: -9999,
    scale: 0.25,
    offset: 3
  };
  const result = await runDirectMeasurements(device, fixture);
  const expected = makeReferenceMeasurements(fixture, true);
  assertMeasurementResults(testCase, result, expected, 'calibrated per-region measurements');

  testCase.equal(result.pixelCounts[0], 3, 'geometry retains all three classified region pixels');
  testCase.equal(
    result.intensityCounts[0],
    0,
    'raw nodata, NaN, and infinity reject only intensity'
  );
  testCase.equal(result.intensitySums[0], 0, 'an intensity-empty region has zero mergeable sum');
  testCase.ok(Number.isNaN(result.intensityMinimums[0]), 'empty intensity minimum is NaN');
  testCase.ok(Number.isNaN(result.intensityMaximums[0]), 'empty intensity maximum is NaN');
  testCase.ok(Number.isNaN(result.intensityMeans[0]), 'empty intensity mean is NaN');
  testCase.ok(Number.isFinite(result.centroidColumns[0]), 'geometry-only centroid remains valid');
  testCase.equal(result.pixelCounts[1], 3, 'region geometry is independent of band holes');
  testCase.equal(result.intensityCounts[1], 1, 'raw sentinel and explicit mask remove intensity');

  const centroid = getRasterRegionWorldCentroid(
    PROJECTED_METADATA,
    result.centroidColumns[0]!,
    result.centroidRows[0]!
  );
  const expectedWorld: readonly [number, number] = [
    PROJECTED_METADATA.affine[0] * result.centroidColumns[0]! +
      PROJECTED_METADATA.affine[1] * result.centroidRows[0]! +
      PROJECTED_METADATA.affine[2],
    PROJECTED_METADATA.affine[3] * result.centroidColumns[0]! +
      PROJECTED_METADATA.affine[4] * result.centroidRows[0]! +
      PROJECTED_METADATA.affine[5]
  ];
  testCase.deepEqual(
    centroid,
    expectedWorld,
    'JS affine translation retains full double precision'
  );
  testCase.notEqual(
    centroid[0],
    Math.fround(centroid[0]),
    'large projected origins are not silently rounded through float32 absolute coordinates'
  );
  testCase.equal(
    result.areas[0],
    3 * Math.abs(2 * -3 - 0.25 * -0.5),
    'rotated/sheared affine area uses the absolute determinant in CRS coordinate units'
  );
  testCase.equal(result.pixelCounts[7], 0, 'unused bounded rows contain zero pixels');
  testCase.ok(Number.isNaN(result.centroidColumns[7]), 'unused rows have no plausible centroid');
  testCase.end();
});

test('GPURaster classification, connected roots, dense labels, and regional measurements compose into one GPU graph', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const metadata: GPURasterMetadata = {
    width: 9,
    height: 5,
    affine: [3, 0.5, 702400.25, -0.25, -4, 4187600.75],
    pixelInterpretation: 'area',
    coordinateReferenceSystem: {authority: 'EPSG:32610'},
    levelZeroOrigin: [128, 64],
    level: 0
  };
  const pixelCount = metadata.width * metadata.height;
  const capacity = 8;
  const classification = Float32Array.from(
    Array.from({length: pixelCount}, (_, pixelIndex) => {
      const column = pixelIndex % metadata.width;
      const row = Math.floor(pixelIndex / metadata.width);
      return Number(column % 4 <= 1 && row % 3 === 0) * 0.8 + 0.1;
    })
  );
  const sourceValidity = Uint32Array.from(Array.from({length: pixelCount}, () => 1));
  sourceValidity[27] = 0;
  const intensity = Float32Array.from(
    Array.from({length: pixelCount}, (_, pixelIndex) => pixelIndex * 1.5 - 4)
  );
  const intensityValidity = Uint32Array.from(Array.from({length: pixelCount}, () => 1));
  intensityValidity[1] = 0;
  intensity[4] = -999;

  const graph = new GPUCommandGraph(device, {id: 'classify-dense-regions'});
  const ownedBuffers: Buffer[] = [];
  const classificationBuffer = makeInputBuffer(
    device,
    ownedBuffers,
    'classification',
    classification
  );
  const sourceValidityBuffer = makeInputBuffer(
    device,
    ownedBuffers,
    'source-validity',
    sourceValidity
  );
  const intensityBuffer = makeInputBuffer(device, ownedBuffers, 'intensity', intensity);
  const intensityValidityBuffer = makeInputBuffer(
    device,
    ownedBuffers,
    'intensity-validity',
    intensityValidity
  );
  const thresholdBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'threshold', pixelCount);
  const sparseBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'sparse', pixelCount, 1);
  const sparseValidityBuffer = makeGuardedOutputBuffer(
    device,
    ownedBuffers,
    'sparse-validity',
    pixelCount,
    2
  );
  const denseBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'dense', pixelCount, 1);
  const denseValidityBuffer = makeGuardedOutputBuffer(
    device,
    ownedBuffers,
    'dense-validity',
    pixelCount,
    2
  );
  const convergenceBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'converged', 1, 1);
  const countBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'component-count', 1, 1);
  const overflowBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'overflow', 1, 1);
  const requiredBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'required', 1, 1);
  const outputs = makeMeasurementOutputs(graph, device, ownedBuffers, capacity);

  const classificationMask = importView(graph, sourceValidityBuffer, 'uint32', pixelCount);
  const threshold = importView(graph, thresholdBuffer, 'uint32', pixelCount);
  new GPURasterThreshold({
    id: 'region-classification',
    width: metadata.width,
    height: metadata.height,
    input: {
      id: 'classification-values',
      format: 'float32',
      storage: {
        kind: 'buffer',
        values: importView(graph, classificationBuffer, 'float32', pixelCount)
      },
      validity: classificationMask
    },
    output: threshold,
    threshold: 0.5
  }).addToGraph(graph);

  const sparseLabels = importView(graph, sparseBuffer, 'uint32', pixelCount, 1);
  const sparseValidity = importView(graph, sparseValidityBuffer, 'uint32', pixelCount, 2);
  const convergence = importView(graph, convergenceBuffer, 'uint32', 1, 1);
  new GPURasterConnectedComponents({
    id: 'region-sparse-components',
    width: metadata.width,
    height: metadata.height,
    input: {
      id: 'threshold-foreground',
      format: 'uint32',
      storage: {kind: 'buffer', values: threshold},
      validity: classificationMask
    },
    output: sparseLabels,
    outputValidity: sparseValidity,
    converged: convergence,
    connectivity: 4,
    maximumIterations: 24
  }).addToGraph(graph);

  const denseLabels = importView(graph, denseBuffer, 'uint32', pixelCount, 1);
  const denseValidity = importView(graph, denseValidityBuffer, 'uint32', pixelCount, 2);
  const componentCount = importView(graph, countBuffer, 'uint32', 1, 1);
  const overflow = importView(graph, overflowBuffer, 'uint32', 1, 1);
  new GPURasterDenseComponents({
    id: 'region-dense-components',
    width: metadata.width,
    height: metadata.height,
    input: sparseLabels,
    inputValidity: sparseValidity,
    converged: convergence,
    output: denseLabels,
    outputValidity: denseValidity,
    componentCount,
    requiredComponentCount: importView(graph, requiredBuffer, 'uint32', 1, 1),
    overflow,
    capacity
  }).addToGraph(graph);

  new GPURasterRegionMeasurements({
    id: 'region-measurements',
    metadata,
    labels: denseLabels,
    labelValidity: denseValidity,
    converged: convergence,
    componentCount,
    overflow,
    intensity: {
      id: 'region-intensity',
      format: 'float32',
      storage: {kind: 'buffer', values: importView(graph, intensityBuffer, 'float32', pixelCount)},
      validity: importView(graph, intensityValidityBuffer, 'uint32', pixelCount),
      noDataValue: -999,
      scale: 0.5,
      offset: 2
    },
    output: getOutputViews(outputs),
    capacity
  }).addToGraph(graph);

  const compiled = graph.compile();
  for (let encodingIndex = 0; encodingIndex < 2; encodingIndex++) {
    if (encodingIndex === 1) {
      for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
        const column = pixelIndex % metadata.width;
        const row = Math.floor(pixelIndex / metadata.width);
        classification[pixelIndex] = Number(column % 4 >= 2 && row % 3 === 1) * 0.8 + 0.1;
      }
      classificationBuffer.write(classification);
      intensity[2] = Number.NaN;
      intensityBuffer.write(intensity);
    }
    submitGraph(device, compiled, `region-composition-${encodingIndex}`);
    const labels = Uint32Array.from(await readLogical(denseBuffer, pixelCount, 1));
    const labelValidity = Uint32Array.from(await readLogical(denseValidityBuffer, pixelCount, 2));
    const publishedCount = (await readLogical(countBuffer, 1, 1))[0]!;
    const expected = makeReferenceMeasurements(
      {
        metadata,
        labels,
        labelValidity,
        intensity,
        intensityValidity,
        componentCount: publishedCount,
        capacity,
        noDataValue: -999,
        scale: 0.5,
        offset: 2
      },
      true
    );
    const actual = await readMeasurementOutputs(outputs);
    assertMeasurementResults(
      testCase,
      actual,
      expected,
      `classification → sparse components → dense scan → grouped measurements, encoding ${encodingIndex}`
    );
    testCase.equal((await readLogical(convergenceBuffer, 1, 1))[0], 1, 'upstream graph converges');
    testCase.equal((await readLogical(overflowBuffer, 1, 1))[0], 0, 'bounded groups fit capacity');
    testCase.deepEqual(
      (await readUnsigned(outputs.pixelCounts.buffer)).slice(0, outputs.pixelCounts.prefixLength),
      Array.from({length: outputs.pixelCounts.prefixLength}, () => GUARD_VALUE),
      'caller-owned output prefix guards survive composed graph execution'
    );
  }

  compiled.destroy();
  for (const buffer of ownedBuffers) {
    testCase.notOk(buffer.destroyed, 'compiled graphs never destroy borrowed measurement outputs');
    buffer.destroy();
  }
  testCase.end();
});

test('GPURaster grouped outputs fail closed on nonconvergence, truncation, and invalid selected capacity', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const metadata: GPURasterMetadata = {
    width: 6,
    height: 1,
    affine: [3, 0, 400, 0, -2, 900],
    pixelInterpretation: 'area'
  };
  const labels = Uint32Array.from([1, 1, 0, 2, 2, 0]);
  const validity = Uint32Array.from([1, 1, 1, 1, 1, 0]);
  const intensity = Float32Array.from([2, 4, 100, 6, 8, 10]);
  const graph = new GPUCommandGraph(device, {id: 'regional-fail-close'});
  const ownedBuffers: Buffer[] = [];
  const labelBuffer = makeInputBuffer(device, ownedBuffers, 'labels', labels);
  const validityBuffer = makeInputBuffer(device, ownedBuffers, 'validity', validity);
  const intensityBuffer = makeInputBuffer(device, ownedBuffers, 'intensity', intensity);
  const convergenceBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'convergence', 1, 1);
  const countBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'count', 1, 1);
  const overflowBuffer = makeGuardedOutputBuffer(device, ownedBuffers, 'overflow', 1, 1);
  convergenceBuffer.write(new Uint32Array([1]), Uint32Array.BYTES_PER_ELEMENT);
  countBuffer.write(new Uint32Array([2]), Uint32Array.BYTES_PER_ELEMENT);
  overflowBuffer.write(new Uint32Array([0]), Uint32Array.BYTES_PER_ELEMENT);
  const outputs = makeMeasurementOutputs(graph, device, ownedBuffers, 3);

  new GPURasterRegionMeasurements({
    id: 'gated-region-results',
    metadata,
    labels: importView(graph, labelBuffer, 'uint32', labels.length),
    labelValidity: importView(graph, validityBuffer, 'uint32', labels.length),
    converged: importView(graph, convergenceBuffer, 'uint32', 1, 1),
    componentCount: importView(graph, countBuffer, 'uint32', 1, 1),
    overflow: importView(graph, overflowBuffer, 'uint32', 1, 1),
    intensity: {
      id: 'gated-intensity',
      format: 'float32',
      storage: {
        kind: 'buffer',
        values: importView(graph, intensityBuffer, 'float32', labels.length)
      }
    },
    output: getOutputViews(outputs),
    capacity: 3
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'regions-initial-valid');
  let actual = await readMeasurementOutputs(outputs);
  testCase.deepEqual(actual.pixelCounts, [2, 2, 0], 'initial geometry count is valid');
  testCase.deepEqual(actual.intensitySums, [6, 14, 0], 'initial intensity reductions are valid');

  convergenceBuffer.write(new Uint32Array([0]), Uint32Array.BYTES_PER_ELEMENT);
  submitGraph(device, compiled, 'regions-upstream-nonconverged');
  actual = await readMeasurementOutputs(outputs);
  assertInvalidMeasurements(testCase, actual, 'nonconverged component roots');

  convergenceBuffer.write(new Uint32Array([1]), Uint32Array.BYTES_PER_ELEMENT);
  overflowBuffer.write(new Uint32Array([1]), Uint32Array.BYTES_PER_ELEMENT);
  submitGraph(device, compiled, 'regions-upstream-overflow');
  actual = await readMeasurementOutputs(outputs);
  assertInvalidMeasurements(testCase, actual, 'overflowed dense region IDs');

  overflowBuffer.write(new Uint32Array([0]), Uint32Array.BYTES_PER_ELEMENT);
  countBuffer.write(new Uint32Array([4]), Uint32Array.BYTES_PER_ELEMENT);
  submitGraph(device, compiled, 'regions-invalid-count');
  actual = await readMeasurementOutputs(outputs);
  assertInvalidMeasurements(testCase, actual, 'component count exceeding declared output capacity');

  countBuffer.write(new Uint32Array([2]), Uint32Array.BYTES_PER_ELEMENT);
  intensity.set([4, 6, 100, 8, 10, 12]);
  intensityBuffer.write(intensity);
  submitGraph(device, compiled, 'regions-recovered');
  actual = await readMeasurementOutputs(outputs);
  testCase.deepEqual(actual.pixelCounts, [2, 2, 0], 'valid geometry recovers on graph replay');
  testCase.deepEqual(
    actual.intensitySums,
    [10, 18, 0],
    'fresh floating samples replace stale data'
  );
  testCase.deepEqual(
    (await readUnsigned(outputs.intensityCounts.buffer)).slice(
      0,
      outputs.intensityCounts.prefixLength
    ),
    Array.from({length: outputs.intensityCounts.prefixLength}, () => GUARD_VALUE),
    'repeated clear/aggregate passes preserve output prefix guards'
  );

  compiled.destroy();
  for (const buffer of ownedBuffers) buffer.destroy();
  testCase.end();
});

test('GPURaster regional pixel centers and overview affines preserve coordinate-system area semantics', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const labels = Uint32Array.from([1, 1, 0, 1, 0, 0]);
  const validity = Uint32Array.from([1, 1, 1, 1, 1, 1]);
  const intensity = Float32Array.from([2, 4, 8, 6, 16, 32]);
  for (const pixelInterpretation of ['area', 'point'] as const) {
    const metadata: GPURasterMetadata = {
      width: 3,
      height: 2,
      affine: [0.25, 0.1, -122.125, 0.05, -0.5, 37.375],
      pixelInterpretation,
      coordinateReferenceSystem: {authority: 'EPSG:4326'},
      levelZeroOrigin: [18, 34],
      level: 1
    };
    const fixture: RegionFixture = {
      metadata,
      labels,
      labelValidity: validity,
      intensity,
      intensityValidity: validity,
      componentCount: 1,
      capacity: 2
    };
    const result = await runDirectMeasurements(device, fixture);
    const expected = makeReferenceMeasurements(fixture, true);
    assertMeasurementResults(
      testCase,
      result,
      expected,
      `${pixelInterpretation}-centered grouping`
    );
    const expectedCenterOffset = pixelInterpretation === 'area' ? 0.5 : 0;
    testCase.ok(
      Math.abs(result.centroidColumns[0]! - (1 / 3 + expectedCenterOffset)) < 1e-5,
      `${pixelInterpretation} pixel centers use their documented zero/half-pixel convention`
    );
    testCase.ok(
      Math.abs(result.areas[0]! - 3 * Math.abs(0.25 * -0.5 - 0.1 * 0.05)) < 1e-6,
      'geographic affine area remains square degrees, with no fabricated square-meter conversion'
    );

    const world = getRasterRegionWorldCentroid(
      metadata,
      result.centroidColumns[0]!,
      result.centroidRows[0]!
    );
    testCase.ok(
      Math.abs(
        world[0] - (-122.125 + 0.25 * result.centroidColumns[0]! + 0.1 * result.centroidRows[0]!)
      ) < 1e-12,
      'retained affine translation is applied exactly once without adding level-zero tile origin'
    );
  }
  testCase.end();
});

async function runDirectMeasurements(
  device: Device,
  fixture: RegionFixture
): Promise<RegionReference> {
  const graph = new GPUCommandGraph(device, {id: 'direct-region-measurements'});
  const ownedBuffers: Buffer[] = [];
  const pixelCount = fixture.metadata.width * fixture.metadata.height;
  const labels = makeInputBuffer(device, ownedBuffers, 'direct-labels', fixture.labels);
  const validity = makeInputBuffer(device, ownedBuffers, 'direct-validity', fixture.labelValidity);
  const intensity = makeInputBuffer(device, ownedBuffers, 'direct-intensity', fixture.intensity);
  const intensityValidity = makeInputBuffer(
    device,
    ownedBuffers,
    'direct-intensity-validity',
    fixture.intensityValidity
  );
  const convergence = makeInputBuffer(
    device,
    ownedBuffers,
    'direct-convergence',
    new Uint32Array([1])
  );
  const count = makeInputBuffer(
    device,
    ownedBuffers,
    'direct-component-count',
    new Uint32Array([fixture.componentCount])
  );
  const overflow = makeInputBuffer(device, ownedBuffers, 'direct-overflow', new Uint32Array([0]));
  const outputs = makeMeasurementOutputs(graph, device, ownedBuffers, fixture.capacity);

  const intensityBand: GPURasterBufferBand<'float32'> = {
    id: 'direct-intensity-band',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, intensity, 'float32', pixelCount)},
    validity: importView(graph, intensityValidity, 'uint32', pixelCount),
    ...(fixture.noDataValue === undefined ? {} : {noDataValue: fixture.noDataValue}),
    ...(fixture.scale === undefined ? {} : {scale: fixture.scale}),
    ...(fixture.offset === undefined ? {} : {offset: fixture.offset})
  };
  new GPURasterRegionMeasurements({
    id: 'direct-grouped-statistics',
    metadata: fixture.metadata,
    labels: importView(graph, labels, 'uint32', pixelCount),
    labelValidity: importView(graph, validity, 'uint32', pixelCount),
    converged: importView(graph, convergence, 'uint32', 1),
    componentCount: importView(graph, count, 'uint32', 1),
    overflow: importView(graph, overflow, 'uint32', 1),
    intensity: intensityBand,
    output: getOutputViews(outputs),
    capacity: fixture.capacity
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'submit-direct-regions');
  const result = await readMeasurementOutputs(outputs);
  compiled.destroy();
  for (const buffer of ownedBuffers) buffer.destroy();
  return result;
}

function makeMeasurementOutputs(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  capacity: number
): MeasurementOutputRecords {
  return {
    pixelCounts: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'pixel-counts',
      'uint32',
      capacity,
      1
    ),
    intensityCounts: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'intensity-counts',
      'uint32',
      capacity,
      2
    ),
    intensitySums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'intensity-sums',
      'float32',
      capacity,
      1
    ),
    intensityMinimums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'intensity-minimums',
      'float32',
      capacity,
      2
    ),
    intensityMaximums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'intensity-maximums',
      'float32',
      capacity,
      1
    ),
    intensityMeans: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'intensity-means',
      'float32',
      capacity,
      2
    ),
    columnSums: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'column-sums',
      'float32',
      capacity,
      1
    ),
    rowSums: makeOutputRecord(graph, device, ownedBuffers, 'row-sums', 'float32', capacity, 2),
    centroidColumns: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'centroid-columns',
      'float32',
      capacity,
      1
    ),
    centroidRows: makeOutputRecord(
      graph,
      device,
      ownedBuffers,
      'centroid-rows',
      'float32',
      capacity,
      2
    ),
    areas: makeOutputRecord(graph, device, ownedBuffers, 'areas', 'float32', capacity, 1)
  };
}

function getOutputViews(records: MeasurementOutputRecords): GPURasterRegionMeasurementOutputs {
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

async function readMeasurementOutputs(records: MeasurementOutputRecords): Promise<RegionReference> {
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

function makeReferenceMeasurements(fixture: RegionFixture, valid: boolean): RegionReference {
  const length = fixture.capacity;
  const result: RegionReference = {
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
  if (!valid || fixture.componentCount > length) return result;

  const centerOffset = fixture.metadata.pixelInterpretation === 'area' ? 0.5 : 0;
  for (let pixelIndex = 0; pixelIndex < fixture.labels.length; pixelIndex++) {
    const label = fixture.labels[pixelIndex]!;
    if (!fixture.labelValidity[pixelIndex] || label === 0 || label > fixture.componentCount)
      continue;
    const groupIndex = label - 1;
    result.pixelCounts[groupIndex]!++;
    result.columnSums[groupIndex]! += (pixelIndex % fixture.metadata.width) + centerOffset;
    result.rowSums[groupIndex]! += Math.floor(pixelIndex / fixture.metadata.width) + centerOffset;

    const rawSample = fixture.intensity[pixelIndex]!;
    if (
      !fixture.intensityValidity[pixelIndex] ||
      !Number.isFinite(rawSample) ||
      rawSample === fixture.noDataValue
    ) {
      continue;
    }
    const sample = rawSample * (fixture.scale ?? 1) + (fixture.offset ?? 0);
    if (!Number.isFinite(sample)) continue;
    result.intensityCounts[groupIndex]!++;
    result.intensitySums[groupIndex]! += sample;
    result.intensityMinimums[groupIndex] = Number.isNaN(result.intensityMinimums[groupIndex])
      ? sample
      : Math.min(result.intensityMinimums[groupIndex]!, sample);
    result.intensityMaximums[groupIndex] = Number.isNaN(result.intensityMaximums[groupIndex])
      ? sample
      : Math.max(result.intensityMaximums[groupIndex]!, sample);
  }

  const [first, second, , fourth, fifth] = fixture.metadata.affine;
  const pixelArea = Math.abs(first * fifth - second * fourth);
  for (let groupIndex = 0; groupIndex < length; groupIndex++) {
    const pixelCount = result.pixelCounts[groupIndex]!;
    const intensityCount = result.intensityCounts[groupIndex]!;
    if (pixelCount !== 0) {
      result.centroidColumns[groupIndex] = result.columnSums[groupIndex]! / pixelCount;
      result.centroidRows[groupIndex] = result.rowSums[groupIndex]! / pixelCount;
      result.areas[groupIndex] = pixelCount * pixelArea;
    }
    if (intensityCount !== 0) {
      result.intensityMeans[groupIndex] = result.intensitySums[groupIndex]! / intensityCount;
    }
  }
  return result;
}

function assertMeasurementResults(
  testCase: Test,
  actual: RegionReference,
  expected: RegionReference,
  label: string
): void {
  testCase.deepEqual(actual.pixelCounts, expected.pixelCounts, `${label}: exact geometry counts`);
  testCase.deepEqual(
    actual.intensityCounts,
    expected.intensityCounts,
    `${label}: exact valid intensity counts`
  );
  for (const key of [
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
    for (let index = 0; index < actual[key].length; index++) {
      const actualValue = actual[key][index]!;
      const expectedValue = expected[key][index]!;
      if (Number.isNaN(expectedValue)) {
        testCase.ok(
          Number.isNaN(actualValue),
          `${label}: ${key}[${index}] has no fabricated value`
        );
      } else {
        const tolerance = 0.0001 * Math.max(1, Math.abs(expectedValue));
        testCase.ok(
          Math.abs(actualValue - expectedValue) <= tolerance,
          `${label}: ${key}[${index}] matches finite CPU reference`
        );
      }
    }
  }
}

function assertInvalidMeasurements(testCase: Test, actual: RegionReference, reason: string): void {
  testCase.ok(
    actual.pixelCounts.every(value => value === 0),
    `${reason}: geometry counts cleared`
  );
  testCase.ok(
    actual.intensityCounts.every(value => value === 0),
    `${reason}: intensity counts cleared`
  );
  for (const key of ['intensitySums', 'columnSums', 'rowSums', 'areas'] as const) {
    testCase.ok(
      actual[key].every(value => value === 0),
      `${reason}: ${key} cleared`
    );
  }
  for (const key of [
    'intensityMinimums',
    'intensityMaximums',
    'intensityMeans',
    'centroidColumns',
    'centroidRows'
  ] as const) {
    testCase.ok(actual[key].every(Number.isNaN), `${reason}: ${key} contains no plausible result`);
  }
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
  const buffer = makeGuardedOutputBuffer(device, ownedBuffers, id, length, prefixLength);
  return {view: importView(graph, buffer, format, length, prefixLength), buffer, prefixLength};
}

async function readRecord(
  record: OutputRecord<'uint32'> | OutputRecord<'float32'>
): Promise<number[]> {
  const bytes = await record.buffer.readAsync();
  const values =
    record.view.format === 'uint32'
      ? new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
      : new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  return Array.from(values.slice(record.prefixLength, record.prefixLength + record.view.length));
}

function makeInputBuffer(
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  values: Uint32Array | Float32Array
): Buffer {
  const buffer = device.createBuffer({
    id,
    data: values,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  ownedBuffers.push(buffer);
  return buffer;
}

function makeGuardedOutputBuffer(
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  length: number,
  prefixLength: number = 0
): Buffer {
  const values = new Uint32Array(prefixLength + length + 1);
  values.fill(GUARD_VALUE);
  return makeInputBuffer(device, ownedBuffers, id, values);
}

function importView<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  buffer: Buffer,
  format: Format,
  length: number,
  prefixLength: number = 0
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {
    format,
    length,
    byteOffset: prefixLength * Uint32Array.BYTES_PER_ELEMENT
  });
}

async function readUnsigned(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

async function readLogical(
  buffer: Buffer,
  length: number,
  prefixLength: number
): Promise<number[]> {
  return (await readUnsigned(buffer)).slice(prefixLength, prefixLength + length);
}

function submitGraph(
  device: Device,
  graph: ReturnType<GPUCommandGraph['compile']>,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  graph.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}
