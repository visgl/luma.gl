// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/core';
import {
  Buffer,
  Device,
  type BufferLayout,
  type VertexFormat,
  vertexFormatDecoder
} from '@luma.gl/core';
import {GPURecordBatch, GPUTable, GPUTableGeometry, GPUVector} from '@luma.gl/tables';
import {Binary, DataType, Float, Int, Precision, Table, Vector} from 'apache-arrow';
import type {ArrowMeshTable, ArrowMeshTopology} from './arrow-mesh-types';

export type ArrowTableGeometryProps = {
  /**
   * Mesh Arrow wrapper or raw Apache Arrow table.
   *
   * Wrapped tables may carry topology and top-level index accessor metadata.
   * Raw tables use schema metadata key `topology` when present and otherwise
   * default to `triangle-list`.
   */
  arrowMesh: ArrowMeshTable | Table;
  /** Name of the generated interleaved vertex buffer. Defaults to `geometry`. */
  bufferName?: string;
  /**
   * Whether to pack vertex attributes into one buffer.
   *
   * Defaults to `true`. When `false`, each selected Mesh Arrow attribute is
   * uploaded as its own vertex buffer.
   */
  interleaved?: boolean;
  /**
   * Maps output shader attribute names to Arrow column names.
   *
   * When omitted, common glTF mesh semantics are normalized automatically:
   * `POSITION` -> `positions`, `NORMAL` -> `normals`, `COLOR_0` -> `colors`,
   * `TEXCOORD_0` -> `texCoords`, and `TEXCOORD_1` -> `texCoords1`.
   */
  arrowPaths?: Record<string, string>;
};

type ArrowMeshAttributeData = {
  sourceName: string;
  attributeName: string;
  dataType: DataType;
  value: TypedArray;
  size: number;
  format: VertexFormat;
  normalized?: boolean;
};

type InterleavedAttribute = ArrowMeshAttributeData & {
  byteOffset: number;
  byteLength: number;
};

const DEFAULT_TOPOLOGY: ArrowMeshTopology = 'triangle-list';
const DEFAULT_BUFFER_NAME = 'geometry';
const MIN_ATTRIBUTE_ALIGNMENT = 4;
const INDEX_COLUMN_NAME = 'indices';

/**
 * GPU table geometry derived from a loaders.gl-compatible Mesh Arrow table.
 *
 * `ArrowTableGeometry` parses Mesh Arrow input, creates a static `GPUTable`,
 * and exposes that table through the generic `GPUTableGeometry` surface.
 */
export class ArrowTableGeometry extends GPUTableGeometry {
  /** Creates GPU geometry from Mesh Arrow input. */
  constructor(device: Device, props: ArrowTableGeometryProps) {
    const {arrowMesh, interleaved = true, bufferName = DEFAULT_BUFFER_NAME, arrowPaths} = props;
    const table = getArrowMeshTable(arrowMesh);
    const topology = getArrowMeshTopology(arrowMesh, table);
    const attributes = getArrowMeshAttributes(table, arrowPaths);
    const indexData = getArrowMeshIndices(arrowMesh, table);
    const indices = indexData && device.createBuffer({usage: Buffer.INDEX, data: indexData});
    const vertexCount = indexData?.length ?? table.numRows;
    const gpuTable = interleaved
      ? createInterleavedGPUTable(device, attributes, bufferName, table.numRows)
      : createSeparateGPUTable(device, attributes, table.numRows);

    super({
      table: gpuTable,
      topology,
      vertexCount,
      indices,
      ownsTable: true
    });
  }
}

/** Creates GPU table geometry directly from Mesh Arrow input. */
export function makeGPUGeometryFromArrow(
  device: Device,
  props: ArrowTableGeometryProps
): ArrowTableGeometry {
  return new ArrowTableGeometry(device, props);
}

function getArrowMeshTable(arrowMesh: ArrowMeshTable | Table): Table {
  return arrowMesh instanceof Table ? arrowMesh : arrowMesh.data;
}

