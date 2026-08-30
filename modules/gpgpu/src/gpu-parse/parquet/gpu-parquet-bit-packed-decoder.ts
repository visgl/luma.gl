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

export const GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE = 256;

export type GPUParquetBitPackedDecoderProps = {
  id?: string;
  /** Deprecated standalone BIT_PACKED bytes, packed into uint32 words. */
  input: GraphDataView<'uint32'>;
  /** One decoded uint32 per value. */
  output: GraphDataView<'uint32'>;
  encodedByteLength: number;
  valueCount: number;
  bitWidth: number;
};

/** Decodes Parquet's deprecated standalone MSB-first BIT_PACKED level encoding. */
export class GPUParquetBitPackedDecoder {
  readonly id: string;
  readonly props: Readonly<GPUParquetBitPackedDecoderProps>;

  constructor(props: GPUParquetBitPackedDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-bit-packed';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    for (const view of [props.input, props.output]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.valueCount === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUParquetBitPackedDecoder',
      props.valueCount,
      GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addDecodePass(graph, props, dispatchLayout);
  }
}

/** Returns the standalone BIT_PACKED MSB-first extraction shader. @internal */
export function getGPUParquetBitPackedShaderSource(
  props: Readonly<GPUParquetBitPackedDecoderProps>,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  return `const ENCODED_BYTE_LENGTH: u32 = ${props.encodedByteLength}u;
const VALUE_COUNT: u32 = ${props.valueCount}u;
const BIT_WIDTH: u32 = ${props.bitWidth}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
fn readEncodedByte(encodedByteIndex: u32) -> u32 {
  if (encodedByteIndex >= ENCODED_BYTE_LENGTH) { return 0u; }
  let word = inputWords[INPUT_OFFSET + encodedByteIndex / 4u];
  return (word >> ((encodedByteIndex & 3u) * 8u)) & 255u;
}
@compute @workgroup_size(${GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE)}
  let valueIndex = index;
  if (valueIndex >= VALUE_COUNT) { return; }
  var value = 0u;
  for (var valueBitIndex = 0u; valueBitIndex < BIT_WIDTH; valueBitIndex++) {
    let sourceBitIndex = valueIndex * BIT_WIDTH + valueBitIndex;
    let sourceByte = readEncodedByte(sourceBitIndex / 8u);
    let bit = (sourceByte >> (7u - (sourceBitIndex & 7u))) & 1u;
    value |= bit << (BIT_WIDTH - 1u - valueBitIndex);
  }
  outputValues[OUTPUT_OFFSET + valueIndex] = value;
}`;
}

function addDecodePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUParquetBitPackedDecoderProps>,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUParquetBitPackedShaderSource(props, dispatchLayout);
  const workgroupCount = Math.ceil(props.valueCount / GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE);
  graph.addComputePass({
    id: props.id ?? 'gpu-parquet-bit-packed',
    workload: {
      operation: 'GPUParquetBitPackedDecoder',
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE,
      readByteLength: props.encodedByteLength,
      writeByteLength: props.valueCount * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
            {name: 'outputValues', type: 'storage', group: 0, location: 1}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputWords: getViewBinding(props.input, getBuffer),
            outputValues: getViewBinding(props.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(props: Readonly<GPUParquetBitPackedDecoderProps>): void {
  validatePackedUint32View(props.input, `${props.id} input`);
  validatePackedUint32View(props.output, `${props.id} output`);
  if (!Number.isSafeInteger(props.bitWidth) || props.bitWidth < 0 || props.bitWidth > 32) {
    throw new Error(`${props.id} bitWidth must be an integer from 0 through 32`);
  }
  if (!Number.isSafeInteger(props.valueCount) || props.valueCount < 0) {
    throw new Error(`${props.id} valueCount must be a non-negative integer`);
  }
  if (!Number.isSafeInteger(props.encodedByteLength) || props.encodedByteLength < 0) {
    throw new Error(`${props.id} encodedByteLength must be a non-negative integer`);
  }
  if (props.input.length * 4 < props.encodedByteLength) {
    throw new Error(`${props.id} input is shorter than encodedByteLength`);
  }
  if (props.output.length < props.valueCount) {
    throw new Error(`${props.id} output is shorter than valueCount`);
  }
  if (props.output.buffer === props.input.buffer) {
    throw new Error(`${props.id} input and output must use separate buffers`);
  }
}

function validateDevice(device: Device, id: string): void {
  if (
    device.type !== 'webgpu' ||
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_BIT_PACKED_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
