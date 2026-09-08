// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPUFlagOffsets,
  GPUSegmentOffsets,
  GraphVectorView,
  createTransientView as createGraphTransientView,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

const WORKGROUP_SIZE = 256;

function createTransientView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  format: 'uint32',
  length: number
): GraphDataView<'uint32'> {
  return createGraphTransientView(graph, id, format, length, Buffer.STORAGE | Buffer.COPY_SRC);
}

/** One repeated ancestor or scalar root to materialize from shared Parquet levels. */
export type GPUParquetNestedColumnDepth = Readonly<{
  /** Stable name used in result metadata and generated graph node IDs. */
  name: string;
  /** Minimum definition level at which this depth contains one logical child. */
  elementDefinitionLevel: number;
  /** A slot starts a container at this depth when its repetition level is at most this value. */
  rowStartRepetitionLevel: number;
}>;

/** Properties for chunk-preserving materialization of a nested Parquet column. */
export type GPUParquetNestedColumnLayoutProps = {
  id?: string;
  /** Decoded definition-level chunks, normally one chunk per Parquet data page. */
  definitionLevels: GraphVectorView<'uint32'>;
  /** Repetition-level chunks with the same page topology as `definitionLevels`. */
  repetitionLevels: GraphVectorView<'uint32'>;
  /** Definition level at which the leaf owns a physical value. */
  maxDefinitionLevel: number;
  /** Ordered schema depths, from the root/scalar row depth toward the leaf. */
  depths: readonly GPUParquetNestedColumnDepth[];
};

/** GPU-resident layout streams for one requested nesting depth. */
export type GPUParquetNestedColumnDepthLayout = Readonly<{
  name: string;
  elementFlags: GraphVectorView<'uint32'>;
  elementOffsets: GraphVectorView<'uint32'>;
  rowStartFlags: GraphVectorView<'uint32'>;
  rowIndices: GraphVectorView<'uint32'>;
  listOffsets: GraphVectorView<'uint32'>;
  /** One scalar count for the complete chunked column. */
  elementCounts: GraphVectorView<'uint32'>;
  /** One scalar count for the complete chunked column. */
  rowCounts: GraphVectorView<'uint32'>;
}>;

/** Chunk-preserving result returned while the graph is still mutable. */
export type GPUParquetNestedColumnLayoutResult = Readonly<{
  /** Leaf presence flags aligned with encoded level slots. */
  validity: GraphVectorView<'uint32'>;
  /** Exclusive dense physical-value indices aligned with encoded level slots. */
  valueOffsets: GraphVectorView<'uint32'>;
  /** One non-null value count for the complete chunked column. */
  nonNullValueCounts: GraphVectorView<'uint32'>;
  /** One result for every requested schema depth, in input order. */
  depths: readonly GPUParquetNestedColumnDepthLayout[];
}>;

/**
 * Materializes a required, optional, list, or nested-list Parquet column without CPU readback.
 *
 * The operation preserves the input `GraphVectorView` page topology for slot-aligned streams while
 * scans carry offsets across page boundaries. Each requested schema depth receives one global
 * list-offset stream, so a repeated row that begins on one page and continues on the next remains
 * one row. Returned transient views can be connected directly to later graph nodes; adapters that
 * require durable `GPUData`/`GPUVector` objects should copy chosen views into caller-owned buffers.
 *
 * Compile the completed command graph once and rebind imported input buffers for later batches
 * with the same page sizes. The operation performs no allocation, parsing, submission, or mapping
 * during graph execution.
 */
export class GPUParquetNestedColumnLayout {
  readonly id: string;
  readonly props: Readonly<GPUParquetNestedColumnLayoutProps>;

  constructor(props: GPUParquetNestedColumnLayoutProps) {
    this.id = props.id ?? 'gpu-parquet-nested-column-layout';
    this.props = Object.freeze({...props, id: this.id, depths: Object.freeze([...props.depths])});
    validateConfiguration(this.props);
  }

