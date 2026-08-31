// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  GPUData,
  GPUVector,
  getGPUVectorElementFormat,
  getGPUVectorFormatInfo,
  type GPUVectorBufferProps,
  type GPUVectorFormat
} from '@luma.gl/gpgpu/gpu-data';
import {castData, fround, GPUDataEvaluator} from '@luma.gl/gpgpu';
import {GPURecordBatch, GPUTable, type GPUField} from '@luma.gl/experimental/gpu-tables';
import {
  DataType,
  Field,
  FixedSizeList,
  Float16,
  Float32,
  Float64,
  Int16,
  Int32,
  Int8,
  List,
  RecordBatch,
  Table,
  Uint16,
  Uint32,
  Uint8,
  Vector,
  vectorFromArray,
  type Data
} from 'apache-arrow';
import {canConvertColors, convertArrowColors, convertColors} from '../arrow-colors';
import {getArrowFieldByPath, getArrowVectorByPath} from '../arrow-utils/arrow-paths';
import {getArrowVectorByteLength} from '../vectors/arrow-vector-utils';
import {
  convertArrowMatrixToGPUVector,
  type PreparedArrowMatrixGPUVector
} from '../vectors/arrow-matrix-gpu-vector';
import {getArrowMatrixVectorInfo, type ArrowMatrixVectorInfo} from '../vectors/arrow-matrix-vector';
import {
  convertArrowTemporalToGPUVector,
  getArrowTemporalVectorInfo,
  TEMPORAL_ORIGIN_METADATA_KEY,
  type ConvertArrowTemporalToGPUVectorOptions,
  type PreparedArrowTemporalGPUVector
} from '../vectors/arrow-temporal-gpu-vector';
import {
  getGPUVectorFormatFromArrowDataType,
  makeGPUVectorFromArrow
} from './arrow-gpu-table-adapters';
import {
  getArrowDataBufferSource,
  getArrowGPUDataReadbackMetadata,
  getArrowVariableLengthAttributeDataBufferSource
} from './arrow-gpu-data';

/** Semantic interpretation requested at the Arrow-to-GPU boundary. */
export type ArrowGPUConversionSemantic =
  | 'auto'
  | 'numeric'
  | 'color'
  | 'matrix'
  | 'temporal'
  | 'text'
  | 'dictionary';

/** Constraint applied while selecting a conversion strategy. */
export type ArrowGPUConversionPolicy =
  | 'auto'
  | 'prefer-gpu'
  | 'prefer-cpu'
  | 'require-direct'
  | 'require-zero-copy';

/** Physical work selected by an Arrow-to-GPU conversion plan. */
export type ArrowGPUConversionStrategy =
  | 'borrow'
  | 'upload'
  | 'reinterpret-upload'
  | 'convert-numeric'
  | 'convert-color'
  | 'convert-matrix'
  | 'convert-temporal';

/** Execution backend selected for the plan's transformation work. */
export type ArrowGPUConversionBackend = 'none' | 'upload' | 'cpu' | 'webgl' | 'webgpu';

/** Estimated conversion work. Counts deliberately exclude caller-owned input storage. */
export type ArrowGPUConversionCost = {
  /** Bytes retained by the source representation, when known. */
  sourceByteLength: number;
  /** Bytes expected in the prepared GPU payload, excluding auxiliary metadata. */
  targetByteLength: number;
  /** Number of Arrow chunks that must be uploaded. */
  uploadCount: number;
  /** Number of CPU transformation passes over source values. */
  cpuPassCount: number;
  /** Number of GPU transformation passes over source values. */
  gpuPassCount: number;
  /** Whether execution allocates prepared GPU storage. */
  allocatesGPUStorage: boolean;
};

/** Options accepted by the universal Arrow-to-GPU vector planner and executor. */
export type ArrowGPUConversionOptions = {
  /** Stable prepared vector name. */
  name?: string;
  /** Stable GPU resource id prefix. */
  id?: string;
  /** Semantic conversion family. `auto` recognizes temporal and metadata-tagged matrices. */
  semantic?: ArrowGPUConversionSemantic;
  /** One required output memory format. */
  format?: GPUVectorFormat;
  /** Ordered acceptable output formats. The planner selects the first compatible format. */
  formats?: readonly GPUVectorFormat[];
  /** Strategy constraint. */
  policy?: ArrowGPUConversionPolicy;
  /** Preserve every Arrow Data chunk as one GPUData chunk. Defaults to `true`. */
  preserveDataChunks?: boolean;
  /** Buffer properties used by direct Arrow uploads and color source uploads. */
  bufferProps?: GPUVectorBufferProps;
  /** Source Arrow field, including logical metadata used by temporal conversion. */
  field?: Field;
  /** Temporal-specific origin and backend options. */
  temporal?: Omit<ConvertArrowTemporalToGPUVectorOptions, 'name' | 'id' | 'field'>;
};

/** Serializable explanation of one selected Arrow-to-GPU conversion. */
export type ArrowGPUConversionPlan = {
  /** Requested or inferred semantic conversion family. */
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>;
  /** Selected physical strategy. */
  strategy: ArrowGPUConversionStrategy;
  /** Selected transformation backend. */
  backend: ArrowGPUConversionBackend;
  /** Human-readable Arrow or GPU source type. */
  sourceType: string;
  /** Existing source GPU format, or the direct-upload format implied by Arrow. */
  sourceFormat?: GPUVectorFormat;
  /** Canonical prepared GPU format. */
  targetFormat: GPUVectorFormat;
  /** Logical source row count. */
  length: number;
  /** Ordered source chunk count. */
  chunkCount: number;
  /** Whether output GPUData preserves ordered source chunks. */
  preservesDataChunks: boolean;
  /** Whether the prepared vector borrows caller-owned GPU storage. */
  borrowsSource: boolean;
  /** Estimated work and storage. */
  cost: ArrowGPUConversionCost;
  /** Stable explanations for diagnostics, telemetry, and tests. */
  reasons: readonly string[];
  /** Potentially lossy or device-limited behavior selected by the plan. */
  warnings: readonly string[];
};

/** Arrow or already-resident GPU vector accepted by the universal conversion boundary. */
export type ArrowGPUConversionSource = Vector | GPUVector;

/** Prepared vector, plan, logical metadata, and explicit ownership handle. */
export type PreparedArrowGPUVector = {
  /** Prepared GPU vector. */
  vector: GPUVector;
  /** Plan used to produce `vector`. */
  plan: ArrowGPUConversionPlan;
  /** Prepared Arrow field when the conversion produces logical metadata. */
  field?: Field;
  /** Matrix metadata when matrix conversion was selected. */
  matrixInfo?: ArrowMatrixVectorInfo;
  /** Temporal metadata when temporal conversion was selected. */
  temporalInfo?: PreparedArrowTemporalGPUVector['temporalInfo'];
  /** Residual-low Float32 lanes when Float64 values are split by the WebGPU fround path. */
  residualVector?: GPUVector;
  /** Whether this result owns prepared GPU storage. */
  ownsVector: boolean;
  /** Releases prepared storage exactly once. Borrowed sources are never destroyed. */
  destroy: () => void;
};

