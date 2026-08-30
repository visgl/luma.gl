// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseLZ4RawDecompressionPlan} from '../compression/lz4-raw-plan';
import {parseSnappyDecompressionPlan} from '../compression/snappy-plan';
import {
  getParquetPhysicalTypeByteWidth,
  type ParquetPhysicalType
} from './parquet-column-decode-plan';
import {
  parseParquetDeltaBinaryPackedPlan,
  type ParquetDeltaBinaryPackedPlan
} from './parquet-delta-binary-packed';
import {
  parseParquetDeltaBinaryPackedInt64Plan,
  type ParquetDeltaBinaryPackedInt64Plan
} from './parquet-delta-binary-packed-int64';
import {
  parseParquetDeltaLengthByteArrayPlan,
  type ParquetDeltaLengthByteArrayPlan
} from './parquet-delta-length-byte-array';
import {
  parseParquetPlainByteArrayPlan,
  type ParquetPlainByteArrayPlan
} from './parquet-plain-byte-array';
import {
  parseParquetBitPackedRunPlan,
  parseParquetDictionaryIndicesPlan,
  type ParquetBitPackedPlan,
  type ParquetDictionaryIndicesPlan
} from './parquet-rle-framing';
import {
  parseParquetRleBitPackedRunPlan,
  type ParquetRleBitPackedRunPlan
} from './parquet-rle-bit-packed';

/** Structural view of loaders.gl's `ParquetEncodedPageSection` alpha.4 contract. */
export type LoadersGLParquetEncodedPageSection = Readonly<{
  byteOffset: number;
  byteLength: number;
}>;

/** Structural view of one loaders.gl deferred Parquet page. */
export type LoadersGLParquetEncodedPage = Readonly<{
  type: 'dictionary' | 'data-v1' | 'data-v2';
  pageOrdinal: number;
  encoding: string;
  repetitionLevelEncoding?: string;
  definitionLevelEncoding?: string;
  compression: string;
  compressionState: 'compressed' | 'decompressed';
  valueCount: number;
  nonNullValueCount?: number;
  data: Uint8Array;
  repetitionLevels?: LoadersGLParquetEncodedPageSection;
  definitionLevels?: LoadersGLParquetEncodedPageSection;
  values?: LoadersGLParquetEncodedPageSection;
  compressedByteLength: number;
  uncompressedByteLength: number;
}>;

/** Structural view of one loaders.gl deferred Parquet column chunk. */
export type LoadersGLParquetEncodedColumnChunk = Readonly<{
  path: readonly string[];
  physicalType: string;
  typeLength?: number;
  maxRepetitionLevel: number;
  maxDefinitionLevel: number;
  compression: string;
  valueCount: number;
  dictionary?: LoadersGLParquetEncodedPage;
  pages: readonly LoadersGLParquetEncodedPage[];
}>;

/**
 * Dependency-free structural input accepted from loaders.gl 5.0.0-alpha.4 `readPages()`.
 *
 * Keeping this interface local prevents users of unrelated gpu-parse operations from needing to
 * install loaders.gl. Type-level conformance tests pass the official loaders.gl type directly.
 */
export type LoadersGLParquetEncodedPageBatch = Readonly<{
  shape: 'parquet-encoded-pages';
  rowGroup: unknown;
  projectedColumns: readonly string[];
  filterColumns: readonly string[];
  columns: readonly LoadersGLParquetEncodedColumnChunk[];
  residualFilter?: unknown;
}>;

type ParquetEncodedPageSection = LoadersGLParquetEncodedPageSection;
type ParquetEncodedPage = LoadersGLParquetEncodedPage;
type ParquetEncodedColumnChunk = LoadersGLParquetEncodedColumnChunk;
type ParquetEncodedPageBatch = LoadersGLParquetEncodedPageBatch;

/** Four-byte-aligned byte range in one batched GPU upload. */
export type GPUParquetUploadSection = Readonly<{
  byteOffset: number;
  byteLength: number;
}>;

/** Compression work that can be performed before value decoding without a readback. */
export type GPUParquetCompressionPlan = Readonly<{
  codec: 'SNAPPY' | 'LZ4_RAW';
  input: GPUParquetUploadSection;
  descriptors: GPUParquetUploadSection;
  descriptorCount: number;
  outputByteLength: number;
}>;

/** RLE or legacy BIT_PACKED work for one definition- or repetition-level stream. */
export type GPUParquetLevelPlan = Readonly<{
  encoding: 'RLE' | 'BIT_PACKED';
  bitWidth: number;
  valueCount: number;
  input: GPUParquetUploadSection;
  runPlan?: ParquetRleBitPackedRunPlan;
  runDescriptors?: GPUParquetUploadSection;
  bitPackedPlan?: ParquetBitPackedPlan;
}>;

/** One column-chunk dictionary planned once and reused by all dictionary data pages. */
export type GPUParquetDictionaryPlan =
  | Readonly<{
      kind: 'fixed';
      valueCount: number;
      byteWidth: number;
      decodedByteLength: number;
      encodedValues: GPUParquetUploadSection;
      compression?: GPUParquetCompressionPlan;
    }>
  | Readonly<{
      kind: 'byte-array';
      valueCount: number;
      decodedByteLength: number;
      encodedValues: GPUParquetUploadSection;
      plainPlan: ParquetPlainByteArrayPlan;
      sourceOffsets: GPUParquetUploadSection;
      valueLengths: GPUParquetUploadSection;
      valueOffsets: GPUParquetUploadSection;
    }>;

