// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPURecordBatch, GPUTable, type GPUField, type GPUTypeMap} from '@luma.gl/graph/gpu-tables';
import {
  GraphVectorView,
  type GPUCommandGraph,
  type GraphDataView,
  type GraphBufferUse
} from '@luma.gl/graph/gpu-core';
import {
  GPUGroupAggregation,
  GPUGather,
  GPUReduction,
  GPUScan,
  GPUSort,
  createTransientView
} from '@luma.gl/graph/gpu-core';
import {GPUMask, GPUVisibilityWorkflow} from '@luma.gl/graph/gpu-core';
import {
  createTransientVectorView,
  getViewElementOffset,
  validatePackedUint32View
} from '@luma.gl/graph/gpu-core';
import {
  LU_ANALYTICS_WORKGROUP_SIZE,
  type GPUAnalyticsScalarFormat,
  addGPUAnalyticsComputePass,
  getGPUAnalyticsInvocationIndexSource,
  getGPUAnalyticsSelectionMask,
  validateGPUAnalyticsOutputLength
} from './gpu-analytics-compiler-utils';
import {
  GPUDataFrame,
  type GPUDataFrameDictionaries,
  type GPUDataFrameValidity
} from './gpu-data-frame';
import type {GPUDataFrameDerivedColumn} from './gpu-data-frame-query';
import type {GPUExpression} from './gpu-expression';
import type {GPUDataFrameAggregationDefinition} from './gpu-group-by-query';
import {
  addGPUDataFrameResultPredicate,
  CompiledGPUDataFrameQuery,
  projectGPUDataFrameQueryResult,
  compileGPUDataFrameQuery,
  type CompiledGPUDataFrameQueryProps,
  type GPUDataFrameQueryExtensionContext,
  type GPUDataFrameQueryExtensionResult,
  type GPUDataFrameQueryParameters
} from './gpu-query-compiler';

import {addGPUGlobalOrdering, type GPUGlobalSortKey} from './gpu-global-sort-compiler';

import {prepareGPUJoinAggregation, type GPUAggregateJoin} from './gpu-join-compiler';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const MAXIMUM_UINT32 = 0xffffffff;

type GPUGroupedMetricState = {
  values: GraphVectorView<'float32'>;
  mask: GraphVectorView<'uint32'>;
  validity: GPUVector<'uint32'>;
};

/** Dense grouped GPU statistics retaining their original source selection and row identities. */
export class CompiledGPUDataFrameGroupedAggregation<
  T extends GPUTypeMap = GPUTypeMap
> extends CompiledGPUDataFrameQuery<T> {
  /** Result table capacity. Observed grouping publishes the actual count in selectedCounts. */
  readonly groupCount: number;

  /** Group row indices in global ORDER BY order, when requested. */
  readonly globalRowIndices?: GPUVector<'uint32'>;
  /** Number of groups left after applying the page, when ordered. */
  readonly globalSelectedCount?: GPUVector<'uint32'>;

  /** @internal */
  constructor(
    props: CompiledGPUDataFrameQueryProps<T>,
    groupCount: number,
    ordering?: ReturnType<typeof addGPUGlobalOrdering>
  ) {
    super(props);
    this.groupCount = groupCount;
    this.globalRowIndices = ordering?.globalRowIndices;
    this.globalSelectedCount = ordering?.globalSelectedCount;
  }
}

/** Output names and order for grouped SQL projections. @internal */
export type GPUGroupedOutputProjection = Readonly<{
  /** Name of the grouped key in the output schema. */
  key: string;
  /** Output names in SELECT order. */
  columns: readonly string[];
}>;

/** Ordered source keys and their corresponding output fields. */
type GPUGroupingKeys = readonly Readonly<{source: string; output?: string}>[];