/** One named source-to-target mapping in an Arrow table conversion schema. */
export type ArrowGPUTableConversionColumn = ArrowGPUConversionOptions & {
  /** Prepared GPU column name. */
  name: string;
  /** Source Arrow field path. Defaults to `name`. */
  source?: string;
};

/** Schema-driven selection and lowering contract for one Arrow table. */
export type ArrowGPUTableConversionSchema = {
  /** Ordered selected output columns. */
  columns: readonly ArrowGPUTableConversionColumn[];
};

/** Plan for every selected column in one Arrow table. */
export type ArrowGPUTableConversionPlan = {
  /** Ordered column plans with resolved source paths. */
  columns: readonly {
    name: string;
    source: string;
    plan: ArrowGPUConversionPlan;
  }[];
  /** Source rows shared by every selected column. */
  length: number;
  /** Aggregate cost across selected columns. */
  cost: ArrowGPUConversionCost;
};

/** Prepared generic GPU table plus its inspectable conversion plan. */
export type PreparedArrowGPUTable = {
  /** Prepared generic GPU table. */
  table: GPUTable;
  /** Prepared vectors keyed by output column name. */
  vectors: Readonly<Record<string, GPUVector>>;
  /** Plan used to prepare the table. */
  plan: ArrowGPUTableConversionPlan;
  /** Releases table-owned GPU data exactly once. */
  destroy: () => void;
};

/** Iterable Arrow record-batch source accepted by streaming conversion. */
export type ArrowRecordBatchConversionSource = Iterable<RecordBatch> | AsyncIterable<RecordBatch>;

/** One independently owned GPU record batch produced from an Arrow stream. */
export type PreparedArrowGPURecordBatch = {
  /** Prepared batch. */
  batch: GPURecordBatch;
  /** Prepared batch-local vectors keyed by output name. */
  vectors: Readonly<Record<string, GPUVector>>;
  /** Plan used for this batch. */
  plan: ArrowGPUTableConversionPlan;
  /** Releases batch-owned GPU data exactly once. */
  destroy: () => void;
};

/** Plans one Arrow or GPU-resident vector conversion without allocating GPU resources. */
export function planArrowGPUConversion(
  device: Device,
  source: ArrowGPUConversionSource,
  options: ArrowGPUConversionOptions = {}
): ArrowGPUConversionPlan {
  validateTargetFormats(options);
  const semantic = resolveConversionSemantic(source, options.semantic ?? 'auto', options.field);
  const sourceFormat = getSourceFormat(source, semantic);
  const targetFormat = resolveTargetFormat(sourceFormat, semantic, source, options);
  const strategy = resolveConversionStrategy(source, sourceFormat, targetFormat, semantic);
  validateConversionPolicy(strategy, options.policy ?? 'auto');
  validateConversionNullability(source, semantic);

  const chunkCount = getSourceChunkCount(source);
  const sourceByteLength = getSourceByteLength(source);
  const backend = resolveConversionBackend(device, strategy, source, options.policy ?? 'auto');
  const targetByteLength =
    estimateTargetByteLength(source, targetFormat, semantic) *
    (backend === 'webgpu' && source instanceof Vector && isArrowFloat64NumericType(source.type)
      ? 2
      : 1);
  const transforms = strategy.startsWith('convert-');
  const sourceIsArrow = source instanceof Vector;
  const uploadCount = sourceIsArrow ? chunkCount : 0;

  return {
    semantic,
    strategy,
    backend,
    sourceType: getSourceTypeName(source),
    ...(sourceFormat ? {sourceFormat} : {}),
    targetFormat,
    length: source.length,
    chunkCount,
    preservesDataChunks: options.preserveDataChunks !== false || transforms,
    borrowsSource: strategy === 'borrow',
    cost: {
      sourceByteLength,
      targetByteLength,
      uploadCount,
      cpuPassCount: transforms && backend === 'cpu' ? 1 : 0,
      gpuPassCount: transforms && (backend === 'webgpu' || backend === 'webgl') ? 1 : 0,
      allocatesGPUStorage: strategy !== 'borrow'
    },
    reasons:
      backend === 'webgpu' && source instanceof Vector && isArrowFloat64NumericType(source.type)
        ? [
            'Arrow binary64 bytes upload unchanged',
            'GPGPU fround splits high and residual-low Float32 lanes in one pass'
          ]
        : getConversionReasons(strategy, semantic, sourceFormat, targetFormat, backend),
    warnings: getConversionWarnings(source, strategy, targetFormat, backend)
  };
}

/** Executes one inspectable Arrow-to-GPU conversion plan. */
export async function convertArrowToGPUVector(
  device: Device,
  source: ArrowGPUConversionSource,
  options: ArrowGPUConversionOptions = {}
): Promise<PreparedArrowGPUVector> {
  const plan = planArrowGPUConversion(device, source, options);
  const name = options.name ?? (source instanceof GPUVector ? source.name : 'vector');
  const id = options.id ?? name;

  switch (plan.strategy) {
    case 'borrow':
      return makePreparedArrowGPUVector(source as GPUVector, plan, false);

    case 'upload':
    case 'reinterpret-upload': {
      const vector = makeGPUVectorFromArrow(device, source as Vector, {
        ...options.bufferProps,
        name,
        format: plan.targetFormat,
        preserveDataChunks: options.preserveDataChunks ?? true
      });
      return makePreparedArrowGPUVector(vector, plan, true);
    }

    case 'convert-color': {
      const vector =
        source instanceof GPUVector
          ? await convertColors(device, source, {name})
          : await convertArrowColors(device, source as Parameters<typeof convertArrowColors>[1], {
              name,
              bufferProps: options.bufferProps
            });
      return makePreparedArrowGPUVector(vector, plan, true);
    }

    case 'convert-numeric': {
      if (plan.backend === 'webgpu') {
        const arrowSource = source as Vector;
        const converted = isArrowFloat64NumericType(arrowSource.type)
          ? await convertArrowFloat64VectorOnGPU(device, arrowSource, plan, {
              name,
              bufferProps: options.bufferProps
            })
          : await convertArrowNumericVectorOnGPU(device, arrowSource, plan, {
              name,
              bufferProps: options.bufferProps
            });
        return 'residualVector' in converted
          ? makePreparedArrowGPUVector(converted.vector, plan, true, converted.residualVector)
          : makePreparedArrowGPUVector(converted, plan, true);
      }
      const converted = convertArrowNumericVector(source as Vector, plan.targetFormat);
      const vector = makeGPUVectorFromArrow(device, converted, {
        ...options.bufferProps,
        name,
        format: plan.targetFormat,
        preserveDataChunks: true
      });
      return makePreparedArrowGPUVector(vector, plan, true);
    }

    case 'convert-matrix': {
      const prepared = await convertArrowMatrixToGPUVector(
        device,
        source as Parameters<typeof convertArrowMatrixToGPUVector>[1],
        {name, id}
      );
      return makePreparedMatrixResult(prepared, plan);
    }

    case 'convert-temporal': {
      const prepared = await convertArrowTemporalToGPUVector(
        device,
        source as Parameters<typeof convertArrowTemporalToGPUVector>[1],
        {
          ...options.temporal,
          preferGPU:
            options.policy === 'prefer-cpu'
              ? false
              : options.policy === 'prefer-gpu'
                ? true
                : options.temporal?.preferGPU,
          name,
          id,
          field: options.field
        }
      );
      return makePreparedTemporalResult(prepared, plan);
    }
  }
}