/** Value work whose output size and control descriptors are known before GPU execution. */
export type GPUParquetValuePlan =
  | Readonly<{
      kind: 'plain-fixed' | 'byte-stream-split';
      valueCount: number;
      byteWidth: number;
      decodedByteLength: number;
    }>
  | Readonly<{
      kind: 'plain-boolean';
      valueCount: number;
      decodedByteLength: number;
    }>
  | Readonly<{
      kind: 'plain-byte-array';
      valueCount: number;
      decodedByteLength: number;
      plainPlan: ParquetPlainByteArrayPlan;
      sourceOffsets: GPUParquetUploadSection;
      valueLengths: GPUParquetUploadSection;
      valueOffsets: GPUParquetUploadSection;
    }>
  | Readonly<{
      kind: 'delta-binary-packed-int32';
      valueCount: number;
      decodedByteLength: number;
      deltaPlan: ParquetDeltaBinaryPackedPlan;
      miniBlockDescriptors: GPUParquetUploadSection;
    }>
  | Readonly<{
      kind: 'delta-binary-packed-int64';
      valueCount: number;
      decodedByteLength: number;
      deltaPlan: ParquetDeltaBinaryPackedInt64Plan;
      miniBlockDescriptors: GPUParquetUploadSection;
    }>
  | Readonly<{
      kind: 'delta-length-byte-array';
      valueCount: number;
      decodedByteLength: number;
      deltaPlan: ParquetDeltaLengthByteArrayPlan;
      miniBlockDescriptors: GPUParquetUploadSection;
      payload: GPUParquetUploadSection;
    }>
  | Readonly<{
      kind: 'dictionary-fixed' | 'dictionary-byte-array';
      valueCount: number;
      decodedByteLength: number;
      dictionary: GPUParquetDictionaryPlan;
      indicesPlan: ParquetDictionaryIndicesPlan;
      runDescriptors: GPUParquetUploadSection;
    }>;

/** One page accepted by the automatic GPU adapter. */
export type GPUParquetDecodedPagePlan = Readonly<{
  mode: 'gpu';
  columnIndex: number;
  pageIndex: number;
  path: readonly string[];
  pageType: 'data-v1' | 'data-v2';
  pageOrdinal: number;
  physicalType: ParquetPhysicalType;
  valueCount: number;
  physicalValueCount: number;
  compression?: GPUParquetCompressionPlan;
  encodedValues: GPUParquetUploadSection;
  values: GPUParquetValuePlan;
  repetitionLevels?: GPUParquetLevelPlan;
  definitionLevels?: GPUParquetLevelPlan;
}>;

/** One page deliberately retained for a CPU decoder. */
export type CPUParquetPageFallbackPlan = Readonly<{
  mode: 'cpu-fallback';
  columnIndex: number;
  pageIndex: number;
  path: readonly string[];
  pageOrdinal: number;
  reason:
    | 'below-gpu-threshold'
    | 'unsupported-compression'
    | 'compressed-v1-level-framing'
    | 'compressed-control-stream'
    | 'unsupported-encoding'
    | 'unsupported-physical-type'
    | 'missing-dictionary'
    | 'variable-dictionary-output';
  detail: string;
  page: ParquetEncodedPage;
}>;

/** Mixed GPU/CPU plan for one loaders.gl encoded-page batch. */
export type GPUParquetEncodedPageBatchPlan = Readonly<{
  shape: 'gpu-parquet-page-batch-plan';
  source: ParquetEncodedPageBatch;
  uploadData: Uint8Array;
  dictionaries: readonly (GPUParquetDictionaryPlan | undefined)[];
  pages: readonly (GPUParquetDecodedPagePlan | CPUParquetPageFallbackPlan)[];
  gpuPageCount: number;
  cpuFallbackPageCount: number;
}>;

/** Policy for mapping loaders.gl deferred pages to GPU work. */
export type GPUParquetEncodedPageBatchPlanOptions = Readonly<{
  /** Minimum encoded value bytes for GPU execution. Defaults to zero after explicit deferral. */
  minimumGPUByteLength?: number;
  /** Compression codecs retained by loaders.gl and accepted by this adapter. */
  compressionCodecs?: readonly ('SNAPPY' | 'LZ4_RAW')[];
  /** Throws instead of returning a mixed plan when any page needs CPU work. */
  requireGPU?: boolean;
}>;

/**
 * Validates and batches a loaders.gl `ParquetSource.readPages()` result.
 *
 * Page and descriptor slices are copied into one four-byte-aligned upload so that every operation
 * can bind packed `uint32` views without creating a GPU buffer per page. Unsupported pages remain
 * in the returned plan as explicit CPU fallbacks. This makes mixed row groups safe and observable.
 */
