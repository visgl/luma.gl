// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type VertexFormat} from '@luma.gl/core';
import {
  convertColorData,
  type ColorInputFormat
} from '../gpu-simple-graph/operations/convert-colors';
import {GPUDataEvaluator} from '../gpu-simple-graph/operation/gpu-data-evaluator';
import {GPUVectorEvaluator} from '../gpu-simple-graph/operation/gpu-vector-evaluator';
import {
  CPUData,
  CPUVector,
  resolveColorOutputFormat,
  getGPUVectorFormatInfo,
  GPUData,
  GPUVector,
  type ColorConversionOptions,
  type ColorOutputFormat,
  type GPUVectorBufferProps
} from '@luma.gl/graph/gpu-data';
import {DataType, Field, FixedSizeList, Float16, Float32, Uint8, Vector} from 'apache-arrow';
import {makeGPUVectorFromArrow, readArrowGPUVectorAsync} from './gpu/arrow-gpu-vector-adapters';
import {getArrowDataBufferSource, getArrowGPUDataReadbackMetadata} from './gpu/arrow-gpu-data';
import type {GPUDataReadbackMetadata} from './gpu/arrow-gpu-data';
import type {AttributeArrowType} from './arrow-utils/arrow-types';
import type {Data} from 'apache-arrow';
import {convertCPUColorData} from '../gpu-data/color-conversion';

export type ArrowColorType = FixedSizeList<Uint8> | FixedSizeList<Float16> | FixedSizeList<Float32>;
type ArrowUint8ColorType = FixedSizeList<Uint8>;

type ConvertColorsProps = ColorConversionOptions & {
  name?: string;
  inputFormat?: ColorInputFormat;
};

type ConvertArrowColorsProps = ColorConversionOptions & {
  /** Convert Arrow payloads before uploading; avoids source upload and readback on CPU backends. */
  preferCPU?: boolean;
  name?: string;
  bufferProps?: GPUVectorBufferProps;
};

const ARROW_UINT8_COLOR_TYPE = new FixedSizeList(
  4,
  new Field('value', new Uint8(), false)
) as ArrowUint8ColorType;

/** Converts fixed-width GPU RGB/RGBA chunks; preserve returns a borrowed wrapper when compatible. */
export function convertColors(
  device: Device,
  colors: GPUVector,
  props?: ConvertColorsProps & {format?: 'unorm8x4'}
): Promise<GPUVector<'unorm8x4'>>;
export function convertColors<T extends ColorOutputFormat>(
  device: Device,
  colors: GPUVector,
  props: ConvertColorsProps & {format: T}
): Promise<GPUVector<T>>;
export function convertColors(
  device: Device,
  colors: GPUVector,
  props: ConvertColorsProps
): Promise<GPUVector<ColorOutputFormat>>;
export async function convertColors(
  device: Device,
  colors: GPUVector,
  props: ConvertColorsProps = {}
): Promise<GPUVector<ColorOutputFormat>> {
  const format = resolveColorOutputFormat(
    props.inputFormat?.startsWith('float16') ? 'float16x4' : colors.format!,
    props
  );
  const outputType = getColorArrowType(format);
  const stride = getGPUVectorFormatInfo(format).byteLength;
  if (props.format === 'preserve' && colors.format === format) {
    return new GPUVector<ColorOutputFormat>({
      type: 'data',
      name: props.name ?? colors.name,
      format,
      dataType: outputType,
      data: colors.data as GPUData<ColorOutputFormat>[],
      ownsData: false
    });
  }
  const source = GPUVectorEvaluator.fromGPUVector(colors);
  const converted = source.mapGPUData(data =>
    convertColorData(data, {inputFormat: props.inputFormat, format})
  );
  const outputBuffers: Buffer[] = [];
  try {
    converted.gpuDataEvaluators.forEach((evaluator, chunkIndex) => {
      const buffer = device.createBuffer({
        id: `${props.name ?? 'colors'}-${chunkIndex}`,
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: Math.max(evaluator.byteLength, 4)
      });
      evaluator.setTargetBuffer({buffer});
      outputBuffers.push(buffer);
    });
    const evaluated = await converted.evaluate(device, {
      name: props.name ?? 'colors',
      format
    });
    const data = evaluated.data.map((chunk, chunkIndex) => {
      const sourceData = colors.data[chunkIndex];
      const readbackMetadata = sourceData
        ? getConvertedColorReadbackMetadata(sourceData)
        : undefined;
      return new GPUData<ColorOutputFormat>({
        buffer: outputBuffers[chunkIndex],
        dataType: outputType,
        format,
        length: chunk.length,
        stride,
        byteOffset: chunk.byteOffset,
        byteStride: stride,
        rowByteLength: stride,
        ownsBuffer: true,
        nullBitmap: readbackMetadata?.nullBitmap,
        readbackMetadata
      });
    });

    return new GPUVector({
      type: 'data',
      name: evaluated.name,
      dataType: outputType,
      format,
      data,
      ownsData: true
    });
  } catch (error) {
    for (const buffer of outputBuffers) {
      buffer.destroy();
    }
    throw error;
  } finally {
    converted.destroy();
    source.destroy();
  }
}

/** Returns true for supported fixed-width RGB/RGBA Arrow or GPU inputs. */
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

