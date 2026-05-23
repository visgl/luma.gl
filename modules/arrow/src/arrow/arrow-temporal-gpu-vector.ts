// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {
  Data,
  DataType,
  DateUnit,
  Date_,
  Duration,
  Field,
  Float32,
  List,
  Time,
  TimeUnit,
  Timestamp,
  Vector,
  makeData
} from 'apache-arrow';
import {makeArrowGPUVector} from './arrow-gpu-table-adapters';

/** Supported Arrow temporal logical kinds. */
export type ArrowTemporalKind = 'date' | 'time' | 'timestamp' | 'duration';
/** Supported Arrow temporal source units. */
export type ArrowTemporalUnit = 'day' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond';
/** Temporal origin selection policy retained in output metadata. */
export type ArrowTemporalOriginPolicy = 'first-valid' | 'zero';
/** Supported non-interval Arrow temporal leaf types. */
export type ArrowTemporalType = Date_ | Time | Timestamp | Duration;
/** Supported scalar or variable-length Arrow temporal columns. */
export type ArrowTemporalColumnType = ArrowTemporalType | List<ArrowTemporalType>;
/** Prepared relative temporal output types. */
export type ArrowRelativeTemporalType = Float32 | List<Float32>;

/** Arrow field metadata key for the prepared temporal logical kind. */
export const TEMPORAL_KIND_METADATA_KEY = 'visgl:temporal-kind';
/** Arrow field metadata key for the prepared temporal source unit. */
export const TEMPORAL_UNIT_METADATA_KEY = 'visgl:temporal-unit';
/** Arrow field metadata key for the prepared temporal source origin. */
export const TEMPORAL_ORIGIN_METADATA_KEY = 'visgl:temporal-origin';
/** Arrow field metadata key for the prepared temporal origin policy. */
export const TEMPORAL_ORIGIN_POLICY_METADATA_KEY = 'visgl:temporal-origin-policy';
/** Arrow field metadata key for the prepared timestamp timezone, when present. */
export const TEMPORAL_TIMEZONE_METADATA_KEY = 'visgl:temporal-timezone';

/** Metadata recovered from one supported Arrow temporal column. */
export type ArrowTemporalVectorInfo = {
  /** Logical Arrow temporal kind. */
  kind: ArrowTemporalKind;
  /** Source Arrow temporal unit retained by prepared values. */
  unit: ArrowTemporalUnit;
  /** Whether the source/output rows are variable-length list leaves. */
  variableLength: boolean;
  /** Physical source Arrow temporal scalar width. */
  bitWidth: 32 | 64;
  /** Timestamp timezone when the source Arrow type carries one. */
  timezone?: string | null;
  /** Persisted or selected relative temporal origin in source units. */
  origin?: number | bigint;
  /** Persisted or selected origin policy. */
  originPolicy?: ArrowTemporalOriginPolicy;
};

/** Options used when preparing one Arrow temporal column for GPU consumption. */
export type PrepareArrowTemporalGPUVectorOptions = {
  /** Stable prepared GPU vector name. Defaults to `temporal`. */
  name?: string;
  /** Stable resource id prefix. Defaults to the vector name. */
  id?: string;
  /** Optional Arrow field carrying previously persisted temporal metadata. */
  field?: Field;
  /** Override or seed the relative-time origin in source units. */
  origin?: number | bigint | string;
  /** Prefer WebGPU compute when available. Defaults to `true` on WebGPU devices. */
  preferGPU?: boolean;
};

/** Options used when preparing several named Arrow temporal columns together. */
export type PrepareArrowTemporalGPUVectorsOptions = {
  /** Per-column preparation options keyed by source column name. */
  columns?: Record<string, Omit<PrepareArrowTemporalGPUVectorOptions, 'name'>>;
};

/** Prepared relative Float32 temporal GPU vector plus persisted metadata. */
export type PreparedArrowTemporalGPUVector = {
  /** Prepared relative Float32 GPU vector. */
  temporal: GPUVector<ArrowRelativeTemporalType>;
  /** Alias for callers that prefer the generic vector name. */
  vector: GPUVector<ArrowRelativeTemporalType>;
  /** Output Arrow field carrying prepared temporal metadata. */
  field: Field;
  /** Recovered source temporal metadata and chosen origin. */
  temporalInfo: ArrowTemporalVectorInfo & {
    origin: number | bigint;
    originPolicy: ArrowTemporalOriginPolicy;
  };
  /** Releases owned GPU resources. */
  destroy: () => void;
};