/** Plans every selected column in an Arrow table using one explicit output schema. */
export function planArrowTableGPUConversion(
  device: Device,
  table: Table,
  schema: ArrowGPUTableConversionSchema
): ArrowGPUTableConversionPlan {
  validateTableConversionSchema(schema);
  const columns = schema.columns.map(column => {
    const sourcePath = column.source ?? column.name;
    const sourceVector = getArrowVectorByPath(table, sourcePath);
    const sourceField = getArrowFieldByPath(table, sourcePath);
    return {
      name: column.name,
      source: sourcePath,
      plan: planArrowGPUConversion(device, sourceVector, {
        ...column,
        name: column.name,
        field: column.field ?? sourceField
      })
    };
  });
  return {
    columns,
    length: table.numRows,
    cost: sumConversionCosts(columns.map(column => column.plan.cost))
  };
}

/** Converts selected Arrow table columns into a batch-preserving generic GPU table. */
export async function convertArrowTableToGPUTable(
  device: Device,
  table: Table,
  schema: ArrowGPUTableConversionSchema
): Promise<PreparedArrowGPUTable> {
  const plan = planArrowTableGPUConversion(device, table, schema);
  const preparedColumns: PreparedArrowGPUVector[] = [];
  try {
    for (const column of schema.columns) {
      const sourcePath = column.source ?? column.name;
      const sourceVector = getArrowVectorByPath(table, sourcePath);
      const sourceField = getArrowFieldByPath(table, sourcePath);
      preparedColumns.push(
        await convertArrowToGPUVector(device, sourceVector, {
          ...column,
          name: column.name,
          field: column.field ?? sourceField
        })
      );
    }
    validatePreparedTableColumns(preparedColumns, table.numRows);
    const vectors = Object.fromEntries(
      schema.columns.map((column, index) => [column.name, preparedColumns[index].vector])
    );
    const fields = schema.columns.map((column, index): GPUField => {
      const sourcePath = column.source ?? column.name;
      const sourceField = getArrowFieldByPath(table, sourcePath);
      const preparedField = preparedColumns[index].field;
      return {
        name: column.name,
        format: preparedColumns[index].vector.format,
        nullable: sourceField.nullable,
        metadata: new Map(preparedField?.metadata ?? sourceField.metadata)
      };
    });
    const gpuBatches = table.batches.map((batch, batchIndex) => {
      const gpuData = Object.fromEntries(
        schema.columns.map((column, columnIndex) => [
          column.name,
          preparedColumns[columnIndex].vector.data[batchIndex]
        ])
      );
      return new GPURecordBatch({
        gpuData,
        fields,
        metadata: new Map(batch.schema.metadata),
        numRows: batch.numRows,
        nullCount: batch.nullCount,
        sourceInfo: {
          sourceBatchIndex: batchIndex,
          sourceRowIndexOffset: table.batches
            .slice(0, batchIndex)
            .reduce((rowCount, sourceBatch) => rowCount + sourceBatch.numRows, 0),
          sourceRowCount: batch.numRows
        }
      });
    });
    const gpuTable = new GPUTable({batches: gpuBatches});
    let destroyed = false;
    return {
      table: gpuTable,
      vectors,
      plan,
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        gpuTable.destroy();
      }
    };
  } catch (error) {
    for (const prepared of preparedColumns) prepared.destroy();
    throw error;
  }
}

/** Converts one Arrow record batch without combining it with earlier or later batches. */
export async function convertArrowRecordBatchToGPURecordBatch(
  device: Device,
  recordBatch: RecordBatch,
  schema: ArrowGPUTableConversionSchema,
  options: {sourceBatchIndex?: number; sourceRowIndexOffset?: number} = {}
): Promise<PreparedArrowGPURecordBatch> {
  const preparedTable = await convertArrowTableToGPUTable(device, new Table([recordBatch]), schema);
  const [batch] = preparedTable.table.detachBatches();
  if (!batch) {
    preparedTable.destroy();
    throw new Error('Arrow record-batch conversion did not produce a GPU batch');
  }
  Object.assign(batch.sourceInfo!, {
    sourceBatchIndex: options.sourceBatchIndex ?? 0,
    sourceRowIndexOffset: options.sourceRowIndexOffset ?? 0,
    sourceRowCount: recordBatch.numRows
  });
  let destroyed = false;
  return {
    batch,
    vectors: preparedTable.vectors,
    plan: preparedTable.plan,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      batch.destroy();
    }
  };
}

/**
 * Converts an Arrow record-batch stream incrementally while preserving batch ownership.
 *
 * Temporal columns reuse the first prepared origin in later batches unless the schema supplies an
 * explicit origin. Consumers own each yielded batch and should destroy it after use.
 */
export async function* convertArrowRecordBatchesToGPURecordBatches(
  device: Device,
  source: ArrowRecordBatchConversionSource,
  schema: ArrowGPUTableConversionSchema
): AsyncGenerator<PreparedArrowGPURecordBatch> {
  const temporalOrigins = new Map<string, number | bigint>();
  let sourceBatchIndex = 0;
  let sourceRowIndexOffset = 0;
  for await (const recordBatch of source) {
    const batchSchema: ArrowGPUTableConversionSchema = {
      columns: schema.columns.map(column => {
        const origin = temporalOrigins.get(column.name);
        return origin === undefined || column.temporal?.origin !== undefined
          ? column
          : {...column, temporal: {...column.temporal, origin}};
      })
    };
    const prepared = await convertArrowRecordBatchToGPURecordBatch(
      device,
      recordBatch,
      batchSchema,
      {sourceBatchIndex, sourceRowIndexOffset}
    );
    captureStreamingTemporalOrigins(recordBatch, schema, prepared.batch, temporalOrigins);
    yield prepared;
    sourceRowIndexOffset += recordBatch.numRows;
    sourceBatchIndex++;
  }
}

