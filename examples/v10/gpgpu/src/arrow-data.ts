// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowFixedSizeListValues, getArrowVectorBufferSource} from '@luma.gl/arrow';
import {GPUTableEvaluator} from '@luma.gl/gpgpu';
import * as arrow from 'apache-arrow';
import type {ExpressionInputs} from './expression';
import {formatFixedRow, formatSegmentedRow, type TableColumn} from './table-renderer';

const COORDINATE_COMPONENT_COUNT = 3;

type ShowcaseArrowColumns = {
  coordinates: arrow.FixedSizeList<arrow.Float64>;
  ranking: arrow.Uint8;
  sampleMetrics: arrow.List<arrow.Float32>;
};

export type ShowcaseArrowTable = arrow.Table<ShowcaseArrowColumns>;

export type ShowcaseData = {
  table: ShowcaseArrowTable;
  columns: TableColumn[];
  expressionInputs: ExpressionInputs;
  rowCount: number;
  metricValueCount: number;
};

export function makeShowcaseData(rowCount: number): ShowcaseData {
  const generatedColumns = makeGeneratedColumnValues(rowCount);
  const table = new arrow.Table<ShowcaseArrowColumns>({
    coordinates: makeFloat64FixedSizeListVector(
      generatedColumns.coordinateValues,
      COORDINATE_COMPONENT_COUNT
    ),
    ranking: makePrimitiveVector(new arrow.Uint8(), generatedColumns.rankingValues),
    sampleMetrics: makeFloat32ListVector(
      generatedColumns.sampleMetricValues,
      generatedColumns.sampleMetricOffsets
    )
  });

  const columns = makeTableColumnsFromArrowTable(table);
  return {
    table,
    columns,
    expressionInputs: makeExpressionInputs(columns),
    rowCount: table.numRows,
    metricValueCount: generatedColumns.sampleMetricValues.length
  };
}

function makeGeneratedColumnValues(rowCount: number): {
  coordinateValues: Float64Array;
  rankingValues: Uint8Array;
  sampleMetricValues: Float32Array;
  sampleMetricOffsets: Int32Array;
} {
  const coordinateValues = new Float64Array(rowCount * COORDINATE_COMPONENT_COUNT);
  const rankingValues = new Uint8Array(rowCount);
  const sampleMetricOffsets = new Int32Array(rowCount + 1);

  let sampleMetricValueCount = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    sampleMetricOffsets[rowIndex] = sampleMetricValueCount;
    sampleMetricValueCount += getSampleMetricLength(rowIndex);
  }
  sampleMetricOffsets[rowCount] = sampleMetricValueCount;

  const sampleMetricValues = new Float32Array(sampleMetricValueCount);
  let sampleMetricValueIndex = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    writeCoordinateValues(coordinateValues, rowIndex);
    rankingValues[rowIndex] = rowIndex % 256;

    const sampleMetricLength = getSampleMetricLength(rowIndex);
    for (let metricIndex = 0; metricIndex < sampleMetricLength; metricIndex++) {
      sampleMetricValues[sampleMetricValueIndex++] =
        ((rowIndex * (metricIndex + 3) + metricIndex * 97) % 10_000) / 100;
    }
  }

  return {coordinateValues, rankingValues, sampleMetricValues, sampleMetricOffsets};
}

function makeTableColumnsFromArrowTable(table: ShowcaseArrowTable): TableColumn[] {
  const coordinatesVector = getRequiredColumn<arrow.FixedSizeList<arrow.Float64>>(
    table,
    'coordinates'
  );
  validateFixedSizeListColumn(coordinatesVector, 'coordinates', arrow.Precision.DOUBLE, 3);
  const coordinateValues = getArrowFixedSizeListValues(coordinatesVector) as Float64Array;
  const coordinatesEvaluator = GPUTableEvaluator.fromArray(coordinateValues, {
    size: COORDINATE_COMPONENT_COUNT
  });

  const rankingVector = getRequiredColumn<arrow.Uint8>(table, 'ranking');
  validateUint8Column(rankingVector, 'ranking');
  const rankingValues = getArrowVectorBufferSource(rankingVector) as Uint8Array;
  const rankingEvaluator = GPUTableEvaluator.fromArray(rankingValues, {type: 'uint8', size: 1});

  const sampleMetricsVector = getRequiredColumn<arrow.List<arrow.Float32>>(table, 'sampleMetrics');
  const sampleMetrics = getSampleMetricBuffers(sampleMetricsVector);
  const sampleMetricValuesEvaluator = GPUTableEvaluator.fromArray(sampleMetrics.values, {size: 1});
  const sampleMetricStartIndicesEvaluator = GPUTableEvaluator.fromArray(
    sampleMetrics.startIndices,
    {
      type: 'uint32',
      size: 1
    }
  );

  return [
    {
      kind: 'evaluator',
      id: 'coordinates',
      logicalType: 'FixedSizeList<Float64, 3>',
      evaluator: coordinatesEvaluator,
      getRowText: rowIndex =>
        formatFixedRow(
          coordinateValues,
          rowIndex * COORDINATE_COMPONENT_COUNT,
          COORDINATE_COMPONENT_COUNT
        )
    },
    {
      kind: 'evaluator',
      id: 'ranking',
      logicalType: 'Uint8',
      evaluator: rankingEvaluator,
      getRowText: rowIndex => formatFixedRow(rankingValues, rowIndex, 1)
    },
    {
      kind: 'segmented',
      id: 'sampleMetrics',
      logicalType: 'List<Float32>',
      valuesEvaluator: sampleMetricValuesEvaluator,
      startIndicesEvaluator: sampleMetricStartIndicesEvaluator,
      getRowText: rowIndex => {
        const startIndex = sampleMetrics.startIndices[rowIndex] ?? 0;
        const endIndex = sampleMetrics.startIndices[rowIndex + 1] ?? startIndex;
        return formatSegmentedRow(sampleMetrics.values, startIndex, endIndex);
      }
    }
  ];
}

