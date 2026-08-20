// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {type GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {type GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import {
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUReduction} from '@luma.gl/gpgpu/gpu-core';
import {GPUSort} from '@luma.gl/gpgpu/gpu-core';
import {GPUVisibilityWorkflow} from '@luma.gl/gpgpu/gpu-core';
import {createTransientView, getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addGPUAnalyticsComputePass,
  createGPUAnalyticsOutputVector,
  getGPUAnalyticsInvocationIndexSource,
  getGPUAnalyticsShaderType,
  getGPUAnalyticsVector,
  validateGPUAnalyticsOutputLength,
  validateGPUAnalyticsSource,
  type GPUAnalyticsScalarFormat
} from './gpu-analytics-compiler-utils';
import type {GPUDataFrame} from './gpu-data-frame';
import type {GPUDataFrameDerivedColumn} from './gpu-data-frame-query';
import type {GPUExpression} from './gpu-expression';
import {
  compileGPUDataFrameQuery,
  type CompiledGPUDataFrameQueryProps,
  type GPUDataFrameQueryExtensionContext,
  type GPUDataFrameQueryExtensionResult,
  type GPUDataFrameQueryParameters
} from './gpu-query-compiler';
import {CompiledGPUDataFrameSort} from './gpu-sort-compiler';
import type {GPUDataFrameNormalizedSortOptions} from './gpu-sort-query';

const MAXIMUM_UINT32 = 0xffffffff;
const MAXIMUM_GLOBAL_SORT_ROWS = 0x80000000;

type GPUGlobalSortScratch = {
  encodedKeys: GraphDataView<'uint32'>;
  sourceOrdinals: GraphDataView<'uint32'>;
  sortedKeys: GraphDataView<'uint32'>;
  sortedOrdinals: GraphDataView<'uint32'>;
  sourceClasses: GraphDataView<'uint32'>;
  sourceRows: GraphDataView<'uint32'>;
};

/** Stable cross-batch ordering with explicit GPU-owned global row identities and selected count. */
export class CompiledGPUDataFrameGlobalSort<
  T extends GPUTypeMap = GPUTypeMap
> extends CompiledGPUDataFrameSort<T> {
  /** One dense globally ordered source-row permutation; only the selected prefix is meaningful. */
  readonly globalRowIndices: GPUVector<'uint32'>;
  /** One GPU-resident count of selected rows after applying the optional global top-K limit. */
  readonly globalSelectedCount: GPUVector<'uint32'>;

  /** @internal */
  constructor(
    props: CompiledGPUDataFrameQueryProps<T>,
    column: keyof T & string,
    options: GPUDataFrameNormalizedSortOptions,
    globalRowIndices: GPUVector<'uint32'>,
    globalSelectedCount: GPUVector<'uint32'>
  ) {
    super(props, column, options);
    this.globalRowIndices = globalRowIndices;
    this.globalSelectedCount = globalSelectedCount;
  }
}

/** Adds explicit globally stable ordering while leaving source buffers and batches untouched. */
export function compileGPUDataFrameGlobalSort<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap
>(
  source: GPUDataFrame<Source>,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[],
  column: keyof Selection & string,
  options: GPUDataFrameNormalizedSortOptions,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): CompiledGPUDataFrameGlobalSort<Selection> {
  validateGPUAnalyticsSource(source, [column]);
  validateGPUGlobalSortCapacity(source, graph);
  return compileGPUDataFrameQuery<
    Source,
    Selection,
    Selection,
    CompiledGPUDataFrameGlobalSort<Selection>
  >(source, predicates, selectedColumns, graph, derivedColumns, {
    allowEmptyPredicates: true,
    prepare: context => addGPUGlobalSortToGraph(context, column, options)
  });
}

