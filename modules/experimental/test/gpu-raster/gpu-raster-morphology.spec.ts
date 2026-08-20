// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test, {type Test} from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterClosing,
  GPURasterDilation,
  GPURasterErosion,
  GPURasterOpening,
  type GPURasterBinaryMorphologyProps,
  type GPURasterBorderMode,
  type GPURasterBufferBand,
  type GPURasterGrayscaleMorphologyProps,
  type GPURasterMorphologyMode,
  type GPURasterMorphologyNoDataPolicy,
  type GPURasterMorphologyOperation,
  type GPURasterScalarFormat,
  type GPURasterStructuringElement
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type MorphologyFixture = {
  width: number;
  height: number;
  values: Float32Array | Uint32Array | Int32Array;
  format?: GPURasterScalarFormat;
  mode: GPURasterMorphologyMode;
  operation: 'dilate' | 'erode' | 'open' | 'close';
  radius: number;
  structuringElement?: GPURasterStructuringElement;
  borderMode?: GPURasterBorderMode;
  borderValue?: number;
  noDataPolicy?: GPURasterMorphologyNoDataPolicy;
  validity?: Uint32Array;
  noDataValue?: number;
  inputScale?: number;
  inputOffset?: number;
  prefixLength?: number;
};

type MorphologyResult = {
  values: number[];
  validity: number[];
  prefixedValues: number[];
  prefixedValidity: number[];
  stats: ReturnType<GPUCommandGraph['compile']>['stats'];
};

type OracleSource = {
  values: number[];
  validity?: number[];
  noDataValue?: number;
  scale?: number;
  offset?: number;
};

test('GPURaster binary morphology removes islands, fills holes, and distinguishes square/Manhattan footprints', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 7;
  const height = 7;
  const impulse = new Uint32Array(width * height);
  impulse[3 * width + 3] = 9;
  const square = await assertMorphologyMatchesOracle(testCase, device, 'binary-square-radius-two', {
    width,
    height,
    values: impulse,
    mode: 'binary',
    operation: 'dilate',
    radius: 2,
    structuringElement: 'square'
  });
  const cross = await assertMorphologyMatchesOracle(testCase, device, 'binary-cross-radius-two', {
    width,
    height,
    values: impulse,
    mode: 'binary',
    operation: 'dilate',
    radius: 2,
    structuringElement: 'cross'
  });
  testCase.equal(square.values[1 * width + 1], 1, 'square includes radius-two diagonal corners');
  testCase.equal(
    cross.values[1 * width + 1],
    0,
    'Manhattan cross excludes distant diagonal corners'
  );
  testCase.equal(cross.values[2 * width + 2], 1, 'radius-two cross includes Manhattan diagonals');
  testCase.equal(cross.values[3 * width + 3], 1, 'nonzero source flags canonicalize to one');

  const opened = await assertMorphologyMatchesOracle(testCase, device, 'binary-open-island', {
    width,
    height,
    values: impulse,
    mode: 'binary',
    operation: 'open',
    radius: 1
  });
  testCase.ok(
    opened.values.every(value => value === 0),
    'opening removes a single-pixel island'
  );

  const hole = Uint32Array.from(Array.from({length: width * height}, () => 1));
  hole[3 * width + 3] = 0;
  const closed = await assertMorphologyMatchesOracle(testCase, device, 'binary-close-hole', {
    width,
    height,
    values: hole,
    mode: 'binary',
    operation: 'close',
    radius: 1,
    validity: Uint32Array.from(Array.from({length: hole.length}, () => 1))
  });
  testCase.equal(closed.values[3 * width + 3], 1, 'closing fills a valid background hole');

  const checkerboard = Uint32Array.from(
    Array.from(
      {length: width * height},
      (_, index) => ((index % width) + Math.floor(index / width)) % 2
    )
  );
  await assertMorphologyMatchesOracle(testCase, device, 'binary-erode-checkerboard', {
    width,
    height,
    values: checkerboard,
    mode: 'binary',
    operation: 'erode',
    radius: 1,
    structuringElement: 'cross'
  });
  testCase.end();
});

