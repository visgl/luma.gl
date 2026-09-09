// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {GPUScan, type GPUScanInput} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

/** Properties for publishing list-style offsets from logical elements and segment starts. */
export type GPUSegmentOffsetsProps = {
  id?: string;
  /** Zero-or-one flags for logical elements, including null elements. */
  elementFlags: GPUScanInput;
  /** Exclusive dense logical-element offsets, normally produced by {@link GPUFlagOffsets}. */
  elementOffsets: GPUScanInput;
  /** One when a slot starts a segment, including the first segment. */
  segmentStartFlags: GPUScanInput;
  /** Dense zero-based segment index for every slot. */
  segmentIndices: GPUScanInput;
  /** Logical-element offset for every segment plus one terminal offset. */
  segmentOffsets: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of segments. */
  segmentCount: GraphDataView<'uint32'>;
};

/**
 * Converts segment-start flags and precomputed logical-element offsets into list-style offsets.
 *
 * Use this after {@link GPUFlagOffsets} when multiple logical element streams share a physical
 * value-selection stream, as in nested columns. The separation prevents repeated scans of shared
 * leaf validity while retaining a small generic operation useful for groups, runs, and lists.
 */
export class GPUSegmentOffsets {
  readonly id: string;
  readonly props: Readonly<GPUSegmentOffsetsProps>;

