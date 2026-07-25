// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const HIERARCHY_LAYOUT_WORKGROUP_SIZE = 256;

/** Properties for scan-based GPU layout of fixed-width parent/child groups. */
export type GPUHierarchyLayoutProps = {
  /** Prefix for generated hierarchy and prefix-scan nodes. */
  id?: string;
  /** One zero/nonzero expansion state per parent. */
  parentStates: GraphDataView<'uint32'>;
  /** One zero/nonzero expansion state per child. */
  childStates: GraphDataView<'uint32'>;
  /** Caller-owned effective heights for each child. */
  heights: GraphDataView<'uint32'>;
  /** Caller-owned exclusive layout offsets for each child. */
  offsets: GraphDataView<'uint32'>;
  /** Number of consecutive children belonging to each parent. */
  childrenPerParent: number;
  /** Height contributed by an expanded child. Defaults to one. */
  expandedChildHeight?: number;
  /** Height contributed by a collapsed child. Defaults to one. */
  collapsedChildHeight?: number;
  /** Height contributed by a collapsed parent's first child. Defaults to one. */
  collapsedParentHeight?: number;
};

/**
 * Converts mutable parent/child expansion flags into stable scan-based row positions.
 *
 * A collapsed parent contributes one representative child row; later children contribute zero.
 * Expanded parents use their child expansion flags to choose full or collapsed row heights.
 * Effective heights are then exclusively scanned without rebuilding source records or draw calls.
 */
export class GPUHierarchyLayout {
  /** Prefix for generated command-graph nodes. */
  readonly id: string;
  /** Source-aligned parent expansion states. */
  readonly parentStates: GraphDataView<'uint32'>;
  /** Source-aligned child expansion states. */
  readonly childStates: GraphDataView<'uint32'>;
  /** Caller-owned effective child heights. */
  readonly heights: GraphDataView<'uint32'>;
  /** Caller-owned exclusive child offsets. */
  readonly offsets: GraphDataView<'uint32'>;
  /** Number of consecutive children represented by one parent. */
  readonly childrenPerParent: number;
  /** Effective expanded child height. */
  readonly expandedChildHeight: number;
  /** Effective collapsed child height. */
  readonly collapsedChildHeight: number;
  /** Effective collapsed parent summary height. */
  readonly collapsedParentHeight: number;

  constructor(props: GPUHierarchyLayoutProps) {
    this.id = props.id ?? 'gpu-hierarchy-layout';
    this.parentStates = props.parentStates;
    this.childStates = props.childStates;
    this.heights = props.heights;
    this.offsets = props.offsets;
    this.childrenPerParent = props.childrenPerParent;
    this.expandedChildHeight = props.expandedChildHeight ?? 1;
    this.collapsedChildHeight = props.collapsedChildHeight ?? 1;
    this.collapsedParentHeight = props.collapsedParentHeight ?? 1;

    for (const [name, view] of [
      ['parentStates', this.parentStates],
      ['childStates', this.childStates],
      ['heights', this.heights],
      ['offsets', this.offsets]
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (!Number.isSafeInteger(this.childrenPerParent) || this.childrenPerParent <= 0) {
      throw new Error(`${this.id} childrenPerParent must be a positive safe integer`);
    }
    if (this.childStates.length !== this.parentStates.length * this.childrenPerParent) {
      throw new Error(`${this.id} child states must match parent count and childrenPerParent`);
    }
    if (
      this.heights.length !== this.childStates.length ||
      this.offsets.length !== this.childStates.length
    ) {
      throw new Error(`${this.id} heights and offsets must match the child count`);
    }
    for (const [name, value] of [
      ['expandedChildHeight', this.expandedChildHeight],
      ['collapsedChildHeight', this.collapsedChildHeight],
      ['collapsedParentHeight', this.collapsedParentHeight]
    ] as const) {
      if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
        throw new Error(`${this.id} ${name} must be a uint32`);
      }
    }
    if (
      this.heights.buffer === this.offsets.buffer ||
      this.heights.buffer === this.parentStates.buffer ||
      this.heights.buffer === this.childStates.buffer ||
      this.offsets.buffer === this.parentStates.buffer ||
      this.offsets.buffer === this.childStates.buffer
    ) {
      throw new Error(
        `${this.id} layout outputs must use separate buffers from inputs and each other`
      );
    }
  }

  /** Adds one hierarchy-height kernel and the graph-native exclusive prefix scan. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.parentStates, this.childStates, this.heights, this.offsets]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.childStates.length === 0) {
      return;
    }
    this.addHeightPass(graph);
    new GPUScan({
      id: `${this.id}-offsets`,
      input: this.heights,
      output: this.offsets
    }).addToGraph(graph);
  }

  /** Publishes one effective child height for the current parent and child expansion state. */
  private addHeightPass<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const source = /* wgsl */ `
const CHILD_COUNT: u32 = ${this.childStates.length}u;
const CHILDREN_PER_PARENT: u32 = ${this.childrenPerParent}u;
const EXPANDED_CHILD_HEIGHT: u32 = ${this.expandedChildHeight}u;
const COLLAPSED_CHILD_HEIGHT: u32 = ${this.collapsedChildHeight}u;
const COLLAPSED_PARENT_HEIGHT: u32 = ${this.collapsedParentHeight}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(this.parentStates)}u;
const CHILD_OFFSET: u32 = ${getViewElementOffset(this.childStates)}u;
const HEIGHT_OFFSET: u32 = ${getViewElementOffset(this.heights)}u;
@group(0) @binding(0) var<storage, read> parentStates: array<u32>;
@group(0) @binding(1) var<storage, read> childStates: array<u32>;
@group(0) @binding(2) var<storage, read_write> childHeights: array<u32>;

@compute @workgroup_size(${HIERARCHY_LAYOUT_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let childIndex = globalId.x;
  if (childIndex >= CHILD_COUNT) {
    return;
  }
  let parentIndex = childIndex / CHILDREN_PER_PARENT;
  if (parentStates[PARENT_OFFSET + parentIndex] == 0u) {
    childHeights[HEIGHT_OFFSET + childIndex] = select(
      0u,
      COLLAPSED_PARENT_HEIGHT,
      childIndex % CHILDREN_PER_PARENT == 0u
    );
    return;
  }
  childHeights[HEIGHT_OFFSET + childIndex] = select(
    COLLAPSED_CHILD_HEIGHT,
    EXPANDED_CHILD_HEIGHT,
    childStates[CHILD_OFFSET + childIndex] != 0u
  );
}`;
    const views = {
      parentStates: this.parentStates,
      childStates: this.childStates,
      childHeights: this.heights
    };
    graph.addComputePass({
      id: `${this.id}-heights`,
      resources: [
        {buffer: this.parentStates, usage: 'storage-read'},
        {buffer: this.childStates, usage: 'storage-read'},
        {buffer: this.heights, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-heights`,
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
              Math.ceil(this.childStates.length / HIERARCHY_LAYOUT_WORKGROUP_SIZE)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}
