// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, GPUVector, type GPUTable, type GPUTypeMap} from '@luma.gl/tables';
import {GPUBatchHashIndex} from '../gpu-core/gpu-batch-hash-index';
import {
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '../gpu-core/gpu-command-graph';
import {
  GPUHashIndexQuery,
  GPU_HASH_INDEX_EMPTY_KEY,
  GPU_HASH_INDEX_STATISTICS_LENGTH,
  GPU_HASH_QUERY_STATISTICS_LENGTH
} from '../gpu-core/gpu-hash-index';
import {GPUScan} from '../gpu-core/gpu-scan';
import {
  createTransientVectorView,
  createTransientView,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  addGPUAnalyticsComputePass,
  getGPUAnalyticsInvocationIndexSource,
  getGPUAnalyticsVector,
  validateGPUAnalyticsSource
} from './gpu-analytics-compiler-utils';
import type {GPUDataFrame} from './gpu-data-frame';
import type {GPUDataFrameDerivedColumn} from './gpu-data-frame-query';
import type {GPUExpression} from './gpu-expression';
import type {GPUDataFrameJoinType, GPUDataFrameNormalizedJoinOptions} from './gpu-join-query';
import {
  CompiledGPUDataFrameQuery,
  compileGPUDataFrameQuery,
  type CompiledGPUDataFrameQueryProps,
  type GPUDataFrameQueryExtensionContext,
  type GPUDataFrameQueryExtensionResult,
  type GPUDataFrameQueryParameters
} from './gpu-query-compiler';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const MAXIMUM_UINT32 = 0xffffffff;

type GPUJoinIndexState = {
  index: GPUBatchHashIndex;
  indexStatistics: GPUVector<'uint32'>;
  contractViolation: GPUVector<'uint32'>;
  leftKeys: GraphVectorView<'uint32'>;
  maskedLeftKeys: GraphVectorView<'uint32'>;
};

type GPUJoinCommonResources<Right extends GPUTypeMap> = {
  right: GPUDataFrame<Right>;
  rightRowIndices: GPUVector<'uint32'>;
  indexStatistics: GPUVector<'uint32'>;
  lookupStatistics: GPUVector<'uint32'>;
  contractViolation: GPUVector<'uint32'>;
};

type GPUJoinResources<Right extends GPUTypeMap> = GPUJoinCommonResources<Right> & {
  joinType: GPUDataFrameJoinType;
  rightValidity: GPUVector<'uint32'>;
  requiredCounts: GPUVector<'uint32'>;
  overflows: GPUVector<'uint32'>;
};

type GPULookupResources<Right extends GPUTypeMap> = GPUJoinCommonResources<Right> & {
  matchMask: GPUVector<'uint32'>;
  probeCounts: GPUVector<'uint32'>;
};

/** Shared right-source lease and explicit GPU diagnostics retained by bounded hash consumers. */
abstract class CompiledGPUDataFrameHashQuery<
  Left extends GPUTypeMap,
  Right extends GPUTypeMap
> extends CompiledGPUDataFrameQuery<Left> {
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

  private readonly retainedRight: GPUDataFrame<Right>;

  /** @internal */
  constructor(
    props: CompiledGPUDataFrameQueryProps<Left>,
    resources: GPUJoinCommonResources<Right>
  ) {
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

/** Stable, source-batch-preserving unique-right join with explicit bounded diagnostics. */
export class CompiledGPUDataFrameJoin<
  Left extends GPUTypeMap = GPUTypeMap,
  Right extends GPUTypeMap = GPUTypeMap
> extends CompiledGPUDataFrameHashQuery<Left, Right> {
  /** Matching semantics used to select the compacted left-row prefix. */
  readonly joinType: GPUDataFrameJoinType;
  /** Compacted right-side validity; unmatched outer/anti rows contain zero. */
  readonly rightValidity: GPUVector<'uint32'>;
  /** Exact required pair count for each source batch, independent of publication capacity. */
  readonly requiredCounts: GPUVector<'uint32'>;
  /** One source-index or per-batch publication overflow flag for each original left batch. */
  readonly overflows: GPUVector<'uint32'>;

  /** @internal */
  constructor(props: CompiledGPUDataFrameQueryProps<Left>, resources: GPUJoinResources<Right>) {
    super(props, resources);
    this.joinType = resources.joinType;
    this.rightValidity = resources.rightValidity;
    this.requiredCounts = resources.requiredCounts;
    this.overflows = resources.overflows;
  }
}

/** Source-aligned bounded unique-right lookup preserving every original left GPU row. */
export class CompiledGPUDataFrameLookup<
  Left extends GPUTypeMap = GPUTypeMap,
  Right extends GPUTypeMap = GPUTypeMap
> extends CompiledGPUDataFrameHashQuery<Left, Right> {
  /** Nonzero for source rows with one valid, selected, unique-right match. */
  readonly matchMask: GPUVector<'uint32'>;
  /** Number of bounded hash probes performed independently for each source row. */
  readonly probeCounts: GPUVector<'uint32'>;

  /** @internal */
  constructor(props: CompiledGPUDataFrameQueryProps<Left>, resources: GPULookupResources<Right>) {
    super(props, resources);
    this.matchMask = resources.matchMask;
    this.probeCounts = resources.probeCounts;
  }
}

/** Compiles a nullable, filtered, bounded join against an independently batched right side. */
export function compileGPUDataFrameJoin<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Right extends GPUTypeMap
>(
  source: GPUDataFrame<Source>,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[],
  right: GPUDataFrame<Right>,
  options: GPUDataFrameNormalizedJoinOptions,
  joinType: GPUDataFrameJoinType,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): CompiledGPUDataFrameJoin<Selection, Right> {
  validateGPUJoinSources(source, right, options, graph);
  const retainedRight = right.select(right.columnNames);
  try {
    return compileGPUDataFrameQuery<
      Source,
      Selection,
      Selection,
      CompiledGPUDataFrameJoin<Selection, Right>
    >(source, predicates, selectedColumns, graph, derivedColumns, {
      allowEmptyPredicates: true,
      prepare: context => addGPUJoinToGraph(context, retainedRight, options, joinType)
    });
  } catch (error) {
    retainedRight.destroy();
    throw error;
  }
}

/** Compiles a nullable, filtered, source-aligned lookup without changing source batch boundaries. */
export function compileGPUDataFrameLookup<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Right extends GPUTypeMap
>(
  source: GPUDataFrame<Source>,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[],
  right: GPUDataFrame<Right>,
  options: GPUDataFrameNormalizedJoinOptions,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): CompiledGPUDataFrameLookup<Selection, Right> {
  validateGPUJoinSources(source, right, options, graph);
  const retainedRight = right.select(right.columnNames);
  try {
    return compileGPUDataFrameQuery<
      Source,
      Selection,
      Selection,
      CompiledGPUDataFrameLookup<Selection, Right>
    >(source, predicates, selectedColumns, graph, derivedColumns, {
      allowEmptyPredicates: true,
      prepare: context => addGPULookupToGraph(context, retainedRight, options)
    });
  } catch (error) {
    retainedRight.destroy();
    throw error;
  }
}

/** Rejects missing validity, unsupported packed layouts, and unrepresentable IDs before GPU work. */
function validateGPUJoinSources<Source extends GPUTypeMap, Right extends GPUTypeMap>(
  source: GPUDataFrame<Source>,
  right: GPUDataFrame<Right>,
  options: GPUDataFrameNormalizedJoinOptions,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): void {
  validateGPUAnalyticsSource(source, [options.leftOn]);
  validateGPUAnalyticsSource(right, [options.rightOn]);
  const indexByteLength = options.indexCapacity * UINT32_BYTE_LENGTH;
  if (
    indexByteLength > graph.device.limits.maxBufferSize ||
    indexByteLength > graph.device.limits.maxStorageBufferBindingSize
  ) {
    throw new Error('GPUDataFrame join index exceeds available GPU buffer capacity');
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
        throw new Error('GPUDataFrame join source-row identifiers must fit uint32');
      }
      if (table === source && batch.numRows * options.maxProbeCount > MAXIMUM_UINT32) {
        throw new Error('GPUDataFrame left join probe counts must fit uint32');
      }
      sourceOffset += batch.numRows;
    }
  }
}

/** Materializes owned pair diagnostics while sharing one chunk-preserving right index. */
function addGPUJoinToGraph<Left extends GPUTypeMap, Right extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Left>,
  right: GPUDataFrame<Right>,
  options: GPUDataFrameNormalizedJoinOptions,
  joinType: GPUDataFrameJoinType
): GPUDataFrameQueryExtensionResult<Left, CompiledGPUDataFrameJoin<Left, Right>> {
  const ownedVectors: GPUVector[] = [];
  const id = `${context.queryId}-${joinType}-join`;
  try {
    const indexState = buildGPUJoinIndex(context, right, options, ownedVectors, id);
    const lengths = context.table.batches.map(batch => batch.numRows);
    const rightRowIndices = createGPUJoinOutputVector(context.graph.device, `${id}-right`, lengths);
    ownedVectors.push(rightRowIndices);
    const rightValidity = createGPUJoinOutputVector(
      context.graph.device,
      `${id}-right-validity`,
      lengths
    );
    ownedVectors.push(rightValidity);
    const requiredCounts = createGPUJoinOutputVector(
      context.graph.device,
      `${id}-required`,
      lengths.map(() => 1)
    );
    ownedVectors.push(requiredCounts);
    const overflows = createGPUJoinOutputVector(
      context.graph.device,
      `${id}-overflow`,
      lengths.map(() => 1)
    );
    ownedVectors.push(overflows);
    const lookupStatistics = createGPUJoinOutputVector(
      context.graph.device,
      `${id}-lookup-statistics`,
      lengths.map(() => GPU_HASH_QUERY_STATISTICS_LENGTH)
    );
    ownedVectors.push(lookupStatistics);

    const rightRows = context.graph.importGPUVector(`${id}-right-rows`, rightRowIndices);
    const rightValid = context.graph.importGPUVector(`${id}-right-validity-rows`, rightValidity);
    const required = context.graph.importGPUVector(`${id}-required-counts`, requiredCounts);
    const overflow = context.graph.importGPUVector(`${id}-overflows`, overflows);
    const statistics = context.graph.importGPUVector(`${id}-statistics`, lookupStatistics);
    const matches = createTransientVectorView(
      context.graph,
      `${id}-matches`,
      context.selectionMask
    );
    const included = createTransientVectorView(
      context.graph,
      `${id}-included-rows`,
      context.selectionMask
    );
    const matchedRightRows = createTransientVectorView(
      context.graph,
      `${id}-matched-right-rows`,
      context.selectionMask
    );
    const probeCounts = createTransientVectorView(
      context.graph,
      `${id}-probe-counts`,
      context.selectionMask
    );
    const violation = context.graph.importGPUVector(
      `${id}-contract-flag`,
      indexState.contractViolation
    ).data[0];
    const indexStatistics = context.graph.importGPUVector(
      `${id}-index-statistics-view`,
      indexState.indexStatistics
    ).data[0];

    let firstLeftRow = 0;
    for (const [batchIndex, batch] of context.table.batches.entries()) {
      const batchId = `${id}-batch-${batchIndex}`;
      const capacity = Math.min(options.capacity ?? batch.numRows, batch.numRows);
      new GPUHashIndexQuery({
        id: batchId,
        index: indexState.index,
        keys: indexState.maskedLeftKeys.data[batchIndex],
        values: matchedRightRows.data[batchIndex],
        found: matches.data[batchIndex],
        probes: probeCounts.data[batchIndex],
        statistics: statistics.data[batchIndex],
        maxProbeCount: options.maxProbeCount
      }).addToGraph(context.graph);

      addGPUJoinClassifyPass(context.graph, `${batchId}-classify`, {
        matches: matches.data[batchIndex],
        selection: context.selectionMask.data[batchIndex],
        violation,
        included: included.data[batchIndex],
        joinType
      });
      const offsets = createTransientView(
        context.graph,
        `${batchId}-match-offsets`,
        'uint32',
        batch.numRows
      );
      new GPUScan({
        id: `${batchId}-published-offsets`,
        input: included.data[batchIndex],
        output: offsets
      }).addToGraph(context.graph);
      addGPUJoinCountPass(context.graph, `${batchId}-count`, {
        included: included.data[batchIndex],
        offsets,
        selection: context.selectionMask.data[batchIndex],
        required: required.data[batchIndex],
        published: context.selectedCounts.data[batchIndex],
        overflow: overflow.data[batchIndex],
        indexStatistics,
        capacity
      });
      addGPUJoinScatterPass(context.graph, `${batchId}-publish`, {
        included: included.data[batchIndex],
        matches: matches.data[batchIndex],
        offsets,
        matchedRightRows: matchedRightRows.data[batchIndex],
        leftRows: context.rowIndices.data[batchIndex],
        rightRows: rightRows.data[batchIndex],
        rightValidity: rightValid.data[batchIndex],
        firstLeftRow: batch.sourceInfo?.sourceRowIndexOffset ?? firstLeftRow,
        capacity
      });
      firstLeftRow += batch.numRows;
    }

    const resources: GPUJoinResources<Right> = {
      right,
      joinType,
      rightRowIndices,
      rightValidity,
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
      createCompiled: props => new CompiledGPUDataFrameJoin(props, resources)
    };
  } catch (error) {
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Publishes right row IDs, match flags, probes, and diagnostics for every left source row. */
function addGPULookupToGraph<Left extends GPUTypeMap, Right extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Left>,
  right: GPUDataFrame<Right>,
  options: GPUDataFrameNormalizedJoinOptions
): GPUDataFrameQueryExtensionResult<Left, CompiledGPUDataFrameLookup<Left, Right>> {
  const ownedVectors: GPUVector[] = [];
  const id = `${context.queryId}-lookup`;
  try {
    const indexState = buildGPUJoinIndex(context, right, options, ownedVectors, id);
    const lengths = context.table.batches.map(batch => batch.numRows);
    const rightRowIndices = createGPUJoinOutputVector(context.graph.device, `${id}-right`, lengths);
    ownedVectors.push(rightRowIndices);
    const matchMask = createGPUJoinOutputVector(context.graph.device, `${id}-matched`, lengths);
    ownedVectors.push(matchMask);
    const probeCounts = createGPUJoinOutputVector(context.graph.device, `${id}-probes`, lengths);
    ownedVectors.push(probeCounts);
    const lookupStatistics = createGPUJoinOutputVector(
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

    const resources: GPULookupResources<Right> = {
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
      createCompiled: props => new CompiledGPUDataFrameLookup(props, resources)
    };
  } catch (error) {
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Builds one right index without concatenation and sanitizes filtered/nullable left source keys. */
function buildGPUJoinIndex<Left extends GPUTypeMap, Right extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Left>,
  right: GPUDataFrame<Right>,
  options: GPUDataFrameNormalizedJoinOptions,
  ownedVectors: GPUVector[],
  id: string
): GPUJoinIndexState {
  const graph = context.graph;
  const leftVector = getGPUAnalyticsVector(context, options.leftOn);
  if (leftVector.format !== 'uint32') {
    throw new Error('GPUDataFrame left join keys must use packed uint32 GPU data');
  }
  const leftKeys = graph.importGPUVector(`${id}-left-keys`, leftVector as GPUVector<'uint32'>);
  const rightField = right.schema.fields.find(field => field.name === options.rightOn);
  const rightVector = right.table.gpuVectors[options.rightOn];
  if (rightField?.format !== 'uint32' && rightVector?.format !== 'uint32') {
    throw new Error('GPUDataFrame right join keys must use packed uint32 GPU data');
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
    throw new Error('GPUDataFrame nullable right join keys require explicit GPU validity');
  }

  const indexStatistics = createGPUJoinOutputVector(graph.device, `${id}-index-statistics`, [
    GPU_HASH_INDEX_STATISTICS_LENGTH
  ]);
  ownedVectors.push(indexStatistics);
  const contractViolation = createGPUJoinOutputVector(
    graph.device,
    `${id}-contract-violation`,
    [1]
  );
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
  addGPUJoinContractPass(graph, `${id}-validate-contract`, statistics, violation);

  const leftField = context.table.schema.fields.find(field => field.name === options.leftOn);
  const leftValidity = leftField?.nullable
    ? context.validity[options.leftOn as keyof Left & string]
    : undefined;
  if (leftField?.nullable && leftKeys.length > 0 && !leftValidity) {
    throw new Error('GPUDataFrame nullable left join keys require explicit GPU validity');
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
      addGPUJoinPrepareKeysPass(graph, `${id}-prepare-batch-${batchIndex}`, {
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
function createGPUJoinOutputVector(
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

/** Publishes one strict GPU contract flag for duplicates, bounded index overflow, or reserved keys. */
function addGPUJoinContractPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
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
  addGPUAnalyticsComputePass(graph, {
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
function addGPUJoinPrepareKeysPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
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
  ${getGPUAnalyticsInvocationIndexSource(graph, props.input.length)}
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
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources,
    bindings,
    length: props.input.length
  });
}

/** Separates join semantics from nullable key lookup and suppresses invalid right indexes. */
function addGPUJoinClassifyPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    matches: GraphDataView<'uint32'>;
    selection: GraphDataView<'uint32'>;
    violation: GraphDataView<'uint32'>;
    included: GraphDataView<'uint32'>;
    joinType: GPUDataFrameJoinType;
  }
): void {
  const inclusion =
    props.joinType === 'left'
      ? 'selected'
      : props.joinType === 'anti'
        ? 'selected && !matched'
        : 'selected && matched';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.matches.length}u;
const MATCH_OFFSET: u32 = ${getViewElementOffset(props.matches)}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(props.selection)}u;
const CONTRACT_OFFSET: u32 = ${getViewElementOffset(props.violation)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.included)}u;
@group(0) @binding(0) var<storage, read> matchedRows: array<u32>;
@group(0) @binding(1) var<storage, read> selectionMask: array<u32>;
@group(0) @binding(2) var<storage, read> contractViolation: array<u32>;
@group(0) @binding(3) var<storage, read_write> includedRows: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, props.matches.length)}
  if (index < ELEMENT_COUNT) {
    let selected = selectionMask[SELECTION_OFFSET + index] != 0u;
    let matched = matchedRows[MATCH_OFFSET + index] != 0u;
    let included = (${inclusion}) && contractViolation[CONTRACT_OFFSET] == 0u;
    includedRows[OUTPUT_OFFSET + index] = select(0u, 1u, included);
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: props.matches, usage: 'storage-read'},
      {buffer: props.selection, usage: 'storage-read'},
      {buffer: props.violation, usage: 'storage-read'},
      {buffer: props.included, usage: 'storage-write'}
    ],
    bindings: {
      matchedRows: props.matches,
      selectionMask: props.selection,
      contractViolation: props.violation,
      includedRows: props.included
    },
    length: Math.max(props.matches.length, 1)
  });
}

