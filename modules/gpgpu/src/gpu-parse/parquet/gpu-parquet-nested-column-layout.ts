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
  /** One scalar count chunk per source page. */
  elementCounts: GraphVectorView<'uint32'>;
  /** One scalar count chunk per source page. */
  rowCounts: GraphVectorView<'uint32'>;
}>;

/** Chunk-preserving result returned while the graph is still mutable. */
export type GPUParquetNestedColumnLayoutResult = Readonly<{
  /** Leaf presence flags aligned with encoded level slots. */
  validity: GraphVectorView<'uint32'>;
  /** Exclusive dense physical-value indices aligned with encoded level slots. */
  valueOffsets: GraphVectorView<'uint32'>;
  /** One non-null value count per source page. */
  nonNullValueCounts: GraphVectorView<'uint32'>;
  /** One result for every requested schema depth, in input order. */
  depths: readonly GPUParquetNestedColumnDepthLayout[];
}>;

/**
 * Materializes a required, optional, list, or nested-list Parquet column without CPU readback.
 *
 * The operation preserves the input `GraphVectorView` page topology. Leaf validity is classified
 * and scanned once per page, while each requested schema depth receives its own logical-element
 * and segment offsets. Returned transient views can be connected directly to later graph nodes;
 * adapters that require durable `GPUData`/`GPUVector` objects should copy chosen views into
 * caller-owned buffers and retain the same chunk order.
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

  /** Adds page-local classifiers and generic offset operations, then returns composable views. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): GPUParquetNestedColumnLayoutResult {
    const {definitionLevels, repetitionLevels} = this.props;
    const validityChunks: GraphDataView<'uint32'>[] = [];
    const valueOffsetChunks: GraphDataView<'uint32'>[] = [];
    const nonNullValueCountChunks: GraphDataView<'uint32'>[] = [];
    const depthChunks = this.props.depths.map(() => ({
      elementFlags: [] as GraphDataView<'uint32'>[],
      elementOffsets: [] as GraphDataView<'uint32'>[],
      rowStartFlags: [] as GraphDataView<'uint32'>[],
      rowIndices: [] as GraphDataView<'uint32'>[],
      listOffsets: [] as GraphDataView<'uint32'>[],
      elementCounts: [] as GraphDataView<'uint32'>[],
      rowCounts: [] as GraphDataView<'uint32'>[]
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
      const chunkId = `${this.id}-chunk-${chunkIndex}`;
      const slotCount = definitionLevelChunk.length;
      const validity = createTransientView(graph, `${chunkId}-validity`, 'uint32', slotCount);
      const valueOffsets = createTransientView(
        graph,
        `${chunkId}-value-offsets`,
        'uint32',
        slotCount
      );
      const nonNullValueCount = createTransientView(
        graph,
        `${chunkId}-non-null-value-count`,
        'uint32',
        1
      );
      validityChunks.push(validity);
      valueOffsetChunks.push(valueOffsets);
      nonNullValueCountChunks.push(nonNullValueCount);

      for (let depthIndex = 0; depthIndex < this.props.depths.length; depthIndex++) {
        const depth = this.props.depths[depthIndex];
        const output = depthChunks[depthIndex];
        const depthId = `${chunkId}-${depth.name}`;
        const elementFlags = createTransientView(
          graph,
          `${depthId}-element-flags`,
          'uint32',
          slotCount
        );
        const elementOffsets = createTransientView(
          graph,
          `${depthId}-element-offsets`,
          'uint32',
          slotCount
        );
        const rowStartFlags = createTransientView(
          graph,
          `${depthId}-row-start-flags`,
          'uint32',
          slotCount
        );
        const rowIndices = createTransientView(
          graph,
          `${depthId}-row-indices`,
          'uint32',
          slotCount
        );
        const listOffsets = createTransientView(
          graph,
          `${depthId}-list-offsets`,
          'uint32',
          slotCount + 1
        );
        const elementCount = createTransientView(graph, `${depthId}-element-count`, 'uint32', 1);
        const rowCount = createTransientView(graph, `${depthId}-row-count`, 'uint32', 1);
        output.elementFlags.push(elementFlags);
        output.elementOffsets.push(elementOffsets);
        output.rowStartFlags.push(rowStartFlags);
        output.rowIndices.push(rowIndices);
        output.listOffsets.push(listOffsets);
        output.elementCounts.push(elementCount);
        output.rowCounts.push(rowCount);

        if (slotCount > 0) {
          addClassifyPass(graph, {
            id: `${depthId}-classify`,
            definitionLevels: definitionLevelChunk,
            repetitionLevels: repetitionLevelChunk,
            validity: depthIndex === 0 ? validity : undefined,
            elementFlags,
            rowStartFlags,
            maxDefinitionLevel: this.props.maxDefinitionLevel,
            elementDefinitionLevel: depth.elementDefinitionLevel,
            rowStartRepetitionLevel: depth.rowStartRepetitionLevel
          });
        }
        if (depthIndex === 0) {
          new GPUFlagOffsets({
            id: `${chunkId}-leaf-values`,
            flags: validity,
            offsets: valueOffsets,
            count: nonNullValueCount
          }).addToGraph(graph);
        }
        new GPUFlagOffsets({
          id: `${depthId}-elements`,
          flags: elementFlags,
          offsets: elementOffsets,
          count: elementCount
        }).addToGraph(graph);
        new GPUSegmentOffsets({
          id: `${depthId}-rows`,
          elementFlags,
          elementOffsets,
          segmentStartFlags: rowStartFlags,
          segmentIndices: rowIndices,
          segmentOffsets: listOffsets,
          segmentCount: rowCount
        }).addToGraph(graph);
      }
    }

    return Object.freeze({
      validity: makeVector(`${this.id}-validity`, validityChunks),
      valueOffsets: makeVector(`${this.id}-value-offsets`, valueOffsetChunks),
      nonNullValueCounts: makeVector(`${this.id}-non-null-value-counts`, nonNullValueCountChunks),
      depths: Object.freeze(
        this.props.depths.map((depth, depthIndex) => {
          const chunks = depthChunks[depthIndex];
          return Object.freeze({
            name: depth.name,
            elementFlags: makeVector(`${this.id}-${depth.name}-element-flags`, chunks.elementFlags),
            elementOffsets: makeVector(
              `${this.id}-${depth.name}-element-offsets`,
              chunks.elementOffsets
            ),
            rowStartFlags: makeVector(
              `${this.id}-${depth.name}-row-start-flags`,
              chunks.rowStartFlags
            ),
            rowIndices: makeVector(`${this.id}-${depth.name}-row-indices`, chunks.rowIndices),
            listOffsets: makeVector(`${this.id}-${depth.name}-list-offsets`, chunks.listOffsets),
            elementCounts: makeVector(
              `${this.id}-${depth.name}-element-counts`,
              chunks.elementCounts
            ),
            rowCounts: makeVector(`${this.id}-${depth.name}-row-counts`, chunks.rowCounts)
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
    index > 0u && repetitionLevels[REPETITION_OFFSET + index] <= ROW_START_REPETITION_LEVEL
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