export function planGPUParquetEncodedPageBatch(
  batch: ParquetEncodedPageBatch,
  options: GPUParquetEncodedPageBatchPlanOptions = {}
): GPUParquetEncodedPageBatchPlan {
  if (batch.shape !== 'parquet-encoded-pages') {
    throw new Error('Expected a loaders.gl parquet-encoded-pages batch');
  }
  const minimumGPUByteLength = options.minimumGPUByteLength ?? 0;
  validateUint32(minimumGPUByteLength, 'minimumGPUByteLength');
  const compressionCodecs = new Set(options.compressionCodecs ?? ['SNAPPY', 'LZ4_RAW']);
  const upload = new GPUParquetUploadBuilder();
  const pages: (GPUParquetDecodedPagePlan | CPUParquetPageFallbackPlan)[] = [];
  const dictionaries: (GPUParquetDictionaryPlan | undefined)[] = [];
  const dictionaryErrors: (PlannerError | undefined)[] = [];

  for (let columnIndex = 0; columnIndex < batch.columns.length; columnIndex++) {
    const column = batch.columns[columnIndex];
    validateColumn(column);
    dictionaries[columnIndex] = undefined;
    dictionaryErrors[columnIndex] = undefined;
    if (column.dictionary) {
      try {
        dictionaries[columnIndex] = planDictionary(
          column,
          column.dictionary,
          compressionCodecs,
          upload
        );
      } catch (error) {
        const plannerError = error as PlannerError;
        if (!plannerError.reason) throw error;
        dictionaryErrors[columnIndex] = plannerError;
      }
    }
    for (let pageIndex = 0; pageIndex < column.pages.length; pageIndex++) {
      const page = column.pages[pageIndex];
      validatePage(column, page, pageIndex);
      let plan: GPUParquetDecodedPagePlan | CPUParquetPageFallbackPlan;
      try {
        plan = planPage(
          column,
          page,
          columnIndex,
          pageIndex,
          minimumGPUByteLength,
          compressionCodecs,
          upload,
          dictionaries[columnIndex],
          dictionaryErrors[columnIndex]
        );
      } catch (error) {
        const reason = (error as PlannerError)?.reason;
        if (options.requireGPU || !reason) throw error;
        plan = makeFallback(
          column,
          page,
          columnIndex,
          pageIndex,
          reason,
          error instanceof Error ? error.message : String(error)
        );
      }
      if (options.requireGPU && plan.mode === 'cpu-fallback') {
        throw new Error(plan.detail);
      }
      pages.push(plan);
    }
  }

  const gpuPageCount = pages.filter(page => page.mode === 'gpu').length;
  return Object.freeze({
    shape: 'gpu-parquet-page-batch-plan' as const,
    source: batch,
    uploadData: upload.finish(),
    dictionaries: Object.freeze(dictionaries),
    pages: Object.freeze(pages),
    gpuPageCount,
    cpuFallbackPageCount: pages.length - gpuPageCount
  });
}

function planDictionary(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage,
  compressionCodecs: ReadonlySet<string>,
  upload: GPUParquetUploadBuilder
): GPUParquetDictionaryPlan {
  if (page.encoding !== 'PLAIN') {
    throw makePlannerError(
      'unsupported-encoding',
      `Parquet dictionary encoding ${page.encoding} is not supported`
    );
  }
  const physicalType = parsePhysicalType(column.physicalType);
  const encoded =
    page.compressionState === 'compressed'
      ? page.data
      : (getSectionBytes(page, page.values) ?? page.data);
  const encodedValues = upload.add(encoded, 'dictionary values');
  const compression = planCompression(
    column,
    page,
    encoded,
    encodedValues,
    page.uncompressedByteLength,
    compressionCodecs,
    upload
  );
  if (physicalType === 'BYTE_ARRAY') {
    if (compression) {
      throw makePlannerError(
        'compressed-control-stream',
        'Compressed PLAIN BYTE_ARRAY dictionary lengths require CPU decompression before GPU planning'
      );
    }
    const plainPlan = parseParquetPlainByteArrayPlan(encoded, page.valueCount);
    return Object.freeze({
      kind: 'byte-array' as const,
      valueCount: page.valueCount,
      decodedByteLength: plainPlan.outputByteLength,
      encodedValues,
      plainPlan,
      sourceOffsets: upload.add(plainPlan.sourceOffsets, 'dictionary source offsets'),
      valueLengths: upload.add(plainPlan.valueLengths, 'dictionary value lengths'),
      valueOffsets: upload.add(plainPlan.valueOffsets, 'dictionary value offsets')
    });
  }
  const byteWidth = getParquetPhysicalTypeByteWidth(physicalType, column.typeLength);
  if (byteWidth === null) {
    throw makePlannerError(
      'unsupported-physical-type',
      `Parquet ${physicalType} dictionary has no fixed-width GPU layout`
    );
  }
  const decodedByteLength = multiplyUint32(
    page.valueCount,
    byteWidth,
    'dictionary decoded byte length'
  );
  if (!compression && encoded.byteLength !== decodedByteLength) {
    throw new Error(
      `PLAIN dictionary has ${encoded.byteLength} bytes; expected ${decodedByteLength}`
    );
  }
  if (compression && compression.outputByteLength !== decodedByteLength) {
    throw new Error(
      `Compressed dictionary declares ${compression.outputByteLength} decoded bytes; expected ${decodedByteLength}`
    );
  }
  return Object.freeze({
    kind: 'fixed' as const,
    valueCount: page.valueCount,
    byteWidth,
    decodedByteLength,
    encodedValues,
    compression
  });
}