type ArrowTemporalSource = Vector<ArrowTemporalColumnType> | GPUVector<ArrowTemporalColumnType>;

type TemporalListGPUReadbackMetadata = {
  kind: 'temporal-list';
  valueOffsets: Int32Array;
  valueByteLength: number;
};

const makeFloat32Data = makeData as (props: {
  type: Float32;
  length: number;
  data: Float32Array;
}) => Data<Float32>;

const makeFloat32ListData = makeData as (props: {
  type: List<Float32>;
  length: number;
  nullCount: number;
  nullBitmap: null;
  valueOffsets: Int32Array;
  child: Data<Float32>;
}) => Data<List<Float32>>;

const TEMPORAL_PREPARE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'sourceTemporalValues', type: 'read-only-storage', group: 0, location: 0},
    {name: 'temporalPrepareConfig', type: 'read-only-storage', group: 0, location: 1},
    {name: 'preparedTemporalValues', type: 'storage', group: 0, location: 2}
  ],
  attributes: []
};

/** Recover supported temporal metadata from one Arrow scalar or list column. */
export function getArrowTemporalVectorInfo(
  vector: Pick<Vector, 'type'> | Pick<GPUVector, 'type'>,
  field?: Field
): ArrowTemporalVectorInfo | null {
  const leafType = getArrowTemporalLeafType(vector.type);
  if (!leafType) {
    return null;
  }
  const leafField = getArrowTemporalLeafField(vector.type, field);
  const metadata = leafField?.metadata;
  return {
    ...getArrowTemporalLeafInfo(leafType),
    variableLength: DataType.isList(vector.type),
    ...(metadata?.has(TEMPORAL_ORIGIN_METADATA_KEY)
      ? {origin: parseTemporalOrigin(metadata.get(TEMPORAL_ORIGIN_METADATA_KEY)!, leafType)}
      : {}),
    ...(metadata?.has(TEMPORAL_ORIGIN_POLICY_METADATA_KEY)
      ? {
          originPolicy: metadata.get(
            TEMPORAL_ORIGIN_POLICY_METADATA_KEY
          ) as ArrowTemporalOriginPolicy
        }
      : {})
  };
}

/** Prepare one scalar or variable-length Arrow temporal column as relative Float32 GPU values. */
export async function prepareArrowTemporalGPUVector(
  device: Device,
  source: ArrowTemporalSource,
  options: PrepareArrowTemporalGPUVectorOptions = {}
): Promise<PreparedArrowTemporalGPUVector> {
  const sourceInfo = getRequiredArrowTemporalVectorInfo(source, options.field);
  const origin = resolveTemporalOrigin(source, sourceInfo, options);
  const temporalInfo = {
    ...sourceInfo,
    origin,
    originPolicy: sourceInfo.kind === 'duration' ? 'zero' : 'first-valid'
  } satisfies PreparedArrowTemporalGPUVector['temporalInfo'];
  const field = makePreparedArrowTemporalField(source, temporalInfo, options.field);
  const name = options.name || 'temporal';
  const id = options.id || name;
  const preferGPU = options.preferGPU ?? device.type === 'webgpu';

  if (preferGPU && device.type === 'webgpu') {
    const sourceVector =
      source instanceof GPUVector
        ? source
        : makeArrowTemporalSourceGPUVector(device, source, {name: `${name}-source`, id});
    const ownsSourceVector = !(source instanceof GPUVector);
    try {
      return await prepareArrowTemporalGPUVectorOnGPU(device, sourceVector, temporalInfo, field, {
        name,
        id
      });
    } finally {
      if (ownsSourceVector) {
        sourceVector.destroy();
      }
    }
  }

  if (source instanceof GPUVector) {
    throw new Error(
      'prepareArrowTemporalGPUVector requires WebGPU for GPU-resident temporal input'
    );
  }

  const preparedVector = makePreparedArrowTemporalVector(source, temporalInfo, field);
  const temporal = makeArrowGPUVector(device, preparedVector, {name, id});
  return createPreparedArrowTemporalGPUVector(temporal, field, temporalInfo, true);
}