test('GPURaster grayscale extrema preserve signed values and apply native integer calibration exactly once', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const signedRamp = Int32Array.from(
    Array.from({length: 35}, (_, index) => (index % 7) * 4 - Math.floor(index / 7) * 3)
  );
  for (const operation of ['dilate', 'erode'] as const) {
    await assertMorphologyMatchesOracle(testCase, device, `signed-grayscale-${operation}`, {
      width: 7,
      height: 5,
      values: signedRamp,
      format: 'sint32',
      mode: 'grayscale',
      operation,
      radius: 2,
      structuringElement: 'cross',
      borderMode: 'reflect',
      inputScale: 0.5,
      inputOffset: -3
    });
  }

  const unsignedRamp = Uint32Array.from(Array.from({length: 35}, (_, index) => index + 10));
  unsignedRamp[1] = 4294967295;
  for (const operation of ['open', 'close'] as const) {
    const result = await assertMorphologyMatchesOracle(
      testCase,
      device,
      `calibrated-${operation}`,
      {
        width: 7,
        height: 5,
        values: unsignedRamp,
        format: 'uint32',
        mode: 'grayscale',
        operation,
        radius: 1,
        noDataValue: 4294967295,
        noDataPolicy: 'ignore',
        inputScale: 0.5,
        inputOffset: 7
      }
    );
    testCase.ok(result.values[17] < 30, 'second pass does not recalibrate intermediate extrema');
    testCase.equal(result.validity[1], 0, 'raw integer sentinel remains invalid after both passes');
    testCase.equal(result.stats.logicalTransientBufferCount, 2, 'sample and validity scratch');
    testCase.equal(result.stats.logicalTransientBytes, 35 * 8, 'two packed scalar scratch buffers');
    testCase.deepEqual(
      result.stats.nodeOrder,
      operation === 'open'
        ? [`calibrated-${operation}-erode`, `calibrated-${operation}-dilate`]
        : [`calibrated-${operation}-dilate`, `calibrated-${operation}-erode`],
      'composed morphology exposes both ordered graph passes'
    );
  }
  testCase.end();
});

test('GPURaster morphology honors all borders, constant binary values, and propagate/ignore validity semantics', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const grayscale = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const binary = Uint32Array.from([0, 0, 0, 0, 1, 0, 0, 0, 0]);
  for (const borderMode of ['clamp', 'reflect', 'constant', 'nodata'] as const) {
    await assertMorphologyMatchesOracle(testCase, device, `grayscale-border-${borderMode}`, {
      width: 3,
      height: 3,
      values: grayscale,
      mode: 'grayscale',
      operation: 'erode',
      radius: 1,
      borderMode,
      borderValue: -4,
      noDataPolicy: borderMode === 'nodata' ? 'ignore' : 'propagate'
    });
    await assertMorphologyMatchesOracle(testCase, device, `binary-border-${borderMode}`, {
      width: 3,
      height: 3,
      values: binary,
      mode: 'binary',
      operation: 'dilate',
      radius: 1,
      borderMode,
      borderValue: -0.5,
      noDataPolicy: borderMode === 'nodata' ? 'ignore' : 'propagate'
    });
  }

  const values = Float32Array.from(Array.from({length: 35}, (_, index) => index));
  values[9] = Number.NaN;
  values[22] = Number.POSITIVE_INFINITY;
  const validity = Uint32Array.from(Array.from({length: values.length}, () => 1));
  validity[18] = 0;
  for (const noDataPolicy of ['propagate', 'ignore'] as const) {
    const result = await assertMorphologyMatchesOracle(
      testCase,
      device,
      `invalid-${noDataPolicy}`,
      {
        width: 7,
        height: 5,
        values,
        mode: 'grayscale',
        operation: 'dilate',
        radius: 1,
        validity,
        noDataPolicy
      }
    );
    for (const index of [9, 18, 22]) {
      testCase.equal(
        result.validity[index],
        0,
        `${noDataPolicy} preserves invalid center ${index}`
      );
      testCase.ok(Number.isNaN(result.values[index]), `${noDataPolicy} publishes canonical NaN`);
    }
    testCase.equal(
      result.validity[10],
      noDataPolicy === 'ignore' ? 1 : 0,
      'neighbor invalidity follows the explicit policy'
    );
  }

  const rawBinary = Uint32Array.from([0, 4, 4294967295, 0, 1, 0, 0, 0, 3]);
  const rawValidity = Uint32Array.from([1, 1, 1, 1, 1, 0, 1, 1, 1]);
  const binaryResult = await assertMorphologyMatchesOracle(testCase, device, 'binary-raw-nodata', {
    width: 3,
    height: 3,
    values: rawBinary,
    mode: 'binary',
    operation: 'dilate',
    radius: 1,
    noDataValue: 4294967295,
    validity: rawValidity,
    noDataPolicy: 'ignore',
    prefixLength: 1
  });
  testCase.equal(binaryResult.values[2], 0, 'raw uint32 sentinel publishes canonical invalid zero');
  testCase.equal(
    binaryResult.validity[2],
    0,
    'raw sentinel rejected before binary canonicalization'
  );
  testCase.equal(binaryResult.values[5], 0, 'invalid explicit mask publishes canonical zero');
  testCase.equal(binaryResult.validity[5], 0, 'separate validity masks preserve unknown pixels');
  testCase.equal(binaryResult.prefixedValues[0], 0, 'binary output view leaves prefix untouched');
  testCase.equal(binaryResult.prefixedValidity[0], 0, 'validity view leaves prefix untouched');

  const completelyInvalid = await assertMorphologyMatchesOracle(
    testCase,
    device,
    'all-invalid-ignore',
    {
      width: 1,
      height: 1,
      values: Float32Array.from([Number.NaN]),
      mode: 'grayscale',
      operation: 'erode',
      radius: 2,
      borderMode: 'nodata',
      noDataPolicy: 'ignore'
    }
  );
  testCase.equal(completelyInvalid.validity[0], 0, 'all-invalid neighborhoods remain invalid');
  testCase.end();
});

