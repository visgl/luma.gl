// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, GPUVector, type GPUTable, type GPUTypeMap} from '@luma.gl/tables';
import {GPUBatchHashIndex} from '../gpu-primitives/gpu-batch-hash-index';
import {
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '../gpu-primitives/gpu-command-graph';
import {
  GPUHashIndexQuery,
  GPU_HASH_INDEX_EMPTY_KEY,
  GPU_HASH_INDEX_STATISTICS_LENGTH,
  GPU_HASH_QUERY_STATISTICS_LENGTH
} from '../gpu-primitives/gpu-hash-index';
import {GPUHashJoin} from '../gpu-primitives/gpu-hash-join';
import {GPUScan} from '../gpu-primitives/gpu-scan';
import {
  createTransientVectorView,
  createTransientView,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addLuAnalyticsComputePass,
  getLuAnalyticsInvocationIndexSource,
  getLuAnalyticsVector,
  validateLuAnalyticsSource
} from './lu-analytics-compiler-utils';
import type {LuDataFrame} from './lu-data-frame';
import type {LuDataFrameDerivedColumn} from './lu-data-frame-query';
import type {LuExpression} from './lu-expression';
import type {LuDataFrameNormalizedJoinOptions} from './lu-join-query';
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

type LuJoinIndexState = {
  index: GPUBatchHashIndex;
  indexStatistics: GPUVector<'uint32'>;
  contractViolation: GPUVector<'uint32'>;
  leftKeys: GraphVectorView<'uint32'>;
  maskedLeftKeys: GraphVectorView<'uint32'>;
};

type LuJoinCommonResources<Right extends GPUTypeMap> = {
  right: LuDataFrame<Right>;
  rightRowIndices: GPUVector<'uint32'>;
  indexStatistics: GPUVector<'uint32'>;
  lookupStatistics: GPUVector<'uint32'>;
  contractViolation: GPUVector<'uint32'>;
};

type LuJoinResources<Right extends GPUTypeMap> = LuJoinCommonResources<Right> & {
  requiredCounts: GPUVector<'uint32'>;
  overflows: GPUVector<'uint32'>;
};

type LuLookupResources<Right extends GPUTypeMap> = LuJoinCommonResources<Right> & {
  matchMask: GPUVector<'uint32'>;
  probeCounts: GPUVector<'uint32'>;
};

/** Shared right-source lease and explicit GPU diagnostics retained by bounded hash consumers. */
abstract class CompiledLuDataFrameHashQuery<
  Left extends GPUTypeMap,
  Right extends GPUTypeMap
> extends CompiledLuDataFrameQuery<Left> {
  /** Independently batched, retained right source table; source rows are never repacked. */
  readonly rightTable: GPUTable<Right>;
  /** Stable right source-row IDs aligned with compacted pairs or original lookup rows. */
  readonly rightRowIndices: GPUVector<'uint32'>;
  /** Six GPU words: unique, duplicate, overflow, invalid, total probes, and maximum probes. */
  readonly indexStatistics: GPUVector<'uint32'>;
  /** Four GPU-resident lookup statistics for each original left source batch. */
  readonly lookupStatistics: GPUVector<'uint32'>;
  /** One nonzero GPU word when right uniqueness, reserved-key, or index completeness fails. */
  readonly contractViolation: GPUVector<'uint32'>;

  private readonly retainedRight: LuDataFrame<Right>;

  /** @internal */
  constructor(props: CompiledLuDataFrameQueryProps<Left>, resources: LuJoinCommonResources<Right>) {
    super(props);
    this.retainedRight = resources.right;
    this.rightTable = resources.right.table;
    this.rightRowIndices = resources.rightRowIndices;
    this.indexStatistics = resources.indexStatistics;
    this.lookupStatistics = resources.lookupStatistics;
    this.contractViolation = resources.contractViolation;
  }

  /** Releases graph-owned work, both sets of owned outputs, and both retained source leases. */
  override destroy(): void {
    super.destroy();
    this.retainedRight.destroy();
  }
}

/** Stable, source-batch-preserving unique-right inner join with explicit bounded diagnostics. */
export class CompiledLuDataFrameJoin<
  Left extends GPUTypeMap = GPUTypeMap,
  Right extends GPUTypeMap = GPUTypeMap
> extends CompiledLuDataFrameHashQuery<Left, Right> {
  /** Exact required pair count for each source batch, independent of publication capacity. */
  readonly requiredCounts: GPUVector<'uint32'>;
  /** One source-index or per-batch publication overflow flag for each original left batch. */
  readonly overflows: GPUVector<'uint32'>;

  /** @internal */
  constructor(props: CompiledLuDataFrameQueryProps<Left>, resources: LuJoinResources<Right>) {
    super(props, resources);
    this.requiredCounts = resources.requiredCounts;
    this.overflows = resources.overflows;
  }
}

/** Source-aligned bounded unique-right lookup preserving every original left GPU row. */
export class CompiledLuDataFrameLookup<
  Left extends GPUTypeMap = GPUTypeMap,
  Right extends GPUTypeMap = GPUTypeMap
> extends CompiledLuDataFrameHashQuery<Left, Right> {
  /** Nonzero for source rows with one valid, selected, unique-right match. */
  readonly matchMask: GPUVector<'uint32'>;
  /** Number of bounded hash probes performed independently for each source row. */
  readonly probeCounts: GPUVector<'uint32'>;

  /** @internal */
  constructor(props: CompiledLuDataFrameQueryProps<Left>, resources: LuLookupResources<Right>) {
    super(props, resources);
    this.matchMask = resources.matchMask;
    this.probeCounts = resources.probeCounts;
  }
}

/** Compiles a nullable, filtered, bounded inner join against an independently batched right side. */
export function compileLuDataFrameJoin<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Right extends GPUTypeMap
>(
  source: LuDataFrame<Source>,
  predicates: readonly LuExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly LuDataFrameDerivedColumn[],
  right: LuDataFrame<Right>,
  options: LuDataFrameNormalizedJoinOptions,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): CompiledLuDataFrameJoin<Selection, Right> {
  validateLuJoinSources(source, right, options, graph);
  const retainedRight = right.select(right.columnNames);
  try {
    return compileLuDataFrameQuery<
      Source,
      Selection,
      Selection,
      CompiledLuDataFrameJoin<Selection, Right>
    >(source, predicates, selectedColumns, graph, derivedColumns, {
      allowEmptyPredicates: true,
      prepare: context => addLuInnerJoinToGraph(context, retainedRight, options)
    });
  } catch (error) {
    retainedRight.destroy();
    throw error;
  }
}

/** Compiles a nullable, filtered, source-aligned lookup without changing source batch boundaries. */
export function compileLuDataFrameLookup<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Right extends GPUTypeMap
>(
  source: LuDataFrame<Source>,
  predicates: readonly LuExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly LuDataFrameDerivedColumn[],
  right: LuDataFrame<Right>,
  options: LuDataFrameNormalizedJoinOptions,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): CompiledLuDataFrameLookup<Selection, Right> {
  validateLuJoinSources(source, right, options, graph);
  const retainedRight = right.select(right.columnNames);
  try {
    return compileLuDataFrameQuery<
      Source,
      Selection,
      Selection,
      CompiledLuDataFrameLookup<Selection, Right>
    >(source, predicates, selectedColumns, graph, derivedColumns, {
      allowEmptyPredicates: true,
      prepare: context => addLuLookupToGraph(context, retainedRight, options)
    });
  } catch (error) {
    retainedRight.destroy();
    throw error;
  }
}

/** Rejects missing validity, unsupported packed layouts, and unrepresentable IDs before GPU work. */
function validateLuJoinSources<Source extends GPUTypeMap, Right extends GPUTypeMap>(
  source: LuDataFrame<Source>,
  right: LuDataFrame<Right>,
  options: LuDataFrameNormalizedJoinOptions,
  graph: GPUCommandGraph<LuDataFrameQueryParameters>
): void {
  validateLuAnalyticsSource(source, [options.leftOn]);
  validateLuAnalyticsSource(right, [options.rightOn]);
  const indexByteLength = options.indexCapacity * UINT32_BYTE_LENGTH;
  if (
    indexByteLength > graph.device.limits.maxBufferSize ||
    indexByteLength > graph.device.limits.maxStorageBufferBindingSize
  ) {
    throw new Error('LuDataFrame join index exceeds available GPU buffer capacity');
  }
  for (const table of [source, right]) {
    let sourceOffset = 0;
    for (const batch of table.batches) {
      const offset = batch.sourceInfo?.sourceRowIndexOffset ?? sourceOffset;
      if (
        !Number.isSafeInteger(offset) ||
        offset < 0 ||
        offset > MAXIMUM_UINT32 ||
        offset + Math.max(batch.numRows - 1, 0) > MAXIMUM_UINT32
      ) {
        throw new Error('LuDataFrame join source-row identifiers must fit uint32');
      }
      if (table === source && batch.numRows * options.maxProbeCount > MAXIMUM_UINT32) {
        throw new Error('LuDataFrame left join probe counts must fit uint32');
      }
      sourceOffset += batch.numRows;
    }
  }
}

/** Materializes owned pair diagnostics while sharing one chunk-preserving right index. */
function addLuInnerJoinToGraph<Left extends GPUTypeMap, Right extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Left>,
  right: LuDataFrame<Right>,
  options: LuDataFrameNormalizedJoinOptions
): LuDataFrameQueryExtensionResult<Left, CompiledLuDataFrameJoin<Left, Right>> {
  const ownedVectors: GPUVector[] = [];
  const id = `${context.queryId}-inner-join`;
  try {
    const indexState = buildLuJoinIndex(context, right, options, ownedVectors, id);
    const lengths = context.table.batches.map(batch => batch.numRows);
    const rightRowIndices = createLuJoinOutputVector(context.graph.device, `${id}-right`, lengths);
    ownedVectors.push(rightRowIndices);
    const requiredCounts = createLuJoinOutputVector(
      context.graph.device,
      `${id}-required`,
      lengths.map(() => 1)
    );
    ownedVectors.push(requiredCounts);
    const overflows = createLuJoinOutputVector(
      context.graph.device,
      `${id}-overflow`,
      lengths.map(() => 1)
    );
    ownedVectors.push(overflows);
    const lookupStatistics = createLuJoinOutputVector(
      context.graph.device,
      `${id}-lookup-statistics`,
      lengths.map(() => GPU_HASH_QUERY_STATISTICS_LENGTH)
    );
    ownedVectors.push(lookupStatistics);

    const rightRows = context.graph.importGPUVector(`${id}-right-rows`, rightRowIndices);
    const required = context.graph.importGPUVector(`${id}-required-counts`, requiredCounts);
    const overflow = context.graph.importGPUVector(`${id}-overflows`, overflows);
    const statistics = context.graph.importGPUVector(`${id}-statistics`, lookupStatistics);
    const matches = createTransientVectorView(
      context.graph,
      `${id}-matches`,
      context.selectionMask
    );

    let firstLeftRow = 0;
    for (const [batchIndex, batch] of context.table.batches.entries()) {
      const batchId = `${id}-batch-${batchIndex}`;
      const capacity = Math.min(options.capacity ?? batch.numRows, batch.numRows);
      const outputLeftRows = getLuJoinCapacityView(
        context.graph,
        context.rowIndices.data[batchIndex],
        capacity
      );
      const outputRightRows = getLuJoinCapacityView(
        context.graph,
        rightRows.data[batchIndex],
        capacity
      );

      new GPUHashJoin({
        id: batchId,
        index: indexState.index,
        keys: indexState.maskedLeftKeys.data[batchIndex],
        firstLeftRow: batch.sourceInfo?.sourceRowIndexOffset ?? firstLeftRow,
        outputLeftRows,
        outputRightRows,
        count: required.data[batchIndex],
        overflow: overflow.data[batchIndex],
        statistics: statistics.data[batchIndex],
        found: matches.data[batchIndex],
        maxProbeCount: options.maxProbeCount
      }).addToGraph(context.graph);

      const offsets = createTransientView(
        context.graph,
        `${batchId}-match-offsets`,
        'uint32',
        batch.numRows
      );
      new GPUScan({
        id: `${batchId}-published-offsets`,
        input: matches.data[batchIndex],
        output: offsets
      }).addToGraph(context.graph);
      addLuJoinPublishPass(context.graph, `${batchId}-publish`, {
        matches: matches.data[batchIndex],
        offsets,
        selection: context.selectionMask.data[batchIndex],
        leftRows: context.rowIndices.data[batchIndex],
        rightRows: rightRows.data[batchIndex],
        required: required.data[batchIndex],
        published: context.selectedCounts.data[batchIndex],
        capacity
      });
      firstLeftRow += batch.numRows;
    }

    const resources: LuJoinResources<Right> = {
      right,
      rightRowIndices,
      requiredCounts,
      overflows,
      lookupStatistics,
      indexStatistics: indexState.indexStatistics,
      contractViolation: indexState.contractViolation
    };
    return {
      table: context.table,
      validity: context.validity,
      dictionaries: context.dictionaries,
      ownedVectors,
      createCompiled: props => new CompiledLuDataFrameJoin(props, resources)
    };
  } catch (error) {
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Publishes right row IDs, match flags, probes, and diagnostics for every left source row. */
function addLuLookupToGraph<Left extends GPUTypeMap, Right extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Left>,
  right: LuDataFrame<Right>,
  options: LuDataFrameNormalizedJoinOptions
): LuDataFrameQueryExtensionResult<Left, CompiledLuDataFrameLookup<Left, Right>> {
  const ownedVectors: GPUVector[] = [];
  const id = `${context.queryId}-lookup`;
  try {
    const indexState = buildLuJoinIndex(context, right, options, ownedVectors, id);
    const lengths = context.table.batches.map(batch => batch.numRows);
    const rightRowIndices = createLuJoinOutputVector(context.graph.device, `${id}-right`, lengths);
    ownedVectors.push(rightRowIndices);
    const matchMask = createLuJoinOutputVector(context.graph.device, `${id}-matched`, lengths);
    ownedVectors.push(matchMask);
    const probeCounts = createLuJoinOutputVector(context.graph.device, `${id}-probes`, lengths);
    ownedVectors.push(probeCounts);
    const lookupStatistics = createLuJoinOutputVector(
      context.graph.device,
      `${id}-statistics`,
      lengths.map(() => GPU_HASH_QUERY_STATISTICS_LENGTH)
    );
    ownedVectors.push(lookupStatistics);

    const rightRows = context.graph.importGPUVector(`${id}-right-rows`, rightRowIndices);
    const matches = context.graph.importGPUVector(`${id}-match-mask`, matchMask);
    const probes = context.graph.importGPUVector(`${id}-probe-counts`, probeCounts);
    const statistics = context.graph.importGPUVector(`${id}-query-statistics`, lookupStatistics);

    for (const [batchIndex, keys] of indexState.maskedLeftKeys.data.entries()) {
      new GPUHashIndexQuery({
        id: `${id}-batch-${batchIndex}`,
        index: indexState.index,
        keys,
        values: rightRows.data[batchIndex],
        found: matches.data[batchIndex],
        probes: probes.data[batchIndex],
        statistics: statistics.data[batchIndex],
        maxProbeCount: options.maxProbeCount
      }).addToGraph(context.graph);
    }

    const resources: LuLookupResources<Right> = {
      right,
      rightRowIndices,
      matchMask,
      probeCounts,
      lookupStatistics,
      indexStatistics: indexState.indexStatistics,
      contractViolation: indexState.contractViolation
    };
    return {
      table: context.table,
      validity: context.validity,
      dictionaries: context.dictionaries,
      ownedVectors,
      createCompiled: props => new CompiledLuDataFrameLookup(props, resources)
    };
  } catch (error) {
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Builds one right index without concatenation and sanitizes filtered/nullable left source keys. */
function buildLuJoinIndex<Left extends GPUTypeMap, Right extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Left>,
  right: LuDataFrame<Right>,
  options: LuDataFrameNormalizedJoinOptions,
  ownedVectors: GPUVector[],
  id: string
): LuJoinIndexState {
  const graph = context.graph;
  const leftVector = getLuAnalyticsVector(context, options.leftOn);
  if (leftVector.format !== 'uint32') {
    throw new Error('LuDataFrame left join keys must use packed uint32 GPU data');
  }
  const leftKeys = graph.importGPUVector(`${id}-left-keys`, leftVector as GPUVector<'uint32'>);
  const rightField = right.schema.fields.find(field => field.name === options.rightOn);
  const rightVector = right.table.gpuVectors[options.rightOn];
  if (rightField?.format !== 'uint32' && rightVector?.format !== 'uint32') {
    throw new Error('LuDataFrame right join keys must use packed uint32 GPU data');
  }
  const rightKeys = graph.importGPUVector(
    `${id}-right-keys`,
    rightVector
      ? (rightVector as GPUVector<'uint32'>)
      : new GPUVector({
          type: 'data',
          name: options.rightOn,
          format: 'uint32',
          data: [],
          ownsData: false
        })
  );
  const rightValidity = rightField?.nullable
    ? right.validity[options.rightOn as keyof Right & string]
    : undefined;
  if (rightField?.nullable && rightKeys.length > 0 && !rightValidity) {
    throw new Error('LuDataFrame nullable right join keys require explicit GPU validity');
  }

  const indexStatistics = createLuJoinOutputVector(graph.device, `${id}-index-statistics`, [
    GPU_HASH_INDEX_STATISTICS_LENGTH
  ]);
  ownedVectors.push(indexStatistics);
  const contractViolation = createLuJoinOutputVector(graph.device, `${id}-contract-violation`, [1]);
  ownedVectors.push(contractViolation);
  const statistics = graph.importGPUVector(`${id}-index-stats`, indexStatistics).data[0];
  const violation = graph.importGPUVector(`${id}-violation`, contractViolation).data[0];
  const tableKeys = createTransientView(graph, `${id}-table-keys`, 'uint32', options.indexCapacity);
  const tableValues = createTransientView(
    graph,
    `${id}-table-values`,
    'uint32',
    options.indexCapacity
  );

  let rightOffset = 0;
  const firstValues = right.batches.map(batch => {
    const firstValue = batch.sourceInfo?.sourceRowIndexOffset ?? rightOffset;
    rightOffset += batch.numRows;
    return firstValue;
  });
  const index = new GPUBatchHashIndex({
    id: `${id}-right-index`,
    keys: rightKeys,
    ...(rightValidity
      ? {validity: graph.importGPUVector(`${id}-right-validity`, rightValidity)}
      : {}),
    firstValues,
    tableKeys,
    tableValues,
    statistics,
    maxProbeCount: options.maxProbeCount
  });
  index.addToGraph(graph);
  addLuJoinContractPass(graph, `${id}-validate-contract`, statistics, violation);

  const leftField = context.table.schema.fields.find(field => field.name === options.leftOn);
  const leftValidity = leftField?.nullable
    ? context.validity[options.leftOn as keyof Left & string]
    : undefined;
  if (leftField?.nullable && leftKeys.length > 0 && !leftValidity) {
    throw new Error('LuDataFrame nullable left join keys require explicit GPU validity');
  }
  const validity = leftValidity
    ? graph.importGPUVector(`${id}-left-validity`, leftValidity)
    : undefined;
  const maskedLeftKeys = createTransientVectorView(
    graph,
    `${id}-masked-keys`,
    context.selectionMask
  );
  for (const [batchIndex, keys] of leftKeys.data.entries()) {
    if (keys.length > 0) {
      addLuJoinPrepareKeysPass(graph, `${id}-prepare-batch-${batchIndex}`, {
        input: keys,
        selection: context.selectionMask.data[batchIndex],
        validity: validity?.data[batchIndex],
        violation,
        output: maskedLeftKeys.data[batchIndex]
      });
    }
  }
  return {index, indexStatistics, contractViolation, leftKeys, maskedLeftKeys};
}

/** Allocates one independently owned packed uint32 chunk for each caller-preserved source batch. */
function createLuJoinOutputVector(
  device: Device,
  name: string,
  lengths: readonly number[]
): GPUVector<'uint32'> {
  const chunks: GPUData<'uint32'>[] = [];
  try {
    for (const [batchIndex, length] of lengths.entries()) {
      const buffer = device.createBuffer({
        id: `${name}-batch-${batchIndex}`,
        byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST | Buffer.VERTEX
      });
      try {
        chunks.push(new GPUData({buffer, format: 'uint32', length, ownsBuffer: true}));
      } catch (error) {
        buffer.destroy();
        throw error;
      }
    }
    return new GPUVector({type: 'data', name, format: 'uint32', data: chunks, ownsData: true});
  } catch (error) {
    for (const chunk of chunks) {
      chunk.destroy();
    }
    throw error;
  }
}

/** Uses the canonical imported graph handle while exposing a bounded logical pair-output prefix. */
function getLuJoinCapacityView(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  view: GraphDataView<'uint32'>,
  capacity: number
): GraphDataView<'uint32'> {
  return graph.createDataView(view.buffer, {
    format: 'uint32',
    length: capacity,
    byteOffset: view.byteOffset
  });
}

/** Publishes one strict GPU contract flag for duplicates, bounded index overflow, or reserved keys. */
function addLuJoinContractPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  statistics: GraphDataView<'uint32'>,
  violation: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const STATISTICS_OFFSET: u32 = ${getViewElementOffset(statistics)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(violation)}u;
@group(0) @binding(0) var<storage, read> indexStatistics: array<u32>;
@group(0) @binding(1) var<storage, read_write> contractViolation: array<u32>;

@compute @workgroup_size(1)
fn main() {
  let invalid = indexStatistics[STATISTICS_OFFSET + 1u] != 0u ||
    indexStatistics[STATISTICS_OFFSET + 2u] != 0u ||
    indexStatistics[STATISTICS_OFFSET + 3u] != 0u;
  contractViolation[OUTPUT_OFFSET] = select(0u, 1u, invalid);
}`;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: statistics, usage: 'storage-read'},
      {buffer: violation, usage: 'storage-write'}
    ],
    bindings: {indexStatistics: statistics, contractViolation: violation},
    length: 1
  });
}

/** Excludes filtered/null rows and invalid right indexes without repacking left source chunks. */
function addLuJoinPrepareKeysPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  props: {
    input: GraphDataView<'uint32'>;
    selection: GraphDataView<'uint32'>;
    validity?: GraphDataView<'uint32'>;
    violation: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
  }
): void {
  const nullable = Boolean(props.validity);
  const validityBinding = nullable
    ? '@group(0) @binding(2) var<storage, read> validityMask: array<u32>;'
    : '';
  const validityOffset = props.validity ? getViewElementOffset(props.validity) : 0;
  const firstTailBinding = nullable ? 3 : 2;
  const isValid = nullable ? 'validityMask[VALIDITY_OFFSET + index] != 0u' : 'true';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.input.length}u;
const KEY_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(props.selection)}u;
const VALIDITY_OFFSET: u32 = ${validityOffset}u;
const CONTRACT_OFFSET: u32 = ${getViewElementOffset(props.violation)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> sourceKeys: array<u32>;
@group(0) @binding(1) var<storage, read> selectionMask: array<u32>;
${validityBinding}
@group(0) @binding(${firstTailBinding}) var<storage, read> contractViolation: array<u32>;
@group(0) @binding(${firstTailBinding + 1}) var<storage, read_write> preparedKeys: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getLuAnalyticsInvocationIndexSource(graph, props.input.length)}
  if (index < ELEMENT_COUNT) {
    let selected = selectionMask[SELECTION_OFFSET + index] != 0u;
    let valid = ${isValid};
    let permitted = selected && valid && contractViolation[CONTRACT_OFFSET] == 0u;
    preparedKeys[OUTPUT_OFFSET + index] = select(
      ${GPU_HASH_INDEX_EMPTY_KEY}u,
      sourceKeys[KEY_OFFSET + index],
      permitted
    );
  }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: props.input, usage: 'storage-read'},
    {buffer: props.selection, usage: 'storage-read'}
  ];
  const bindings: Record<string, GraphDataView> = {
    sourceKeys: props.input,
    selectionMask: props.selection
  };
  if (props.validity) {
    resources.push({buffer: props.validity, usage: 'storage-read'});
    bindings['validityMask'] = props.validity;
  }
  resources.push(
    {buffer: props.violation, usage: 'storage-read'},
    {buffer: props.output, usage: 'storage-write'}
  );
  bindings['contractViolation'] = props.violation;
  bindings['preparedKeys'] = props.output;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources,
    bindings,
    length: props.input.length
  });
}

/** Keeps inherited masks/counts and stable left/right row prefixes coherent after bounded joins. */
function addLuJoinPublishPass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  props: {
    matches: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    selection: GraphDataView<'uint32'>;
    leftRows: GraphDataView<'uint32'>;
    rightRows: GraphDataView<'uint32'>;
    required: GraphDataView<'uint32'>;
    published: GraphDataView<'uint32'>;
    capacity: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.matches.length}u;
const MATCH_OFFSET: u32 = ${getViewElementOffset(props.matches)}u;
const OFFSET_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(props.selection)}u;
const LEFT_OFFSET: u32 = ${getViewElementOffset(props.leftRows)}u;
const RIGHT_OFFSET: u32 = ${getViewElementOffset(props.rightRows)}u;
const REQUIRED_OFFSET: u32 = ${getViewElementOffset(props.required)}u;
const PUBLISHED_OFFSET: u32 = ${getViewElementOffset(props.published)}u;
const OUTPUT_CAPACITY: u32 = ${props.capacity}u;
@group(0) @binding(0) var<storage, read> matchedRows: array<u32>;
@group(0) @binding(1) var<storage, read> matchedOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> selectionMask: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputLeftRows: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputRightRows: array<u32>;
@group(0) @binding(5) var<storage, read> requiredCounts: array<u32>;
@group(0) @binding(6) var<storage, read_write> selectedCounts: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getLuAnalyticsInvocationIndexSource(graph, props.matches.length)}
  let published = min(requiredCounts[REQUIRED_OFFSET], OUTPUT_CAPACITY);
  if (index == 0u) {
    selectedCounts[PUBLISHED_OFFSET] = published;
  }
  if (index < ELEMENT_COUNT) {
    let selected = matchedRows[MATCH_OFFSET + index] != 0u &&
      matchedOffsets[OFFSET_OFFSET + index] < OUTPUT_CAPACITY;
    selectionMask[SELECTION_OFFSET + index] = select(0u, 1u, selected);
    if (index >= published) {
      outputLeftRows[LEFT_OFFSET + index] = 0u;
      outputRightRows[RIGHT_OFFSET + index] = 0u;
    }
  }
}`;
  addLuAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: props.matches, usage: 'storage-read'},
      {buffer: props.offsets, usage: 'storage-read'},
      {buffer: props.selection, usage: 'storage-write'},
      {buffer: props.leftRows, usage: 'storage-read-write'},
      {buffer: props.rightRows, usage: 'storage-read-write'},
      {buffer: props.required, usage: 'storage-read'},
      {buffer: props.published, usage: 'storage-write'}
    ],
    bindings: {
      matchedRows: props.matches,
      matchedOffsets: props.offsets,
      selectionMask: props.selection,
      outputLeftRows: props.leftRows,
      outputRightRows: props.rightRows,
      requiredCounts: props.required,
      selectedCounts: props.published
    },
    length: Math.max(props.matches.length, 1)
  });
}