function makeExpressionInputs(columns: TableColumn[]): ExpressionInputs {
  const inputs: ExpressionInputs = {};
  for (const column of columns) {
    switch (column.kind) {
      case 'evaluator':
        inputs[column.id] = column.evaluator;
        break;
      case 'segmented':
        inputs[column.id] = {
          kind: 'segmented',
          values: column.valuesEvaluator,
          startIndices: column.startIndicesEvaluator
        };
        inputs[`${column.id}Values`] = column.valuesEvaluator;
        inputs[`${column.id}StartIndices`] = column.startIndicesEvaluator;
        break;
      default: {
        const unreachable: never = column;
        throw new Error(`Unsupported column kind ${(unreachable as {kind: string}).kind}`);
      }
    }
  }
  return inputs;
}

function writeCoordinateValues(values: Float64Array, rowIndex: number): void {
  const valueOffset = rowIndex * COORDINATE_COMPONENT_COUNT;
  values[valueOffset] = ((rowIndex * 0.00037) % 360) - 180;
  values[valueOffset + 1] = Math.sin(rowIndex * 0.00001) * 85;
  values[valueOffset + 2] = ((rowIndex % 10_000) - 5_000) * 0.1;
}

function getSampleMetricLength(rowIndex: number): number {
  return rowIndex % 8;
}

function getRequiredColumn<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`Arrow table is missing "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

function getSampleMetricBuffers(vector: arrow.Vector<arrow.List<arrow.Float32>>): {
  values: Float32Array;
  startIndices: Uint32Array;
} {
  if (!arrow.DataType.isList(vector.type)) {
    throw new Error('sampleMetrics must be an Arrow List column');
  }
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error('sampleMetrics must be a single Arrow chunk');
  }

  const childData = data.children[0] as arrow.Data<arrow.Float32> | undefined;
  const offsets = data.valueOffsets as Int32Array | undefined;
  const values = childData?.values as Float32Array | undefined;
  if (!childData || !offsets || !values || !arrow.DataType.isFloat(childData.type)) {
    throw new Error('sampleMetrics must contain Float32 values and offsets');
  }
  if (childData.type.precision !== arrow.Precision.SINGLE) {
    throw new Error('sampleMetrics values must be Float32');
  }

  return {
    values,
    startIndices: new Uint32Array(offsets.buffer, offsets.byteOffset, offsets.length)
  };
}

function validateFixedSizeListColumn(
  vector: arrow.Vector,
  columnName: string,
  precision: arrow.Precision,
  listSize: number
): void {
  if (!arrow.DataType.isFixedSizeList(vector.type)) {
    throw new Error(`${columnName} must be an Arrow FixedSizeList column`);
  }
  const childType = vector.type.children[0].type;
  if (!arrow.DataType.isFloat(childType) || childType.precision !== precision) {
    throw new Error(`${columnName} must store Float64 values`);
  }
  if (vector.type.listSize !== listSize) {
    throw new Error(`${columnName} must have list size ${listSize}`);
  }
}

function validateUint8Column(vector: arrow.Vector, columnName: string): void {
  const type = vector.type;
  if (!arrow.DataType.isInt(type) || type.isSigned || type.bitWidth !== 8) {
    throw new Error(`${columnName} must be an Arrow Uint8 column`);
  }
}

function makeFloat64FixedSizeListVector(
  values: Float64Array,
  listSize: number
): arrow.Vector<arrow.FixedSizeList<arrow.Float64>> {
  const childType = new arrow.Float64();
  const childData = makePrimitiveData(childType, values);
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('values', childType, false));
  const listData = new arrow.Data(listType, 0, values.length / listSize, 0, {}, [childData]);
  return new arrow.Vector([listData]);
}

function makeFloat32ListVector(
  values: Float32Array,
  offsets: Int32Array
): arrow.Vector<arrow.List<arrow.Float32>> {
  const childType = new arrow.Float32();
  const childData = makePrimitiveData(childType, values);
  const listType = new arrow.List(new arrow.Field('values', childType, false));
  const listData = new arrow.Data(
    listType,
    0,
    offsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: offsets},
    [childData]
  );
  return new arrow.Vector([listData]);
}

function makePrimitiveVector<T extends arrow.DataType>(
  type: T,
  values: T['TArray']
): arrow.Vector<T> {
  return new arrow.Vector([makePrimitiveData(type, values)]);
}

function makePrimitiveData<T extends arrow.DataType>(type: T, values: T['TArray']): arrow.Data<T> {
  return new arrow.Data(type, 0, values.length, 0, {[arrow.BufferType.DATA]: values});
}
