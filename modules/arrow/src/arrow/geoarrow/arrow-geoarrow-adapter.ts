// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GeoArrowArray,
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowDenseUnion,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowNumericArray,
  GeoArrowOffsets,
  GeoArrowValidity
} from '@math.gl/geoarrow';
import {
  Binary,
  BufferType,
  Data,
  DataType,
  DenseUnion,
  Field,
  FixedSizeList,
  Float32,
  Float64,
  Int8,
  Int16,
  Int32,
  Int64,
  List,
  Struct,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Utf8,
  Vector,
  vectorFromArray,
  type DataType as ArrowDataType
} from 'apache-arrow';

/** Options for adapting one Apache Arrow vector to math.gl's runtime-neutral GeoArrow ABI. */
export type MakeGeoArrowColumnFromArrowVectorOptions = {
  /** GeoArrow extension encoding. Inferred from the physical type when omitted. */
  encoding?: GeoArrowEncoding;
  /** Semantic coordinate dimension. Inferred from coordinate field names when omitted. */
  dimension?: GeoArrowDimension;
  /** Coordinate organization. Inferred from the physical type when omitted. */
  coordinateLayout?: GeoArrowCoordinateLayout | null;
  /** Opaque extension metadata retained on the descriptor envelope. */
  metadata?: Readonly<Record<string, unknown>>;
};

/**
 * Adapts Apache Arrow physical buffers to the borrowed descriptor ABI used by
 * `@math.gl/geoarrow`.
 */
export function makeGeoArrowColumnFromArrowVector<T extends ArrowDataType>(
  vector: Vector<T>,
  options: MakeGeoArrowColumnFromArrowVectorOptions = {}
): GeoArrowColumn {
  const encoding = options.encoding ?? inferGeoArrowEncodingFromArrowType(vector.type);
  const dimension = options.dimension ?? inferGeoArrowDimensionFromArrowType(vector.type);
  const coordinateLayout =
    options.coordinateLayout === undefined
      ? inferGeoArrowCoordinateLayoutFromArrowType(vector.type)
      : options.coordinateLayout;

  return {
    encoding,
    dimension,
    coordinateLayout,
    chunks: vector.data.map(data => makeGeoArrowArrayFromArrowData(data)),
    metadata: options.metadata
  };
}

/** Converts a math.gl GeoArrow descriptor back to an Apache Arrow vector. */
export function makeArrowVectorFromGeoArrowColumn(column: GeoArrowColumn): Vector {
  return new Vector(
    column.chunks.map(chunk =>
      makeArrowDataFromGeoArrowArray(chunk, column.dimension, column.coordinateLayout)
    )
  );
}

/** Infers a native GeoArrow encoding from an Apache Arrow physical type. */
export function inferGeoArrowEncodingFromArrowType(type: ArrowDataType): GeoArrowEncoding {
  if (DataType.isDenseUnion(type)) return 'geoarrow.geometry';
  if (DataType.isBinary(type)) return 'geoarrow.wkb';
  if (DataType.isUtf8(type)) return 'geoarrow.wkt';

  const nesting = getArrowListNesting(type);
  switch (nesting) {
    case 0:
      return 'geoarrow.point';
    case 1:
      return 'geoarrow.linestring';
    case 2:
      return 'geoarrow.polygon';
    case 3:
      return 'geoarrow.multipolygon';
    default:
      throw new Error(`Cannot infer GeoArrow encoding from Arrow type ${type.toString()}`);
  }
}

/** Infers the semantic GeoArrow coordinate dimension from Arrow coordinate field names. */
export function inferGeoArrowDimensionFromArrowType(type: ArrowDataType): GeoArrowDimension {
  if (DataType.isFixedSizeList(type)) {
    const dimensionName = type.children[0]?.name.toLowerCase();
    if (isGeoArrowDimension(dimensionName)) return dimensionName;
    switch (type.listSize) {
      case 2:
        return 'xy';
      case 3:
        return 'xyz';
      case 4:
        return 'xyzm';
      default:
        throw new Error(
          `GeoArrow coordinates require 2, 3, or 4 values, received ${type.listSize}`
        );
    }
  }
  if (DataType.isStruct(type)) {
    const names = type.children.map(field => field.name.toLowerCase());
    if (names[0] === 'x' && names[1] === 'y') {
      if (names[2] === 'm') return 'xym';
      if (names[2] === 'z' && names[3] === 'm') return 'xyzm';
      if (names[2] === 'z') return 'xyz';
      return 'xy';
    }
  }
  if (DataType.isList(type)) {
    return inferGeoArrowDimensionFromArrowType(type.children[0].type);
  }
  if (DataType.isDenseUnion(type)) {
    return type.children.reduce<GeoArrowDimension>(
      (dimension, field) =>
        mergeGeoArrowDimensions(dimension, inferGeoArrowDimensionFromArrowType(field.type)),
      'xy'
    );
  }
  throw new Error(`Cannot infer GeoArrow dimension from Arrow type ${type.toString()}`);
}

