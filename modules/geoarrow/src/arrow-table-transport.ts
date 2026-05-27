// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';

type SerializedArrowField = {
  name: string;
  nullable: boolean;
  metadata: [string, string][];
  type: SerializedArrowType;
};

type SerializedArrowType =
  | {kind: 'int'; isSigned: boolean; bitWidth: 8 | 16 | 32 | 64}
  | {kind: 'float'; precision: arrow.Precision}
  | {kind: 'list'; child: SerializedArrowField}
  | {kind: 'fixed-size-list'; listSize: number; child: SerializedArrowField}
  | {kind: 'struct'; children: SerializedArrowField[]}
  | {kind: 'dense-union'; typeIds: number[]; children: SerializedArrowField[]};

type DehydratedArrowData<T extends arrow.DataType = arrow.DataType> = {
  type: SerializedArrowType;
  offset: number;
  length: number;
  nullCount: number;
  buffers: Partial<Buffers<T>>;
  children: DehydratedArrowData[];
  dictionary?: DehydratedArrowVector;
};

type DehydratedArrowVector<T extends arrow.DataType = arrow.DataType> = {
  data: DehydratedArrowData<T>[];
};

type DehydratedArrowRecordBatch<T extends arrow.TypeMap = arrow.TypeMap> = {
  data: DehydratedArrowData<arrow.Struct<T>>;
};

export type DehydratedArrowTable<T extends arrow.TypeMap = arrow.TypeMap> = {
  shape: 'arrow-table';
  transport: 'arrow-js';
  schema: {
    fields: SerializedArrowField[];
    metadata: [string, string][];
  };
  batches: DehydratedArrowRecordBatch<T>[];
};

/**
 * Dehydrates an Arrow table for same-version worker transport without Arrow IPC conversion.
 *
 * This mirrors the loaders.gl Arrow transport approach: serialize Arrow type metadata and keep
 * Arrow buffers as structured-cloneable typed arrays so the worker can hydrate real Arrow objects.
 */
export function dehydrateArrowTable<T extends arrow.TypeMap>(
  table: arrow.Table<T>
): DehydratedArrowTable<T> {
  return {
    shape: 'arrow-table',
    transport: 'arrow-js',
    schema: {
      fields: table.schema.fields.map(field => serializeArrowField(field)),
      metadata: Array.from(table.schema.metadata.entries())
    },
    batches: table.batches.map(recordBatch => dehydrateArrowRecordBatch(recordBatch))
  };
}

/** Hydrates a table payload created by dehydrateArrowTable into a real Arrow table. */
export function hydrateArrowTable<T extends arrow.TypeMap>(
  table: DehydratedArrowTable<T>
): arrow.Table<T> {
  const schema = new arrow.Schema<T>(
    table.schema.fields.map(field => deserializeArrowField(field)) as arrow.Field<T[keyof T]>[],
    new Map(table.schema.metadata)
  );
  const recordBatches = table.batches.map(
    recordBatch => new arrow.RecordBatch(schema, hydrateArrowData(recordBatch.data))
  );
  return new arrow.Table(schema, recordBatches);
}

function dehydrateArrowRecordBatch<T extends arrow.TypeMap>(
  recordBatch: arrow.RecordBatch<T>
): DehydratedArrowRecordBatch<T> {
  return {data: dehydrateArrowData(recordBatch.data)};
}

function dehydrateArrowData<T extends arrow.DataType>(data: arrow.Data<T>): DehydratedArrowData<T> {
  return {
    type: serializeArrowType(data.type),
    offset: data.offset,
    length: data.length,
    // @ts-expect-error _nullCount is protected. Preserve the Arrow lazy null-count state.
    nullCount: data._nullCount,
    buffers: {
      [arrow.BufferType.OFFSET]: data.buffers[arrow.BufferType.OFFSET],
      [arrow.BufferType.DATA]: data.buffers[arrow.BufferType.DATA],
      [arrow.BufferType.VALIDITY]: data.buffers[arrow.BufferType.VALIDITY],
      [arrow.BufferType.TYPE]: data.buffers[arrow.BufferType.TYPE]
    },
    children: data.children.map(childData => dehydrateArrowData(childData)),
    dictionary: data.dictionary ? dehydrateArrowVector(data.dictionary) : undefined
  };
}

