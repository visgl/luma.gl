// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  createTransientView,
  type GraphBufferHandle,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPULZ4RawDecompressor} from '../compression/gpu-lz4-raw-decompressor';
import {GPUSnappyDecompressor} from '../compression/gpu-snappy-decompressor';
import {GPUParquetBitPackedDecoder} from './gpu-parquet-bit-packed-decoder';
import {GPUParquetByteArrayDictionaryDecoder} from './gpu-parquet-byte-array-dictionary-decoder';
import {GPUParquetByteStreamSplitDecoder} from './gpu-parquet-byte-stream-split-decoder';
import {GPUParquetDeltaBinaryPackedDecoder} from './gpu-parquet-delta-binary-packed-decoder';
import {GPUParquetDeltaBinaryPackedInt64Decoder} from './gpu-parquet-delta-binary-packed-int64-decoder';
import {GPUParquetDeltaLengthByteArrayDecoder} from './gpu-parquet-delta-length-byte-array-decoder';
import {GPUParquetPlainBooleanDecoder} from './gpu-parquet-plain-boolean-decoder';
import {GPUParquetPlainByteArrayDecoder} from './gpu-parquet-plain-byte-array-decoder';
import {GPUParquetRleBitPackedDecoder} from './gpu-parquet-rle-bit-packed-decoder';
import {GPUParquetRleDictionaryDecoder} from './gpu-parquet-rle-dictionary-decoder';
import type {
  CPUParquetPageFallbackPlan,
  GPUParquetCompressionPlan,
  GPUParquetDecodedPagePlan,
  GPUParquetDictionaryPlan,
  GPUParquetEncodedPageBatchPlan,
  GPUParquetLevelPlan,
  GPUParquetUploadSection,
  GPUParquetValuePlan
} from './parquet-encoded-page-batch';

/** Decoded fixed-width or boolean values for one GPU page. */
export type GPUParquetFixedPageValues = Readonly<{
  layout: 'packed-bytes' | 'uint32';
  values: GraphDataView<'uint32'>;
  valueCount: number;
  byteLength: number;
}>;

/** Split-word INT64 values produced by the portable uint64 decoder. */
export type GPUParquetInt64PageValues = Readonly<{
  layout: 'split-uint64';
  low: GraphDataView<'uint32'>;
  high: GraphDataView<'uint32'>;
  valueCount: number;
  byteLength: number;
}>;

/** Packed bytes plus row metadata for one variable-width page. */
export type GPUParquetByteArrayPageValues = Readonly<{
  layout: 'byte-array';
  values: GraphDataView<'uint32'>;
  lengths: GraphDataView<'uint32'>;
  offsets: GraphDataView<'uint32'>;
  valueCount: number;
  byteLength: number;
}>;

/** Graph views produced for one automatically decoded page. */
export type GPUParquetDecodedPage = Readonly<{
  mode: 'gpu';
  plan: GPUParquetDecodedPagePlan;
  values: GPUParquetFixedPageValues | GPUParquetInt64PageValues | GPUParquetByteArrayPageValues;
  repetitionLevels?: GraphDataView<'uint32'>;
  definitionLevels?: GraphDataView<'uint32'>;
}>;

/** Mixed graph result preserving explicit CPU fallback pages in source order. */
export type GPUParquetEncodedPageBatch = Readonly<{
  inputBuffer: Buffer;
  pages: readonly (GPUParquetDecodedPage | CPUParquetPageFallbackPlan)[];
}>;

type GPUParquetGraphDictionary = Readonly<{
  plan: GPUParquetDictionaryPlan;
  values: GraphDataView<'uint32'>;
  lengths?: GraphDataView<'uint32'>;
  offsets?: GraphDataView<'uint32'>;
}>;

