// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPUScan,
  createTransientView,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  type GPUBoundedDispatchLayout,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUParquetDeltaBinaryPackedDecoder} from './gpu-parquet-delta-binary-packed-decoder';

export const GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE = 256;

export type GPUParquetDeltaByteArrayDecoderProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  prefixMiniBlockDescriptors: GraphDataView<'uint32'>;
  suffixMiniBlockDescriptors: GraphDataView<'uint32'>;
  prefixLengths: GraphDataView<'uint32'>;
  suffixLengths: GraphDataView<'uint32'>;
  valueOffsets: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  encodedByteLength: number;
  suffixDataByteOffset: number;
  suffixDataByteLength: number;
  outputByteCapacity: number;
  valueCount: number;
  prefixDescriptorCount: number;
  suffixDescriptorCount: number;
  firstPrefixLength: number;
  firstSuffixLength: number;
};

/** Reconstructs Parquet DELTA_BYTE_ARRAY values through composable decode and scan stages. */
export class GPUParquetDeltaByteArrayDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetDeltaByteArrayDecoderProps>;

  constructor(props: GPUParquetDeltaByteArrayDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-delta-byte-array';
    this.props = Object.freeze({...props, id: this.id});
    validateProps(this.props);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateOwnership(graph, this.props, this.id);
    if (this.props.valueCount === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    new GPUParquetDeltaBinaryPackedDecoder({
      id: `${this.id}-prefix-lengths`,
      input: this.props.input,
      miniBlockDescriptors: this.props.prefixMiniBlockDescriptors,
      output: this.props.prefixLengths,
      encodedByteLength: this.props.encodedByteLength,
      valueCount: this.props.valueCount,
      descriptorCount: this.props.prefixDescriptorCount,
      firstValue: this.props.firstPrefixLength
    }).addToGraph(graph);
    new GPUParquetDeltaBinaryPackedDecoder({
      id: `${this.id}-suffix-lengths`,
      input: this.props.input,
      miniBlockDescriptors: this.props.suffixMiniBlockDescriptors,
      output: this.props.suffixLengths,
      encodedByteLength: this.props.encodedByteLength,
      valueCount: this.props.valueCount,
      descriptorCount: this.props.suffixDescriptorCount,
      firstValue: this.props.firstSuffixLength
    }).addToGraph(graph);

    const valueLengths = createTransientView(
      graph,
      `${this.id}-value-lengths`,
      'uint32',
      this.props.valueCount
    );
    const suffixOffsets = createTransientView(
      graph,
      `${this.id}-suffix-offsets`,
      'uint32',
      this.props.valueCount
    );
    addLengthPass(graph, this, valueLengths);
    new GPUScan({
      id: `${this.id}-value-offsets`,
      input: valueLengths,
      output: this.props.valueOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-suffix-offsets`,
      input: this.props.suffixLengths,
      output: suffixOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    if (this.props.outputByteCapacity > 0) {
      addReconstructionPass(graph, this, valueLengths, suffixOffsets);
    }
  }
}

export function getGPUParquetDeltaByteArrayReconstructionShaderSource(
  decoder: GPUParquetDeltaByteArrayDecoder,
  valueLengths: GraphDataView<'uint32'>,
  suffixOffsets: GraphDataView<'uint32'>,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  const props = decoder.props;
  return `const VALUE_COUNT: u32 = ${props.valueCount}u;
const ENCODED_BYTE_LENGTH: u32 = ${props.encodedByteLength}u;
const SUFFIX_DATA_BYTE_OFFSET: u32 = ${props.suffixDataByteOffset}u;
const SUFFIX_DATA_BYTE_LENGTH: u32 = ${props.suffixDataByteLength}u;
const OUTPUT_BYTE_CAPACITY: u32 = ${props.outputByteCapacity}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const PREFIX_LENGTH_OFFSET: u32 = ${getViewElementOffset(props.prefixLengths)}u;
const SUFFIX_LENGTH_OFFSET: u32 = ${getViewElementOffset(props.suffixLengths)}u;
const VALUE_LENGTH_OFFSET: u32 = ${getViewElementOffset(valueLengths)}u;
const VALUE_OFFSET_OFFSET: u32 = ${getViewElementOffset(props.valueOffsets)}u;
const SUFFIX_OFFSET_OFFSET: u32 = ${getViewElementOffset(suffixOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;

@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read> prefixLengths: array<u32>;
@group(0) @binding(2) var<storage, read> suffixLengths: array<u32>;
@group(0) @binding(3) var<storage, read> valueLengths: array<u32>;
@group(0) @binding(4) var<storage, read> valueOffsets: array<u32>;
@group(0) @binding(5) var<storage, read> suffixOffsets: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputWords: array<u32>;

fn readInputByte(byteIndex: u32) -> u32 {
  if (byteIndex >= ENCODED_BYTE_LENGTH) { return 0u; }
  let word = inputWords[INPUT_OFFSET + byteIndex / 4u];
  return (word >> ((byteIndex & 3u) * 8u)) & 255u;
}

fn findValueRow(byteIndex: u32) -> u32 {
  var lower = 0u;
  var upper = VALUE_COUNT;
  while (lower < upper) {
    let middle = lower + (upper - lower) / 2u;
    if (valueOffsets[VALUE_OFFSET_OFFSET + middle] <= byteIndex) {
      lower = middle + 1u;
    } else {
      upper = middle;
    }
  }
  return lower - 1u;
}

fn resolveOutputByte(byteIndex: u32, totalByteLength: u32) -> u32 {
  if (byteIndex >= totalByteLength) { return 0u; }
  var row = findValueRow(byteIndex);
  let position = byteIndex - valueOffsets[VALUE_OFFSET_OFFSET + row];
  for (var depth = 0u; depth < VALUE_COUNT; depth++) {
    let prefixLength = prefixLengths[PREFIX_LENGTH_OFFSET + row];
    if (position >= prefixLength) {
      let suffixIndex = position - prefixLength;
      let suffixLength = suffixLengths[SUFFIX_LENGTH_OFFSET + row];
      if (suffixIndex >= suffixLength) { return 0u; }
      let sourceByteIndex = SUFFIX_DATA_BYTE_OFFSET +
        suffixOffsets[SUFFIX_OFFSET_OFFSET + row] + suffixIndex;
      if (sourceByteIndex - SUFFIX_DATA_BYTE_OFFSET >= SUFFIX_DATA_BYTE_LENGTH) { return 0u; }
      return readInputByte(sourceByteIndex);
    }
    if (row == 0u) { return 0u; }
    row -= 1u;
  }
  return 0u;
}

@compute @workgroup_size(${GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE)}
  let outputWordIndex = index;
  let outputByteIndex = outputWordIndex * 4u;
  if (outputByteIndex >= OUTPUT_BYTE_CAPACITY) { return; }
  let finalRow = VALUE_COUNT - 1u;
  let totalByteLength = valueOffsets[VALUE_OFFSET_OFFSET + finalRow] +
    valueLengths[VALUE_LENGTH_OFFSET + finalRow];
  var outputWord = 0u;
  for (var byteInWord = 0u; byteInWord < 4u; byteInWord++) {
    let byteIndex = outputByteIndex + byteInWord;
    if (byteIndex < OUTPUT_BYTE_CAPACITY) {
      outputWord |= resolveOutputByte(byteIndex, totalByteLength) << (byteInWord * 8u);
    }
  }
  outputWords[OUTPUT_OFFSET + outputWordIndex] = outputWord;
}`;
}

function addLengthPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decoder: GPUParquetDeltaByteArrayDecoder,
  valueLengths: GraphDataView<'uint32'>
): void {
  const props = decoder.props;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUParquetDeltaByteArrayDecoder.lengths',
    props.valueCount,
    GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const VALUE_COUNT: u32 = ${props.valueCount}u;
const PREFIX_OFFSET: u32 = ${getViewElementOffset(props.prefixLengths)}u;
const SUFFIX_OFFSET: u32 = ${getViewElementOffset(props.suffixLengths)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(valueLengths)}u;
@group(0) @binding(0) var<storage, read> prefixLengths: array<u32>;
@group(0) @binding(1) var<storage, read> suffixLengths: array<u32>;
@group(0) @binding(2) var<storage, read_write> valueLengths: array<u32>;
@compute @workgroup_size(${GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE)}
  if (index >= VALUE_COUNT) { return; }
  valueLengths[OUTPUT_OFFSET + index] =
    prefixLengths[PREFIX_OFFSET + index] + suffixLengths[SUFFIX_OFFSET + index];
}`;
  addPass(graph, {
    id: `${decoder.id}-value-lengths`,
    operation: 'GPUParquetDeltaByteArrayDecoder.lengths',
    source,
    dispatchLayout,
    length: props.valueCount,
    bindings: [
      ['prefixLengths', props.prefixLengths, 'storage-read'],
      ['suffixLengths', props.suffixLengths, 'storage-read'],
      ['valueLengths', valueLengths, 'storage-write']
    ]
  });
}

function addReconstructionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decoder: GPUParquetDeltaByteArrayDecoder,
  valueLengths: GraphDataView<'uint32'>,
  suffixOffsets: GraphDataView<'uint32'>
): void {
  const wordCount = Math.ceil(decoder.props.outputByteCapacity / 4);
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUParquetDeltaByteArrayDecoder.reconstruct',
    wordCount,
    GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = getGPUParquetDeltaByteArrayReconstructionShaderSource(
    decoder,
    valueLengths,
    suffixOffsets,
    dispatchLayout
  );
  addPass(graph, {
    id: `${decoder.id}-reconstruct`,
    operation: 'GPUParquetDeltaByteArrayDecoder.reconstruct',
    source,
    dispatchLayout,
    length: wordCount,
    bindings: [
      ['inputWords', decoder.props.input, 'storage-read'],
      ['prefixLengths', decoder.props.prefixLengths, 'storage-read'],
      ['suffixLengths', decoder.props.suffixLengths, 'storage-read'],
      ['valueLengths', valueLengths, 'storage-read'],
      ['valueOffsets', decoder.props.valueOffsets, 'storage-read'],
      ['suffixOffsets', suffixOffsets, 'storage-read'],
      ['outputWords', decoder.props.output, 'storage-write']
    ]
  });
}

type PassBinding = readonly [
  name: string,
  view: GraphDataView<'uint32'>,
  usage: 'storage-read' | 'storage-write'
];

function addPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    operation: string;
    source: string;
    dispatchLayout: GPUBoundedDispatchLayout;
    length: number;
    bindings: PassBinding[];
  }
): void {
  const workgroupCount = Math.ceil(props.length / GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE);
  graph.addComputePass({
    id: props.id,
    workload: {
      operation: props.operation,
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE,
      readByteLength: props.bindings
        .filter(binding => binding[2] === 'storage-read')
        .reduce((sum, binding) => sum + binding[1].length * 4, 0),
      writeByteLength: props.bindings
        .filter(binding => binding[2] === 'storage-write')
        .reduce((sum, binding) => sum + binding[1].length * 4, 0)
    },
    resources: props.bindings.map(binding => ({buffer: binding[1], usage: binding[2]})),
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: props.bindings.map((binding, location) => ({
            name: binding[0],
            type: binding[2] === 'storage-read' ? 'read-only-storage' : 'storage',
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const binding of props.bindings) {
            bindings[binding[0]] = getViewBinding(binding[1], getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            props.dispatchLayout.x,
            props.dispatchLayout.y,
            props.dispatchLayout.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateProps(props: Readonly<GPUParquetDeltaByteArrayDecoderProps>): void {
  for (const [name, view] of Object.entries({
    input: props.input,
    prefixMiniBlockDescriptors: props.prefixMiniBlockDescriptors,
    suffixMiniBlockDescriptors: props.suffixMiniBlockDescriptors,
    prefixLengths: props.prefixLengths,
    suffixLengths: props.suffixLengths,
    valueOffsets: props.valueOffsets,
    output: props.output
  })) {
    validatePackedUint32View(view, `${props.id} ${name}`);
  }
  for (const [name, value] of Object.entries({
    encodedByteLength: props.encodedByteLength,
    suffixDataByteOffset: props.suffixDataByteOffset,
    suffixDataByteLength: props.suffixDataByteLength,
    outputByteCapacity: props.outputByteCapacity,
    valueCount: props.valueCount,
    prefixDescriptorCount: props.prefixDescriptorCount,
    suffixDescriptorCount: props.suffixDescriptorCount
  })) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error(`${props.id} ${name} must be a non-negative uint32`);
    }
  }
  if (props.valueCount === 0) {
    throw new Error(`${props.id} valueCount must be positive`);
  }
  if (props.input.length * 4 < props.encodedByteLength) {
    throw new Error(`${props.id} input is shorter than encodedByteLength`);
  }
  if (props.suffixDataByteOffset + props.suffixDataByteLength > props.encodedByteLength) {
    throw new Error(`${props.id} suffix data exceeds encodedByteLength`);
  }
  for (const [name, view] of Object.entries({
    prefixLengths: props.prefixLengths,
    suffixLengths: props.suffixLengths,
    valueOffsets: props.valueOffsets
  })) {
    if (view.length < props.valueCount) {
      throw new Error(`${props.id} ${name} is shorter than valueCount`);
    }
  }
  if (props.output.length * 4 < props.outputByteCapacity) {
    throw new Error(`${props.id} output is shorter than outputByteCapacity`);
  }
  const writableBuffers = [
    props.prefixLengths.buffer,
    props.suffixLengths.buffer,
    props.valueOffsets.buffer,
    props.output.buffer
  ];
  if (new Set(writableBuffers).size !== writableBuffers.length) {
    throw new Error(`${props.id} writable views must use separate buffers`);
  }
  if (writableBuffers.includes(props.input.buffer)) {
    throw new Error(`${props.id} input and writable views must use separate buffers`);
  }
}

function validateOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUParquetDeltaByteArrayDecoderProps>,
  id: string
): void {
  for (const view of [
    props.input,
    props.prefixMiniBlockDescriptors,
    props.suffixMiniBlockDescriptors,
    props.prefixLengths,
    props.suffixLengths,
    props.valueOffsets,
    props.output
  ]) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${id} views must belong to the target GPUCommandGraph`);
    }
  }
}

function validateDevice(device: Device, id: string): void {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_DELTA_BYTE_ARRAY_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
