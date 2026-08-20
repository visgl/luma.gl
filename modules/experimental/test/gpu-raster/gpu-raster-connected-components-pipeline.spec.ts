// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterClosing,
  GPURasterConnectedComponents,
  GPURasterHistogram,
  GPURasterThreshold,
  type GPURasterBufferBand,
  type GPURasterConnectivity
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from '../../../../test/utils/vitest-tape';

type ComponentFixture = {
  id: string;
  width: number;
  height: number;
  values: Uint32Array;
  validity: Uint32Array;
  connectivity: GPURasterConnectivity;
  maximumIterations: number;
  noDataValue?: number;
};

type ComponentResult = {
  labels: number[];
  validity: number[];
  converged: number;
  iterations: number;
  histogram: number[];
};

type OwnedComponentGraph = {
  graph: GPUCommandGraph;
  ownedBuffers: Buffer[];
  values: Buffer;
  sourceValidity: Buffer;
  labels: Buffer;
  outputValidity: Buffer;
  converged: Buffer;
  iterations: Buffer;
  histogram: Buffer;
};

type BinarySamples = {
  values: Uint32Array;
  validity: Uint32Array;
};

const GUARD_VALUE = 4000000001;

test('GPURaster connected components preserve exact 4/8 connectivity, sparse roots, and independent nodata', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 9;
  const height = 9;
  const values = Uint32Array.from(
    Array.from({length: width * height}, (_, pixelIndex) =>
      ((pixelIndex % width) + Math.floor(pixelIndex / width)) % 2 === 0 ? 7 : 0
    )
  );
  const validity = Uint32Array.from(Array.from({length: width * height}, () => 1));
  values[20] = 0xffffffff;
  validity[40] = 0;

  for (const connectivity of [4, 8] as const) {
    const result = await runDirectComponents(device, {
      id: `checkerboard-${connectivity}`,
      width,
      height,
      values,
      validity,
      connectivity,
      maximumIterations: 24,
      noDataValue: 0xffffffff
    });
    const expected = makeReferenceComponents({
      width,
      height,
      values,
      validity,
      connectivity,
      noDataValue: 0xffffffff
    });

    testCase.deepEqual(
      result.labels,
      Array.from(expected.values),
      `${connectivity}-connected foreground uses its minimum row-major representative plus one`
    );
    testCase.deepEqual(
      result.validity,
      Array.from(expected.validity),
      'valid background remains distinct from missing masks and exact unsigned nodata'
    );
    testCase.equal(result.converged, 1, 'bounded GPU rounds publish a converged scalar');
    testCase.ok(result.iterations > 0, 'the actual GPU iteration count is caller-visible');
    testCase.ok(result.iterations <= 24, 'published iterations never exceed the explicit budget');

    const foregroundLabels = new Set(result.labels.filter(label => label !== 0));
    if (connectivity === 4) {
      testCase.ok(
        foregroundLabels.size > 20,
        'diagonally adjacent checkerboard observations remain separate under four connectivity'
      );
    } else {
      testCase.equal(
        foregroundLabels.size,
        1,
        'diagonal neighbors form one deterministic region under eight connectivity'
      );
    }
    testCase.equal(result.validity[20], 0, 'native uint32 nodata remains invalid');
    testCase.equal(result.validity[40], 0, 'an independently masked observation remains invalid');
    testCase.equal(result.labels[1], 0, 'known background keeps its zero label');
    testCase.equal(result.validity[1], 1, 'known background remains analytically valid');
  }

  testCase.end();
});