function getArrowMeshTopology(arrowMesh: ArrowMeshTable | Table, table: Table): ArrowMeshTopology {
  const topology =
    arrowMesh instanceof Table ? table.schema.metadata.get('topology') : arrowMesh.topology;

  switch (topology) {
    case 'point-list':
    case 'triangle-list':
    case 'triangle-strip':
      return topology;
    default:
      return DEFAULT_TOPOLOGY;
  }
}

function getArrowMeshAttributes(
  table: Table,
  arrowPaths?: Record<string, string>
): ArrowMeshAttributeData[] {
  const attributes: ArrowMeshAttributeData[] = [];
  const positionVector = table.getChild('POSITION');
  if (!positionVector) {
    throw new Error('ArrowTableGeometry requires a POSITION column');
  }

  const requestedColumns = new Set(Object.values(arrowPaths || {}));
  for (const field of table.schema.fields) {
    if (field.name === INDEX_COLUMN_NAME) {
      continue;
    }
    if (requestedColumns.size > 0 && !requestedColumns.has(field.name)) {
      continue;
    }

    const vector = table.getChild(field.name);
    if (!vector) {
      continue;
    }
    const attributeName = getMappedAttributeName(field.name, arrowPaths);
    const normalized = parseBooleanMetadata(field.metadata.get('normalized'));
    const attribute = getArrowMeshAttributeData(field.name, attributeName, vector, normalized);
    attributes.push(attribute);
  }

  return attributes;
}

function getMappedAttributeName(sourceName: string, arrowPaths?: Record<string, string>): string {
  if (arrowPaths) {
    for (const [attributeName, arrowPath] of Object.entries(arrowPaths)) {
      if (arrowPath === sourceName) {
        return attributeName;
      }
    }
  }

  switch (sourceName) {
    case 'POSITION':
      return 'positions';
    case 'NORMAL':
      return 'normals';
    case 'COLOR_0':
      return 'colors';
    case 'TEXCOORD_0':
      return 'texCoords';
    case 'TEXCOORD_1':
      return 'texCoords1';
    default:
      return sourceName;
  }
}

function getArrowMeshAttributeData(
  sourceName: string,
  attributeName: string,
  vector: Vector,
  normalized?: boolean
): ArrowMeshAttributeData {
  const {childType, size} = getArrowAttributeType(vector.type, sourceName);
  const value = getArrowAttributeValues(vector, childType, size);
  const format = getArrowAttributeVertexFormat(childType, size, normalized);

  return {
    sourceName,
    attributeName,
    dataType: vector.type,
    value,
    size,
    format,
    normalized
  };
}

function getArrowAttributeType(
  type: DataType,
  sourceName: string
): {childType: Int | Float; size: 1 | 2 | 3 | 4} {
  if (DataType.isFixedSizeList(type)) {
    const listSize = type.listSize;
    if (listSize < 1 || listSize > 4) {
      throw new Error(
        `ArrowTableGeometry column "${sourceName}" list size must be between 1 and 4`
      );
    }
    const childType = type.children[0].type;
    if (!DataType.isInt(childType) && !DataType.isFloat(childType)) {
      throw new Error(`ArrowTableGeometry column "${sourceName}" must contain numeric values`);
    }
    validateSupportedNumericType(sourceName, childType);
    return {childType, size: listSize as 1 | 2 | 3 | 4};
  }

  if (DataType.isInt(type) || DataType.isFloat(type)) {
    validateSupportedNumericType(sourceName, type);
    return {childType: type, size: 1};
  }

  throw new Error(
    `ArrowTableGeometry column "${sourceName}" must be numeric or FixedSizeList numeric`
  );
}

function validateSupportedNumericType(sourceName: string, type: Int | Float): void {
  if (DataType.isInt(type) && type.bitWidth === 64) {
    throw new Error(`ArrowTableGeometry column "${sourceName}" cannot use 64-bit integer values`);
  }
  if (DataType.isFloat(type) && type.precision === Precision.DOUBLE) {
    throw new Error(`ArrowTableGeometry column "${sourceName}" cannot use float64 values`);
  }
}