function resolveConversionSemantic(
  source: ArrowGPUConversionSource,
  requested: ArrowGPUConversionSemantic,
  field?: Field
): Exclude<ArrowGPUConversionSemantic, 'auto'> {
  if (requested !== 'auto') return requested;
  if (getArrowMatrixVectorInfo(source)) return 'matrix';
  if (getArrowTemporalVectorInfo(source, field)) return 'temporal';
  const type = getSourceArrowType(source);
  if (type && DataType.isUtf8(type)) return 'text';
  if (type && DataType.isDictionary(type)) return 'dictionary';
  return 'numeric';
}

function getSourceFormat(
  source: ArrowGPUConversionSource,
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>
): GPUVectorFormat | undefined {
  if (source instanceof GPUVector) return source.format;
  if (semantic === 'matrix') {
    const matrixInfo = getArrowMatrixVectorInfo(source);
    return matrixInfo && isCanonicalMatrixInfo(matrixInfo) ? 'float32x4' : undefined;
  }
  if (semantic === 'temporal') return undefined;
  try {
    return getGPUVectorFormatFromArrowDataType(source.type);
  } catch {
    return undefined;
  }
}

function resolveTargetFormat(
  sourceFormat: GPUVectorFormat | undefined,
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>,
  source: ArrowGPUConversionSource,
  options: ArrowGPUConversionOptions
): GPUVectorFormat {
  const canonicalFormat = getCanonicalSemanticFormat(semantic, source, sourceFormat, options.field);
  const requestedFormats = options.format ? [options.format] : options.formats;
  if (!requestedFormats?.length) return canonicalFormat;

  if (semantic === 'color' || semantic === 'matrix' || semantic === 'temporal') {
    if (!requestedFormats.includes(canonicalFormat)) {
      throw new Error(
        `Arrow ${semantic} conversion produces ${canonicalFormat}, not ${requestedFormats.join(', ')}`
      );
    }
    return canonicalFormat;
  }

  const compatibleFormat = requestedFormats.find(format =>
    sourceFormat
      ? areGPUFormatsByteCompatible(sourceFormat, format) ||
        (semantic === 'numeric' && areGPUFormatShapesCompatible(sourceFormat, format))
      : semantic === 'numeric' && areGPUFormatShapesCompatible(canonicalFormat, format)
  );
  if (!compatibleFormat) {
    throw new Error(
      `Arrow direct conversion cannot lower ${sourceFormat ?? getSourceTypeName(source)} to ${requestedFormats.join(', ')}`
    );
  }
  return compatibleFormat;
}

function getCanonicalSemanticFormat(
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>,
  source: ArrowGPUConversionSource,
  sourceFormat: GPUVectorFormat | undefined,
  field?: Field
): GPUVectorFormat {
  switch (semantic) {
    case 'color':
      if (!canConvertColors(source)) {
        throw new Error(`Arrow color conversion does not support ${getSourceTypeName(source)}`);
      }
      return 'unorm8x4';
    case 'matrix':
      if (!getArrowMatrixVectorInfo(source)) {
        throw new Error('Arrow matrix conversion requires matrix metadata');
      }
      return 'float32x4';
    case 'temporal': {
      const temporalInfo = getArrowTemporalVectorInfo(source, field);
      if (!temporalInfo) throw new Error('Arrow temporal conversion requires a temporal type');
      return temporalInfo.variableLength ? 'vertex-list<float32>' : 'float32';
    }
    default:
      if (sourceFormat) return sourceFormat;
      if (semantic === 'numeric' && source instanceof Vector) {
        return getConvertedNumericFormat(source.type);
      }
      throw new Error(`Arrow direct conversion does not support ${getSourceTypeName(source)}`);
  }
}

function resolveConversionStrategy(
  source: ArrowGPUConversionSource,
  sourceFormat: GPUVectorFormat | undefined,
  targetFormat: GPUVectorFormat,
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>
): ArrowGPUConversionStrategy {
  if (semantic === 'color') {
    if (!sourceFormat || !areGPUFormatsByteCompatible(sourceFormat, targetFormat)) {
      return 'convert-color';
    }
    if (source instanceof GPUVector) return 'borrow';
    return sourceFormat === targetFormat ? 'upload' : 'reinterpret-upload';
  }
  if (semantic === 'matrix') {
    if (!sourceFormat) return 'convert-matrix';
    return source instanceof GPUVector ? 'borrow' : 'upload';
  }
  if (semantic === 'temporal') return 'convert-temporal';
  if (
    semantic === 'numeric' &&
    (!sourceFormat || !areGPUFormatsByteCompatible(sourceFormat, targetFormat))
  ) {
    if (source instanceof GPUVector) {
      throw new Error('GPU-resident numeric conversion does not support format-changing casts');
    }
    return 'convert-numeric';
  }
  if (source instanceof GPUVector) {
    if (sourceFormat !== targetFormat) {
      throw new Error('GPU-resident direct conversion requires an exact target format');
    }
    return 'borrow';
  }
  return sourceFormat === targetFormat ? 'upload' : 'reinterpret-upload';
}

function isCanonicalMatrixInfo(matrixInfo: ArrowMatrixVectorInfo): boolean {
  return (
    matrixInfo.valueType === 'float32' &&
    matrixInfo.order === 'column-major' &&
    matrixInfo.layout === 'wgsl-storage'
  );
}

function resolveConversionBackend(
  device: Device,
  strategy: ArrowGPUConversionStrategy,
  source: ArrowGPUConversionSource,
  policy: ArrowGPUConversionPolicy
): ArrowGPUConversionBackend {
  if (strategy === 'borrow') return 'none';
  if (strategy === 'upload' || strategy === 'reinterpret-upload') return 'upload';
  if (strategy === 'convert-matrix' && source instanceof Vector) return 'cpu';
  if (
    strategy === 'convert-numeric' &&
    source instanceof Vector &&
    device.type === 'webgpu' &&
    policy !== 'prefer-cpu' &&
    (getSourceFormat(source, 'numeric') || isArrowFloat64NumericType(source.type))
  ) {
    return 'webgpu';
  }
  if (strategy === 'convert-numeric') return 'cpu';
  if (strategy === 'convert-temporal' && policy === 'prefer-cpu') return 'cpu';
  if (device.type === 'webgpu') return 'webgpu';
  return 'cpu';
}

