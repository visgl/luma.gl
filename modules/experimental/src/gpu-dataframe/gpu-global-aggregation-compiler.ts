// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {GPUVector, type GPUField, type GPUTypeMap} from '@luma.gl/tables';
import {
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '../gpu-core/gpu-command-graph';
import {GPUReduction} from '../gpu-core/gpu-reduction';
import {createTransientView, getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addGPUAnalyticsComputePass,
  createGPUAnalyticsOutputVector,
  createGPUAnalyticsResultTable,
  createGPUAnalyticsTransientVector,
  getGPUAnalyticsSelectionMask,
  getGPUAnalyticsInvocationIndexSource,
  getGPUAnalyticsShaderType,
  getGPUAnalyticsVector,
  validateGPUAnalyticsSource,
  type GPUAnalyticsScalarFormat
} from './gpu-analytics-compiler-utils';
import type {GPUDataFrame, GPUDataFrameDictionaries, GPUDataFrameValidity} from './gpu-data-frame';
import type {GPUDataFrameDerivedColumn} from './gpu-data-frame-query';
import type {GPUExpression} from './gpu-expression';
import type {GPUDataFrameAggregationDefinition} from './gpu-group-by-query';
import {
  CompiledGPUDataFrameQuery,
  compileGPUDataFrameQuery,
  type GPUDataFrameQueryExtensionContext,
  type GPUDataFrameQueryExtensionResult,
  type GPUDataFrameQueryParameters
} from './gpu-query-compiler';

type GPUGlobalMetricState = {
  values: GraphVectorView<GPUAnalyticsScalarFormat>;
  acceptedRows: GraphVectorView<'uint32'>;
  acceptedCount: GraphDataView<'uint32'>;
  validity: GPUVector<'uint32'>;
  sanitized: Map<string, GraphVectorView<GPUAnalyticsScalarFormat>>;
};

/** One-row GPU-resident global aggregation with source-aligned selection and explicit validity. */
export class CompiledGPUDataFrameAggregation<
  T extends GPUTypeMap = GPUTypeMap
> extends CompiledGPUDataFrameQuery<T> {}

/** Lowers global statistics into masked, chunk-preserving GPU reductions before graph compilation. */
export function compileGPUDataFrameAggregation<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Result extends GPUTypeMap
>(
  source: GPUDataFrame<Source>,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[],
  definitions: readonly GPUDataFrameAggregationDefinition[],
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): CompiledGPUDataFrameAggregation<Result> {
  validateGPUAnalyticsSource(
    source,
    definitions.flatMap(definition => (definition.column ? [definition.column] : []))
  );
  return compileGPUDataFrameQuery<
    Source,
    Selection,
    Result,
    CompiledGPUDataFrameAggregation<Result>
  >(source, predicates, selectedColumns, graph, derivedColumns, {
    allowEmptyPredicates: true,
    prepare: context => addGPUGlobalAggregationsToGraph<Selection, Result>(context, definitions)
  });
}

/** Materializes independent one-row statistics while sharing per-column acceptance and validity. */
function addGPUGlobalAggregationsToGraph<Selection extends GPUTypeMap, Result extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  definitions: readonly GPUDataFrameAggregationDefinition[]
): GPUDataFrameQueryExtensionResult<Result, CompiledGPUDataFrameAggregation<Result>> {
  const prefix = `${context.queryId}-global`;
  const ownedVectors: GPUVector[] = [];
  let table: ReturnType<typeof createGPUAnalyticsResultTable<Selection, Result>> | undefined;

  try {
    const vectors = new Map<string, GPUVector<GPUAnalyticsScalarFormat>>();
    const fields: GPUField[] = [];
    const validity: Record<string, GPUVector<'uint32'>> = {};
    const metricStates = new Map<string, GPUGlobalMetricState>();

    for (const [definitionIndex, definition] of definitions.entries()) {
      const id = `${prefix}-metric-${definitionIndex}`;
      if (definition.operation === 'count') {
        const output = createGPUAnalyticsOutputVector(context.graph.device, id, 'uint32', 1);
        ownedVectors.push(output);
        vectors.set(definition.name, output);
        fields.push({
          name: definition.name,
          format: 'uint32',
          nullable: false,
          metadata: new Map()
        });
        new GPUReduction({
          id,
          input: context.selectionMask,
          output: context.graph.importGPUVector(`${id}-output`, output).data[0],
          operation: 'sum'
        }).addToGraph(context.graph);
        continue;
      }

      const name = definition.column;
      if (!name) {
        throw new Error('GPUDataFrame global statistics require a numeric source column');
      }
      let state = metricStates.get(name);
      if (!state) {
        state = createGPUGlobalMetricState(
          context,
          name,
          `${prefix}-values-${metricStates.size}`,
          ownedVectors
        );
        metricStates.set(name, state);
      }

      const format = definition.operation === 'mean' ? 'float32' : state.values.format;
      const output = createGPUAnalyticsOutputVector(context.graph.device, id, format, 1);
      ownedVectors.push(output);
      vectors.set(definition.name, output);
      validity[definition.name] = state.validity;
      fields.push({name: definition.name, format, nullable: true, metadata: new Map()});

      const sanitized = getGPUSanitizedMetricValues(context, state, definition.operation, id);
      const outputView = context.graph.importGPUVector(`${id}-output`, output).data[0];
      new GPUReduction({
        id: `${id}-reduce`,
        input: sanitized,
        output: outputView,
        operation: definition.operation === 'mean' ? 'sum' : definition.operation
      }).addToGraph(context.graph);
      if (definition.operation !== 'sum') {
        addGPUFinalizeGlobalMetricPass(
          context.graph,
          `${id}-finalize`,
          outputView,
          state.acceptedCount,
          definition.operation
        );
      }
    }

    table = createGPUAnalyticsResultTable<Selection, Result>(context.table, fields, vectors);
    return {
      table,
      validity: Object.freeze(validity) as Readonly<GPUDataFrameValidity<Result>>,
      dictionaries: Object.freeze({}) as Readonly<GPUDataFrameDictionaries<Result>>,
      ownedTables: [table],
      ownedVectors,
      createCompiled: props => new CompiledGPUDataFrameAggregation(props)
    };
  } catch (error) {
    table?.destroy();
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Builds one source-aligned null/finite mask, one accepted-row reduction, and one validity flag. */
function createGPUGlobalMetricState<Selection extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  name: string,
  id: string,
  ownedVectors: GPUVector[]
): GPUGlobalMetricState {
  const vector = getGPUAnalyticsVector(context, name);
  const values = context.graph.importGPUVector(`${id}-input`, vector);
  const selectedRows = getGPUAnalyticsSelectionMask(context, name, id);
  const acceptedRows =
    values.format === 'float32'
      ? createGPUGlobalFiniteMask(
          context.graph,
          `${id}-finite`,
          values as GraphVectorView<'float32'>,
          selectedRows
        )
      : selectedRows;
  const acceptedCount = createTransientView(context.graph, `${id}-accepted-count`, 'uint32', 1);
  new GPUReduction({
    id: `${id}-count-valid`,
    input: acceptedRows,
    output: acceptedCount,
    operation: 'sum'
  }).addToGraph(context.graph);

  const validity = createGPUAnalyticsOutputVector(
    context.graph.device,
    `${id}-output-validity`,
    'uint32',
    1
  );
  ownedVectors.push(validity);
  addGPUGlobalValidityPass(
    context.graph,
    `${id}-normalize-validity`,
    acceptedCount,
    context.graph.importGPUVector(`${id}-validity-vector`, validity).data[0]
  );
  return {values, acceptedRows, acceptedCount, validity, sanitized: new Map()};
}

/** Removes NaN and infinity after query selection and nullable source validity are applied. */
function createGPUGlobalFiniteMask(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  values: GraphVectorView<'float32'>,
  selectedRows: GraphVectorView<'uint32'>
): GraphVectorView<'uint32'> {
  const output = createGPUAnalyticsTransientVector(graph, id, selectedRows, 'uint32');
  for (const [chunkIndex, mask] of output.data.entries()) {
    if (mask.length === 0) {
      continue;
    }
    const input = values.data[chunkIndex];
    const selection = selectedRows.data[chunkIndex];
    const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${mask.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(input)}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(selection)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(mask)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<f32>;
@group(0) @binding(1) var<storage, read> selectionMask: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputMask: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, mask.length)}
  if (index < ELEMENT_COUNT) {
    let value = inputValues[INPUT_OFFSET + index];
    let finite = value == value && abs(value) <= 3.402823466e+38;
    outputMask[OUTPUT_OFFSET + index] = select(
      0u,
      1u,
      selectionMask[SELECTION_OFFSET + index] != 0u && finite
    );
  }
}`;
    addGPUAnalyticsComputePass(graph, {
      id: `${id}-chunk-${chunkIndex}`,
      source,
      resources: [
        {buffer: input, usage: 'storage-read'},
        {buffer: selection, usage: 'storage-read'},
        {buffer: mask, usage: 'storage-write'}
      ],
      bindings: {inputValues: input, selectionMask: selection, outputMask: mask},
      length: mask.length
    });
  }
  return output;
}

/** Creates cached source-aligned values with operation-specific identity rows for invalid inputs. */
function getGPUSanitizedMetricValues<Selection extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  state: GPUGlobalMetricState,
  operation: Exclude<GPUDataFrameAggregationDefinition['operation'], 'count'>,
  id: string
): GraphVectorView<GPUAnalyticsScalarFormat> {
  const outputFormat = operation === 'mean' ? 'float32' : state.values.format;
  const cacheKey = `${outputFormat}-${operation === 'mean' ? 'sum' : operation}`;
  const cached = state.sanitized.get(cacheKey);
  if (cached) {
    return cached;
  }
  const output = createGPUAnalyticsTransientVector(
    context.graph,
    `${id}-sanitized`,
    state.values,
    outputFormat
  );
  const inputType = getGPUAnalyticsShaderType(state.values.format);
  const outputType = getGPUAnalyticsShaderType(outputFormat);
  const identity = getGPUGlobalIdentity(outputFormat, operation);

  for (const [chunkIndex, destination] of output.data.entries()) {
    if (destination.length === 0) {
      continue;
    }
    const input = state.values.data[chunkIndex];
    const mask = state.acceptedRows.data[chunkIndex];
    const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${destination.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(input)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(mask)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(destination)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${inputType}>;
@group(0) @binding(1) var<storage, read> inputMask: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<${outputType}>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(context.graph, destination.length)}
  if (index < ELEMENT_COUNT) {
    let value = ${outputType}(inputValues[INPUT_OFFSET + index]);
    outputValues[OUTPUT_OFFSET + index] = select(
      ${identity},
      value,
      inputMask[MASK_OFFSET + index] != 0u
    );
  }
}`;
    addGPUAnalyticsComputePass(context.graph, {
      id: `${id}-sanitize-chunk-${chunkIndex}`,
      source,
      resources: [
        {buffer: input, usage: 'storage-read'},
        {buffer: mask, usage: 'storage-read'},
        {buffer: destination, usage: 'storage-write'}
      ],
      bindings: {inputValues: input, inputMask: mask, outputValues: destination},
      length: destination.length
    });
  }

  state.sanitized.set(cacheKey, output);
  return output;
}

