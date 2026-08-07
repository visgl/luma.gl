// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUField,
  type GPUTypeMap
} from '@luma.gl/tables';
import {
  GraphVectorView,
  type GPUCommandGraph,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {GPUGroupAggregation} from '../gpu-primitives/gpu-group-aggregation';
import {GPUMask} from '../gpu-primitives/gpu-mask';
import {
  createTransientVectorView,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addLuAnalyticsComputePass,
  getLuAnalyticsInvocationIndexSource,
  validateLuAnalyticsOutputLength
} from './lu-analytics-compiler-utils';
import type {LuDataFrame, LuDataFrameDictionaries, LuDataFrameValidity} from './lu-data-frame';
import type {LuDataFrameDerivedColumn} from './lu-data-frame-query';
import type {LuExpression} from './lu-expression';
import type {LuDataFrameAggregationDefinition} from './lu-group-by-query';
import {
  CompiledLuDataFrameQuery,
  compileLuDataFrameQuery,
  type CompiledLuDataFrameQueryProps,
  type LuDataFrameQueryExtensionContext,
  type LuDataFrameQueryExtensionResult,
  type LuDataFrameQueryParameters
} from './lu-query-compiler';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const MAXIMUM_UINT32 = 0xffffffff;

type LuGroupedMetricState = {
  values: GraphVectorView<'float32'>;
  mask: GraphVectorView<'uint32'>;
  validity: GPUVector<'uint32'>;
};

/** Dense grouped GPU statistics retaining their original source selection and row identities. */
export class CompiledLuDataFrameGroupedAggregation<
  T extends GPUTypeMap = GPUTypeMap
> extends CompiledLuDataFrameQuery<T> {
  /** Number of dense categorical group rows represented by the grouped result table. */
  readonly groupCount: number;

  /** @internal */
  constructor(props: CompiledLuDataFrameQueryProps<T>, groupCount: number) {
    super(props);
    this.groupCount = groupCount;
  }
}

/** Adds dense categorical aggregation to source-row work before the shared graph is frozen. */
export function compileLuDataFrameGroupedAggregation<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Result extends GPUTypeMap
>(
  source: LuDataFrame<Source>,
  predicates: readonly LuExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly LuDataFrameDerivedColumn[],
  key: keyof Selection & string,
  groupCount: number,
  definitions: readonly LuDataFrameAggregationDefinition[],
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): CompiledLuDataFrameGroupedAggregation<Result> {
  validateLuGroupingCapacity(source, groupCount, graph);
  validateLuGroupingSourceColumns(source, key, definitions);
  return compileLuDataFrameQuery<
    Source,
    Selection,
    Result,
    CompiledLuDataFrameGroupedAggregation<Result>
  >(source, predicates, selectedColumns, graph, derivedColumns, {
    allowEmptyPredicates: true,
    prepare: context =>
      addLuGroupedAggregationToGraph<Selection, Result>(context, key, groupCount, definitions)
  });
}

/** Rejects unsupported constants and explicitly unknown source nullability before GPU allocation. */
function validateLuGroupingSourceColumns<Source extends GPUTypeMap>(
  source: LuDataFrame<Source>,
  key: string,
  definitions: readonly LuDataFrameAggregationDefinition[]
): void {
  const columnNames = new Set([
    key,
    ...definitions.flatMap(definition => (definition.column ? [definition.column] : []))
  ]);
  for (const name of columnNames) {
    if (source.table.gpuConstants[name]) {
      throw new Error(`LuDataFrame grouping column "${name}" must contain GPU vector data`);
    }
    const field = source.schema.fields.find(candidate => candidate.name === name);
    if (field?.nullable && source.numRows > 0 && !source.validity[name as keyof Source & string]) {
      throw new Error(`LuDataFrame nullable grouping column "${name}" requires GPU validity`);
    }
  }
}

/** Rejects overflow and unsupported output dimensions before retaining or allocating GPU state. */
function validateLuGroupingCapacity<Source extends GPUTypeMap>(
  source: LuDataFrame<Source>,
  groupCount: number,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): void {
  if (!Number.isSafeInteger(groupCount) || groupCount <= 0 || groupCount > MAXIMUM_UINT32) {
    throw new Error('LuDataFrame grouping requires a positive uint32 group count');
  }
  if (source.numRows > MAXIMUM_UINT32) {
    throw new Error('LuDataFrame group counts cannot represent more than uint32 source rows');
  }
  validateLuAnalyticsOutputLength(graph, groupCount);
  const byteLength = groupCount * UINT32_BYTE_LENGTH;
  if (
    byteLength > graph.device.limits.maxStorageBufferBindingSize ||
    byteLength > graph.device.limits.maxBufferSize
  ) {
    throw new Error('LuDataFrame group count exceeds the available GPU buffer capacity');
  }
}

/** Creates grouped buffers, null-aware masks, and one cross-batch primitive per requested metric. */
function addLuGroupedAggregationToGraph<Selection extends GPUTypeMap, Result extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  key: keyof Selection & string,
  groupCount: number,
  definitions: readonly LuDataFrameAggregationDefinition[]
): LuDataFrameQueryExtensionResult<Result, CompiledLuDataFrameGroupedAggregation<Result>> {
  const graph = context.graph;
  const prefix = `${context.queryId}-group`;
  const ownedVectors: GPUVector[] = [];
  let resultTable: GPUTable<Result> | undefined;

  try {
    const sourceKeys = getLuGroupingVector(context, key, 'uint32');
    const keys = graph.importGPUVector(`${prefix}-keys`, sourceKeys);
    const keyValidity = getLuGroupingValidity(context, key, keys);
    const baseMask = keyValidity
      ? combineLuGroupingMasks(graph, `${prefix}-key-validity`, context.selectionMask, keyValidity)
      : context.selectionMask;

    const outputVectors = new Map<string, GPUVector<'uint32'> | GPUVector<'float32'>>();
    const groupKeys = createLuGroupedOutputVector(
      graph.device,
      `${prefix}-output-keys`,
      groupCount,
      'uint32'
    );
    ownedVectors.push(groupKeys);
    outputVectors.set(key, groupKeys);
    const groupKeyView = graph.importGPUVector(`${prefix}-output-key-vector`, groupKeys).data[0];
    addLuGroupIdentityPass(graph, `${prefix}-output-key-identity`, groupKeyView);

    const metricStates = new Map<string, LuGroupedMetricState>();
    const validity: Record<string, GPUVector<'uint32'>> = {};

    for (const [definitionIndex, definition] of definitions.entries()) {
      const metricId = `${prefix}-metric-${definitionIndex}`;
      if (definition.operation === 'count') {
        const output = createLuGroupedOutputVector(graph.device, metricId, groupCount, 'uint32');
        ownedVectors.push(output);
        outputVectors.set(definition.name, output);
        new GPUGroupAggregation({
          id: metricId,
          keys,
          mask: baseMask,
          output: graph.importGPUVector(`${metricId}-output`, output).data[0],
          operation: 'count'
        }).addToGraph(graph);
        continue;
      }

      const columnName = definition.column;
      if (!columnName) {
        throw new Error('LuDataFrame grouped statistics require a numeric value column');
      }
      let state = metricStates.get(columnName);
      if (!state) {
        state = createLuGroupedMetricState(
          context,
          keys,
          baseMask,
          columnName,
          groupCount,
          `${prefix}-values-${metricStates.size}`,
          ownedVectors
        );
        metricStates.set(columnName, state);
      }

      const output = createLuGroupedOutputVector(graph.device, metricId, groupCount, 'float32');
      ownedVectors.push(output);
      outputVectors.set(definition.name, output);
      validity[definition.name] = state.validity;
      new GPUGroupAggregation({
        id: metricId,
        keys,
        values: state.values,
        mask: state.mask,
        output: graph.importGPUVector(`${metricId}-output`, output).data[0],
        operation: definition.operation
      }).addToGraph(graph);
    }

    resultTable = createLuGroupedResultTable<Selection, Result>(
      context.table,
      key,
      definitions,
      outputVectors
    );
    const dictionary = context.dictionaries[key];
    const dictionaries = Object.freeze(dictionary ? {[key]: dictionary} : {}) as Readonly<
      LuDataFrameDictionaries<Result>
    >;

    return {
      table: resultTable,
      validity: Object.freeze(validity) as Readonly<LuDataFrameValidity<Result>>,
      dictionaries,
      ownedTables: [resultTable],
      ownedVectors,
      createCompiled: props => new CompiledLuDataFrameGroupedAggregation(props, groupCount)
    };
  } catch (error) {
    resultTable?.destroy();
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Resolves one batch-aligned grouped input, including schema-only sources without GPU chunks. */
function getLuGroupingVector<Selection extends GPUTypeMap, Format extends 'uint32' | 'float32'>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  name: string,
  format: Format
): GPUVector<Format> {
  if (context.table.gpuConstants[name]) {
    throw new Error(`LuDataFrame grouping column "${name}" must contain GPU vector data`);
  }
  const field = context.table.schema.fields.find(candidate => candidate.name === name);
  const vector = context.table.gpuVectors[name];
  if (
    !field ||
    (vector && vector.format !== format) ||
    (!vector && context.table.batches.length > 0)
  ) {
    throw new Error(`LuDataFrame grouping column "${name}" requires ${format} GPU vector data`);
  }
  if (!vector) {
    if (field.format !== format) {
      throw new Error(`LuDataFrame grouping column "${name}" requires ${format} GPU vector data`);
    }
    return new GPUVector({type: 'data', name, format, data: [], ownsData: false});
  }
  return vector as GPUVector<Format>;
}

/** Imports nullable source/derived sidecars and rejects explicitly unknown nonempty validity. */
function getLuGroupingValidity<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  name: string,
  template: GraphVectorView
): GraphVectorView<'uint32'> | undefined {
  const field = context.table.schema.fields.find(candidate => candidate.name === name);
  if (!field?.nullable) {
    return undefined;
  }
  const validity = context.validity[name as keyof Selection & string];
  if (!validity) {
    if (template.length === 0) {
      return undefined;
    }
    throw new Error(`LuDataFrame nullable grouping column "${name}" requires GPU validity`);
  }
  return context.graph.importGPUVector(`${context.queryId}-group-validity-${name}`, validity);
}

