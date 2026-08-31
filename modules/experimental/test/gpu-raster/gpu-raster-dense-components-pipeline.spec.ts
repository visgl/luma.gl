// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterClosing,
  GPURasterConnectedComponents,
  GPURasterDenseComponents,
  GPURasterHistogram,
  GPURasterThreshold,
  type GPURasterBufferBand,
  type GPURasterConnectivity
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

type BinarySamples = {
  values: Uint32Array;
  validity: Uint32Array;
};

type DenseReference = BinarySamples & {
  requiredCount: number;
  componentCount: number;
  overflow: number;
};

type DenseFixture = {
  id: string;
  width: number;
  height: number;
  values: Uint32Array;
  validity: Uint32Array;
  connectivity: GPURasterConnectivity;
  maximumIterations: number;
  capacity: number;
  noDataValue?: number;
};

type DenseResult = {
  sparseLabels: number[];
  denseLabels: number[];
  validity: number[];
  converged: number;
  componentCount: number;
  requiredCount: number;
  overflow: number;
  histogram: number[];
};

type OwnedDenseGraph = {
  graph: GPUCommandGraph;
  ownedBuffers: Buffer[];
  sparseLabels: Buffer;
  denseLabels: Buffer;
  outputValidity: Buffer;
  converged: Buffer;
  componentCount: Buffer;
  requiredCount: Buffer;
  overflow: Buffer;
  histogram: Buffer;
};

const GUARD_VALUE = 4000000001;
const HISTOGRAM_BIN_COUNT = 16;

it('GPURaster dense components scan hierarchical checkerboards into deterministic 4/8-connected IDs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 37;
  const height = 19;
  const pixelCount = width * height;
  const values = Uint32Array.from(
    Array.from({length: pixelCount}, (_, pixelIndex) => {
      const column = pixelIndex % width;
      const row = Math.floor(pixelIndex / width);
      return (column + row) % 2 === 0 ? (pixelIndex % 7) + 1 : 0;
    })
  );
  const validity = Uint32Array.from(Array.from({length: pixelCount}, () => 1));
  values[74] = 0xffffffff;
  validity[370] = 0;

  for (const connectivity of [4, 8] as const) {
    const fixture: DenseFixture = {
      id: `hierarchical-dense-checkerboard-${connectivity}`,
      width,
      height,
      values,
      validity,
      connectivity,
      maximumIterations: 32,
      capacity: pixelCount,
      noDataValue: 0xffffffff
    };
    const result = await runConnectedDenseGraph(device, fixture);
    const sparse = makeReferenceComponents(fixture);
    const expected = makeReferenceDense(sparse, pixelCount, true);

    expect(
      result.sparseLabels,
      `${connectivity}-connected sparse labels retain deterministic minimum row-major roots`
    ).toEqual(Array.from(sparse.values));
    expect(
      result.denseLabels,
      `${connectivity}-connected sparse roots become contiguous deterministic ascending IDs`
    ).toEqual(Array.from(expected.values));
    expect(
      result.validity,
      'exact unsigned nodata and independent masks remain distinct from valid background'
    ).toEqual(Array.from(expected.validity));
    expect(result.converged, 'dense publication observes real GPU convergence').toBe(1);
    expect(result.requiredCount, 'exact root population is published').toBe(expected.requiredCount);
    expect(result.componentCount, 'the bounded count is exact').toBe(expected.componentCount);
    expect(result.overflow, 'sufficient capacity does not publish overflow').toBe(0);

    const denseIdentifiers = [...new Set(result.denseLabels.filter(label => label !== 0))].sort(
      (left, right) => left - right
    );
    expect(denseIdentifiers, 'published foreground IDs contain no sparse gaps').toEqual(
      Array.from({length: expected.requiredCount}, (_, index) => index + 1)
    );
    if (connectivity === 4) {
      expect(
        Boolean(expected.requiredCount > 256),
        'the checkerboard exercises hierarchical GPUScan across multiple workgroups'
      ).toBe(true);
    } else {
      expect(expected.requiredCount, 'diagonal checkerboard foreground forms one region').toBe(1);
    }
    expect(result.denseLabels[1], 'valid background retains zero').toBe(0);
    expect(result.validity[1], 'valid zero remains analytically valid').toBe(1);
    expect(result.validity[74], 'exact uint32 nodata never becomes background').toBe(0);
    expect(result.validity[370], 'an independent missing observation remains invalid').toBe(0);
  }

  void 0;
});