/** Prepare several named temporal columns with the same scalar/list normalization rules. */
export async function prepareArrowTemporalGPUVectors(
  device: Device,
  sourceVectors: Record<string, ArrowTemporalSource>,
  options: PrepareArrowTemporalGPUVectorsOptions = {}
): Promise<Record<string, PreparedArrowTemporalGPUVector>> {
  assertArrowTemporalVectorAlignment(sourceVectors);
  const entries = await Promise.all(
    Object.entries(sourceVectors).map(async ([name, source]) => {
      const prepared = await prepareArrowTemporalGPUVector(device, source, {
        name,
        ...(options.columns?.[name] || {})
      });
      return [name, prepared] as const;
    })
  );
  return Object.fromEntries(entries);
}

function assertArrowTemporalVectorAlignment(
  sourceVectors: Record<string, ArrowTemporalSource>
): void {
  const entries = Object.entries(sourceVectors);
  const [referenceName, referenceVector] = entries[0] || [];
  if (!referenceName || !referenceVector) {
    return;
  }
  for (const [name, vector] of entries.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `prepareArrowTemporalGPUVectors ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(
        `prepareArrowTemporalGPUVectors ${name} batch count must match ${referenceName} batch count`
      );
    }
  }
}

function createPreparedArrowTemporalGPUVector(
  temporal: GPUVector<ArrowRelativeTemporalType>,
  field: Field,
  temporalInfo: PreparedArrowTemporalGPUVector['temporalInfo'],
  ownsTemporal: boolean
): PreparedArrowTemporalGPUVector {
  let destroyed = false;
  return {
    temporal,
    vector: temporal,
    field,
    temporalInfo,
    destroy: () => {
      if (!ownsTemporal || destroyed) {
        return;
      }
      destroyed = true;
      temporal.destroy();
    }
  };
}

async function prepareArrowTemporalGPUVectorOnGPU(
  device: Device,
  source: GPUVector<ArrowTemporalColumnType>,
  temporalInfo: PreparedArrowTemporalGPUVector['temporalInfo'],
  field: Field,
  options: Required<Pick<PrepareArrowTemporalGPUVectorOptions, 'name' | 'id'>>
): Promise<PreparedArrowTemporalGPUVector> {
  const outputType = getPreparedArrowTemporalType(field);
  const outputData: GPUData<ArrowRelativeTemporalType>[] = [];
  const transientResources: Array<{destroy: () => void}> = [];

  for (const [chunkIndex, sourceData] of source.data.entries()) {
    const temporalValueOffsets = getTemporalValueOffsets(source.type, sourceData);
    const scalarCount = temporalValueOffsets
      ? (temporalValueOffsets[temporalValueOffsets.length - 1] ?? 0)
      : sourceData.length;
    const configBuffer = device.createBuffer({
      id: `${options.id}-temporal-config-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: makeTemporalPrepareConfig(temporalInfo, scalarCount)
    });
    const outputBuffer = new DynamicBuffer(device, {
      id: `${options.id}-temporal-values-${chunkIndex}`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: Math.max(
        Float32Array.BYTES_PER_ELEMENT,
        scalarCount * Float32Array.BYTES_PER_ELEMENT
      )
    });
    dispatchArrowTemporalPreparation(device, temporalInfo, {
      id: options.id,
      chunkIndex,
      scalarCount,
      sourceTemporalValues: getGPUDataBinding(sourceData, getTemporalSourceByteLength(sourceData)),
      temporalPrepareConfig: configBuffer,
      preparedTemporalValues: outputBuffer
    });
    outputData.push(
      new GPUData({
        buffer: outputBuffer,
        dataType: outputType,
        length: sourceData.length,
        stride: 1,
        byteStride: Float32Array.BYTES_PER_ELEMENT,
        rowByteLength: Float32Array.BYTES_PER_ELEMENT,
        ownsBuffer: true,
        ...(temporalValueOffsets
          ? {
              readbackMetadata: {
                kind: 'variable-length-attribute',
                valueOffsets: temporalValueOffsets,
                nullCount: 0,
                valueByteLength: scalarCount * Float32Array.BYTES_PER_ELEMENT
              }
            }
          : {})
      })
    );
    transientResources.push(configBuffer);
  }

  await waitForSubmittedWork(device);
  for (const resource of transientResources) {
    resource.destroy();
  }

  const temporal = new GPUVector({
    type: 'data',
    name: options.name,
    dataType: outputType,
    data: outputData,
    stride: 1,
    byteStride: Float32Array.BYTES_PER_ELEMENT,
    rowByteLength: Float32Array.BYTES_PER_ELEMENT,
    ownsData: true
  });
  return createPreparedArrowTemporalGPUVector(temporal, field, temporalInfo, true);
}