/** Validates source identity, packed sort length, and storage capacity before GPU allocations. */
function validateGPUGlobalSortCapacity<Source extends GPUTypeMap>(
  source: GPUDataFrame<Source>,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): void {
  if (source.numRows > MAXIMUM_GLOBAL_SORT_ROWS) {
    throw new Error('GPUDataFrame global sorting supports at most 2147483648 source rows');
  }
  if (source.numRows > 0) {
    validateGPUAnalyticsOutputLength(graph, source.numRows);
  }
  let fallbackOffset = 0;
  for (const batch of source.batches) {
    const offset = batch.sourceInfo?.sourceRowIndexOffset ?? fallbackOffset;
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset > MAXIMUM_UINT32 ||
      offset + Math.max(batch.numRows - 1, 0) > MAXIMUM_UINT32
    ) {
      throw new Error('GPUDataFrame global sort source-row identities must fit uint32');
    }
    fallbackOffset += batch.numRows;
  }
}

/** Stages keys and identities explicitly, then stably orders numeric values and null/NaN classes. */
function addGPUGlobalSortToGraph<Selection extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  column: keyof Selection & string,
  options: GPUDataFrameNormalizedSortOptions
): GPUDataFrameQueryExtensionResult<Selection, CompiledGPUDataFrameGlobalSort<Selection>> {
  const graph = context.graph;
  const prefix = `${context.queryId}-global-sort`;
  const ownedVectors: GPUVector[] = [];

  try {
    const input = graph.importGPUVector(`${prefix}-input`, getGPUAnalyticsVector(context, column));
    const field = context.table.schema.fields.find(candidate => candidate.name === column);
    const validityVector = field?.nullable ? context.validity[column] : undefined;
    if (field?.nullable && !validityVector && input.length > 0) {
      throw new Error(`GPUDataFrame nullable global sort column "${column}" requires GPU validity`);
    }
    const validity = validityVector
      ? graph.importGPUVector(`${prefix}-source-validity`, validityVector)
      : undefined;

    const globalRowIndices = createGPUAnalyticsOutputVector(
      graph.device,
      `${prefix}-row-indices`,
      'uint32',
      input.length
    );
    ownedVectors.push(globalRowIndices);
    const globalSelectedCount = createGPUAnalyticsOutputVector(
      graph.device,
      `${prefix}-selected-count`,
      'uint32',
      1
    );
    ownedVectors.push(globalSelectedCount);
    const globalRows = graph.importGPUVector(`${prefix}-row-vector`, globalRowIndices).data[0];
    const selectedCount = graph.importGPUVector(`${prefix}-count-vector`, globalSelectedCount)
      .data[0];

    new GPUReduction({
      id: `${prefix}-count-selected`,
      input: context.selectedCounts,
      output: selectedCount,
      operation: 'sum'
    }).addToGraph(graph);

    if (input.length > 0) {
      const scratch = createGPUGlobalSortScratch(graph, prefix, input.length);
      let globalOffset = 0;
      let fallbackOffset = 0;
      for (const [batchIndex, batch] of context.table.batches.entries()) {
        if (batch.numRows > 0) {
          addGPUGlobalSortStagePass(graph, `${prefix}-stage-batch-${batchIndex}`, {
            input: input.data[batchIndex],
            selection: context.selectionMask.data[batchIndex],
            validity: validity?.data[batchIndex],
            scratch,
            globalOffset,
            sourceOffset: batch.sourceInfo?.sourceRowIndexOffset ?? fallbackOffset,
            options
          });
        }
        globalOffset += batch.numRows;
        fallbackOffset += batch.numRows;
      }

      new GPUSort({
        id: `${prefix}-numeric`,
        keys: scratch.encodedKeys,
        values: scratch.sourceOrdinals,
        outputKeys: scratch.sortedKeys,
        outputValues: scratch.sortedOrdinals,
        direction: options.direction,
        algorithm: options.algorithm
      }).addToGraph(graph);

      addGPUGlobalSortGatherClassesPass(graph, `${prefix}-gather-classes`, scratch);
      new GPUSort({
        id: `${prefix}-classes`,
        keys: scratch.sortedKeys,
        values: scratch.sortedOrdinals,
        outputKeys: scratch.encodedKeys,
        outputValues: scratch.sourceOrdinals,
        direction: 'ascending',
        algorithm: options.algorithm
      }).addToGraph(graph);

      addGPUGlobalSortPublishPass(graph, `${prefix}-publish`, {
        scratch,
        output: globalRows,
        count: selectedCount,
        limit: options.limit ?? MAXIMUM_UINT32
      });

      if (options.limit !== undefined) {
        let globalOffset = 0;
        let fallbackOffset = 0;
        for (const [batchIndex, batch] of context.table.batches.entries()) {
          if (batch.numRows > 0) {
            const selection = context.selectionMask.data[batchIndex];
            addGPUGlobalTopKSelectionPass(graph, `${prefix}-select-batch-${batchIndex}`, {
              ranks: scratch.sourceClasses,
              selection,
              globalOffset,
              limit: options.limit
            });
            new GPUVisibilityWorkflow({
              id: `${prefix}-visibility-batch-${batchIndex}`,
              predicates: [{kind: 'selection', mask: selection}],
              outputMask: selection,
              output: context.rowIndices.data[batchIndex],
              count: context.selectedCounts.data[batchIndex],
              firstSourceIndex: batch.sourceInfo?.sourceRowIndexOffset ?? fallbackOffset
            }).addToGraph(graph);
          }
          globalOffset += batch.numRows;
          fallbackOffset += batch.numRows;
        }
      }
    }

    return {
      table: context.table,
      validity: context.validity,
      dictionaries: context.dictionaries,
      ownedVectors,
      createCompiled: props =>
        new CompiledGPUDataFrameGlobalSort(
          props,
          column,
          options,
          globalRowIndices,
          globalSelectedCount
        )
    };
  } catch (error) {
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Allocates only explicit global permutation scratch; original dataframe vectors remain intact. */
function createGPUGlobalSortScratch(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  prefix: string,
  length: number
): GPUGlobalSortScratch {
  return {
    encodedKeys: createTransientView(graph, `${prefix}-encoded-keys`, 'uint32', length),
    sourceOrdinals: createTransientView(graph, `${prefix}-source-ordinals`, 'uint32', length),
    sortedKeys: createTransientView(graph, `${prefix}-sorted-keys`, 'uint32', length),
    sortedOrdinals: createTransientView(graph, `${prefix}-sorted-ordinals`, 'uint32', length),
    sourceClasses: createTransientView(graph, `${prefix}-source-classes`, 'uint32', length),
    sourceRows: createTransientView(graph, `${prefix}-source-rows`, 'uint32', length)
  };
}

/** Encodes one preserved source batch into explicit global numeric, identity, and class scratch. */
function addGPUGlobalSortStagePass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    input: GraphDataView<GPUAnalyticsScalarFormat>;
    selection: GraphDataView<'uint32'>;
    validity?: GraphDataView<'uint32'>;
    scratch: GPUGlobalSortScratch;
    globalOffset: number;
    sourceOffset: number;
    options: GPUDataFrameNormalizedSortOptions;
  }
): void {
  const format = props.input.format;
  const nullable = Boolean(props.validity);
  const validityBinding = nullable
    ? '@group(0) @binding(2) var<storage, read> validityValues: array<u32>;'
    : '';
  const outputBinding = nullable ? 3 : 2;
  const validityOffset = props.validity ? getViewElementOffset(props.validity) : 0;
  const nullExpression = nullable ? 'validityValues[VALIDITY_OFFSET + index] == 0u' : 'false';
  const nanExpression =
    format === 'float32' ? '(bitcast<u32>(value) & 0x7fffffffu) > 0x7f800000u' : 'false';
  const keyExpression = getGPUGlobalSortNumericKeyExpression(format);
  const nullRank = props.options.nulls === 'first' ? 0 : 2;
  const nanRank =
    props.options.nulls === 'first'
      ? props.options.nans === 'first'
        ? 1
        : 2
      : props.options.nans === 'first'
        ? 0
        : 1;
  const numericRank =
    props.options.nulls === 'first'
      ? props.options.nans === 'first'
        ? 2
        : 1
      : props.options.nans === 'first'
        ? 1
        : 0;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.input.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(props.selection)}u;
