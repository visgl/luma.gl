// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  type GPUBoundedDispatchLayout,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {PARQUET_RLE_RUN_DESCRIPTOR_WORDS} from './parquet-rle-bit-packed';

/** Number of decoded values produced by one WebGPU workgroup. */
export const GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE = 256;

/** Construction properties for one Parquet RLE/bit-packed hybrid decoder. */
export type GPUParquetRleBitPackedDecoderProps = {
  id?: string;
  /** Original hybrid stream bytes, including run headers, packed into uint32 words. */
  input: GraphDataView<'uint32'>;
  /** CPU-parsed run descriptors from `parseParquetRleBitPackedRunPlan`. */
  runDescriptors: GraphDataView<'uint32'>;
  /** One decoded uint32 per value. */
  output: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  runCount: number;
  bitWidth: number;
};

/** Decodes one hybrid stream using CPU-parsed run control data and GPU-parallel value extraction. */
export class GPUParquetRleBitPackedDecoder {
  readonly id: string;
  readonly input: GraphDataView<'uint32'>;
  readonly runDescriptors: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly encodedByteLength: number;
  readonly valueCount: number;
  readonly runCount: number;
  readonly bitWidth: number;

  constructor(props: GPUParquetRleBitPackedDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-rle-bit-packed';
    this.input = props.input;
    this.runDescriptors = props.runDescriptors;
    this.output = props.output;
    this.encodedByteLength = props.encodedByteLength;
    this.valueCount = props.valueCount;
    this.runCount = props.runCount;
    this.bitWidth = props.bitWidth;

    validateConfiguration(this);
  }

