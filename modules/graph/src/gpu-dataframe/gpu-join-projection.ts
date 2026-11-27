// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {Buffer} from '@luma.gl/core';
import {
  getGPUVectorWGSLLayout,
  type GPUVector,
  type GPUVectorWGSLFormat
} from '@luma.gl/graph/gpu-data';
import type {GPUTypeMap} from '@luma.gl/graph/gpu-tables';
import {
  createTransientView,
  getViewElementOffset,
  type GPUCommandGraph,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/graph/gpu-core';
import {
  addGPUAnalyticsComputePass,
  getGPUAnalyticsInvocationIndexSource,
  LU_ANALYTICS_WORKGROUP_SIZE,
  validateGPUAnalyticsSource
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
  ownedVectors: GPUVector[],
  maxScratchBytes: number
) {
  const {graph} = context;
  const sources = [...new Set(rightColumns.map(column => column.source))];
  validateGPUAnalyticsSource(
    right,
    sources,
    vector => getGPUVectorWGSLLayout(vector.format as GPUVectorWGSLFormat).packedByteStride
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

  const reusePackedChunks = lengths.filter(length => length > 0).length > 1;
  let remainingScratchBytes = maxScratchBytes;
  const projectedSources = new Map(
    sources.map((source, columnIndex) => {
      const field = right.schema.fields.find(candidate => candidate.name === source);
      const format = field?.format as GPUVectorWGSLFormat | undefined;
      if (!format || !/^(float32|sint32|uint32)(x[234])?$/.test(format)) {
        throw new Error(
          `GPUDataFrame right join projection requires a packed 32-bit numeric column: ${source}`
        );
      }
      const id = `${context.queryId}-join-projection-${columnIndex}`;
      const values = createGPUQueryOutputVector(graph.device, id, lengths, format, false, true);
      ownedVectors.push(values);
      const valid = createGPUQueryOutputVector(graph.device, id + '-validity', lengths, 'uint32');
      ownedVectors.push(valid);
      const sourceKey = source as keyof Right & string;
      if (ranges.length && lengths.some(length => length > 0)) {
        const input = graph.importGPUVector(id + '-input', right.table.gpuVectors[source]);
        const inputValidity = right.validity[sourceKey];
        const validInput =
          inputValidity && graph.importGPUVector(id + '-input-validity', inputValidity);
        const output = graph.importGPUVector(id + '-output', values);
        const validOutput = graph.importGPUVector(id + '-output-validity', valid);
        const chunks = sortedRanges.map(({batchIndex, first}) => ({
          first,
          input: input.data[batchIndex] as GraphDataView<GPUVectorWGSLFormat>,
          inputValidity: validInput?.data[batchIndex]
        }));
        const projection = reusePackedChunks
          ? stageGPUJoinProjectionRanges(graph, id, format, chunks, remainingScratchBytes)
          : {chunks, scratchBytes: 0};
        remainingScratchBytes -= projection.scratchBytes;
        for (const [leftBatch, rows] of matchedRows.data.entries()) {
          if (!rows.length) continue;
          for (const [chunkIndex, chunk] of projection.chunks.entries()) {
            addGPUJoinProjectionPass(graph, `${id}-${leftBatch}-${chunkIndex}`, {
              ...chunk,
              rows,
              matches: matches.data[leftBatch],
              output: output.data[leftBatch],
              outputValidity: validOutput.data[leftBatch],
              initialize: chunkIndex === 0
            });
          }
        }
      }
      return [source, {format, values, valid}] as const;
    })
  );
  const outputs = rightColumns.map(({name, source}) => {
    const {format, values, valid} = projectedSources.get(source)!;
    const nameKey = name as keyof Left & string;
    validity[nameKey] = valid;
    const dictionary = right.dictionaries[source as keyof Right & string];
    if (dictionary) {
      dictionaries[nameKey] = dictionary;
    } else {
      delete dictionaries[nameKey];
    }
    return {plan: {name, format, nullable: true}, values};
  });
  const table = createGPUQueryDerivedTable<Left, Left>(context.table, columns, outputs);
  return {table, validity, dictionaries, destroy: () => table.destroy()};
}

/** A contiguous right-side payload range available to the projection. */
type GPUJoinProjectionChunk = {
  /** Source-row ID of the first value in the range. */
  first: number;
  /** Packed numeric payload for every row in the range. */
  input: GraphDataView<GPUVectorWGSLFormat>;
  /** Optional validity words aligned one-to-one with the payload rows. */
  inputValidity?: GraphDataView<'uint32'>;
};

/** Stages consecutive copyable chunks within both the device binding limit and remaining budget. */
function stageGPUJoinProjectionRanges(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  format: GPUVectorWGSLFormat,
  chunks: GPUJoinProjectionChunk[],
  maxScratchBytes: number
): {chunks: GPUJoinProjectionChunk[]; scratchBytes: number} {
  const projectionChunks: GPUJoinProjectionChunk[] = [];
  const {maxBufferSize, maxStorageBufferBindingSize} = graph.device.limits;
  const rowBytes = getGPUVectorWGSLLayout(format).packedByteStride;
  const maxBindingRows = Math.floor(
    Math.min(maxBufferSize, maxStorageBufferBindingSize) / rowBytes
  );
  let scratchBytes = 0;
  for (let start = 0; start < chunks.length; ) {
    const firstChunk = chunks[start];
    const bytesPerRow = rowBytes + (firstChunk.inputValidity ? Uint32Array.BYTES_PER_ELEMENT : 0);
    const maxRows = Math.min(
      maxBindingRows,
      Math.floor((maxScratchBytes - scratchBytes) / bytesPerRow)
    );
    let end = start;
    let length = 0;
    while (end < chunks.length) {
      const chunk = chunks[end];
      if (
        chunk.first !== firstChunk.first + length ||
        length + chunk.input.length > maxRows ||
        !(chunk.input.buffer.usage & Buffer.COPY_SRC) ||
        (chunk.inputValidity && !(chunk.inputValidity.buffer.usage & Buffer.COPY_SRC))
      ) {
        break;
      }
      length += chunk.input.length;
      end++;
    }
    if (end - start < 2) {
      projectionChunks.push(firstChunk);
      start++;
      continue;
    }
    projectionChunks.push(
      packGPUJoinProjectionRange(
        graph,
        `${id}-range-${start}`,
        format,
        chunks.slice(start, end),
        length
      )
    );
    scratchBytes += length * bytesPerRow;
    start = end;
  }
  return {chunks: projectionChunks, scratchBytes};
}

/** Copies one contiguous right row-ID range into graph scratch for reuse by every left batch. */
function packGPUJoinProjectionRange(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  format: GPUVectorWGSLFormat,
  chunks: GPUJoinProjectionChunk[],
  length: number
): GPUJoinProjectionChunk {
  const first = chunks[0].first;
  const usage = Buffer.STORAGE | Buffer.COPY_DST;
  const input = createTransientView(graph, `${id}-packed-values`, format, length, usage);
  const inputValidity = chunks[0].inputValidity
    ? createTransientView(graph, `${id}-packed-validity`, 'uint32', length, usage)
    : undefined;
  for (const [index, chunk] of chunks.entries()) {
    const offset = chunk.first - first;
    const copies = [
      {
        source: chunk.input,
        target: graph.createDataView(input.buffer, {
          format,
          length: chunk.input.length,
          byteOffset: offset * input.rowByteLength
        })
      },
      ...(inputValidity && chunk.inputValidity
        ? [
            {
              source: chunk.inputValidity,
              target: graph.createDataView(inputValidity.buffer, {
                format: 'uint32',
                length: chunk.input.length,
                byteOffset: offset * Uint32Array.BYTES_PER_ELEMENT
              })
            }
          ]
        : [])
    ];
    graph.addCopyPass({
      id: `${id}-pack-${index}`,
      resources: copies.flatMap(({source, target}) => [
        {buffer: source, usage: 'copy-source'},
        {buffer: target, usage: 'copy-destination'}
      ]),
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) => {
          for (const {source, target} of copies) {
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(source),
              sourceOffset: source.byteOffset,
              destinationBuffer: getBuffer(target),
              destinationOffset: target.byteOffset,
              size: source.length * source.rowByteLength
            });
          }
        }
      })
    });
  }
  return {first, input, inputValidity};
}