test('GPURaster radius-zero composites are scratch-free calibrated/binary identity passes', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const grayscale = await assertMorphologyMatchesOracle(testCase, device, 'identity-opening', {
    width: 3,
    height: 2,
    values: Int32Array.from([-2, 0, 2, 4, -2147483648, 8]),
    format: 'sint32',
    mode: 'grayscale',
    operation: 'open',
    radius: 0,
    noDataValue: -2147483648,
    inputScale: 0.5,
    inputOffset: 4,
    prefixLength: 1
  });
  testCase.deepEqual(
    grayscale.stats.nodeOrder,
    ['identity-opening'],
    'opening contributes one pass'
  );
  testCase.equal(grayscale.stats.logicalTransientBufferCount, 0, 'opening allocates no scratch');
  testCase.equal(grayscale.values[0], 3, 'source calibration is applied once');
  testCase.equal(grayscale.prefixedValues[0], 0, 'grayscale output prefix remains untouched');

  const binary = await assertMorphologyMatchesOracle(testCase, device, 'identity-closing', {
    width: 3,
    height: 2,
    values: Uint32Array.from([0, 2, 7, 0, 1, 9]),
    mode: 'binary',
    operation: 'close',
    radius: 0,
    validity: Uint32Array.from([1, 1, 0, 1, 1, 1])
  });
  testCase.deepEqual(binary.stats.nodeOrder, ['identity-closing'], 'closing contributes one pass');
  testCase.equal(binary.stats.logicalTransientBufferCount, 0, 'closing allocates no scratch');
  testCase.deepEqual(
    binary.values,
    [0, 1, 0, 0, 1, 1],
    'identity canonicalizes valid binary flags'
  );
  testCase.end();
});