function validateConversionPolicy(
  strategy: ArrowGPUConversionStrategy,
  policy: ArrowGPUConversionPolicy
): void {
  if (policy === 'require-zero-copy' && strategy !== 'borrow') {
    throw new Error(`Arrow conversion requires ${strategy}; zero-copy was required`);
  }
  if (
    policy === 'require-direct' &&
    strategy !== 'borrow' &&
    strategy !== 'upload' &&
    strategy !== 'reinterpret-upload'
  ) {
    throw new Error(`Arrow conversion requires ${strategy}; direct conversion was required`);
  }
}

function validateConversionNullability(
  source: ArrowGPUConversionSource,
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>
): void {
  if (source instanceof GPUVector) return;
  const nullable = source.data.some(
    data => data.nullCount > 0 || data.children.some(child => child.nullCount > 0)
  );
  if (nullable && (semantic === 'matrix' || semantic === 'temporal')) {
    throw new Error(`Arrow ${semantic} conversion does not support nullable values`);
  }
  if (nullable && semantic === 'dictionary') {
    throw new Error('Arrow dictionary direct upload does not support nullable indices');
  }
}

function validateTargetFormats(options: ArrowGPUConversionOptions): void {
  if (options.format && options.formats) {
    throw new Error('Arrow conversion accepts either format or formats, not both');
  }
  if (options.formats?.length === 0) {
    throw new Error('Arrow conversion formats must not be empty');
  }
}

function areGPUFormatsByteCompatible(first: GPUVectorFormat, second: GPUVectorFormat): boolean {
  const firstInfo = getGPUVectorFormatInfo(first);
  const secondInfo = getGPUVectorFormatInfo(second);
  return (
    firstInfo.signedDataType === secondInfo.signedDataType &&
    firstInfo.components === secondInfo.components &&
    firstInfo.elementByteLength === secondInfo.elementByteLength &&
    firstInfo.byteLength === secondInfo.byteLength &&
    firstInfo.vertexList === secondInfo.vertexList &&
    firstInfo.valueList === secondInfo.valueList &&
    firstInfo.fixedSizeList === secondInfo.fixedSizeList &&
    firstInfo.listSize === secondInfo.listSize
  );
}

function areGPUFormatShapesCompatible(first: GPUVectorFormat, second: GPUVectorFormat): boolean {
  const firstInfo = getGPUVectorFormatInfo(first);
  const secondInfo = getGPUVectorFormatInfo(second);
  return (
    firstInfo.components === secondInfo.components &&
    firstInfo.vertexList === secondInfo.vertexList &&
    firstInfo.valueList === secondInfo.valueList &&
    firstInfo.fixedSizeList === secondInfo.fixedSizeList &&
    firstInfo.listSize === secondInfo.listSize
  );
}

function getSourceArrowType(source: ArrowGPUConversionSource): DataType | undefined {
  return (source instanceof GPUVector ? source.dataType : source.type) as DataType | undefined;
}

function getSourceTypeName(source: ArrowGPUConversionSource): string {
  const type = getSourceArrowType(source);
  return type
    ? String(type)
    : source instanceof GPUVector
      ? (source.format ?? 'GPUVector')
      : 'ArrowVector';
}

function getSourceChunkCount(source: ArrowGPUConversionSource): number {
  return source.data.length;
}

function getSourceByteLength(source: ArrowGPUConversionSource): number {
  if (source instanceof Vector) return getArrowVectorByteLength(source);
  return source.data.reduce((byteLength, data) => {
    const valueCount = data.valueLength || data.length;
    return byteLength + valueCount * data.byteStride;
  }, 0);
}

function estimateTargetByteLength(
  source: ArrowGPUConversionSource,
  targetFormat: GPUVectorFormat,
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>
): number {
  if (semantic === 'matrix') {
    const matrixInfo = getArrowMatrixVectorInfo(source)!;
    const columns = matrixInfo.columns;
    return source.length * columns * 4 * Float32Array.BYTES_PER_ELEMENT;
  }
  const formatInfo = getGPUVectorFormatInfo(targetFormat);
  const valueLength =
    formatInfo.vertexList || formatInfo.valueList
      ? source instanceof GPUVector
        ? source.valueLength
        : getArrowFlattenedValueLength(source)
      : source.length;
  return valueLength * formatInfo.byteLength;
}

function getArrowFlattenedValueLength(vector: Vector): number {
  return vector.data.reduce((length, data) => {
    if (!DataType.isList(data.type)) return length + data.length;
    const offsets = data.valueOffsets as Int32Array | undefined;
    return length + ((offsets?.[data.length] ?? 0) - (offsets?.[0] ?? 0));
  }, 0);
}

function getConvertedNumericFormat(type: DataType): GPUVectorFormat {
  const variableLength = DataType.isList(type);
  const elementType = variableLength ? type.children[0]?.type : type;
  if (!elementType) throw new Error(`Arrow numeric conversion does not support ${type}`);
  const fixedSize = DataType.isFixedSizeList(elementType) ? elementType.listSize : 1;
  const leafType = DataType.isFixedSizeList(elementType)
    ? elementType.children[0]?.type
    : elementType;
  if (
    !leafType ||
    (!DataType.isBool(leafType) && !DataType.isInt(leafType) && !DataType.isFloat(leafType))
  ) {
    throw new Error(`Arrow numeric conversion does not support ${type}`);
  }
  if (variableLength && fixedSize > 4) {
    throw new Error('Arrow variable-length numeric conversion supports at most four components');
  }
  const scalarFormat = DataType.isBool(leafType) ? 'uint8' : 'float32';
  if (variableLength) {
    const elementFormat = fixedSize === 1 ? scalarFormat : `${scalarFormat}x${fixedSize}`;
    return `vertex-list<${elementFormat}>` as GPUVectorFormat;
  }
  if (fixedSize > 4) return `fixed-size-list<${scalarFormat},${fixedSize}>`;
  return (fixedSize === 1 ? scalarFormat : `${scalarFormat}x${fixedSize}`) as GPUVectorFormat;
}

function convertArrowNumericVector(source: Vector, targetFormat: GPUVectorFormat): Vector {
  const targetType = makeConvertedNumericArrowType(source.type, targetFormat);
  const targetInfo = getGPUVectorFormatInfo(targetFormat);
  const outputData = source.data.map(sourceData => {
    const sourceChunk = new Vector([sourceData]);
    const rows = Array.from({length: sourceData.length}, (_, rowIndex) =>
      convertArrowNumericValue(sourceChunk.get(rowIndex), targetInfo)
    );
    return vectorFromArray(rows, targetType).data[0] as Data;
  });
  return new Vector(outputData);
}