/** Adds observed numeric and composite grouping bounded by the source row count. @internal */
export function compileGPUDataFrameObservedAggregation(
  source: GPUDataFrame,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly string[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[],
  keys: GPUGroupingKeys,
  definitions: readonly GPUDataFrameAggregationDefinition[],
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  columns: readonly string[],
  ordering?: readonly GPUGlobalSortKey[],
  having?: GPUExpression<boolean, string>,
  join?: GPUAggregateJoin,
  maxMeanScratchBytes?: number,
  maxReductionScratchBytes?: number
): CompiledGPUDataFrameGroupedAggregation {
  if (source.numRows > 0) validateGPUGroupingCapacity(source, source.numRows, graph);
  validateGPUGroupingSourceColumns(
    source,
    keys.map(key => key.source),
    definitions
  );
  return compileGPUDataFrameQuery<
    GPUTypeMap,
    GPUTypeMap,
    GPUTypeMap,
    CompiledGPUDataFrameGroupedAggregation
  >(source, predicates, selectedColumns, graph, derivedColumns, {
    prepare: context => {
      const prepare = (input: typeof context) =>
        addGPUGroupedAggregationToGraph(
          input,
          keys,
          source.numRows,
          definitions,
          columns,
          true,
          ordering,
          having,
          maxMeanScratchBytes,
          maxReductionScratchBytes
        );
      return join ? prepareGPUJoinAggregation(source, context, join, prepare) : prepare(context);
    }
  });
}

/** Adds dense categorical aggregation to source-row work before the shared graph is frozen. */
export function compileGPUDataFrameGroupedAggregation<
  Source extends GPUTypeMap,
  Selection extends GPUTypeMap,
  Result extends GPUTypeMap
>(
  source: GPUDataFrame<Source>,
  predicates: readonly GPUExpression<boolean, string>[],
  selectedColumns: readonly (keyof Selection & string)[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[],
  key: keyof Selection & string,
  groupCount: number,
  definitions: readonly GPUDataFrameAggregationDefinition[],
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  projection?: GPUGroupedOutputProjection,
  ordering?: readonly GPUGlobalSortKey<keyof Result & string>[],
  having?: GPUExpression<boolean, string>,
  join?: GPUAggregateJoin,
  maxMeanScratchBytes?: number,
  maxReductionScratchBytes?: number
): CompiledGPUDataFrameGroupedAggregation<Result> {
  validateGPUGroupingCapacity(source, groupCount, graph);
  validateGPUGroupingSourceColumns(source, [key], definitions);
  return compileGPUDataFrameQuery<
    Source,
    Selection,
    Result,
    CompiledGPUDataFrameGroupedAggregation<Result>
  >(source, predicates, selectedColumns, graph, derivedColumns, {
    prepare: context => {
      const prepare = (input: typeof context) =>
        addGPUGroupedAggregationToGraph<Selection, Result>(
          input,
          [{source: key, output: projection?.key ?? key}],
          groupCount,
          definitions,
          projection?.columns,
          false,
          ordering,
          having,
          maxMeanScratchBytes,
          maxReductionScratchBytes
        );
      return join ? prepareGPUJoinAggregation(source, context, join, prepare) : prepare(context);
    }
  });
}

/** Rejects unsupported constants and explicitly unknown source nullability before GPU allocation. */
function validateGPUGroupingSourceColumns<Source extends GPUTypeMap>(
  source: GPUDataFrame<Source>,
  keys: readonly string[],
  definitions: readonly GPUDataFrameAggregationDefinition[]
): void {
  const columnNames = new Set([
    ...keys,
    ...definitions.flatMap(definition =>
      definition.operation !== 'count' && definition.column ? [definition.column] : []
    )
  ]);
  for (const name of columnNames) {
    if (source.table.gpuConstants[name]) {
      throw new Error(`GPUDataFrame grouping column "${name}" must contain GPU vector data`);
    }
    const field = source.schema.fields.find(candidate => candidate.name === name);
    if (field?.nullable && source.numRows > 0 && !source.validity[name as keyof Source & string]) {
      throw new Error(`GPUDataFrame nullable grouping column "${name}" requires GPU validity`);
    }
  }
}

/** Rejects overflow and unsupported output dimensions before retaining or allocating GPU state. */
function validateGPUGroupingCapacity<Source extends GPUTypeMap>(
  source: GPUDataFrame<Source>,
  groupCount: number,
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>
): void {
  if (!Number.isSafeInteger(groupCount) || groupCount <= 0 || groupCount > MAXIMUM_UINT32) {
    throw new Error('GPUDataFrame grouping requires a positive uint32 group count');
  }
  if (source.numRows > MAXIMUM_UINT32) {
    throw new Error('GPUDataFrame group counts cannot represent more than uint32 source rows');
  }
  validateGPUAnalyticsOutputLength(graph, groupCount);
  const byteLength = groupCount * UINT32_BYTE_LENGTH;
  if (
    byteLength > graph.device.limits.maxStorageBufferBindingSize ||
    byteLength > graph.device.limits.maxBufferSize
  ) {
    throw new Error('GPUDataFrame group count exceeds the available GPU buffer capacity');
  }
}

/** Creates grouped buffers, null-aware masks, and one cross-batch primitive per requested metric. */
function addGPUGroupedAggregationToGraph<Selection extends GPUTypeMap, Result extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  groupingKeys: GPUGroupingKeys,
  groupCount: number,
  definitions: readonly GPUDataFrameAggregationDefinition[],
  columns?: readonly string[],
  observed = false,
  orderBy?: readonly GPUGlobalSortKey<keyof Result & string>[],
  having?: GPUExpression<boolean, string>,
  maxMeanScratchBytes?: number,
  maxReductionScratchBytes?: number
): GPUDataFrameQueryExtensionResult<Result, CompiledGPUDataFrameGroupedAggregation<Result>> {
  const graph = context.graph;
  const prefix = `${context.queryId}-group`;
  const ownedVectors: GPUVector[] = [];
  let resultTable: GPUTable<Result> | undefined;
  let projection: GPUDataFrame<Result> | undefined;

  try {
    const inputs = groupingKeys.map(({source}, index) =>
      graph.importGPUVector(
        `${prefix}-key-${index}`,
        getGPUGroupingVector(
          context,
          source,
          observed ? getGPUGroupingFormat(context.table, source) : 'uint32'
        )
      )
    );
    const outputVectors = new Map<string, GPUVector<GPUAnalyticsScalarFormat>>();
    const outputs = groupingKeys.map(({output}, index) => {
      if (output === undefined) return undefined;
      const vector = createGPUGroupedOutputVector(
        graph.device,
        `${prefix}-output-key-${index}`,
        groupCount,
        inputs[index].format
      );
      ownedVectors.push(vector);
      outputVectors.set(output, vector);
      return graph.importGPUVector(`${prefix}-output-key-view-${index}`, vector).data[0];
    });
    const keyValidity = observed
      ? undefined
      : getGPUGroupingValidity(context, groupingKeys[0].source, inputs[0]);
    const baseMask = keyValidity
      ? combineGPUGroupingMasks(graph, `${prefix}-key-validity`, context.selectionMask, keyValidity)
      : context.selectionMask;
    const validity: Record<string, GPUVector<'uint32'>> = {};
    const nullableKeys = observed
      ? groupingKeys.map(({source, output}, index) => {
          const field = context.table.schema.fields.find(field => field.name === source);
          if (!field?.nullable) return undefined;
          const input = getGPUGroupingValidity(context, source, inputs[index]);
          if (output === undefined) return {input};
          const mask = createGPUGroupedOutputVector(
            graph.device,
            prefix + '-key-mask-' + index,
            groupCount,
            'uint32'
          );
          ownedVectors.push(mask);
          validity[output] = mask;
          return {
            input,
            output: graph.importGPUVector(prefix + '-key-mask-view-' + index, mask).data[0]
          };
        })
      : [];
    let rowSelection = observed
      ? addGPUObservedGroups(context, prefix, inputs, outputs, nullableKeys, ownedVectors)
      : undefined;
    const keys = rowSelection?.keys ?? (inputs[0] as GraphVectorView<'uint32'>);
    if (!observed)
      addGPUGroupIdentityPass(
        graph,
        `${prefix}-output-key-identity`,
        outputs[0] as GraphDataView<'uint32'>
      );

    const metricStates = new Map<string, GPUGroupedMetricState>();

    for (const [definitionIndex, definition] of definitions.entries()) {
      const metricId = `${prefix}-metric-${definitionIndex}`;
      if (groupCount === 0) {
        const format = definition.operation === 'count' ? 'uint32' : 'float32';
        const output = createGPUGroupedOutputVector(graph.device, metricId, 0, format);
        ownedVectors.push(output);
        outputVectors.set(definition.name, output as GPUVector<'uint32'> | GPUVector<'float32'>);
        if (definition.operation !== 'count') {
          const mask = createGPUGroupedOutputVector(
            graph.device,
            `${metricId}-validity`,
            0,
            'uint32'
          );
          ownedVectors.push(mask);
          validity[definition.name] = mask;
        }
        continue;
      }
      if (definition.operation === 'count') {
        const output = createGPUGroupedOutputVector(graph.device, metricId, groupCount, 'uint32');
        ownedVectors.push(output);
        outputVectors.set(definition.name, output);
        graph.add(
          new GPUGroupAggregation({
            id: metricId,
            keys,
            mask: definition.column
              ? getGPUAnalyticsSelectionMask(context, definition.column, metricId, baseMask)
              : baseMask,
            output: graph.importGPUVector(`${metricId}-output`, output).data[0],
            operation: 'count'
          })
        );
        continue;
      }

      const columnName = definition.column;
      if (!columnName) {
        throw new Error('GPUDataFrame grouped statistics require a numeric value column');
      }
      let state = metricStates.get(columnName);
      if (!state) {
        state = createGPUGroupedMetricState(
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

      const output = createGPUGroupedOutputVector(graph.device, metricId, groupCount, 'float32');
      ownedVectors.push(output);
      outputVectors.set(definition.name, output);
      validity[definition.name] = state.validity;
      graph.add(
        new GPUGroupAggregation({
          id: metricId,
          keys,
          values: state.values,
          mask: state.mask,
          output: graph.importGPUVector(`${metricId}-output`, output).data[0],
          operation: definition.operation,
          maxMeanScratchBytes,
          maxReductionScratchBytes
        })
      );
    }

    resultTable = createGPUGroupedResultTable<Selection, Result>(
      context.table,
      groupingKeys,
      definitions,
      outputVectors,
      columns && [
        ...columns,
        ...definitions
          .filter(definition => !columns.includes(definition.name))
          .map(definition => definition.name)
      ],
      observed
    );
    const dictionaries = Object.freeze(
      Object.fromEntries(
        groupingKeys.flatMap(({source, output}) => {
          if (output === undefined) return [];
          const dictionary = context.dictionaries[source as keyof Selection & string];
          return dictionary ? [[output, dictionary]] : [];
        })
      )
    ) as Readonly<GPUDataFrameDictionaries<Result>>;

    if ((orderBy || having) && !rowSelection) {
      const mask = createGPUGroupedOutputVector(
        graph.device,
        prefix + '-dense-mask',
        groupCount,
        'uint32'
      );
      const rows = createGPUGroupedOutputVector(
        graph.device,
        prefix + '-dense-rows',
        groupCount,
        'uint32'
      );
      const count = createGPUGroupedOutputVector(
        graph.device,
        prefix + '-dense-count',
        1,
        'uint32'
      );
      ownedVectors.push(mask, rows, count);
      addGPUGroupingPass(
        graph,
        prefix + '-dense-selection',
        groupCount,
        {},
        {
          mask: graph.importGPUVector(prefix + '-dense-mask-init', mask).data[0],
          rows: graph.importGPUVector(prefix + '-dense-rows-init', rows).data[0],
          count: graph.importGPUVector(prefix + '-dense-count-init', count).data[0]
        },
        `mask[index] = 1u; rows[index] = index; if (index == 0u) { count[0] = ${groupCount}u; }`
      );
      rowSelection = {keys, mask, rows, count};
    }
    if (having && rowSelection && groupCount > 0) {
      const selectionMask = graph.importGPUVector(prefix + '-having-selection', rowSelection.mask);
      const predicateMask = createTransientVectorView(
        graph,
        prefix + '-having-mask',
        selectionMask
      );
      const groupedFrame = new GPUDataFrame({
        table: resultTable,
        validity: validity as GPUDataFrameValidity<Result>,
        dictionaries,
        ownership: 'borrowed'
      });
      try {
        addGPUDataFrameResultPredicate(
          graph,
          prefix + '-having',
          groupedFrame,
          having,
          predicateMask
        );
      } finally {
        groupedFrame.destroy();
      }
      const mask = createGPUGroupedOutputVector(
        graph.device,
        prefix + '-having-result',
        groupCount,
        'uint32'
      );
      ownedVectors.push(mask);
      graph.add(
        new GPUVisibilityWorkflow({
          id: prefix + '-having-filter',
          predicates: [
            {kind: 'selection', mask: selectionMask.data[0]},
            {kind: 'selection', mask: predicateMask.data[0]}
          ],
          outputMask: graph.importGPUVector(prefix + '-having-result-view', mask).data[0],
          output: graph.importGPUVector(prefix + '-having-rows', rowSelection.rows).data[0],
          count: graph.importGPUVector(prefix + '-having-count', rowSelection.count).data[0]
        })
      );
      rowSelection = {...rowSelection, mask};
    }

    const ordering =
      orderBy && rowSelection
        ? addGPUGlobalOrdering(
            {
              graph,
              queryId: prefix + '-ordered',
              table: resultTable,
              validity: validity as GPUDataFrameValidity<Result>,
              dictionaries,
              selectionMask: graph.importGPUVector(prefix + '-ordered-mask', rowSelection.mask),
              rowIndices: graph.importGPUVector(prefix + '-ordered-rows', rowSelection.rows),
              selectedCounts: graph.importGPUVector(prefix + '-ordered-count', rowSelection.count)
            },
            orderBy,
            ownedVectors,
            prefix + '-ordered'
          )
        : undefined;

    const resultValidity = Object.freeze(validity) as Readonly<GPUDataFrameValidity<Result>>;
    if (columns && resultTable.schema.fields.length !== columns.length) {
      projection = projectGPUDataFrameQueryResult(
        {table: resultTable, validity: resultValidity, dictionaries},
        columns as readonly (keyof Result & string)[]
      );
    }
    return {
      table: projection?.table ?? resultTable,
      validity: projection?.validity ?? resultValidity,
      dictionaries: projection?.dictionaries ?? dictionaries,
      ownedTables: projection ? [projection, resultTable] : [resultTable],
      ownedVectors,
      createCompiled: props =>
        new CompiledGPUDataFrameGroupedAggregation(
          rowSelection
            ? {
                ...props,
                rowIndices: rowSelection.rows,
                selectedCounts: rowSelection.count,
                selectionMask: rowSelection.mask,
                ownedVectors: [
                  ...(props.ownedVectors ?? []).filter(
                    vector =>
                      vector !== rowSelection.rows &&
                      vector !== rowSelection.mask &&
                      vector !== rowSelection.count
                  ),
                  props.rowIndices,
                  props.selectedCounts,
                  props.selectionMask
                ]
              }
            : props,
          groupCount,
          ordering
        )
    };
  } catch (error) {
    projection?.destroy();
    resultTable?.destroy();
    for (const vector of ownedVectors) {
      vector.destroy();
    }
    throw error;
  }
}

/** Groups observed rows by stable sorts of each value and its separate validity class. */
function addGPUObservedGroups(
  context: Pick<GPUDataFrameQueryExtensionContext<GPUTypeMap>, 'graph' | 'selectionMask'>,
  prefix: string,
  inputs: readonly GraphVectorView<GPUAnalyticsScalarFormat>[],
  outputs: readonly (GraphDataView<GPUAnalyticsScalarFormat> | undefined)[],
  nullableKeys: readonly (
    | {input?: GraphVectorView<'uint32'>; output?: GraphDataView<'uint32'>}
    | undefined
  )[],
  ownedVectors: GPUVector[]
): {
  keys: GraphVectorView<'uint32'>;
  rows: GPUVector<'uint32'>;
  count: GPUVector<'uint32'>;
  mask: GPUVector<'uint32'>;
} {
  const {graph, selectionMask} = context;
  const length = selectionMask.length;
  const allocate = (name: string, size: number) => {
    const vector = createGPUGroupedOutputVector(graph.device, prefix + name, size, 'uint32');
    ownedVectors.push(vector);
    return vector;
  };
  const rows = allocate('-result-rows', length);
  const mask = allocate('-result-mask', length);
  const count = allocate('-result-count', 1);
  const countView = graph.importGPUVector(prefix + '-count-view', count).data[0];
  if (length === 0) {
    addGPUGroupingPass(graph, prefix + '-empty', 1, {}, {count: countView}, 'count[0] = 0u;');
    return {keys: selectionMask, rows, count, mask};
  }

  const words = (view: GraphDataView<GPUAnalyticsScalarFormat>) => {
    const packed = graph.createDataView(view.buffer, {
      format: 'uint32',
      length: view.length,
      byteOffset: view.byteOffset,
      byteStride: view.byteStride
    });
    validatePackedUint32View(packed, prefix + '-key');
    return packed;
  };
  const scratch = (name: string) => createTransientView(graph, prefix + name, 'uint32', length);
  const staged = inputs.map((input, index) => ({
    input,
    values: scratch('-values-' + index),
    classes: scratch('-classes-' + index)
  }));
  const orders = [scratch('-order-a'), scratch('-order-b')];
  const gathered = scratch('-gathered');
  const sortedValues = scratch('-sorted-values');
  const heads = scratch('-heads');
  const ranks = scratch('-ranks');
  const groupIds = scratch('-group-ids');

  let offset = 0;
  for (const [batchIndex, selection] of selectionMask.data.entries()) {
    if (selection.length > 0) {
      for (const [index, {input, values, classes}] of staged.entries()) {
        const validity = nullableKeys[index]?.input?.data[batchIndex];
        addGPUGroupingPass(
          graph,
          prefix + '-stage-' + batchIndex + '-' + index,
          selection.length,
          {
            input: words(input.data[batchIndex]),
            ...(index === 0 ? {selection} : {}),
            ...(validity ? {validity} : {})
          },
          {values, classes, ...(index === 0 ? {ordinals: orders[0]} : {})},
          `
            let row = ${offset}u + index;
            let raw = input[index];
            let valid = ${validity ? 'validity[index] != 0u' : 'true'};
            let category = ${index === 0 ? 'select(2u, u32(!valid), selection[index] != 0u)' : 'u32(!valid)'};
            ${
              input.format === 'float32'
                ? `
              let magnitude = raw & 0x7fffffffu;
              let canonical = select(select(raw, 0u, magnitude == 0u), 0x7fc00000u, magnitude > 0x7f800000u);
            `
                : 'let canonical = raw;'
            }
            values[row] = select(0u, canonical, valid);
            classes[row] = category;
            ${index === 0 ? 'ordinals[row] = row;' : ''}
          `
        );
      }
    }
    offset += selection.length;
  }

  let orderIndex = 0;
  for (let index = staged.length - 1; index >= 0; index--) {
    const {values, classes} = staged[index];
    const sortKeys = index === 0 || nullableKeys[index] ? [values, classes] : [values];
    for (const [passIndex, source] of sortKeys.entries()) {
      const id = prefix + '-order-' + index + '-' + passIndex;
      graph.add(
        new GPUGather({id: id + '-gather', source, indices: orders[orderIndex], output: gathered})
      );
      graph.add(
        new GPUSort({
          id,
          keys: gathered,
          values: orders[orderIndex],
          outputKeys: sortedValues,
          outputValues: orders[1 - orderIndex]
        })
      );
      orderIndex = 1 - orderIndex;
    }
  }
  const order = orders[orderIndex];
  const first = staged[0];
  for (const [index, {values, classes}] of staged.entries()) {
    const firstKey = index === 0;
    addGPUGroupingPass(
      graph,
      prefix + '-heads-' + index,
      length,
      {order, values, classes, ...(firstKey ? {} : {firstClasses: first.classes})},
      {heads},
      `
        let row = order[index];
        let previous = order[max(index, 1u) - 1u];
        let changed = classes[row] != classes[previous] || values[row] != values[previous];
        let selected = ${firstKey ? 'classes' : 'firstClasses'}[row] != 2u;
        heads[index] = u32(selected && (${firstKey ? 'index == 0u' : 'heads[index] != 0u'} || changed));
      `
    );
  }
  graph.add(
    new GPUScan({id: prefix + '-scan-heads', input: heads, output: ranks, mode: 'inclusive'})
  );
  graph.add(
    new GPUReduction({
      id: prefix + '-count-heads',
      input: heads,
      output: countView,
      operation: 'sum'
    })
  );
  addGPUGroupingPass(
    graph,
    prefix + '-scatter-ids',
    length,
    {order, classes: first.classes, ranks},
    {groupIds},
    `
      let row = order[index];
      groupIds[row] = select(0u, ranks[index] - 1u, classes[row] != 2u);
    `
  );
  for (const [index, {values, classes}] of staged.entries()) {
    const output = outputs[index];
    if (!output) continue;
    const validity = nullableKeys[index]?.output;
    addGPUGroupingPass(
      graph,
      prefix + '-publish-key-' + index,
      length,
      {order, heads, ranks, values, ...(validity ? {classes} : {})},
      {output: words(output), ...(validity ? {validity} : {})},
      `
        if (heads[index] != 0u) {
          let row = order[index];
          let group = ranks[index] - 1u;
          output[group] = values[row];
          ${validity ? 'validity[group] = u32(classes[row] == 0u);' : ''}
        }
      `
    );
  }
  addGPUGroupingPass(
    graph,
    prefix + '-result-selection',
    length,
    {count: countView},
    {
      rows: graph.importGPUVector(prefix + '-rows-view', rows).data[0],
      mask: graph.importGPUVector(prefix + '-mask-view', mask).data[0]
    },
    'rows[index] = index; mask[index] = u32(index < count[0]);'
  );

  let byteOffset = 0;
  const data = selectionMask.data.map(chunk => {
    const view = graph.createDataView(groupIds.buffer, {
      format: 'uint32',
      length: chunk.length,
      byteOffset
    });
    byteOffset += chunk.length * UINT32_BYTE_LENGTH;
    return view;
  });
  const keys = new GraphVectorView({...selectionMask, id: prefix + '-ids', data});
  return {keys, rows, count, mask};
}

/** Binds packed uint32 views and accounts for source chunk offsets in grouping shaders. */
function addGPUGroupingPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  length: number,
  reads: Record<string, GraphDataView<'uint32'>>,
  writes: Record<string, GraphDataView<'uint32'>>,
  body: string
): void {
  const bindings = {...reads, ...writes};
  const resources: GraphBufferUse[] = [];
  const declarations = Object.entries(bindings).map(([name, view], binding) => {
    const write = Object.hasOwn(writes, name);
    resources.push({buffer: view, usage: write ? 'storage-write' : 'storage-read'});
    body = body.replaceAll(name + '[', name + '[' + getViewElementOffset(view) + 'u + ');
    return `@group(0) @binding(${binding}) var<storage, ${write ? 'read_write' : 'read'}> ${name}: array<u32>;`;
  });
  addGPUAnalyticsComputePass(graph, {
    id,
    bindings,
    resources,
    length,
    source: /* wgsl */ `
    ${declarations.join('\n')}
    @compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
    fn main(@builtin(local_invocation_index) localInvocationIndex: u32,
      @builtin(workgroup_id) workgroupId: vec3<u32>) {
      ${getGPUAnalyticsInvocationIndexSource(graph, length)}
      if (index >= ${length}u) { return; }
      ${body}
    }
  `
  });
}

/** Resolves the scalar storage format of an observed key. */
function getGPUGroupingFormat<T extends GPUTypeMap>(
  table: GPUTable<T>,
  name: string
): GPUAnalyticsScalarFormat {
  const format = table.schema.fields.find(field => field.name === name)?.format;
  if (format !== 'uint32' && format !== 'sint32' && format !== 'float32') {
    throw new Error('GPUDataFrame grouping requires 32-bit numeric keys');
  }
  return format;
}

/** Resolves one batch-aligned grouped input, including empty sources. */
function getGPUGroupingVector<
  Selection extends GPUTypeMap,
  Format extends GPUAnalyticsScalarFormat
>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  name: string,
  format: Format
): GPUVector<Format> {
  if (context.table.gpuConstants[name]) {
    throw new Error(`GPUDataFrame grouping column "${name}" must contain GPU vector data`);
  }
  const field = context.table.schema.fields.find(candidate => candidate.name === name);
  const vector = context.table.gpuVectors[name];
  if (
    !field ||
    (vector && vector.format !== format) ||
    (!vector && context.table.batches.length > 0)
  ) {
    throw new Error(`GPUDataFrame grouping column "${name}" requires ${format} GPU vector data`);
  }
  if (!vector) {
    if (field.format !== format) {
      throw new Error(`GPUDataFrame grouping column "${name}" requires ${format} GPU vector data`);
    }
    return new GPUVector({type: 'data', name, format, data: [], ownsData: false});
  }
  return vector as GPUVector<Format>;
}

/** Imports nullable source/derived sidecars and rejects explicitly unknown nonempty validity. */
function getGPUGroupingValidity<Selection extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
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
    throw new Error(`GPUDataFrame nullable grouping column "${name}" requires GPU validity`);
  }
  return context.graph.importGPUVector(`${context.queryId}-group-validity-${name}`, validity);
}

