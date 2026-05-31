// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {dggs} from '@luma.gl/shadertools';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  Float32,
  List,
  Uint64,
  Utf8,
  Vector
} from 'apache-arrow';
import {makeGPUVectorFromArrow} from './arrow-gpu-table-adapters';
import {getArrowUtf8DataBufferSource} from './arrow-gpu-data';

type DggsCellPathCoordinateType = List<FixedSizeList<Float32>>;
export type DggsCellPathCoordinateFormat = 'float32' | 'fp64-split';

/** DGGS cell key encodings accepted by the GPU key and polygon helpers. */
export type DggsCellEncoding = 'geohash' | 'quadkey' | 's2' | 'a5' | 'h3';

/** Options for expanding DGGS Uint64 cell keys into GPU polygon paths. */
export type DggsCellPathGPUVectorOptions = {
  /** Stable label used for transient and generated GPU resources. */
  id?: string;
  /** Input cell key encoding. */
  encoding: DggsCellEncoding;
  /**
   * Output coordinate layout. `fp64-split` emits [longitudeHigh, latitudeHigh,
   * longitudeLow, latitudeLow], but DGGS decoding currently computes Float32
   * coordinates so low components are zero.
   */
  coordinateFormat?: DggsCellPathCoordinateFormat;
};

/** Options for parsing UTF-8 DGGS cell keys into Uint64 GPU keys. */
export type DggsCellKeyGPUVectorOptions = {
  /** Stable label used for transient and generated GPU resources. */
  id?: string;
  /** Input cell key encoding. */
  encoding: DggsCellEncoding;
};

/** Prepared DGGS Uint64 keys plus transient allocation accounting. */
export type PreparedDggsCellKeyGPUVector = {
  /** GPU-only Uint64 keys, encoded for the selected DGGS format. */
  keys: GPUVector;
  /** Bytes in the generated key buffer. */
  keyByteLength: number;
  /** Bytes in transient string byte, offset, and config buffers. */
  transientByteLength: number;
  /** Releases owned generated GPU key resources. */
  destroy: () => void;
};

/** Prepared DGGS polygon paths plus generated allocation accounting. */
export type PreparedDggsCellPathGPUVector = {
  /** GPU-only List<FixedSizeList<Float32>[2|4]> path polygons, one row per cell key. */
  paths: GPUVector;
  /** Boundary points generated per input cell, including the closing point. */
  pointCount: number;
  /** Bytes in the generated path coordinate buffer. */
  pathByteLength: number;
  /** Bytes in transient compute input buffers. */
  transientByteLength: number;
  /** Releases owned generated GPU path resources. */
  destroy: () => void;
};

const DGGS_DEFAULT_CELL_POLYGON_POINT_COUNT = 5;
const DGGS_A5_CELL_POLYGON_POINT_COUNT = 6;
const DGGS_H3_CELL_POLYGON_POINT_COUNT = 7;
const GEOHASH_MAXIMUM_LENGTH = 12;
const GEOHASH_LENGTH_BIT_OFFSET = 60n;
const QUADKEY_MAXIMUM_LENGTH = 29;
const QUADKEY_LENGTH_BIT_OFFSET = 58n;
const A5_HEX_MAXIMUM_LENGTH = 16;
const H3_HEX_MAXIMUM_LENGTH = 16;
const UINT64_WORD_MASK = 0xffffffffn;
const GEOHASH_BASE32_CODES = '0123456789bcdefghjkmnpqrstuvwxyz';
const GEOHASH_BASE32_CODE_MAP = new Map<string, number>(
  Array.from(GEOHASH_BASE32_CODES, (character, index) => [character, index])
);

/**
 * Packs a geohash string into a Uint64 key consumed by the DGGS WGSL helpers.
 *
 * The high 4 bits store length and the low 60 bits store 5-bit base32 codes.
 */
