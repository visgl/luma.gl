// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPUSegmentedSort,
  type CompiledGPUCommandGraph,
  type GraphDataView,
  type GPUSortDirection,
  type GPUSortSegment
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {vi} from 'vitest';
import {addGPUSegmentedSortToGraphWithDispatchLimit} from '../../src/gpu-primitives/gpu-segmented-sort';

const UNSORTED_GAP = 0xcafef00d;
const OUTPUT_GAP = 0xdeadbeef;

test('GPUSegmentedSort stably sorts mixed packed domains and preserves every gap on CORE WebGPU', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.equal(device.limits.maxStorageBuffersPerShaderStage, 8, 'uses the standard CORE storage limit');
  const lengths = [0, 1, 2, 3, 5, 9, 17, 33, 65, 129, 255, 256];

  for (const direction of ['ascending', 'descending'] as const) {
    const fixture = createSegmentedSortFixture(device, lengths, direction);
    const compiled = compileFixture(fixture);

    try {
      encodeFixture(device, compiled);
      const [keys, values, outputKeys, outputValues] = await readFixtureBuffers(fixture);

      t.deepEqual(
        keys,
        Array.from(fixture.keyData),
        `${direction} source key storage is unchanged`
      );
      t.deepEqual(
        values,
        Array.from(fixture.valueData),
        `${direction} source payload storage is unchanged`
      );
      t.deepEqual(
        outputKeys,
        Array.from(fixture.expectedOutputKeys),
        `${direction} sorted keys preserve padding, parent offsets, and every gap`
      );
      t.deepEqual(
        outputValues,
        Array.from(fixture.expectedOutputValues),
        `${direction} equal-key payloads retain independent source order`
      );
      t.deepEqual(
        compiled.stats.nodeOrder,
        [2, 4, 8, 16, 32, 64, 128, 256].map(width => `segmented-sort-bitonic-local-${width}`),
        `${direction} independent domains need only one graph node per workgroup width`
      );
      t.equal(
        compiled.stats.logicalTransientBufferCount,
        0,
        'segment descriptors and workgroup-local sorting allocate no GPU scratch buffers'
      );
    } finally {
      destroyFixture(fixture, compiled);
    }
  }

  t.end();
});

test('GPUSegmentedSort batches many workgroups into one four-binding CORE dispatch', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createSegmentedSortFixture(
    device,
    Array.from({length: 96}, () => 3),
    'ascending'
  );
  const dispatch = vi.spyOn(Computation.prototype, 'dispatch');
  const compiled = compileFixture(fixture);

  try {
    encodeFixture(device, compiled);
    const [, , outputKeys, outputValues] = await readFixtureBuffers(fixture);
    const source = dispatch.mock.instances.at(-1)?.source ?? '';

    t.deepEqual(
      outputKeys,
      Array.from(fixture.expectedOutputKeys),
      'all 96 sort domains are correct'
    );
    t.deepEqual(
      outputValues,
      Array.from(fixture.expectedOutputValues),
      'all 96 domains preserve paired values and stable equal keys'
    );
    t.deepEqual(
      compiled.stats.nodeOrder,
      ['segmented-sort-bitonic-local-4'],
      '96 independent three-row sorts require one graph node'
    );
    t.equal(dispatch.mock.calls.length, 1, 'the graph encodes exactly one GPU dispatch');
    t.deepEqual(dispatch.mock.calls[0].slice(1), [96, 1, 1], 'one workgroup handles each domain');
    t.ok(source.includes('@workgroup_size(4)'), 'only four lanes wake for each three-row domain');
    t.ok(
      source.includes('var<workgroup> cachedKeys: array<u32, 4>'),
      'source keys are cached once in workgroup storage'
    );
    t.equal(
      (source.match(/@group\(0\) @binding\(/g) ?? []).length,
      4,
      'the portable batched shader uses exactly four storage bindings'
    );
  } finally {
    dispatch.mockRestore();
    destroyFixture(fixture, compiled);
  }

  t.end();
});

