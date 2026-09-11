// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, getViewElementOffset, validatePackedUint32View, validatePackedView, type GPUScalarFormat} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;
const SCALAR_FORMATS = ['uint32', 'sint32', 'float32'] as const;

export type GPUSegmentedReductionOperation = 'sum' | 'min' | 'max';

export type GPUSegmentedReductionProps<T extends GPUScalarFormat = GPUScalarFormat> = {
  id?: string;
  input: GraphDataView<T>;
  /** CSR-style element offsets. Length must equal output.length + 1. */
  segmentOffsets: GraphDataView<'uint32'>;
  output: GraphDataView<T>;
  operation: GPUSegmentedReductionOperation;
};

/** Reduces packed scalar rows independently for each CSR-style segment. */
export class GPUSegmentedReduction<T extends GPUScalarFormat = GPUScalarFormat> {
  readonly id: string;
  readonly input: GraphDataView<T>;
  readonly segmentOffsets: GraphDataView<'uint32'>;
  readonly output: GraphDataView<T>;
  readonly operation: GPUSegmentedReductionOperation;

  constructor(props: GPUSegmentedReductionProps<T>) {
    this.id = props.id ?? 'gpu-segmented-reduction';
    this.input = props.input;
    this.segmentOffsets = props.segmentOffsets;
    this.output = props.output;
    this.operation = props.operation;

    validatePackedView(this.input, SCALAR_FORMATS, `${this.id} input`);
    validatePackedUint32View(this.segmentOffsets, `${this.id} segmentOffsets`);
    validatePackedView(this.output, SCALAR_FORMATS, `${this.id} output`);
    if (this.input.format !== this.output.format) {
      throw new Error(`${this.id} input and output formats must match`);
    }
    if (this.segmentOffsets.length !== this.output.length + 1) {
      throw new Error(`${this.id} segmentOffsets length must equal output.length + 1`);
    }
    if (!['sum', 'min', 'max'].includes(this.operation)) {
      throw new Error(`${this.id} operation must be sum, min, or max`);
    }
    if (this.output.buffer === this.input.buffer || this.output.buffer === this.segmentOffsets.buffer) {
      throw new Error(`${this.id} output must use a separate buffer`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.input, this.segmentOffsets, this.output]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to target graph`);
    }
    if (this.output.length === 0) return;

    const source = makeShaderSource(this);
    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUSegmentedReduction',
        commandCount: 1,
        maximumWorkgroupCount: this.output.length,
        maximumInvocationCount: this.output.length * WORKGROUP_SIZE,
        readByteLength: this.input.length * 4 + this.segmentOffsets.length * 4,
        writeByteLength: this.output.length * 4
      },
      resources: [
        {buffer: this.input, usage: 'storage-read'},
        {buffer: this.segmentOffsets, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {bindings: [
            {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
            {name: 'segmentOffsets', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputValues', type: 'storage', group: 0, location: 2}
          ]}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              inputValues: getViewBinding(this.input, getBuffer),
              segmentOffsets: getViewBinding(this.segmentOffsets, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer)
            };
            computation.setBindings(bindings);
            computation.dispatch(computePass, this.output.length, 1, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}

function makeShaderSource(reduction: GPUSegmentedReduction): string {
  const type = reduction.input.format === 'uint32' ? 'u32' : reduction.input.format === 'sint32' ? 'i32' : 'f32';
  const identity = reduction.operation === 'sum'
    ? (type === 'f32' ? '0.0' : '0')
    : reduction.operation === 'min'
      ? (type === 'f32' ? '3.402823466e+38' : type === 'u32' ? '0xffffffffu' : '2147483647')
      : (type === 'f32' ? '-3.402823466e+38' : type === 'u32' ? '0u' : '-2147483648');
  const combine = reduction.operation === 'sum' ? 'a + b' : reduction.operation === 'min' ? 'min(a, b)' : 'max(a, b)';
  return `const INPUT_OFFSET: u32 = ${getViewElementOffset(reduction.input)}u;
const SEGMENT_OFFSET: u32 = ${getViewElementOffset(reduction.segmentOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(reduction.output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${type}>;
@group(0) @binding(1) var<storage, read> segmentOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<${type}>;
var<workgroup> scratch: array<${type}, ${WORKGROUP_SIZE}>;
fn combine(a: ${type}, b: ${type}) -> ${type} { return ${combine}; }
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) wg: vec3u, @builtin(local_invocation_index) lane: u32) {
  let segment = wg.x;
  let begin = segmentOffsets[SEGMENT_OFFSET + segment];
  let end = segmentOffsets[SEGMENT_OFFSET + segment + 1u];
  var value: ${type} = ${identity};
  var i = begin + lane;
  loop {
    if (i >= end) { break; }
    value = combine(value, inputValues[INPUT_OFFSET + i]);
    i += ${WORKGROUP_SIZE}u;
  }
  scratch[lane] = value;
  workgroupBarrier();
  var stride = ${WORKGROUP_SIZE / 2}u;
  loop {
    if (stride == 0u) { break; }
    if (lane < stride) { scratch[lane] = combine(scratch[lane], scratch[lane + stride]); }
    workgroupBarrier();
    stride = stride / 2u;
  }
  if (lane == 0u) {
    outputValues[OUTPUT_OFFSET + segment] = select(scratch[0], ${type}(${reduction.operation === 'sum' ? '0' : '0'}), begin == end);
  }
}`;
}