/**
 * Uploads Arrow Float64 values without first visiting every value on the CPU, then uses the GPGPU
 * fround operation to produce adjacent high and residual-low Float32 lanes. The returned vector
 * exposes the high lanes with a strided view; the residual lanes remain in the same allocation for
 * fp64 consumers and diagnostics without requiring a second GPU pass.
 */
async function convertArrowFloat64VectorOnGPU(
  device: Device,
  source: Vector,
  plan: ArrowGPUConversionPlan,
  options: {name: string; bufferProps?: GPUVectorBufferProps}
): Promise<{vector: GPUVector; residualVector: GPUVector}> {
  const targetInfo = getGPUVectorFormatInfo(plan.targetFormat);
  const targetElementFormat = getGPUVectorElementFormat(plan.targetFormat);
  const targetElementInfo = getGPUVectorFormatInfo(targetElementFormat);
  if (targetElementInfo.signedDataType !== 'float32') {
    throw new Error('GPU Float64 conversion requires a Float32 target format');
  }

  const targetArrowType = makeConvertedNumericArrowType(source.type, plan.targetFormat);
  const flattened = targetInfo.vertexList || targetInfo.valueList;
  const componentCount =
    targetElementInfo.components * (targetInfo.fixedSizeList ? targetInfo.listSize! : 1);
  const outputData: GPUData[] = [];
  const residualData: GPUData[] = [];
  const outputBuffers: ReturnType<Device['createBuffer']>[] = [];

  try {
    for (const [chunkIndex, sourceData] of source.data.entries()) {
      const sourceValues = getArrowFloat64DataBufferSource(sourceData);
      const sourceBuffer = new DynamicBuffer(device, {
        ...options.bufferProps,
        id: `${options.name}-float64-source-${chunkIndex}`,
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...(sourceValues.byteLength > 0
          ? {data: sourceValues}
          : {byteLength: Float64Array.BYTES_PER_ELEMENT})
      });
      const sourceValueLength = flattened
        ? getArrowFlattenedDataValueLength(sourceData)
        : sourceData.length;
      const evaluator = new GPUDataEvaluator({
        id: `${options.name}-float64-source-${chunkIndex}`,
        type: 'uint32',
        size: componentCount * 2,
        buffer: sourceBuffer,
        offset: 0,
        stride: componentCount * Float64Array.BYTES_PER_ELEMENT,
        length: sourceValueLength
      });
      const split = fround(evaluator);
      const outputBuffer = device.createBuffer({
        ...options.bufferProps,
        id: `${options.name}-${chunkIndex}`,
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: Math.max(Float32Array.BYTES_PER_ELEMENT, split.byteLength)
      });
      outputBuffers.push(outputBuffer);
      split.setTargetBuffer({buffer: outputBuffer});
      try {
        await split.evaluate(device);
      } finally {
        split.destroy();
        evaluator.destroy();
        sourceBuffer.destroy();
      }

      const byteStride = componentCount * Float64Array.BYTES_PER_ELEMENT;
      const rowByteLength = componentCount * Float32Array.BYTES_PER_ELEMENT;
      const readbackMetadata = getArrowGPUDataReadbackMetadata(sourceData);
      const commonGPUDataProps = {
        buffer: outputBuffer,
        dataType: targetArrowType,
        format: plan.targetFormat,
        length: sourceData.length,
        valueLength: flattened ? sourceValueLength : undefined,
        stride: componentCount,
        byteStride,
        rowByteLength,
        nullBitmap: readbackMetadata?.nullBitmap,
        valueOffsets: sourceData.valueOffsets,
        ...(readbackMetadata
          ? {
              readbackMetadata: updateNumericReadbackMetadata(
                readbackMetadata,
                sourceValueLength * rowByteLength
              )
            }
          : {}),
        ...(flattened ? {valueByteLength: sourceValueLength * rowByteLength} : {})
      };
      outputData.push(
        new GPUData({
          ...commonGPUDataProps,
          ownsBuffer: true
        })
      );
      residualData.push(
        new GPUData({
          ...commonGPUDataProps,
          byteOffset: rowByteLength,
          ownsBuffer: false
        })
      );
    }
  } catch (error) {
    for (const data of outputData) data.destroy();
    for (const buffer of outputBuffers.slice(outputData.length)) buffer.destroy();
    throw error;
  }

  const vector = new GPUVector({
    type: 'data',
    name: options.name,
    dataType: targetArrowType,
    format: plan.targetFormat,
    data: outputData,
    ownsData: true
  });
  const residualVector = new GPUVector({
    type: 'data',
    name: `${options.name}64Low`,
    dataType: targetArrowType,
    format: plan.targetFormat,
    data: residualData,
    ownsData: false
  });
  return {vector, residualVector};
}

function getArrowFloat64DataBufferSource(data: Data): Float64Array {
  const values = DataType.isList(data.type)
    ? getArrowVariableLengthAttributeDataBufferSource(data as any)
    : getArrowDataBufferSource(data as any);
  if (!(values instanceof Float64Array)) {
    throw new Error('GPU Float64 conversion requires Float64 Arrow value storage');
  }
  return values;
}

function getArrowFlattenedDataValueLength(data: Data): number {
  if (!DataType.isList(data.type)) return data.length;
  const offsets = data.valueOffsets as Int32Array | undefined;
  return (offsets?.[data.length] ?? 0) - (offsets?.[0] ?? 0);
}