function makeArrowTemporalSourceGPUVector(
  device: Device,
  source: Vector<ArrowTemporalColumnType>,
  options: Required<Pick<PrepareArrowTemporalGPUVectorOptions, 'name' | 'id'>>
): GPUVector<ArrowTemporalColumnType> {
  const sourceInfo = getRequiredArrowTemporalVectorInfo(source);
  const data = source.data.map((sourceData, chunkIndex) => {
    validateArrowTemporalData(sourceData);
    const sourceValues = getArrowTemporalDataBufferSource(sourceData);
    const byteStride = sourceInfo.bitWidth / 8;
    return new GPUData({
      buffer: new DynamicBuffer(device, {
        id: `${options.id}-temporal-source-values-${chunkIndex}`,
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        data: sourceValues
      }),
      dataType: sourceData.type as ArrowTemporalColumnType,
      length: sourceData.length,
      stride: 1,
      byteStride,
      rowByteLength: byteStride,
      ownsBuffer: true,
      ...(DataType.isList(sourceData.type)
        ? {
            readbackMetadata: {
              kind: 'temporal-list',
              valueOffsets: getNormalizedArrowValueOffsets(sourceData as Data<List<any>>),
              valueByteLength: sourceValues.byteLength
            } satisfies TemporalListGPUReadbackMetadata
          }
        : {})
    });
  });
  return new GPUVector({
    type: 'data',
    name: options.name,
    dataType: source.type,
    data,
    stride: 1,
    byteStride: sourceInfo.bitWidth / 8,
    rowByteLength: sourceInfo.bitWidth / 8,
    ownsData: true
  });
}

function makePreparedArrowTemporalVector(
  source: Vector<ArrowTemporalColumnType>,
  temporalInfo: PreparedArrowTemporalGPUVector['temporalInfo'],
  field: Field
): Vector<ArrowRelativeTemporalType> {
  const outputType = getPreparedArrowTemporalType(field);
  const outputData = source.data.map(sourceData => {
    validateArrowTemporalData(sourceData);
    const sourceValues = getArrowTemporalDataBufferSource(sourceData);
    const preparedValues = new Float32Array(sourceValues.length);
    for (let valueIndex = 0; valueIndex < sourceValues.length; valueIndex++) {
      preparedValues[valueIndex] = getRelativeTemporalValue(
        sourceValues[valueIndex]!,
        temporalInfo.origin
      );
    }

    if (DataType.isList(outputType)) {
      const childData = makeFloat32Data({
        type: new Float32(),
        length: preparedValues.length,
        data: preparedValues
      });
      return makeFloat32ListData({
        type: outputType,
        length: sourceData.length,
        nullCount: 0,
        nullBitmap: null,
        valueOffsets: getNormalizedArrowValueOffsets(sourceData as Data<List<any>>),
        child: childData
      });
    }

    return makeFloat32Data({
      type: outputType,
      length: preparedValues.length,
      data: preparedValues
    });
  });
  return new Vector<ArrowRelativeTemporalType>(outputData as Data<ArrowRelativeTemporalType>[]);
}

function makePreparedArrowTemporalField(
  source: ArrowTemporalSource,
  temporalInfo: PreparedArrowTemporalGPUVector['temporalInfo'],
  sourceField?: Field
): Field {
  const metadata = makeArrowTemporalMetadata(
    temporalInfo,
    getArrowTemporalLeafField(source.type, sourceField)?.metadata
  );
  const sourceLeafField = getArrowTemporalLeafField(source.type, sourceField);
  const outputType = makePreparedArrowTemporalType(
    source.type,
    new Field(sourceLeafField?.name || 'value', new Float32(), false, metadata)
  );
  return new Field(sourceField?.name || 'temporal', outputType, false, metadata);
}

