// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowVectorByteLength, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

export type CoordinateMagnitudeKind = '10k' | '10m' | '1b';

export type CoordinateMagnitudeOption = {
  label: string;
  magnitude: number;
};

export type ArrowPathFloat32Type = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
export type ArrowPathFloat64Type = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
export type ArrowPathColorType = arrow.FixedSizeList<arrow.Uint8>;

export type ArrowFloat64PrecisionSourceData = {
  coordinateMagnitudeKind: CoordinateMagnitudeKind;
  coordinateMagnitudeLabel: string;
  coordinateMagnitude: number;
  center: [number, number];
  localBounds: {
    width: number;
    height: number;
  };
  pathCount: number;
  pointCount: number;
  segmentCount: number;
  pathsFloat64: arrow.Vector<ArrowPathFloat64Type>;
  pathsFloat32: arrow.Vector<ArrowPathFloat32Type>;
  colors: arrow.Vector<ArrowPathColorType>;
  widths: arrow.Vector<arrow.Float32>;
  sourceArrowByteLength: {
    float64Paths: number;
    float32Paths: number;
    style: number;
  };
  maxFloat32LocalError: number;
};

export const COORDINATE_MAGNITUDES: Record<CoordinateMagnitudeKind, CoordinateMagnitudeOption> = {
  '10k': {
    label: '10k',
    magnitude: 10_000
  },
  '10m': {
    label: '10M',
    magnitude: 10_000_000
  },
  '1b': {
    label: '1B',
    magnitude: 1_000_000_000
  }
};

const PATH_COLUMNS = 7;
const PATH_ROWS = 5;
const PATH_COUNT = PATH_COLUMNS * PATH_ROWS;
const POINT_COUNT = 20;
const COMPONENT_COUNT = 2;
const PATH_SPACING_X = 200;
const PATH_SPACING_Y = 126;
const PATH_LENGTH = 220;
const WIGGLE_AMPLITUDE = 8;
const TURN_AMPLITUDE = 24;