function planPage(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage,
  columnIndex: number,
  pageIndex: number,
  minimumGPUByteLength: number,
  compressionCodecs: ReadonlySet<string>,
  upload: GPUParquetUploadBuilder,
  dictionary: GPUParquetDictionaryPlan | undefined,
  dictionaryError: PlannerError | undefined
): GPUParquetDecodedPagePlan | CPUParquetPageFallbackPlan {
  const physicalType = parsePhysicalType(column.physicalType);
  const sections = getPageSections(column, page);
  if (sections.encodedValues.byteLength < minimumGPUByteLength) {
    return makeFallback(
      column,
      page,
      columnIndex,
      pageIndex,
      'below-gpu-threshold',
      `Parquet page has ${sections.encodedValues.byteLength} encoded value bytes below the ${minimumGPUByteLength} byte GPU threshold`
    );
  }

  const repetitionLevels = planLevel(
    page,
    sections.repetitionLevels,
    page.repetitionLevelEncoding,
    column.maxRepetitionLevel,
    upload,
    `${column.path.join('.')}-${page.pageOrdinal}-repetition`
  );
  const definitionLevels = planLevel(
    page,
    sections.definitionLevels,
    page.definitionLevelEncoding,
    column.maxDefinitionLevel,
    upload,
    `${column.path.join('.')}-${page.pageOrdinal}-definition`
  );
  const physicalValueCount = getPhysicalValueCount(column, page, definitionLevels);
  const encodedValues = upload.add(sections.encodedValues, 'values');
  const compression = planCompression(
    column,
    page,
    sections.encodedValues,
    encodedValues,
    sections.decodedValuesByteLength,
    compressionCodecs,
    upload
  );
  const values = planValues(
    column,
    page,
    sections.encodedValues,
    physicalType,
    physicalValueCount,
    sections.decodedValuesByteLength,
    Boolean(compression),
    upload,
    dictionary,
    dictionaryError
  );

  return Object.freeze({
    mode: 'gpu' as const,
    columnIndex,
    pageIndex,
    path: Object.freeze([...column.path]),
    pageType: page.type as 'data-v1' | 'data-v2',
    pageOrdinal: page.pageOrdinal,
    physicalType,
    valueCount: page.valueCount,
    physicalValueCount,
    compression,
    encodedValues,
    values,
    repetitionLevels,
    definitionLevels
  });
}

function getPageSections(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage
): {
  repetitionLevels?: Uint8Array;
  definitionLevels?: Uint8Array;
  encodedValues: Uint8Array;
  decodedValuesByteLength: number;
} {
  if (page.compressionState === 'decompressed') {
    if (!page.values) {
      throw new Error('Decompressed Parquet data page is missing its values section');
    }
    return {
      repetitionLevels: getSectionBytes(page, page.repetitionLevels),
      definitionLevels: getSectionBytes(page, page.definitionLevels),
      encodedValues: getSectionBytes(page, page.values)!,
      decodedValuesByteLength: page.values.byteLength
    };
  }

  if (page.type === 'data-v1') {
    if (column.maxDefinitionLevel !== 0 || column.maxRepetitionLevel !== 0) {
      throw makePlannerError(
        'compressed-v1-level-framing',
        'Compressed Parquet V1 pages do not expose level/value boundaries before decompression'
      );
    }
    return {encodedValues: page.data, decodedValuesByteLength: page.uncompressedByteLength};
  }
  if (page.type !== 'data-v2' || !page.values) {
    throw new Error('Compressed Parquet page is missing a GPU-addressable values section');
  }
  const levelByteLength =
    (page.repetitionLevels?.byteLength ?? 0) + (page.definitionLevels?.byteLength ?? 0);
  const decodedValuesByteLength = page.uncompressedByteLength - levelByteLength;
  if (decodedValuesByteLength < 0) {
    throw new Error('Parquet V2 uncompressed values byte length is negative');
  }
  return {
    repetitionLevels: getSectionBytes(page, page.repetitionLevels),
    definitionLevels: getSectionBytes(page, page.definitionLevels),
    encodedValues: getSectionBytes(page, page.values)!,
    decodedValuesByteLength
  };
}

function planCompression(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage,
  compressed: Uint8Array,
  input: GPUParquetUploadSection,
  outputByteLength: number,
  compressionCodecs: ReadonlySet<string>,
  upload: GPUParquetUploadBuilder
): GPUParquetCompressionPlan | undefined {
  if (page.compressionState === 'decompressed') return undefined;
  if (!compressionCodecs.has(page.compression)) {
    throw makePlannerError(
      'unsupported-compression',
      `Parquet compression ${page.compression} is not enabled for GPU decoding`
    );
  }
  if (page.compression === 'SNAPPY') {
    const plan = parseSnappyDecompressionPlan(compressed);
    if (plan.outputByteLength !== outputByteLength) {
      throw new Error(
        `Snappy output length ${plan.outputByteLength} does not match Parquet metadata ${outputByteLength}`
      );
    }
    return Object.freeze({
      codec: 'SNAPPY' as const,
      input,
      descriptors: upload.add(plan.descriptors, 'snappy descriptors'),
      descriptorCount: plan.descriptorCount,
      outputByteLength
    });
  }
  if (page.compression === 'LZ4_RAW') {
    const plan = parseLZ4RawDecompressionPlan(compressed);
    if (plan.outputByteLength !== outputByteLength) {
      throw new Error(
        `LZ4_RAW output length ${plan.outputByteLength} does not match Parquet metadata ${outputByteLength}`
      );
    }
    return Object.freeze({
      codec: 'LZ4_RAW' as const,
      input,
      descriptors: upload.add(plan.descriptors, 'lz4 descriptors'),
      descriptorCount: plan.descriptorCount,
      outputByteLength
    });
  }
  throw makePlannerError(
    'unsupported-compression',
    `Parquet compression ${column.compression} has no GPU planner`
  );
}

