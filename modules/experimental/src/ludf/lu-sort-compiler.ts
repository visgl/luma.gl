// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUTypeMap} from '@luma.gl/tables';
import {GPUBatchSort} from '../gpu-primitives/gpu-batch-sort';
import {
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {
  createTransientVectorView,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addLuAnalyticsComputePass,
  getLuAnalyticsShaderType,
  getLuAnalyticsVector,
  validateLuAnalyticsSource,
  type LuAnalyticsScalarFormat
} from './lu-analytics-compiler-utils';
import type {LuDataFrame} from './lu-data-frame';
import type {LuDataFrameDerivedColumn} from './lu-data-frame-query';
import type {LuExpression} from './lu-expression';
import {
  CompiledLuDataFrameQuery,
  compileLuDataFrameQuery,
  type CompiledLuDataFrameQueryProps,
  type LuDataFrameQueryExtensionContext,
  type LuDataFrameQueryExtensionResult,
  type LuDataFrameQueryParameters
} from './lu-query-compiler';
import type {LuDataFrameNormalizedSortOptions} from './lu-sort-query';

const MAXIMUM_UINT32 = 0xffffffff;

type LuSortChunk = {
  input: GraphDataView<LuAnalyticsScalarFormat>;
  selection: GraphDataView<'uint32'>;
  validity?: GraphDataView<'uint32'>;
  encodedKeys: GraphDataView<'uint32'>;
  localIndices: GraphDataView<'uint32'>;
  sortedKeys: GraphDataView<'uint32'>;
  sortedIndices: GraphDataView<'uint32'>;
};

/** Stable, source-batch-preserving numeric row ordering with optional per-batch top-K limits. */
export class CompiledLuDataFrameSort<
  T extends GPUTypeMap = GPUTypeMap
> extends CompiledLuDataFrameQuery<T> {
  /** Selected numeric source or derived column used to produce the row permutation. */
  readonly sortColumn: keyof T & string;
  /** Final order of valid numeric source values. */
  readonly direction: LuDataFrameNormalizedSortOptions['direction'];
  /** Placement of explicitly null source rows, outside the numeric/NaN groups. */
  readonly nulls: LuDataFrameNormalizedSortOptions['nulls'];
  /** Placement of NaN source rows within the non-null group. */
  readonly nans: LuDataFrameNormalizedSortOptions['nans'];
  /** Stable sort algorithm requested independently for every source batch. */
  readonly algorithm: LuDataFrameNormalizedSortOptions['algorithm'];
  /** Optional maximum number of retained rows in each original source batch. */
  readonly limit?: number;

  /** @internal */
  constructor(
    props: CompiledLuDataFrameQueryProps<T>,
    column: keyof T & string,
    options: LuDataFrameNormalizedSortOptions
  ) {
    super(props);
    this.sortColumn = column;
    this.direction = options.direction;
    this.nulls = options.nulls;
    this.nans = options.nans;
    this.algorithm = options.algorithm;
    this.limit = options.limit;
  }
}

/** Adds stable numeric ordering to one reusable filter/derived graph without repacking batches. */
export function compileLuDataFrameSort<Source extends GPUTypeMap, Selection extends GPUTypeMap>(
  source: LuDataFrame<Source>,
  predicates: readonly LuExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly LuDataFrameDerivedColumn[],
  column: keyof Selection & string,
  options: LuDataFrameNormalizedSortOptions,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): CompiledLuDataFrameSort<Selection> {
  validateLuAnalyticsSource(source, [column]);
  validateLuSortSourceOffsets(source);
  return compileLuDataFrameQuery<Source, Selection, Selection, CompiledLuDataFrameSort<Selection>>(
    source,
    predicates,
    selectedColumns,
    graph,
    derivedColumns,
    {
      allowEmptyPredicates: true,
      prepare: context => addLuBatchSortToGraph(context, column, options)
    }
  );
}

/** Ensures stable source-row identifiers remain exactly representable by uint32 output vectors. */
function validateLuSortSourceOffsets<Source extends GPUTypeMap>(source: LuDataFrame<Source>): void {
  let sourceOffset = 0;
  for (const batch of source.batches) {
    const offset = batch.sourceInfo?.sourceRowIndexOffset ?? sourceOffset;
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset > MAXIMUM_UINT32 ||
      offset + Math.max(batch.numRows - 1, 0) > MAXIMUM_UINT32
    ) {
      throw new Error('LuDataFrame sort source-row identities must fit uint32');
    }
    sourceOffset += batch.numRows;
  }
}