function dehydrateArrowVector<T extends arrow.DataType>(
  vector: arrow.Vector<T>
): DehydratedArrowVector<T> {
  return {data: vector.data.map(data => dehydrateArrowData(data))};
}

function hydrateArrowData<T extends arrow.DataType>(data: DehydratedArrowData<T>): arrow.Data<T> {
  const children = data.children.map(childData => hydrateArrowData(childData));
  const dictionary = data.dictionary ? hydrateArrowVector(data.dictionary) : undefined;
  return new arrow.Data(
    deserializeArrowType(data.type) as T,
    data.offset,
    data.length,
    data.nullCount,
    data.buffers,
    children,
    dictionary
  );
}

function hydrateArrowVector<T extends arrow.DataType>(
  vector: DehydratedArrowVector<T>
): arrow.Vector<T> {
  return new arrow.Vector(vector.data.map(data => hydrateArrowData(data)));
}

function serializeArrowField(field: arrow.Field): SerializedArrowField {
  return {
    name: field.name,
    nullable: field.nullable,
    metadata: Array.from(field.metadata.entries()),
    type: serializeArrowType(field.type)
  };
}

function deserializeArrowField(field: SerializedArrowField): arrow.Field {
  return new arrow.Field(
    field.name,
    deserializeArrowType(field.type),
    field.nullable,
    new Map(field.metadata)
  );
}

function serializeArrowType(type: arrow.DataType): SerializedArrowType {
  if (arrow.DataType.isInt(type)) {
    return {
      kind: 'int',
      isSigned: type.isSigned,
      bitWidth: type.bitWidth
    };
  }
  if (arrow.DataType.isFloat(type)) {
    return {kind: 'float', precision: type.precision};
  }
  if (arrow.DataType.isList(type)) {
    return {kind: 'list', child: serializeArrowField(type.children[0])};
  }
  if (arrow.DataType.isFixedSizeList(type)) {
    return {
      kind: 'fixed-size-list',
      listSize: type.listSize,
      child: serializeArrowField(type.children[0])
    };
  }
  if (arrow.DataType.isStruct(type)) {
    return {kind: 'struct', children: type.children.map(field => serializeArrowField(field))};
  }
  if (arrow.DataType.isDenseUnion(type)) {
    return {
      kind: 'dense-union',
      typeIds: Array.from(type.typeIds),
      children: type.children.map(field => serializeArrowField(field))
    };
  }
  throw new Error(`Unsupported Arrow worker transport type ${type.toString()}`);
}

function deserializeArrowType(type: SerializedArrowType): arrow.DataType {
  switch (type.kind) {
    case 'int':
      return deserializeIntType(type.isSigned, type.bitWidth);
    case 'float':
      return deserializeFloatType(type.precision);
    case 'list':
      return new arrow.List(deserializeArrowField(type.child));
    case 'fixed-size-list':
      return new arrow.FixedSizeList(type.listSize, deserializeArrowField(type.child));
    case 'struct':
      return new arrow.Struct(type.children.map(field => deserializeArrowField(field)));
    case 'dense-union':
      return new arrow.DenseUnion(
        Int32Array.from(type.typeIds),
        type.children.map(field => deserializeArrowField(field))
      );
  }
}

function deserializeIntType(isSigned: boolean, bitWidth: 8 | 16 | 32 | 64): arrow.Int {
  switch (bitWidth) {
    case 8:
      return isSigned ? new arrow.Int8() : new arrow.Uint8();
    case 16:
      return isSigned ? new arrow.Int16() : new arrow.Uint16();
    case 32:
      return isSigned ? new arrow.Int32() : new arrow.Uint32();
    case 64:
      return isSigned ? new arrow.Int64() : new arrow.Uint64();
  }
}

function deserializeFloatType(precision: arrow.Precision): arrow.Float {
  switch (precision) {
    case arrow.Precision.HALF:
      return new arrow.Float16();
    case arrow.Precision.SINGLE:
      return new arrow.Float32();
    case arrow.Precision.DOUBLE:
      return new arrow.Float64();
  }
}