async function convertArrowNumericVectorOnGPU(
  device: Device,
  source: Vector,
  plan: ArrowGPUConversionPlan,
  options: {name: string; bufferProps?: GPUVectorBufferProps}
): Promise<GPUVector> {
  const sourceFormat = plan.sourceFormat;
  if (!sourceFormat) {
    throw new Error('GPU numeric conversion requires a directly uploadable source format');
  }
  const sourceElementFormat = getGPUVectorElementFormat(sourceFormat);
  const targetElementFormat = getGPUVectorElementFormat(plan.targetFormat);
  const sourceInfo = getGPUVectorFormatInfo(sourceFormat);
  const sourceElementInfo = getGPUVectorFormatInfo(sourceElementFormat);
  const targetInfo = getGPUVectorFormatInfo(plan.targetFormat);
  const targetElementInfo = getGPUVectorFormatInfo(targetElementFormat);
  const targetArrowType = makeConvertedNumericArrowType(source.type, plan.targetFormat);
  const uploaded = makeGPUVectorFromArrow(device, source, {
    ...options.bufferProps,
    name: `${options.name}-source`,
    format: sourceFormat,
    preserveDataChunks: true
  });
  const outputData: GPUData[] = [];
  const outputBuffers: ReturnType<Device['createBuffer']>[] = [];

  try {
    for (const [chunkIndex, sourceData] of uploaded.data.entries()) {
      const flattened = sourceInfo.vertexList || sourceInfo.valueList || sourceInfo.fixedSizeList;
      const evaluator = new GPUDataEvaluator({
        id: `${options.name}-source-${chunkIndex}`,
        type: sourceElementInfo.signedDataType,
        size: sourceElementInfo.components,
        normalized: sourceElementInfo.normalized,
        buffer: sourceData.buffer,
        format: sourceElementFormat,
        offset: sourceData.byteOffset,
        stride: flattened ? sourceElementInfo.elementByteLength : sourceData.byteStride,
        length: flattened ? sourceData.valueLength : sourceData.length
      });
      const converted = castData(evaluator, {
        inputFormat: sourceElementFormat,
        outputFormat: targetElementFormat
      });
      const outputBuffer = device.createBuffer({
        ...options.bufferProps,
        id: `${options.name}-${chunkIndex}`,
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: Math.max(4, converted.byteLength)
      });
      outputBuffers.push(outputBuffer);
      converted.setTargetBuffer({buffer: outputBuffer});
      try {
        await converted.evaluate(device, {format: targetElementFormat});
      } finally {
        converted.destroy();
        evaluator.destroy();
      }

      const variableLength = targetInfo.vertexList || targetInfo.valueList;
      const fixedSizeList = targetInfo.fixedSizeList;
      const byteStride =
        variableLength || fixedSizeList
          ? targetElementInfo.elementByteLength * (fixedSizeList ? targetInfo.listSize! : 1)
          : targetInfo.byteLength;
      outputData.push(
        new GPUData({
          buffer: outputBuffer,
          dataType: targetArrowType,
          format: plan.targetFormat,
          length: sourceData.length,
          valueLength: sourceData.valueLength,
          stride: targetInfo.components * (targetInfo.listSize ?? 1),
          byteStride,
          rowByteLength: byteStride,
          ownsBuffer: true,
          nullBitmap: sourceData.nullBitmap,
          valueOffsets: sourceData.valueOffsets,
          ...(sourceData.readbackMetadata
            ? {
                readbackMetadata: updateNumericReadbackMetadata(
                  sourceData.readbackMetadata,
                  converted.byteLength
                )
              }
            : {}),
          ...(variableLength ? {valueByteLength: converted.byteLength} : {})
        })
      );
    }
  } catch (error) {
    for (const data of outputData) data.destroy();
    for (const buffer of outputBuffers.slice(outputData.length)) buffer.destroy();
    throw error;
  } finally {
    uploaded.destroy();
  }

  return new GPUVector({
    type: 'data',
    name: options.name,
    dataType: targetArrowType,
    format: plan.targetFormat,
    data: outputData,
    ownsData: true
  });
}

function updateNumericReadbackMetadata(
  metadata: Record<string, unknown>,
  valueByteLength: number
): Record<string, unknown> {
  return metadata['kind'] === 'variable-length-attribute'
    ? {...metadata, valueByteLength}
    : metadata;
}

function makeConvertedNumericArrowType(
  sourceType: DataType,
  targetFormat: GPUVectorFormat
): DataType {
  const targetInfo = getGPUVectorFormatInfo(targetFormat);
  const targetLeafType = makeArrowTypeFromSignedDataType(targetInfo.signedDataType);
  return replaceArrowNumericLeafType(sourceType, targetLeafType);
}

function replaceArrowNumericLeafType(sourceType: DataType, targetLeafType: DataType): DataType {
  if (DataType.isList(sourceType)) {
    return new List(
      new Field(
        sourceType.children[0]?.name ?? 'item',
        replaceArrowNumericLeafType(sourceType.children[0].type, targetLeafType),
        true,
        new Map(sourceType.children[0]?.metadata)
      )
    );
  }
  if (DataType.isFixedSizeList(sourceType)) {
    return new FixedSizeList(
      sourceType.listSize,
      new Field(
        sourceType.children[0]?.name ?? 'item',
        targetLeafType,
        true,
        new Map(sourceType.children[0]?.metadata)
      )
    );
  }
  if (DataType.isBool(sourceType) || DataType.isInt(sourceType) || DataType.isFloat(sourceType)) {
    return targetLeafType;
  }
  throw new Error(`Arrow numeric conversion does not support ${sourceType}`);
}

function makeArrowTypeFromSignedDataType(
  type: ReturnType<typeof getGPUVectorFormatInfo>['signedDataType']
): DataType {
  switch (type) {
    case 'float16':
      return new Float16();
    case 'float32':
      return new Float32();
    case 'sint8':
      return new Int8();
    case 'sint16':
      return new Int16();
    case 'sint32':
      return new Int32();
    case 'uint8':
      return new Uint8();
    case 'uint16':
      return new Uint16();
    case 'uint32':
      return new Uint32();
  }
}

function convertArrowNumericValue(
  value: unknown,
  targetInfo: ReturnType<typeof getGPUVectorFormatInfo>
): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'bigint') {
    return convertArrowNumericScalar(value, targetInfo);
  }
  if (typeof value === 'object' && Symbol.iterator in value) {
    return Array.from(value as Iterable<unknown>, component =>
      convertArrowNumericValue(component, targetInfo)
    );
  }
  throw new Error('Arrow numeric conversion encountered a non-numeric value');
}

function convertArrowNumericScalar(
  value: boolean | number | bigint,
  targetInfo: ReturnType<typeof getGPUVectorFormatInfo>
): number {
  const numericValue = typeof value === 'boolean' ? Number(value) : Number(value);
  if (!Number.isFinite(numericValue)) return numericValue;
  if (!targetInfo.integer && !targetInfo.normalized) return numericValue;

  const {minimum, maximum} = getIntegerRange(targetInfo.signedDataType);
  const scaledValue = targetInfo.normalized
    ? numericValue * (targetInfo.signed ? maximum : maximum)
    : numericValue;
  return Math.round(Math.min(maximum, Math.max(minimum, scaledValue)));
}

function getIntegerRange(type: ReturnType<typeof getGPUVectorFormatInfo>['signedDataType']): {
  minimum: number;
  maximum: number;
} {
  switch (type) {
    case 'sint8':
      return {minimum: -127, maximum: 127};
    case 'sint16':
      return {minimum: -32767, maximum: 32767};
    case 'sint32':
      return {minimum: -2147483648, maximum: 2147483647};
    case 'uint8':
      return {minimum: 0, maximum: 255};
    case 'uint16':
      return {minimum: 0, maximum: 65535};
    case 'uint32':
      return {minimum: 0, maximum: 4294967295};
    default:
      throw new Error(`Arrow numeric integer conversion does not support ${type}`);
  }
}