/** Infers whether Arrow coordinate leaves are interleaved or separated. */
export function inferGeoArrowCoordinateLayoutFromArrowType(
  type: ArrowDataType
): GeoArrowCoordinateLayout | null {
  if (DataType.isFixedSizeList(type)) return 'interleaved';
  if (DataType.isStruct(type)) return 'separated';
  if (DataType.isList(type)) {
    return inferGeoArrowCoordinateLayoutFromArrowType(type.children[0].type);
  }
  if (DataType.isDenseUnion(type)) {
    for (const field of type.children) {
      const layout = inferGeoArrowCoordinateLayoutFromArrowType(field.type);
      if (layout) return layout;
    }
  }
  return null;
}

function makeGeoArrowArrayFromArrowData(data: Data): GeoArrowArray {
  const validity = makeGeoArrowValidity(data);
  if (DataType.isFixedSizeList(data.type)) {
    return {
      kind: 'fixed-size-list',
      length: data.length,
      size: data.type.listSize,
      child: makeGeoArrowArrayFromArrowData(data.children[0]),
      validity
    };
  }
  if (DataType.isList(data.type)) {
    return {
      kind: 'list',
      length: data.length,
      offsets: data.valueOffsets as GeoArrowOffsets,
      child: makeGeoArrowArrayFromArrowData(data.children[0]),
      validity
    };
  }
  if (DataType.isStruct(data.type)) {
    const children: Record<string, GeoArrowArray> = {};
    for (let childIndex = 0; childIndex < data.type.children.length; childIndex++) {
      children[data.type.children[childIndex].name] = makeGeoArrowArrayFromArrowData(
        data.children[childIndex]
      );
    }
    return {kind: 'struct', length: data.length, children, validity};
  }
  if (DataType.isDenseUnion(data.type)) {
    const unionType = data.type;
    return {
      kind: 'dense-union',
      length: data.length,
      typeIds: data.typeIds as Int8Array | Uint8Array,
      valueOffsets: data.valueOffsets,
      children: unionType.children.map((field, childIndex) => ({
        name: field.name,
        typeId: unionType.typeIds[childIndex],
        encoding: inferGeoArrowEncodingFromUnionChild(field),
        dimension: inferGeoArrowDimensionFromArrowType(field.type),
        coordinateLayout: inferGeoArrowCoordinateLayoutFromArrowType(field.type),
        data: makeGeoArrowArrayFromArrowData(data.children[childIndex])
      })),
      validity
    };
  }
  if (DataType.isBinary(data.type) || DataType.isUtf8(data.type)) {
    return {
      kind: 'serialized',
      encoding: DataType.isBinary(data.type) ? 'binary' : 'utf8',
      length: data.length,
      offsets: data.valueOffsets as GeoArrowOffsets,
      values: data.values as Uint8Array,
      validity
    };
  }
  if (DataType.isInt(data.type) || DataType.isFloat(data.type)) {
    return {
      kind: 'primitive',
      length: data.length,
      values: data.values as GeoArrowNumericArray,
      validity
    };
  }
  throw new Error(`Unsupported GeoArrow physical Arrow type ${data.type.toString()}`);
}

function makeGeoArrowValidity(data: Data): GeoArrowValidity | undefined {
  if (data.nullCount <= 0 || !data.nullBitmap || data.nullBitmap.length === 0) return undefined;
  return {values: data.nullBitmap, bitOffset: data.offset & 7};
}