export function packDggsGeohashKey(geohash: string): bigint {
  const normalizedGeohash = geohash.toLowerCase();
  if (normalizedGeohash.length < 1 || normalizedGeohash.length > GEOHASH_MAXIMUM_LENGTH) {
    throw new Error(`Geohash keys must contain 1-${GEOHASH_MAXIMUM_LENGTH} characters`);
  }

  let encodedValue = 0n;
  for (const character of normalizedGeohash) {
    const characterCode = GEOHASH_BASE32_CODE_MAP.get(character);
    if (characterCode === undefined) {
      throw new Error(`Invalid geohash character "${character}"`);
    }
    encodedValue = (encodedValue << 5n) | BigInt(characterCode);
  }
  return (BigInt(normalizedGeohash.length) << GEOHASH_LENGTH_BIT_OFFSET) | encodedValue;
}

/**
 * Packs a quadkey string into a Uint64 key consumed by the DGGS WGSL helpers.
 *
 * The high 6 bits store length and the low 58 bits store 2-bit base4 digits.
 */
export function packDggsQuadkeyKey(quadkey: string): bigint {
  if (quadkey.length < 1 || quadkey.length > QUADKEY_MAXIMUM_LENGTH) {
    throw new Error(`Quadkey keys must contain 1-${QUADKEY_MAXIMUM_LENGTH} digits`);
  }

  let encodedValue = 0n;
  for (const digitCharacter of quadkey) {
    const digit = digitCharacter.charCodeAt(0) - 48;
    if (digit < 0 || digit > 3) {
      throw new Error(`Invalid quadkey digit "${digitCharacter}"`);
    }
    encodedValue = (encodedValue << 2n) | BigInt(digit);
  }
  return (BigInt(quadkey.length) << QUADKEY_LENGTH_BIT_OFFSET) | encodedValue;
}

/** Creates an S2 CellId from a face and child-position digits, mainly for examples and tests. */
export function packDggsS2CellKey(face: number, childPositions: readonly number[]): bigint {
  if (!Number.isInteger(face) || face < 0 || face > 5) {
    throw new Error('S2 face must be an integer in [0, 5]');
  }
  if (childPositions.length > 30) {
    throw new Error('S2 child position arrays cannot exceed 30 levels');
  }

  let positionBits = 0n;
  for (const childPosition of childPositions) {
    if (!Number.isInteger(childPosition) || childPosition < 0 || childPosition > 3) {
      throw new Error('S2 child positions must be integers in [0, 3]');
    }
    positionBits = (positionBits << 2n) | BigInt(childPosition);
  }

  const level = BigInt(childPositions.length);
  const sentinelBitOffset = 2n * (30n - level);
  return (
    (BigInt(face) << 61n) | (positionBits << (sentinelBitOffset + 1n)) | (1n << sentinelBitOffset)
  );
}

/** Normalizes a native A5 Uint64 cell id from a bigint or hexadecimal string. */
export function packDggsA5CellKey(cellId: bigint | string): bigint {
  return packDggsHexCellKey(cellId, 'A5', A5_HEX_MAXIMUM_LENGTH);
}

/** Normalizes a native H3 Uint64 cell id from a bigint or hexadecimal string. */
export function packDggsH3CellKey(cellId: bigint | string): bigint {
  return packDggsHexCellKey(cellId, 'H3', H3_HEX_MAXIMUM_LENGTH);
}

function packDggsHexCellKey(
  cellId: bigint | string,
  encodingName: string,
  maximumHexLength: number
): bigint {
  if (typeof cellId === 'bigint') {
    return BigInt.asUintN(64, cellId);
  }

  const normalizedCellId = cellId.trim().replace(/^0x/i, '');
  if (normalizedCellId.length < 1 || normalizedCellId.length > maximumHexLength) {
    throw new Error(
      `${encodingName} cell ids must contain 1-${maximumHexLength} hexadecimal digits`
    );
  }
  if (!/^[0-9a-fA-F]+$/.test(normalizedCellId)) {
    throw new Error(`Invalid ${encodingName} cell id "${cellId}"`);
  }
  return BigInt.asUintN(64, BigInt(`0x${normalizedCellId}`));
}