it('GPURaster dense component capacity explicitly handles zero, overflow, exact counts, and dependent histograms', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 19;
  const height = 17;
  const pixelCount = width * height;
  const values = Uint32Array.from(
    Array.from({length: pixelCount}, (_, pixelIndex) => {
      const column = pixelIndex % width;
      const row = Math.floor(pixelIndex / width);
      return Number(column % 3 === 0 && row % 3 === 0);
    })
  );
  const validity = Uint32Array.from(Array.from({length: pixelCount}, () => 1));
  validity[57] = 0;
  const sparse = makeReferenceComponents({width, height, values, validity, connectivity: 4});

  for (const capacity of [0, 3, 9, pixelCount]) {
    const fixture: DenseFixture = {
      id: `capacity-${capacity}`,
      width,
      height,
      values,
      validity,
      connectivity: 4,
      maximumIterations: 12,
      capacity
    };
    const result = await runConnectedDenseGraph(device, fixture);
    const expected = makeReferenceDense(sparse, capacity, true);

    expect(
      result.denseLabels,
      `capacity ${capacity} retains only the deterministic first dense representatives`
    ).toEqual(Array.from(expected.values));
    expect(
      result.validity,
      'overflowed foreground is invalid while observed background remains valid'
    ).toEqual(Array.from(expected.validity));
    expect(result.requiredCount, 'the unclamped total stays exact').toBe(expected.requiredCount);
    expect(result.componentCount, 'the bounded count clamps').toBe(expected.componentCount);
    expect(result.overflow, 'overflow is caller-visible and exact').toBe(expected.overflow);
    expect(
      result.histogram,
      'dependent GPU histograms never consume dropped over-capacity foreground'
    ).toEqual(makeReferenceHistogram(expected, pixelCount));
  }

  const emptyResult = await runConnectedDenseGraph(device, {
    id: 'empty-zero-capacity',
    width,
    height,
    values: new Uint32Array(pixelCount),
    validity,
    connectivity: 4,
    maximumIterations: 4,
    capacity: 0
  });
  expect(emptyResult.requiredCount, 'an empty mask requires no component slots').toBe(0);
  expect(emptyResult.componentCount, 'zero capacity accepts an empty mask').toBe(0);
  expect(emptyResult.overflow, 'zero capacity is not overflow when no regions exist').toBe(0);
  void 0;
});

