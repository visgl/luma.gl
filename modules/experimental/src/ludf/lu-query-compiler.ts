// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type CommandEncoder, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUData, GPUVector, type GPUTable, type GPUTypeMap} from '@luma.gl/tables';
import {
  type CompiledGPUCommandGraph,
  type GPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '../gpu-primitives/gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-primitives/gpu-dispatch-utils';
import {GPUVisibilityWorkflow} from '../gpu-primitives/gpu-visibility-workflow';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import type {LuDataFrame} from './lu-data-frame';
import type {LuExpression} from './lu-expression';
import {
  encodeLuQueryExpressionControls,
  getLuQueryShaderType,
  makeLuQueryExpressionShaderPlan,
  type LuQueryExpressionColumn,
  type LuQueryExpressionShaderPlan
} from './lu-expression-shader';

const LU_QUERY_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Caller-owned scalar values supplied to an already compiled dataframe filter. */
export type LuDataFrameQueryParameters = Readonly<Record<string, number | boolean | null>>;

type LuQuerySourceView = {
  values: GraphVectorView;
  validity?: GraphVectorView<'uint32'>;
};

type CompiledLuDataFrameQueryProps<T extends GPUTypeMap> = {
  table: GPUTable<T>;
  selectionMask: GPUVector<'uint32'>;
  rowIndices: GPUVector<'uint32'>;
  selectedCounts: GPUVector<'uint32'>;
  graph: CompiledGPUCommandGraph<LuDataFrameQueryParameters>;
  sourceViews: readonly Pick<LuDataFrame, 'destroy'>[];
};

/**
 * Reusable GPU dataframe query with source-aligned masks and stable per-batch selected row IDs.
 *
 * Encoding records work on a caller-owned command encoder. Submission and any optional readback
 * remain entirely application controlled; destroying a query never releases borrowed source data.
 */
export class CompiledLuDataFrameQuery<T extends GPUTypeMap = GPUTypeMap> {
  /** Non-destructive projection of the original source table. */
  readonly table: GPUTable<T>;
  /** Canonical 0/1 selection flags with exactly the original source batch topology. */
  readonly selectionMask: GPUVector<'uint32'>;
  /** Stable, batch-local compacted source-row identities. */
  readonly rowIndices: GPUVector<'uint32'>;
  /** One GPU-resident selected-row count for every preserved source record batch. */
  readonly selectedCounts: GPUVector<'uint32'>;

  private readonly graph: CompiledGPUCommandGraph<LuDataFrameQueryParameters>;
  private readonly sourceViews: readonly Pick<LuDataFrame, 'destroy'>[];
  private destroyed = false;

  /** @internal */
  constructor(props: CompiledLuDataFrameQueryProps<T>) {
    this.table = props.table;
    this.selectionMask = props.selectionMask;
    this.rowIndices = props.rowIndices;
    this.selectedCounts = props.selectedCounts;
    this.graph = props.graph;
    this.sourceViews = props.sourceViews;
  }

  /** Encodes reusable graph work without finishing or submitting the application encoder. */
  encode(
    commandEncoder: CommandEncoder,
    parameters: LuDataFrameQueryParameters = {}
  ): GPUCommandGraphEncoding {
    if (this.destroyed) {
      throw new Error('Compiled LuDataFrame query has been destroyed');
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
    for (const sourceView of this.sourceViews) {
      sourceView.destroy();
    }
  }
}

/** Compiles immutable dataframe predicates into source-batch-preserving WebGPU command work. */
export function compileLuDataFrameQuery<T extends GPUTypeMap, ColumnName extends keyof T & string>(
  source: LuDataFrame<T>,
  predicates: readonly LuExpression<boolean, string>[],
  selectedColumns: readonly ColumnName[],
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): CompiledLuDataFrameQuery<Pick<T, ColumnName>> {
  const retainedSource = source.select<keyof T & string>(source.columnNames);
  let selectedSource: LuDataFrame<Pick<T, ColumnName>> | undefined;
  let selectionMask: GPUVector<'uint32'> | undefined;
  let rowIndices: GPUVector<'uint32'> | undefined;
  let selectedCounts: GPUVector<'uint32'> | undefined;
  let compiledGraph: CompiledGPUCommandGraph<LuDataFrameQueryParameters> | undefined;

  try {
    selectedSource = retainedSource.select(selectedColumns) as LuDataFrame<Pick<T, ColumnName>>;
    const plan = makeLuQueryExpressionShaderPlan(retainedSource, predicates);
    validateLuQueryBatchCapacity(retainedSource, graph);
    validateLuQueryBindingCapacity(plan, graph);

    selectionMask = createLuQueryOutputVector(
      graph.device,
      'ludf-selection-mask',
      retainedSource.batches.map(batch => batch.numRows)
    );
    rowIndices = createLuQueryOutputVector(
      graph.device,
      'ludf-row-indices',
      retainedSource.batches.map(batch => batch.numRows),
      true
    );
    selectedCounts = createLuQueryOutputVector(
      graph.device,
      'ludf-selected-counts',
      retainedSource.batches.map(() => 1)
    );

    const queryId = `${graph.id}-ludf-query`;
    const sourceViews = importLuQuerySourceViews(graph, retainedSource, plan, queryId);
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
      addLuQueryControlUpload(graph, queryId, controls, plan);
    }

    let sourceRowOffset = 0;
    for (const [batchIndex, batch] of retainedSource.batches.entries()) {
      const mask = maskView.data[batchIndex];
      if (batch.numRows > 0) {
        addLuQueryPredicatePass(graph, {
          id: `${queryId}-predicate-batch-${batchIndex}`,
          batchIndex,
          columns: plan.columns,
          sourceViews,
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

    compiledGraph = graph.compile();
    return new CompiledLuDataFrameQuery<Pick<T, ColumnName>>({
      table: selectedSource.table,
      selectionMask,
      rowIndices,
      selectedCounts,
      graph: compiledGraph,
      sourceViews: [selectedSource, retainedSource]
    });
  } catch (error) {
    compiledGraph?.destroy();
    selectionMask?.destroy();
    rowIndices?.destroy();
    selectedCounts?.destroy();
    selectedSource?.destroy();
    retainedSource.destroy();
    throw error;
  }
}

/** Keeps legacy visibility identity/scatter dispatches within the device's 1D workgroup limit. */
function validateLuQueryBatchCapacity<T extends GPUTypeMap>(
  source: LuDataFrame<T>,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): void {
  const maximum = graph.device.limits.maxComputeWorkgroupsPerDimension * LU_QUERY_WORKGROUP_SIZE;
  for (const [batchIndex, batch] of source.batches.entries()) {
    if (batch.numRows > maximum) {
      throw new Error(
        `LuDataFrame source batch ${batchIndex} exceeds visibility dispatch capacity`
      );
    }
  }
}

/** Rejects predicates that exceed portable device storage-buffer binding capacity. */
function validateLuQueryBindingCapacity(
  plan: LuQueryExpressionShaderPlan,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): void {
  const sourceCount = plan.columns.reduce(
    (bindingCount, column) => bindingCount + 1 + (column.nullable ? 1 : 0),
    0
  );
  const bindingCount = sourceCount + (plan.controls.length > 0 ? 1 : 0) + 1;
  if (bindingCount > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error('LuDataFrame filter exceeds the available WebGPU storage-buffer bindings');
  }
}

/** Creates one independently owned fixed-width GPU output chunk for every source batch. */
function createLuQueryOutputVector(
  device: Device,
  name: string,
  lengths: readonly number[],
  indexBuffer = false
): GPUVector<'uint32'> {
  const data: GPUData<'uint32'>[] = [];
  try {
    for (const [batchIndex, length] of lengths.entries()) {
      const buffer = device.createBuffer({
        id: `${name}-batch-${batchIndex}`,
        byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
        usage:
          Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST | (indexBuffer ? Buffer.INDEX : 0),
        ...(indexBuffer ? {indexType: 'uint32' as const} : {})
      });
      try {
        data.push(new GPUData({buffer, format: 'uint32', length, ownsBuffer: true}));
      } catch (error) {
        buffer.destroy();
        throw error;
      }
    }
    return new GPUVector({type: 'data', name, format: 'uint32', data, ownsData: true});
  } catch (error) {
    for (const chunk of data) {
      chunk.destroy();
    }
    throw error;
  }
}

/** Imports each referenced source vector and validity sidecar exactly once. */
function importLuQuerySourceViews<T extends GPUTypeMap>(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  source: LuDataFrame<T>,
  plan: LuQueryExpressionShaderPlan,
  queryId: string
): Map<string, LuQuerySourceView> {
  const views = new Map<string, LuQuerySourceView>();
  for (const column of plan.columns) {
    const vector = source.table.gpuVectors[column.name];
    if (!vector) {
      if (source.batches.length === 0) {
        continue;
      }
      throw new Error(`LuDataFrame expression column "${column.name}" is not a GPU vector`);
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

/** Uploads controls through the caller encoder so consecutive encodings preserve parameter order. */
function addLuQueryControlUpload(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  queryId: string,
  controls: GraphDataView<'uint32'>,
  plan: LuQueryExpressionShaderPlan
): void {
  graph.addCopyPass({
    id: `${queryId}-upload-controls`,
    resources: [{buffer: controls, usage: 'copy-destination'}],
    compile: ({device}) => ({
      encode: ({commandEncoder, getBuffer, parameters}) => {
        const values = encodeLuQueryExpressionControls(plan.controls, parameters);
        device.writeBufferViaCommandEncoder(commandEncoder, getBuffer(controls), values);
      }
    })
  });
}

/** Emits one closed-AST expression kernel for one preserved, nonempty source record batch. */
function addLuQueryPredicatePass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  props: {
    id: string;
    batchIndex: number;
    columns: readonly LuQueryExpressionColumn[];
    sourceViews: ReadonlyMap<string, LuQuerySourceView>;
    controls?: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    plan: LuQueryExpressionShaderPlan;
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
      throw new Error('LuDataFrame expression source chunk is missing');
    }
    declarations.push(
      `const INPUT_${column.index}_OFFSET: u32 = ${getViewElementOffset(values)}u;`
    );
    declarations.push(
      `@group(0) @binding(${bindingIndex++}) var<storage, read> input${column.index}: array<${getLuQueryShaderType(column.format)}>;`
    );
    bindings[`input${column.index}`] = values;
    resources.push({buffer: values, usage: 'storage-read'});

    if (column.nullable) {
      const validity = views?.validity?.data[props.batchIndex];
      if (!validity) {
        throw new Error('LuDataFrame nullable expression source is missing a validity chunk');
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

  declarations.push(`const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;`);
  declarations.push(
    `@group(0) @binding(${bindingIndex}) var<storage, read_write> outputMask: array<u32>;`
  );
  bindings['outputMask'] = props.output;
  resources.push({buffer: props.output, usage: 'storage-write'});

  const dispatchLayout = getBoundedDispatchLayout(
    'LuDataFrame filtering',
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
