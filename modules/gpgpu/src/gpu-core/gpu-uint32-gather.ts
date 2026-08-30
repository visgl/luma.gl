// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const GATHER_WORKGROUP_SIZE = 256;

export type GPUUint32GatherProps = {
  id?: string;
  source: GraphDataView<'uint32'>;
  indices: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  invalidValue?: number;
};

/** Gathers packed uint32 rows through packed uint32 indices. Out-of-range indices use invalidValue. */
export class GPUUint32Gather {
  readonly id: string;
  readonly source: GraphDataView<'uint32'>;
  readonly indices: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly invalidValue: number;

  constructor(props: GPUUint32GatherProps) {
    this.id = props.id ?? 'gpu-uint32-gather';
    this.source = props.source;
    this.indices = props.indices;
    this.output = props.output;
    this.invalidValue = props.invalidValue ?? 0;
    for (const [name, view] of Object.entries({
      source: this.source,
      indices: this.indices,
      output: this.output
    })) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (this.output.length < this.indices.length) {
      throw new Error(`${this.id} output must contain at least indices.length rows`);
    }
    if (
      !Number.isSafeInteger(this.invalidValue) ||
      this.invalidValue < 0 ||
      this.invalidValue > 0xffffffff
    ) {
      throw new Error(`${this.id} invalidValue must be a uint32`);
    }
    if (this.output.buffer === this.source.buffer || this.output.buffer === this.indices.buffer) {
      throw new Error(`${this.id} output must use a separate buffer`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.source, this.indices, this.output]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.indices.length === 0) {
      return;
    }
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUUint32Gather',
      this.indices.length,
      GATHER_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const source = `const SOURCE_LENGTH: u32 = ${this.source.length}u;
const INDEX_COUNT: u32 = ${this.indices.length}u;
const INVALID_VALUE: u32 = ${this.invalidValue}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.source)}u;
const INDEX_OFFSET: u32 = ${getViewElementOffset(this.indices)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<u32>;
@group(0) @binding(1) var<storage, read> indices: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<u32>;
@compute @workgroup_size(${GATHER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GATHER_WORKGROUP_SIZE)}
  if (index >= INDEX_COUNT) { return; }
  let sourceIndex = indices[INDEX_OFFSET + index];
  outputValues[OUTPUT_OFFSET + index] = select(
    INVALID_VALUE,
    sourceValues[SOURCE_OFFSET + sourceIndex],
    sourceIndex < SOURCE_LENGTH
  );
}`;
    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUUint32Gather',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(this.indices.length / GATHER_WORKGROUP_SIZE),
        maximumInvocationCount:
          Math.ceil(this.indices.length / GATHER_WORKGROUP_SIZE) * GATHER_WORKGROUP_SIZE,
        readByteLength: (this.source.length + this.indices.length) * 4,
        writeByteLength: this.indices.length * 4
      },
      resources: [
        {buffer: this.source, usage: 'storage-read'},
        {buffer: this.indices, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {
            bindings: [
              {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
              {name: 'indices', type: 'read-only-storage', group: 0, location: 1},
              {name: 'outputValues', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              sourceValues: getViewBinding(this.source, getBuffer),
              indices: getViewBinding(this.indices, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer)
            };
            computation.setBindings(bindings);
            computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}