/** Returns the operation identity used by masked scalar reductions. */
function getGPUGlobalIdentity(
  format: GPUAnalyticsScalarFormat,
  operation: Exclude<GPUDataFrameAggregationDefinition['operation'], 'count'>
): string {
  if (operation === 'sum' || operation === 'mean') {
    return format === 'float32' ? '0.0' : format === 'uint32' ? '0u' : '0i';
  }
  if (format === 'float32') {
    return operation === 'min' ? '3.402823466e+38' : '-3.402823466e+38';
  }
  if (operation === 'min') {
    return format === 'uint32' ? '0xffffffffu' : '2147483647i';
  }
  return format === 'uint32' ? '0u' : 'bitcast<i32>(0x80000000u)';
}

/** Publishes one canonical 0/1 validity value without destroying the accepted-row count. */
function addGPUGlobalValidityPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  acceptedCount: GraphDataView<'uint32'>,
  validity: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const COUNT_OFFSET: u32 = ${getViewElementOffset(acceptedCount)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(validity)}u;
@group(0) @binding(0) var<storage, read> acceptedCounts: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValidity: array<u32>;

@compute @workgroup_size(1)
fn main() {
  outputValidity[VALIDITY_OFFSET] = select(0u, 1u, acceptedCounts[COUNT_OFFSET] != 0u);
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: acceptedCount, usage: 'storage-read'},
      {buffer: validity, usage: 'storage-write'}
    ],
    bindings: {acceptedCounts: acceptedCount, outputValidity: validity},
    length: 1
  });
}