function getConversionReasons(
  strategy: ArrowGPUConversionStrategy,
  semantic: Exclude<ArrowGPUConversionSemantic, 'auto'>,
  sourceFormat: GPUVectorFormat | undefined,
  targetFormat: GPUVectorFormat,
  backend: ArrowGPUConversionBackend
): string[] {
  switch (strategy) {
    case 'borrow':
      return ['source is already GPU-resident', 'source and target formats match'];
    case 'upload':
      return ['Arrow physical layout already matches the target GPU format'];
    case 'reinterpret-upload':
      return [`${sourceFormat} bytes are directly compatible with ${targetFormat}`];
    default:
      return [
        `${semantic} semantics require canonical ${targetFormat} output`,
        `${backend} conversion selected`
      ];
  }
}

function getConversionWarnings(
  source: ArrowGPUConversionSource,
  strategy: ArrowGPUConversionStrategy,
  targetFormat: GPUVectorFormat,
  backend: ArrowGPUConversionBackend
): string[] {
  const warnings: string[] = [];
  const sourceType = getSourceArrowType(source);
  const leafType = sourceType ? getArrowNumericLeafType(sourceType) : undefined;
  if (
    strategy === 'convert-numeric' &&
    leafType &&
    ((DataType.isFloat(leafType) && leafType.precision === 2) ||
      (DataType.isInt(leafType) && leafType.bitWidth === 64))
  ) {
    warnings.push(`64-bit source values are rounded to ${targetFormat}`);
  }
  if (strategy === 'convert-numeric' && getGPUVectorFormatInfo(targetFormat).normalized) {
    warnings.push(`values are clamped to the normalized ${targetFormat} range`);
  }
  if (strategy.startsWith('convert-') && backend === 'cpu') {
    warnings.push('conversion runs on the CPU for this source/device combination');
  }
  return warnings;
}

function getArrowNumericLeafType(type: DataType): DataType | undefined {
  if (DataType.isList(type) || DataType.isFixedSizeList(type)) {
    const childType = type.children[0]?.type;
    return childType ? getArrowNumericLeafType(childType) : undefined;
  }
  return DataType.isBool(type) || DataType.isInt(type) || DataType.isFloat(type) ? type : undefined;
}

function isArrowFloat64NumericType(type: DataType): boolean {
  return getArrowNumericLeafType(type) instanceof Float64;
}

function makePreparedArrowGPUVector(
  vector: GPUVector,
  plan: ArrowGPUConversionPlan,
  ownsVector: boolean,
  residualVector?: GPUVector
): PreparedArrowGPUVector {
  let destroyed = false;
  return {
    vector,
    plan,
    ...(residualVector ? {residualVector} : {}),
    ownsVector,
    destroy: () => {
      if (!ownsVector || destroyed) return;
      destroyed = true;
      residualVector?.destroy();
      vector.destroy();
    }
  };
}

function makePreparedMatrixResult(
  prepared: PreparedArrowMatrixGPUVector,
  plan: ArrowGPUConversionPlan
): PreparedArrowGPUVector {
  return {
    vector: prepared.vector,
    plan,
    matrixInfo: prepared.matrixInfo,
    ownsVector: true,
    destroy: prepared.destroy
  };
}

function makePreparedTemporalResult(
  prepared: PreparedArrowTemporalGPUVector,
  plan: ArrowGPUConversionPlan
): PreparedArrowGPUVector {
  return {
    vector: prepared.vector,
    plan,
    field: prepared.field,
    temporalInfo: prepared.temporalInfo,
    ownsVector: true,
    destroy: prepared.destroy
  };
}

function validateTableConversionSchema(schema: ArrowGPUTableConversionSchema): void {
  if (schema.columns.length === 0) {
    throw new Error('Arrow GPU table conversion schema requires at least one column');
  }
  const names = new Set<string>();
  for (const column of schema.columns) {
    if (!column.name || names.has(column.name)) {
      throw new Error(`Arrow GPU table conversion requires unique non-empty column names`);
    }
    names.add(column.name);
  }
}

function validatePreparedTableColumns(
  preparedColumns: readonly PreparedArrowGPUVector[],
  rowCount: number
): void {
  const first = preparedColumns[0];
  if (!first) throw new Error('Arrow GPU table conversion produced no columns');
  const chunkCount = first.vector.data.length;
  const chunkLengths = first.vector.data.map(data => data.length);
  for (const prepared of preparedColumns) {
    if (prepared.vector.length !== rowCount) {
      throw new Error('Arrow GPU table conversion requires source-aligned row counts');
    }
    if (
      prepared.vector.data.length !== chunkCount ||
      prepared.vector.data.some((data, index) => data.length !== chunkLengths[index])
    ) {
      throw new Error('Arrow GPU table conversion requires preserved, aligned chunk boundaries');
    }
  }
}

function captureStreamingTemporalOrigins(
  recordBatch: RecordBatch,
  schema: ArrowGPUTableConversionSchema,
  gpuBatch: GPURecordBatch,
  temporalOrigins: Map<string, number | bigint>
): void {
  for (const column of schema.columns) {
    if (column.temporal?.origin !== undefined || temporalOrigins.has(column.name)) continue;
    const sourcePath = column.source ?? column.name;
    const sourceVector = getArrowVectorByPath(recordBatch, sourcePath);
    const sourceField = getArrowFieldByPath(recordBatch, sourcePath);
    const temporalInfo = getArrowTemporalVectorInfo(sourceVector, column.field ?? sourceField);
    if (!temporalInfo) continue;
    const outputField = gpuBatch.schema.fields.find(field => field.name === column.name);
    const origin = outputField?.metadata?.get(TEMPORAL_ORIGIN_METADATA_KEY);
    if (origin !== undefined) {
      temporalOrigins.set(
        column.name,
        temporalInfo.bitWidth === 64 ? BigInt(origin) : Number(origin)
      );
    }
  }
}

function sumConversionCosts(costs: readonly ArrowGPUConversionCost[]): ArrowGPUConversionCost {
  return costs.reduce<ArrowGPUConversionCost>(
    (sum, cost) => ({
      sourceByteLength: sum.sourceByteLength + cost.sourceByteLength,
      targetByteLength: sum.targetByteLength + cost.targetByteLength,
      uploadCount: sum.uploadCount + cost.uploadCount,
      cpuPassCount: sum.cpuPassCount + cost.cpuPassCount,
      gpuPassCount: sum.gpuPassCount + cost.gpuPassCount,
      allocatesGPUStorage: sum.allocatesGPUStorage || cost.allocatesGPUStorage
    }),
    {
      sourceByteLength: 0,
      targetByteLength: 0,
      uploadCount: 0,
      cpuPassCount: 0,
      gpuPassCount: 0,
      allocatesGPUStorage: false
    }
  );
}