function makeArrowDataFromGeoArrowArray(
  array: GeoArrowArray,
  dimension: GeoArrowDimension,
  coordinateLayout: GeoArrowCoordinateLayout | null
): Data {
  const validity = makeCompactValidity(array.validity, array.length);
  const nullCount = validity ? -1 : 0;
  const validityBuffers = validity ? {[BufferType.VALIDITY]: validity} : {};

  switch (array.kind) {
    case 'primitive': {
      const values = makePackedPrimitiveValues(array);
      const type = getArrowTypeForValues(values);
      return new Data(type, 0, array.length, nullCount, {
        ...validityBuffers,
        [BufferType.DATA]: values
      });
    }
    case 'fixed-size-list': {
      const child = makeArrowDataFromGeoArrowArray(array.child, dimension, coordinateLayout);
      const childStart = (array.offset ?? 0) * array.size;
      const slicedChild =
        childStart === 0 && child.length === array.length * array.size
          ? child
          : child.slice(childStart, array.length * array.size);
      const type = new FixedSizeList(array.size, new Field(dimension, slicedChild.type, false));
      return new Data(type, 0, array.length, nullCount, validityBuffers, [slicedChild]);
    }
    case 'list': {
      if (array.offsets instanceof BigInt64Array) {
        throw new Error('Apache Arrow JS does not expose LargeList in this supported version');
      }
      const child = makeArrowDataFromGeoArrowArray(array.child, dimension, coordinateLayout);
      const offsets = makeArrowOffsets(array.offsets, array.offset, array.length, array.offsetBase);
      const type = new List(new Field('values', child.type, true));
      return new Data(
        type,
        0,
        array.length,
        nullCount,
        {...validityBuffers, [BufferType.OFFSET]: offsets},
        [child]
      );
    }
    case 'struct': {
      const fields: Field[] = [];
      const children: Data[] = [];
      for (const [name, childArray] of Object.entries(array.children)) {
        let child = makeArrowDataFromGeoArrowArray(childArray, dimension, coordinateLayout);
        const childOffset = array.offset ?? 0;
        if (childOffset > 0 || child.length !== array.length) {
          child = child.slice(childOffset, array.length);
        }
        fields.push(new Field(name, child.type, true));
        children.push(child);
      }
      return new Data(new Struct(fields), 0, array.length, nullCount, validityBuffers, children);
    }
    case 'dense-union':
      return makeArrowDenseUnionData(array, dimension, coordinateLayout);
    case 'serialized': {
      if (array.offsets instanceof BigInt64Array) {
        throw new Error('Large GeoArrow serialized output is not supported by this adapter');
      }
      const offsets = makeArrowOffsets(array.offsets, array.offset, array.length, array.offsetBase);
      const type = array.encoding === 'binary' ? new Binary() : new Utf8();
      return new Data(type, 0, array.length, nullCount, {
        ...validityBuffers,
        [BufferType.OFFSET]: offsets,
        [BufferType.DATA]: array.values
      });
    }
  }
}

function makeArrowDenseUnionData(
  array: GeoArrowDenseUnion,
  dimension: GeoArrowDimension,
  coordinateLayout: GeoArrowCoordinateLayout | null
): Data {
  const offset = array.offset ?? 0;
  const typeIds = array.typeIds.slice(offset, offset + array.length);
  const valueOffsets = array.valueOffsets.slice(offset, offset + array.length);
  const children = array.children.map(child =>
    makeArrowDataFromGeoArrowArray(
      child.data,
      child.dimension ?? dimension,
      child.coordinateLayout === undefined ? coordinateLayout : child.coordinateLayout
    )
  );

  if (array.validity && array.children.length > 0) {
    const nullChildIndex = 0;
    const nullChild = children[nullChildIndex];
    const nullValueOffset = nullChild.length;
    children[nullChildIndex] = appendNullToArrowData(nullChild);
    for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
      if (!isGeoArrowValueValid(array.validity, rowIndex)) {
        typeIds[rowIndex] = array.children[nullChildIndex].typeId;
        valueOffsets[rowIndex] = nullValueOffset;
      }
    }
  }

  const fields = array.children.map(
    (child, childIndex) => new Field(child.name, children[childIndex].type, true)
  );
  const type = new DenseUnion(Int32Array.from(array.children.map(child => child.typeId)), fields);
  return new Data(
    type,
    0,
    array.length,
    0,
    {[BufferType.TYPE]: Int8Array.from(typeIds), [BufferType.OFFSET]: valueOffsets},
    children
  );
}

function appendNullToArrowData(data: Data): Data {
  const vector = new Vector([data]);
  const values: unknown[] = [];
  for (let index = 0; index < vector.length; index++) {
    values.push(materializeArrowValue(vector.get(index)));
  }
  values.push(null);
  return vectorFromArray(values, data.type).data[0];
}

function materializeArrowValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as unknown as ArrayLike<number | bigint>);
  }
  if (Array.isArray(value)) return value.map(materializeArrowValue);
  if (isArrowVectorLike(value)) {
    const values: unknown[] = [];
    for (let index = 0; index < value.length; index++) {
      values.push(materializeArrowValue(value.get(index)));
    }
    return values;
  }
  return value;
}

function isArrowVectorLike(
  value: unknown
): value is {length: number; get: (index: number) => unknown} {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'length' in value &&
      'get' in value &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}

