// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const HIERARCHY_LAYOUT_WORKGROUP_SIZE = 256;

/** Packed hierarchy data stored in one allocation or ordered partitions. */
export type GPUHierarchyLayoutData = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Properties for scan-based GPU layout of fixed-width parent/child groups. */
export type GPUHierarchyLayoutProps = {
  /** Prefix for generated hierarchy and prefix-scan nodes. */
  id?: string;
  /** One zero/nonzero expansion state per parent. */
  parentStates: GPUHierarchyLayoutData;
  /** One zero/nonzero expansion state per child. */
  childStates: GPUHierarchyLayoutData;
  /** Caller-owned effective heights for each child. */
  heights: GPUHierarchyLayoutData;
  /** Caller-owned exclusive layout offsets for each child. */
  offsets: GPUHierarchyLayoutData;
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
  readonly parentStates: GPUHierarchyLayoutData;
  /** Source-aligned child expansion states. */
  readonly childStates: GPUHierarchyLayoutData;
  /** Caller-owned effective child heights. */
  readonly heights: GPUHierarchyLayoutData;
  /** Caller-owned exclusive child offsets. */
  readonly offsets: GPUHierarchyLayoutData;
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

    for (const [name, data] of [
      ['parentStates', this.parentStates],
      ['childStates', this.childStates],
      ['heights', this.heights],
      ['offsets', this.offsets]
    ] as const) {
      validateHierarchyData(data, `${this.id} ${name}`);
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
    validateChildOutputTopology(this.childStates, this.heights, `${this.id} heights`);
    validateChildOutputTopology(this.childStates, this.offsets, `${this.id} offsets`);
    for (const [name, value] of [
      ['expandedChildHeight', this.expandedChildHeight],
      ['collapsedChildHeight', this.collapsedChildHeight],
      ['collapsedParentHeight', this.collapsedParentHeight]
    ] as const) {
      if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
        throw new Error(`${this.id} ${name} must be a uint32`);
      }
    }
    const heightBuffers = getHierarchyBuffers(this.heights);
    const offsetBuffers = getHierarchyBuffers(this.offsets);
    const inputBuffers = new Set([
      ...getHierarchyBuffers(this.parentStates),
      ...getHierarchyBuffers(this.childStates)
    ]);
    if (
      heightBuffers.some(buffer => offsetBuffers.includes(buffer)) ||
      heightBuffers.some(buffer => inputBuffers.has(buffer)) ||
      offsetBuffers.some(buffer => inputBuffers.has(buffer))
    ) {
      throw new Error(
        `${this.id} layout outputs must use separate buffers from inputs and each other`
      );
    }
  }

  /** Adds one hierarchy-height kernel and the graph-native exclusive prefix scan. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const data of [this.parentStates, this.childStates, this.heights, this.offsets]) {
      for (const view of getHierarchyChunks(data)) {
        if (view.buffer.graph !== graph) {
          throw new Error(`${this.id} views must belong to the target graph`);
        }
      }
    }
    if (this.childStates.length === 0) {
      return;
    }
    const parentChunks = getHierarchyChunkRanges(this.parentStates);
    const childChunks = getHierarchyChunkRanges(this.childStates);
    const heightChunks = getHierarchyChunks(this.heights);
    for (const childChunk of childChunks) {
      for (const parentChunk of parentChunks) {
        const firstChild = Math.max(childChunk.base, parentChunk.base * this.childrenPerParent);
        const lastChild = Math.min(
          childChunk.base + childChunk.view.length,
          (parentChunk.base + parentChunk.view.length) * this.childrenPerParent
        );
        if (firstChild < lastChild) {
          this.addHeightPass(graph, {
            id: `${this.id}-heights-child-${childChunk.index}-parent-${parentChunk.index}`,
            parentStates: parentChunk.view,
            parentBase: parentChunk.base,
            childStates: childChunk.view,
            childHeights: heightChunks[childChunk.index],
            childBase: childChunk.base,
            firstChild,
            childCount: lastChild - firstChild
          });
        }
      }
    }
    new GPUScan({
      id: `${this.id}-offsets`,
      input: this.heights,
      output: this.offsets
    }).addToGraph(graph);
  }

  /** Publishes one effective child height for the current parent and child expansion state. */
  private addHeightPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    props: {
      id: string;
      parentStates: GraphDataView<'uint32'>;
      parentBase: number;
      childStates: GraphDataView<'uint32'>;
      childHeights: GraphDataView<'uint32'>;
      childBase: number;
      firstChild: number;
      childCount: number;
    }
  ): void {
    const source = /* wgsl */ `
const CHILD_COUNT: u32 = ${props.childCount}u;
const CHILDREN_PER_PARENT: u32 = ${this.childrenPerParent}u;
const EXPANDED_CHILD_HEIGHT: u32 = ${this.expandedChildHeight}u;
const COLLAPSED_CHILD_HEIGHT: u32 = ${this.collapsedChildHeight}u;
const COLLAPSED_PARENT_HEIGHT: u32 = ${this.collapsedParentHeight}u;
const PARENT_BASE: u32 = ${props.parentBase}u;
const CHILD_BASE: u32 = ${props.childBase}u;
const FIRST_CHILD: u32 = ${props.firstChild}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(props.parentStates)}u;
const CHILD_OFFSET: u32 = ${getViewElementOffset(props.childStates)}u;
const HEIGHT_OFFSET: u32 = ${getViewElementOffset(props.childHeights)}u;
@group(0) @binding(0) var<storage, read> parentStates: array<u32>;
@group(0) @binding(1) var<storage, read> childStates: array<u32>;
@group(0) @binding(2) var<storage, read_write> childHeights: array<u32>;

@compute @workgroup_size(${HIERARCHY_LAYOUT_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= CHILD_COUNT) {
    return;
  }
  let globalChildIndex = FIRST_CHILD + globalId.x;
  let childIndex = globalChildIndex - CHILD_BASE;
  let parentIndex = globalChildIndex / CHILDREN_PER_PARENT - PARENT_BASE;
  if (parentStates[PARENT_OFFSET + parentIndex] == 0u) {
    childHeights[HEIGHT_OFFSET + childIndex] = select(
      0u,
      COLLAPSED_PARENT_HEIGHT,
      globalChildIndex % CHILDREN_PER_PARENT == 0u
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
      parentStates: props.parentStates,
      childStates: props.childStates,
      childHeights: props.childHeights
    };
    graph.addComputePass({
      id: props.id,
      resources: [
        {buffer: props.parentStates, usage: 'storage-read'},
        {buffer: props.childStates, usage: 'storage-read'},
        {buffer: props.childHeights, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: props.id,
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
              Math.ceil(props.childCount / HIERARCHY_LAYOUT_WORKGROUP_SIZE)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}

/** Normalizes hierarchy data into ordered physical chunks. */
function getHierarchyChunks(data: GPUHierarchyLayoutData): readonly GraphDataView<'uint32'>[] {
  return data instanceof GraphVectorView ? data.data : [data];
}

/** Adds stable cumulative row bases without modifying caller-owned chunk metadata. */
function getHierarchyChunkRanges(data: GPUHierarchyLayoutData): Array<{
  index: number;
  base: number;
  view: GraphDataView<'uint32'>;
}> {
  let base = 0;
  return getHierarchyChunks(data).map((view, index) => {
    const range = {index, base, view};
    base += view.length;
    return range;
  });
}

/** Validates every hierarchy partition as packed unsigned scalar data. */
function validateHierarchyData(data: GPUHierarchyLayoutData, name: string): void {
  for (const [chunkIndex, view] of getHierarchyChunks(data).entries()) {
    const chunkName = data instanceof GraphVectorView ? `${name} chunk ${chunkIndex}` : name;
    validatePackedUint32View(view, chunkName);
  }
}

/** Requires child-aligned outputs to preserve the source partition topology. */
function validateChildOutputTopology(
  childStates: GPUHierarchyLayoutData,
  output: GPUHierarchyLayoutData,
  name: string
): void {
  if (childStates instanceof GraphVectorView !== output instanceof GraphVectorView) {
    throw new Error(`${name} must use the same data-view or vector-view kind as childStates`);
  }
  if (childStates instanceof GraphVectorView && output instanceof GraphVectorView) {
    validateMatchingVectorTopology(childStates, output, name);
  }
}

/** Returns the logical buffers referenced by one hierarchy input or output. */
function getHierarchyBuffers(data: GPUHierarchyLayoutData) {
  return getHierarchyChunks(data).map(view => view.buffer);
}