test('GPUSegmentedSort bounds segment workgroups across all three dispatch dimensions', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createSegmentedSortFixture(device, [3, 3, 3, 3, 3], 'descending');
  const dispatch = vi.spyOn(Computation.prototype, 'dispatch');
  addGPUSegmentedSortToGraphWithDispatchLimit(fixture.sort, fixture.graph, 2);
  const compiled = fixture.graph.compile();

  try {
    encodeFixture(device, compiled);
    const [, , outputKeys, outputValues] = await readFixtureBuffers(fixture);

    t.deepEqual(
      outputKeys,
      Array.from(fixture.expectedOutputKeys),
      'all bounded workgroups sort keys'
    );
    t.deepEqual(
      outputValues,
      Array.from(fixture.expectedOutputValues),
      'out-of-range padded workgroups leave caller-owned gaps untouched'
    );
    t.deepEqual(dispatch.mock.calls[0].slice(1), [2, 2, 2], 'workgroups span all three dimensions');
    t.ok(
      (dispatch.mock.instances.at(-1)?.source ?? '').includes('if (segmentIndex >= SEGMENT_COUNT)'),
      'surplus multidimensional workgroups are rejected before descriptor access'
    );
  } finally {
    dispatch.mockRestore();
    destroyFixture(fixture, compiled);
  }

  t.end();
});

test('GPUSegmentedSort reuses one compiled graph after caller-owned source data changes', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createSegmentedSortFixture(device, [5, 5], 'ascending');
  const compiled = compileFixture(fixture);

  try {
    encodeFixture(device, compiled);
    const firstOutput = await readBuffer(fixture.outputKeysBuffer);
    t.deepEqual(
      firstOutput,
      Array.from(fixture.expectedOutputKeys),
      'initial graph encoding sorts'
    );

    const firstSegment = fixture.segments[0];
    const sourceOffset = fixture.keysPrefix + firstSegment.keysOffset;
    fixture.keyData.set([8, 1, 8, 0xffffffff, 0], sourceOffset);
    fixture.keysBuffer.write(fixture.keyData);
    updateExpectedOutputs(fixture);

    encodeFixture(device, compiled);
    const [, , outputKeys, outputValues] = await readFixtureBuffers(fixture);
    t.deepEqual(
      outputKeys,
      Array.from(fixture.expectedOutputKeys),
      're-encoding sees updated keys'
    );
    t.deepEqual(
      outputValues,
      Array.from(fixture.expectedOutputValues),
      're-encoding preserves stable duplicate payloads'
    );
  } finally {
    destroyFixture(fixture, compiled);
  }

  t.end();
});

type SegmentedSortFixture = {
  device: Device;
  graph: GPUCommandGraph;
  sort: GPUSegmentedSort;
  segments: GPUSortSegment[];
  direction: GPUSortDirection;
  keysPrefix: number;
  valuesPrefix: number;
  outputKeysPrefix: number;
  outputValuesPrefix: number;
  keyData: Uint32Array;
  valueData: Uint32Array;
  expectedOutputKeys: Uint32Array;
  expectedOutputValues: Uint32Array;
  keysBuffer: Buffer;
  valuesBuffer: Buffer;
  outputKeysBuffer: Buffer;
  outputValuesBuffer: Buffer;
};

function createSegmentedSortFixture(
  device: Device,
  lengths: readonly number[],
  direction: GPUSortDirection
): SegmentedSortFixture {
  let keysLength = 2;
  let valuesLength = 3;
  let outputKeysLength = 4;
  let outputValuesLength = 5;
  const segments = lengths.map((length, segmentIndex) => {
    const segment = {
      keysOffset: keysLength,
      valuesOffset: valuesLength,
      outputKeysOffset: outputKeysLength,
      outputValuesOffset: outputValuesLength,
      length
    };
    keysLength += length + 1 + (segmentIndex % 2);
    valuesLength += length + 2 + (segmentIndex % 3);
    outputKeysLength += length + 3 + (segmentIndex % 2);
    outputValuesLength += length + 4 + (segmentIndex % 3);
    return segment;
  });

  const keysPrefix = 67;
  const valuesPrefix = 3;
  const outputKeysPrefix = 70;
  const outputValuesPrefix = 5;
  const keyData = new Uint32Array(keysPrefix + keysLength + 3).fill(UNSORTED_GAP);
  const valueData = new Uint32Array(valuesPrefix + valuesLength + 5).fill(UNSORTED_GAP);
  const expectedOutputKeys = new Uint32Array(outputKeysPrefix + outputKeysLength + 7).fill(
    OUTPUT_GAP
  );
  const expectedOutputValues = new Uint32Array(outputValuesPrefix + outputValuesLength + 9).fill(
    OUTPUT_GAP
  );

  for (const [segmentIndex, segment] of segments.entries()) {
    for (let rowIndex = 0; rowIndex < segment.length; rowIndex++) {
      keyData[keysPrefix + segment.keysOffset + rowIndex] =
        rowIndex % 13 === 0
          ? 0xffffffff
          : rowIndex % 7 === 0
            ? 0
            : (segment.length - rowIndex) % 11;
      valueData[valuesPrefix + segment.valuesOffset + rowIndex] = segmentIndex * 1_000 + rowIndex;
    }
  }

  const graph = new GPUCommandGraph(device, {id: 'segmented-sort-gpu-graph'});
  const keysBuffer = createReadableBuffer(device, 'segmented-sort-keys', keyData);
  const valuesBuffer = createReadableBuffer(device, 'segmented-sort-values', valueData);
  const outputKeysBuffer = createReadableBuffer(
    device,
    'segmented-sort-output-keys',
    expectedOutputKeys
  );
  const outputValuesBuffer = createReadableBuffer(
    device,
    'segmented-sort-output-values',
    expectedOutputValues
  );
  const sort = new GPUSegmentedSort({
    id: 'segmented-sort',
    keys: importView(graph, 'keys', keysBuffer, keysPrefix, keysLength),
    values: importView(graph, 'values', valuesBuffer, valuesPrefix, valuesLength),
    outputKeys: importView(
      graph,
      'output-keys',
      outputKeysBuffer,
      outputKeysPrefix,
      outputKeysLength
    ),
    outputValues: importView(
      graph,
      'output-values',
      outputValuesBuffer,
      outputValuesPrefix,
      outputValuesLength
    ),
    segments,
    direction
  });
  const fixture: SegmentedSortFixture = {
    device,
    graph,
    sort,
    segments,
    direction,
    keysPrefix,
    valuesPrefix,
    outputKeysPrefix,
    outputValuesPrefix,
    keyData,
    valueData,
    expectedOutputKeys,
    expectedOutputValues,
    keysBuffer,
    valuesBuffer,
    outputKeysBuffer,
    outputValuesBuffer
  };
  updateExpectedOutputs(fixture);
  return fixture;
}