test('GPURaster chained opening/closing reuse scratch and preserve repeatable borrowed ownership', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 5;
  const height = 5;
  const pixelCount = width * height;
  const graph = new GPUCommandGraph(device, {id: 'morphology-scratch-reuse'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from(Array.from({length: pixelCount}, (_, index) => index % width))
  );
  const openingBuffer = makeOutputBuffer(device, pixelCount);
  const openingValidityBuffer = makeOutputBuffer(device, pixelCount);
  const closingBuffer = makeOutputBuffer(device, pixelCount);
  const closingValidityBuffer = makeOutputBuffer(device, pixelCount);
  const openingValues = importView(graph, 'opening-values', openingBuffer, 'float32', pixelCount);
  const openingValidity = importView(
    graph,
    'opening-validity',
    openingValidityBuffer,
    'uint32',
    pixelCount
  );
  new GPURasterOpening({
    id: 'opening',
    width,
    height,
    radius: 1,
    input: {
      id: 'source',
      format: 'float32',
      storage: {
        kind: 'buffer',
        values: importView(graph, 'source', sourceBuffer, 'float32', pixelCount)
      }
    },
    output: openingValues,
    outputValidity: openingValidity
  }).addToGraph(graph);
  new GPURasterClosing({
    id: 'closing',
    width,
    height,
    radius: 1,
    input: {
      id: 'opening-output',
      format: 'float32',
      storage: {kind: 'buffer', values: openingValues},
      validity: openingValidity
    },
    output: importView(graph, 'closing-values', closingBuffer, 'float32', pixelCount),
    outputValidity: importView(
      graph,
      'closing-validity',
      closingValidityBuffer,
      'uint32',
      pixelCount
    )
  }).addToGraph(graph);

  const compiled = graph.compile();
  testCase.deepEqual(
    compiled.stats.nodeOrder,
    ['opening-erode', 'opening-dilate', 'closing-dilate', 'closing-erode'],
    'graph exposes four correctly ordered morphological passes'
  );
  testCase.equal(
    compiled.stats.logicalTransientBufferCount,
    4,
    'two logical scratch buffers per pair'
  );
  testCase.equal(
    compiled.stats.physicalTransientBufferCount,
    2,
    'nonoverlapping pairs reuse storage'
  );
  testCase.equal(
    compiled.stats.reusedTransientBytes,
    pixelCount * 8,
    'reuse avoids duplicate allocations'
  );
  submitGraph(device, compiled, 'first-morphology-encoding');
  const initial = await readFloat32(closingBuffer, pixelCount);
  testCase.ok(
    initial.some(value => value !== initial[0]),
    'first scene remains nonconstant'
  );

  sourceBuffer.write(Float32Array.from(Array.from({length: pixelCount}, () => 11)));
  submitGraph(device, compiled, 'second-morphology-encoding');
  const updated = await readFloat32(closingBuffer, pixelCount);
  testCase.ok(
    updated.every(value => value === 11),
    'compiled graph recomputes replacement scene'
  );

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    openingBuffer,
    openingValidityBuffer,
    closingBuffer,
    closingValidityBuffer
  ]) {
    testCase.notOk(buffer.destroyed, 'compiled graph never destroys caller-owned buffers');
    buffer.destroy();
  }
  testCase.end();
});

async function assertMorphologyMatchesOracle(
  testCase: Test,
  device: Device,
  id: string,
  fixture: MorphologyFixture
): Promise<MorphologyResult> {
  const result = await executeMorphology(device, id, fixture);
  const expected = calculateMorphologyOracle(fixture);
  testCase.deepEqual(result.validity, expected.validity, `${id}: validity matches CPU morphology`);
  for (const [index, expectedValue] of expected.values.entries()) {
    if (Number.isNaN(expectedValue)) {
      testCase.ok(
        Number.isNaN(result.values[index]),
        `${id}: invalid pixel ${index} publishes NaN`
      );
    } else {
      testCase.ok(
        Math.abs(result.values[index] - expectedValue) <= 0.00003,
        `${id}: pixel ${index} matches CPU (${result.values[index]} versus ${expectedValue})`
      );
    }
  }
  return result;
}

