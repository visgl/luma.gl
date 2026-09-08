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

export const GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE = 256;

export type GPUParquetPlainBooleanDecoderProps = {
  id?: string;
  input: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  valueCount: number;
};

/** Expands Parquet PLAIN LSB-first boolean bits to one uint32 value per row. */
export class GPUParquetPlainBooleanDecoder {
  readonly id: string;
  readonly input: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly valueCount: number;

  constructor(props: GPUParquetPlainBooleanDecoderProps) {
    this.id = props.id ?? 'gpu-parquet-plain-boolean';
    this.input = props.input;
    this.output = props.output;
    this.valueCount = props.valueCount;
    validatePackedUint32View(this.input, `${this.id} input`);
    validatePackedUint32View(this.output, `${this.id} output`);
    if (
      !Number.isSafeInteger(this.valueCount) ||
      this.valueCount < 0 ||
      this.valueCount > 0xffffffff
    ) {
      throw new Error(`${this.id} valueCount must be a non-negative uint32`);
    }
    if (this.input.length < Math.ceil(this.valueCount / 32)) {
      throw new Error(`${this.id} input is shorter than the packed boolean payload`);
    }
    if (this.output.length < this.valueCount) {
      throw new Error(`${this.id} output is shorter than valueCount`);
    }
    if (this.input.buffer === this.output.buffer) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateOwnership(graph, this.input, `${this.id} input`);
    validateOwnership(graph, this.output, `${this.id} output`);
    if (this.valueCount === 0) {
      return;
    }
    validateDevice(graph.device, this.id);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUParquetPlainBooleanDecoder',
      this.valueCount,
      GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addDecodePass(graph, this, dispatchLayout);
  }
}

export function getGPUParquetPlainBooleanShaderSource(
  decoder: GPUParquetPlainBooleanDecoder,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  return `const VALUE_COUNT: u32 = ${decoder.valueCount}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(decoder.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(decoder.output)}u;

@group(0) @binding(0) var<storage, read> inputWords: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE)}
  let valueIndex = index;
  if (valueIndex >= VALUE_COUNT) { return; }
  let inputWord = inputWords[INPUT_OFFSET + valueIndex / 32u];
  outputValues[OUTPUT_OFFSET + valueIndex] = (inputWord >> (valueIndex & 31u)) & 1u;
}`;
}

function addDecodePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  decoder: GPUParquetPlainBooleanDecoder,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUParquetPlainBooleanShaderSource(decoder, dispatchLayout);
  const workgroupCount = Math.ceil(decoder.valueCount / GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE);
  graph.addComputePass({
    id: decoder.id,
    workload: {
      operation: 'GPUParquetPlainBooleanDecoder',
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE,
      readByteLength: Math.ceil(decoder.valueCount / 8),
      writeByteLength: decoder.valueCount * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: decoder.input, usage: 'storage-read'},
      {buffer: decoder.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: decoder.id,
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
            inputWords: getViewBinding(decoder.input, getBuffer),
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
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_PARQUET_PLAIN_BOOLEAN_WORKGROUP_SIZE
  ) {
    throw new Error(`${id} requires WebGPU with 256-invocation compute workgroups`);
  }
}