/** Expands prepared DGGS Uint64 keys into closed Float32 polygon paths on WebGPU. */
export function prepareDggsCellPathGPUVector(
  device: Device,
  keys: Vector<Uint64> | GPUVector,
  options: DggsCellPathGPUVectorOptions
): PreparedDggsCellPathGPUVector {
  if (device.type !== 'webgpu') {
    throw new Error('prepareDggsCellPathGPUVector requires a WebGPU device');
  }

  const resourceIdentifier = options.id || `dggs-${options.encoding}-cell-polygons`;
  const cellPolygonPointCount = getDggsCellPolygonPointCount(options.encoding);
  const coordinateFormat = options.coordinateFormat || 'float32';
  const pathValueComponentCount = getDggsCellPathCoordinateComponentCount(coordinateFormat);
  const pathFormat = `vertex-list<float32x${pathValueComponentCount}>` as GPUVectorFormat;
  const pathType = makeDggsCellPathCoordinateType(pathValueComponentCount);
  const ownsKeyVector = !(keys instanceof GPUVector);
  const keyVector = ownsKeyVector
    ? makeGPUVectorFromArrow(device, keys, {
        id: `${resourceIdentifier}-keys`,
        name: `${options.encoding}Keys`
      })
    : keys;
  assertDggsCellKeyVector(keyVector, 'prepareDggsCellPathGPUVector');

  const pathDataChunks: Array<GPUData> = [];
  let pathByteLength = 0;
  let transientByteLength = ownsKeyVector ? getUint64KeyVectorByteLength(keyVector) : 0;

  for (const [chunkIndex, keyData] of keyVector.data.entries()) {
    const valueOffsets = makeFixedCellPathValueOffsets(keyData.length, cellPolygonPointCount);
    const generatedPathByteLength =
      keyData.length *
      cellPolygonPointCount *
      pathValueComponentCount *
      Float32Array.BYTES_PER_ELEMENT;
    const pathValuesBuffer = new DynamicBuffer(device, {
      id: `${resourceIdentifier}-path-values-${chunkIndex}`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: Math.max(generatedPathByteLength, Float32Array.BYTES_PER_ELEMENT)
    });
    const extractionConfigBuffer = device.createBuffer({
      id: `${resourceIdentifier}-config-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array([keyData.length])
    });

    dispatchDggsCellPathExtractionCompute(device, {
      resourceIdentifier: `${resourceIdentifier}-${chunkIndex}`,
      encoding: options.encoding,
      coordinateFormat,
      keys: getGPUDataBinding(keyData, keyData.length * keyData.byteStride),
      extractionConfig: extractionConfigBuffer,
      pathValues: pathValuesBuffer,
      cellCount: keyData.length
    });

    extractionConfigBuffer.destroy();
    transientByteLength += Uint32Array.BYTES_PER_ELEMENT;
    pathByteLength += generatedPathByteLength;
    pathDataChunks.push(
      new GPUData({
        buffer: pathValuesBuffer,
        dataType: pathType,
        format: pathFormat,
        length: keyData.length,
        stride: pathValueComponentCount,
        byteStride: pathValueComponentCount * Float32Array.BYTES_PER_ELEMENT,
        rowByteLength: pathValueComponentCount * Float32Array.BYTES_PER_ELEMENT,
        ownsBuffer: true,
        readbackMetadata: {
          kind: 'variable-length-attribute',
          valueOffsets,
          nullCount: 0,
          valueByteLength: generatedPathByteLength
        }
      })
    );
  }

  if (ownsKeyVector) {
    keyVector.destroy();
  }

  const paths = new GPUVector({
    type: 'data',
    name: 'paths',
    dataType: pathType,
    format: pathFormat,
    data: pathDataChunks,
    stride: pathValueComponentCount,
    byteStride: pathValueComponentCount * Float32Array.BYTES_PER_ELEMENT,
    rowByteLength: pathValueComponentCount * Float32Array.BYTES_PER_ELEMENT,
    ownsData: true
  });
  let destroyed = false;

  return {
    paths,
    pointCount: cellPolygonPointCount,
    pathByteLength,
    transientByteLength,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      paths.destroy();
    }
  };
}

/** Parses UTF-8 DGGS cell keys into GPU-only Uint64 keys on WebGPU. */
export function prepareDggsCellKeyGPUVector(
  device: Device,
  strings: Vector<Utf8>,
  options: DggsCellKeyGPUVectorOptions
): PreparedDggsCellKeyGPUVector {
  if (device.type !== 'webgpu') {
    throw new Error('prepareDggsCellKeyGPUVector requires a WebGPU device');
  }
  if (!DataType.isUtf8(strings.type)) {
    throw new Error('prepareDggsCellKeyGPUVector requires a Vector<Utf8>');
  }

  const resourceIdentifier = options.id || `dggs-${options.encoding}-cell-keys`;
  const keyType = new Uint64();
  const keyDataChunks: Array<GPUData> = [];
  let keyByteLength = 0;
  let transientByteLength = 0;

  for (const [chunkIndex, stringData] of strings.data.entries()) {
    const stringBytes = getArrowUtf8DataBufferSource(stringData as Data<Utf8>);
    const stringOffsets = getNormalizedUtf8Offsets(stringData as Data<Utf8>);
    const packedStringBytes = packUtf8BytesAsUint32Words(stringBytes);
    const stringBytesBuffer = device.createBuffer({
      id: `${resourceIdentifier}-string-bytes-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: packedStringBytes
    });
    const stringOffsetsBuffer = device.createBuffer({
      id: `${resourceIdentifier}-string-offsets-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(stringOffsets.buffer, stringOffsets.byteOffset, stringOffsets.length)
    });
    const stringConfigBuffer = device.createBuffer({
      id: `${resourceIdentifier}-string-config-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array([stringData.length])
    });
    const keyBufferByteLength = stringData.length * BigUint64Array.BYTES_PER_ELEMENT;
    const keyBuffer = new DynamicBuffer(device, {
      id: `${resourceIdentifier}-keys-${chunkIndex}`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: Math.max(keyBufferByteLength, BigUint64Array.BYTES_PER_ELEMENT)
    });

    dispatchDggsCellKeyParsingCompute(device, {
      resourceIdentifier: `${resourceIdentifier}-${chunkIndex}`,
      encoding: options.encoding,
      stringBytes: stringBytesBuffer,
      stringOffsets: stringOffsetsBuffer,
      stringConfig: stringConfigBuffer,
      keys: keyBuffer,
      stringCount: stringData.length
    });

    stringBytesBuffer.destroy();
    stringOffsetsBuffer.destroy();
    stringConfigBuffer.destroy();

    keyByteLength += keyBufferByteLength;
    transientByteLength +=
      packedStringBytes.byteLength + stringOffsets.byteLength + Uint32Array.BYTES_PER_ELEMENT;
    keyDataChunks.push(
      new GPUData({
        buffer: keyBuffer,
        dataType: keyType,
        format: 'uint32x2',
        length: stringData.length,
        stride: 1,
        byteStride: BigUint64Array.BYTES_PER_ELEMENT,
        rowByteLength: BigUint64Array.BYTES_PER_ELEMENT,
        ownsBuffer: true
      })
    );
  }

  const keys = new GPUVector({
    type: 'data',
    name: `${options.encoding}Keys`,
    dataType: keyType,
    format: 'uint32x2',
    data: keyDataChunks,
    stride: 1,
    byteStride: BigUint64Array.BYTES_PER_ELEMENT,
    rowByteLength: BigUint64Array.BYTES_PER_ELEMENT,
    ownsData: true
  });
  let destroyed = false;

  return {
    keys,
    keyByteLength,
    transientByteLength,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      keys.destroy();
    }
  };
}