function makePreparedArrowTemporalType(
  sourceType: ArrowTemporalColumnType,
  leafField: Field
): ArrowRelativeTemporalType {
  if (DataType.isList(sourceType)) {
    return new List(leafField);
  }
  return new Float32();
}

function getPreparedArrowTemporalType(field: Field): ArrowRelativeTemporalType {
  return field.type as ArrowRelativeTemporalType;
}

function makeArrowTemporalMetadata(
  temporalInfo: PreparedArrowTemporalGPUVector['temporalInfo'],
  sourceMetadata?: Map<string, string>
): Map<string, string> {
  const metadata = new Map(sourceMetadata);
  metadata.set(TEMPORAL_KIND_METADATA_KEY, temporalInfo.kind);
  metadata.set(TEMPORAL_UNIT_METADATA_KEY, temporalInfo.unit);
  metadata.set(TEMPORAL_ORIGIN_METADATA_KEY, temporalInfo.origin.toString());
  metadata.set(TEMPORAL_ORIGIN_POLICY_METADATA_KEY, temporalInfo.originPolicy);
  if (temporalInfo.timezone) {
    metadata.set(TEMPORAL_TIMEZONE_METADATA_KEY, temporalInfo.timezone);
  }
  return metadata;
}

function resolveTemporalOrigin(
  source: ArrowTemporalSource,
  temporalInfo: ArrowTemporalVectorInfo,
  options: PrepareArrowTemporalGPUVectorOptions
): number | bigint {
  if (options.origin !== undefined) {
    return parseTemporalOrigin(options.origin.toString(), getArrowTemporalLeafType(source.type)!);
  }
  if (temporalInfo.origin !== undefined) {
    return temporalInfo.origin;
  }
  if (temporalInfo.kind === 'duration') {
    return temporalInfo.bitWidth === 64 ? 0n : 0;
  }
  if (source instanceof GPUVector) {
    throw new Error(
      'GPU-resident absolute temporal input requires an explicit or persisted origin'
    );
  }
  return getFirstArrowTemporalValue(source) ?? (temporalInfo.bitWidth === 64 ? 0n : 0);
}

function getFirstArrowTemporalValue(
  source: Vector<ArrowTemporalColumnType>
): number | bigint | undefined {
  for (const data of source.data) {
    validateArrowTemporalData(data);
    const values = getArrowTemporalDataBufferSource(data);
    if (values.length > 0) {
      return values[0]!;
    }
  }
  return undefined;
}

function getRequiredArrowTemporalVectorInfo(
  vector: Pick<Vector, 'type'> | Pick<GPUVector, 'type'>,
  field?: Field
): ArrowTemporalVectorInfo {
  const temporalInfo = getArrowTemporalVectorInfo(vector, field);
  if (!temporalInfo) {
    throw new Error(
      'prepareArrowTemporalGPUVector requires Date, Time, Timestamp, Duration, or List thereof'
    );
  }
  return temporalInfo;
}

function getArrowTemporalLeafType(type: DataType): ArrowTemporalType | null {
  const leafType = DataType.isList(type) ? type.children[0]?.type : type;
  return leafType &&
    (DataType.isDate(leafType) ||
      DataType.isTime(leafType) ||
      DataType.isTimestamp(leafType) ||
      DataType.isDuration(leafType))
    ? (leafType as ArrowTemporalType)
    : null;
}

function getArrowTemporalLeafField(type: DataType, field?: Field): Field | undefined {
  return DataType.isList(type) ? type.children[0] : field;
}

function getArrowTemporalLeafInfo(
  type: ArrowTemporalType
): Omit<ArrowTemporalVectorInfo, 'variableLength'> {
  if (DataType.isDate(type)) {
    return {
      kind: 'date',
      unit: type.unit === DateUnit.DAY ? 'day' : 'millisecond',
      bitWidth: type.unit === DateUnit.DAY ? 32 : 64
    };
  }
  if (DataType.isTime(type)) {
    return {
      kind: 'time',
      unit: getArrowTimeUnit(type.unit),
      bitWidth: type.bitWidth
    };
  }
  if (DataType.isTimestamp(type)) {
    return {
      kind: 'timestamp',
      unit: getArrowTimeUnit(type.unit),
      bitWidth: 64,
      timezone: type.timezone
    };
  }
  return {
    kind: 'duration',
    unit: getArrowTimeUnit(type.unit),
    bitWidth: 64
  };
}