function planValues(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage,
  encoded: Uint8Array,
  physicalType: ParquetPhysicalType,
  valueCount: number,
  decodedValuesByteLength: number,
  isCompressed: boolean,
  upload: GPUParquetUploadBuilder,
  dictionary: GPUParquetDictionaryPlan | undefined,
  dictionaryError: PlannerError | undefined
): GPUParquetValuePlan {
  const encoding = normalizeEncoding(page.encoding);
  if (encoding === 'PLAIN') {
    if (physicalType === 'BOOLEAN') {
      const encodedByteLength = Math.ceil(valueCount / 8);
      if (decodedValuesByteLength !== encodedByteLength) {
        throw new Error(
          `PLAIN BOOLEAN payload has ${decodedValuesByteLength} decoded bytes; expected ${encodedByteLength}`
        );
      }
      return Object.freeze({
        kind: 'plain-boolean' as const,
        valueCount,
        decodedByteLength: valueCount * Uint32Array.BYTES_PER_ELEMENT
      });
    }
    if (physicalType === 'BYTE_ARRAY') {
      if (isCompressed) {
        throw makePlannerError(
          'compressed-control-stream',
          'Compressed PLAIN BYTE_ARRAY length prefixes require CPU decompression before GPU planning'
        );
      }
      const plainPlan = parseParquetPlainByteArrayPlan(encoded, valueCount);
      return Object.freeze({
        kind: 'plain-byte-array' as const,
        valueCount,
        decodedByteLength: plainPlan.outputByteLength,
        plainPlan,
        sourceOffsets: upload.add(plainPlan.sourceOffsets, 'plain source offsets'),
        valueLengths: upload.add(plainPlan.valueLengths, 'plain value lengths'),
        valueOffsets: upload.add(plainPlan.valueOffsets, 'plain value offsets')
      });
    }
    const byteWidth = getParquetPhysicalTypeByteWidth(physicalType, column.typeLength);
    if (byteWidth === null) {
      throw makePlannerError(
        'unsupported-physical-type',
        `PLAIN ${physicalType} does not have an automatic GPU output layout`
      );
    }
    const decodedByteLength = multiplyUint32(valueCount, byteWidth, 'PLAIN decoded byte length');
    if (decodedValuesByteLength !== decodedByteLength) {
      throw new Error(
        `PLAIN ${physicalType} payload has ${decodedValuesByteLength} decoded bytes; expected ${decodedByteLength}`
      );
    }
    return Object.freeze({kind: 'plain-fixed' as const, valueCount, byteWidth, decodedByteLength});
  }

  if (encoding === 'BYTE_STREAM_SPLIT') {
    const byteWidth = getParquetPhysicalTypeByteWidth(physicalType, column.typeLength);
    if (byteWidth === null || physicalType === 'INT96') {
      throw makePlannerError(
        'unsupported-physical-type',
        `BYTE_STREAM_SPLIT does not support ${physicalType}`
      );
    }
    const decodedByteLength = multiplyUint32(
      valueCount,
      byteWidth,
      'BYTE_STREAM_SPLIT decoded byte length'
    );
    if (decodedValuesByteLength !== decodedByteLength) {
      throw new Error(
        `BYTE_STREAM_SPLIT payload has ${decodedValuesByteLength} decoded bytes; expected ${decodedByteLength}`
      );
    }
    return Object.freeze({
      kind: 'byte-stream-split' as const,
      valueCount,
      byteWidth,
      decodedByteLength
    });
  }

  if (isCompressed) {
    throw makePlannerError(
      'compressed-control-stream',
      `Compressed ${encoding} control headers require CPU decompression before GPU planning`
    );
  }
  if (encoding === 'DELTA_BINARY_PACKED' && physicalType === 'INT32') {
    const deltaPlan = parseParquetDeltaBinaryPackedPlan(encoded);
    validatePlannedValueCount(deltaPlan.valueCount, valueCount, encoding);
    return Object.freeze({
      kind: 'delta-binary-packed-int32' as const,
      valueCount,
      decodedByteLength: multiplyUint32(valueCount, 4, 'INT32 delta output'),
      deltaPlan,
      miniBlockDescriptors: upload.add(deltaPlan.miniBlockDescriptors, 'int32 delta descriptors')
    });
  }
  if (encoding === 'DELTA_BINARY_PACKED' && physicalType === 'INT64') {
    const deltaPlan = parseParquetDeltaBinaryPackedInt64Plan(encoded);
    validatePlannedValueCount(deltaPlan.valueCount, valueCount, encoding);
    return Object.freeze({
      kind: 'delta-binary-packed-int64' as const,
      valueCount,
      decodedByteLength: multiplyUint32(valueCount, 8, 'INT64 delta output'),
      deltaPlan,
      miniBlockDescriptors: upload.add(deltaPlan.miniBlockDescriptors, 'int64 delta descriptors')
    });
  }
  if (encoding === 'DELTA_LENGTH_BYTE_ARRAY' && physicalType === 'BYTE_ARRAY') {
    const deltaPlan = parseParquetDeltaLengthByteArrayPlan(encoded);
    validatePlannedValueCount(deltaPlan.lengthPlan.valueCount, valueCount, encoding);
    return Object.freeze({
      kind: 'delta-length-byte-array' as const,
      valueCount,
      decodedByteLength: deltaPlan.payloadByteLength,
      deltaPlan,
      miniBlockDescriptors: upload.add(
        deltaPlan.lengthPlan.miniBlockDescriptors,
        'delta length descriptors'
      ),
      payload: upload.add(
        encoded.subarray(deltaPlan.payloadByteOffset),
        'delta length byte-array payload'
      )
    });
  }
  if (encoding === 'RLE_DICTIONARY' || encoding === 'PLAIN_DICTIONARY') {
    if (!dictionary) {
      throw (
        dictionaryError ??
        makePlannerError(
          'missing-dictionary',
          'Dictionary-encoded Parquet data page has no usable dictionary page'
        )
      );
    }
    const indicesPlan = parseParquetDictionaryIndicesPlan(encoded, valueCount);
    const decodedByteLength =
      dictionary.kind === 'fixed'
        ? multiplyUint32(valueCount, dictionary.byteWidth, 'dictionary decoded byte length')
        : getDictionaryByteArrayOutputLength(encoded, indicesPlan, dictionary);
    return Object.freeze({
      kind:
        dictionary.kind === 'fixed'
          ? ('dictionary-fixed' as const)
          : ('dictionary-byte-array' as const),
      valueCount,
      decodedByteLength,
      dictionary,
      indicesPlan,
      runDescriptors: upload.add(indicesPlan.runPlan.runDescriptors, 'dictionary index descriptors')
    });
  }
  throw makePlannerError(
    'unsupported-encoding',
    `Parquet encoding ${page.encoding} is not supported by the automatic page adapter`
  );
}