const VALIDITY_OFFSET: u32 = ${validityOffset}u;
const GLOBAL_OFFSET: u32 = ${props.globalOffset}u;
const SOURCE_OFFSET: u32 = ${props.sourceOffset}u;
const KEY_OFFSET: u32 = ${getViewElementOffset(props.scratch.encodedKeys)}u;
const ORDINAL_OFFSET: u32 = ${getViewElementOffset(props.scratch.sourceOrdinals)}u;
const CLASS_OFFSET: u32 = ${getViewElementOffset(props.scratch.sourceClasses)}u;
const ROW_OFFSET: u32 = ${getViewElementOffset(props.scratch.sourceRows)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${getGPUAnalyticsShaderType(format)}>;
@group(0) @binding(1) var<storage, read> selectionMask: array<u32>;
${validityBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> encodedKeys: array<u32>;
@group(0) @binding(${outputBinding + 1}) var<storage, read_write> sourceOrdinals: array<u32>;
@group(0) @binding(${outputBinding + 2}) var<storage, read_write> sourceClasses: array<u32>;
@group(0) @binding(${outputBinding + 3}) var<storage, read_write> sourceRows: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, props.input.length)}
  if (index >= ELEMENT_COUNT) { return; }
  let value = inputValues[INPUT_OFFSET + index];
  let isNull = ${nullExpression};
  let isNaN = ${nanExpression};
  let ordinal = GLOBAL_OFFSET + index;
  var rank = ${numericRank}u;
  if (isNaN) { rank = ${nanRank}u; }
  if (isNull) { rank = ${nullRank}u; }
  if (selectionMask[SELECTION_OFFSET + index] == 0u) { rank = 3u; }
  encodedKeys[KEY_OFFSET + ordinal] = select(${keyExpression}, 0u, isNull || isNaN);
  sourceOrdinals[ORDINAL_OFFSET + ordinal] = ordinal;
  sourceClasses[CLASS_OFFSET + ordinal] = rank;
  sourceRows[ROW_OFFSET + ordinal] = SOURCE_OFFSET + index;
}`;
  const resources: GraphBufferUse[] = [
    {buffer: props.input, usage: 'storage-read'},
    {buffer: props.selection, usage: 'storage-read'}
  ];
  const bindings: Record<string, GraphDataView> = {
    inputValues: props.input,
    selectionMask: props.selection
  };
  if (props.validity) {
    resources.push({buffer: props.validity, usage: 'storage-read'});
    bindings['validityValues'] = props.validity;
  }
  for (const [name, view] of [
    ['encodedKeys', props.scratch.encodedKeys],
    ['sourceOrdinals', props.scratch.sourceOrdinals],
    ['sourceClasses', props.scratch.sourceClasses],
    ['sourceRows', props.scratch.sourceRows]
  ] as const) {
    resources.push({buffer: view, usage: 'storage-write'});
    bindings[name] = view;
  }
  addGPUAnalyticsComputePass(graph, {id, source, resources, bindings, length: props.input.length});
}

/** Produces full-width monotonic unsigned keys without sacrificing signed zero or NaN semantics. */
function getGPUGlobalSortNumericKeyExpression(format: GPUAnalyticsScalarFormat): string {
  switch (format) {
    case 'uint32':
      return 'value';
    case 'sint32':
      return 'bitcast<u32>(value) ^ 0x80000000u';
    case 'float32':
      return 'select(bitcast<u32>(value), 0u, value == 0.0) ^ select(0x80000000u, 0xffffffffu, (bitcast<u32>(value) & 0x80000000u) != 0u && value != 0.0)';
  }
}

/** Gathers source null/NaN/filter classes in stable numeric order before the second stable sort. */
function addGPUGlobalSortGatherClassesPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  scratch: GPUGlobalSortScratch
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${scratch.sortedOrdinals.length}u;
const ORDINAL_OFFSET: u32 = ${getViewElementOffset(scratch.sortedOrdinals)}u;
const CLASS_OFFSET: u32 = ${getViewElementOffset(scratch.sourceClasses)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(scratch.sortedKeys)}u;
@group(0) @binding(0) var<storage, read> sortedOrdinals: array<u32>;
@group(0) @binding(1) var<storage, read> sourceClasses: array<u32>;
@group(0) @binding(2) var<storage, read_write> sortedClasses: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, scratch.sortedOrdinals.length)}
  if (index < ELEMENT_COUNT) {
    sortedClasses[OUTPUT_OFFSET + index] =
      sourceClasses[CLASS_OFFSET + sortedOrdinals[ORDINAL_OFFSET + index]];
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: scratch.sortedOrdinals, usage: 'storage-read'},
      {buffer: scratch.sourceClasses, usage: 'storage-read'},
      {buffer: scratch.sortedKeys, usage: 'storage-write'}
    ],
    bindings: {
      sortedOrdinals: scratch.sortedOrdinals,
      sourceClasses: scratch.sourceClasses,
      sortedClasses: scratch.sortedKeys
    },
    length: scratch.sortedOrdinals.length
  });
}

/** Publishes globally stable source rows and stores inverse source ranks for bounded selection. */
function addGPUGlobalSortPublishPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    scratch: GPUGlobalSortScratch;
    output: GraphDataView<'uint32'>;
    count: GraphDataView<'uint32'>;
    limit: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.output.length}u;
const CLASS_OFFSET: u32 = ${getViewElementOffset(props.scratch.encodedKeys)}u;
const ORDINAL_OFFSET: u32 = ${getViewElementOffset(props.scratch.sourceOrdinals)}u;
const SOURCE_ROW_OFFSET: u32 = ${getViewElementOffset(props.scratch.sourceRows)}u;
const RANK_OFFSET: u32 = ${getViewElementOffset(props.scratch.sourceClasses)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(props.count)}u;
const ROW_LIMIT: u32 = ${props.limit}u;
@group(0) @binding(0) var<storage, read> sortedClasses: array<u32>;
@group(0) @binding(1) var<storage, read> sortedOrdinals: array<u32>;
@group(0) @binding(2) var<storage, read> sourceRows: array<u32>;
@group(0) @binding(3) var<storage, read_write> sourceRanks: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputRows: array<u32>;
@group(0) @binding(5) var<storage, read_write> selectedCounts: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, props.output.length)}
  if (index >= ELEMENT_COUNT) { return; }
  let ordinal = sortedOrdinals[ORDINAL_OFFSET + index];
  let accepted = sortedClasses[CLASS_OFFSET + index] != 3u;
  sourceRanks[RANK_OFFSET + ordinal] = select(0xffffffffu, index, accepted);
  outputRows[OUTPUT_OFFSET + index] = select(
    0u,
    sourceRows[SOURCE_ROW_OFFSET + ordinal],
    accepted && index < ROW_LIMIT
  );
  if (index == 0u) {
    selectedCounts[COUNT_OFFSET] = min(selectedCounts[COUNT_OFFSET], ROW_LIMIT);
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: props.scratch.encodedKeys, usage: 'storage-read'},
      {buffer: props.scratch.sourceOrdinals, usage: 'storage-read'},
      {buffer: props.scratch.sourceRows, usage: 'storage-read'},
      {buffer: props.scratch.sourceClasses, usage: 'storage-write'},
      {buffer: props.output, usage: 'storage-write'},
      {buffer: props.count, usage: 'storage-read-write'}
    ],
    bindings: {
      sortedClasses: props.scratch.encodedKeys,
      sortedOrdinals: props.scratch.sourceOrdinals,
      sourceRows: props.scratch.sourceRows,
      sourceRanks: props.scratch.sourceClasses,
      outputRows: props.output,
      selectedCounts: props.count
    },
    length: props.output.length
  });
}

/** Applies a global rank limit back to one original source-aligned selection-mask chunk. */
function addGPUGlobalTopKSelectionPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    ranks: GraphDataView<'uint32'>;
    selection: GraphDataView<'uint32'>;
    globalOffset: number;
    limit: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.selection.length}u;
const RANK_OFFSET: u32 = ${getViewElementOffset(props.ranks) + props.globalOffset}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(props.selection)}u;
const ROW_LIMIT: u32 = ${props.limit}u;
@group(0) @binding(0) var<storage, read> sourceRanks: array<u32>;
@group(0) @binding(1) var<storage, read_write> selectionMask: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, props.selection.length)}
  if (index < ELEMENT_COUNT) {
    selectionMask[SELECTION_OFFSET + index] =
      select(0u, 1u, sourceRanks[RANK_OFFSET + index] < ROW_LIMIT);
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: props.ranks, usage: 'storage-read'},
      {buffer: props.selection, usage: 'storage-write'}
    ],
    bindings: {sourceRanks: props.ranks, selectionMask: props.selection},
    length: props.selection.length
  });
}