/** Publishes required/bounded counts and source-aligned selected masks for one left batch. */
function addGPUJoinCountPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    included: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    selection: GraphDataView<'uint32'>;
    required: GraphDataView<'uint32'>;
    published: GraphDataView<'uint32'>;
    overflow: GraphDataView<'uint32'>;
    indexStatistics: GraphDataView<'uint32'>;
    capacity: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.included.length}u;
const INCLUDED_OFFSET: u32 = ${getViewElementOffset(props.included)}u;
const OFFSET_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const SELECTION_OFFSET: u32 = ${getViewElementOffset(props.selection)}u;
const REQUIRED_OFFSET: u32 = ${getViewElementOffset(props.required)}u;
const PUBLISHED_OFFSET: u32 = ${getViewElementOffset(props.published)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(props.overflow)}u;
const STATISTICS_OFFSET: u32 = ${getViewElementOffset(props.indexStatistics)}u;
const OUTPUT_CAPACITY: u32 = ${props.capacity}u;
@group(0) @binding(0) var<storage, read> includedRows: array<u32>;
@group(0) @binding(1) var<storage, read> includedOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> selectionMask: array<u32>;
@group(0) @binding(3) var<storage, read_write> requiredCounts: array<u32>;
@group(0) @binding(4) var<storage, read_write> selectedCounts: array<u32>;
@group(0) @binding(5) var<storage, read_write> overflowFlags: array<u32>;
@group(0) @binding(6) var<storage, read> indexStatistics: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, Math.max(props.included.length, 1))}
  if (index == 0u) {
    var required = 0u;
    if (ELEMENT_COUNT > 0u) {
      let last = ELEMENT_COUNT - 1u;
      required = includedOffsets[OFFSET_OFFSET + last] + includedRows[INCLUDED_OFFSET + last];
    }
    requiredCounts[REQUIRED_OFFSET] = required;
    selectedCounts[PUBLISHED_OFFSET] = min(required, OUTPUT_CAPACITY);
    let overflow = required > OUTPUT_CAPACITY || indexStatistics[STATISTICS_OFFSET + 2u] != 0u;
    overflowFlags[OVERFLOW_OFFSET] = select(0u, 1u, overflow);
  }
  if (index < ELEMENT_COUNT) {
    let selected = includedRows[INCLUDED_OFFSET + index] != 0u &&
      includedOffsets[OFFSET_OFFSET + index] < OUTPUT_CAPACITY;
    selectionMask[SELECTION_OFFSET + index] = select(0u, 1u, selected);
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: props.included, usage: 'storage-read'},
      {buffer: props.offsets, usage: 'storage-read'},
      {buffer: props.selection, usage: 'storage-write'},
      {buffer: props.required, usage: 'storage-write'},
      {buffer: props.published, usage: 'storage-write'},
      {buffer: props.overflow, usage: 'storage-write'},
      {buffer: props.indexStatistics, usage: 'storage-read'}
    ],
    bindings: {
      includedRows: props.included,
      includedOffsets: props.offsets,
      selectionMask: props.selection,
      requiredCounts: props.required,
      selectedCounts: props.published,
      overflowFlags: props.overflow,
      indexStatistics: props.indexStatistics
    },
    length: Math.max(props.included.length, 1)
  });
}