/** Composes one stable full-width numeric sort and one stable selected/null/NaN class sort. */
function addLuBatchSortToGraph<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  column: keyof Selection & string,
  options: LuDataFrameNormalizedSortOptions
): LuDataFrameQueryExtensionResult<Selection, CompiledLuDataFrameSort<Selection>> {
  const graph = context.graph;
  const id = `${context.queryId}-sort`;
  const vector = getLuAnalyticsVector(context, column);
  const input = graph.importGPUVector(`${id}-input`, vector);
  const field = context.table.schema.fields.find(candidate => candidate.name === column);
  const validityVector = field?.nullable ? context.validity[column] : undefined;
  if (field?.nullable && !validityVector && input.length > 0) {
    throw new Error(`LuDataFrame nullable sort column "${column}" requires GPU validity`);
  }
  const validity = validityVector
    ? graph.importGPUVector(`${id}-source-validity`, validityVector)
    : undefined;

  const encodedKeys = createTransientVectorView(graph, `${id}-encoded-keys`, context.selectionMask);
  const localIndices = createTransientVectorView(
    graph,
    `${id}-local-indices`,
    context.selectionMask
  );
  const sortedKeys = createTransientVectorView(graph, `${id}-sorted-keys`, context.selectionMask);
  const sortedIndices = createTransientVectorView(
    graph,
    `${id}-sorted-indices`,
    context.selectionMask
  );

  for (const [batchIndex, values] of input.data.entries()) {
    if (values.length === 0) {
      continue;
    }
    addLuSortEncodeKeysPass(graph, `${id}-encode-batch-${batchIndex}`, {
      input: values,
      selection: context.selectionMask.data[batchIndex],
      validity: validity?.data[batchIndex],
      encodedKeys: encodedKeys.data[batchIndex],
      localIndices: localIndices.data[batchIndex],
      sortedKeys: sortedKeys.data[batchIndex],
      sortedIndices: sortedIndices.data[batchIndex]
    });
  }

  new GPUBatchSort({
    id: `${id}-numeric`,
    keys: encodedKeys,
    values: localIndices,
    outputKeys: sortedKeys,
    outputValues: sortedIndices,
    direction: options.direction,
    algorithm: options.algorithm
  }).addToGraph(graph);

  for (const [batchIndex, values] of input.data.entries()) {
    if (values.length === 0) {
      continue;
    }
    addLuSortEncodeClassesPass(
      graph,
      `${id}-classify-batch-${batchIndex}`,
      {
        input: values,
        selection: context.selectionMask.data[batchIndex],
        validity: validity?.data[batchIndex],
        encodedKeys: encodedKeys.data[batchIndex],
        localIndices: localIndices.data[batchIndex],
        sortedKeys: sortedKeys.data[batchIndex],
        sortedIndices: sortedIndices.data[batchIndex]
      },
      options
    );
  }

  new GPUBatchSort({
    id: `${id}-classes`,
    keys: sortedKeys,
    values: sortedIndices,
    outputKeys: encodedKeys,
    outputValues: localIndices,
    direction: 'ascending',
    algorithm: options.algorithm
  }).addToGraph(graph);

  let sourceOffset = 0;
  for (const [batchIndex, batch] of context.table.batches.entries()) {
    if (batch.numRows > 0) {
      addLuSortPublishPermutationPass(graph, `${id}-publish-batch-${batchIndex}`, {
        sortedClasses: encodedKeys.data[batchIndex],
        sortedIndices: localIndices.data[batchIndex],
        selection: context.selectionMask.data[batchIndex],
        outputIndices: context.rowIndices.data[batchIndex],
        selectedCount: context.selectedCounts.data[batchIndex],
        sourceOffset: batch.sourceInfo?.sourceRowIndexOffset ?? sourceOffset,
        limit: options.limit ?? MAXIMUM_UINT32
      });
    }
    sourceOffset += batch.numRows;
  }

  return {
    table: context.table,
    validity: context.validity,
    dictionaries: context.dictionaries,
    createCompiled: props => new CompiledLuDataFrameSort(props, column, options)
  };
}

