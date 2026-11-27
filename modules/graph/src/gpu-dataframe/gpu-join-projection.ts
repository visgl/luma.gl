// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUVector} from '@luma.gl/graph/gpu-data';
import type {GPUTypeMap} from '@luma.gl/graph/gpu-tables';
import {
  getViewElementOffset,
  type GPUCommandGraph,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/graph/gpu-core';
import {
  addGPUAnalyticsComputePass,
  getGPUAnalyticsInvocationIndexSource,
  LU_ANALYTICS_WORKGROUP_SIZE,
  validateGPUAnalyticsSource,
  type GPUAnalyticsScalarFormat
} from './gpu-analytics-compiler-utils';
import type {GPUDataFrame, GPUDataFrameDictionaries} from './gpu-data-frame';
import {
  createGPUQueryDerivedTable,
  createGPUQueryOutputVector,
  type GPUDataFrameQueryExtensionContext,
  type GPUDataFrameQueryParameters
} from './gpu-query-compiler';

/** One right source field and its name in the joined output. @internal */
export type GPUJoinRightColumn = Readonly<{name: string; source: string}>;

/** Gathers right payloads on GPU into left-aligned chunks while preserving left row identities. */
export function projectGPUJoinColumns<Left extends GPUTypeMap, Right extends GPUTypeMap>(
  context: GPUDataFrameQueryExtensionContext<Left>,
  right: GPUDataFrame<Right>,
  columns: readonly (keyof Left & string)[],
  rightColumns: readonly GPUJoinRightColumn[],
  matchedRows: GraphVectorView<'uint32'>,
  matches: GraphVectorView<'uint32'>,
  ownedVectors: GPUVector[]
) {
  const {graph} = context;
  validateGPUAnalyticsSource(
    right,
    rightColumns.map(column => column.source)
  );
  const lengths = context.table.batches.map(batch => batch.numRows);
  const validity: Partial<Record<keyof Left & string, GPUVector<'uint32'>>> = {};
  const dictionaries: GPUDataFrameDictionaries<Left> = {};
  for (const name of columns) {
    const mask = context.validity[name];
    const dictionary = context.dictionaries[name];
    if (mask) validity[name] = mask;
    if (dictionary) dictionaries[name] = dictionary;
  }
  let sourceOffset = 0;
  const ranges = right.batches
    .map((batch, batchIndex) => {
      const first = batch.sourceInfo?.sourceRowIndexOffset ?? sourceOffset;
      sourceOffset += batch.numRows;
      return {batchIndex, first, length: batch.numRows};
    })
    .filter(range => range.length > 0);
  const sortedRanges = [...ranges].sort((first, second) => first.first - second.first);
  if (
    sortedRanges.some(
      (range, index) =>
        index > 0 && range.first < sortedRanges[index - 1].first + sortedRanges[index - 1].length
    )
  ) {
    throw new Error('GPUDataFrame right join projection requires nonoverlapping source row IDs');
  }

  const outputs = rightColumns.map(({name, source}, columnIndex) => {
    const field = right.schema.fields.find(candidate => candidate.name === source);
    const format = field?.format;
    if (format !== 'float32' && format !== 'sint32' && format !== 'uint32') {
      throw new Error(
        `GPUDataFrame right join projection requires a 32-bit scalar column: ${source}`
      );
    }
    const id = `${context.queryId}-join-projection-${columnIndex}`;
    const values = createGPUQueryOutputVector(graph.device, id, lengths, format, false, true);
    ownedVectors.push(values);
    const valid = createGPUQueryOutputVector(graph.device, id + '-validity', lengths, 'uint32');
    ownedVectors.push(valid);
    const nameKey = name as keyof Left & string;
    const sourceKey = source as keyof Right & string;
    validity[nameKey] = valid;
    delete dictionaries[nameKey];
    const dictionary = right.dictionaries[sourceKey];
    if (dictionary) dictionaries[nameKey] = dictionary;
    if (ranges.length && lengths.some(length => length > 0)) {
      const input = graph.importGPUVector(id + '-input', right.table.gpuVectors[source]);
      const inputValidity = right.validity[sourceKey];
      const validInput =
        inputValidity && graph.importGPUVector(id + '-input-validity', inputValidity);
      const output = graph.importGPUVector(id + '-output', values);
      const validOutput = graph.importGPUVector(id + '-output-validity', valid);
      for (const [leftBatch, rows] of matchedRows.data.entries()) {
        if (!rows.length) continue;
        for (const [rangeIndex, {batchIndex, first}] of ranges.entries()) {
          addGPUJoinProjectionPass(graph, `${id}-${leftBatch}-${batchIndex}`, {
            rows,
            matches: matches.data[leftBatch],
            input: input.data[batchIndex] as GraphDataView<GPUAnalyticsScalarFormat>,
            inputValidity: validInput?.data[batchIndex],
            output: output.data[leftBatch],
            outputValidity: validOutput.data[leftBatch],
            first,
            initialize: rangeIndex === 0
          });
        }
      }
    }
    return {plan: {name, format, nullable: true}, values};
  });
  const table = createGPUQueryDerivedTable<Left, Left>(context.table, columns, outputs);
  return {table, validity, dictionaries, destroy: () => table.destroy()};
}

/** Writes one matching right chunk, comparing unsigned source IDs without wraparound. */
function addGPUJoinProjectionPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    rows: GraphDataView<'uint32'>;
    matches: GraphDataView<'uint32'>;
    input: GraphDataView<GPUAnalyticsScalarFormat>;
    inputValidity?: GraphDataView<'uint32'>;
    output: GraphDataView<GPUAnalyticsScalarFormat>;
    outputValidity: GraphDataView<'uint32'>;
    first: number;
    initialize: boolean;
  }
): void {
  const {rows, matches, input, inputValidity, output, outputValidity, first, initialize} = props;
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> rightRows: array<u32>;
@group(0) @binding(1) var<storage, read> found: array<u32>;
@group(0) @binding(2) var<storage, read> rightValues: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValid: array<u32>;
${inputValidity ? '@group(0) @binding(5) var<storage, read> rightValid: array<u32>;' : ''}

@compute @workgroup_size(${LU_ANALYTICS_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getGPUAnalyticsInvocationIndexSource(graph, rows.length)}
  if (index >= ${rows.length}u) { return; }
  ${initialize ? 'outputValues[index] = 0u; outputValid[index] = 0u;' : ''}
  let id = rightRows[${getViewElementOffset(rows)}u + index];
  let relative = id - ${first}u;
  if (found[${getViewElementOffset(matches)}u + index] != 0u &&
      id >= ${first}u && relative < ${input.length}u) {
    outputValues[index] = rightValues[${getViewElementOffset(input)}u + relative];
    outputValid[index] = ${inputValidity ? `rightValid[${getViewElementOffset(inputValidity)}u + relative]` : '1u'};
  }
}`;
  addGPUAnalyticsComputePass(graph, {
    id,
    source,
    resources: [
      {buffer: rows, usage: 'storage-read'},
      {buffer: matches, usage: 'storage-read'},
      {buffer: input, usage: 'storage-read'},
      {buffer: output, usage: 'storage-write'},
      {buffer: outputValidity, usage: 'storage-write'},
      ...(inputValidity ? [{buffer: inputValidity, usage: 'storage-read' as const}] : [])
    ],
    bindings: {
      rightRows: rows,
      found: matches,
      rightValues: input,
      outputValues: output,
      outputValid: outputValidity,
      ...(inputValidity ? {rightValid: inputValidity} : {})
    },
    length: rows.length
  });
}