/** Writes stable bounded source IDs and explicit compacted right validity without aliasing. */
function addGPUJoinScatterPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    included: GraphDataView<'uint32'>;
    matches: GraphDataView<'uint32'>;
    offsets: GraphDataView<'uint32'>;
    matchedRightRows: GraphDataView<'uint32'>;
    leftRows: GraphDataView<'uint32'>;
    rightRows: GraphDataView<'uint32'>;
    rightValidity: GraphDataView<'uint32'>;
    firstLeftRow: number;
    capacity: number;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.included.length}u;
const INCLUDED_OFFSET: u32 = ${getViewElementOffset(props.included)}u;
const MATCH_OFFSET: u32 = ${getViewElementOffset(props.matches)}u;
const OFFSET_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
const MATCHED_RIGHT_OFFSET: u32 = ${getViewElementOffset(props.matchedRightRows)}u;
const LEFT_OFFSET: u32 = ${getViewElementOffset(props.leftRows)}u;
const RIGHT_OFFSET: u32 = ${getViewElementOffset(props.rightRows)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(props.rightValidity)}u;
const FIRST_LEFT_ROW: u32 = ${props.firstLeftRow}u;
const OUTPUT_CAPACITY: u32 = ${props.capacity}u;
@group(0) @binding(0) var<storage, read> includedRows: array<u32>;
@group(0) @binding(1) var<storage, read> matchedRows: array<u32>;
@group(0) @binding(2) var<storage, read> includedOffsets: array<u32>;
@group(0) @binding(3) var<storage, read> matchedRightRows: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputLeftRows: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputRightRows: array<u32>;
@group(0) @binding(6) var<storage, read_write> rightValidity: array<u32>;

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, props.included.length)}
  if (index < ELEMENT_COUNT) {
    let outputIndex = includedOffsets[OFFSET_OFFSET + index];
    let included = includedRows[INCLUDED_OFFSET + index] != 0u;
    if (included && outputIndex < OUTPUT_CAPACITY) {
      let matched = matchedRows[MATCH_OFFSET + index] != 0u;
      outputLeftRows[LEFT_OFFSET + outputIndex] = FIRST_LEFT_ROW + index;
      outputRightRows[RIGHT_OFFSET + outputIndex] = select(
        ${GPU_HASH_INDEX_EMPTY_KEY}u,
        matchedRightRows[MATCHED_RIGHT_OFFSET + index],
        matched
      );
      rightValidity[VALIDITY_OFFSET + outputIndex] = select(0u, 1u, matched);
    }
    let required = includedOffsets[OFFSET_OFFSET + ELEMENT_COUNT - 1u] +
      includedRows[INCLUDED_OFFSET + ELEMENT_COUNT - 1u];
    let published = min(required, OUTPUT_CAPACITY);
    if (index >= published) {
      outputLeftRows[LEFT_OFFSET + index] = 0u;
      outputRightRows[RIGHT_OFFSET + index] = 0u;
      rightValidity[VALIDITY_OFFSET + index] = 0u;
    }
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: props.included, usage: 'storage-read'},
      {buffer: props.matches, usage: 'storage-read'},
      {buffer: props.offsets, usage: 'storage-read'},
      {buffer: props.matchedRightRows, usage: 'storage-read'},
      {buffer: props.leftRows, usage: 'storage-write'},
      {buffer: props.rightRows, usage: 'storage-write'},
      {buffer: props.rightValidity, usage: 'storage-write'}
    ],
    bindings: {
      includedRows: props.included,
      matchedRows: props.matches,
      includedOffsets: props.offsets,
      matchedRightRows: props.matchedRightRows,
      outputLeftRows: props.leftRows,
      outputRightRows: props.rightRows,
      rightValidity: props.rightValidity
    },
    length: Math.max(props.included.length, 1)
  });
}
