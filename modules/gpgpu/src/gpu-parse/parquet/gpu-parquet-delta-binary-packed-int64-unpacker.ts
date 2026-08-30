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
import {PARQUET_DELTA_BINARY_PACKED_INT64_DESCRIPTOR_WORDS} from './parquet-delta-binary-packed-int64';

const WORKGROUP_SIZE = 256;

export type GPUParquetDeltaBinaryPackedInt64UnpackerProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  miniBlockDescriptors: GraphDataView<'uint32'>;
  outputDeltaLow: GraphDataView<'uint32'>;
  outputDeltaHigh: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  descriptorCount: number;
  firstValueLow: number;
  firstValueHigh: number;
};

/** Unpacks adjusted INT64 deltas into split words for a following uint64 scan. */
export class GPUParquetDeltaBinaryPackedInt64Unpacker {
  readonly id: string;
  readonly props: Readonly<GPUParquetDeltaBinaryPackedInt64UnpackerProps>;

  constructor(props: GPUParquetDeltaBinaryPackedInt64UnpackerProps) {
    this.id = props.id ?? 'gpu-parquet-delta-binary-packed-int64-unpack';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    for (const view of [
      props.input,
      props.miniBlockDescriptors,
      props.outputDeltaLow,
      props.outputDeltaHigh
    ]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    validateDevice(graph.device, this.id);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUParquetDeltaBinaryPackedInt64Unpacker',
      props.valueCount,
      WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addUnpackPass(graph, props, dispatchLayout);
  }
}

/** Returns the split-word INT64 delta unpack shader. @internal */
export function getGPUParquetDeltaBinaryPackedInt64ShaderSource(
  props: Readonly<GPUParquetDeltaBinaryPackedInt64UnpackerProps>,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  return `const ENCODED_BYTE_LENGTH: u32 = ${props.encodedByteLength}u;
const VALUE_COUNT: u32 = ${props.valueCount}u;
const DESCRIPTOR_COUNT: u32 = ${props.descriptorCount}u;
const FIRST_VALUE_LOW: u32 = ${props.firstValueLow}u;
const FIRST_VALUE_HIGH: u32 = ${props.firstValueHigh}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const DESCRIPTOR_OFFSET: u32 = ${getViewElementOffset(props.miniBlockDescriptors)}u;
const OUTPUT_LOW_OFFSET: u32 = ${getViewElementOffset(props.outputDeltaLow)}u;
const OUTPUT_HIGH_OFFSET: u32 = ${getViewElementOffset(props.outputDeltaHigh)}u;
@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read> descriptors: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputLow: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputHigh: array<u32>;
fn readEncodedByte(byteIndex: u32) -> u32 {
  if (byteIndex >= ENCODED_BYTE_LENGTH) { return 0u; }
  let word = inputWords[INPUT_OFFSET + byteIndex / 4u];
  return (word >> ((byteIndex & 3u) * 8u)) & 255u;
}
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, WORKGROUP_SIZE)}
  let outputIndex = index;
  if (outputIndex >= VALUE_COUNT) { return; }
  if (outputIndex == 0u) {
    outputLow[OUTPUT_LOW_OFFSET] = FIRST_VALUE_LOW;
    outputHigh[OUTPUT_HIGH_OFFSET] = FIRST_VALUE_HIGH;
    return;
  }
  var lowerDescriptorIndex = 0u;
  var upperDescriptorIndex = DESCRIPTOR_COUNT;
  while (lowerDescriptorIndex < upperDescriptorIndex) {
    let middleDescriptorIndex = lowerDescriptorIndex +
      (upperDescriptorIndex - lowerDescriptorIndex) / 2u;
    let descriptorOutputOffset = descriptors[DESCRIPTOR_OFFSET + middleDescriptorIndex * 6u];
    if (descriptorOutputOffset <= outputIndex) {
      lowerDescriptorIndex = middleDescriptorIndex + 1u;
    } else {
      upperDescriptorIndex = middleDescriptorIndex;
    }
  }
  let descriptorIndex = DESCRIPTOR_OFFSET + (lowerDescriptorIndex - 1u) * 6u;
  let descriptorOutputOffset = descriptors[descriptorIndex];
  let payloadByteOffset = descriptors[descriptorIndex + 2u];
  let bitWidth = descriptors[descriptorIndex + 3u];
  let minimumLow = descriptors[descriptorIndex + 4u];
  let minimumHigh = descriptors[descriptorIndex + 5u];
  let valueIndexWithinBlock = outputIndex - descriptorOutputOffset;
  let wholeBytesPerValue = bitWidth / 8u;
  let remainingBitsPerValue = bitWidth & 7u;
  let remainingBitProduct = (valueIndexWithinBlock & 7u) * remainingBitsPerValue;
  let firstByteIndex = payloadByteOffset + valueIndexWithinBlock * wholeBytesPerValue +
    (valueIndexWithinBlock / 8u) * remainingBitsPerValue + remainingBitProduct / 8u;
  let firstBitWithinByte = remainingBitProduct & 7u;
  var adjustedLow = 0u;
  var adjustedHigh = 0u;
  for (var bitIndex = 0u; bitIndex < 64u; bitIndex++) {
    if (bitIndex < bitWidth) {
      let relativeBitIndex = firstBitWithinByte + bitIndex;
      let bit = (readEncodedByte(firstByteIndex + relativeBitIndex / 8u) >>
        (relativeBitIndex & 7u)) & 1u;
      if (bitIndex < 32u) {
        adjustedLow |= bit << bitIndex;
      } else {
        adjustedHigh |= bit << (bitIndex - 32u);
      }
    }
  }
  let deltaLow = adjustedLow + minimumLow;
  let carry = select(0u, 1u, deltaLow < adjustedLow);
  outputLow[OUTPUT_LOW_OFFSET + outputIndex] = deltaLow;
  outputHigh[OUTPUT_HIGH_OFFSET + outputIndex] = adjustedHigh + minimumHigh + carry;
}`;
}

function addUnpackPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUParquetDeltaBinaryPackedInt64UnpackerProps>,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUParquetDeltaBinaryPackedInt64ShaderSource(props, dispatchLayout);
  const workgroupCount = Math.ceil(props.valueCount / WORKGROUP_SIZE);
  graph.addComputePass({
    id: props.id ?? 'gpu-parquet-delta-binary-packed-int64-unpack',
    workload: {
      operation: 'GPUParquetDeltaBinaryPackedInt64Unpacker',
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * WORKGROUP_SIZE,
      readByteLength:
        props.encodedByteLength +
        props.descriptorCount *
          PARQUET_DELTA_BINARY_PACKED_INT64_DESCRIPTOR_WORDS *
          Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: props.valueCount * 2 * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.miniBlockDescriptors, usage: 'storage-read'},
      {buffer: props.outputDeltaLow, usage: 'storage-write'},
      {buffer: props.outputDeltaHigh, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'descriptors', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputLow', type: 'storage', group: 0, location: 2},
            {name: 'outputHigh', type: 'storage', group: 0, location: 3}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputWords: getViewBinding(props.input, getBuffer),
            descriptors: getViewBinding(props.miniBlockDescriptors, getBuffer),
            outputLow: getViewBinding(props.outputDeltaLow, getBuffer),
            outputHigh: getViewBinding(props.outputDeltaHigh, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(
  props: Readonly<GPUParquetDeltaBinaryPackedInt64UnpackerProps>
): void {
  for (const [name, view] of Object.entries({
    input: props.input,
    miniBlockDescriptors: props.miniBlockDescriptors,
    outputDeltaLow: props.outputDeltaLow,
    outputDeltaHigh: props.outputDeltaHigh
  })) {
    validatePackedUint32View(view, `${props.id} ${name}`);
  }
  for (const [name, value] of Object.entries({
    encodedByteLength: props.encodedByteLength,
    valueCount: props.valueCount,
    descriptorCount: props.descriptorCount,
    firstValueLow: props.firstValueLow,
    firstValueHigh: props.firstValueHigh
  })) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error(`${props.id} ${name} must be a non-negative uint32`);
    }
  }
  if (props.valueCount === 0 || (props.valueCount > 1 && props.descriptorCount === 0)) {
    throw new Error(`${props.id} requires values and matching descriptors`);
  }
  if (props.input.length * 4 < props.encodedByteLength) {
    throw new Error(`${props.id} input is shorter than encodedByteLength`);
  }
  if (
    props.miniBlockDescriptors.length <
    props.descriptorCount * PARQUET_DELTA_BINARY_PACKED_INT64_DESCRIPTOR_WORDS
  ) {
    throw new Error(`${props.id} miniBlockDescriptors is shorter than descriptorCount`);
  }
  if (
    props.outputDeltaLow.length < props.valueCount ||
    props.outputDeltaHigh.length < props.valueCount
  ) {
    throw new Error(`${props.id} outputs are shorter than valueCount`);
  }
}

function validateDevice(device: Device, id: string): void {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup < WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