function planLevel(
  page: ParquetEncodedPage,
  encoded: Uint8Array | undefined,
  encoding: string | undefined,
  maxLevel: number,
  upload: GPUParquetUploadBuilder,
  name: string
): GPUParquetLevelPlan | undefined {
  if (maxLevel === 0) return undefined;
  if (!encoded) throw new Error(`Parquet ${name} level section is missing`);
  const bitWidth = getLevelBitWidth(maxLevel);
  const input = upload.add(encoded, `${name} bytes`);
  if (encoding === 'RLE') {
    const runPlan = parseParquetRleBitPackedRunPlan(encoded, bitWidth, page.valueCount);
    return Object.freeze({
      encoding: 'RLE' as const,
      bitWidth,
      valueCount: page.valueCount,
      input,
      runPlan,
      runDescriptors: upload.add(runPlan.runDescriptors, `${name} descriptors`)
    });
  }
  if (encoding === 'BIT_PACKED') {
    return Object.freeze({
      encoding: 'BIT_PACKED' as const,
      bitWidth,
      valueCount: page.valueCount,
      input,
      bitPackedPlan: parseParquetBitPackedRunPlan(encoded, bitWidth, page.valueCount)
    });
  }
  throw new Error(`Unsupported Parquet ${name} level encoding ${encoding}`);
}

function getPhysicalValueCount(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage,
  definitionLevels: GPUParquetLevelPlan | undefined
): number {
  if (page.nonNullValueCount !== undefined) {
    validateUint32(page.nonNullValueCount, 'nonNullValueCount');
    if (page.nonNullValueCount > page.valueCount) {
      throw new Error('Parquet nonNullValueCount exceeds valueCount');
    }
    return page.nonNullValueCount;
  }
  if (column.maxDefinitionLevel === 0) return page.valueCount;
  if (!definitionLevels) throw new Error('Parquet nullable page has no definition-level plan');
  if (definitionLevels.encoding === 'BIT_PACKED') {
    return countBitPackedLevel(
      getSectionBytes(page, page.definitionLevels)!,
      definitionLevels.bitWidth,
      page.valueCount,
      column.maxDefinitionLevel
    );
  }
  return countRleLevel(
    getSectionBytes(page, page.definitionLevels)!,
    definitionLevels,
    column.maxDefinitionLevel
  );
}

function countRleLevel(
  encoded: Uint8Array,
  levelPlan: GPUParquetLevelPlan,
  targetLevel: number
): number {
  const descriptors = levelPlan.runPlan!.runDescriptors;
  let count = 0;
  for (let descriptorIndex = 0; descriptorIndex < descriptors.length; descriptorIndex += 4) {
    const valueCount = descriptors[descriptorIndex + 1];
    const payloadByteOffset = descriptors[descriptorIndex + 2];
    const isBitPacked = descriptors[descriptorIndex + 3] === 1;
    if (!isBitPacked) {
      if (readLittleEndianBits(encoded, payloadByteOffset, levelPlan.bitWidth) === targetLevel) {
        count += valueCount;
      }
      continue;
    }
    for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
      if (
        readPackedBits(encoded, payloadByteOffset, valueIndex, levelPlan.bitWidth) === targetLevel
      ) {
        count++;
      }
    }
  }
  return count;
}