function getArrowAttributeValues(vector: Vector, childType: Int | Float, size: number): TypedArray {
  const values = makeTypedArray(childType, vector.length * size);
  let targetOffset = 0;

  for (const data of vector.data) {
    const source = DataType.isFixedSizeList(vector.type) ? data.children[0].values : data.values;
    const sourceOffset = DataType.isFixedSizeList(vector.type) ? data.offset * size : data.offset;
    const sourceLength = data.length * size;
    values.set(
      source.subarray(sourceOffset, sourceOffset + sourceLength) as TypedArray,
      targetOffset
    );
    targetOffset += sourceLength;
  }

  return values;
}

function makeTypedArray(type: Int | Float, length: number): TypedArray {
  if (DataType.isInt(type)) {
    if (type.isSigned) {
      switch (type.bitWidth) {
        case 8:
          return new Int8Array(length);
        case 16:
          return new Int16Array(length);
        case 32:
          return new Int32Array(length);
      }
    } else {
      switch (type.bitWidth) {
        case 8:
          return new Uint8Array(length);
        case 16:
          return new Uint16Array(length);
        case 32:
          return new Uint32Array(length);
      }
    }
  } else {
    switch (type.precision) {
      case Precision.HALF:
        return new Uint16Array(length);
      case Precision.SINGLE:
        return new Float32Array(length);
    }
  }

  throw new Error(`ArrowTableGeometry does not support Arrow type ${type}`);
}

function getArrowAttributeVertexFormat(
  type: Int | Float,
  size: 1 | 2 | 3 | 4,
  normalized?: boolean
): VertexFormat {
  if (DataType.isFloat(type)) {
    switch (type.precision) {
      case Precision.HALF:
        return vertexFormatDecoder.makeVertexFormat('float16', size, false);
      case Precision.SINGLE:
        return vertexFormatDecoder.makeVertexFormat('float32', size, false);
    }
  }

  if (DataType.isInt(type)) {
    const signedDataType = `${type.isSigned ? 'sint' : 'uint'}${type.bitWidth}` as
      | 'sint8'
      | 'uint8'
      | 'sint16'
      | 'uint16'
      | 'sint32'
      | 'uint32';
    return vertexFormatDecoder.makeVertexFormat(signedDataType, size, normalized);
  }

  throw new Error(`ArrowTableGeometry does not support Arrow type ${type}`);
}

function getArrowMeshIndices(
  arrowMesh: ArrowMeshTable | Table,
  table: Table
): Uint16Array | Uint32Array | null {
  const indexVector = table.getChild(INDEX_COLUMN_NAME);
  if (!indexVector && !(arrowMesh instanceof Table) && arrowMesh.indices) {
    return normalizeIndexArray(Array.from(arrowMesh.indices.value, Number));
  }
  if (!indexVector) {
    return null;
  }
  if (!DataType.isList(indexVector.type)) {
    throw new Error('ArrowTableGeometry indices column must be a List column');
  }

  const childType = indexVector.type.children[0].type;
  if (!DataType.isInt(childType) || childType.bitWidth > 32) {
    throw new Error('ArrowTableGeometry indices column must contain 32-bit integer values');
  }

  const firstRow = indexVector.get(0);
  if (!firstRow || typeof (firstRow as Iterable<unknown>)[Symbol.iterator] !== 'function') {
    throw new Error('ArrowTableGeometry indices column row 0 must contain the index list');
  }

  return normalizeIndexArray(Array.from(firstRow as Iterable<number>, Number));
}

function normalizeIndexArray(indices: number[]): Uint16Array | Uint32Array {
  let maxIndex = 0;
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error('ArrowTableGeometry indices must be non-negative integers');
    }
    maxIndex = Math.max(maxIndex, index);
  }

  return maxIndex <= 65535 ? Uint16Array.from(indices) : Uint32Array.from(indices);
}

