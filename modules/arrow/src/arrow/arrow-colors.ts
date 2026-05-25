// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferProps, type Device} from '@luma.gl/core';
import {backendRegistry, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {GPUVector, getArrowDataType, validateArrowDataType} from '@luma.gl/tables';
import type {TypedArray} from '@math.gl/types';
import {FixedSizeList, Float16, Float32, Uint8, Vector} from 'apache-arrow';
import {
  getArrowTypeByteStride,
  getArrowTypeStride,
  getArrowVectorBufferSource
} from './arrow-gpu-data';

export type ArrowColorType = FixedSizeList<Uint8> | FixedSizeList<Float16> | FixedSizeList<Float32>;
type ArrowUint8ColorType = FixedSizeList<Uint8>;
type ColorInputFormat =
  | 'uint8x3'
  | 'uint8x4'
  | 'float16x3'
  | 'float16x4'
  | 'float32x3'
  | 'float32x4';

type ConvertColorsProps = {
  name?: string;
};

type ConvertArrowColorsProps = {
  name?: string;
  bufferProps?: Omit<BufferProps, 'byteLength' | 'data'>;
};

const ARROW_COLOR_INPUT_TYPES = [
  getArrowDataType('uint8', 3),
  getArrowDataType('uint8', 4),
  getArrowDataType('float16', 3),
  getArrowDataType('float16', 4),
  getArrowDataType('float32', 3),
  getArrowDataType('float32', 4)
];
const ARROW_UINT8_COLOR_TYPE = getArrowDataType('uint8', 4) as ArrowUint8ColorType;

/** Converts packed GPUVector RGB/RGBA colors to a materialized Uint8 RGBA GPUVector. */
export async function convertColors(
  device: Device,
  colors: GPUVector,
  props: ConvertColorsProps = {}
): Promise<GPUVector<ArrowUint8ColorType>> {
  const source = GPUTableEvaluator.fromGPUVector(colors);
  const inputFormat = getGPUVectorColorInputFormat(source);
  const operation = new ConvertColorsOperation(source, inputFormat);
  const result = await operation.output.evaluate(device, {name: props.name ?? 'colors'});

  return new GPUVector({
    type: 'buffer',
    name: result.name,
    buffer: result.buffer,
    dataType: ARROW_UINT8_COLOR_TYPE,
    length: result.length,
    stride: result.stride,
    byteOffset: result.byteOffset,
    byteStride: result.byteStride,
    rowByteLength: result.rowByteLength,
    ownsBuffer: true
  }) as GPUVector<ArrowUint8ColorType>;
}

/** Returns true when an Arrow vector or packed GPUVector can be converted to Uint8 RGBA colors. */
export function canConvertColors(colors: GPUVector | Vector): boolean {
  try {
    if (colors instanceof GPUVector) {
      const source = GPUTableEvaluator.fromGPUVector(colors);
      try {
        getGPUVectorColorInputFormat(source);
      } finally {
        source.destroy();
      }
    } else {
      validateArrowDataType(colors.type, ARROW_COLOR_INPUT_TYPES, 'canConvertColors');
    }
    return true;
  } catch {
    return false;
  }
}

/** Uploads Arrow RGB/RGBA colors unchanged, converts them on GPU, and returns Uint8 RGBA rows. */
export async function convertArrowColors(
  device: Device,
  colors: Vector<ArrowColorType>,
  props: ConvertArrowColorsProps = {}
): Promise<GPUVector<ArrowUint8ColorType>> {
  validateArrowDataType(colors.type, ARROW_COLOR_INPUT_TYPES, 'convertArrowColors');
  const source = await makeMappedArrowGPUVector(device, colors, {
    name: props.name ? `${props.name}-source` : 'colors-source',
    ...props.bufferProps
  });

  try {
    return await convertColors(device, source, {name: props.name ?? 'colors'});
  } finally {
    source.destroy();
  }
}

class ConvertColorsOperation {
  readonly name = 'convert-colors';
  readonly inputs: {source: GPUTableEvaluator; inputFormat: ColorInputFormat};
  readonly dependencies: GPUTableEvaluator[];
  readonly output: GPUTableEvaluator;

  constructor(source: GPUTableEvaluator, inputFormat: ColorInputFormat) {
    this.inputs = {source, inputFormat};
    this.dependencies = [source];
    this.output = new GPUTableEvaluator({
      id: `convertColors(${source})`,
      type: 'uint8',
      size: 4,
      normalized: true,
      length: source.length,
      dataType: getArrowDataType('uint8', 4),
      source: this as never
    });
  }

  async execute(device: Device, target: Buffer): Promise<{success: boolean; value?: TypedArray}> {
    for (const dependency of this.dependencies) {
      await dependency.evaluate(device);
    }
    const handler = await backendRegistry.get(device.type, this.name);
    return handler({
      device: target.device,
      inputs: this.inputs,
      output: this.output,
      target
    });
  }

  toString(): string {
    return `convertColors(${this.inputs.source})`;
  }
}

async function makeMappedArrowGPUVector<T extends ArrowColorType>(
  device: Device,
  vector: Vector<T>,
  props: ConvertArrowColorsProps & {name: string}
): Promise<GPUVector<T>> {
  const {name, bufferProps = {}} = props;
  const values = getArrowVectorBufferSource(vector);
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    ...bufferProps,
    id: bufferProps.id ?? name,
    byteLength: values.byteLength
  });
  await buffer.mapAndWriteAsync(arrayBuffer => {
    new Uint8Array(arrayBuffer).set(
      new Uint8Array(values.buffer as ArrayBuffer, values.byteOffset, values.byteLength)
    );
  });

  const byteStride = getArrowTypeByteStride(vector.type);
  return new GPUVector({
    type: 'buffer',
    name,
    buffer,
    dataType: vector.type,
    length: vector.length,
    stride: getArrowTypeStride(vector.type),
    byteStride,
    rowByteLength: byteStride,
    ownsBuffer: true
  });
}

function getGPUVectorColorInputFormat(colors: GPUTableEvaluator): ColorInputFormat {
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