/** Intersects two source-row-aligned masks into graph-owned chunk-preserving scratch. */
function combineLuGroupingMasks(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  first: GraphVectorView<'uint32'>,
  second: GraphVectorView<'uint32'>
): GraphVectorView<'uint32'> {
  const output = createTransientVectorView(graph, id, first);
  new GPUMask({id: `${id}-compose`, inputs: [first, second], output}).addToGraph(graph);
  return output;
}

/** Shares null/NaN-filtered source masks and group validity across every metric on one column. */
function createLuGroupedMetricState<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  keys: GraphVectorView<'uint32'>,
  baseMask: GraphVectorView<'uint32'>,
  name: string,
  groupCount: number,
  id: string,
  ownedVectors: GPUVector[]
): LuGroupedMetricState {
  const values = context.graph.importGPUVector(
    `${id}-input`,
    getLuGroupingVector(context, name, 'float32')
  );
  const valueValidity = getLuGroupingValidity(context, name, values);
  const validRows = valueValidity
    ? combineLuGroupingMasks(context.graph, `${id}-validity-mask`, baseMask, valueValidity)
    : baseMask;
  const finiteRows = createTransientVectorView(context.graph, `${id}-finite-mask`, validRows);
  addLuGroupFiniteMaskPasses(context.graph, `${id}-finite`, values, validRows, finiteRows);

  const validity = createLuGroupedOutputVector(
    context.graph.device,
    `${id}-group-validity`,
    groupCount,
    'uint32'
  );
  ownedVectors.push(validity);
  const output = context.graph.importGPUVector(`${id}-group-validity-vector`, validity).data[0];
  new GPUGroupAggregation({
    id: `${id}-accepted-count`,
    keys,
    mask: finiteRows,
    output,
    operation: 'count'
  }).addToGraph(context.graph);
  addLuNormalizeGroupValidityPass(context.graph, `${id}-normalize-validity`, output);
  return {values, mask: finiteRows, validity};
}