test('GPURaster threshold, binary closing, and deterministic component roots re-encode as one GPU pipeline', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 13;
  const height = 9;
  const pixelCount = width * height;
  const samples = Float32Array.from(
    Array.from({length: pixelCount}, (_, pixelIndex) => {
      const column = pixelIndex % width;
      const row = Math.floor(pixelIndex / width);
      return ((column * 7 + row * 11) % 17) / 16;
    })
  );
  const validity = Uint32Array.from(
    Array.from({length: pixelCount}, (_, pixelIndex) => {
      const column = pixelIndex % width;
      const row = Math.floor(pixelIndex / width);
      return Number(!(column === 6 && row >= 1 && row <= 7));
    })
  );
  const graph = new GPUCommandGraph(device, {id: 'threshold-morphology-components'});
  const ownedBuffers: Buffer[] = [];
  const sampleBuffer = makeInputBuffer(device, ownedBuffers, 'source-values', samples);
  const sourceValidityBuffer = makeInputBuffer(device, ownedBuffers, 'source-validity', validity);
  const thresholdBuffer = makeOutputBuffer(device, ownedBuffers, 'threshold-mask', pixelCount);
  const morphologyBuffer = makeOutputBuffer(device, ownedBuffers, 'closed-mask', pixelCount);
  const morphologyValidityBuffer = makeOutputBuffer(
    device,
    ownedBuffers,
    'closed-validity',
    pixelCount
  );
  const labelsBuffer = makeOutputBuffer(device, ownedBuffers, 'component-labels', pixelCount, 2);
  const outputValidityBuffer = makeOutputBuffer(
    device,
    ownedBuffers,
    'component-validity',
    pixelCount,
    1
  );
  const convergenceBuffer = makeOutputBuffer(device, ownedBuffers, 'component-converged', 1, 1);
  const iterationBuffer = makeOutputBuffer(device, ownedBuffers, 'component-iterations', 1, 2);

  const sourceValidity = importView(graph, sourceValidityBuffer, 'uint32', pixelCount);
  const source: GPURasterBufferBand<'float32'> = {
    id: 'synthetic-continuous-source',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, sampleBuffer, 'float32', pixelCount)},
    validity: sourceValidity
  };
  const threshold = importView(graph, thresholdBuffer, 'uint32', pixelCount);
  new GPURasterThreshold({
    id: 'classify-foreground',
    width,
    height,
    input: source,
    output: threshold,
    threshold: 0.5
  }).addToGraph(graph);

  const closedMask = importView(graph, morphologyBuffer, 'uint32', pixelCount);
  const closedValidity = importView(graph, morphologyValidityBuffer, 'uint32', pixelCount);
  new GPURasterClosing({
    id: 'close-classified-foreground',
    width,
    height,
    mode: 'binary',
    radius: 1,
    structuringElement: 'cross',
    borderMode: 'clamp',
    noDataPolicy: 'ignore',
    input: {
      id: 'threshold-foreground',
      format: 'uint32',
      storage: {kind: 'buffer', values: threshold},
      validity: sourceValidity
    },
    output: closedMask,
    outputValidity: closedValidity
  }).addToGraph(graph);

  new GPURasterConnectedComponents({
    id: 'classify-connected-regions',
    width,
    height,
    connectivity: 8,
    maximumIterations: 32,
    input: {
      id: 'closed-foreground',
      format: 'uint32',
      storage: {kind: 'buffer', values: closedMask},
      validity: closedValidity
    },
    output: importView(graph, labelsBuffer, 'uint32', pixelCount, 2),
    outputValidity: importView(graph, outputValidityBuffer, 'uint32', pixelCount, 1),
    converged: importView(graph, convergenceBuffer, 'uint32', 1, 1),
    iterationCount: importView(graph, iterationBuffer, 'uint32', 1, 2)
  }).addToGraph(graph);

  const compiled = graph.compile();
  for (let encodingIndex = 0; encodingIndex < 2; encodingIndex++) {
    if (encodingIndex === 1) {
      for (let pixelIndex = 0; pixelIndex < samples.length; pixelIndex++) {
        const column = pixelIndex % width;
        const row = Math.floor(pixelIndex / width);
        samples[pixelIndex] = ((column * 3 + row * 5) % 13) / 12;
      }
      sampleBuffer.write(samples);
    }

    submitGraph(device, compiled, `threshold-morphology-components-${encodingIndex}`);
    const thresholdReference = Uint32Array.from(
      Array.from(samples, (sample, pixelIndex) =>
        Number(validity[pixelIndex] !== 0 && sample >= 0.5)
      )
    );
    const closedReference = closeBinaryCross({values: thresholdReference, validity}, width, height);
    const expected = makeReferenceComponents({
      width,
      height,
      values: closedReference.values,
      validity: closedReference.validity,
      connectivity: 8
    });

    testCase.deepEqual(
      await readLogical(labelsBuffer, pixelCount, 2),
      Array.from(expected.values),
      'threshold and two-pass binary closing feed deterministic sparse GPU component labels'
    );
    testCase.deepEqual(
      await readLogical(outputValidityBuffer, pixelCount, 1),
      Array.from(expected.validity),
      'nodata barriers survive thresholding, binary closing, and component output'
    );
    testCase.equal(
      (await readLogical(convergenceBuffer, 1, 1))[0],
      1,
      'each graph re-encoding resets and republishes true convergence'
    );
    testCase.ok(
      (await readLogical(iterationBuffer, 1, 2))[0]! > 0,
      'actual GPU convergence work is published on each execution'
    );
    testCase.deepEqual(
      (await readUnsigned(labelsBuffer)).slice(0, 2),
      [GUARD_VALUE, GUARD_VALUE],
      'offset-backed output preserves caller-owned prefix guards'
    );
  }

  compiled.destroy();
  for (const buffer of ownedBuffers) {
    testCase.notOk(buffer.destroyed, 'graph teardown preserves borrowed application buffers');
    buffer.destroy();
  }
  testCase.end();
});