/** Encodes signed/floating order into the complete unsigned domain and preserves stable ties. */
function addLuSortEncodeKeysPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  chunk: LuSortChunk
): void {
  const shaderType = getLuAnalyticsShaderType(chunk.input.format);
  const nullable = Boolean(chunk.validity);
  const validityBinding = nullable
    ? '@group(0) @binding(1) var<storage, read> validityValues: array<u32>;'
    : '';
  const keyBindingIndex = nullable ? 2 : 1;
  const validityOffset = chunk.validity ? getViewElementOffset(chunk.validity) : 0;
  const isNull = nullable ? 'validityValues[VALIDITY_OFFSET + index] == 0u' : 'false';
  const nanExpression =
    chunk.input.format === 'float32'
      ? '(bitcast<u32>(value) & 0x7fffffffu) > 0x7f800000u'
      : 'false';
  const key = getLuSortNumericKeyExpression(chunk.input.format);
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${chunk.input.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(chunk.input)}u;
const VALIDITY_OFFSET: u32 = ${validityOffset}u;
const KEY_OFFSET: u32 = ${getViewElementOffset(chunk.encodedKeys)}u;
const INDEX_OFFSET: u32 = ${getViewElementOffset(chunk.localIndices)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
${validityBinding}
@group(0) @binding(${keyBindingIndex}) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(${keyBindingIndex + 1}) var<storage, read_write> outputIndices: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index < ELEMENT_COUNT) {
    let value = inputValues[INPUT_OFFSET + index];
    let isNull = ${isNull};
    let isNaN = ${nanExpression};
    outputKeys[KEY_OFFSET + index] = select(${key}, 0u, isNull || isNaN);
    outputIndices[INDEX_OFFSET + index] = index;
  }
}`;
  const resources: GraphBufferUse[] = [{buffer: chunk.input, usage: 'storage-read'}];
  const bindings: Record<string, GraphDataView> = {inputValues: chunk.input};
  if (chunk.validity) {
    resources.push({buffer: chunk.validity, usage: 'storage-read'});
    bindings['validityValues'] = chunk.validity;
  }
  resources.push(
    {buffer: chunk.encodedKeys, usage: 'storage-write'},
    {buffer: chunk.localIndices, usage: 'storage-write'}
  );
  bindings['outputKeys'] = chunk.encodedKeys;
  bindings['outputIndices'] = chunk.localIndices;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources,
    bindings,
    length: chunk.input.length
  });
}

/** Maps numeric storage formats into monotonic unsigned keys without dropping any value bits. */
function getLuSortNumericKeyExpression(format: LuAnalyticsScalarFormat): string {
  switch (format) {
    case 'uint32':
      return 'value';
    case 'sint32':
      return 'bitcast<u32>(value) ^ 0x80000000u';
    case 'float32':
      return 'select(bitcast<u32>(value), 0u, value == 0.0) ^ select(0x80000000u, 0xffffffffu, (bitcast<u32>(value) & 0x80000000u) != 0u && value != 0.0)';
  }
}

/** Stably ranks selected numeric, NaN, null, and rejected rows after the numeric permutation. */
function addLuSortEncodeClassesPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  chunk: LuSortChunk,
  options: LuDataFrameNormalizedSortOptions
): void {
  const shaderType = getLuAnalyticsShaderType(chunk.input.format);
  const nullable = Boolean(chunk.validity);
  const validityBinding = nullable
    ? '@group(0) @binding(3) var<storage, read> validityValues: array<u32>;'
    : '';
  const outputBindingIndex = nullable ? 4 : 3;
  const validityOffset = chunk.validity ? getViewElementOffset(chunk.validity) : 0;
  const isNull = nullable ? 'validityValues[VALIDITY_OFFSET + localIndex] == 0u' : 'false';
  const nanExpression =
    chunk.input.format === 'float32'
      ? '(bitcast<u32>(value) & 0x7fffffffu) > 0x7f800000u'
      : 'false';
  const nullRank = options.nulls === 'first' ? 0 : 2;
  const nanRank =
    options.nulls === 'first'
      ? options.nans === 'first'
        ? 1
        : 2
      : options.nans === 'first'
        ? 0
        : 1;
  const numericRank =
    options.nulls === 'first'
      ? options.nans === 'first'
        ? 2
        : 1
      : options.nans === 'first'
        ? 1
        : 0;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${chunk.input.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(chunk.input)}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(chunk.selection)}u;
const INDEX_OFFSET: u32 = ${getViewElementOffset(chunk.sortedIndices)}u;
const VALIDITY_OFFSET: u32 = ${validityOffset}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(chunk.sortedKeys)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
@group(0) @binding(1) var<storage, read> selectionMask: array<u32>;
@group(0) @binding(2) var<storage, read> sortedIndices: array<u32>;
${validityBinding}
@group(0) @binding(${outputBindingIndex}) var<storage, read_write> outputClasses: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index < ELEMENT_COUNT) {
    let localIndex = sortedIndices[INDEX_OFFSET + index];
    let value = inputValues[INPUT_OFFSET + localIndex];
    let isNull = ${isNull};
    let isNaN = ${nanExpression};
    var rank = ${numericRank}u;
    if (isNaN) { rank = ${nanRank}u; }
    if (isNull) { rank = ${nullRank}u; }
    if (selectionMask[SELECTION_OFFSET + localIndex] == 0u) { rank = 3u; }
    outputClasses[OUTPUT_OFFSET + index] = rank;
  }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: chunk.input, usage: 'storage-read'},
    {buffer: chunk.selection, usage: 'storage-read'},
    {buffer: chunk.sortedIndices, usage: 'storage-read'}
  ];
  const bindings: Record<string, GraphDataView> = {
    inputValues: chunk.input,
    selectionMask: chunk.selection,
    sortedIndices: chunk.sortedIndices
  };
  if (chunk.validity) {
    resources.push({buffer: chunk.validity, usage: 'storage-read'});
    bindings['validityValues'] = chunk.validity;
  }
  resources.push({buffer: chunk.sortedKeys, usage: 'storage-write'});
  bindings['outputClasses'] = chunk.sortedKeys;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources,
    bindings,
    length: chunk.input.length
  });
}

/** Publishes stable source identities and keeps masks/counts consistent with each batch's top-K. */
function addLuSortPublishPermutationPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  props: {
    sortedClasses: GraphDataView<'uint32'>;
    sortedIndices: GraphDataView<'uint32'>;
    selection: GraphDataView<'uint32'>;
    outputIndices: GraphDataView<'uint32'>;
    selectedCount: GraphDataView<'uint32'>;
    sourceOffset: number;
    limit: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.sortedIndices.length}u;
const CLASS_OFFSET: u32 = ${getViewElementOffset(props.sortedClasses)}u;
const LOCAL_INDEX_OFFSET: u32 = ${getViewElementOffset(props.sortedIndices)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(props.selection)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.outputIndices)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(props.selectedCount)}u;
const SOURCE_OFFSET: u32 = ${props.sourceOffset}u;
const ROW_LIMIT: u32 = ${props.limit}u;
@group(0) @binding(0) var<storage, read> sortedClasses: array<u32>;
@group(0) @binding(1) var<storage, read> sortedIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> selectionMask: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputIndices: array<u32>;
@group(0) @binding(4) var<storage, read_write> selectedCounts: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index < ELEMENT_COUNT) {
    let localIndex = sortedIndices[LOCAL_INDEX_OFFSET + index];
    let selected = sortedClasses[CLASS_OFFSET + index] != 3u && index < ROW_LIMIT;
    selectionMask[MASK_OFFSET + localIndex] = select(0u, 1u, selected);
    outputIndices[OUTPUT_OFFSET + index] = select(0u, SOURCE_OFFSET + localIndex, selected);
    if (index == 0u) {
      selectedCounts[COUNT_OFFSET] = min(selectedCounts[COUNT_OFFSET], ROW_LIMIT);
    }
  }
}`;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: props.sortedClasses, usage: 'storage-read'},
      {buffer: props.sortedIndices, usage: 'storage-read'},
      {buffer: props.selection, usage: 'storage-write'},
      {buffer: props.outputIndices, usage: 'storage-write'},
      {buffer: props.selectedCount, usage: 'storage-read-write'}
    ],
    bindings: {
      sortedClasses: props.sortedClasses,
      sortedIndices: props.sortedIndices,
      selectionMask: props.selection,
      outputIndices: props.outputIndices,
      selectedCounts: props.selectedCount
    },
    length: props.sortedIndices.length
  });
}