function getArrowTimeUnit(unit: TimeUnit): Exclude<ArrowTemporalUnit, 'day'> {
  switch (unit) {
    case TimeUnit.SECOND:
      return 'second';
    case TimeUnit.MILLISECOND:
      return 'millisecond';
    case TimeUnit.MICROSECOND:
      return 'microsecond';
    case TimeUnit.NANOSECOND:
      return 'nanosecond';
  }
}

function parseTemporalOrigin(origin: string, type: ArrowTemporalType): number | bigint {
  return getArrowTemporalLeafInfo(type).bitWidth === 64 ? BigInt(origin) : Number(origin);
}

function getRelativeTemporalValue(value: number | bigint, origin: number | bigint): number {
  return typeof value === 'bigint'
    ? Number(value - (origin as bigint))
    : value - (origin as number);
}

function validateArrowTemporalData(data: Data<ArrowTemporalColumnType>): void {
  if (data.nullCount > 0) {
    throw new Error('prepareArrowTemporalGPUVector does not support nullable temporal rows');
  }
  if (DataType.isList(data.type) && (data.children[0]?.nullCount ?? 0) > 0) {
    throw new Error('prepareArrowTemporalGPUVector does not support nullable temporal values');
  }
}

function getArrowTemporalDataBufferSource(
  data: Data<ArrowTemporalColumnType>
): Int32Array | BigInt64Array {
  if (DataType.isList(data.type)) {
    const childData = data.children[0] as Data<ArrowTemporalType> | undefined;
    if (!childData) {
      return new Int32Array(0);
    }
    const values = childData.values as Int32Array | BigInt64Array | undefined;
    if (!values) {
      return childData.type.ArrayType === BigInt64Array ? new BigInt64Array(0) : new Int32Array(0);
    }
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    if (!valueOffsets) {
      throw new Error('prepareArrowTemporalGPUVector list input requires Arrow value offsets');
    }
    // Arrow exposes valueOffsets as the logical row slice for data.offset; only child values
    // still need their physical child offset applied when copying flattened temporal leaves.
    const firstValueOffset = valueOffsets[0] ?? 0;
    const lastValueOffset = valueOffsets[data.length] ?? firstValueOffset;
    const childValueOffset = childData.offset ?? 0;
    return values.subarray(
      childValueOffset + firstValueOffset,
      childValueOffset + lastValueOffset
    ) as Int32Array | BigInt64Array;
  }
  return getArrowTemporalScalarDataBufferSource(data as Data<ArrowTemporalType>);
}

function getArrowTemporalScalarDataBufferSource(
  data: Data<ArrowTemporalType>
): Int32Array | BigInt64Array {
  const values = data.values as Int32Array | BigInt64Array | undefined;
  if (!values) {
    return data.type.ArrayType === BigInt64Array ? new BigInt64Array(0) : new Int32Array(0);
  }
  const startIndex = data.offset ?? 0;
  return values.subarray(startIndex, startIndex + data.length) as Int32Array | BigInt64Array;
}

function getNormalizedArrowValueOffsets(data: Data<List<any>>): Int32Array {
  const valueOffsets = data.valueOffsets as Int32Array | undefined;
  if (!valueOffsets) {
    throw new Error('prepareArrowTemporalGPUVector list input requires Arrow value offsets');
  }
  // Arrow exposes valueOffsets as the logical row slice for data.offset.
  const firstValueOffset = valueOffsets[0] ?? 0;
  return Int32Array.from(valueOffsets, valueOffset => valueOffset - firstValueOffset);
}

function getTemporalValueOffsets(
  type: ArrowTemporalColumnType,
  data: GPUData<ArrowTemporalColumnType>
): Int32Array | undefined {
  if (!DataType.isList(type)) {
    return undefined;
  }
  const metadata = data.readbackMetadata as TemporalListGPUReadbackMetadata | undefined;
  if (metadata?.kind !== 'temporal-list') {
    throw new Error('GPU-resident temporal list input requires copied Arrow value offsets');
  }
  return metadata.valueOffsets;
}