  /** Adds page classifiers and chunk-spanning generic offset operations. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): GPUParquetNestedColumnLayoutResult {
    const {definitionLevels, repetitionLevels} = this.props;
    const validity = createOutputVector(graph, `${this.id}-validity`, definitionLevels);
    const valueOffsets = createOutputVector(graph, `${this.id}-value-offsets`, definitionLevels);
    const nonNullValueCount = createTransientView(
      graph,
      `${this.id}-non-null-value-count`,
      'uint32',
      1
    );
    const depthOutputs = this.props.depths.map(depth => ({
      elementFlags: createOutputVector(
        graph,
        `${this.id}-${depth.name}-element-flags`,
        definitionLevels
      ),
      elementOffsets: createOutputVector(
        graph,
        `${this.id}-${depth.name}-element-offsets`,
        definitionLevels
      ),
      rowStartFlags: createOutputVector(
        graph,
        `${this.id}-${depth.name}-row-start-flags`,
        definitionLevels
      ),
      rowIndices: createOutputVector(
        graph,
        `${this.id}-${depth.name}-row-indices`,
        definitionLevels
      ),
      listOffsets: createTransientView(
        graph,
        `${this.id}-${depth.name}-list-offsets`,
        'uint32',
        definitionLevels.length + 1
      ),
      elementCount: createTransientView(
        graph,
        `${this.id}-${depth.name}-element-count`,
        'uint32',
        1
      ),
      rowCount: createTransientView(graph, `${this.id}-${depth.name}-row-count`, 'uint32', 1)
    }));

    for (let chunkIndex = 0; chunkIndex < definitionLevels.data.length; chunkIndex++) {
      const definitionLevelChunk = definitionLevels.data[chunkIndex];
      const repetitionLevelChunk = repetitionLevels.data[chunkIndex];
      if (
        definitionLevelChunk.buffer.graph !== graph ||
        repetitionLevelChunk.buffer.graph !== graph
      ) {
        throw new Error(`${this.id} inputs must belong to the target graph`);
      }
      const slotCount = definitionLevelChunk.length;
      const chunkId = `${this.id}-chunk-${chunkIndex}`;

      for (let depthIndex = 0; depthIndex < this.props.depths.length; depthIndex++) {
        const depth = this.props.depths[depthIndex];
        const output = depthOutputs[depthIndex];
        const depthId = `${chunkId}-${depth.name}`;

        if (slotCount > 0) {
          addClassifyPass(graph, {
            id: `${depthId}-classify`,
            definitionLevels: definitionLevelChunk,
            repetitionLevels: repetitionLevelChunk,
            validity: depthIndex === 0 ? validity.data[chunkIndex] : undefined,
            elementFlags: output.elementFlags.data[chunkIndex],
            rowStartFlags: output.rowStartFlags.data[chunkIndex],
            maxDefinitionLevel: this.props.maxDefinitionLevel,
            elementDefinitionLevel: depth.elementDefinitionLevel,
            rowDefinitionLevel:
              depthIndex === 0 ? 0 : this.props.depths[depthIndex - 1].elementDefinitionLevel,
            rowStartRepetitionLevel: depth.rowStartRepetitionLevel
          });
        }
      }
    }

    new GPUFlagOffsets({
      id: `${this.id}-leaf-values`,
      flags: validity,
      offsets: valueOffsets,
      count: nonNullValueCount
    }).addToGraph(graph);
    for (let depthIndex = 0; depthIndex < this.props.depths.length; depthIndex++) {
      const depth = this.props.depths[depthIndex];
      const output = depthOutputs[depthIndex];
      new GPUFlagOffsets({
        id: `${this.id}-${depth.name}-elements`,
        flags: output.elementFlags,
        offsets: output.elementOffsets,
        count: output.elementCount
      }).addToGraph(graph);
      new GPUSegmentOffsets({
        id: `${this.id}-${depth.name}-rows`,
        elementFlags: output.elementFlags,
        elementOffsets: output.elementOffsets,
        segmentStartFlags: output.rowStartFlags,
        segmentIndices: output.rowIndices,
        segmentOffsets: output.listOffsets,
        segmentCount: output.rowCount
      }).addToGraph(graph);
    }

    return Object.freeze({
      validity,
      valueOffsets,
      nonNullValueCounts: makeVector(`${this.id}-non-null-value-counts`, [nonNullValueCount]),
      depths: Object.freeze(
        this.props.depths.map((depth, depthIndex) => {
          const output = depthOutputs[depthIndex];
          return Object.freeze({
            name: depth.name,
            elementFlags: output.elementFlags,
            elementOffsets: output.elementOffsets,
            rowStartFlags: output.rowStartFlags,
            rowIndices: output.rowIndices,
            listOffsets: makeVector(`${this.id}-${depth.name}-list-offsets`, [output.listOffsets]),
            elementCounts: makeVector(`${this.id}-${depth.name}-element-counts`, [
              output.elementCount
            ]),
            rowCounts: makeVector(`${this.id}-${depth.name}-row-counts`, [output.rowCount])
          });
        })
      )
    });
  }
}

type ClassifyPassProps = {
  id: string;
  definitionLevels: GraphDataView<'uint32'>;
  repetitionLevels: GraphDataView<'uint32'>;
  validity?: GraphDataView<'uint32'>;
  elementFlags: GraphDataView<'uint32'>;
  rowStartFlags: GraphDataView<'uint32'>;
  maxDefinitionLevel: number;
  elementDefinitionLevel: number;
  rowDefinitionLevel: number;
  rowStartRepetitionLevel: number;
};

function addClassifyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: ClassifyPassProps
): void {
  const length = props.definitionLevels.length;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUParquetNestedColumnClassify',
    length,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const validityBinding = props.validity ? 2 : -1;
  const elementBinding = props.validity ? 3 : 2;
  const rowStartBinding = props.validity ? 4 : 3;
  const validitySource = props.validity
    ? `const VALIDITY_OFFSET: u32 = ${getViewElementOffset(props.validity)}u;
@group(0) @binding(${validityBinding}) var<storage, read_write> validity: array<u32>;`
    : '';
  const validityWrite = props.validity
    ? 'validity[VALIDITY_OFFSET + index] = select(0u, 1u, definitionLevel == MAX_DEFINITION_LEVEL);'
    : '';
  const source = `const LENGTH: u32 = ${length}u;
const MAX_DEFINITION_LEVEL: u32 = ${props.maxDefinitionLevel}u;
const ELEMENT_DEFINITION_LEVEL: u32 = ${props.elementDefinitionLevel}u;
const ROW_DEFINITION_LEVEL: u32 = ${props.rowDefinitionLevel}u;
const ROW_START_REPETITION_LEVEL: u32 = ${props.rowStartRepetitionLevel}u;
const DEFINITION_OFFSET: u32 = ${getViewElementOffset(props.definitionLevels)}u;
const REPETITION_OFFSET: u32 = ${getViewElementOffset(props.repetitionLevels)}u;
const ELEMENT_FLAG_OFFSET: u32 = ${getViewElementOffset(props.elementFlags)}u;
const ROW_START_OFFSET: u32 = ${getViewElementOffset(props.rowStartFlags)}u;
@group(0) @binding(0) var<storage, read> definitionLevels: array<u32>;
@group(0) @binding(1) var<storage, read> repetitionLevels: array<u32>;
${validitySource}
@group(0) @binding(${elementBinding}) var<storage, read_write> elementFlags: array<u32>;
@group(0) @binding(${rowStartBinding}) var<storage, read_write> rowStartFlags: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, WORKGROUP_SIZE)}
  if (index >= LENGTH) { return; }
  let definitionLevel = definitionLevels[DEFINITION_OFFSET + index];
  ${validityWrite}
  elementFlags[ELEMENT_FLAG_OFFSET + index] =
    select(0u, 1u, definitionLevel >= ELEMENT_DEFINITION_LEVEL);
  rowStartFlags[ROW_START_OFFSET + index] = select(
    0u,
    1u,
    definitionLevel >= ROW_DEFINITION_LEVEL &&
      repetitionLevels[REPETITION_OFFSET + index] <= ROW_START_REPETITION_LEVEL
  );
}`;
  const resources = [
    {name: 'definitionLevels', view: props.definitionLevels, usage: 'storage-read' as const},
    {name: 'repetitionLevels', view: props.repetitionLevels, usage: 'storage-read' as const},
    ...(props.validity
      ? [{name: 'validity', view: props.validity, usage: 'storage-write' as const}]
      : []),
    {name: 'elementFlags', view: props.elementFlags, usage: 'storage-write' as const},
    {name: 'rowStartFlags', view: props.rowStartFlags, usage: 'storage-write' as const}
  ];
  const workgroupCount = Math.ceil(length / WORKGROUP_SIZE);
  graph.addComputePass({
    id: props.id,
    workload: {
      operation: 'GPUParquetNestedColumnClassify',
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * WORKGROUP_SIZE,
      readByteLength: length * 8,
      writeByteLength: length * (props.validity ? 12 : 8)
    },
    resources: resources.map(resource => ({buffer: resource.view, usage: resource.usage})),
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
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

function makeVector(
  id: string,
  data: readonly GraphDataView<'uint32'>[]
): GraphVectorView<'uint32'> {
  const length = data.reduce((sum, chunk) => sum + chunk.length, 0);
  return new GraphVectorView({
    id,
    name: id,
    format: 'uint32',
    length,
    valueLength: length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data
  });
}

function createOutputVector<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  template: GraphVectorView<'uint32'>
): GraphVectorView<'uint32'> {
  const chunks = template.data.map((chunk, chunkIndex) =>
    createTransientView(graph, `${id}-chunk-${chunkIndex}`, 'uint32', chunk.length)
  );
  return makeVector(id, chunks);
}

function validateConfiguration(props: Readonly<GPUParquetNestedColumnLayoutProps>): void {
  validateMatchingVectorTopology(
    props.definitionLevels,
    props.repetitionLevels,
    `${props.id} definition and repetition levels`
  );
  for (const [name, vector] of Object.entries({
    definitionLevels: props.definitionLevels,
    repetitionLevels: props.repetitionLevels
  })) {
    if (vector.format !== 'uint32') {
      throw new Error(`${props.id} ${name} must use uint32 chunks`);
    }
    for (const chunk of vector.data) {
      validatePackedUint32View(chunk, `${props.id} ${name}`);
    }
  }
  if (props.depths.length === 0) {
    throw new Error(`${props.id} requires at least one schema depth`);
  }
  if (!isUint32(props.maxDefinitionLevel)) {
    throw new Error(`${props.id} maxDefinitionLevel must be a non-negative uint32`);
  }
  const names = new Set<string>();
  for (const depth of props.depths) {
    if (!depth.name || names.has(depth.name)) {
      throw new Error(`${props.id} depth names must be non-empty and unique`);
    }
    names.add(depth.name);
    if (!isUint32(depth.elementDefinitionLevel) || !isUint32(depth.rowStartRepetitionLevel)) {
      throw new Error(`${props.id} depth thresholds must be non-negative uint32 values`);
    }
    if (depth.elementDefinitionLevel > props.maxDefinitionLevel) {
      throw new Error(`${props.id} elementDefinitionLevel cannot exceed maxDefinitionLevel`);
    }
  }
}

function isUint32(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff;
}