test('GPURaster insufficient component rounds clear all dependent labels, validity, and histogram bins', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 129;
  const height = 1;
  const values = Uint32Array.from(Array.from({length: width}, () => 1));
  const validity = Uint32Array.from(Array.from({length: width}, () => 1));
  validity[64] = 0;

  const unresolved = await runDirectComponents(device, {
    id: 'insufficient-round-budget',
    width,
    height,
    values,
    validity,
    connectivity: 4,
    maximumIterations: 1
  });
  testCase.equal(unresolved.converged, 0, 'one union round cannot prove final convergence');
  testCase.equal(unresolved.iterations, 1, 'the exhausted fixed iteration budget is explicit');
  testCase.ok(
    unresolved.labels.every(label => label === 0),
    'a nonconverged graph publishes no plausible partial component labels'
  );
  testCase.ok(
    unresolved.validity.every(flag => flag === 0),
    'every dependent observation is invalidated rather than exposing valid-looking background'
  );
  testCase.deepEqual(
    unresolved.histogram,
    [0, 0, 0, 0, 0, 0, 0, 0],
    'downstream histogram work cannot consume incomplete component labels'
  );

  const resolved = await runDirectComponents(device, {
    id: 'sufficient-round-budget',
    width,
    height,
    values,
    validity,
    connectivity: 4,
    maximumIterations: 32
  });
  const expected = makeReferenceComponents({width, height, values, validity, connectivity: 4});
  testCase.equal(resolved.converged, 1, 'a sufficient bounded GPU budget proves convergence');
  testCase.deepEqual(
    resolved.labels,
    Array.from(expected.values),
    'workgroup boundaries retain roots'
  );
  testCase.deepEqual(
    resolved.validity,
    Array.from(expected.validity),
    'the explicit nodata barrier splits the long foreground component'
  );
  testCase.equal(resolved.labels[0], 1, 'the first sparse region uses its row-major root');
  testCase.equal(resolved.labels[65], 66, 'the second sparse region uses its own minimum root');
  testCase.ok(
    resolved.histogram.some(count => count !== 0),
    'dependent distributions become visible only after actual convergence'
  );
  testCase.end();
});

