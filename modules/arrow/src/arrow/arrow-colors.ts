// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, VertexFormat} from '@luma.gl/core';
import {
  convertColorData,
  GPUDataEvaluator,
  GPUVectorEvaluator,
  type ColorInputFormat
} from '@luma.gl/gpgpu';
import {GPUData, GPUVector, type GPUVectorBufferProps} from '@luma.gl/tables';
import {DataType, Field, FixedSizeList, Float16, Float32, Uint8, Vector} from 'apache-arrow';
import {makeGPUVectorFromArrow} from './gpu/arrow-gpu-table-adapters';

export type ArrowColorType = FixedSizeList<Uint8> | FixedSizeList<Float16> | FixedSizeList<Float32>;
type ArrowUint8ColorType = FixedSizeList<Uint8>;

type ConvertColorsProps = {
  name?: string;
  inputFormat?: ColorInputFormat;
};

type ConvertArrowColorsProps = {
  name?: string;
  bufferProps?: GPUVectorBufferProps;
};

const ARROW_UINT8_COLOR_TYPE = new FixedSizeList(
  4,
  new Field('value', new Uint8(), false)
) as ArrowUint8ColorType;

/** Converts fixed-width GPU RGB/RGBA chunks to materialized normalized Uint8 RGBA chunks. */
export async function convertColors(
  device: Device,
  colors: GPUVector,
  props: ConvertColorsProps = {}
): Promise<GPUVector<'unorm8x4'>> {
  const source = GPUVectorEvaluator.fromGPUVector(colors);
  const converted = source.mapGPUData(data =>
    convertColorData(data, {inputFormat: props.inputFormat})
  );
  const evaluated = await converted.evaluate(device, {
    name: props.name ?? 'colors',
    format: 'unorm8x4'
  });
  const data = evaluated.data.map(
    chunk =>
      new GPUData<'unorm8x4'>({
        buffer: chunk.buffer,
        dataType: ARROW_UINT8_COLOR_TYPE,
        format: 'unorm8x4',
        length: chunk.length,
        stride: 4,
        byteOffset: chunk.byteOffset,
        byteStride: 4,
        rowByteLength: 4,
        ownsBuffer: true
      })
  );

  return new GPUVector({
    type: 'data',
    name: evaluated.name,
    dataType: ARROW_UINT8_COLOR_TYPE,
    format: 'unorm8x4',
    data,
    ownsData: true
  });
}

/** Returns true when an Arrow vector or fixed-width GPUVector can be converted to Uint8 RGBA. */
export function canConvertColors(colors: GPUVector | Vector): boolean {
  try {
    if (colors instanceof GPUVector) {
      for (const data of colors.data) {
        const evaluator = GPUDataEvaluator.fromGPUData(data);
        try {
          getColorInputFormat(evaluator);
        } finally {
          evaluator.destroy();
        }
      }
    } else {
      validateArrowColorType(colors.type, 'canConvertColors');
    }
    return true;
  } catch {
    return false;
  }
}

/** Uploads Arrow RGB/RGBA chunks unchanged, converts each chunk, and returns Uint8 RGBA rows. */
export async function convertArrowColors(
  device: Device,
  colors: Vector<ArrowColorType>,
  props: ConvertArrowColorsProps = {}
): Promise<GPUVector<'unorm8x4'>> {
  validateArrowColorType(colors.type, 'convertArrowColors');
  const inputFormat = getArrowColorInputFormat(colors.type);
  const source = makeGPUVectorFromArrow(device, colors, {
    ...props.bufferProps,
    name: props.name ? `${props.name}-source` : 'colors-source',
    format: getArrowColorGPUFormat(inputFormat),
    preserveDataChunks: true
  });

  try {
    return await convertColors(device, source, {
      name: props.name ?? 'colors',
      inputFormat
    });
  } finally {
    source.destroy();
  }
}

function getColorInputFormat(colors: GPUDataEvaluator): ColorInputFormat {
  const format = `${colors.type}x${colors.size}`;
  switch (format) {
    case 'uint8x3':
    case 'uint8x4':
    case 'float16x3':
    case 'float16x4':
    case 'float32x3':
    case 'float32x4':
      return format;
    default:
      throw new Error(`convertColors unsupported input format ${format}`);
  }
}

function getArrowColorInputFormat(type: ArrowColorType): ColorInputFormat {
  const childType = type.children[0].type;
  const scalarType =
    childType instanceof Uint8
      ? 'uint8'
      : childType instanceof Float16
        ? 'float16'
        : childType instanceof Float32
          ? 'float32'
          : null;
  if (!scalarType || (type.listSize !== 3 && type.listSize !== 4)) {
    throw new Error(`convertArrowColors unsupported input type ${type}`);
  }
  return `${scalarType}x${type.listSize}`;
}

function validateArrowColorType(
  type: DataType,
  functionName: string
): asserts type is ArrowColorType {
  const childType = DataType.isFixedSizeList(type) ? type.children[0].type : null;
  const supportedChildType =
    childType instanceof Uint8 || childType instanceof Float16 || childType instanceof Float32;
  if (!DataType.isFixedSizeList(type) || !supportedChildType || ![3, 4].includes(type.listSize)) {
    throw new Error(`${functionName}: Arrow data type ${type} is not supported`);
  }
}

function getArrowColorGPUFormat(inputFormat: ColorInputFormat): VertexFormat {
  switch (inputFormat) {
    case 'uint8x3':
      return 'uint8x3-webgl';
    case 'float16x3':
      // VertexFormat has no float16x3 entry. This adapter uses the byte-identical Uint16x3
      // storage layout while inputFormat retains the Float16 interpretation for conversion.
      return 'uint16x3-webgl';
    default:
      return inputFormat;
  }
}
