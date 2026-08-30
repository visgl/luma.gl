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
import {PARQUET_DELTA_BINARY_PACKED_DESCRIPTOR_WORDS} from './parquet-delta-binary-packed';

export const GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE = 256;

export type GPUParquetDeltaBinaryPackedUnpackerProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  miniBlockDescriptors: GraphDataView<'uint32'>;
  outputDeltas: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  descriptorCount: number;
  firstValue: number;
};

/** Unpacks adjusted INT32 deltas; an inclusive uint32 scan reconstructs final values. */
export class GPUParquetDeltaBinaryPackedUnpacker {
  readonly id: string;
  readonly input: GraphDataView<'uint32'>;
  readonly miniBlockDescriptors: GraphDataView<'uint32'>;
  readonly outputDeltas: GraphDataView<'uint32'>;
  readonly encodedByteLength: number;
  readonly valueCount: number;
  readonly descriptorCount: number;
  readonly firstValue: number;

  constructor(props: GPUParquetDeltaBinaryPackedUnpackerProps) {
    this.id = props.id ?? 'gpu-parquet-delta-binary-packed-unpack';
    this.input = props.input;
    this.miniBlockDescriptors = props.miniBlockDescriptors;
    this.outputDeltas = props.outputDeltas;
    this.encodedByteLength = props.encodedByteLength;
    this.valueCount = props.valueCount;
    this.descriptorCount = props.descriptorCount;
    this.firstValue = props.firstValue;
    validateConfiguration(this);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateOwnership(graph, this.input, `${this.id} input`);
    validateOwnership(graph, this.miniBlockDescriptors, `${this.id} miniBlockDescriptors`);
    validateOwnership(graph, this.outputDeltas, `${this.id} outputDeltas`);
    validateDevice(graph.device, this.id);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUParquetDeltaBinaryPackedUnpacker',
      this.valueCount,
      GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addUnpackPass(graph, this, dispatchLayout);
  }
}

export function getGPUParquetDeltaBinaryPackedShaderSource(
  unpacker: GPUParquetDeltaBinaryPackedUnpacker,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  return `const ENCODED_BYTE_LENGTH: u32 = ${unpacker.encodedByteLength}u;
const VALUE_COUNT: u32 = ${unpacker.valueCount}u;
const DESCRIPTOR_COUNT: u32 = ${unpacker.descriptorCount}u;
const FIRST_VALUE: u32 = ${unpacker.firstValue >>> 0}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(unpacker.input)}u;
const DESCRIPTOR_OFFSET: u32 = ${getViewElementOffset(unpacker.miniBlockDescriptors)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(unpacker.outputDeltas)}u;

@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read> descriptors: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputDeltas: array<u32>;

fn readEncodedByte(encodedByteIndex: u32) -> u32 {
  if (encodedByteIndex >= ENCODED_BYTE_LENGTH) { return 0u; }
  let encodedWord = inputWords[INPUT_OFFSET + encodedByteIndex / 4u];
  return (encodedWord >> ((encodedByteIndex & 3u) * 8u)) & 255u;
}

fn readBitPackedValue(payloadByteOffset: u32, valueIndex: u32, bitWidth: u32) -> u32 {
  let bitOffset = valueIndex * bitWidth;
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
  if (bitWidth == 32u) { return value; }
  return value & ((1u << bitWidth) - 1u);
}

@compute @workgroup_size(${GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE)}
  let outputIndex = index;
  if (outputIndex >= VALUE_COUNT) { return; }
  if (outputIndex == 0u) {
    outputDeltas[OUTPUT_OFFSET] = FIRST_VALUE;
    return;
  }
  var lowerDescriptorIndex = 0u;
  var upperDescriptorIndex = DESCRIPTOR_COUNT;
  while (lowerDescriptorIndex < upperDescriptorIndex) {
    let middleDescriptorIndex = lowerDescriptorIndex +
      (upperDescriptorIndex - lowerDescriptorIndex) / 2u;
    let descriptorOutputOffset = descriptors[DESCRIPTOR_OFFSET + middleDescriptorIndex * 5u];
    if (descriptorOutputOffset <= outputIndex) {
      lowerDescriptorIndex = middleDescriptorIndex + 1u;
    } else {
      upperDescriptorIndex = middleDescriptorIndex;
    }
  }
  let descriptorIndex = DESCRIPTOR_OFFSET + (lowerDescriptorIndex - 1u) * 5u;
  let descriptorOutputOffset = descriptors[descriptorIndex];
  let payloadByteOffset = descriptors[descriptorIndex + 2u];
  let bitWidth = descriptors[descriptorIndex + 3u];
  let minimumDelta = descriptors[descriptorIndex + 4u];
  let adjustedDelta = readBitPackedValue(
    payloadByteOffset,
    outputIndex - descriptorOutputOffset,
    bitWidth
  );
  outputDeltas[OUTPUT_OFFSET + outputIndex] = minimumDelta + adjustedDelta;
}`;
}

function addUnpackPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  unpacker: GPUParquetDeltaBinaryPackedUnpacker,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUParquetDeltaBinaryPackedShaderSource(unpacker, dispatchLayout);
  const workgroupCount = Math.ceil(
    unpacker.valueCount / GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE
  );
  graph.addComputePass({
    id: unpacker.id,
    workload: {
      operation: 'GPUParquetDeltaBinaryPackedUnpacker',
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE,
      readByteLength:
        unpacker.encodedByteLength +
        unpacker.descriptorCount *
          PARQUET_DELTA_BINARY_PACKED_DESCRIPTOR_WORDS *
          Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: unpacker.valueCount * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: unpacker.input, usage: 'storage-read'},
      {buffer: unpacker.miniBlockDescriptors, usage: 'storage-read'},
      {buffer: unpacker.outputDeltas, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: unpacker.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'descriptors', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputDeltas', type: 'storage', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputWords: getViewBinding(unpacker.input, getBuffer),
            descriptors: getViewBinding(unpacker.miniBlockDescriptors, getBuffer),
            outputDeltas: getViewBinding(unpacker.outputDeltas, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(unpacker: GPUParquetDeltaBinaryPackedUnpacker): void {
  validatePackedUint32View(unpacker.input, `${unpacker.id} input`);
  validatePackedUint32View(unpacker.miniBlockDescriptors, `${unpacker.id} miniBlockDescriptors`);
  validatePackedUint32View(unpacker.outputDeltas, `${unpacker.id} outputDeltas`);
  if (
    !Number.isSafeInteger(unpacker.valueCount) ||
    unpacker.valueCount < 1 ||
    unpacker.valueCount > 0xffffffff
  ) {
    throw new Error(`${unpacker.id} valueCount must be a positive uint32`);
  }
  if (
    !Number.isSafeInteger(unpacker.descriptorCount) ||
    unpacker.descriptorCount < 0 ||
    unpacker.descriptorCount > 0xffffffff
  ) {
    throw new Error(`${unpacker.id} descriptorCount must be a non-negative uint32`);
  }
  if (unpacker.valueCount > 1 && unpacker.descriptorCount === 0) {
    throw new Error(`${unpacker.id} requires descriptors for multiple values`);
  }
  if (
    !Number.isSafeInteger(unpacker.firstValue) ||
    unpacker.firstValue < -0x80000000 ||
    unpacker.firstValue > 0x7fffffff
  ) {
    throw new Error(`${unpacker.id} firstValue must be INT32`);
  }
  if (
    !Number.isSafeInteger(unpacker.encodedByteLength) ||
    unpacker.encodedByteLength < 0 ||
    unpacker.encodedByteLength > 0xffffffff
  ) {
    throw new Error(`${unpacker.id} encodedByteLength must be a non-negative uint32`);
  }
  if (unpacker.input.length < Math.ceil(unpacker.encodedByteLength / 4)) {
    throw new Error(`${unpacker.id} input is shorter than encodedByteLength`);
  }
  if (
    unpacker.miniBlockDescriptors.length <
    unpacker.descriptorCount * PARQUET_DELTA_BINARY_PACKED_DESCRIPTOR_WORDS
  ) {
    throw new Error(`${unpacker.id} miniBlockDescriptors is shorter than descriptorCount`);
  }
  if (unpacker.outputDeltas.length < unpacker.valueCount) {
    throw new Error(`${unpacker.id} outputDeltas is shorter than valueCount`);
  }
  if (
    unpacker.outputDeltas.buffer === unpacker.input.buffer ||
    unpacker.outputDeltas.buffer === unpacker.miniBlockDescriptors.buffer
  ) {
    throw new Error(`${unpacker.id} outputDeltas must use a separate buffer`);
  }
}

function validateOwnership<Parameters>(
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
    device.limits.maxComputeInvocationsPerWorkgroup <
      GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_DELTA_BINARY_PACKED_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