function getDictionaryByteArrayOutputLength(
  encoded: Uint8Array,
  indicesPlan: ParquetDictionaryIndicesPlan,
  dictionary: Extract<GPUParquetDictionaryPlan, {kind: 'byte-array'}>
): number {
  let outputByteLength = 0;
  const descriptors = indicesPlan.runPlan.runDescriptors;
  for (let descriptorIndex = 0; descriptorIndex < descriptors.length; descriptorIndex += 4) {
    const valueCount = descriptors[descriptorIndex + 1];
    const payloadByteOffset = descriptors[descriptorIndex + 2];
    const isBitPacked = descriptors[descriptorIndex + 3] === 1;
    if (!isBitPacked) {
      const dictionaryIndex = readLittleEndianBits(
        encoded,
        payloadByteOffset,
        indicesPlan.bitWidth
      );
      outputByteLength = addDictionaryLengths(
        outputByteLength,
        dictionary,
        dictionaryIndex,
        valueCount
      );
      continue;
    }
    for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
      const dictionaryIndex = readPackedBits(
        encoded,
        payloadByteOffset,
        valueIndex,
        indicesPlan.bitWidth
      );
      outputByteLength = addDictionaryLengths(outputByteLength, dictionary, dictionaryIndex, 1);
    }
  }
  return outputByteLength;
}

function addDictionaryLengths(
  outputByteLength: number,
  dictionary: Extract<GPUParquetDictionaryPlan, {kind: 'byte-array'}>,
  dictionaryIndex: number,
  count: number
): number {
  if (dictionaryIndex >= dictionary.valueCount) {
    throw new Error(`Parquet dictionary index ${dictionaryIndex} is out of range`);
  }
  const result = outputByteLength + dictionary.plainPlan.valueLengths[dictionaryIndex] * count;
  if (!Number.isSafeInteger(result) || result > 0xffffffff) {
    throw new Error('Parquet dictionary byte-array output length exceeds uint32');
  }
  return result;
}

function countBitPackedLevel(
  encoded: Uint8Array,
  bitWidth: number,
  valueCount: number,
  targetLevel: number
): number {
  let count = 0;
  for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
    let value = 0;
    for (let valueBitIndex = 0; valueBitIndex < bitWidth; valueBitIndex++) {
      const sourceBitIndex = valueIndex * bitWidth + valueBitIndex;
      const bit = (encoded[sourceBitIndex >> 3] >> (7 - (sourceBitIndex & 7))) & 1;
      value |= bit << (bitWidth - 1 - valueBitIndex);
    }
    if (value === targetLevel) count++;
  }
  return count;
}

function readLittleEndianBits(bytes: Uint8Array, byteOffset: number, bitWidth: number): number {
  let value = 0;
  const byteCount = Math.ceil(bitWidth / 8);
  for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
    value |= bytes[byteOffset + byteIndex] << (byteIndex * 8);
  }
  return bitWidth === 32 ? value >>> 0 : value & (2 ** bitWidth - 1);
}

function readPackedBits(
  bytes: Uint8Array,
  payloadByteOffset: number,
  valueIndex: number,
  bitWidth: number
): number {
  if (bitWidth === 0) return 0;
  const bitOffset = valueIndex * bitWidth;
  let value = 0;
  for (let valueBitIndex = 0; valueBitIndex < bitWidth; valueBitIndex++) {
    const sourceBitIndex = bitOffset + valueBitIndex;
    const bit = (bytes[payloadByteOffset + (sourceBitIndex >> 3)] >> (sourceBitIndex & 7)) & 1;
    value |= bit << valueBitIndex;
  }
  return value >>> 0;
}

function validateColumn(column: ParquetEncodedColumnChunk): void {
  if (column.path.length === 0) throw new Error('Parquet encoded column path must not be empty');
  validateUint32(column.valueCount, `${column.path.join('.')} valueCount`);
  validateUint32(column.maxDefinitionLevel, `${column.path.join('.')} maxDefinitionLevel`);
  validateUint32(column.maxRepetitionLevel, `${column.path.join('.')} maxRepetitionLevel`);
  let valueCount = 0;
  for (const page of column.pages) {
    valueCount += page.valueCount;
    if (!Number.isSafeInteger(valueCount) || valueCount > 0xffffffff) {
      throw new Error(`Parquet column ${column.path.join('.')} page value count exceeds uint32`);
    }
  }
  if (valueCount !== column.valueCount) {
    throw new Error(
      `Parquet column ${column.path.join('.')} declares ${column.valueCount} values but its pages declare ${valueCount}`
    );
  }
  if (column.dictionary) {
    validatePage(column, column.dictionary, -1);
    if (column.dictionary.type !== 'dictionary' || column.dictionary.pageOrdinal !== -1) {
      throw new Error('Parquet dictionary page must use type dictionary and pageOrdinal -1');
    }
  }
}

