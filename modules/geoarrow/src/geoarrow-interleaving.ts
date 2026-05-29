// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';
import {
  dehydrateArrowTable,
  hydrateArrowTable,
  type DehydratedArrowTable
} from './arrow-table-transport';

export type GeoArrowNativeEncoding =
  | 'geoarrow.geometry'
  | 'geoarrow.point'
  | 'geoarrow.linestring'
  | 'geoarrow.polygon'
  | 'geoarrow.multipoint'
  | 'geoarrow.multilinestring'
  | 'geoarrow.multipolygon';

export type GeoArrowInterleaveOptions = {
  /** Optional single geometry column to convert. Defaults to native GeoArrow metadata columns. */
  geometryColumn?: string;
  /** Optional geometry columns to convert. Defaults to native GeoArrow metadata columns. */
  geometryColumns?: string[];
};

type GeoArrowInterleaveWorkerRequest = {
  id: number;
  sourceTable: DehydratedArrowTable;
  options: GeoArrowInterleaveOptions;
};

type GeoArrowInterleaveWorkerResponse =
  | {
      id: number;
      resultTable: DehydratedArrowTable;
      error?: never;
    }
  | {
      id: number;
      resultTable?: never;
      error: {
        message: string;
        stack?: string;
      };
    };

const NATIVE_GEOARROW_ENCODINGS = new Set<GeoArrowNativeEncoding>([
  'geoarrow.geometry',
  'geoarrow.point',
  'geoarrow.linestring',
  'geoarrow.polygon',
  'geoarrow.multipoint',
  'geoarrow.multilinestring',
  'geoarrow.multipolygon'
]);

const GEOARROW_EXTENSION_NAME_KEY = 'ARROW:extension:name';

const pendingWorkerRequests = new Map<
  number,
  {
    resolve: (table: arrow.Table) => void;
    reject: (error: Error) => void;
  }
>();

let geoArrowInterleaveWorker: Worker | null | undefined;
let nextWorkerRequestId = 1;

/** Converts separated GeoArrow Struct coordinates in a vector to interleaved FixedSizeList rows. */
export function convertGeoArrowVectorToInterleaved<T extends arrow.DataType>(
  vector: arrow.Vector<T>
): arrow.Vector {
  const convertedData = vector.data.map(data => convertGeoArrowDataToInterleaved(data));
  if (convertedData.every((data, index) => data === vector.data[index])) {
    return vector;
  }
  return new arrow.Vector(convertedData);
}

/** Converts selected native GeoArrow table geometry columns to interleaved coordinates. */
export function convertGeoArrowTableToInterleaved<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  options: GeoArrowInterleaveOptions = {}
): arrow.Table {
  const geometryColumns = resolveGeoArrowGeometryColumns(table, options);
  if (geometryColumns.length === 0) {
    return table;
  }

  const convertedVectors = new Map<string, arrow.Vector>();
  let hasConvertedColumn = false;
  for (const geometryColumn of geometryColumns) {
    const vector = table.getChild(geometryColumn);
    if (!vector) {
      throw new Error(`GeoArrow interleaving could not resolve column "${geometryColumn}"`);
    }
    const convertedVector = convertGeoArrowVectorToInterleaved(vector);
    convertedVectors.set(geometryColumn, convertedVector);
    hasConvertedColumn ||= convertedVector !== vector;
  }

  if (!hasConvertedColumn) {
    return table;
  }

  return makeTableWithConvertedVectors(table, convertedVectors);
}

/** Async worker-backed variant of convertGeoArrowTableToInterleaved. */
export async function convertGeoArrowTableToInterleavedAsync<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  options: GeoArrowInterleaveOptions = {}
): Promise<arrow.Table> {
  const geometryColumns = resolveGeoArrowGeometryColumns(table, options);
  if (geometryColumns.length === 0) {
    return table;
  }

  const worker = getGeoArrowInterleaveWorker();
  if (!worker) {
    await Promise.resolve();
    return convertGeoArrowTableToInterleaved(table, {
      geometryColumns
    });
  }

  return await convertGeoArrowTableToInterleavedWithWorker(worker, table, geometryColumns);
}

function convertGeoArrowDataToInterleaved<T extends arrow.DataType>(
  data: arrow.Data<T>
): arrow.Data {
  if (arrow.DataType.isStruct(data.type) && isSeparatedCoordinateStructType(data.type)) {
    return convertSeparatedCoordinateDataToInterleaved(data as unknown as arrow.Data<arrow.Struct>);
  }

  if (arrow.DataType.isList(data.type)) {
    return convertListDataToInterleaved(data as unknown as arrow.Data<arrow.List>);
  }

  if (arrow.DataType.isDenseUnion(data.type)) {
    return convertDenseUnionDataToInterleaved(data as unknown as arrow.Data<arrow.DenseUnion>);
  }

  return data;
}