/** Intersects two source-row-aligned masks into graph-owned chunk-preserving scratch. */
function combineGPUGroupingMasks(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  first: GraphVectorView<'uint32'>,
  second: GraphVectorView<'uint32'>
): GraphVectorView<'uint32'> {
  const output = createTransientVectorView(graph, id, first);
  graph.add(new GPUMask({id: `${id}-compose`, inputs: [first, second], output}));
  return output;
}

/** Shares null/NaN-filtered source masks and group validity across every metric on one column. */
function createGPUGroupedMetricState<Selection extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Selection>,
  keys: GraphVectorView<'uint32'>,
  baseMask: GraphVectorView<'uint32'>,
  name: string,
  groupCount: number,
  id: string,
  ownedVectors: GPUVector[]
): GPUGroupedMetricState {
  const values = context.graph.importGPUVector(
    `${id}-input`,
    getGPUGroupingVector(context, name, 'float32')
  );
  const valueValidity = getGPUGroupingValidity(context, name, values);
  const validRows = valueValidity
    ? combineGPUGroupingMasks(context.graph, `${id}-validity-mask`, baseMask, valueValidity)
    : baseMask;
  const finiteRows = createTransientVectorView(context.graph, `${id}-finite-mask`, validRows);
  addGPUGroupFiniteMaskPasses(context.graph, `${id}-finite`, values, validRows, finiteRows);

  const validity = createGPUGroupedOutputVector(
    context.graph.device,
    `${id}-group-validity`,
    groupCount,
    'uint32'
  );
  ownedVectors.push(validity);
  const output = context.graph.importGPUVector(`${id}-group-validity-vector`, validity).data[0];
  context.graph.add(
    new GPUGroupAggregation({
      id: `${id}-accepted-count`,
      keys,
      mask: finiteRows,
      output,
      operation: 'count'
    })
  );
  addGPUNormalizeGroupValidityPass(context.graph, `${id}-normalize-validity`, output);
  return {values, mask: finiteRows, validity};
}