function createInterleavedGPUTable(
  device: Device,
  attributes: ArrowMeshAttributeData[],
  bufferName: string,
  rowCount: number
): GPUTable {
  const interleavedAttributes: InterleavedAttribute[] = [];
  let byteOffset = 0;

  for (const attribute of attributes) {
    const formatInfo = vertexFormatDecoder.getVertexFormatInfo(attribute.format);
    byteOffset = alignTo(byteOffset, MIN_ATTRIBUTE_ALIGNMENT);
    interleavedAttributes.push({
      ...attribute,
      byteOffset,
      byteLength: formatInfo.byteLength
    });
    byteOffset += formatInfo.byteLength;
  }

  const byteStride = alignTo(byteOffset, MIN_ATTRIBUTE_ALIGNMENT);
  const data = new Uint8Array(rowCount * byteStride);
  for (const attribute of interleavedAttributes) {
    writeInterleavedAttribute(data, rowCount, byteStride, attribute);
  }

  const vector = new GPUVector({
    type: 'interleaved',
    name: bufferName,
    buffer: device.createBuffer({usage: Buffer.VERTEX | Buffer.COPY_SRC, data}),
    dataType: new Binary(),
    length: rowCount,
    byteStride,
    attributes: interleavedAttributes.map(attribute => ({
      attribute: attribute.attributeName,
      format: attribute.format,
      byteOffset: attribute.byteOffset
    })),
    ownsBuffer: true
  });
  return createGeometryGPUTable(
    [vector],
    [
      {
        name: bufferName,
        stepMode: 'vertex',
        byteStride,
        attributes: interleavedAttributes.map(attribute => ({
          attribute: attribute.attributeName,
          format: attribute.format,
          byteOffset: attribute.byteOffset
        }))
      }
    ]
  );
}

function writeInterleavedAttribute(
  target: Uint8Array,
  rowCount: number,
  byteStride: number,
  attribute: InterleavedAttribute
): void {
  const source = new Uint8Array(
    attribute.value.buffer,
    attribute.value.byteOffset,
    attribute.value.byteLength
  );

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const sourceOffset = rowIndex * attribute.byteLength;
    const targetOffset = rowIndex * byteStride + attribute.byteOffset;
    target.set(source.subarray(sourceOffset, sourceOffset + attribute.byteLength), targetOffset);
  }
}

function createSeparateGPUTable(
  device: Device,
  attributes: ArrowMeshAttributeData[],
  rowCount: number
): GPUTable {
  const vectors: GPUVector[] = [];
  const bufferLayout: BufferLayout[] = [];

  for (const attribute of attributes) {
    const byteStride = vertexFormatDecoder.getVertexFormatInfo(attribute.format).byteLength;
    vectors.push(
      new GPUVector({
        type: 'buffer',
        name: attribute.attributeName,
        buffer: device.createBuffer({
          usage: Buffer.VERTEX | Buffer.COPY_SRC,
          data: attribute.value
        }),
        dataType: attribute.dataType,
        format: attribute.format,
        length: rowCount,
        stride: attribute.size,
        byteStride,
        ownsBuffer: true
      })
    );
    bufferLayout.push({
      name: attribute.attributeName,
      stepMode: 'vertex',
      format: attribute.format
    });
  }

  return createGeometryGPUTable(vectors, bufferLayout);
}

function createGeometryGPUTable(vectors: GPUVector[], bufferLayout: BufferLayout[]): GPUTable {
  const batch = new GPURecordBatch({vectors, bufferLayout});
  return new GPUTable({
    batches: [batch],
    schema: batch.schema,
    bufferLayout: batch.bufferLayout,
    numRows: batch.numRows,
    nullCount: batch.nullCount
  });
}

function parseBooleanMetadata(value: string | undefined): boolean | undefined {
  switch (value) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return undefined;
  }
}

function alignTo(byteOffset: number, alignment: number): number {
  return Math.ceil(byteOffset / alignment) * alignment;
}