async function runDirectComponents(
  device: Device,
  fixture: ComponentFixture
): Promise<ComponentResult> {
  const state = makeComponentGraph(device, fixture);
  const compiled = state.graph.compile();
  submitGraph(device, compiled, `submit-${fixture.id}`);

  const pixelCount = fixture.width * fixture.height;
  const result: ComponentResult = {
    labels: await readLogical(state.labels, pixelCount, 1),
    validity: await readLogical(state.outputValidity, pixelCount, 2),
    converged: (await readLogical(state.converged, 1, 1))[0]!,
    iterations: (await readLogical(state.iterations, 1, 1))[0]!,
    histogram: await readLogical(state.histogram, 8, 1)
  };

  compiled.destroy();
  for (const buffer of state.ownedBuffers) buffer.destroy();
  return result;
}

function makeComponentGraph(device: Device, fixture: ComponentFixture): OwnedComponentGraph {
  const graph = new GPUCommandGraph(device, {id: fixture.id});
  const ownedBuffers: Buffer[] = [];
  const pixelCount = fixture.width * fixture.height;
  const values = makeInputBuffer(device, ownedBuffers, `${fixture.id}-values`, fixture.values);
  const sourceValidity = makeInputBuffer(
    device,
    ownedBuffers,
    `${fixture.id}-source-validity`,
    fixture.validity
  );
  const labels = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-labels`, pixelCount, 1);
  const outputValidity = makeOutputBuffer(
    device,
    ownedBuffers,
    `${fixture.id}-output-validity`,
    pixelCount,
    2
  );
  const converged = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-converged`, 1, 1);
  const iterations = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-iterations`, 1, 1);
  const histogram = makeOutputBuffer(device, ownedBuffers, `${fixture.id}-histogram`, 8, 1);

  const input: GPURasterBufferBand<'uint32'> = {
    id: `${fixture.id}-input`,
    format: 'uint32',
    storage: {kind: 'buffer', values: importView(graph, values, 'uint32', pixelCount)},
    validity: importView(graph, sourceValidity, 'uint32', pixelCount),
    ...(fixture.noDataValue === undefined ? {} : {noDataValue: fixture.noDataValue})
  };
  const output = importView(graph, labels, 'uint32', pixelCount, 1);
  const outputMask = importView(graph, outputValidity, 'uint32', pixelCount, 2);
  new GPURasterConnectedComponents({
    id: `${fixture.id}-components`,
    width: fixture.width,
    height: fixture.height,
    input,
    output,
    outputValidity: outputMask,
    converged: importView(graph, converged, 'uint32', 1, 1),
    iterationCount: importView(graph, iterations, 'uint32', 1, 1),
    connectivity: fixture.connectivity,
    maximumIterations: fixture.maximumIterations
  }).addToGraph(graph);

  new GPURasterHistogram({
    id: `${fixture.id}-convergence-gated-distribution`,
    input: {
      id: `${fixture.id}-published-labels`,
      format: 'uint32',
      storage: {kind: 'buffer', values: output},
      validity: outputMask
    },
    output: importView(graph, histogram, 'uint32', 8, 1),
    domain: [0, pixelCount + 1]
  }).addToGraph(graph);

  return {
    graph,
    ownedBuffers,
    values,
    sourceValidity,
    labels,
    outputValidity,
    converged,
    iterations,
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
  const validity = new Uint32Array(pixelCount);
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

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
    validity[pixelIndex] = Number(
      fixture.validity[pixelIndex] !== 0 && fixture.values[pixelIndex] !== fixture.noDataValue
    );
  }

  for (let seed = 0; seed < pixelCount; seed++) {
    if (visited[seed] || !validity[seed] || fixture.values[seed] === 0) continue;
    const region: number[] = [];
    const pending = [seed];
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
    if (!source.validity[pixelIndex]) continue;
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
  data: Float32Array | Uint32Array
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
  const initialValues = new Uint32Array(prefixLength + length + 1);
  initialValues.fill(GUARD_VALUE);
  return makeInputBuffer(device, ownedBuffers, id, initialValues);
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