/** Creates one owned dense, renderer-compatible result vector with one physical GPU chunk. */
function createGPUGroupedOutputVector<Format extends GPUAnalyticsScalarFormat>(
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
function createGPUGroupedResultTable<Source extends GPUTypeMap, Result extends GPUTypeMap>(
  source: GPUTable<Source>,
  keys: GPUGroupingKeys,
  definitions: readonly GPUDataFrameAggregationDefinition[],
  vectors: ReadonlyMap<string, GPUVector<GPUAnalyticsScalarFormat>>,
  columns?: readonly string[],
  observed = false
): GPUTable<Result> {
  const outputFields: GPUField[] = [
    ...keys.flatMap(({source: name, output}) => {
      if (output === undefined) return [];
      const field = source.schema.fields.find(candidate => candidate.name === name);
      if (!field) throw new Error('GPUDataFrame grouped result requires an existing key field');
      return [
        {
          name: output,
          format: observed ? getGPUGroupingFormat(source, name) : 'uint32',
          nullable: observed && field.nullable === true,
          metadata: new Map(field.metadata)
        }
      ];
    }),
    ...definitions.map(definition => ({
      name: definition.name,
      format: definition.operation === 'count' ? ('uint32' as const) : ('float32' as const),
      nullable: definition.operation !== 'count',
      metadata: new Map<string, string>()
    }))
  ];
  const fields = columns
    ? columns.map(name => outputFields.find(field => field.name === name)!)
    : outputFields;
  const gpuData: Record<string, GPUData> = {};
  for (const field of fields) {
    const sourceData = vectors.get(field.name)?.data[0];
    if (!sourceData) {
      throw new Error('GPUDataFrame grouped result is missing an output vector');
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
function addGPUGroupIdentityPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
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
  ${getGPUAnalyticsInvocationIndexSource(graph, output.length)}
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = index;
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputValues: output},
    length: output.length
  });
}

/** Rejects null, NaN, and infinite contributions without flattening source record batches. */
function addGPUGroupFiniteMaskPasses(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
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
  ${getGPUAnalyticsInvocationIndexSource(graph, mask.length)}
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
    addGPUAnalyticsComputePass(graph, {
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
function addGPUNormalizeGroupValidityPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
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
  ${getGPUAnalyticsInvocationIndexSource(graph, validity.length)}
  if (index < ELEMENT_COUNT) {
    let offset = OUTPUT_OFFSET + index;
    outputValidity[offset] = select(0u, 1u, outputValidity[offset] != 0u);
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [{buffer: validity, usage: 'storage-read-write'}],
    bindings: {outputValidity: validity},
    length: validity.length
  });
}