  constructor(props: GPUSegmentOffsetsProps) {
    this.id = props.id ?? 'gpu-segment-offsets';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  /** Adds a segment-index scan followed by segment-offset and count publication passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [
      ...getChunks(this.props.elementFlags),
      ...getChunks(this.props.elementOffsets),
      ...getChunks(this.props.segmentStartFlags),
      ...getChunks(this.props.segmentIndices),
      this.props.segmentOffsets,
      this.props.segmentCount
    ]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.props.elementFlags.length === 0) {
      addEmptyPass(graph, this.props);
      return;
    }
    new GPUScan({
      id: `${this.id}-segment-indices`,
      input: this.props.segmentStartFlags,
      output: this.props.segmentIndices,
      mode: 'exclusive'
    }).addToGraph(graph);
    const elementFlagChunks = getChunks(this.props.elementFlags);
    const elementOffsetChunks = getChunks(this.props.elementOffsets);
    const segmentStartFlagChunks = getChunks(this.props.segmentStartFlags);
    const segmentIndexChunks = getChunks(this.props.segmentIndices);
    for (let chunkIndex = 0; chunkIndex < elementFlagChunks.length; chunkIndex++) {
      if (elementFlagChunks[chunkIndex].length > 0) {
        addSegmentOffsetsPass(graph, {
          ...this.props,
          id: `${this.id}-chunk-${chunkIndex}`,
          elementFlags: elementFlagChunks[chunkIndex],
          elementOffsets: elementOffsetChunks[chunkIndex],
          segmentStartFlags: segmentStartFlagChunks[chunkIndex],
          segmentIndices: segmentIndexChunks[chunkIndex]
        });
      }
    }
    addSegmentCountPass(graph, this.props);
  }
}

type PassResource = {
  name: string;
  view: GraphDataView<'uint32'>;
  usage: 'storage-read' | 'storage-write';
};

function addEmptyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentOffsetsProps>
): void {
  const source = `const SEGMENT_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.segmentOffsets)}u;
const SEGMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.segmentCount)}u;
@group(0) @binding(0) var<storage, read_write> segmentOffsets: array<u32>;
@group(0) @binding(1) var<storage, read_write> segmentCount: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_index) localInvocationIndex: u32) {
  if (localInvocationIndex > 0u) { return; }
  segmentOffsets[SEGMENT_OFFSETS_OFFSET] = 0u;
  segmentCount[SEGMENT_COUNT_OFFSET] = 0u;
}`;
  addPass(graph, `${props.id}-empty`, 'GPUSegmentOffsetsEmpty', source, 1, [
    {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'},
    {name: 'segmentCount', view: props.segmentCount, usage: 'storage-write'}
  ]);
}

function addSegmentOffsetsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentOffsetsProps> & {
    elementFlags: GraphDataView<'uint32'>;
    elementOffsets: GraphDataView<'uint32'>;
    segmentStartFlags: GraphDataView<'uint32'>;
    segmentIndices: GraphDataView<'uint32'>;
  }
): void {
  const length = props.elementFlags.length;
  const source = `const LENGTH: u32 = ${length}u;
const ELEMENT_OFFSET: u32 = ${getViewElementOffset(props.elementOffsets)}u;
const SEGMENT_START_OFFSET: u32 = ${getViewElementOffset(props.segmentStartFlags)}u;
const SEGMENT_INDEX_OFFSET: u32 = ${getViewElementOffset(props.segmentIndices)}u;
const SEGMENT_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.segmentOffsets)}u;
@group(0) @binding(0) var<storage, read> segmentStartFlags: array<u32>;
@group(0) @binding(1) var<storage, read> segmentIndices: array<u32>;
@group(0) @binding(2) var<storage, read> elementOffsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> segmentOffsets: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(
    getBoundedDispatchLayout(
      'GPUSegmentOffsetsPublish',
      length,
      WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    ),
    WORKGROUP_SIZE
  )}
  if (index >= LENGTH) { return; }
  if (segmentStartFlags[SEGMENT_START_OFFSET + index] != 0u) {
    segmentOffsets[SEGMENT_OFFSETS_OFFSET + segmentIndices[SEGMENT_INDEX_OFFSET + index]] =
      elementOffsets[ELEMENT_OFFSET + index];
  }
}`;
  addPass(graph, `${props.id}-publish`, 'GPUSegmentOffsetsPublish', source, length, [
    {name: 'segmentStartFlags', view: props.segmentStartFlags, usage: 'storage-read'},
    {name: 'segmentIndices', view: props.segmentIndices, usage: 'storage-read'},
    {name: 'elementOffsets', view: props.elementOffsets, usage: 'storage-read'},
    {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'}
  ]);
}

function addSegmentCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentOffsetsProps>
): void {
  const elementFlagChunk = getLastNonEmptyChunk(props.elementFlags);
  const elementOffsetChunk = getLastNonEmptyChunk(props.elementOffsets);
  const segmentStartFlagChunk = getLastNonEmptyChunk(props.segmentStartFlags);
  const segmentIndexChunk = getLastNonEmptyChunk(props.segmentIndices);
  const source = `const LAST_INDEX: u32 = ${elementFlagChunk.length - 1}u;
const ELEMENT_FLAG_OFFSET: u32 = ${getViewElementOffset(elementFlagChunk)}u;
const ELEMENT_OFFSET: u32 = ${getViewElementOffset(elementOffsetChunk)}u;
const SEGMENT_START_OFFSET: u32 = ${getViewElementOffset(segmentStartFlagChunk)}u;
const SEGMENT_INDEX_OFFSET: u32 = ${getViewElementOffset(segmentIndexChunk)}u;
const SEGMENT_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.segmentOffsets)}u;
const SEGMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.segmentCount)}u;
@group(0) @binding(0) var<storage, read> elementFlags: array<u32>;
@group(0) @binding(1) var<storage, read> elementOffsets: array<u32>;
@group(0) @binding(2) var<storage, read> segmentStartFlags: array<u32>;
@group(0) @binding(3) var<storage, read> segmentIndices: array<u32>;
@group(0) @binding(4) var<storage, read_write> segmentOffsets: array<u32>;
@group(0) @binding(5) var<storage, read_write> segmentCount: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_index) localInvocationIndex: u32) {
  if (localInvocationIndex > 0u) { return; }
  let count = segmentIndices[SEGMENT_INDEX_OFFSET + LAST_INDEX] +
    segmentStartFlags[SEGMENT_START_OFFSET + LAST_INDEX];
  let elementCount = elementOffsets[ELEMENT_OFFSET + LAST_INDEX] +
    elementFlags[ELEMENT_FLAG_OFFSET + LAST_INDEX];
  segmentOffsets[SEGMENT_OFFSETS_OFFSET + count] = elementCount;
  segmentCount[SEGMENT_COUNT_OFFSET] = count;
}`;
  addPass(graph, `${props.id}-count`, 'GPUSegmentOffsetsCount', source, 1, [
    {name: 'elementFlags', view: elementFlagChunk, usage: 'storage-read'},
    {name: 'elementOffsets', view: elementOffsetChunk, usage: 'storage-read'},
    {name: 'segmentStartFlags', view: segmentStartFlagChunk, usage: 'storage-read'},
    {name: 'segmentIndices', view: segmentIndexChunk, usage: 'storage-read'},
    {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'},
    {name: 'segmentCount', view: props.segmentCount, usage: 'storage-write'}
  ]);
}

function addPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  operation: string,
  source: string,
  length: number,
  resources: PassResource[]
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    operation,
    length,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const workgroupCount = Math.ceil(length / WORKGROUP_SIZE);
  graph.addComputePass({
    id,
    workload: {
      operation,
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * WORKGROUP_SIZE,
      readByteLength:
        resources.filter(resource => resource.usage === 'storage-read').length * length * 4,
      writeByteLength:
        resources.filter(resource => resource.usage === 'storage-write').length * length * 4
    },
    resources: resources.map(resource => ({buffer: resource.view, usage: resource.usage})),
    compile: ({device}) => {
      const computation = new Computation(device, {
        id,
        source,
        shaderLayout: {
          bindings: resources.map((resource, location) => ({
            name: resource.name,
            type: resource.usage === 'storage-read' ? 'read-only-storage' : 'storage',
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const resource of resources) {
            bindings[resource.name] = getViewBinding(resource.view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(props: Readonly<GPUSegmentOffsetsProps>): void {
  const slotCount = props.elementFlags.length;
  for (const [name, input] of Object.entries({
    elementFlags: props.elementFlags,
    elementOffsets: props.elementOffsets,
    segmentStartFlags: props.segmentStartFlags,
    segmentIndices: props.segmentIndices
  })) {
    for (const view of getChunks(input)) {
      validatePackedUint32View(view, `${props.id} ${name}`);
    }
  }
  validatePackedUint32View(props.segmentOffsets, `${props.id} segmentOffsets`);
  validatePackedUint32View(props.segmentCount, `${props.id} segmentCount`);
  const elementFlagsAreVector = props.elementFlags instanceof GraphVectorView;
  for (const input of [props.elementOffsets, props.segmentStartFlags, props.segmentIndices]) {
    if (elementFlagsAreVector !== input instanceof GraphVectorView) {
      throw new Error(`${props.id} slot-aligned inputs must use the same view kind`);
    }
    if (props.elementFlags instanceof GraphVectorView && input instanceof GraphVectorView) {
      validateMatchingVectorTopology(props.elementFlags, input, `${props.id} slot-aligned inputs`);
    } else if (input.length < slotCount) {
      throw new Error(`${props.id} slot-aligned views must cover every element flag`);
    }
  }
  if (props.segmentOffsets.length < slotCount + 1 || props.segmentCount.length < 1) {
    throw new Error(`${props.id} result views are too short`);
  }
}

function getChunks(input: GPUScanInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

function getLastNonEmptyChunk(input: GPUScanInput): GraphDataView<'uint32'> {
  const chunks = getChunks(input);
  for (let chunkIndex = chunks.length - 1; chunkIndex >= 0; chunkIndex--) {
    if (chunks[chunkIndex].length > 0) {
      return chunks[chunkIndex];
    }
  }
  throw new Error('Non-empty GPUSegmentOffsets input requires a non-empty chunk');
}