/** Uploads the aligned bytes and descriptor arrays owned by one page-batch plan. */
export function createGPUParquetEncodedPageBatchInputBuffer(
  device: Device,
  plan: GPUParquetEncodedPageBatchPlan
): Buffer {
  const data = plan.uploadData.byteLength > 0 ? plan.uploadData : new Uint32Array(1);
  return device.createBuffer({
    id: 'gpu-parquet-page-batch-input',
    data,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
}

/**
 * Adds every accepted page in a loaders.gl batch to one command graph.
 *
 * The caller owns `inputBuffer` and may reuse the immutable upload across compiled executions.
 * Returned transient views are intended for downstream graph operations; pages that require CPU
 * handling remain in the result unchanged so mixed batches cannot silently drop data.
 */
export function addGPUParquetEncodedPageBatchToGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  plan: GPUParquetEncodedPageBatchPlan,
  inputBuffer: Buffer
): GPUParquetEncodedPageBatch {
  const inputHandle = graph.importBuffer(
    {
      id: `${graph.id}-parquet-page-batch-input`,
      byteLength: Math.max(plan.uploadData.byteLength, 4),
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    },
    inputBuffer
  );
  const dictionaries = new Map<GPUParquetDictionaryPlan, GPUParquetGraphDictionary>();
  for (let columnIndex = 0; columnIndex < plan.dictionaries.length; columnIndex++) {
    const dictionaryPlan = plan.dictionaries[columnIndex];
    if (dictionaryPlan) {
      dictionaries.set(
        dictionaryPlan,
        addDictionaryToGraph(graph, inputHandle, dictionaryPlan, columnIndex)
      );
    }
  }
  const pages = plan.pages.map(page =>
    page.mode === 'cpu-fallback' ? page : addPageToGraph(graph, inputHandle, page, dictionaries)
  );
  return Object.freeze({inputBuffer, pages: Object.freeze(pages)});
}

function addPageToGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  inputHandle: GraphBufferHandle,
  plan: GPUParquetDecodedPagePlan,
  dictionaries: ReadonlyMap<GPUParquetDictionaryPlan, GPUParquetGraphDictionary>
): GPUParquetDecodedPage {
  const id = `parquet-${plan.columnIndex}-${plan.pageOrdinal}`;
  const encodedValues = createUploadView(graph, inputHandle, plan.encodedValues);
  const valueInput = plan.compression
    ? addDecompressionToGraph(graph, inputHandle, plan.compression, id)
    : encodedValues;
  const repetitionLevels = plan.repetitionLevels
    ? addLevelToGraph(graph, inputHandle, plan.repetitionLevels, `${id}-repetition`)
    : undefined;
  const definitionLevels = plan.definitionLevels
    ? addLevelToGraph(graph, inputHandle, plan.definitionLevels, `${id}-definition`)
    : undefined;
  const values = addValuesToGraph(graph, inputHandle, valueInput, plan.values, id, dictionaries);
  return Object.freeze({mode: 'gpu' as const, plan, values, repetitionLevels, definitionLevels});
}

function addDictionaryToGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  inputHandle: GraphBufferHandle,
  plan: GPUParquetDictionaryPlan,
  columnIndex: number
): GPUParquetGraphDictionary {
  const id = `parquet-${columnIndex}-dictionary`;
  const encodedValues = createUploadView(graph, inputHandle, plan.encodedValues);
  const input =
    plan.kind === 'fixed' && plan.compression
      ? addDecompressionToGraph(graph, inputHandle, plan.compression, id)
      : encodedValues;
  if (plan.kind === 'fixed') {
    return Object.freeze({plan, values: input});
  }
  const values = createTransientPackedBytes(graph, `${id}-values`, plan.decodedByteLength);
  const lengths = createUploadView(graph, inputHandle, plan.valueLengths);
  const offsets = createUploadView(graph, inputHandle, plan.valueOffsets);
  new GPUParquetPlainByteArrayDecoder({
    id,
    input,
    sourceOffsets: createUploadView(graph, inputHandle, plan.sourceOffsets),
    valueLengths: lengths,
    valueOffsets: offsets,
    output: values,
    encodedByteLength: plan.encodedValues.byteLength,
    outputByteLength: plan.decodedByteLength
  }).addToGraph(graph);
  return Object.freeze({plan, values, lengths, offsets});
}

function addDecompressionToGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  inputHandle: GraphBufferHandle,
  plan: GPUParquetCompressionPlan,
  id: string
): GraphDataView<'uint32'> {
  const input = createUploadView(graph, inputHandle, plan.input);
  const descriptors = createUploadView(graph, inputHandle, plan.descriptors);
  const output = createTransientPackedBytes(
    graph,
    `${id}-${plan.codec.toLowerCase()}-output`,
    plan.outputByteLength,
    Buffer.STORAGE | Buffer.COPY_SRC
  );
  if (plan.codec === 'SNAPPY') {
    new GPUSnappyDecompressor({
      id: `${id}-snappy`,
      input,
      descriptors,
      output,
      compressedByteLength: plan.input.byteLength,
      outputByteLength: plan.outputByteLength,
      descriptorCount: plan.descriptorCount
    }).addToGraph(graph);
  } else {
    new GPULZ4RawDecompressor({
      id: `${id}-lz4-raw`,
      input,
      descriptors,
      output,
      compressedByteLength: plan.input.byteLength,
      outputByteLength: plan.outputByteLength,
      descriptorCount: plan.descriptorCount
    }).addToGraph(graph);
  }
  return output;
}

function addLevelToGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  inputHandle: GraphBufferHandle,
  plan: GPUParquetLevelPlan,
  id: string
): GraphDataView<'uint32'> {
  const input = createUploadView(graph, inputHandle, plan.input);
  const output = createTransientResultView(graph, `${id}-output`, plan.valueCount);
  if (plan.encoding === 'RLE') {
    const descriptors = createUploadView(graph, inputHandle, plan.runDescriptors!);
    new GPUParquetRleBitPackedDecoder({
      id,
      input,
      runDescriptors: descriptors,
      output,
      encodedByteLength: plan.input.byteLength,
      valueCount: plan.valueCount,
      runCount: plan.runPlan!.runCount,
      bitWidth: plan.bitWidth
    }).addToGraph(graph);
  } else {
    new GPUParquetBitPackedDecoder({
      id,
      input,
      output,
      encodedByteLength: plan.input.byteLength,
      valueCount: plan.valueCount,
      bitWidth: plan.bitWidth
    }).addToGraph(graph);
  }
  return output;
}

function addValuesToGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  inputHandle: GraphBufferHandle,
  input: GraphDataView<'uint32'>,
  plan: GPUParquetValuePlan,
  id: string,
  dictionaries: ReadonlyMap<GPUParquetDictionaryPlan, GPUParquetGraphDictionary>
): GPUParquetFixedPageValues | GPUParquetInt64PageValues | GPUParquetByteArrayPageValues {
  switch (plan.kind) {
    case 'plain-fixed':
      return Object.freeze({
        layout: 'packed-bytes' as const,
        values: input,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    case 'byte-stream-split': {
      const values = createTransientPackedBytes(
        graph,
        `${id}-values`,
        plan.decodedByteLength,
        Buffer.STORAGE | Buffer.COPY_SRC
      );
      new GPUParquetByteStreamSplitDecoder({
        id: `${id}-byte-stream-split`,
        input,
        output: values,
        valueCount: plan.valueCount,
        byteWidth: plan.byteWidth
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'packed-bytes' as const,
        values,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
    case 'plain-boolean': {
      const values = createTransientResultView(graph, `${id}-values`, plan.valueCount);
      new GPUParquetPlainBooleanDecoder({
        id: `${id}-plain-boolean`,
        input,
        output: values,
        valueCount: plan.valueCount
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'uint32' as const,
        values,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
    case 'plain-byte-array': {
      const values = createTransientPackedBytes(
        graph,
        `${id}-values`,
        plan.decodedByteLength,
        Buffer.STORAGE | Buffer.COPY_SRC
      );
      const lengths = createUploadView(graph, inputHandle, plan.valueLengths);
      const offsets = createUploadView(graph, inputHandle, plan.valueOffsets);
      new GPUParquetPlainByteArrayDecoder({
        id: `${id}-plain-byte-array`,
        input,
        sourceOffsets: createUploadView(graph, inputHandle, plan.sourceOffsets),
        valueLengths: lengths,
        valueOffsets: offsets,
        output: values,
        encodedByteLength: input.length * 4,
        outputByteLength: plan.decodedByteLength
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'byte-array' as const,
        values,
        lengths,
        offsets,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
    case 'delta-binary-packed-int32': {
      const values = createTransientResultView(graph, `${id}-values`, plan.valueCount);
      new GPUParquetDeltaBinaryPackedDecoder({
        id: `${id}-delta-int32`,
        input,
        miniBlockDescriptors: createUploadView(graph, inputHandle, plan.miniBlockDescriptors),
        output: values,
        encodedByteLength: input.length * 4,
        valueCount: plan.valueCount,
        descriptorCount: plan.deltaPlan.descriptorCount,
        firstValue: plan.deltaPlan.firstValue
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'uint32' as const,
        values,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
    case 'delta-binary-packed-int64': {
      const low = createTransientResultView(graph, `${id}-values-low`, plan.valueCount);
      const high = createTransientResultView(graph, `${id}-values-high`, plan.valueCount);
      new GPUParquetDeltaBinaryPackedInt64Decoder({
        id: `${id}-delta-int64`,
        input,
        miniBlockDescriptors: createUploadView(graph, inputHandle, plan.miniBlockDescriptors),
        outputLow: low,
        outputHigh: high,
        encodedByteLength: input.length * 4,
        valueCount: plan.valueCount,
        descriptorCount: plan.deltaPlan.descriptorCount,
        firstValueLow: plan.deltaPlan.firstValueLow,
        firstValueHigh: plan.deltaPlan.firstValueHigh
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'split-uint64' as const,
        low,
        high,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
    case 'delta-length-byte-array': {
      const lengths = createTransientResultView(graph, `${id}-lengths`, plan.valueCount);
      const offsets = createTransientResultView(graph, `${id}-offsets`, plan.valueCount);
      new GPUParquetDeltaLengthByteArrayDecoder({
        id: `${id}-delta-length-byte-array`,
        input,
        miniBlockDescriptors: createUploadView(graph, inputHandle, plan.miniBlockDescriptors),
        lengths,
        offsets,
        encodedByteLength: input.length * 4,
        valueCount: plan.valueCount,
        descriptorCount: plan.deltaPlan.lengthPlan.descriptorCount,
        firstValue: plan.deltaPlan.lengthPlan.firstValue
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'byte-array' as const,
        values: createUploadView(graph, inputHandle, plan.payload),
        lengths,
        offsets,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
    case 'dictionary-fixed': {
      const dictionary = dictionaries.get(plan.dictionary);
      if (!dictionary || dictionary.plan.kind !== 'fixed') {
        throw new Error(`${id} fixed dictionary graph resource is missing`);
      }
      const values = createTransientPackedBytes(
        graph,
        `${id}-values`,
        plan.decodedByteLength,
        Buffer.STORAGE | Buffer.COPY_SRC
      );
      new GPUParquetRleDictionaryDecoder({
        id: `${id}-dictionary`,
        input,
        runDescriptors: createUploadView(graph, inputHandle, plan.runDescriptors),
        dictionary: dictionary.values,
        output: values,
        encodedByteLength: input.length * 4,
        valueCount: plan.valueCount,
        runCount: plan.indicesPlan.runPlan.runCount,
        bitWidth: plan.indicesPlan.bitWidth,
        dictionaryValueCount: dictionary.plan.valueCount,
        byteWidth: dictionary.plan.byteWidth
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'packed-bytes' as const,
        values,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
    case 'dictionary-byte-array': {
      const dictionary = dictionaries.get(plan.dictionary);
      if (
        !dictionary ||
        dictionary.plan.kind !== 'byte-array' ||
        !dictionary.lengths ||
        !dictionary.offsets
      ) {
        throw new Error(`${id} byte-array dictionary graph resource is missing`);
      }
      const indices = createTransientView(graph, `${id}-indices`, 'uint32', plan.valueCount);
      new GPUParquetRleBitPackedDecoder({
        id: `${id}-dictionary-indices`,
        input,
        runDescriptors: createUploadView(graph, inputHandle, plan.runDescriptors),
        output: indices,
        encodedByteLength: input.length * 4,
        valueCount: plan.valueCount,
        runCount: plan.indicesPlan.runPlan.runCount,
        bitWidth: plan.indicesPlan.bitWidth
      }).addToGraph(graph);
      const values = createTransientPackedBytes(
        graph,
        `${id}-values`,
        plan.decodedByteLength,
        Buffer.STORAGE | Buffer.COPY_SRC
      );
      const lengths = createTransientResultView(graph, `${id}-lengths`, plan.valueCount);
      const offsets = createTransientResultView(graph, `${id}-offsets`, plan.valueCount);
      new GPUParquetByteArrayDictionaryDecoder({
        id: `${id}-dictionary`,
        dictionary: dictionary.values,
        dictionaryLengths: dictionary.lengths,
        dictionaryOffsets: dictionary.offsets,
        indices,
        outputLengths: lengths,
        outputOffsets: offsets,
        output: values,
        dictionaryByteLength: dictionary.plan.decodedByteLength,
        outputByteCapacity: plan.decodedByteLength
      }).addToGraph(graph);
      return Object.freeze({
        layout: 'byte-array' as const,
        values,
        lengths,
        offsets,
        valueCount: plan.valueCount,
        byteLength: plan.decodedByteLength
      });
    }
  }
}

function createUploadView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  inputHandle: GraphBufferHandle,
  section: GPUParquetUploadSection
): GraphDataView<'uint32'> {
  return graph.createDataView(inputHandle, {
    format: 'uint32',
    length: Math.ceil(section.byteLength / Uint32Array.BYTES_PER_ELEMENT),
    byteOffset: section.byteOffset
  });
}

function createTransientPackedBytes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  byteLength: number,
  usage = Buffer.STORAGE
): GraphDataView<'uint32'> {
  return createTransientView(
    graph,
    id,
    'uint32',
    Math.ceil(byteLength / Uint32Array.BYTES_PER_ELEMENT),
    usage
  );
}

function createTransientResultView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  length: number
): GraphDataView<'uint32'> {
  return createTransientView(graph, id, 'uint32', length, Buffer.STORAGE | Buffer.COPY_SRC);
}