function convertListDataToInterleaved(data: arrow.Data<arrow.List>): arrow.Data {
  const childData = data.children[0];
  const convertedChildData = convertGeoArrowDataToInterleaved(childData);
  if (convertedChildData === childData) {
    return data;
  }

  const childField = data.type.children[0];
  const convertedType = new arrow.List(
    new arrow.Field(
      childField.name,
      convertedChildData.type,
      childField.nullable,
      childField.metadata
    )
  );

  return new arrow.Data(
    convertedType,
    data.offset,
    data.length,
    data.nullCount,
    data.buffers,
    [convertedChildData],
    data.dictionary
  );
}

function convertDenseUnionDataToInterleaved(data: arrow.Data<arrow.DenseUnion>): arrow.Data {
  const convertedChildren = data.children.map(childData =>
    convertGeoArrowDataToInterleaved(childData)
  );
  if (convertedChildren.every((childData, index) => childData === data.children[index])) {
    return data;
  }

  const convertedFields = data.type.children.map((childField, index) => {
    const convertedChildData = convertedChildren[index];
    return new arrow.Field(
      childField.name,
      convertedChildData.type,
      childField.nullable,
      childField.metadata
    );
  });
  const convertedType = new arrow.DenseUnion(Int32Array.from(data.type.typeIds), convertedFields);

  return new arrow.Data(
    convertedType,
    data.offset,
    data.length,
    data.nullCount,
    data.buffers,
    convertedChildren,
    data.dictionary
  );
}

function convertSeparatedCoordinateDataToInterleaved(data: arrow.Data<arrow.Struct>): arrow.Data {
  const coordinateFields = data.type.children;
  const dimension = coordinateFields.length as 2 | 3 | 4;
  const childType = coordinateFields[0].type as arrow.Float;
  const values = makeInterleavedCoordinateValues(data, dimension);
  const valueData = new arrow.Data(childType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const listType = new arrow.FixedSizeList(dimension, new arrow.Field('value', childType, false));

  return new arrow.Data(
    listType,
    data.offset,
    data.length,
    data.nullCount,
    data.buffers as unknown as Partial<Buffers<arrow.FixedSizeList<arrow.Float>>>,
    [valueData],
    data.dictionary
  );
}

function makeInterleavedCoordinateValues(
  data: arrow.Data<arrow.Struct>,
  dimension: 2 | 3 | 4
): Float32Array | Float64Array {
  const coordinateFields = data.type.children;
  const coordinateChildren = data.children;
  const valueType = coordinateFields[0].type;
  const values =
    arrow.DataType.isFloat(valueType) && valueType.precision === arrow.Precision.SINGLE
      ? new Float32Array(data.length * dimension)
      : new Float64Array(data.length * dimension);

  for (let componentIndex = 0; componentIndex < dimension; componentIndex++) {
    const childData = coordinateChildren[componentIndex];
    if (coordinateFields[componentIndex].nullable || childData.nullCount > 0) {
      throw new Error('GeoArrow coordinate child values must be non-null');
    }
    const childValues = childData.values;
    if (!(childValues instanceof Float32Array) && !(childValues instanceof Float64Array)) {
      throw new Error('GeoArrow coordinates must be backed by Float32Array or Float64Array');
    }
    const childOffset = childData.offset + data.offset;
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      values[rowIndex * dimension + componentIndex] = childValues[childOffset + rowIndex];
    }
  }

  return values;
}

function isSeparatedCoordinateStructType(type: arrow.Struct): boolean {
  const coordinateFields = type.children;
  if (coordinateFields.length < 2 || coordinateFields.length > 4) {
    return false;
  }
  if (!hasGeoArrowCoordinateFieldNames(coordinateFields)) {
    return false;
  }

  const valueType = coordinateFields[0].type;
  if (!isSupportedCoordinateFloatType(valueType)) {
    return false;
  }

  return coordinateFields.every(
    field =>
      isSupportedCoordinateFloatType(field.type) && field.type.precision === valueType.precision
  );
}

function isSupportedCoordinateFloatType(type: arrow.DataType): type is arrow.Float {
  return (
    arrow.DataType.isFloat(type) &&
    (type.precision === arrow.Precision.SINGLE || type.precision === arrow.Precision.DOUBLE)
  );
}

function hasGeoArrowCoordinateFieldNames(fields: arrow.Field[]): boolean {
  const names = fields.map(field => field.name.toLowerCase());
  if (names[0] !== 'x' || names[1] !== 'y') {
    return false;
  }
  if (names.length === 3) {
    return names[2] === 'z' || names[2] === 'm';
  }
  if (names.length === 4) {
    return names[2] === 'z' && names[3] === 'm';
  }
  return true;
}

