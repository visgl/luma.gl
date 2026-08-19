// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {
  Buffer,
  type Binding,
  type BufferLayout,
  type CommandEncoder,
  type Device
} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUConstant,
  type GPUField,
  type GPUTypeMap
} from '@luma.gl/tables';
import {
  type CompiledGPUCommandGraph,
  type GPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '../gpu-core/gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';
import {GPUVisibilityWorkflow} from '../gpu-core/gpu-visibility-workflow';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';
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
      extension?.allowEmptyPredicates === true
    );
    validateGPUQueryBatchCapacity(retainedSource, graph);
    validateGPUQueryBindingCapacity(plan, graph);

    selectionMask = createGPUQueryOutputVector(
      graph.device,
      'gpu-dataframe-selection-mask',
      retainedSource.batches.map(batch => batch.numRows),
      'uint32'
    );
    rowIndices = createGPUQueryOutputVector(
      graph.device,
      'gpu-dataframe-row-indices',
      retainedSource.batches.map(batch => batch.numRows),
      'uint32',
      true
    );
    selectedCounts = createGPUQueryOutputVector(
      graph.device,
      'gpu-dataframe-selected-counts',
      retainedSource.batches.map(() => 1),
      'uint32'
    );
    for (const output of plan.outputs) {
      const values = createGPUQueryOutputVector(
        graph.device,
        `gpu-dataframe-derived-${output.index}`,
        retainedSource.batches.map(batch => batch.numRows),
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
          retainedSource.batches.map(batch => batch.numRows),
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

    let sourceRowOffset = 0;
    for (const [batchIndex, batch] of retainedSource.batches.entries()) {
      const mask = maskView.data[batchIndex];
      if (batch.numRows > 0) {
        addGPUQueryPredicatePass(graph, {
          id: `${queryId}-predicate-batch-${batchIndex}`,
          batchIndex,
          columns: plan.columns,
          sourceViews,
          derivedViews,
          controls,
          output: mask,
          plan
        });
      }

      new GPUVisibilityWorkflow({
        id: `${queryId}-visibility-batch-${batchIndex}`,
        predicates: [{kind: 'selection', mask}],
        outputMask: mask,
        output: rowIndexView.data[batchIndex],
        count: countView.data[batchIndex],
        firstSourceIndex: batch.sourceInfo?.sourceRowIndexOffset ?? sourceRowOffset
      }).addToGraph(graph);
      sourceRowOffset += batch.numRows;
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

/** Creates one independently owned fixed-width GPU output chunk for every source batch. */
function createGPUQueryOutputVector<Format extends GPUQueryScalarFormat>(
  device: Device,
  name: string,
  lengths: readonly number[],
  format: Format,
  indexBuffer = false,
  vertexBuffer = false
): GPUVector<Format> {
  const data: GPUData<Format>[] = [];
  try {
    for (const [batchIndex, length] of lengths.entries()) {
      const buffer = device.createBuffer({
        id: `${name}-batch-${batchIndex}`,
        byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
        usage:
          Buffer.STORAGE |
          Buffer.COPY_SRC |
          Buffer.COPY_DST |
          (indexBuffer ? Buffer.INDEX : 0) |
          (vertexBuffer ? Buffer.VERTEX : 0),
        ...(indexBuffer ? {indexType: 'uint32' as const} : {})
      });
      try {
        data.push(new GPUData({buffer, format, length, ownsBuffer: true}));
      } catch (error) {
        buffer.destroy();
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

/** Emits one closed-AST expression kernel for one preserved, nonempty source record batch. */
function addGPUQueryPredicatePass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  props: {
    id: string;
    batchIndex: number;
    columns: readonly GPUQueryExpressionColumn[];
    sourceViews: ReadonlyMap<string, GPUQuerySourceView>;
    derivedViews: ReadonlyMap<string, GPUQueryDerivedView>;
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
    const views = props.sourceViews.get(column.name);
    const values = views?.values.data[props.batchIndex];
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
      const validity = views?.validity?.data[props.batchIndex];
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
    const views = props.derivedViews.get(output.name);
    const values = views?.values.data[props.batchIndex];
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
      const validity = views?.validity?.data[props.batchIndex];
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
      const computation = new Computation(device, {
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
          computation.setBindings(resolvedBindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