/** Applies empty-input semantics and computes floating-point means from valid contribution counts. */
function addGPUFinalizeGlobalMetricPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  output: GraphDataView<GPUAnalyticsScalarFormat>,
  acceptedCount: GraphDataView<'uint32'>,
  operation: 'min' | 'max' | 'mean'
): void {
  const outputType = getGPUAnalyticsShaderType(output.format);
  const empty = output.format === 'float32' ? 'bitcast<f32>(count | 0x7fc00000u)' : '0';
  const populated =
    operation === 'mean'
      ? 'outputValues[OUTPUT_OFFSET] / f32(count)'
      : 'outputValues[OUTPUT_OFFSET]';
  const source = /* wgsl */ `
const COUNT_OFFSET: u32 = ${getViewElementOffset(acceptedCount)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read> acceptedCounts: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${outputType}>;

@compute @workgroup_size(1)
fn main() {
  let count = acceptedCounts[COUNT_OFFSET];
  if (count == 0u) {
    outputValues[OUTPUT_OFFSET] = ${empty};
  } else {
    outputValues[OUTPUT_OFFSET] = ${populated};
  }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: acceptedCount, usage: 'storage-read'},
    {buffer: output, usage: 'storage-read-write'}
  ];
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources,
    bindings: {acceptedCounts: acceptedCount, outputValues: output},
    length: 1
  });
}