it('GPURaster threshold, binary closing, connected roots, and dense IDs compose and re-encode on GPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 19;
  const height = 17;
  const pixelCount = width * height;
  const capacity = 5;
  const samples = new Float32Array(pixelCount);
  const validity = Uint32Array.from(Array.from({length: pixelCount}, () => 1));
  validity[width * 8 + 9] = 0;
  populateSampleIslands(samples, width, height, 0);

  const graph = new GPUCommandGraph(device, {id: 'threshold-closing-dense-components'});
  const ownedBuffers: Buffer[] = [];
  const sampleBuffer = makeInputBuffer(device, ownedBuffers, 'samples', samples);
  const sourceValidityBuffer = makeInputBuffer(device, ownedBuffers, 'source-validity', validity);
  const thresholdBuffer = makeOutputBuffer(device, ownedBuffers, 'threshold', pixelCount);
  const closingBuffer = makeOutputBuffer(device, ownedBuffers, 'closing', pixelCount);
  const closingValidityBuffer = makeOutputBuffer(
    device,
    ownedBuffers,
    'closing-validity',
    pixelCount
  );
  const sparseBuffer = makeOutputBuffer(device, ownedBuffers, 'sparse', pixelCount, 1);
  const sparseValidityBuffer = makeOutputBuffer(
    device,
    ownedBuffers,
    'sparse-validity',
    pixelCount,
    2
  );
  const denseBuffer = makeOutputBuffer(device, ownedBuffers, 'dense', pixelCount, 3);
  const denseValidityBuffer = makeOutputBuffer(
    device,
    ownedBuffers,
    'dense-validity',
    pixelCount,
    1
  );
  const convergenceBuffer = makeOutputBuffer(device, ownedBuffers, 'converged', 1, 1);
  const countBuffer = makeOutputBuffer(device, ownedBuffers, 'bounded-count', 1, 2);
  const requiredBuffer = makeOutputBuffer(device, ownedBuffers, 'required-count', 1, 1);
  const overflowBuffer = makeOutputBuffer(device, ownedBuffers, 'overflow', 1, 2);

  const sourceValidity = importView(graph, sourceValidityBuffer, 'uint32', pixelCount);
  const threshold = importView(graph, thresholdBuffer, 'uint32', pixelCount);
  new GPURasterThreshold({
    id: 'threshold-islands',
    width,
    height,
    input: {
      id: 'float-islands',
      format: 'float32',
      storage: {kind: 'buffer', values: importView(graph, sampleBuffer, 'float32', pixelCount)},
      validity: sourceValidity
    },
    output: threshold,
    threshold: 0.5
  }).addToGraph(graph);

  const closing = importView(graph, closingBuffer, 'uint32', pixelCount);
  const closingValidity = importView(graph, closingValidityBuffer, 'uint32', pixelCount);
  new GPURasterClosing({
    id: 'close-islands',
    width,
    height,
    mode: 'binary',
    radius: 1,
    structuringElement: 'cross',
    borderMode: 'clamp',
    noDataPolicy: 'ignore',
    input: {
      id: 'threshold-mask',
      format: 'uint32',
      storage: {kind: 'buffer', values: threshold},
      validity: sourceValidity
    },
    output: closing,
    outputValidity: closingValidity
  }).addToGraph(graph);

  const sparse = importView(graph, sparseBuffer, 'uint32', pixelCount, 1);
  const sparseValidity = importView(graph, sparseValidityBuffer, 'uint32', pixelCount, 2);
  const convergence = importView(graph, convergenceBuffer, 'uint32', 1, 1);
  new GPURasterConnectedComponents({
    id: 'connected-islands',
    width,
    height,
    connectivity: 4,
    maximumIterations: 24,
    input: {
      id: 'closed-islands',
      format: 'uint32',
      storage: {kind: 'buffer', values: closing},
      validity: closingValidity
    },
    output: sparse,
    outputValidity: sparseValidity,
    converged: convergence
  }).addToGraph(graph);

  new GPURasterDenseComponents({
    id: 'dense-islands',
    width,
    height,
    input: sparse,
    inputValidity: sparseValidity,
    converged: convergence,
    output: importView(graph, denseBuffer, 'uint32', pixelCount, 3),
    outputValidity: importView(graph, denseValidityBuffer, 'uint32', pixelCount, 1),
    componentCount: importView(graph, countBuffer, 'uint32', 1, 2),
    requiredComponentCount: importView(graph, requiredBuffer, 'uint32', 1, 1),
    overflow: importView(graph, overflowBuffer, 'uint32', 1, 2),
    capacity
  }).addToGraph(graph);

  const compiled = graph.compile();
  for (let encodingIndex = 0; encodingIndex < 2; encodingIndex++) {
    if (encodingIndex !== 0) {
      populateSampleIslands(samples, width, height, encodingIndex);
      sampleBuffer.write(samples);
    }
    submitGraph(device, compiled, `submit-dense-islands-${encodingIndex}`);

    const thresholdReference = Uint32Array.from(
      Array.from(samples, (sample, pixelIndex) =>
        Number(validity[pixelIndex] !== 0 && sample >= 0.5)
      )
    );
    const closedReference = closeBinaryCross({values: thresholdReference, validity}, width, height);
    const sparseReference = makeReferenceComponents({
      width,
      height,
      values: closedReference.values,
      validity: closedReference.validity,
      connectivity: 4
    });
    const expected = makeReferenceDense(sparseReference, capacity, true);

    expect(
      await readLogical(denseBuffer, pixelCount, 3),
      'one GPU graph composes threshold, closing, sparse labeling, hierarchical scan, and dense IDs'
    ).toEqual(Array.from(expected.values));
    expect(
      await readLogical(denseValidityBuffer, pixelCount, 1),
      'overflowed regions and missing samples never become valid background'
    ).toEqual(Array.from(expected.validity));
    expect((await readLogical(countBuffer, 1, 2))[0], '').toBe(expected.componentCount);
    expect((await readLogical(requiredBuffer, 1, 1))[0], '').toBe(expected.requiredCount);
    expect((await readLogical(overflowBuffer, 1, 2))[0], '').toBe(expected.overflow);
    expect(
      (await readUnsigned(denseBuffer)).slice(0, 3),
      'dense output respects caller-owned nonzero view offsets and prefix guards'
    ).toEqual([GUARD_VALUE, GUARD_VALUE, GUARD_VALUE]);
  }

  compiled.destroy();
  for (const buffer of ownedBuffers) {
    expect(
      Boolean(buffer.destroyed),
      'graph teardown never destroys borrowed application buffers'
    ).toBe(false);
    buffer.destroy();
  }
  void 0;
});