function dispatchDggsCellPathExtractionCompute(
  device: Device,
  props: {
    resourceIdentifier: string;
    encoding: DggsCellEncoding;
    coordinateFormat: DggsCellPathCoordinateFormat;
    keys: Binding;
    extractionConfig: Buffer;
    pathValues: DynamicBuffer;
    cellCount: number;
  }
): void {
  const computation = new Computation(device, {
    id: `${props.resourceIdentifier}-extract`,
    source: getDggsCellPathExtractionSource(props.encoding, props.coordinateFormat),
    modules: [dggs],
    shaderLayout: {
      bindings: [
        {name: 'dggsCellKeys', type: 'read-only-storage', group: 0, location: 0},
        {name: 'dggsCellExtractionConfig', type: 'read-only-storage', group: 0, location: 1},
        {name: 'dggsCellPathValues', type: 'storage', group: 0, location: 2}
      ]
    },
    bindings: {
      dggsCellKeys: props.keys,
      dggsCellExtractionConfig: props.extractionConfig,
      dggsCellPathValues: props.pathValues
    }
  });
  if (props.cellCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(props.cellCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

function dispatchDggsCellKeyParsingCompute(
  device: Device,
  props: {
    resourceIdentifier: string;
    encoding: DggsCellEncoding;
    stringBytes: Buffer;
    stringOffsets: Buffer;
    stringConfig: Buffer;
    keys: DynamicBuffer;
    stringCount: number;
  }
): void {
  const computation = new Computation(device, {
    id: `${props.resourceIdentifier}-parse`,
    source: getDggsCellKeyParsingSource(props.encoding),
    modules: [dggs],
    shaderLayout: {
      bindings: [
        {name: 'dggsStringBytes', type: 'read-only-storage', group: 0, location: 0},
        {name: 'dggsStringOffsets', type: 'read-only-storage', group: 0, location: 1},
        {name: 'dggsStringParsingConfig', type: 'read-only-storage', group: 0, location: 2},
        {name: 'dggsParsedKeys', type: 'storage', group: 0, location: 3}
      ]
    },
    bindings: {
      dggsStringBytes: props.stringBytes,
      dggsStringOffsets: props.stringOffsets,
      dggsStringParsingConfig: props.stringConfig,
      dggsParsedKeys: props.keys
    }
  });
  if (props.stringCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(props.stringCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

function getDggsCellPathExtractionSource(
  encoding: DggsCellEncoding,
  coordinateFormat: DggsCellPathCoordinateFormat
): string {
  const boundaryFunction = getDggsBoundaryFunction(encoding, coordinateFormat);
  const cellPolygonPointCount = getDggsCellPolygonPointCount(encoding);
  const pathValueType = coordinateFormat === 'fp64-split' ? 'vec4f' : 'vec2f';
  return /* wgsl */ `\
@group(0) @binding(0) var<storage, read> dggsCellKeys : array<vec2u>;
@group(0) @binding(1) var<storage, read> dggsCellExtractionConfig : array<u32>;
@group(0) @binding(2) var<storage, read_write> dggsCellPathValues : array<${pathValueType}>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId : vec3u) {
  let cellIndex = globalInvocationId.x;
  if (cellIndex >= dggsCellExtractionConfig[0]) {
    return;
  }

  let cellKey = dggs_u64_from_little_endian_words(dggsCellKeys[cellIndex]);
  let pathStart = cellIndex * ${cellPolygonPointCount}u;
  var pointIndex = 0u;
  loop {
    if (pointIndex >= ${cellPolygonPointCount}u) {
      break;
    }
    dggsCellPathValues[pathStart + pointIndex] = ${boundaryFunction}(cellKey, pointIndex);
    pointIndex += 1u;
  }
}
`;
}

function getDggsBoundaryFunction(
  encoding: DggsCellEncoding,
  coordinateFormat: DggsCellPathCoordinateFormat
): string {
  const suffix = coordinateFormat === 'fp64-split' ? '_fp64_split' : '';
  switch (encoding) {
    case 'geohash':
      return `dggs_geohash_get_boundary_point${suffix}`;
    case 'quadkey':
      return `dggs_quadkey_get_boundary_point${suffix}`;
    case 's2':
      return `dggs_s2_get_boundary_point${suffix}`;
    case 'a5':
      return `dggs_a5_get_boundary_point${suffix}`;
    case 'h3':
      return `dggs_h3_get_boundary_point${suffix}`;
  }
}

function getDggsCellKeyParsingSource(encoding: DggsCellEncoding): string {
  const parsingFunction = getDggsStringParsingFunction(encoding);
  return /* wgsl */ `\
@group(0) @binding(0) var<storage, read> dggsStringBytes : array<u32>;
@group(0) @binding(1) var<storage, read> dggsStringOffsets : array<u32>;
@group(0) @binding(2) var<storage, read> dggsStringParsingConfig : array<u32>;
@group(0) @binding(3) var<storage, read_write> dggsParsedKeys : array<vec2u>;

fn dggs_read_string_byte(byteIndex: u32) -> u32 {
  let word = dggsStringBytes[byteIndex / 4u];
  return (word >> ((byteIndex % 4u) * 8u)) & 0xffu;
}

fn dggs_get_lowercase_ascii(byte: u32) -> u32 {
  if (byte >= 65u && byte <= 90u) {
    return byte + 32u;
  }
  return byte;
}

fn dggs_get_geohash_character_code(byte: u32) -> u32 {
  let lowercaseByte = dggs_get_lowercase_ascii(byte);
  if (lowercaseByte >= 48u && lowercaseByte <= 57u) {
    return lowercaseByte - 48u;
  }
  if (lowercaseByte >= 98u && lowercaseByte <= 104u) {
    return lowercaseByte - 88u;
  }
  if (lowercaseByte >= 106u && lowercaseByte <= 107u) {
    return lowercaseByte - 89u;
  }
  if (lowercaseByte >= 109u && lowercaseByte <= 110u) {
    return lowercaseByte - 90u;
  }
  if (lowercaseByte >= 112u && lowercaseByte <= 122u) {
    return lowercaseByte - 91u;
  }
  return 0u;
}

fn dggs_get_hex_character_code(byte: u32) -> u32 {
  let lowercaseByte = dggs_get_lowercase_ascii(byte);
  if (lowercaseByte >= 48u && lowercaseByte <= 57u) {
    return lowercaseByte - 48u;
  }
  if (lowercaseByte >= 97u && lowercaseByte <= 102u) {
    return lowercaseByte - 87u;
  }
  return 0u;
}

fn dggs_get_hex_character_code_or_invalid(byte: u32) -> u32 {
  let lowercaseByte = dggs_get_lowercase_ascii(byte);
  if (lowercaseByte >= 48u && lowercaseByte <= 57u) {
    return lowercaseByte - 48u;
  }
  if (lowercaseByte >= 97u && lowercaseByte <= 102u) {
    return lowercaseByte - 87u;
  }
  return 16u;
}

fn dggs_parse_geohash_string(startOffset: u32, endOffset: u32) -> vec2u {
  let stringLength = min(endOffset - startOffset, ${GEOHASH_MAXIMUM_LENGTH}u);
  var key = vec2u(0u);
  var characterIndex = 0u;
  loop {
    if (characterIndex >= stringLength) {
      break;
    }
    let characterCode = dggs_get_geohash_character_code(
      dggs_read_string_byte(startOffset + characterIndex)
    );
    key = dggs_u64_shift_left(key, 5u) | vec2u(0u, characterCode);
    characterIndex += 1u;
  }
  return dggs_u64_set_bits(key, ${GEOHASH_LENGTH_BIT_OFFSET}u, 4u, stringLength);
}

fn dggs_parse_quadkey_string(startOffset: u32, endOffset: u32) -> vec2u {
  let stringLength = min(endOffset - startOffset, ${QUADKEY_MAXIMUM_LENGTH}u);
  var key = vec2u(0u);
  var characterIndex = 0u;
  loop {
    if (characterIndex >= stringLength) {
      break;
    }
    let byte = dggs_read_string_byte(startOffset + characterIndex);
    var digit = 0u;
    if (byte >= 48u && byte <= 51u) {
      digit = byte - 48u;
    }
    key = dggs_u64_shift_left(key, 2u) | vec2u(0u, digit);
    characterIndex += 1u;
  }
  return dggs_u64_set_bits(key, ${QUADKEY_LENGTH_BIT_OFFSET}u, 6u, stringLength);
}

fn dggs_parse_s2_token_string(startOffset: u32, endOffset: u32) -> vec2u {
  let stringLength = endOffset - startOffset;
  if (stringLength == 1u) {
    let byte = dggs_get_lowercase_ascii(dggs_read_string_byte(startOffset));
    if (byte == 120u) {
      return vec2u(0u);
    }
  }

  var key = vec2u(0u);
  var characterIndex = 0u;
  loop {
    if (characterIndex >= 16u) {
      break;
    }
    var digit = 0u;
    if (characterIndex < stringLength) {
      digit = dggs_get_hex_character_code(dggs_read_string_byte(startOffset + characterIndex));
    }
    key = dggs_u64_shift_left(key, 4u) | vec2u(0u, digit);
    characterIndex += 1u;
  }
  return key;
}

fn dggs_parse_a5_hex_string(startOffset: u32, endOffset: u32) -> vec2u {
  var firstOffset = startOffset;
  if (endOffset - firstOffset >= 2u) {
    let firstByte = dggs_read_string_byte(firstOffset);
    let secondByte = dggs_get_lowercase_ascii(dggs_read_string_byte(firstOffset + 1u));
    if (firstByte == 48u && secondByte == 120u) {
      firstOffset += 2u;
    }
  }

  let stringLength = endOffset - firstOffset;
  if (stringLength == 0u || stringLength > ${A5_HEX_MAXIMUM_LENGTH}u) {
    return vec2u(0u);
  }

  var key = vec2u(0u);
  var characterIndex = 0u;
  loop {
    if (characterIndex >= stringLength) {
      break;
    }
    let digit = dggs_get_hex_character_code_or_invalid(
      dggs_read_string_byte(firstOffset + characterIndex)
    );
    if (digit >= 16u) {
      return vec2u(0u);
    }
    key = dggs_u64_shift_left(key, 4u) | vec2u(0u, digit);
    characterIndex += 1u;
  }
  return key;
}

fn dggs_parse_h3_hex_string(startOffset: u32, endOffset: u32) -> vec2u {
  return dggs_parse_a5_hex_string(startOffset, endOffset);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId : vec3u) {
  let stringIndex = globalInvocationId.x;
  if (stringIndex >= dggsStringParsingConfig[0]) {
    return;
  }

  let startOffset = dggsStringOffsets[stringIndex];
  let endOffset = dggsStringOffsets[stringIndex + 1u];
  let key = ${parsingFunction}(startOffset, endOffset);
  dggsParsedKeys[stringIndex] = dggs_u64_to_little_endian_words(key);
}
`;
}

function getDggsStringParsingFunction(encoding: DggsCellEncoding): string {
  switch (encoding) {
    case 'geohash':
      return 'dggs_parse_geohash_string';
    case 'quadkey':
      return 'dggs_parse_quadkey_string';
    case 's2':
      return 'dggs_parse_s2_token_string';
    case 'a5':
      return 'dggs_parse_a5_hex_string';
    case 'h3':
      return 'dggs_parse_h3_hex_string';
  }
}

function makeDggsCellPathCoordinateType(componentCount: number): DggsCellPathCoordinateType {
  const coordinateType = new FixedSizeList(
    componentCount,
    new Field('values', new Float32(), false)
  );
  return new List(new Field('coordinates', coordinateType, false));
}

function getDggsCellPathCoordinateComponentCount(
  coordinateFormat: DggsCellPathCoordinateFormat
): number {
  return coordinateFormat === 'fp64-split' ? 4 : 2;
}

function makeFixedCellPathValueOffsets(cellCount: number, pointCount: number): Int32Array {
  const valueOffsets = new Int32Array(cellCount + 1);
  for (let cellIndex = 0; cellIndex <= cellCount; cellIndex++) {
    valueOffsets[cellIndex] = cellIndex * pointCount;
  }
  return valueOffsets;
}

function getDggsCellPolygonPointCount(encoding: DggsCellEncoding): number {
  switch (encoding) {
    case 'a5':
      return DGGS_A5_CELL_POLYGON_POINT_COUNT;
    case 'h3':
      return DGGS_H3_CELL_POLYGON_POINT_COUNT;
    default:
      return DGGS_DEFAULT_CELL_POLYGON_POINT_COUNT;
  }
}

function assertDggsCellKeyVector(keys: GPUVector, callerName: string): void {
  if (!DataType.isInt(keys.type) || keys.type.bitWidth !== 64 || keys.type.isSigned !== false) {
    throw new Error(`${callerName} requires Uint64 keys`);
  }
}

function getUint64KeyVectorByteLength(keys: GPUVector): number {
  return keys.data.reduce((byteLength, data) => byteLength + data.length * data.byteStride, 0);
}

/** Splits a Uint64 DGGS key into low/high Uint32 words for WGSL `vec2<u32>` inputs. */
export function getDggsUint64Words(value: bigint): [number, number] {
  const normalizedValue = BigInt.asUintN(64, value);
  return [
    Number(normalizedValue & UINT64_WORD_MASK),
    Number((normalizedValue >> 32n) & UINT64_WORD_MASK)
  ];
}

function getGPUDataBinding(data: GPUData, size?: number): Binding {
  return {
    buffer: getGPUDataBuffer(data),
    offset: data.byteOffset,
    ...(size && size > 0 ? {size} : {})
  };
}

function getGPUDataBuffer(data: GPUData): Buffer {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}

function getNormalizedUtf8Offsets(data: Data<Utf8>): Uint32Array {
  const sourceOffsets = data.valueOffsets as Int32Array | undefined;
  const normalizedOffsets = new Uint32Array(data.length + 1);
  if (!sourceOffsets) {
    return normalizedOffsets;
  }
  // Arrow exposes Utf8 valueOffsets as the logical row slice for data.offset.
  const firstOffset = sourceOffsets[0] ?? 0;
  for (let offsetIndex = 0; offsetIndex <= data.length; offsetIndex++) {
    normalizedOffsets[offsetIndex] = Math.max(
      0,
      (sourceOffsets[offsetIndex] ?? firstOffset) - firstOffset
    );
  }
  return normalizedOffsets;
}

function packUtf8BytesAsUint32Words(bytes: Uint8Array): Uint32Array {
  const packedWords = new Uint32Array(Math.max(1, Math.ceil(bytes.length / 4)));
  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
    const wordIndex = byteIndex >> 2;
    packedWords[wordIndex] =
      (packedWords[wordIndex] ?? 0) | ((bytes[byteIndex] ?? 0) << ((byteIndex & 3) * 8));
  }
  return packedWords;
}
