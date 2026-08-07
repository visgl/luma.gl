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
} from '../gpu-primitives/gpu-command-graph';
import {GPUReduction} from '../gpu-primitives/gpu-reduction';
import {createTransientView, getViewElementOffset} from '../gpu-primitives/graph-data-view-utils';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addLuAnalyticsComputePass,
  createLuAnalyticsOutputVector,
  createLuAnalyticsResultTable,
  createLuAnalyticsTransientVector,
  getLuAnalyticsSelectionMask,
  getLuAnalyticsInvocationIndexSource,
  getLuAnalyticsShaderType,
  getLuAnalyticsVector,
  validateLuAnalyticsSource,
  type LuAnalyticsScalarFormat
} from './lu-analytics-compiler-utils';
import type {LuDataFrame, LuDataFrameDictionaries, LuDataFrameValidity} from './lu-data-frame';
import type {LuDataFrameDerivedColumn} from './lu-data-frame-query';
import type {LuExpression} from './lu-expression';
import type {LuDataFrameAggregationDefinition} from './lu-group-by-query';
import {
  CompiledLuDataFrameQuery,
  compileLuDataFrameQuery,
  type LuDataFrameQueryExtensionContext,
  type LuDataFrameQueryExtensionResult,
  type LuDataFrameQueryParameters
} from './lu-query-compiler';

type LuGlobalMetricState = {
  values: GraphVectorView<LuAnalyticsScalarFormat>;
  acceptedRows: GraphVectorView<'uint32'>;
  acceptedCount: GraphDataView<'uint32'>;
  validity: GPUVector<'uint32'>;
  sanitized: Map<string, GraphVectorView<LuAnalyticsScalarFormat>>;
};

/** One-row GPU-resident global aggregation with source-aligned selection and explicit validity. */
export class CompiledLuDataFrameAggregation<
  T extends GPUTypeMap = GPUTypeMap
> extends CompiledLuDataFrameQuery<T> {}

/** Lowers global statistics into masked, chunk-preserving GPU reductions before graph compilation. */
export function compileLuDataFrameAggregation<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Result extends GPUTypeMap
>(
  source: LuDataFrame<Source>,
  predicates: readonly LuExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly LuDataFrameDerivedColumn[],
  definitions: readonly LuDataFrameAggregationDefinition[],
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): CompiledLuDataFrameAggregation<Result> {
  validateLuAnalyticsSource(
    source,
    definitions.flatMap(definition => (definition.column ? [definition.column] : []))
  );
  return compileLuDataFrameQuery<Source, Selection, Result, CompiledLuDataFrameAggregation<Result>>(
    source,
    predicates,
    selectedColumns,
    graph,
    derivedColumns,
    {
      allowEmptyPredicates: true,
      prepare: context => addLuGlobalAggregationsToGraph<Selection, Result>(context, definitions)
    }
  );
}