it('GPURaster dense replay rejects malformed roots and clears all labels/counts when convergence is lost', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 9;
  const capacity = 2;
  const graph = new GPUCommandGraph(device, {id: 'malformed-dense-replay'});
  const ownedBuffers: Buffer[] = [];
  const sparseValues = Uint32Array.from([1, 1, 8, 0, 5, 5, 0xffffffff, 0, 9]);
  const sparseValidity = Uint32Array.from([1, 1, 1, 1, 1, 1, 1, 0, 1]);
  const sparseBuffer = makeInputBuffer(device, ownedBuffers, 'manual-sparse', sparseValues);
  const sparseValidityBuffer = makeInputBuffer(
    device,
    ownedBuffers,
    'manual-validity',
    sparseValidity
  );
  const convergenceBuffer = makeOutputBuffer(device, ownedBuffers, 'manual-convergence', 1, 1);
  convergenceBuffer.write(new Uint32Array([1]), Uint32Array.BYTES_PER_ELEMENT);
  const denseBuffer = makeOutputBuffer(device, ownedBuffers, 'manual-dense', width, 2);
  const outputValidityBuffer = makeOutputBuffer(
    device,
    ownedBuffers,
    'manual-output-validity',
    width,
    1
  );
  const countBuffer = makeOutputBuffer(device, ownedBuffers, 'manual-count', 1, 1);
  const requiredBuffer = makeOutputBuffer(device, ownedBuffers, 'manual-required', 1, 1);
  const overflowBuffer = makeOutputBuffer(device, ownedBuffers, 'manual-overflow', 1, 2);

  new GPURasterDenseComponents({
    id: 'manual-dense-components',
    width,
    height: 1,
    input: importView(graph, sparseBuffer, 'uint32', width),
    inputValidity: importView(graph, sparseValidityBuffer, 'uint32', width),
    converged: importView(graph, convergenceBuffer, 'uint32', 1, 1),
    output: importView(graph, denseBuffer, 'uint32', width, 2),
    outputValidity: importView(graph, outputValidityBuffer, 'uint32', width, 1),
    componentCount: importView(graph, countBuffer, 'uint32', 1, 1),
    requiredComponentCount: importView(graph, requiredBuffer, 'uint32', 1, 1),
    overflow: importView(graph, overflowBuffer, 'uint32', 1, 2),
    capacity
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'manual-converged');
  let expected = makeReferenceDense(
    {values: sparseValues, validity: sparseValidity},
    capacity,
    true
  );
  expect(await readLogical(denseBuffer, width, 2), '').toEqual(Array.from(expected.values));
  expect(await readLogical(outputValidityBuffer, width, 1), '').toEqual(
    Array.from(expected.validity)
  );
  expect((await readLogical(requiredBuffer, 1, 1))[0], 'only actual roots are counted').toBe(3);
  expect((await readLogical(countBuffer, 1, 1))[0], 'component count clamps to capacity').toBe(2);
  expect((await readLogical(overflowBuffer, 1, 2))[0], 'overflow remains explicit').toBe(1);
  expect(expected.validity[2], 'a root pointing at missing data is invalid').toBe(0);
  expect(expected.validity[6], 'an out-of-bounds unsigned root is invalid').toBe(0);

  convergenceBuffer.write(new Uint32Array([0]), Uint32Array.BYTES_PER_ELEMENT);
  submitGraph(device, compiled, 'manual-unconverged');
  expect(
    await readLogical(denseBuffer, width, 2),
    'lost convergence clears every previously published dense label'
  ).toEqual(Array.from(new Uint32Array(width)));
  expect(
    await readLogical(outputValidityBuffer, width, 1),
    'lost convergence clears all foreground, background, and missing output validity'
  ).toEqual(Array.from(new Uint32Array(width)));
  expect((await readLogical(requiredBuffer, 1, 1))[0], 'unclamped counts fail closed').toBe(0);
  expect((await readLogical(countBuffer, 1, 1))[0], 'bounded counts fail closed').toBe(0);
  expect((await readLogical(overflowBuffer, 1, 2))[0], 'stale overflow does not survive').toBe(0);

  sparseValues.set([1, 1, 3, 3, 0, 0, 7, 7, 0]);
  sparseValidity.fill(1);
  sparseBuffer.write(sparseValues);
  sparseValidityBuffer.write(sparseValidity);
  convergenceBuffer.write(new Uint32Array([1]), Uint32Array.BYTES_PER_ELEMENT);
  submitGraph(device, compiled, 'manual-recovered');
  expected = makeReferenceDense({values: sparseValues, validity: sparseValidity}, capacity, true);
  expect(
    await readLogical(denseBuffer, width, 2),
    'the same compiled graph deterministically rebuilds fresh sparse-to-dense mappings'
  ).toEqual(Array.from(expected.values));
  expect(await readLogical(outputValidityBuffer, width, 1), '').toEqual(
    Array.from(expected.validity)
  );
  expect((await readLogical(requiredBuffer, 1, 1))[0], '').toBe(expected.requiredCount);
  expect((await readLogical(countBuffer, 1, 1))[0], '').toBe(expected.componentCount);
  expect((await readLogical(overflowBuffer, 1, 2))[0], '').toBe(expected.overflow);
  expect(
    (await readUnsigned(overflowBuffer)).slice(0, 2),
    'scalar writes preserve nonzero caller-owned guard offsets'
  ).toEqual([GUARD_VALUE, GUARD_VALUE]);

  compiled.destroy();
  for (const buffer of ownedBuffers) buffer.destroy();
  void 0;
});