/** Converts Arrow RGB/RGBA chunks to selected storage without changing color space or alpha convention. */
export function convertArrowColors(
  device: Device,
  colors: Vector<ArrowColorType>,
  props?: ConvertArrowColorsProps & {format?: 'unorm8x4'}
): Promise<GPUVector<'unorm8x4'>>;
export function convertArrowColors<T extends ColorOutputFormat>(
  device: Device,
  colors: Vector<ArrowColorType>,
  props: ConvertArrowColorsProps & {format: T}
): Promise<GPUVector<T>>;
export function convertArrowColors(
  device: Device,
  colors: Vector<ArrowColorType>,
  props: ConvertArrowColorsProps
): Promise<GPUVector<ColorOutputFormat>>;
export async function convertArrowColors(
  device: Device,
  colors: Vector<ArrowColorType>,
  props: ConvertArrowColorsProps = {}
): Promise<GPUVector<ColorOutputFormat>> {
  validateArrowColorType(colors.type, 'convertArrowColors');
  const inputFormat = getArrowColorInputFormat(colors.type);
  const sourceFormat = getArrowColorGPUFormat(inputFormat);
  const format = resolveColorOutputFormat(
    inputFormat.startsWith('float16') ? 'float16x4' : sourceFormat,
    props
  );
  if (
    props.format === 'preserve' &&
    (sourceFormat === format || (sourceFormat === 'uint8x4' && format === 'unorm8x4'))
  ) {
    return makeGPUVectorFromArrow(device, colors, {
      ...props.bufferProps,
      name: props.name ?? 'colors',
      format,
      preserveDataChunks: true
    });
  }
  if (props.preferCPU || device.type !== 'webgpu') {
    const cpuSource = new CPUVector({
      name: props.name ?? 'colors',
      format: sourceFormat,
      data: colors.data.map(
        chunk =>
          new CPUData({
            buffer: getArrowDataBufferSource(chunk as Data<AttributeArrowType>),
            format: sourceFormat,
            length: chunk.length,
            nullBitmap: getArrowGPUDataReadbackMetadata(chunk)?.nullBitmap
          })
      )
    });
    const data: GPUData<ColorOutputFormat>[] = [];
    try {
      for (const chunk of cpuSource.data) {
        const converted = convertCPUColorData(chunk, format, inputFormat);
        const bytes = new Uint8Array(
          converted.buffer,
          converted.byteOffset,
          converted.length * converted.byteStride
        );
        const readbackMetadata = getConvertedColorReadbackMetadata({
          nullBitmap: chunk.nullBitmap,
          length: chunk.length
        });
        data.push(
          new GPUData({
            buffer: device.createBuffer({
              ...props.bufferProps,
              byteLength: Math.max(bytes.length, 4),
              data: bytes.length ? bytes : new Uint8Array(4),
              usage:
                props.bufferProps?.usage ??
                Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
            }),
            format,
            dataType: getColorArrowType(format),
            length: chunk.length,
            ownsBuffer: true,
            nullBitmap: readbackMetadata?.nullBitmap,
            readbackMetadata
          })
        );
      }
      return new GPUVector({
        type: 'data',
        name: props.name ?? 'colors',
        format,
        dataType: getColorArrowType(format),
        data,
        ownsData: true
      });
    } catch (error) {
      for (const chunk of data) chunk.destroy();
      throw error;
    }
  }

  const source = makeGPUVectorFromArrow(device, colors, {
    ...props.bufferProps,
    name: props.name ? `${props.name}-source` : 'colors-source',
    format: getArrowColorGPUFormat(inputFormat),
    preserveDataChunks: true
  });

  try {
    return await convertColors(device, source, {
      name: props.name ?? 'colors',
      inputFormat,
      format
    });
  } finally {
    source.destroy();
  }
}

/** Converts color storage and reads it back; floating outputs retain HDR and negative channels. */
export function convertArrowColorsToArrow(
  device: Device,
  colors: Vector<ArrowColorType>,
  props?: ConvertArrowColorsProps & {format?: 'unorm8x4'}
): Promise<Vector<ArrowUint8ColorType>>;
export function convertArrowColorsToArrow(
  device: Device,
  colors: Vector<ArrowColorType>,
  props: ConvertArrowColorsProps
): Promise<Vector<ArrowColorType>>;
export async function convertArrowColorsToArrow(
  device: Device,
  colors: Vector<ArrowColorType>,
  props: ConvertArrowColorsProps = {}
): Promise<Vector<ArrowColorType>> {
  const converted = await convertArrowColors(device, colors, props);
  try {
    return await readArrowGPUVectorAsync<ArrowColorType>(converted);
  } finally {
    converted.destroy();
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

function getConvertedColorReadbackMetadata(
  source: Pick<GPUData, 'nullBitmap' | 'length'>
): Extract<GPUDataReadbackMetadata, {kind: 'fixed-size-list'}> | undefined {
  const sourceNullBitmap = source.nullBitmap;
  if (!sourceNullBitmap) {
    return undefined;
  }

  const nullBitmap = new Uint8Array(sourceNullBitmap);
  let nullCount = 0;
  for (let rowIndex = 0; rowIndex < source.length; rowIndex++) {
    if ((nullBitmap[rowIndex >> 3] & (1 << (rowIndex & 7))) === 0) {
      nullCount++;
    }
  }
  return nullCount > 0
    ? {kind: 'fixed-size-list', nullCount, nullBitmap, childNullCount: 0}
    : undefined;
}

function getColorArrowType(format: ColorOutputFormat): ArrowColorType {
  return format === 'unorm8x4'
    ? ARROW_UINT8_COLOR_TYPE
    : format === 'float16x4'
      ? new FixedSizeList(4, new Field('value', new Float16(), false))
      : new FixedSizeList(4, new Field('value', new Float32(), false));
}