/** Creates one owned dense, renderer-compatible result vector with one physical GPU chunk. */
function createLuGroupedOutputVector<Format extends 'uint32' | 'float32'>(
  device: Device,
  name: string,
  length: number,
  format: Format
): GPUVector<Format> {
  const buffer = device.createBuffer({
    id: name,
    byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  try {
    const data = new GPUData({buffer, format, length, ownsBuffer: true});
    return new GPUVector({type: 'data', name, format, data: [data], ownsData: true});
  } catch (error) {
    buffer.destroy();
    throw error;
  }
}

/** Produces one explicit dense categorical batch with independently borrowed output wrappers. */
function createLuGroupedResultTable<Source extends GPUTypeMap, Result extends GPUTypeMap>(
  source: GPUTable<Source>,
  key: string,
  definitions: readonly LuDataFrameAggregationDefinition[],
  vectors: ReadonlyMap<string, GPUVector<'uint32'> | GPUVector<'float32'>>
): GPUTable<Result> {
  const sourceKey = source.schema.fields.find(field => field.name === key);
  if (!sourceKey) {
    throw new Error('LuDataFrame grouped result requires an existing key field');
  }
  const fields: GPUField[] = [
    {
      name: key,
      format: 'uint32',
      nullable: false,
      ...(sourceKey.metadata ? {metadata: new Map(sourceKey.metadata)} : {metadata: new Map()})
    },
    ...definitions.map(definition => ({
      name: definition.name,
      format: definition.operation === 'count' ? ('uint32' as const) : ('float32' as const),
      nullable: definition.operation !== 'count',
      metadata: new Map<string, string>()
    }))
  ];
  const gpuData: Record<string, GPUData> = {};
  for (const field of fields) {
    const sourceData = vectors.get(field.name)?.data[0];
    if (!sourceData) {
      throw new Error('LuDataFrame grouped result is missing an output vector');
    }
    gpuData[field.name] = new GPUData({
      buffer: sourceData.buffer,
      format: sourceData.format,
      length: sourceData.length,
      ownsBuffer: false
    });
  }
  const batch = new GPURecordBatch<Result>({
    gpuData,
    fields,
    metadata: new Map(source.schema.metadata)
  });
  try {
    return new GPUTable<Result>({batches: [batch]});
  } catch (error) {
    batch.destroy();
    throw error;
  }
}

/** Initializes dense category IDs entirely on the GPU without reading or materializing source rows. */
function addLuGroupIdentityPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  output: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getLuAnalyticsInvocationIndexSource(graph, output.length)}
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = index;
  }
}`;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputValues: output},
    length: output.length
  });
}

/** Rejects null, NaN, and infinite contributions without flattening source record batches. */
function addLuGroupFiniteMaskPasses(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  values: GraphVectorView<'float32'>,
  input: GraphVectorView<'uint32'>,
  output: GraphVectorView<'uint32'>
): void {
  for (const [chunkIndex, mask] of output.data.entries()) {
    if (mask.length === 0) {
      continue;
    }
    const value = values.data[chunkIndex];
    const sourceMask = input.data[chunkIndex];
    const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${mask.length}u;
const VALUE_OFFSET: u32 = ${getViewElementOffset(value)}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(sourceMask)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(mask)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<f32>;
@group(0) @binding(1) var<storage, read> inputMask: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputMask: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getLuAnalyticsInvocationIndexSource(graph, mask.length)}
  if (index < ELEMENT_COUNT) {
    let value = inputValues[VALUE_OFFSET + index];
    let finite = value == value && abs(value) <= 3.402823466e+38;
    outputMask[OUTPUT_OFFSET + index] = select(
      0u,
      1u,
      inputMask[INPUT_OFFSET + index] != 0u && finite
    );
  }
}`;
    addLuAnalyticsComputePass(graph, {
      id: `${id}-chunk-${chunkIndex}`,
      source,
      resources: [
        {buffer: value, usage: 'storage-read'},
        {buffer: sourceMask, usage: 'storage-read'},
        {buffer: mask, usage: 'storage-write'}
      ],
      bindings: {inputValues: value, inputMask: sourceMask, outputMask: mask},
      length: mask.length
    });
  }
}

/** Converts accepted floating-point contribution counts into canonical 0/1 validity flags. */
function addLuNormalizeGroupValidityPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  validity: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${validity.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(validity)}u;
@group(0) @binding(0) var<storage, read_write> outputValidity: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getLuAnalyticsInvocationIndexSource(graph, validity.length)}
  if (index < ELEMENT_COUNT) {
    let offset = OUTPUT_OFFSET + index;
    outputValidity[offset] = select(0u, 1u, outputValidity[offset] != 0u);
  }
}`;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources: [{buffer: validity, usage: 'storage-read-write'}],
    bindings: {outputValidity: validity},
    length: validity.length
  });
}