async function runConnectedDenseGraph(device: Device, fixture: DenseFixture): Promise<DenseResult> {
  const state = makeConnectedDenseGraph(device, fixture);
  const compiled = state.graph.compile();
  submitGraph(device, compiled, `submit-${fixture.id}`);
  const pixelCount = fixture.width * fixture.height;
  const result: DenseResult = {
    sparseLabels: await readLogical(state.sparseLabels, pixelCount, 1),
    denseLabels: await readLogical(state.denseLabels, pixelCount, 2),
    validity: await readLogical(state.outputValidity, pixelCount, 1),
    converged: (await readLogical(state.converged, 1, 1))[0]!,
    componentCount: (await readLogical(state.componentCount, 1, 1))[0]!,
    requiredCount: (await readLogical(state.requiredCount, 1, 2))[0]!,
    overflow: (await readLogical(state.overflow, 1, 1))[0]!,
    histogram: await readLogical(state.histogram, HISTOGRAM_BIN_COUNT, 1)
  };
  compiled.destroy();
  for (const buffer of state.ownedBuffers) buffer.destroy();
  return result;
}

function makeConnectedDenseGraph(device: Device, fixture: DenseFixture): OwnedDenseGraph {
  const graph = new GPUCommandGraph(device, {id: fixture.id});
  const ownedBuffers: Buffer[] = [];
  const pixelCount = fixture.width * fixture.height;
  const values = makeInputBuffer(device, ownedBuffers, `${fixture.id}-values`, fixture.values);
  const validity = makeInputBuffer(
    device,
    ownedBuffers,
    `${fixture.id}-validity`,
    fixture.validity
  );
  const sparseLabels = makeOutputBuffer(
    device,
    ownedBuffers,
    `${fixture.id}-sparse`,
    pixelCount,
    1
  );
  const sparseValidity = makeOutputBuffer(
    device,
    ownedBuffers,
    `${fixture.id}-sparse-validity`,
    pixelCount
  );
  const denseLabels = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-dense`, pixelCount, 2);
  const outputValidity = makeOutputBuffer(
    device,
    ownedBuffers,
    `${fixture.id}-output-validity`,
    pixelCount,
    1
  );
  const converged = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-converged`, 1, 1);
  const componentCount = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-count`, 1, 1);
  const requiredCount = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-required`, 1, 2);
  const overflow = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-overflow`, 1, 1);
  const histogram = makeOutputBuffer(
    device,
    ownedBuffers,
    `${fixture.id}-histogram`,
    HISTOGRAM_BIN_COUNT,
    1
  );

  const sparse = importView(graph, sparseLabels, 'uint32', pixelCount, 1);
  const sparseMask = importView(graph, sparseValidity, 'uint32', pixelCount);
  const convergence = importView(graph, converged, 'uint32', 1, 1);
  const input: GPURasterBufferBand<'uint32'> = {
    id: `${fixture.id}-input`,
    format: 'uint32',
    storage: {kind: 'buffer', values: importView(graph, values, 'uint32', pixelCount)},
    validity: importView(graph, validity, 'uint32', pixelCount),
    ...(fixture.noDataValue === undefined ? {} : {noDataValue: fixture.noDataValue})
  };
  new GPURasterConnectedComponents({
    id: `${fixture.id}-connected`,
    width: fixture.width,
    height: fixture.height,
    input,
    output: sparse,
    outputValidity: sparseMask,
    converged: convergence,
    connectivity: fixture.connectivity,
    maximumIterations: fixture.maximumIterations
  }).addToGraph(graph);

  const dense = importView(graph, denseLabels, 'uint32', pixelCount, 2);
  const denseValidity = importView(graph, outputValidity, 'uint32', pixelCount, 1);
  new GPURasterDenseComponents({
    id: `${fixture.id}-dense-components`,
    width: fixture.width,
    height: fixture.height,
    input: sparse,
    inputValidity: sparseMask,
    converged: convergence,
    output: dense,
    outputValidity: denseValidity,
    componentCount: importView(graph, componentCount, 'uint32', 1, 1),
    requiredComponentCount: importView(graph, requiredCount, 'uint32', 1, 2),
    overflow: importView(graph, overflow, 'uint32', 1, 1),
    capacity: fixture.capacity
  }).addToGraph(graph);

  new GPURasterHistogram({
    id: `${fixture.id}-dense-histogram`,
    input: {
      id: `${fixture.id}-published-dense`,
      format: 'uint32',
      storage: {kind: 'buffer', values: dense},
      validity: denseValidity
    },
    output: importView(graph, histogram, 'uint32', HISTOGRAM_BIN_COUNT, 1),
    domain: [0, pixelCount + 1]
  }).addToGraph(graph);

  return {
    graph,
    ownedBuffers,
    sparseLabels,
    denseLabels,
    outputValidity,
    converged,
    componentCount,
    requiredCount,
    overflow,
    histogram
  };
}

function makeReferenceComponents(fixture: {
  width: number;
  height: number;
  values: Uint32Array;
  validity: Uint32Array;
  connectivity: GPURasterConnectivity;
  noDataValue?: number;
}): BinarySamples {
  const pixelCount = fixture.width * fixture.height;
  const labels = new Uint32Array(pixelCount);
  const validity = Uint32Array.from(
    Array.from({length: pixelCount}, (_, pixelIndex) =>
      Number(
        fixture.validity[pixelIndex] !== 0 && fixture.values[pixelIndex] !== fixture.noDataValue
      )
    )
  );
  const visited = new Uint8Array(pixelCount);
  const neighbors =
    fixture.connectivity === 4
      ? [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1]
        ]
      : [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0],
          [1, 0],
          [-1, 1],
          [0, 1],
          [1, 1]
        ];

  for (let seed = 0; seed < pixelCount; seed++) {
    if (visited[seed] || !validity[seed] || fixture.values[seed] === 0) continue;
    const pending = [seed];
    const region: number[] = [];
    visited[seed] = 1;
    while (pending.length > 0) {
      const pixelIndex = pending.pop()!;
      region.push(pixelIndex);
      const column = pixelIndex % fixture.width;
      const row = Math.floor(pixelIndex / fixture.width);
      for (const [horizontalOffset, verticalOffset] of neighbors) {
        const nextColumn = column + horizontalOffset!;
        const nextRow = row + verticalOffset!;
        if (
          nextColumn < 0 ||
          nextColumn >= fixture.width ||
          nextRow < 0 ||
          nextRow >= fixture.height
        ) {
          continue;
        }
        const neighborIndex = nextRow * fixture.width + nextColumn;
        if (
          visited[neighborIndex] ||
          !validity[neighborIndex] ||
          fixture.values[neighborIndex] === 0
        ) {
          continue;
        }
        visited[neighborIndex] = 1;
        pending.push(neighborIndex);
      }
    }
    const representative = Math.min(...region) + 1;
    for (const pixelIndex of region) labels[pixelIndex] = representative;
  }
  return {values: labels, validity};
}

function makeReferenceDense(
  source: BinarySamples,
  capacity: number,
  converged: boolean
): DenseReference {
  const values = new Uint32Array(source.values.length);
  const validity = new Uint32Array(source.values.length);
  if (!converged) return {values, validity, requiredCount: 0, componentCount: 0, overflow: 0};

  const roots = new Map<number, number>();
  for (let pixelIndex = 0; pixelIndex < source.values.length; pixelIndex++) {
    if (source.validity[pixelIndex] && source.values[pixelIndex] === pixelIndex + 1) {
      roots.set(pixelIndex + 1, roots.size + 1);
    }
  }

  for (let pixelIndex = 0; pixelIndex < source.values.length; pixelIndex++) {
    if (!source.validity[pixelIndex]) continue;
    const sparseLabel = source.values[pixelIndex]!;
    if (sparseLabel === 0) {
      validity[pixelIndex] = 1;
      continue;
    }
    const denseLabel = roots.get(sparseLabel);
    if (denseLabel === undefined || denseLabel > capacity) continue;
    values[pixelIndex] = denseLabel;
    validity[pixelIndex] = 1;
  }
  return {
    values,
    validity,
    requiredCount: roots.size,
    componentCount: Math.min(roots.size, capacity),
    overflow: Number(roots.size > capacity)
  };
}

function makeReferenceHistogram(source: BinarySamples, pixelCount: number): number[] {
  const bins = Array.from({length: HISTOGRAM_BIN_COUNT}, () => 0);
  for (let pixelIndex = 0; pixelIndex < source.values.length; pixelIndex++) {
    if (!source.validity[pixelIndex]) continue;
    const binIndex = Math.min(
      HISTOGRAM_BIN_COUNT - 1,
      Math.floor((source.values[pixelIndex]! / (pixelCount + 1)) * HISTOGRAM_BIN_COUNT)
    );
    bins[binIndex]!++;
  }
  return bins;
}

function populateSampleIslands(
  samples: Float32Array,
  width: number,
  height: number,
  phase: number
): void {
  samples.fill(0.1);
  for (let row = 1 + (phase % 2); row < height - 1; row += 4) {
    for (let column = 1 + phase; column < width - 1; column += 4) {
      samples[row * width + column] = 0.9;
    }
  }
}

function closeBinaryCross(source: BinarySamples, width: number, height: number): BinarySamples {
  return applyBinaryCross(
    applyBinaryCross(source, width, height, 'dilate'),
    width,
    height,
    'erode'
  );
}

function applyBinaryCross(
  source: BinarySamples,
  width: number,
  height: number,
  operation: 'dilate' | 'erode'
): BinarySamples {
  const values = new Uint32Array(source.values.length);
  const validity = Uint32Array.from(source.validity);
  const offsets = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];
  for (let pixelIndex = 0; pixelIndex < values.length; pixelIndex++) {
    if (!validity[pixelIndex]) continue;
    const column = pixelIndex % width;
    const row = Math.floor(pixelIndex / width);
    let result = operation === 'erode' ? 1 : 0;
    for (const [horizontalOffset, verticalOffset] of offsets) {
      const sampleColumn = Math.max(0, Math.min(width - 1, column + horizontalOffset!));
      const sampleRow = Math.max(0, Math.min(height - 1, row + verticalOffset!));
      const sampleIndex = sampleRow * width + sampleColumn;
      if (!source.validity[sampleIndex]) continue;
      const foreground = Number(source.values[sampleIndex] !== 0);
      result = operation === 'erode' ? Math.min(result, foreground) : Math.max(result, foreground);
    }
    values[pixelIndex] = result;
  }
  return {values, validity};
}

function makeInputBuffer(
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  data: Uint32Array | Float32Array
): Buffer {
  const buffer = device.createBuffer({
    id,
    data,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  ownedBuffers.push(buffer);
  return buffer;
}

function makeOutputBuffer(
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