/** Writes one matching right chunk, comparing unsigned source IDs without wraparound. */
function addGPUJoinProjectionPass(
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
  id: string,
  props: {
    rows: GraphDataView<'uint32'>;
    matches: GraphDataView<'uint32'>;
    input: GraphDataView<GPUVectorWGSLFormat>;
    inputValidity?: GraphDataView<'uint32'>;
    output: GraphDataView<GPUVectorWGSLFormat>;
    outputValidity: GraphDataView<'uint32'>;
    first: number;
    initialize: boolean;
  }
): void {
  const {rows, matches, input, inputValidity, output, outputValidity, first, initialize} = props;
  const components = input.rowByteLength / Uint32Array.BYTES_PER_ELEMENT;
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
  let outputStart = index * ${components}u;
  ${
    initialize
      ? `for (var component = 0u; component < ${components}u; component++) {
    outputValues[outputStart + component] = 0u;
  }
  outputValid[index] = 0u;`
      : ''
  }
  let id = rightRows[${getViewElementOffset(rows)}u + index];
  let relative = id - ${first}u;
  if (found[${getViewElementOffset(matches)}u + index] != 0u &&
      id >= ${first}u && relative < ${input.length}u) {
    let inputStart = ${getViewElementOffset(input)}u + relative * ${components}u;
    for (var component = 0u; component < ${components}u; component++) {
      outputValues[outputStart + component] = rightValues[inputStart + component];
    }
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