  /** Adds one hybrid decode node without compiling, submitting, or reading data back. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateGraphOwnership(graph, this.input, `${this.id} input`);
    validateGraphOwnership(graph, this.runDescriptors, `${this.id} runDescriptors`);
    validateGraphOwnership(graph, this.output, `${this.id} output`);
    if (this.valueCount === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUParquetRleBitPackedDecoder',
      this.valueCount,
      GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addDecodePass(graph, this, dispatchLayout);
  }
}

/** Returns the WGSL used to expand hybrid RLE and bit-packed runs. @internal */
export function getGPUParquetRleBitPackedShaderSource(
  decoder: GPUParquetRleBitPackedDecoder,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  const valueMask = decoder.bitWidth === 32 ? 0xffffffff : 2 ** decoder.bitWidth - 1;
  return `const ENCODED_BYTE_LENGTH: u32 = ${decoder.encodedByteLength}u;
const VALUE_COUNT: u32 = ${decoder.valueCount}u;
const RUN_COUNT: u32 = ${decoder.runCount}u;
const BIT_WIDTH: u32 = ${decoder.bitWidth}u;
const VALUE_MASK: u32 = ${valueMask}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(decoder.input)}u;
const DESCRIPTOR_OFFSET: u32 = ${getViewElementOffset(decoder.runDescriptors)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(decoder.output)}u;

@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read> descriptors: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<u32>;

fn readEncodedByte(encodedByteIndex: u32) -> u32 {
  if (encodedByteIndex >= ENCODED_BYTE_LENGTH) { return 0u; }
  let encodedWord = inputWords[INPUT_OFFSET + encodedByteIndex / 4u];
  return (encodedWord >> ((encodedByteIndex & 3u) * 8u)) & 255u;
}

fn readRunValue(payloadByteOffset: u32) -> u32 {
  var value = 0u;
  let byteCount = (BIT_WIDTH + 7u) / 8u;
  for (var byteIndex = 0u; byteIndex < 4u; byteIndex++) {
    if (byteIndex < byteCount) {
      value |= readEncodedByte(payloadByteOffset + byteIndex) << (byteIndex * 8u);
    }
  }
  return value & VALUE_MASK;
}

fn readBitPackedValue(payloadByteOffset: u32, valueIndexWithinRun: u32) -> u32 {
  let bitOffset = valueIndexWithinRun * BIT_WIDTH;
  let firstByteOffset = payloadByteOffset + bitOffset / 8u;
  let bitShift = bitOffset & 7u;
  var packedValue = 0u;
  for (var byteIndex = 0u; byteIndex < 4u; byteIndex++) {
    packedValue |= readEncodedByte(firstByteOffset + byteIndex) << (byteIndex * 8u);
  }
  var value = packedValue >> bitShift;
  if (bitShift != 0u) {
    value |= readEncodedByte(firstByteOffset + 4u) << (32u - bitShift);
  }
  return value & VALUE_MASK;
}

@compute @workgroup_size(${GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE)}
  let outputIndex = index;
  if (outputIndex >= VALUE_COUNT) { return; }

  var lowerRunIndex = 0u;
  var upperRunIndex = RUN_COUNT;
  while (lowerRunIndex < upperRunIndex) {
    let middleRunIndex = lowerRunIndex + (upperRunIndex - lowerRunIndex) / 2u;
    let runOutputOffset = descriptors[DESCRIPTOR_OFFSET + middleRunIndex * 4u];
    if (runOutputOffset <= outputIndex) {
      lowerRunIndex = middleRunIndex + 1u;
    } else {
      upperRunIndex = middleRunIndex;
    }
  }
  let runIndex = lowerRunIndex - 1u;
  let descriptorIndex = DESCRIPTOR_OFFSET + runIndex * 4u;
  let runOutputOffset = descriptors[descriptorIndex];
  let payloadByteOffset = descriptors[descriptorIndex + 2u];
  let runKind = descriptors[descriptorIndex + 3u];
  let valueIndexWithinRun = outputIndex - runOutputOffset;
  var value = readRunValue(payloadByteOffset);
  if (runKind == 1u) {
    value = readBitPackedValue(payloadByteOffset, valueIndexWithinRun);
  }
  outputValues[OUTPUT_OFFSET + outputIndex] = value;
}`;
}

function addDecodePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decoder: GPUParquetRleBitPackedDecoder,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUParquetRleBitPackedShaderSource(decoder, dispatchLayout);
  graph.addComputePass({
    id: decoder.id,
    workload: {
      operation: 'GPUParquetRleBitPackedDecoder',
      commandCount: 1,
      maximumWorkgroupCount: Math.ceil(
        decoder.valueCount / GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE
      ),
      maximumInvocationCount:
        Math.ceil(decoder.valueCount / GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE) *
        GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE,
      readByteLength:
        decoder.encodedByteLength +
        decoder.runCount * PARQUET_RLE_RUN_DESCRIPTOR_WORDS * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: decoder.valueCount * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: decoder.input, usage: 'storage-read'},
      {buffer: decoder.runDescriptors, usage: 'storage-read'},
      {buffer: decoder.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: decoder.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'descriptors', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputValues', type: 'storage', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputWords: getViewBinding(decoder.input, getBuffer),
            descriptors: getViewBinding(decoder.runDescriptors, getBuffer),
            outputValues: getViewBinding(decoder.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(decoder: GPUParquetRleBitPackedDecoder): void {
  validatePackedUint32View(decoder.input, `${decoder.id} input`);
  validatePackedUint32View(decoder.runDescriptors, `${decoder.id} runDescriptors`);
  validatePackedUint32View(decoder.output, `${decoder.id} output`);
  if (!Number.isSafeInteger(decoder.bitWidth) || decoder.bitWidth < 0 || decoder.bitWidth > 32) {
    throw new Error(`${decoder.id} bitWidth must be an integer from 0 through 32`);
  }
  if (!Number.isSafeInteger(decoder.valueCount) || decoder.valueCount < 0) {
    throw new Error(`${decoder.id} valueCount must be a non-negative integer`);
  }
  if (!Number.isSafeInteger(decoder.runCount) || decoder.runCount < 0) {
    throw new Error(`${decoder.id} runCount must be a non-negative integer`);
  }
  if (decoder.valueCount > 0 && decoder.runCount === 0) {
    throw new Error(`${decoder.id} requires at least one run for non-empty output`);
  }
  if (!Number.isSafeInteger(decoder.encodedByteLength) || decoder.encodedByteLength < 0) {
    throw new Error(`${decoder.id} encodedByteLength must be a non-negative integer`);
  }
  if (decoder.input.length < Math.ceil(decoder.encodedByteLength / 4)) {
    throw new Error(`${decoder.id} input is shorter than encodedByteLength`);
  }
  if (decoder.runDescriptors.length < decoder.runCount * PARQUET_RLE_RUN_DESCRIPTOR_WORDS) {
    throw new Error(`${decoder.id} runDescriptors is shorter than runCount`);
  }
  if (decoder.output.length < decoder.valueCount) {
    throw new Error(`${decoder.id} output is shorter than valueCount`);
  }
  if (
    decoder.output.buffer === decoder.input.buffer ||
    decoder.output.buffer === decoder.runDescriptors.buffer
  ) {
    throw new Error(`${decoder.id} output must use a separate buffer`);
  }
}

function validateGraphOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView,
  name: string
): void {
  if (view.buffer.graph !== graph) {
    throw new Error(`${name} belongs to a different GPUCommandGraph`);
  }
}

function validateDevice(device: Device, id: string): void {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_RLE_BIT_PACKED_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