async function executeMorphology(
  device: Device,
  id: string,
  fixture: MorphologyFixture
): Promise<MorphologyResult> {
  const pixelCount = fixture.width * fixture.height;
  const prefixLength = fixture.prefixLength ?? 0;
  const byteOffset = prefixLength * Float32Array.BYTES_PER_ELEMENT;
  const graph = new GPUCommandGraph(device, {id});
  const sourceBuffer = makeInputBuffer(device, makePrefixedValues(fixture.values, prefixLength));
  const sourceValidityBuffer = fixture.validity
    ? makeInputBuffer(device, makePrefixedValues(fixture.validity, prefixLength))
    : undefined;
  const outputBuffer = makeOutputBuffer(device, pixelCount + prefixLength);
  const outputValidityBuffer = makeOutputBuffer(device, pixelCount + prefixLength);
  const common = {
    id,
    width: fixture.width,
    height: fixture.height,
    radius: fixture.radius,
    structuringElement: fixture.structuringElement,
    borderMode: fixture.borderMode,
    borderValue: fixture.borderValue,
    noDataPolicy: fixture.noDataPolicy,
    outputValidity: importView(
      graph,
      `${id}-output-validity`,
      outputValidityBuffer,
      'uint32',
      pixelCount,
      byteOffset
    )
  };
  const sourceValidity = sourceValidityBuffer
    ? importView(
        graph,
        `${id}-source-validity`,
        sourceValidityBuffer,
        'uint32',
        pixelCount,
        byteOffset
      )
    : undefined;

  if (fixture.mode === 'binary') {
    const input: GPURasterBufferBand<'uint32'> = {
      id: `${id}-input`,
      format: 'uint32',
      storage: {
        kind: 'buffer',
        values: importView(graph, `${id}-source`, sourceBuffer, 'uint32', pixelCount, byteOffset)
      },
      ...(sourceValidity ? {validity: sourceValidity} : {}),
      ...(fixture.noDataValue !== undefined ? {noDataValue: fixture.noDataValue} : {})
    };
    const props: GPURasterBinaryMorphologyProps = {
      ...common,
      mode: 'binary',
      input,
      output: importView(graph, `${id}-output`, outputBuffer, 'uint32', pixelCount, byteOffset)
    };
    addMorphologyContributor(graph, fixture.operation, props);
  } else {
    const format = fixture.format ?? 'float32';
    const input = {
      id: `${id}-input`,
      format,
      storage: {
        kind: 'buffer',
        values: importView(graph, `${id}-source`, sourceBuffer, format, pixelCount, byteOffset)
      },
      ...(sourceValidity ? {validity: sourceValidity} : {}),
      ...(fixture.noDataValue !== undefined ? {noDataValue: fixture.noDataValue} : {}),
      ...(fixture.inputScale !== undefined ? {scale: fixture.inputScale} : {}),
      ...(fixture.inputOffset !== undefined ? {offset: fixture.inputOffset} : {})
    } as GPURasterBufferBand;
    const props: GPURasterGrayscaleMorphologyProps = {
      ...common,
      input,
      output: importView(graph, `${id}-output`, outputBuffer, 'float32', pixelCount, byteOffset)
    };
    addMorphologyContributor(graph, fixture.operation, props);
  }

  const compiled = graph.compile();
  submitGraph(device, compiled, `${id}-encode`);
  const prefixedValues =
    fixture.mode === 'binary'
      ? await readUint32(outputBuffer, pixelCount + prefixLength)
      : await readFloat32(outputBuffer, pixelCount + prefixLength);
  const prefixedValidity = await readUint32(outputValidityBuffer, pixelCount + prefixLength);
  const result = {
    values: prefixedValues.slice(prefixLength),
    validity: prefixedValidity.slice(prefixLength),
    prefixedValues,
    prefixedValidity,
    stats: compiled.stats
  };
  compiled.destroy();
  sourceBuffer.destroy();
  sourceValidityBuffer?.destroy();
  outputBuffer.destroy();
  outputValidityBuffer.destroy();
  return result;
}

function addMorphologyContributor(
  graph: GPUCommandGraph,
  operation: MorphologyFixture['operation'],
  props: GPURasterBinaryMorphologyProps | GPURasterGrayscaleMorphologyProps
): void {
  switch (operation) {
    case 'dilate':
      new GPURasterDilation(props).addToGraph(graph);
      break;
    case 'erode':
      new GPURasterErosion(props).addToGraph(graph);
      break;
    case 'open':
      new GPURasterOpening(props).addToGraph(graph);
      break;
    case 'close':
      new GPURasterClosing(props).addToGraph(graph);
      break;
  }
}

function calculateMorphologyOracle(fixture: MorphologyFixture): {
  values: number[];
  validity: number[];
} {
  const initialSource: OracleSource = {
    values: Array.from(fixture.values),
    validity: fixture.validity ? Array.from(fixture.validity) : undefined,
    noDataValue: fixture.noDataValue,
    scale: fixture.inputScale,
    offset: fixture.inputOffset
  };
  if (fixture.operation === 'dilate' || fixture.operation === 'erode') {
    return calculateMorphologyStage(fixture, initialSource, fixture.operation);
  }
  const firstOperation: GPURasterMorphologyOperation =
    fixture.operation === 'open' ? 'erode' : 'dilate';
  const first = calculateMorphologyStage(fixture, initialSource, firstOperation);
  if (fixture.radius === 0) return first;
  return calculateMorphologyStage(
    fixture,
    {values: first.values, validity: first.validity},
    firstOperation === 'erode' ? 'dilate' : 'erode'
  );
}