/** Materializes independent one-row statistics while sharing per-column acceptance and validity. */
function addLuGlobalAggregationsToGraph<Selection extends GPUTypeMap, Result extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  definitions: readonly LuDataFrameAggregationDefinition[]
): LuDataFrameQueryExtensionResult<Result, CompiledLuDataFrameAggregation<Result>> {
  const prefix = `${context.queryId}-global`;
  const ownedVectors: GPUVector[] = [];
  let table: ReturnType<typeof createLuAnalyticsResultTable<Selection, Result>> | undefined;

  try {
    const vectors = new Map<string, GPUVector<LuAnalyticsScalarFormat>>();
    const fields: GPUField[] = [];
    const validity: Record<string, GPUVector<'uint32'>> = {};
    const metricStates = new Map<string, LuGlobalMetricState>();

    for (const [definitionIndex, definition] of definitions.entries()) {
      const id = `${prefix}-metric-${definitionIndex}`;
      if (definition.operation === 'count') {
        const output = createLuAnalyticsOutputVector(context.graph.device, id, 'uint32', 1);
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
        throw new Error('LuDataFrame global statistics require a numeric source column');
      }
      let state = metricStates.get(name);
      if (!state) {
        state = createLuGlobalMetricState(
          context,
          name,
          `${prefix}-values-${metricStates.size}`,
          ownedVectors
        );
        metricStates.set(name, state);
      }

      const format = definition.operation === 'mean' ? 'float32' : state.values.format;
      const output = createLuAnalyticsOutputVector(context.graph.device, id, format, 1);
      ownedVectors.push(output);
      vectors.set(definition.name, output);
      validity[definition.name] = state.validity;
      fields.push({name: definition.name, format, nullable: true, metadata: new Map()});

      const sanitized = getLuSanitizedMetricValues(context, state, definition.operation, id);
      const outputView = context.graph.importGPUVector(`${id}-output`, output).data[0];
      new GPUReduction({
        id: `${id}-reduce`,
        input: sanitized,
        output: outputView,
        operation: definition.operation === 'mean' ? 'sum' : definition.operation
      }).addToGraph(context.graph);
      if (definition.operation !== 'sum') {
        addLuFinalizeGlobalMetricPass(
          context.graph,
          `${id}-finalize`,
          outputView,
          state.acceptedCount,
          definition.operation
        );
      }
    }

    table = createLuAnalyticsResultTable<Selection, Result>(context.table, fields, vectors);
    return {
      table,
      validity: Object.freeze(validity) as Readonly<LuDataFrameValidity<Result>>,
      dictionaries: Object.freeze({}) as Readonly<LuDataFrameDictionaries<Result>>,
      ownedTables: [table],
      ownedVectors,
      createCompiled: props => new CompiledLuDataFrameAggregation(props)
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
function createLuGlobalMetricState<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  name: string,
  id: string,
  ownedVectors: GPUVector[]
): LuGlobalMetricState {
  const vector = getLuAnalyticsVector(context, name);
  const values = context.graph.importGPUVector(`${id}-input`, vector);
  const selectedRows = getLuAnalyticsSelectionMask(context, name, id);
  const acceptedRows =
    values.format === 'float32'
      ? createLuGlobalFiniteMask(
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

  const validity = createLuAnalyticsOutputVector(
    context.graph.device,
    `${id}-output-validity`,
    'uint32',
    1
  );
  ownedVectors.push(validity);
  addLuGlobalValidityPass(
    context.graph,
    `${id}-normalize-validity`,
    acceptedCount,
    context.graph.importGPUVector(`${id}-validity-vector`, validity).data[0]
  );
  return {values, acceptedRows, acceptedCount, validity, sanitized: new Map()};
}

/** Removes NaN and infinity after query selection and nullable source validity are applied. */
function createLuGlobalFiniteMask(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  values: GraphVectorView<'float32'>,
  selectedRows: GraphVectorView<'uint32'>
): GraphVectorView<'uint32'> {
  const output = createLuAnalyticsTransientVector(graph, id, selectedRows, 'uint32');
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
  ${getLuAnalyticsInvocationIndexSource(graph, mask.length)}
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
    addLuAnalyticsComputePass(graph, {
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
function getLuSanitizedMetricValues<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  state: LuGlobalMetricState,
  operation: Exclude<LuDataFrameAggregationDefinition['operation'], 'count'>,
  id: string
): GraphVectorView<LuAnalyticsScalarFormat> {
  const outputFormat = operation === 'mean' ? 'float32' : state.values.format;
  const cacheKey = `${outputFormat}-${operation === 'mean' ? 'sum' : operation}`;
  const cached = state.sanitized.get(cacheKey);
  if (cached) {
    return cached;
  }
  const output = createLuAnalyticsTransientVector(
    context.graph,
    `${id}-sanitized`,
    state.values,
    outputFormat
  );
  const inputType = getLuAnalyticsShaderType(state.values.format);
  const outputType = getLuAnalyticsShaderType(outputFormat);
  const identity = getLuGlobalIdentity(outputFormat, operation);

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
  ${getLuAnalyticsInvocationIndexSource(context.graph, destination.length)}
  if (index < ELEMENT_COUNT) {
    let value = ${outputType}(inputValues[INPUT_OFFSET + index]);
    outputValues[OUTPUT_OFFSET + index] = select(
      ${identity},
      value,
      inputMask[MASK_OFFSET + index] != 0u
    );
  }
}`;
    addLuAnalyticsComputePass(context.graph, {
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
function getLuGlobalIdentity(
  format: LuAnalyticsScalarFormat,
  operation: Exclude<LuDataFrameAggregationDefinition['operation'], 'count'>
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
function addLuGlobalValidityPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
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
  addLuAnalyticsComputePass(graph, {
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
function addLuFinalizeGlobalMetricPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  output: GraphDataView<LuAnalyticsScalarFormat>,
  acceptedCount: GraphDataView<'uint32'>,
  operation: 'min' | 'max' | 'mean'
): void {
  const outputType = getLuAnalyticsShaderType(output.format);
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
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources,
    bindings: {acceptedCounts: acceptedCount, outputValues: output},
    length: 1
  });
}