function makePackedPrimitiveValues(
  array: Extract<GeoArrowArray, {kind: 'primitive'}>
): GeoArrowNumericArray {
  const offset = array.offset ?? 0;
  const stride = array.stride ?? 1;
  if (stride === 1) {
    return array.values.subarray(offset, offset + array.length) as GeoArrowNumericArray;
  }
  const ValuesConstructor = array.values.constructor as {
    new (length: number): GeoArrowNumericArray;
  };
  const values = new ValuesConstructor(array.length);
  for (let index = 0; index < array.length; index++) {
    values[index] = array.values[offset + index * stride] as never;
  }
  return values;
}

function getArrowTypeForValues(values: GeoArrowNumericArray): ArrowDataType {
  if (values instanceof Int8Array) return new Int8();
  if (values instanceof Uint8Array || values instanceof Uint8ClampedArray) return new Uint8();
  if (values instanceof Int16Array) return new Int16();
  if (values instanceof Uint16Array) return new Uint16();
  if (values instanceof Int32Array) return new Int32();
  if (values instanceof Uint32Array) return new Uint32();
  if (values instanceof BigInt64Array) return new Int64();
  if (values instanceof BigUint64Array) return new Uint64();
  if (values instanceof Float32Array) return new Float32();
  if (values instanceof Float64Array) return new Float64();
  throw new Error(`Unsupported GeoArrow primitive values ${(values as object).constructor.name}`);
}

function makeArrowOffsets(
  offsets: GeoArrowOffsets,
  offset = 0,
  length: number,
  offsetBase: number | bigint = 0
): Int32Array {
  const source = offsets.subarray(offset, offset + length + 1);
  if (offsetBase === 0) return source as Int32Array;
  const normalized = new Int32Array(source.length);
  for (let index = 0; index < source.length; index++) {
    normalized[index] = Number(source[index]) - Number(offsetBase);
  }
  return normalized;
}

function makeCompactValidity(
  validity: GeoArrowValidity | undefined,
  length: number
): Uint8Array | undefined {
  if (!validity) return undefined;
  const bitOffset = validity.bitOffset ?? 0;
  const values = new Uint8Array(Math.ceil(length / 8));
  let nullCount = 0;
  for (let index = 0; index < length; index++) {
    if (isGeoArrowValueValid(validity, index)) {
      values[index >> 3] |= 1 << (index & 7);
    } else {
      nullCount++;
    }
  }
  return nullCount > 0 || bitOffset > 0 ? values : undefined;
}

function isGeoArrowValueValid(validity: GeoArrowValidity, index: number): boolean {
  const bitIndex = (validity.bitOffset ?? 0) + index;
  return Boolean(validity.values[bitIndex >> 3] & (1 << (bitIndex & 7)));
}

function inferGeoArrowEncodingFromUnionChild(field: Field): GeoArrowEncoding {
  const normalizedName = field.name.replace(/[^a-z]/gi, '').toLowerCase();
  const names: Record<string, GeoArrowEncoding> = {
    point: 'geoarrow.point',
    linestring: 'geoarrow.linestring',
    polygon: 'geoarrow.polygon',
    multipoint: 'geoarrow.multipoint',
    multilinestring: 'geoarrow.multilinestring',
    multipolygon: 'geoarrow.multipolygon',
    geometrycollection: 'geoarrow.geometrycollection'
  };
  for (const [name, encoding] of Object.entries(names)) {
    if (normalizedName.startsWith(name)) return encoding;
  }
  return inferGeoArrowEncodingFromArrowType(field.type);
}

function getArrowListNesting(type: ArrowDataType): number {
  let nesting = 0;
  let currentType = type;
  while (DataType.isList(currentType)) {
    nesting++;
    currentType = currentType.children[0].type;
  }
  if (DataType.isFixedSizeList(currentType) || DataType.isStruct(currentType)) return nesting;
  throw new Error(`GeoArrow type does not terminate in coordinates: ${type.toString()}`);
}

function isGeoArrowDimension(value: string | undefined): value is GeoArrowDimension {
  return value === 'xy' || value === 'xyz' || value === 'xym' || value === 'xyzm';
}

function mergeGeoArrowDimensions(
  left: GeoArrowDimension,
  right: GeoArrowDimension
): GeoArrowDimension {
  if (left === right) return left;
  if (left === 'xy') return right;
  if (right === 'xy') return left;
  if (left === 'xyzm' || right === 'xyzm') return 'xyzm';
  return left === 'xym' && right === 'xym' ? 'xym' : 'xyzm';
}