function makeTableWithConvertedVectors<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  convertedVectors: Map<string, arrow.Vector>
): arrow.Table {
  const nextFields = table.schema.fields.map(field => {
    const convertedVector = convertedVectors.get(field.name);
    return convertedVector
      ? new arrow.Field(field.name, convertedVector.type, field.nullable, field.metadata)
      : field;
  });
  const nextSchema = new arrow.Schema(nextFields, table.schema.metadata);
  const nextBatches = table.batches.map((recordBatch, batchIndex) => {
    const children = nextFields.map((field, fieldIndex) => {
      const convertedVector = convertedVectors.get(field.name);
      if (!convertedVector) {
        return recordBatch.data.children[fieldIndex];
      }
      const convertedData = convertedVector.data[batchIndex];
      if (!convertedData) {
        throw new Error(`GeoArrow interleaving chunk mismatch for column "${field.name}"`);
      }
      return convertedData;
    });
    const recordBatchData = new arrow.Data(
      new arrow.Struct(nextFields),
      recordBatch.data.offset,
      recordBatch.numRows,
      recordBatch.data.nullCount,
      recordBatch.data.buffers,
      children
    );

    return new arrow.RecordBatch(nextSchema, recordBatchData);
  });

  return new arrow.Table(nextSchema, nextBatches);
}

function resolveGeoArrowGeometryColumns<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  options: GeoArrowInterleaveOptions
): string[] {
  if (options.geometryColumn && options.geometryColumns?.length) {
    throw new Error('Specify only one of geometryColumn or geometryColumns');
  }

  if (options.geometryColumn) {
    assertTableColumnExists(table, options.geometryColumn);
    return [options.geometryColumn];
  }

  if (options.geometryColumns?.length) {
    for (const geometryColumn of options.geometryColumns) {
      assertTableColumnExists(table, geometryColumn);
    }
    return options.geometryColumns;
  }

  return table.schema.fields.filter(field => isNativeGeoArrowField(field)).map(field => field.name);
}

function assertTableColumnExists<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  columnName: string
): void {
  if (!table.getChild(columnName)) {
    throw new Error(`GeoArrow interleaving could not find column "${columnName}"`);
  }
}

function isNativeGeoArrowField(field: arrow.Field): boolean {
  const extensionName = field.metadata.get(GEOARROW_EXTENSION_NAME_KEY)?.toLowerCase();
  return NATIVE_GEOARROW_ENCODINGS.has(extensionName as GeoArrowNativeEncoding);
}

function getGeoArrowInterleaveWorker(): Worker | null {
  if (geoArrowInterleaveWorker !== undefined) {
    return geoArrowInterleaveWorker;
  }
  if (typeof Worker === 'undefined') {
    geoArrowInterleaveWorker = null;
    return geoArrowInterleaveWorker;
  }

  try {
    geoArrowInterleaveWorker = new Worker(
      new URL('./geoarrow-interleaving-worker.js', import.meta.url),
      {type: 'module'}
    );
    geoArrowInterleaveWorker.addEventListener('message', handleWorkerMessage);
    geoArrowInterleaveWorker.addEventListener('error', handleWorkerError);
  } catch {
    geoArrowInterleaveWorker = null;
  }

  return geoArrowInterleaveWorker;
}

function convertGeoArrowTableToInterleavedWithWorker<T extends arrow.TypeMap>(
  worker: Worker,
  table: arrow.Table<T>,
  geometryColumns: string[]
): Promise<arrow.Table> {
  const id = nextWorkerRequestId++;
  const selectedVectors: Record<string, arrow.Vector> = {};
  for (const geometryColumn of geometryColumns) {
    const vector = table.getChild(geometryColumn);
    if (!vector) {
      throw new Error(`GeoArrow interleaving could not resolve column "${geometryColumn}"`);
    }
    selectedVectors[geometryColumn] = vector;
  }
  const request: GeoArrowInterleaveWorkerRequest = {
    id,
    sourceTable: dehydrateArrowTable(new arrow.Table(selectedVectors)),
    options: {geometryColumns}
  };

  return new Promise((resolve, reject) => {
    pendingWorkerRequests.set(id, {
      resolve: convertedTable => {
        const convertedVectors = new Map<string, arrow.Vector>();
        for (const geometryColumn of geometryColumns) {
          const convertedVector = convertedTable.getChild(geometryColumn);
          if (!convertedVector) {
            reject(new Error(`GeoArrow interleaving worker did not return "${geometryColumn}"`));
            return;
          }
          convertedVectors.set(geometryColumn, convertedVector);
        }
        resolve(makeTableWithConvertedVectors(table, convertedVectors));
      },
      reject
    });
    worker.postMessage(request);
  });
}

function handleWorkerMessage(event: MessageEvent<GeoArrowInterleaveWorkerResponse>): void {
  const {id, resultTable, error} = event.data;
  const pendingRequest = pendingWorkerRequests.get(id);
  if (!pendingRequest) {
    return;
  }
  pendingWorkerRequests.delete(id);
  if (error) {
    const workerError = new Error(error.message);
    workerError.stack = error.stack;
    pendingRequest.reject(workerError);
    return;
  }
  pendingRequest.resolve(hydrateArrowTable(resultTable));
}

function handleWorkerError(event: ErrorEvent): void {
  const error = new Error(event.message);
  for (const pendingRequest of pendingWorkerRequests.values()) {
    pendingRequest.reject(error);
  }
  pendingWorkerRequests.clear();
  geoArrowInterleaveWorker?.terminate();
  geoArrowInterleaveWorker = null;
}
