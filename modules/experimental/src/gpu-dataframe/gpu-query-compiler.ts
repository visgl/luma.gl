// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {
  Buffer,
  type Binding,
  type BufferLayout,
  type CommandEncoder,
  type Device,
  type DeviceLimits
} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUData, GPUVector, type GPUConstant, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {
  GPURecordBatch,
  GPUTable,
  type GPUField,
  type GPUTypeMap
} from '@luma.gl/experimental/gpu-tables';
import {
  type CompiledGPUCommandGraph,
  type GPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from '@luma.gl/gpgpu/gpu-core';
import {GPUScan, GPUVisibilityWorkflow} from '@luma.gl/gpgpu/gpu-core';
import {createTransientView, getViewBinding, getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import type {GPUDataFrame, GPUDataFrameDictionaries, GPUDataFrameValidity} from './gpu-data-frame';
import type {GPUDataFrameDerivedColumn} from './gpu-data-frame-query';
import type {GPUExpression} from './gpu-expression';
import {
  encodeGPUQueryExpressionControls,
  getGPUQueryShaderType,
  makeGPUQueryExpressionShaderPlan,
  type GPUQueryExpressionColumn,
  type GPUQueryExpressionOutput,
  type GPUQueryExpressionShaderPlan,
  type GPUQueryScalarFormat
} from './gpu-expression-shader';

const LU_QUERY_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const MAXIMUM_UINT32 = 0xffffffff;
const STORAGE_BINDING_ALIGNMENT = 256;

/** Caller-owned scalar values supplied to an already compiled dataframe filter. */
export type GPUDataFrameQueryParameters = Readonly<Record<string, number | boolean | null>>;

type GPUQuerySourceView = {
  values: GraphVectorView;
  validity?: GraphVectorView<'uint32'>;
};

type GPUQueryDerivedOutput = {
  plan: GPUQueryExpressionOutput;
  values: GPUVector<GPUQueryScalarFormat>;
  validity?: GPUVector<'uint32'>;
};

type GPUQueryDerivedView = {
  values: GraphVectorView<GPUQueryScalarFormat>;
  validity?: GraphVectorView<'uint32'>;
};

/** One resolved values/validity pair bound by a predicate pass. */
type GPUQueryPassViews = {
  values: GraphDataView;
  validity?: GraphDataView<'uint32'>;
};

/**
 * One source batch evaluated by its own predicate pass and visibility workflow. @internal
 */
export type GPUQuerySingleBatchSegment = {
  type: 'batch';
  /** Index of the source batch. */
  batchIndex: number;
  /** Number of rows in the batch. */
  numRows: number;
  /** First stable source-row ID of the batch. */
  sourceStart: number;
};

/**
 * Consecutive source batches whose predicate inputs are contiguous views of shared buffers.
 *
 * One predicate, scan, scatter, and count chain evaluates every batch of the segment through one
 * binding per input, while outputs keep one chunk per source batch. @internal
 */
export type GPUQueryFusedBatchSegment = {
  type: 'fused';
  /** Index of the first source batch in the segment. */
  firstBatchIndex: number;
  /** Segment-local first row of every batch. */
  rowStarts: readonly number[];
  /** Number of rows in the segment. */
  rowCount: number;
  /** First stable source-row ID of every batch. */
  sourceStarts: readonly number[];
};

/** A source batch evaluated alone, or a run of contiguous batches evaluated together. @internal */
export type GPUQueryBatchSegment = GPUQuerySingleBatchSegment | GPUQueryFusedBatchSegment;

/** Chunk placement fields that decide whether consecutive batches can share one binding. */
type GPUQueryBatchInputChunk = Pick<
  GPUData,
  'buffer' | 'byteOffset' | 'byteStride' | 'rowByteLength'
>;

/** Internal ownership and graph state transferred exactly once to a compiled dataframe query. */
export type CompiledGPUDataFrameQueryProps<T extends GPUTypeMap> = {
  table: GPUTable<T>;
  validity: Readonly<GPUDataFrameValidity<T>>;
  dictionaries: Readonly<GPUDataFrameDictionaries<T>>;
  selectionMask: GPUVector<'uint32'>;
  rowIndices: GPUVector<'uint32'>;
  selectedCounts: GPUVector<'uint32'>;
  graph: CompiledGPUCommandGraph<GPUDataFrameQueryParameters>;
  sourceViews: readonly Pick<GPUDataFrame, 'destroy'>[];
  ownedTables?: readonly Pick<GPUTable, 'destroy'>[];
  ownedVectors?: readonly GPUVector[];
};

/** Source-row GPU outputs available to one graph contribution before graph compilation. @internal */
export type GPUDataFrameQueryExtensionContext<T extends GPUTypeMap> = {
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>;
  queryId: string;
  table: GPUTable<T>;
  validity: Readonly<GPUDataFrameValidity<T>>;
  dictionaries: Readonly<GPUDataFrameDictionaries<T>>;
  selectionMask: GraphVectorView<'uint32'>;
  rowIndices: GraphVectorView<'uint32'>;
  selectedCounts: GraphVectorView<'uint32'>;
};

/** Result resources contributed by one graph-native extension. @internal */
export type GPUDataFrameQueryExtensionResult<
  T extends GPUTypeMap,
  Compiled extends CompiledGPUDataFrameQuery<T> = CompiledGPUDataFrameQuery<T>
> = {
  table: GPUTable<T>;
  validity: Readonly<GPUDataFrameValidity<T>>;
  dictionaries: Readonly<GPUDataFrameDictionaries<T>>;
  ownedTables?: readonly Pick<GPUTable, 'destroy'>[];
  ownedVectors?: readonly GPUVector[];
  createCompiled: (props: CompiledGPUDataFrameQueryProps<T>) => Compiled;
};

/** Declares downstream GPU work after row filtering but before the graph is frozen. @internal */
export type GPUDataFrameQueryCompilationExtension<
  Row extends GPUTypeMap,
  Result extends GPUTypeMap,
  Compiled extends CompiledGPUDataFrameQuery<Result> = CompiledGPUDataFrameQuery<Result>
> = {
  allowEmptyPredicates?: boolean;
  prepare: (
    context: GPUDataFrameQueryExtensionContext<Row>
  ) => GPUDataFrameQueryExtensionResult<Result, Compiled>;
};

/**
 * Reusable GPU dataframe query with source-aligned masks and stable per-batch selected row IDs.
 *
 * Encoding records work on a caller-owned command encoder. Submission and any optional readback
 * remain entirely application controlled; destroying a query never releases borrowed source data.
 */
export class CompiledGPUDataFrameQuery<T extends GPUTypeMap = GPUTypeMap> {
  /** Non-destructive projection of the original source table. */
  readonly table: GPUTable<T>;
  /** Explicit validity sidecars for every selected nullable source or derived column. */
  readonly validity: Readonly<GPUDataFrameValidity<T>>;
  /** Source categorical labels retained for selected, unmodified dictionary columns. */
  readonly dictionaries: Readonly<GPUDataFrameDictionaries<T>>;
  /** Canonical 0/1 selection flags with exactly the original source batch topology. */
  readonly selectionMask: GPUVector<'uint32'>;
  /** Stable, batch-local compacted source-row identities. */
  readonly rowIndices: GPUVector<'uint32'>;
  /** One GPU-resident selected-row count for every preserved source record batch. */
  readonly selectedCounts: GPUVector<'uint32'>;

  private readonly graph: CompiledGPUCommandGraph<GPUDataFrameQueryParameters>;
  private readonly sourceViews: readonly Pick<GPUDataFrame, 'destroy'>[];
  private readonly ownedTables: readonly Pick<GPUTable, 'destroy'>[];
  private readonly ownedVectors: readonly GPUVector[];
  private destroyed = false;

  /** @internal */
  constructor(props: CompiledGPUDataFrameQueryProps<T>) {
    this.table = props.table;
    this.validity = props.validity;
    this.dictionaries = props.dictionaries;
    this.selectionMask = props.selectionMask;
    this.rowIndices = props.rowIndices;
    this.selectedCounts = props.selectedCounts;
    this.graph = props.graph;
    this.sourceViews = props.sourceViews;
    this.ownedTables = props.ownedTables ?? [];
    this.ownedVectors = props.ownedVectors ?? [];
  }

  /** Encodes reusable graph work without finishing or submitting the application encoder. */
  encode(
    commandEncoder: CommandEncoder,
    parameters: GPUDataFrameQueryParameters = {}
  ): GPUCommandGraphEncoding {
    if (this.destroyed) {
      throw new Error('Compiled GPUDataFrame query has been destroyed');
    }
    return this.graph.encode(commandEncoder, {parameters});
  }

  /** Releases owned graph/output resources and the final retained source-table leases. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.graph.destroy();
    this.selectionMask.destroy();
    this.rowIndices.destroy();
    this.selectedCounts.destroy();
    for (const table of this.ownedTables) {
      table.destroy();
    }
    for (const vector of this.ownedVectors) {
      vector.destroy();
    }
    for (const sourceView of this.sourceViews) {
      sourceView.destroy();
    }
  }
}

/** Compiles immutable dataframe predicates into source-batch-preserving WebGPU command work. */
export function compileGPUDataFrameQuery<
  Source extends GPUTypeMap,
  Row extends GPUTypeMap,
  Result extends GPUTypeMap = Row,
  Compiled extends CompiledGPUDataFrameQuery<Result> = CompiledGPUDataFrameQuery<Result>
>(
  source: GPUDataFrame<Source>,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly (keyof Row & string)[],
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  derivedColumns: readonly GPUDataFrameDerivedColumn[] = [],
  extension?: GPUDataFrameQueryCompilationExtension<Row, Result, Compiled>
): Compiled {
  const retainedSource = source.select<keyof Source & string>(source.columnNames);
  let selectedSource: GPUDataFrame | undefined;
  let ownedTable: GPUTable<Row> | undefined;
  let extensionResult: GPUDataFrameQueryExtensionResult<Result, Compiled> | undefined;
  const derivedOutputs: GPUQueryDerivedOutput[] = [];
  let selectionMask: GPUVector<'uint32'> | undefined;
  let rowIndices: GPUVector<'uint32'> | undefined;
  let selectedCounts: GPUVector<'uint32'> | undefined;
  let batchTable: GPUVector<'uint32'> | undefined;
  let compiledGraph: CompiledGPUCommandGraph<GPUDataFrameQueryParameters> | undefined;

  try {
    const sourceColumns = selectedColumns.filter(columnName =>
      retainedSource.schema.fields.some(field => field.name === columnName)
    ) as (keyof Source & string)[];
    selectedSource = retainedSource.select(sourceColumns) as unknown as GPUDataFrame;
    const plan = makeGPUQueryExpressionShaderPlan(
      retainedSource,
      predicates,
      derivedColumns,
      selectedColumns,
      predicates.length === 0 || extension?.allowEmptyPredicates === true
    );
    validateGPUQueryBatchCapacity(retainedSource, graph);
    validateGPUQueryBindingCapacity(plan, graph);
    const segments = getGPUQueryBatchSegments(
      retainedSource.batches,
      getGPUQueryBatchInputs(retainedSource, plan),
      graph.device.limits
    );
    const rowLengths = getGPUQueryOutputBufferLayout(segments);
    const countLengths = rowLengths.map(lengths => lengths.map(() => 1));
    const fusedSegments = segments.filter(
      (segment): segment is GPUQueryFusedBatchSegment => segment.type === 'fused'
    );

    selectionMask = createGPUQueryOutputVector(
      graph.device,
      'gpu-dataframe-selection-mask',
      rowLengths,
      'uint32'
    );
    rowIndices = createGPUQueryOutputVector(
      graph.device,
      'gpu-dataframe-row-indices',
      rowLengths,
      'uint32',
      true
    );
    selectedCounts = createGPUQueryOutputVector(
      graph.device,
      'gpu-dataframe-selected-counts',
      countLengths,
      'uint32'
    );
    if (fusedSegments.length > 0) {
      batchTable = createGPUQueryBatchTable(graph.device, fusedSegments);
    }
    for (const output of plan.outputs) {
      const values = createGPUQueryOutputVector(
        graph.device,
        `gpu-dataframe-derived-${output.index}`,
        rowLengths,
        output.format,
        false,
        true
      );
      const derivedOutput: GPUQueryDerivedOutput = {plan: output, values};
      derivedOutputs.push(derivedOutput);
      if (output.nullable && retainedSource.batches.length > 0) {
        derivedOutput.validity = createGPUQueryOutputVector(
          graph.device,
          `gpu-dataframe-derived-${output.index}-validity`,
          rowLengths,
          'uint32'
        );
      }
    }
    if (derivedOutputs.length > 0) {
      ownedTable = createGPUQueryDerivedTable<Row>(
        selectedSource.table,
        selectedColumns,
        derivedOutputs
      );
    }

    const validity = selectGPUQueryValidity<Row>(selectedSource, derivedOutputs);
    const dictionaries = Object.freeze({
      ...selectedSource.dictionaries
    }) as Readonly<GPUDataFrameDictionaries<Row>>;

    const queryId = `${graph.id}-gpu-dataframe-query`;
    const sourceViews = importGPUQuerySourceViews(graph, retainedSource, plan, queryId);
    const derivedViews = importGPUQueryDerivedViews(graph, derivedOutputs, queryId);
    const maskView = graph.importGPUVector(`${queryId}-selection-mask`, selectionMask);
    const rowIndexView = graph.importGPUVector(`${queryId}-row-indices`, rowIndices);
    const countView = graph.importGPUVector(`${queryId}-selected-counts`, selectedCounts);
    const hasRows = retainedSource.batches.some(batch => batch.numRows > 0);
    const controls =
      plan.controls.length > 0 && hasRows
        ? createTransientView(
            graph,
            `${queryId}-controls`,
            'uint32',
            plan.controls.length * 2,
            Buffer.STORAGE | Buffer.COPY_DST
          )
        : undefined;

    if (controls) {
      addGPUQueryControlUpload(graph, queryId, controls, plan);
    }

    const batchTableViews = batchTable
      ? graph.importGPUVector(`${queryId}-batch-table`, batchTable).data
      : [];
    for (const segment of segments) {
      if (segment.type === 'fused') {
        addGPUQueryFusedBatchPasses(graph, {
          queryId,
          segment,
          plan,
          sourceViews,
          derivedViews,
          controls,
          maskView,
          rowIndexView,
          countView,
          batchTableView: batchTableViews[fusedSegments.indexOf(segment)]
        });
        continue;
      }
      const {batchIndex} = segment;
      const mask = maskView.data[batchIndex];
      if (segment.numRows > 0) {
        addGPUQueryPredicatePass(graph, {
          id: `${queryId}-predicate-batch-${batchIndex}`,
          columns: plan.columns,
          getSourceViews: name => getGPUQueryBatchViews(sourceViews.get(name), batchIndex),
          getDerivedViews: name => getGPUQueryBatchViews(derivedViews.get(name), batchIndex),
          controls,
          output: mask,
          plan
        });
      }

      graph.add(
        new GPUVisibilityWorkflow({
          id: `${queryId}-visibility-batch-${batchIndex}`,
          predicates: [{kind: 'selection', mask}],
          outputMask: mask,
          output: rowIndexView.data[batchIndex],
          count: countView.data[batchIndex],
          firstSourceIndex: segment.sourceStart
        })
      );
    }

    const rowTable = ownedTable ?? (selectedSource.table as GPUTable<Row>);
    if (extension) {
      extensionResult = extension.prepare({
        graph,
        queryId,
        table: rowTable,
        validity,
        dictionaries,
        selectionMask: maskView,
        rowIndices: rowIndexView,
        selectedCounts: countView
      });
    }

    compiledGraph = graph.compile();
    const props: CompiledGPUDataFrameQueryProps<Result> = {
      table: extensionResult?.table ?? (rowTable as unknown as GPUTable<Result>),
      validity:
        extensionResult?.validity ??
        (validity as unknown as Readonly<GPUDataFrameValidity<Result>>),
      dictionaries:
        extensionResult?.dictionaries ??
        (dictionaries as unknown as Readonly<GPUDataFrameDictionaries<Result>>),
      selectionMask,
      rowIndices,
      selectedCounts,
      graph: compiledGraph,
      sourceViews: [selectedSource, retainedSource],
      ownedTables: [...(ownedTable ? [ownedTable] : []), ...(extensionResult?.ownedTables ?? [])],
      ownedVectors: [
        ...(batchTable ? [batchTable] : []),
        ...derivedOutputs.flatMap(output =>
          output.validity ? [output.values, output.validity] : [output.values]
        ),
        ...(extensionResult?.ownedVectors ?? [])
      ]
    };
    return extensionResult
      ? extensionResult.createCompiled(props)
      : (new CompiledGPUDataFrameQuery(props) as Compiled);
  } catch (error) {
    compiledGraph?.destroy();
    selectionMask?.destroy();
    rowIndices?.destroy();
    selectedCounts?.destroy();
    batchTable?.destroy();
    for (const table of extensionResult?.ownedTables ?? []) {
      table.destroy();
    }
    for (const vector of extensionResult?.ownedVectors ?? []) {
      vector.destroy();
    }
    ownedTable?.destroy();
    for (const output of derivedOutputs) {
      output.values.destroy();
      output.validity?.destroy();
    }
    selectedSource?.destroy();
    retainedSource.destroy();
    throw error;
  }
}

/** Rejects source batches only when even bounded three-dimensional dispatch cannot represent them. */
function validateGPUQueryBatchCapacity<T extends GPUTypeMap>(
  source: GPUDataFrame<T>,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): void {
  for (const [batchIndex, batch] of source.batches.entries()) {
    getBoundedDispatchLayout(
      `GPUDataFrame source batch ${batchIndex}`,
      batch.numRows,
      LU_QUERY_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Rejects predicates that exceed portable device storage-buffer binding capacity. */
function validateGPUQueryBindingCapacity(
  plan: GPUQueryExpressionShaderPlan,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): void {
  const sourceCount = plan.columns.reduce(
    (bindingCount, column) => bindingCount + 1 + (column.nullable ? 1 : 0),
    0
  );
  const outputCount = plan.outputs.reduce(
    (bindingCount, output) => bindingCount + 1 + (output.nullable ? 1 : 0),
    0
  );
  const bindingCount = sourceCount + outputCount + (plan.controls.length > 0 ? 1 : 0) + 1;
  if (bindingCount > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error('GPUDataFrame filter exceeds the available WebGPU storage-buffer bindings');
  }
}

/**
 * Creates one fixed-width GPU output chunk for every source batch.
 *
 * `bufferLayout` lists chunk lengths per output buffer. A single-batch segment gets its own
 * buffer. The chunks of a fused segment are consecutive views of one buffer owned by the first
 * chunk, so fused passes address every batch through one binding; their byte offsets are exact
 * but generally not storage-offset aligned. A fused segment ends with a nonempty batch, so every
 * chunk starts inside its buffer.
 */
function createGPUQueryOutputVector<Format extends GPUQueryScalarFormat>(
  device: Device,
  name: string,
  bufferLayout: readonly (readonly number[])[],
  format: Format,
  indexBuffer = false,
  vertexBuffer = false
): GPUVector<Format> {
  const data: GPUData<Format>[] = [];
  try {
    for (const lengths of bufferLayout) {
      const rowCount = lengths.reduce((total, length) => total + length, 0);
      const buffer = device.createBuffer({
        id: `${name}-batch-${data.length}`,
        byteLength: Math.max(rowCount, 1) * UINT32_BYTE_LENGTH,
        usage:
          Buffer.STORAGE |
          Buffer.COPY_SRC |
          Buffer.COPY_DST |
          (indexBuffer ? Buffer.INDEX : 0) |
          (vertexBuffer ? Buffer.VERTEX : 0),
        ...(indexBuffer ? {indexType: 'uint32' as const} : {})
      });
      const firstChunkIndex = data.length;
      let byteOffset = 0;
      try {
        for (const length of lengths) {
          data.push(
            new GPUData({
              buffer,
              format,
              length,
              byteOffset,
              ownsBuffer: data.length === firstChunkIndex
            })
          );
          byteOffset += length * UINT32_BYTE_LENGTH;
        }
      } catch (error) {
        if (data.length === firstChunkIndex) {
          buffer.destroy();
        }
        throw error;
      }
    }
    return new GPUVector({type: 'data', name, format, data, ownsData: true});
  } catch (error) {
    for (const chunk of data) {
      chunk.destroy();
    }
    throw error;
  }
}

/** Preserves source sidecars while adding only independently owned derived validity vectors. */
function selectGPUQueryValidity<Result extends GPUTypeMap>(
  selectedSource: GPUDataFrame,
  outputs: readonly GPUQueryDerivedOutput[]
): Readonly<GPUDataFrameValidity<Result>> {
  const validity: Record<string, GPUVector<'uint32'>> = {};
  for (const [name, vector] of Object.entries(selectedSource.validity)) {
    if (vector) {
      validity[name] = vector;
    }
  }
  for (const output of outputs) {
    if (output.validity) {
      validity[output.plan.name] = output.validity;
    }
  }
  return Object.freeze(validity) as Readonly<GPUDataFrameValidity<Result>>;
}

/** Builds a borrowed result table without repacking batches or changing ownership of source data. */
function createGPUQueryDerivedTable<Result extends GPUTypeMap>(
  selectedSource: GPUTable,
  selectedColumns: readonly (keyof Result & string)[],
  outputs: readonly GPUQueryDerivedOutput[]
): GPUTable<Result> {
  const outputsByName = new Map(outputs.map(output => [output.plan.name, output]));
  const fields: GPUField<keyof Result & string>[] = selectedColumns.map(name => {
    const output = outputsByName.get(name);
    if (output) {
      return {
        name,
        format: output.plan.format,
        nullable: output.plan.nullable,
        metadata: new Map()
      };
    }
    const sourceField = selectedSource.schema.fields.find(field => field.name === name);
    if (!sourceField) {
      throw new Error(`GPUDataFrame result column "${name}" does not exist`);
    }
    return {
      ...(sourceField as GPUField<keyof Result & string>),
      ...(sourceField.metadata ? {metadata: new Map(sourceField.metadata)} : {})
    };
  });
  const layouts: BufferLayout[] = selectedColumns.flatMap(name => {
    const output = outputsByName.get(name);
    if (output) {
      return [{name, format: output.plan.format, byteStride: UINT32_BYTE_LENGTH}];
    }
    return selectedSource.bufferLayout
      .filter(layout => layout.name === name)
      .map(layout => ({
        ...layout,
        ...(layout.attributes
          ? {attributes: layout.attributes.map(attribute => ({...attribute}))}
          : {})
      }));
  });
  const metadata = new Map(selectedSource.schema.metadata);
  if (selectedSource.batches.length === 0) {
    return new GPUTable<Result>({schema: {fields, metadata}, bufferLayout: layouts});
  }

  const constants: Record<string, GPUConstant> = {};
  for (const name of selectedColumns) {
    const constant = selectedSource.gpuConstants[name];
    if (constant) {
      constants[name] = constant;
    }
  }

  const batches: GPURecordBatch<Result>[] = [];
  try {
    for (const [batchIndex, sourceBatch] of selectedSource.batches.entries()) {
      const gpuData: Record<string, GPUData> = {};
      const varyingFields: GPUField[] = [];
      for (const field of fields) {
        const output = outputsByName.get(field.name);
        const data = output ? output.values.data[batchIndex] : sourceBatch.gpuData[field.name];
        if (!data) {
          continue;
        }
        gpuData[field.name] = createGPUQueryBorrowedData(data);
        varyingFields.push(field);
      }
      batches.push(
        new GPURecordBatch<Result>({
          gpuData,
          bufferLayout: layouts,
          fields: varyingFields,
          numRows: sourceBatch.numRows,
          metadata: new Map(sourceBatch.schema.metadata),
          sourceInfo: sourceBatch.sourceInfo,
          nullCount: sourceBatch.nullCount
        })
      );
    }
    const table = new GPUTable<Result>({batches, constants});
    table.schema = {fields, metadata};
    table.numCols = fields.length;
    for (const name of Object.keys(table.gpuColumns)) {
      delete table.gpuColumns[name];
    }
    for (const name of selectedColumns) {
      const column = table.gpuVectors[name] ?? table.gpuConstants[name];
      if (column) {
        table.gpuColumns[name] = column;
      }
    }
    return table;
  } catch (error) {
    for (const batch of batches) {
      batch.destroy();
    }
    throw error;
  }
}

/** Copies complete chunk metadata while ensuring result-table destruction never owns a buffer. */
function createGPUQueryBorrowedData(source: GPUData): GPUData {
  return new GPUData({
    buffer: source.buffer,
    format: source.format,
    length: source.length,
    valueLength: source.valueLength,
    stride: source.stride,
    byteOffset: source.byteOffset,
    byteStride: source.byteStride,
    rowByteLength: source.rowByteLength,
    ownsBuffer: false,
    readbackMetadata: source.readbackMetadata,
    valueOffsets: source.valueOffsets,
    nullBitmap: source.nullBitmap,
    valueByteLength: source.valueByteLength,
    dataType: source.dataType
  });
}

/** Imports each referenced source vector and validity sidecar exactly once. */
function importGPUQuerySourceViews<T extends GPUTypeMap>(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  source: GPUDataFrame<T>,
  plan: GPUQueryExpressionShaderPlan,
  queryId: string
): Map<string, GPUQuerySourceView> {
  const views = new Map<string, GPUQuerySourceView>();
  for (const column of plan.columns) {
    const vector = source.table.gpuVectors[column.name];
    if (!vector) {
      if (source.batches.length === 0) {
        continue;
      }
      throw new Error(`GPUDataFrame expression column "${column.name}" is not a GPU vector`);
    }
    const values = graph.importGPUVector(`${queryId}-input-${column.index}`, vector);
    const validityVector = source.validity[column.name as keyof T & string];
    const validity =
      column.nullable && validityVector
        ? graph.importGPUVector(`${queryId}-validity-${column.index}`, validityVector)
        : undefined;
    views.set(column.name, {values, ...(validity ? {validity} : {})});
  }
  return views;
}

/** Registers independently owned derived values and nullable sidecars without changing chunks. */
function importGPUQueryDerivedViews(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  outputs: readonly GPUQueryDerivedOutput[],
  queryId: string
): Map<string, GPUQueryDerivedView> {
  const views = new Map<string, GPUQueryDerivedView>();
  for (const output of outputs) {
    const values = graph.importGPUVector(`${queryId}-derived-${output.plan.index}`, output.values);
    const validity = output.validity
      ? graph.importGPUVector(`${queryId}-derived-${output.plan.index}-validity`, output.validity)
      : undefined;
    views.set(output.plan.name, {values, ...(validity ? {validity} : {})});
  }
  return views;
}

/** Uploads controls through the caller encoder so consecutive encodings preserve parameter order. */
function addGPUQueryControlUpload(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  queryId: string,
  controls: GraphDataView<'uint32'>,
  plan: GPUQueryExpressionShaderPlan
): void {
  graph.addCopyPass({
    id: `${queryId}-upload-controls`,
    resources: [{buffer: controls, usage: 'copy-destination'}],
    compile: ({device}) => ({
      encode: ({commandEncoder, getBuffer, parameters}) => {
        const values = encodeGPUQueryExpressionControls(plan.controls, parameters);
        device.writeBufferViaCommandEncoder(commandEncoder, getBuffer(controls), values);
      }
    })
  });
}

/** Selects one batch chunk from imported source or derived vector views. */
function getGPUQueryBatchViews(
  views: GPUQuerySourceView | GPUQueryDerivedView | undefined,
  batchIndex: number
): Partial<GPUQueryPassViews> {
  return {
    values: views?.values.data[batchIndex],
    validity: views?.validity?.data[batchIndex]
  };
}

/**
 * Emits one closed-AST expression kernel over one row range.
 *
 * The range is either one preserved, nonempty source record batch or, for fused layouts, every
 * batch at once. The output view length defines the number of evaluated rows.
 */
function addGPUQueryPredicatePass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  props: {
    id: string;
    columns: readonly GPUQueryExpressionColumn[];
    getSourceViews: (name: string) => Partial<GPUQueryPassViews>;
    getDerivedViews: (name: string) => Partial<GPUQueryPassViews>;
    controls?: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    plan: GPUQueryExpressionShaderPlan;
  }
): void {
  const declarations: string[] = [];
  const bindings: Record<string, GraphDataView> = {};
  const resources: GraphBufferUse[] = [];
  let bindingIndex = 0;

  for (const column of props.columns) {
    const views = props.getSourceViews(column.name);
    const values = views.values;
    if (!values) {
      throw new Error('GPUDataFrame expression source chunk is missing');
    }
    declarations.push(
      `const INPUT_${column.index}_OFFSET: u32 = ${getViewElementOffset(values)}u;`
    );
    declarations.push(
      `@group(0) @binding(${bindingIndex++}) var<storage, read> input${column.index}: array<${getGPUQueryShaderType(column.format)}>;`
    );
    bindings[`input${column.index}`] = values;
    resources.push({buffer: values, usage: 'storage-read'});

    if (column.nullable) {
      const validity = views.validity;
      if (!validity) {
        throw new Error('GPUDataFrame nullable expression source is missing a validity chunk');
      }
      declarations.push(
        `const VALIDITY_${column.index}_OFFSET: u32 = ${getViewElementOffset(validity)}u;`
      );
      declarations.push(
        `@group(0) @binding(${bindingIndex++}) var<storage, read> validity${column.index}: array<u32>;`
      );
      bindings[`validity${column.index}`] = validity;
      resources.push({buffer: validity, usage: 'storage-read'});
    }
  }

  if (props.controls) {
    declarations.push(`const CONTROL_OFFSET: u32 = ${getViewElementOffset(props.controls)}u;`);
    declarations.push(
      `@group(0) @binding(${bindingIndex++}) var<storage, read> queryControls: array<u32>;`
    );
    bindings['queryControls'] = props.controls;
    resources.push({buffer: props.controls, usage: 'storage-read'});
  }

  const derivedWrites: string[] = [];
  for (const output of props.plan.outputs) {
    const views = props.getDerivedViews(output.name);
    const values = views.values;
    if (!values) {
      throw new Error('GPUDataFrame derived expression output chunk is missing');
    }
    declarations.push(
      `const DERIVED_${output.index}_OFFSET: u32 = ${getViewElementOffset(values)}u;`
    );
    declarations.push(
      `@group(0) @binding(${bindingIndex++}) var<storage, read_write> derived${output.index}: array<${getGPUQueryShaderType(output.format)}>;`
    );
    bindings[`derived${output.index}`] = values;
    resources.push({buffer: values, usage: 'storage-write'});
    derivedWrites.push(
      `derived${output.index}[DERIVED_${output.index}_OFFSET + index] = ${output.value};`
    );

    if (output.nullable) {
      const validity = views.validity;
      if (!validity) {
        throw new Error('GPUDataFrame derived expression validity chunk is missing');
      }
      declarations.push(
        `const DERIVED_VALIDITY_${output.index}_OFFSET: u32 = ${getViewElementOffset(validity)}u;`
      );
      declarations.push(
        `@group(0) @binding(${bindingIndex++}) var<storage, read_write> derivedValidity${output.index}: array<u32>;`
      );
      bindings[`derivedValidity${output.index}`] = validity;
      resources.push({buffer: validity, usage: 'storage-write'});
      derivedWrites.push(
        `derivedValidity${output.index}[DERIVED_VALIDITY_${output.index}_OFFSET + index] = select(0u, 1u, ${output.valid});`
      );
    }
  }

  declarations.push(`const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;`);
  declarations.push(
    `@group(0) @binding(${bindingIndex}) var<storage, read_write> outputMask: array<u32>;`
  );
  bindings['outputMask'] = props.output;
  resources.push({buffer: props.output, usage: 'storage-write'});

  const dispatchLayout = getBoundedDispatchLayout(
    'GPUDataFrame filtering',
    props.output.length,
    LU_QUERY_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.output.length}u;
${declarations.join('\n')}

@compute @workgroup_size(${LU_QUERY_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, LU_QUERY_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) {
    return;
  }
  ${props.plan.statements.join('\n  ')}
  ${derivedWrites.join('\n  ')}
  outputMask[OUTPUT_OFFSET + index] = select(0u, 1u, ${props.plan.condition});
}`;

  graph.addComputePass({
    id: props.id,
    resources,
    compile: ({device}) => {
      // Kernel skips the per-instance shader assembly and ShaderInputs that Computation performs.
      const kernel = new Kernel(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
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
          for (const [name, view] of Object.entries(bindings)) {
            resolvedBindings[name] = getViewBinding(view, getBuffer);
          }
          kernel.dispatch(computePass, {
            bindings: resolvedBindings,
            x: dispatchLayout.x,
            y: dispatchLayout.y,
            z: dispatchLayout.z
          });
        },
        destroy: () => kernel.destroy()
      };
    }
  });
}

/** Lists the chunks of every predicate input: each column's values, then its validity. */
function getGPUQueryBatchInputs<T extends GPUTypeMap>(
  source: GPUDataFrame<T>,
  plan: GPUQueryExpressionShaderPlan
): (readonly GPUData[])[] {
  return plan.columns.flatMap(column => {
    const values = source.table.gpuVectors[column.name]?.data ?? [];
    if (!column.nullable) {
      return [values];
    }
    return [values, source.validity[column.name as keyof T & string]?.data ?? []];
  });
}

/** Row count, source-row identity, and predicate input chunks of one source batch. */
type GPUQueryBatchPlacement = {
  numRows: number;
  sourceStart: number;
  /** Whether the batch may join a fused run: packed uint32 inputs and uint32 source-row IDs. */
  fusable: boolean;
  /** Fusable nonempty batches: one chunk per predicate input, in `getGPUQueryBatchInputs()` order. */
  chunks?: readonly GPUQueryBatchInputChunk[];
};

/**
 * Partitions source batches into single-batch segments and fused segments.
 *
 * First, consecutive batches whose predicate inputs are contiguous in their buffers form runs, as
 * produced by slicing one allocation into record batches. Then each run is split so that every
 * fused segment fits one storage binding per input and one output allocation. Fusing replaces one
 * predicate, identity, scan, and scatter chain per batch with a constant number of dispatches per
 * segment. Queries without input columns keep the per-batch path, because nothing indicates that
 * callers expect shared-buffer output chunks. @internal
 */
export function getGPUQueryBatchSegments(
  batches: readonly Pick<GPURecordBatch, 'numRows' | 'sourceInfo'>[],
  inputs: readonly (readonly GPUQueryBatchInputChunk[])[],
  limits: Pick<DeviceLimits, 'maxStorageBufferBindingSize' | 'maxBufferSize'>
): GPUQueryBatchSegment[] {
  const placements = getGPUQueryBatchPlacements(batches, inputs);
  return findGPUQueryContiguousRuns(placements).flatMap(batchIndices =>
    splitGPUQueryRunByLimits(batchIndices, placements, limits)
  );
}

function getGPUQueryBatchPlacements(
  batches: readonly Pick<GPURecordBatch, 'numRows' | 'sourceInfo'>[],
  inputs: readonly (readonly GPUQueryBatchInputChunk[])[]
): GPUQueryBatchPlacement[] {
  let sourceRowOffset = 0;
  return batches.map((batch, batchIndex) => {
    const sourceStart = batch.sourceInfo?.sourceRowIndexOffset ?? sourceRowOffset;
    sourceRowOffset += batch.numRows;
    const fusable =
      inputs.length > 0 &&
      Number.isSafeInteger(sourceStart) &&
      sourceStart >= 0 &&
      sourceStart + Math.max(batch.numRows - 1, 0) <= MAXIMUM_UINT32;
    if (!fusable || batch.numRows === 0) {
      return {numRows: batch.numRows, sourceStart, fusable};
    }
    const chunks: GPUQueryBatchInputChunk[] = [];
    for (const input of inputs) {
      const chunk = input[batchIndex];
      if (chunk?.byteStride !== UINT32_BYTE_LENGTH || chunk.rowByteLength !== UINT32_BYTE_LENGTH) {
        return {numRows: batch.numRows, sourceStart, fusable: false};
      }
      chunks.push(chunk);
    }
    return {numRows: batch.numRows, sourceStart, fusable, chunks};
  });
}

/**
 * Groups consecutive fusable batches whose nonempty input chunks each start where the previous
 * nonempty batch's chunk of that input ended. Empty batches read no input and join any run.
 */
function findGPUQueryContiguousRuns(placements: readonly GPUQueryBatchPlacement[]): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];
  let inputEnds: {buffer: unknown; byteOffset: number}[] | undefined;
  const closeRun = () => {
    if (run.length > 0) {
      runs.push(run);
    }
    run = [];
    inputEnds = undefined;
  };

  for (const [batchIndex, placement] of placements.entries()) {
    if (!placement.fusable) {
      closeRun();
      runs.push([batchIndex]);
      continue;
    }
    const {chunks} = placement;
    if (chunks) {
      const isContiguous =
        !inputEnds ||
        chunks.every(
          (chunk, index) =>
            chunk.buffer === inputEnds?.[index].buffer &&
            chunk.byteOffset === inputEnds[index].byteOffset
        );
      if (!isContiguous) {
        closeRun();
      }
      inputEnds = chunks.map(chunk => ({
        buffer: chunk.buffer,
        byteOffset: chunk.byteOffset + placement.numRows * UINT32_BYTE_LENGTH
      }));
    }
    run.push(batchIndex);
  }
  closeRun();
  return runs;
}

/**
 * Splits one contiguous run into fused segments that fit device limits, and single-batch segments.
 *
 * A fused segment binds each input from the aligned offset at or before its first row, writes
 * outputs packed from offset zero, and uploads a batch table of `2 * batchCount + 1` words.
 */
function splitGPUQueryRunByLimits(
  batchIndices: readonly number[],
  placements: readonly GPUQueryBatchPlacement[],
  limits: Pick<DeviceLimits, 'maxStorageBufferBindingSize' | 'maxBufferSize'>
): GPUQueryBatchSegment[] {
  const maximumBatchCount = Math.floor(
    (Math.min(limits.maxStorageBufferBindingSize, limits.maxBufferSize) / UINT32_BYTE_LENGTH - 1) /
      2
  );
  const segments: GPUQueryBatchSegment[] = [];
  let pieceBatchIndices: number[] = [];
  let rowCount = 0;
  let bindingPrefixByteLength: number | undefined;

  const fitsLimits = (nextRowCount: number, prefixByteLength: number) =>
    prefixByteLength + nextRowCount * UINT32_BYTE_LENGTH <= limits.maxStorageBufferBindingSize &&
    nextRowCount * UINT32_BYTE_LENGTH <= limits.maxBufferSize;
  const closePiece = () => {
    segments.push(...getGPUQueryRunSegments(pieceBatchIndices, placements));
    pieceBatchIndices = [];
    rowCount = 0;
    bindingPrefixByteLength = undefined;
  };

  for (const batchIndex of batchIndices) {
    const {numRows, chunks} = placements[batchIndex];
    const prefixByteLength = bindingPrefixByteLength ?? getGPUQueryBindingPrefixByteLength(chunks);
    if (
      pieceBatchIndices.length > 0 &&
      (pieceBatchIndices.length >= maximumBatchCount ||
        !fitsLimits(rowCount + numRows, prefixByteLength))
    ) {
      closePiece();
    }
    pieceBatchIndices.push(batchIndex);
    rowCount += numRows;
    if (chunks) {
      bindingPrefixByteLength ??= getGPUQueryBindingPrefixByteLength(chunks);
    }
  }
  closePiece();
  return segments;
}

/** Returns the most bytes an aligned input binding covers before a batch's first row. */
function getGPUQueryBindingPrefixByteLength(
  chunks: readonly GPUQueryBatchInputChunk[] | undefined
): number {
  return Math.max(0, ...(chunks ?? []).map(chunk => chunk.byteOffset % STORAGE_BINDING_ALIGNMENT));
}

/**
 * Returns one fused segment for batches with at least two nonempty batches, followed by single
 * segments for any trailing empty batches, or single segments for every batch otherwise.
 */
function getGPUQueryRunSegments(
  batchIndices: readonly number[],
  placements: readonly GPUQueryBatchPlacement[]
): GPUQueryBatchSegment[] {
  let lastNonemptyIndex = batchIndices.length - 1;
  while (lastNonemptyIndex >= 0 && placements[batchIndices[lastNonemptyIndex]].numRows === 0) {
    lastNonemptyIndex--;
  }
  const fusedBatchIndices = batchIndices.slice(0, lastNonemptyIndex + 1);
  const nonemptyCount = fusedBatchIndices.filter(
    batchIndex => placements[batchIndex].numRows > 0
  ).length;
  if (nonemptyCount < 2) {
    return batchIndices.map(batchIndex => getGPUQuerySingleBatchSegment(batchIndex, placements));
  }

  const rowStarts: number[] = [];
  let rowCount = 0;
  for (const batchIndex of fusedBatchIndices) {
    rowStarts.push(rowCount);
    rowCount += placements[batchIndex].numRows;
  }
  return [
    {
      type: 'fused',
      firstBatchIndex: fusedBatchIndices[0],
      rowStarts,
      rowCount,
      sourceStarts: fusedBatchIndices.map(batchIndex => placements[batchIndex].sourceStart)
    },
    ...batchIndices
      .slice(lastNonemptyIndex + 1)
      .map(batchIndex => getGPUQuerySingleBatchSegment(batchIndex, placements))
  ];
}

function getGPUQuerySingleBatchSegment(
  batchIndex: number,
  placements: readonly GPUQueryBatchPlacement[]
): GPUQuerySingleBatchSegment {
  const {numRows, sourceStart} = placements[batchIndex];
  return {type: 'batch', batchIndex, numRows, sourceStart};
}

/** Lists the row count of every output chunk, grouped by the output buffer that holds them. */
function getGPUQueryOutputBufferLayout(segments: readonly GPUQueryBatchSegment[]): number[][] {
  return segments.map(segment =>
    segment.type === 'batch'
      ? [segment.numRows]
      : segment.rowStarts.map(
          (rowStart, index) => (segment.rowStarts[index + 1] ?? segment.rowCount) - rowStart
        )
  );
}

/**
 * Word offsets of the per-segment batch table: every batch's segment-local first row followed by
 * the segment row count (so batch `b` ends at entry `b + 1`), then every batch's source start.
 */
function getGPUQueryBatchTableOffsets(batchCount: number): {
  rowStarts: number;
  sourceStarts: number;
} {
  return {rowStarts: 0, sourceStarts: batchCount + 1};
}

/** Uploads one batch table per fused segment; see `getGPUQueryBatchTableOffsets()`. */
function createGPUQueryBatchTable(
  device: Device,
  segments: readonly GPUQueryFusedBatchSegment[]
): GPUVector<'uint32'> {
  const data: GPUData<'uint32'>[] = [];
  try {
    for (const segment of segments) {
      const values = Uint32Array.from([
        ...segment.rowStarts,
        segment.rowCount,
        ...segment.sourceStarts
      ]);
      const buffer = device.createBuffer({
        id: `gpu-dataframe-batch-table-${segment.firstBatchIndex}`,
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        data: values
      });
      try {
        data.push(new GPUData({buffer, format: 'uint32', length: values.length, ownsBuffer: true}));
      } catch (error) {
        buffer.destroy();
        throw error;
      }
    }
    return new GPUVector({
      type: 'data',
      name: 'gpu-dataframe-batch-table',
      format: 'uint32',
      data,
      ownsData: true
    });
  } catch (error) {
    for (const chunk of data) {
      chunk.destroy();
    }
    throw error;
  }
}

/** Returns one view spanning every row of a fused segment's contiguous per-batch chunks. */
function getGPUQuerySpanningView<Format extends GPUVectorFormat>(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  chunks: readonly GraphDataView<Format>[],
  segment: GPUQueryFusedBatchSegment
): GraphDataView<Format> {
  const batchIndex = chunks.findIndex(chunk => chunk.length > 0);
  const chunk = chunks[batchIndex];
  return graph.createDataView(chunk.buffer, {
    format: chunk.format,
    length: segment.rowCount,
    byteOffset: chunk.byteOffset - segment.rowStarts[batchIndex] * chunk.rowByteLength,
    byteStride: chunk.byteStride,
    rowByteLength: chunk.rowByteLength
  });
}

/**
 * Evaluates the predicate once over every row of one segment, then publishes the same per-batch
 * outputs as the per-batch path: canonical masks, batch-local compacted source IDs, and counts.
 *
 * One segment-wide exclusive scan provides offsets; each batch's local offset is its scanned
 * offset minus the offset at the batch's first row.
 */
function addGPUQueryFusedBatchPasses(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  props: {
    queryId: string;
    segment: GPUQueryFusedBatchSegment;
    plan: GPUQueryExpressionShaderPlan;
    sourceViews: ReadonlyMap<string, GPUQuerySourceView>;
    derivedViews: ReadonlyMap<string, GPUQueryDerivedView>;
    controls?: GraphDataView<'uint32'>;
    maskView: GraphVectorView<'uint32'>;
    rowIndexView: GraphVectorView<'uint32'>;
    countView: GraphVectorView<'uint32'>;
    batchTableView: GraphDataView<'uint32'>;
  }
): void {
  const {segment} = props;
  const {firstBatchIndex, rowCount} = segment;
  const batchCount = segment.rowStarts.length;
  const batchTableOffsets = getGPUQueryBatchTableOffsets(batchCount);
  const id = `${props.queryId}-fused-${firstBatchIndex}`;
  const getSpanningView = <Format extends GPUVectorFormat>(
    chunks: readonly GraphDataView<Format>[]
  ): GraphDataView<Format> =>
    getGPUQuerySpanningView(
      graph,
      chunks.slice(firstBatchIndex, firstBatchIndex + batchCount),
      segment
    );
  const getSpanningViews = (
    views: GPUQuerySourceView | GPUQueryDerivedView | undefined
  ): Partial<GPUQueryPassViews> => ({
    values: views && getSpanningView(views.values.data),
    validity: views?.validity && getSpanningView(views.validity.data)
  });
  const mask = getSpanningView(props.maskView.data);
  const rowIndices = getSpanningView(props.rowIndexView.data);
  const firstCount = props.countView.data[firstBatchIndex];
  const counts = graph.createDataView(firstCount.buffer, {
    format: 'uint32',
    length: batchCount,
    byteOffset: firstCount.byteOffset
  });

  addGPUQueryPredicatePass(graph, {
    id: `${id}-predicate`,
    columns: props.plan.columns,
    getSourceViews: name => getSpanningViews(props.sourceViews.get(name)),
    getDerivedViews: name => getSpanningViews(props.derivedViews.get(name)),
    controls: props.controls,
    output: mask,
    plan: props.plan
  });

  const offsets = createTransientView(graph, `${id}-offsets`, 'uint32', rowCount);
  graph.add(new GPUScan({id: `${id}-scan`, input: mask, output: offsets}));

  const batchTableConstants = `const ROW_STARTS = BATCHTABLE_OFFSET + ${batchTableOffsets.rowStarts}u;
  const SOURCE_STARTS = BATCHTABLE_OFFSET + ${batchTableOffsets.sourceStarts}u;`;
  const rowDispatch = getBoundedDispatchLayout(
    'GPUDataFrame fused compaction',
    rowCount,
    LU_QUERY_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  addGPUQueryStoragePass(graph, {
    id: `${id}-scatter`,
    views: {
      selectionMask: {view: mask, usage: 'storage-read'},
      offsets: {view: offsets, usage: 'storage-read'},
      batchTable: {view: props.batchTableView, usage: 'storage-read'},
      rowIndices: {view: rowIndices, usage: 'storage-write'}
    },
    dispatchLayout: rowDispatch,
    main: `${getBoundedInvocationIndexSource(rowDispatch, LU_QUERY_WORKGROUP_SIZE)}
  ${batchTableConstants}
  if (index >= ${rowCount}u || selectionMask[SELECTIONMASK_OFFSET + index] == 0u) {
    return;
  }
  // Finds the last batch that starts at or before this row; empty batches share a start row.
  var low = 0u;
  var high = ${batchCount}u;
  loop {
    if (high - low <= 1u) {
      break;
    }
    let middle = (low + high) / 2u;
    if (batchTable[ROW_STARTS + middle] <= index) {
      low = middle;
    } else {
      high = middle;
    }
  }
  let batchStart = batchTable[ROW_STARTS + low];
  let localOffset = offsets[OFFSETS_OFFSET + index] - offsets[OFFSETS_OFFSET + batchStart];
  let sourceStart = batchTable[SOURCE_STARTS + low];
  rowIndices[ROWINDICES_OFFSET + batchStart + localOffset] = sourceStart + index - batchStart;`
  });

  const batchDispatch = getBoundedDispatchLayout(
    'GPUDataFrame fused counts',
    batchCount,
    LU_QUERY_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  addGPUQueryStoragePass(graph, {
    id: `${id}-counts`,
    views: {
      selectionMask: {view: mask, usage: 'storage-read'},
      offsets: {view: offsets, usage: 'storage-read'},
      batchTable: {view: props.batchTableView, usage: 'storage-read'},
      selectedCounts: {view: counts, usage: 'storage-write'}
    },
    dispatchLayout: batchDispatch,
    main: `${getBoundedInvocationIndexSource(batchDispatch, LU_QUERY_WORKGROUP_SIZE)}
  ${batchTableConstants}
  if (index >= ${batchCount}u) {
    return;
  }
  let batchStart = batchTable[ROW_STARTS + index];
  let batchEnd = batchTable[ROW_STARTS + index + 1u];
  var count = 0u;
  if (batchEnd > batchStart) {
    let last = batchEnd - 1u;
    count = offsets[OFFSETS_OFFSET + last] - offsets[OFFSETS_OFFSET + batchStart] +
      select(0u, 1u, selectionMask[SELECTIONMASK_OFFSET + last] != 0u);
  }
  selectedCounts[SELECTEDCOUNTS_OFFSET + index] = count;`
  });
}

/** Adds one packed-uint32 storage kernel whose bindings expose `<NAME>_OFFSET` constants. */
function addGPUQueryStoragePass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  props: {
    id: string;
    views: Record<string, {view: GraphDataView; usage: 'storage-read' | 'storage-write'}>;
    dispatchLayout: {x: number; y: number; z: number};
    main: string;
  }
): void {
  const entries = Object.entries(props.views);
  const source = /* wgsl */ `
${entries
  .map(
    ([name, {view, usage}], location) =>
      `const ${name.toUpperCase()}_OFFSET: u32 = ${getViewElementOffset(view)}u;
@group(0) @binding(${location}) var<storage, ${usage === 'storage-read' ? 'read' : 'read_write'}> ${name}: array<u32>;`
  )
  .join('\n')}

@compute @workgroup_size(${LU_QUERY_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${props.main}
}`;
  graph.addComputePass({
    id: props.id,
    resources: entries.map(([, {view, usage}]) => ({buffer: view, usage})),
    compile: ({device}) => {
      const kernel = new Kernel(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: entries.map(([name], location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, {view}] of entries) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          kernel.dispatch(computePass, {
            bindings,
            x: props.dispatchLayout.x,
            y: props.dispatchLayout.y,
            z: props.dispatchLayout.z
          });
        },
        destroy: () => kernel.destroy()
      };
    }
  });
}
