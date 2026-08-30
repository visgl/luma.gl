// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPUScan,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

const WORKGROUP_SIZE = 256;

export type GPUParquetLevelLayoutProps = {
  id?: string;
  /** Decoded definition levels, one per encoded slot. */
  definitionLevels: GraphDataView<'uint32'>;
  /** Decoded repetition levels, one per encoded slot. */
  repetitionLevels: GraphDataView<'uint32'>;
  /** One for a present physical value, zero for null or structural slots. */
  validity: GraphDataView<'uint32'>;
  /** Exclusive dense physical-value index for every encoded slot. */
  valueOffsets: GraphDataView<'uint32'>;
  /** One when a slot represents a logical child element, including nullable children. */
  elementFlags: GraphDataView<'uint32'>;
  /** Exclusive dense logical-child index for every encoded slot. */
  elementOffsets: GraphDataView<'uint32'>;
  /** One when a slot starts a new row/container, except slot zero. */
  rowStartFlags: GraphDataView<'uint32'>;
  /** Dense zero-based row/container index for every encoded slot. */
  rowIndices: GraphDataView<'uint32'>;
  /** Dense physical-value offsets for each row plus one terminal offset. */
  listOffsets: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of present physical values. */
  nonNullValueCount: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of logical child elements. */
  elementCount: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of rows/containers. */
  rowCount: GraphDataView<'uint32'>;
  maxDefinitionLevel: number;
  /** Minimum definition level at which this repeated depth contains one logical child. */
  elementDefinitionLevel: number;
  /** A slot starts a container when its repetition level is at most this level. */
  rowStartRepetitionLevel: number;
};

/**
 * Materializes one Parquet nesting depth from decoded definition and repetition levels.
 *
 * Run this once for each repeated ancestor that needs offsets. The operation emits validity and
 * dense value indices for leaf decoding, row indices for scatter/gather composition, and Arrow-like
 * list offsets without reading the decoded values back to JavaScript.
 */
export class GPUParquetLevelLayout {
  readonly id: string;
  readonly props: Readonly<GPUParquetLevelLayoutProps>;

  constructor(props: GPUParquetLevelLayoutProps) {
    this.id = props.id ?? 'gpu-parquet-level-layout';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    for (const view of Object.values(props).filter(
      (value): value is GraphDataView<'uint32'> =>
        typeof value === 'object' && value !== null && 'buffer' in value
    )) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.definitionLevels.length === 0) {
      addEmptyPass(graph, props);
      return;
    }
    addClassifyPass(graph, props);
    new GPUScan({
      id: `${this.id}-value-offsets`,
      input: props.validity,
      output: props.valueOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-element-offsets`,
      input: props.elementFlags,
      output: props.elementOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-row-indices`,
      input: props.rowStartFlags,
      output: props.rowIndices,
      mode: 'inclusive'
    }).addToGraph(graph);
    addFinalizePass(graph, props);
  }
}

function addEmptyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUParquetLevelLayoutProps>
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUParquetLevelLayoutEmpty',
    1,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const LIST_OFFSET: u32 = ${getViewElementOffset(props.listOffsets)}u;