export function makeArrowFloat64PrecisionSourceData(
  coordinateMagnitudeKind: CoordinateMagnitudeKind
): ArrowFloat64PrecisionSourceData {
  const {label, magnitude} = COORDINATE_MAGNITUDES[coordinateMagnitudeKind];
  const center: [number, number] = [magnitude, -magnitude * 0.73];
  const pathValueCount = PATH_COUNT * POINT_COUNT * COMPONENT_COUNT;
  const valuesFloat64 = new Float64Array(pathValueCount);
  const valuesFloat32 = new Float32Array(pathValueCount);
  const pathOffsets = new Int32Array(PATH_COUNT + 1);
  const colors = new Uint8Array(PATH_COUNT * 4);
  const widths = new Float32Array(PATH_COUNT);
  let maxFloat32LocalError = 0;
  let valueIndex = 0;

  for (let pathIndex = 0; pathIndex < PATH_COUNT; pathIndex++) {
    const columnIndex = pathIndex % PATH_COLUMNS;
    const rowIndex = Math.floor(pathIndex / PATH_COLUMNS);
    const rowBias = rowIndex - (PATH_ROWS - 1) / 2;
    const columnBias = columnIndex - (PATH_COLUMNS - 1) / 2;
    const localOriginX = columnBias * PATH_SPACING_X + Math.sin(rowIndex * 1.7) * 9;
    const localOriginY = rowBias * PATH_SPACING_Y + Math.cos(columnIndex * 1.3) * 8;
    const heading = -0.22 + (columnIndex / Math.max(1, PATH_COLUMNS - 1)) * 0.44;
    const directionX = Math.cos(heading);
    const directionY = Math.sin(heading);
    const normalX = -directionY;
    const normalY = directionX;

    pathOffsets[pathIndex] = pathIndex * POINT_COUNT;
    writePathColor(colors, pathIndex, columnIndex, rowIndex);
    widths[pathIndex] = 3.6 + (pathIndex % 4) * 0.55;

    for (let pointIndex = 0; pointIndex < POINT_COUNT; pointIndex++) {
      const progress = pointIndex / (POINT_COUNT - 1);
      const centeredProgress = progress - 0.5;
      const curve =
        Math.sin(progress * Math.PI * 3 + pathIndex * 0.43) * WIGGLE_AMPLITUDE +
        Math.sin(progress * Math.PI + rowIndex * 0.8) * TURN_AMPLITUDE;
      const localX = localOriginX + centeredProgress * PATH_LENGTH * directionX + curve * normalX;
      const localY = localOriginY + centeredProgress * PATH_LENGTH * directionY + curve * normalY;
      const absoluteX = center[0] + localX;
      const absoluteY = center[1] + localY;
      const float32X = Math.fround(absoluteX);
      const float32Y = Math.fround(absoluteY);

      valuesFloat64[valueIndex] = absoluteX;
      valuesFloat32[valueIndex] = float32X;
      valueIndex++;
      valuesFloat64[valueIndex] = absoluteY;
      valuesFloat32[valueIndex] = float32Y;
      valueIndex++;

      const castLocalX = float32X - Math.fround(center[0]);
      const castLocalY = float32Y - Math.fround(center[1]);
      maxFloat32LocalError = Math.max(
        maxFloat32LocalError,
        Math.hypot(castLocalX - localX, castLocalY - localY)
      );
    }
  }
  pathOffsets[PATH_COUNT] = PATH_COUNT * POINT_COUNT;

  const pathsFloat64 = makePathVector(new arrow.Float64(), valuesFloat64, pathOffsets);
  const pathsFloat32 = makePathVector(new arrow.Float32(), valuesFloat32, pathOffsets);
  const colorVector = makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors);
  const widthVector = arrow.makeVector(widths) as arrow.Vector<arrow.Float32>;

  return {
    coordinateMagnitudeKind,
    coordinateMagnitudeLabel: label,
    coordinateMagnitude: magnitude,
    center,
    localBounds: {
      width: PATH_SPACING_X * (PATH_COLUMNS - 1) + PATH_LENGTH + TURN_AMPLITUDE * 2,
      height: PATH_SPACING_Y * (PATH_ROWS - 1) + PATH_LENGTH + TURN_AMPLITUDE * 2
    },
    pathCount: PATH_COUNT,
    pointCount: POINT_COUNT,
    segmentCount: PATH_COUNT * (POINT_COUNT - 1),
    pathsFloat64,
    pathsFloat32,
    colors: colorVector,
    widths: widthVector,
    sourceArrowByteLength: {
      float64Paths: getArrowVectorByteLength(pathsFloat64),
      float32Paths: getArrowVectorByteLength(pathsFloat32),
      style: getArrowVectorByteLength(colorVector) + getArrowVectorByteLength(widthVector)
    },
    maxFloat32LocalError
  };
}

function makePathVector<T extends arrow.Float32 | arrow.Float64>(
  valueType: T,
  values: Float32Array | Float64Array,
  valueOffsets: Int32Array
): arrow.Vector<arrow.List<arrow.FixedSizeList<T>>> {
  const coordinateType = new arrow.FixedSizeList(
    COMPONENT_COUNT,
    new arrow.Field('values', valueType, false)
  );
  const valueData = new arrow.Data(valueType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const coordinateData = new arrow.Data<arrow.FixedSizeList<T>>(
    coordinateType,
    0,
    values.length / COMPONENT_COUNT,
    0,
    {},
    [valueData]
  );
  const pathType = new arrow.List(
    new arrow.Field('coordinates', coordinateType, false)
  ) as arrow.List<arrow.FixedSizeList<T>>;
  const pathData = new arrow.Data(
    pathType,
    0,
    valueOffsets.length - 1,
    0,
    {
      [arrow.BufferType.OFFSET]: valueOffsets
    },
    [coordinateData]
  );

  return new arrow.Vector([pathData]);
}

function writePathColor(
  colors: Uint8Array,
  pathIndex: number,
  columnIndex: number,
  rowIndex: number
): void {
  const colorOffset = pathIndex * 4;
  const blue = 185 + Math.round((columnIndex / Math.max(1, PATH_COLUMNS - 1)) * 52);
  const green = 142 + Math.round((rowIndex / Math.max(1, PATH_ROWS - 1)) * 74);
  colors[colorOffset] = 45;
  colors[colorOffset + 1] = green;
  colors[colorOffset + 2] = blue;
  colors[colorOffset + 3] = 235;
}