function validatePage(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage,
  expectedPageOrdinal: number
): void {
  validateUint32(page.valueCount, 'Parquet page valueCount');
  validateUint32(page.compressedByteLength, 'Parquet compressedByteLength');
  validateUint32(page.uncompressedByteLength, 'Parquet uncompressedByteLength');
  if (page.compression !== column.compression) {
    throw new Error(
      `Parquet page compression ${page.compression} does not match column compression ${column.compression}`
    );
  }
  if (page.type !== 'dictionary' && page.pageOrdinal !== expectedPageOrdinal) {
    throw new Error(
      `Parquet data page ordinal ${page.pageOrdinal} is not the expected ${expectedPageOrdinal}`
    );
  }
  const expectedByteLength =
    page.compressionState === 'compressed'
      ? page.compressedByteLength
      : page.uncompressedByteLength;
  if (page.data.byteLength !== expectedByteLength) {
    throw new Error(
      `Parquet ${page.compressionState} page has ${page.data.byteLength} bytes; expected ${expectedByteLength}`
    );
  }
  validateSection(page, page.repetitionLevels, 'repetitionLevels');
  validateSection(page, page.definitionLevels, 'definitionLevels');
  validateSection(page, page.values, 'values');
}

function validateSection(
  page: ParquetEncodedPage,
  section: ParquetEncodedPageSection | undefined,
  name: string
): void {
  if (!section) return;
  validateUint32(section.byteOffset, `${name}.byteOffset`);
  validateUint32(section.byteLength, `${name}.byteLength`);
  if (section.byteOffset + section.byteLength > page.data.byteLength) {
    throw new Error(`Parquet ${name} section extends beyond the page body`);
  }
}

function getSectionBytes(
  page: ParquetEncodedPage,
  section: ParquetEncodedPageSection | undefined
): Uint8Array | undefined {
  if (!section) return undefined;
  return page.data.subarray(section.byteOffset, section.byteOffset + section.byteLength);
}

function parsePhysicalType(physicalType: string): ParquetPhysicalType {
  switch (physicalType) {
    case 'BOOLEAN':
    case 'INT32':
    case 'INT64':
    case 'INT96':
    case 'FLOAT':
    case 'DOUBLE':
    case 'BYTE_ARRAY':
    case 'FIXED_LEN_BYTE_ARRAY':
      return physicalType;
    default:
      throw makePlannerError(
        'unsupported-physical-type',
        `Unsupported Parquet physical type ${physicalType}`
      );
  }
}

function normalizeEncoding(encoding: string): string {
  return encoding === 'RLE_DICTIONARY' || encoding === 'PLAIN_DICTIONARY'
    ? encoding
    : encoding.toUpperCase();
}

function getLevelBitWidth(maxLevel: number): number {
  return maxLevel === 0 ? 0 : 32 - Math.clz32(maxLevel);
}

function validatePlannedValueCount(actual: number, expected: number, encoding: string): void {
  if (actual !== expected) {
    throw new Error(`${encoding} declares ${actual} values; expected ${expected}`);
  }
}

function multiplyUint32(left: number, right: number, name: string): number {
  const result = left * right;
  if (!Number.isSafeInteger(result) || result > 0xffffffff) {
    throw new Error(`${name} exceeds uint32`);
  }
  return result;
}

function validateUint32(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`${name} must be a non-negative uint32`);
  }
}

function makeFallback(
  column: ParquetEncodedColumnChunk,
  page: ParquetEncodedPage,
  columnIndex: number,
  pageIndex: number,
  reason: CPUParquetPageFallbackPlan['reason'],
  detail: string
): CPUParquetPageFallbackPlan {
  return Object.freeze({
    mode: 'cpu-fallback' as const,
    columnIndex,
    pageIndex,
    path: Object.freeze([...column.path]),
    pageOrdinal: page.pageOrdinal,
    reason,
    detail,
    page
  });
}

type PlannerError = Error & {reason?: CPUParquetPageFallbackPlan['reason']};

function makePlannerError(
  reason: CPUParquetPageFallbackPlan['reason'],
  message: string
): PlannerError {
  const error: PlannerError = new Error(message);
  error.reason = reason;
  return error;
}

class GPUParquetUploadBuilder {
  private readonly chunks: {section: GPUParquetUploadSection; bytes: Uint8Array}[] = [];
  private byteLength = 0;

  add(bytes: Uint8Array | Uint32Array, name: string): GPUParquetUploadSection {
    if (bytes.byteLength > 0xffffffff) throw new Error(`Parquet ${name} upload exceeds uint32`);
    const alignedByteOffset = Math.ceil(this.byteLength / 4) * 4;
    const nextByteLength = alignedByteOffset + bytes.byteLength;
    if (!Number.isSafeInteger(nextByteLength) || nextByteLength > 0xffffffff) {
      throw new Error('Parquet batched upload exceeds uint32');
    }
    const section = Object.freeze({byteOffset: alignedByteOffset, byteLength: bytes.byteLength});
    this.chunks.push({
      section,
      bytes: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    });
    this.byteLength = nextByteLength;
    return section;
  }

  finish(): Uint8Array {
    const output = new Uint8Array(Math.ceil(this.byteLength / 4) * 4);
    for (const chunk of this.chunks) output.set(chunk.bytes, chunk.section.byteOffset);
    return output;
  }
}