const NON_NULL_COUNT_OFFSET: u32 = ${getViewElementOffset(props.nonNullValueCount)}u;
const ELEMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.elementCount)}u;
const ROW_COUNT_OFFSET: u32 = ${getViewElementOffset(props.rowCount)}u;
@group(0) @binding(0) var<storage, read_write> listOffsets: array<u32>;
@group(0) @binding(1) var<storage, read_write> nonNullValueCount: array<u32>;
@group(0) @binding(2) var<storage, read_write> elementCount: array<u32>;
@group(0) @binding(3) var<storage, read_write> rowCount: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, WORKGROUP_SIZE)}
  if (index > 0u) { return; }
  listOffsets[LIST_OFFSET] = 0u;
  nonNullValueCount[NON_NULL_COUNT_OFFSET] = 0u;
  elementCount[ELEMENT_COUNT_OFFSET] = 0u;
  rowCount[ROW_COUNT_OFFSET] = 0u;
}`;
  addPass(
    graph,
    `${props.id}-empty`,
    'GPUParquetLevelLayoutEmpty',
    source,
    1,
    [
      {name: 'listOffsets', view: props.listOffsets, usage: 'storage-write'},
      {name: 'nonNullValueCount', view: props.nonNullValueCount, usage: 'storage-write'},
      {name: 'elementCount', view: props.elementCount, usage: 'storage-write'},
      {name: 'rowCount', view: props.rowCount, usage: 'storage-write'}
    ],
    dispatchLayout
  );
}

function addClassifyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUParquetLevelLayoutProps>
): void {
  const length = props.definitionLevels.length;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUParquetLevelLayoutClassify',
    length,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const LENGTH: u32 = ${length}u;
const MAX_DEFINITION_LEVEL: u32 = ${props.maxDefinitionLevel}u;
const ELEMENT_DEFINITION_LEVEL: u32 = ${props.elementDefinitionLevel}u;
const ROW_START_REPETITION_LEVEL: u32 = ${props.rowStartRepetitionLevel}u;
const DEFINITION_OFFSET: u32 = ${getViewElementOffset(props.definitionLevels)}u;
const REPETITION_OFFSET: u32 = ${getViewElementOffset(props.repetitionLevels)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(props.validity)}u;
const ELEMENT_FLAG_OFFSET: u32 = ${getViewElementOffset(props.elementFlags)}u;
const ROW_START_OFFSET: u32 = ${getViewElementOffset(props.rowStartFlags)}u;
@group(0) @binding(0) var<storage, read> definitionLevels: array<u32>;
@group(0) @binding(1) var<storage, read> repetitionLevels: array<u32>;
@group(0) @binding(2) var<storage, read_write> validity: array<u32>;
@group(0) @binding(3) var<storage, read_write> elementFlags: array<u32>;
@group(0) @binding(4) var<storage, read_write> rowStartFlags: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, WORKGROUP_SIZE)}
  if (index >= LENGTH) { return; }
  validity[VALIDITY_OFFSET + index] = select(0u, 1u, definitionLevels[DEFINITION_OFFSET + index] == MAX_DEFINITION_LEVEL);
  elementFlags[ELEMENT_FLAG_OFFSET + index] = select(0u, 1u, definitionLevels[DEFINITION_OFFSET + index] >= ELEMENT_DEFINITION_LEVEL);
  rowStartFlags[ROW_START_OFFSET + index] = select(
    0u,
    1u,
    index > 0u && repetitionLevels[REPETITION_OFFSET + index] <= ROW_START_REPETITION_LEVEL
  );
}`;
  addPass(
    graph,
    `${props.id}-classify`,
    'GPUParquetLevelLayoutClassify',
    source,
    length,
    [
      {name: 'definitionLevels', view: props.definitionLevels, usage: 'storage-read'},
      {name: 'repetitionLevels', view: props.repetitionLevels, usage: 'storage-read'},
      {name: 'validity', view: props.validity, usage: 'storage-write'},
      {name: 'elementFlags', view: props.elementFlags, usage: 'storage-write'},
      {name: 'rowStartFlags', view: props.rowStartFlags, usage: 'storage-write'}
    ],
    dispatchLayout
  );
}

function addFinalizePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUParquetLevelLayoutProps>
): void {
  const length = props.definitionLevels.length;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUParquetLevelLayoutFinalize',
    length,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const LENGTH: u32 = ${length}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(props.validity)}u;