function getTemporalSourceByteLength(data: GPUData<ArrowTemporalColumnType>): number {
  const metadata = data.readbackMetadata as TemporalListGPUReadbackMetadata | undefined;
  return metadata?.kind === 'temporal-list'
    ? metadata.valueByteLength
    : data.length * data.byteStride;
}

function makeTemporalPrepareConfig(
  temporalInfo: PreparedArrowTemporalGPUVector['temporalInfo'],
  scalarCount: number
): Uint32Array {
  const originWords = toTemporalOriginWords(temporalInfo.origin, temporalInfo.bitWidth);
  return new Uint32Array([scalarCount, originWords[0], originWords[1]]);
}

function toTemporalOriginWords(origin: number | bigint, bitWidth: 32 | 64): [number, number] {
  if (bitWidth === 32) {
    return [new Uint32Array(new Int32Array([origin as number]).buffer)[0]!, 0];
  }
  const normalizedOrigin = BigInt.asUintN(64, origin as bigint);
  return [Number(normalizedOrigin & 0xffffffffn), Number((normalizedOrigin >> 32n) & 0xffffffffn)];
}

function dispatchArrowTemporalPreparation(
  device: Device,
  temporalInfo: PreparedArrowTemporalGPUVector['temporalInfo'],
  props: {
    id: string;
    chunkIndex: number;
    scalarCount: number;
    sourceTemporalValues: Binding;
    temporalPrepareConfig: Binding;
    preparedTemporalValues: Binding;
  }
): void {
  const computation = new Computation(device, {
    id: `${props.id}-temporal-prepare-${props.chunkIndex}`,
    source: getArrowTemporalPrepareSource(temporalInfo.bitWidth),
    shaderLayout: TEMPORAL_PREPARE_SHADER_LAYOUT,
    bindings: {
      sourceTemporalValues: props.sourceTemporalValues,
      temporalPrepareConfig: props.temporalPrepareConfig,
      preparedTemporalValues: props.preparedTemporalValues
    }
  });
  if (props.scalarCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(props.scalarCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

function getArrowTemporalPrepareSource(bitWidth: 32 | 64): string {
  const sourceType = bitWidth === 64 ? 'array<vec2<u32>>' : 'array<i32>';
  const readRelativeValue =
    bitWidth === 64
      ? `
fn readRelativeTemporalValue(scalarIndex : u32) -> f32 {
  let valueBits = sourceTemporalValues[scalarIndex];
  let originBits = vec2<u32>(temporalPrepareConfig[1], temporalPrepareConfig[2]);
  let deltaLow = valueBits.x - originBits.x;
  let borrow = select(0u, 1u, valueBits.x < originBits.x);
  let deltaHigh = valueBits.y - originBits.y - borrow;
  let isNegative = (deltaHigh & 0x80000000u) != 0u;
  var magnitudeLow = deltaLow;
  var magnitudeHigh = deltaHigh;
  if (isNegative) {
    magnitudeLow = ~deltaLow + 1u;
    let carry = select(0u, 1u, magnitudeLow == 0u);
    magnitudeHigh = ~deltaHigh + carry;
  }
  let magnitude = f32(magnitudeHigh) * 4294967296.0 + f32(magnitudeLow);
  return select(magnitude, -magnitude, isNegative);
}
`
      : `
fn readRelativeTemporalValue(scalarIndex : u32) -> f32 {
  return f32(sourceTemporalValues[scalarIndex] - bitcast<i32>(temporalPrepareConfig[1]));
}
`;
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read> sourceTemporalValues : ${sourceType};
@group(0) @binding(1) var<storage, read> temporalPrepareConfig : array<u32>;
@group(0) @binding(2) var<storage, read_write> preparedTemporalValues : array<f32>;

${readRelativeValue}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let scalarIndex = globalInvocationId.x;
  if (scalarIndex >= temporalPrepareConfig[0]) {
    return;
  }
  preparedTemporalValues[scalarIndex] = readRelativeTemporalValue(scalarIndex);
}
`;
}

function getGPUDataBinding(data: GPUData<any>, size: number): Binding {
  return {
    buffer: data.buffer.buffer,
    offset: data.byteOffset,
    ...(size > 0 ? {size} : {})
  };
}

async function waitForSubmittedWork(device: Device): Promise<void> {
  const queue = (
    device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
  ).handle?.queue;
  await queue?.onSubmittedWorkDone?.();
}