function updateExpectedOutputs(fixture: SegmentedSortFixture): void {
  fixture.expectedOutputKeys.fill(OUTPUT_GAP);
  fixture.expectedOutputValues.fill(OUTPUT_GAP);
  for (const segment of fixture.segments) {
    const pairs = Array.from({length: segment.length}, (_, index) => ({
      key: fixture.keyData[fixture.keysPrefix + segment.keysOffset + index],
      value: fixture.valueData[fixture.valuesPrefix + segment.valuesOffset + index],
      index
    }));
    pairs.sort((left, right) => {
      const keyOrder =
        fixture.direction === 'ascending' ? left.key - right.key : right.key - left.key;
      return keyOrder || left.index - right.index;
    });
    for (const [index, pair] of pairs.entries()) {
      fixture.expectedOutputKeys[fixture.outputKeysPrefix + segment.outputKeysOffset + index] =
        pair.key;
      fixture.expectedOutputValues[
        fixture.outputValuesPrefix + segment.outputValuesOffset + index
      ] = pair.value;
    }
  }
}

function createReadableBuffer(device: Device, identifier: string, data: Uint32Array): Buffer {
  return device.createBuffer({
    id: identifier,
    data,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
}

function importView(
  graph: GPUCommandGraph,
  identifier: string,
  buffer: Buffer,
  prefix: number,
  length: number
): GraphDataView<'uint32'> {
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {
    format: 'uint32',
    length,
    byteOffset: prefix * Uint32Array.BYTES_PER_ELEMENT
  });
}

function compileFixture(fixture: SegmentedSortFixture): CompiledGPUCommandGraph {
  fixture.sort.addToGraph(fixture.graph);
  return fixture.graph.compile();
}

function encodeFixture(device: Device, compiled: CompiledGPUCommandGraph): void {
  const commandEncoder = device.createCommandEncoder({id: 'segmented-sort-command-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function readFixtureBuffers(
  fixture: SegmentedSortFixture
): Promise<[number[], number[], number[], number[]]> {
  return Promise.all([
    readBuffer(fixture.keysBuffer),
    readBuffer(fixture.valuesBuffer),
    readBuffer(fixture.outputKeysBuffer),
    readBuffer(fixture.outputValuesBuffer)
  ]);
}

async function readBuffer(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

function destroyFixture(fixture: SegmentedSortFixture, compiled: CompiledGPUCommandGraph): void {
  compiled.destroy();
  for (const buffer of [
    fixture.keysBuffer,
    fixture.valuesBuffer,
    fixture.outputKeysBuffer,
    fixture.outputValuesBuffer
  ]) {
    if (buffer.destroyed) {
      throw new Error('GPUSegmentedSort destroyed a caller-owned imported buffer');
    }
    buffer.destroy();
  }
}
