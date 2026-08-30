// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const ANCESTOR_PROJECTION_WORKGROUP_SIZE = 256;
const DEFAULT_INVALID_ANCESTOR = 0xffffffff;
const MAXIMUM_UINT32 = 0xffffffff;

/** Properties for nearest-visible canonical parent projection. */
export type GPUAncestorProjectionProps = {
  /** Prefix for the generated command-graph node. */
  id?: string;
  /** One canonical parent node index per source row. */
  parents: GraphDataView<'uint32'>;
  /** Current source-aligned, zero/nonzero visibility mask. */
  visibility: GraphDataView<'uint32'>;
  /** Optional one-row value that marks currently visible entries instead of any nonzero value. */
  visibilityValue?: GraphDataView<'uint32'>;
  /** Caller-owned nearest-visible source index per node. */
  output: GraphDataView<'uint32'>;
  /** Maximum number of hidden canonical parent edges to follow. Defaults to 32. */
  maxDepth?: number;
  /** Sentinel returned for missing, cyclic, or out-of-range ancestry. */
  invalidValue?: number;
};

/**
 * Projects hidden source nodes onto their nearest visible canonical ancestors.
 *
 * Visible nodes project to themselves. Hidden parent chains are followed up to a fixed bound, so
 * corrupt and cyclic relationships cannot stall an interaction. Outputs retain source-node
 * identity and can directly drive filtered dependency endpoint routing.
 */
export class GPUAncestorProjection {
  /** Prefix for the generated command-graph node. */
  readonly id: string;
  /** Canonical parent source IDs. */
  readonly parents: GraphDataView<'uint32'>;
  /** Current source-aligned visibility mask. */
  readonly visibility: GraphDataView<'uint32'>;
  /** Optional exact visibility value, useful for generation-tagged sparse masks. */
  readonly visibilityValue?: GraphDataView<'uint32'>;
  /** Caller-owned resolved source IDs. */
  readonly output: GraphDataView<'uint32'>;
  /** Maximum number of ancestry edges visited per source row. */
  readonly maxDepth: number;
  /** Sentinel for unresolved ancestry. */
  readonly invalidValue: number;

  constructor(props: GPUAncestorProjectionProps) {
    this.id = props.id ?? 'gpu-ancestor-projection';
    this.parents = props.parents;
    this.visibility = props.visibility;
    this.visibilityValue = props.visibilityValue;
    this.output = props.output;
    this.maxDepth = props.maxDepth ?? 32;
    this.invalidValue = props.invalidValue ?? DEFAULT_INVALID_ANCESTOR;
    for (const [name, view] of [
      ['parents', this.parents],
      ['visibility', this.visibility],
      ['output', this.output]
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (
      this.parents.length !== this.output.length ||
      this.visibility.length !== this.output.length
    ) {
      throw new Error(`${this.id} parents, visibility, and output must have matching lengths`);
    }
    if (this.visibilityValue) {
      validatePackedUint32View(this.visibilityValue, `${this.id} visibilityValue`);
      if (this.visibilityValue.length < 1) {
        throw new Error(`${this.id} visibilityValue must contain one uint32 row`);
      }
    }
    if (!Number.isSafeInteger(this.maxDepth) || this.maxDepth < 0) {
      throw new Error(`${this.id} maxDepth must be a nonnegative safe integer`);
    }
    if (this.maxDepth > MAXIMUM_UINT32) {
      throw new Error(`${this.id} maxDepth must be a uint32`);
    }
    if (
      !Number.isSafeInteger(this.invalidValue) ||
      this.invalidValue < 0 ||
      this.invalidValue > MAXIMUM_UINT32
    ) {
      throw new Error(`${this.id} invalidValue must be a uint32`);
    }
    if (
      this.output.buffer === this.parents.buffer ||
      this.output.buffer === this.visibility.buffer
    ) {
      throw new Error(`${this.id} output must use a separate buffer from ancestry inputs`);
    }
  }

  /** Adds one bounded, source-aligned projection pass without submitting GPU work. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (
      this.parents.buffer.graph !== graph ||
      this.visibility.buffer.graph !== graph ||
      this.output.buffer.graph !== graph ||
      (this.visibilityValue && this.visibilityValue.buffer.graph !== graph)
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.output.length === 0) {
      return;
    }

    const source = /* wgsl */ `
const NODE_COUNT: u32 = ${this.output.length}u;
const MAX_DEPTH: u32 = ${this.maxDepth}u;
const INVALID_ANCESTOR: u32 = ${this.invalidValue}u;
const PARENTS_OFFSET: u32 = ${getViewElementOffset(this.parents)}u;
const VISIBILITY_OFFSET: u32 = ${getViewElementOffset(this.visibility)}u;
${this.visibilityValue ? `const VISIBILITY_VALUE_OFFSET: u32 = ${getViewElementOffset(this.visibilityValue)}u;` : ''}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
@group(0) @binding(0) var<storage, read> parents: array<u32>;
@group(0) @binding(1) var<storage, read> visibility: array<u32>;
@group(0) @binding(2) var<storage, read_write> projectedAncestors: array<u32>;
${this.visibilityValue ? '@group(0) @binding(3) var<storage, read> visibilityValue: array<u32>;' : ''}

fn isVisible(index: u32) -> bool {
  ${this.visibilityValue ? 'return visibility[VISIBILITY_OFFSET + index] == visibilityValue[VISIBILITY_VALUE_OFFSET];' : 'return visibility[VISIBILITY_OFFSET + index] != 0u;'}
}

@compute @workgroup_size(${ANCESTOR_PROJECTION_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let sourceIndex = globalId.x;
  if (sourceIndex >= NODE_COUNT) {
    return;
  }
  if (isVisible(sourceIndex)) {
    projectedAncestors[OUTPUT_OFFSET + sourceIndex] = sourceIndex;
    return;
  }
  var parentIndex = parents[PARENTS_OFFSET + sourceIndex];
  var depth = 0u;
  loop {
    if (depth >= MAX_DEPTH || parentIndex >= NODE_COUNT) {
      projectedAncestors[OUTPUT_OFFSET + sourceIndex] = INVALID_ANCESTOR;
      return;
    }
    if (isVisible(parentIndex)) {
      projectedAncestors[OUTPUT_OFFSET + sourceIndex] = parentIndex;
      return;
    }
    parentIndex = parents[PARENTS_OFFSET + parentIndex];
    depth++;
  }
}`;
    const views = {
      parents: this.parents,
      visibility: this.visibility,
      projectedAncestors: this.output,
      ...(this.visibilityValue ? {visibilityValue: this.visibilityValue} : {})
    };
    graph.addComputePass({
      id: this.id,
      resources: [
        {buffer: this.parents, usage: 'storage-read'},
        {buffer: this.visibility, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'},
        ...(this.visibilityValue
          ? [{buffer: this.visibilityValue, usage: 'storage-read'} as const]
          : [])
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {
            bindings: Object.keys(views).map((name, location) => ({
              name,
              type: 'storage' as const,
              group: 0,
              location
            }))
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {};
            for (const [name, view] of Object.entries(views)) {
              resolvedBindings[name] = getViewBinding(view, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(
              computePass,
              Math.ceil(this.output.length / ANCESTOR_PROJECTION_WORKGROUP_SIZE)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}