const VALUE_OFFSET: u32 = ${getViewElementOffset(props.valueOffsets)}u;
const ELEMENT_FLAG_OFFSET: u32 = ${getViewElementOffset(props.elementFlags)}u;
const ELEMENT_OFFSET: u32 = ${getViewElementOffset(props.elementOffsets)}u;
const ROW_START_OFFSET: u32 = ${getViewElementOffset(props.rowStartFlags)}u;
const ROW_INDEX_OFFSET: u32 = ${getViewElementOffset(props.rowIndices)}u;
const LIST_OFFSET: u32 = ${getViewElementOffset(props.listOffsets)}u;
const NON_NULL_COUNT_OFFSET: u32 = ${getViewElementOffset(props.nonNullValueCount)}u;
const ELEMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.elementCount)}u;
const ROW_COUNT_OFFSET: u32 = ${getViewElementOffset(props.rowCount)}u;
@group(0) @binding(0) var<storage, read> validity: array<u32>;
@group(0) @binding(1) var<storage, read> valueOffsets: array<u32>;
@group(0) @binding(2) var<storage, read> rowStartFlags: array<u32>;
@group(0) @binding(3) var<storage, read> rowIndices: array<u32>;
@group(0) @binding(4) var<storage, read> elementFlags: array<u32>;
@group(0) @binding(5) var<storage, read> elementOffsets: array<u32>;
@group(0) @binding(6) var<storage, read_write> listOffsets: array<u32>;
@group(0) @binding(7) var<storage, read_write> nonNullValueCount: array<u32>;
@group(0) @binding(8) var<storage, read_write> elementCount: array<u32>;
@group(0) @binding(9) var<storage, read_write> rowCount: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, WORKGROUP_SIZE)}
  if (index >= LENGTH) { return; }
  if (index == 0u) { listOffsets[LIST_OFFSET] = 0u; }
  if (rowStartFlags[ROW_START_OFFSET + index] != 0u) {
    listOffsets[LIST_OFFSET + rowIndices[ROW_INDEX_OFFSET + index]] = elementOffsets[ELEMENT_OFFSET + index];
  }
  if (index + 1u == LENGTH) {
    let valueCount = valueOffsets[VALUE_OFFSET + index] + validity[VALIDITY_OFFSET + index];
    let logicalElementCount = elementOffsets[ELEMENT_OFFSET + index] + elementFlags[ELEMENT_FLAG_OFFSET + index];
    let rows = rowIndices[ROW_INDEX_OFFSET + index] + 1u;
    nonNullValueCount[NON_NULL_COUNT_OFFSET] = valueCount;
    elementCount[ELEMENT_COUNT_OFFSET] = logicalElementCount;
    rowCount[ROW_COUNT_OFFSET] = rows;
    listOffsets[LIST_OFFSET + rows] = logicalElementCount;
  }
}`;
  addPass(
    graph,
    `${props.id}-finalize`,
    'GPUParquetLevelLayoutFinalize',
    source,
    length,
    [
      {name: 'validity', view: props.validity, usage: 'storage-read'},
      {name: 'valueOffsets', view: props.valueOffsets, usage: 'storage-read'},
      {name: 'rowStartFlags', view: props.rowStartFlags, usage: 'storage-read'},
      {name: 'rowIndices', view: props.rowIndices, usage: 'storage-read'},
      {name: 'elementFlags', view: props.elementFlags, usage: 'storage-read'},
      {name: 'elementOffsets', view: props.elementOffsets, usage: 'storage-read'},
      {name: 'listOffsets', view: props.listOffsets, usage: 'storage-write'},
      {name: 'nonNullValueCount', view: props.nonNullValueCount, usage: 'storage-write'},
      {name: 'elementCount', view: props.elementCount, usage: 'storage-write'},
      {name: 'rowCount', view: props.rowCount, usage: 'storage-write'}
    ],
    dispatchLayout
  );
}

type PassResource = {
  name: string;
  view: GraphDataView<'uint32'>;
  usage: 'storage-read' | 'storage-write';
};

function addPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  operation: string,
  source: string,
  length: number,
  resources: PassResource[],
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>
): void {
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

function validateConfiguration(props: Readonly<GPUParquetLevelLayoutProps>): void {
  const valueCount = props.definitionLevels.length;
  for (const [name, view] of Object.entries({
    definitionLevels: props.definitionLevels,
    repetitionLevels: props.repetitionLevels,
    validity: props.validity,
    valueOffsets: props.valueOffsets,
    elementFlags: props.elementFlags,
    elementOffsets: props.elementOffsets,
    rowStartFlags: props.rowStartFlags,
    rowIndices: props.rowIndices,
    listOffsets: props.listOffsets,
    nonNullValueCount: props.nonNullValueCount,
    elementCount: props.elementCount,
    rowCount: props.rowCount
  })) {
    validatePackedUint32View(view, `${props.id} ${name}`);
  }
  for (const view of [
    props.repetitionLevels,
    props.validity,
    props.valueOffsets,
    props.elementFlags,
    props.elementOffsets,
    props.rowStartFlags,
    props.rowIndices
  ]) {
    if (view.length < valueCount) {
      throw new Error(`${props.id} slot-aligned views must cover every level`);
    }
  }
  if (
    props.listOffsets.length < valueCount + 1 ||
    props.nonNullValueCount.length < 1 ||
    props.elementCount.length < 1 ||
    props.rowCount.length < 1
  ) {
    throw new Error(`${props.id} result views are too short`);
  }
  for (const [name, value] of Object.entries({
    maxDefinitionLevel: props.maxDefinitionLevel,
    elementDefinitionLevel: props.elementDefinitionLevel,
    rowStartRepetitionLevel: props.rowStartRepetitionLevel
  })) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error(`${props.id} ${name} must be a non-negative uint32`);
    }
  }
}