function calculateMorphologyStage(
  fixture: MorphologyFixture,
  source: OracleSource,
  operation: GPURasterMorphologyOperation
): {values: number[]; validity: number[]} {
  const values: number[] = [];
  const validity: number[] = [];
  for (let row = 0; row < fixture.height; row++) {
    for (let column = 0; column < fixture.width; column++) {
      let valid = sampleMorphologySource(fixture, source, column, row).valid;
      let extreme = operation === 'dilate' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      let participatingSamples = 0;
      for (let vertical = -fixture.radius; vertical <= fixture.radius; vertical++) {
        for (let horizontal = -fixture.radius; horizontal <= fixture.radius; horizontal++) {
          if (
            fixture.structuringElement === 'cross' &&
            Math.abs(horizontal) + Math.abs(vertical) > fixture.radius
          ) {
            continue;
          }
          const sample = sampleMorphologySource(
            fixture,
            source,
            column + horizontal,
            row + vertical
          );
          if (sample.valid) {
            extreme =
              operation === 'dilate'
                ? Math.max(extreme, sample.value)
                : Math.min(extreme, sample.value);
            participatingSamples++;
          } else if ((fixture.noDataPolicy ?? 'propagate') === 'propagate') {
            valid = false;
          }
        }
      }
      valid = valid && participatingSamples > 0 && Number.isFinite(extreme);
      values.push(valid ? extreme : fixture.mode === 'binary' ? 0 : Number.NaN);
      validity.push(valid ? 1 : 0);
    }
  }
  return {values, validity};
}

function sampleMorphologySource(
  fixture: MorphologyFixture,
  source: OracleSource,
  column: number,
  row: number
): {value: number; valid: boolean} {
  if (column < 0 || column >= fixture.width || row < 0 || row >= fixture.height) {
    switch (fixture.borderMode ?? 'clamp') {
      case 'clamp':
        column = Math.min(Math.max(column, 0), fixture.width - 1);
        row = Math.min(Math.max(row, 0), fixture.height - 1);
        break;
      case 'reflect':
        column = reflectCoordinate(column, fixture.width);
        row = reflectCoordinate(row, fixture.height);
        break;
      case 'constant':
        return {
          value:
            fixture.mode === 'binary'
              ? (fixture.borderValue ?? 0) === 0
                ? 0
                : 1
              : (fixture.borderValue ?? 0),
          valid: true
        };
      case 'nodata':
        return {value: 0, valid: false};
    }
  }
  const index = row * fixture.width + column;
  const rawValue = source.values[index];
  const calibratedValue =
    fixture.mode === 'binary'
      ? rawValue === 0
        ? 0
        : 1
      : rawValue * (source.scale ?? 1) + (source.offset ?? 0);
  return {
    value: calibratedValue,
    valid:
      Number.isFinite(rawValue) &&
      Number.isFinite(calibratedValue) &&
      source.validity?.[index] !== 0 &&
      (source.noDataValue === undefined || rawValue !== source.noDataValue)
  };
}

function reflectCoordinate(coordinate: number, length: number): number {
  if (length <= 1) return 0;
  const period = (length - 1) * 2;
  const reflected = ((coordinate % period) + period) % period;
  return reflected >= length ? period - reflected : reflected;
}

function makePrefixedValues(
  values: Float32Array | Uint32Array | Int32Array,
  prefixLength: number
): Float32Array | Uint32Array | Int32Array {
  const result =
    values instanceof Float32Array
      ? new Float32Array(values.length + prefixLength)
      : values instanceof Uint32Array
        ? new Uint32Array(values.length + prefixLength)
        : new Int32Array(values.length + prefixLength);
  result.set(values, prefixLength);
  return result;
}

function makeInputBuffer(device: Device, values: Float32Array | Uint32Array | Int32Array): Buffer {
  return device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function makeOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  byteOffset = 0
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
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

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
