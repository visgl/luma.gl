// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowGPUVector} from '@luma.gl/arrow';
import {type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';

const WORKGROUP_SIZE = 64;

type AddInPlaceScalarType = arrow.Float32 | arrow.Int32 | arrow.Uint32;
type AddInPlaceType = AddInPlaceScalarType | arrow.FixedSizeList<AddInPlaceScalarType>;

/** Options for {@link addInPlace}. */
export type ArrowGPUAddInPlaceProps = {
  /** Name assigned to the returned same-buffer vector view. */
  name?: string;
};

/**
 * Adds `y` into `x` in place and returns a new same-buffer vector view.
 *
 * This helper is intentionally independent of the GPUTable operation system. It uses a WebGPU
 * read-write storage pass, supports raw 32-bit storage types, mutates `x.buffer`, and transfers
 * buffer ownership from `x` to the returned vector. `y` is never destroyed or mutated.
 */
export function addInPlace<T extends AddInPlaceType>(
  x: ArrowGPUVector<T>,
  y: ArrowGPUVector<T>,
  props?: ArrowGPUAddInPlaceProps
): ArrowGPUVector<T>;
export function addInPlace(
  x: ArrowGPUVector<AddInPlaceType>,
  y: ArrowGPUVector<AddInPlaceType>,
  props: ArrowGPUAddInPlaceProps = {}
): ArrowGPUVector<AddInPlaceType> {
  const device = x.buffer.device as Device;
  if (device.type !== 'webgpu') {
    throw new Error('addInPlace requires a WebGPU device');
  }

  validateMatchingLayout(x, y);

  const {shaderType, size} = getVectorStorageType(x);
  const xByteOffset = getAlignedUint32Offset(x, 'x');
  const yByteOffset = getAlignedUint32Offset(y, 'y');
  const xByteStride = getAlignedUint32Stride(x, 'x');
  const yByteStride = getAlignedUint32Stride(y, 'y');
  const source = getAddInPlaceShader({
    shaderType,
    size,
    length: x.length,
    xByteOffset,
    yByteOffset,
    xByteStride,
    yByteStride
  });

  const computation = new Computation(device, {
    source,
    shaderLayout: {
      bindings: [
        {name: 'x', type: 'storage', group: 0, location: 0},
        {name: 'y', type: 'storage', group: 0, location: 1}
      ]
    }
  });

  computation.setBindings({x: x.buffer, y: y.buffer});
  const computePass = device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(x.length / WORKGROUP_SIZE));
  computePass.end();
  device.submit();
  computation.destroy();

  const result = new ArrowGPUVector<any>({
    type: 'buffer',
    name: props.name || `${x.name}_${y.name}_add`,
    buffer: x.buffer,
    arrowType: x.type,
    length: x.length,
    byteOffset: x.byteOffset,
    byteStride: x.byteStride,
    ownsBuffer: false
  } as any) as ArrowGPUVector<AddInPlaceType>;
  x.transferBufferOwnership(result);
  return result;
}

function validateMatchingLayout(
  x: ArrowGPUVector<AddInPlaceType>,
  y: ArrowGPUVector<AddInPlaceType>
): void {
  if (x.length !== y.length) {
    throw new Error(`addInPlace requires matching vector lengths, got ${x.length} and ${y.length}`);
  }

  const xStorageType = getVectorStorageType(x);
  const yStorageType = getVectorStorageType(y);
  if (
    xStorageType.shaderType !== yStorageType.shaderType ||
    xStorageType.size !== yStorageType.size
  ) {
    throw new Error('addInPlace requires matching 32-bit storage types and vector sizes');
  }
}

function getVectorStorageType(vector: ArrowGPUVector<AddInPlaceType>): {
  shaderType: 'f32' | 'i32' | 'u32';
  size: number;
} {
  const type = vector.type;
  if (arrow.DataType.isFixedSizeList(type)) {
    const childType = type.children[0].type;
    return {shaderType: getScalarStorageType(childType), size: type.listSize};
  }
  return {shaderType: getScalarStorageType(type), size: 1};
}

function getScalarStorageType(type: arrow.DataType): 'f32' | 'i32' | 'u32' {
  if (arrow.DataType.isFloat(type) && type.precision === arrow.Precision.SINGLE) {
    return 'f32';
  }
  if (arrow.DataType.isInt(type) && type.bitWidth === 32) {
    return type.isSigned ? 'i32' : 'u32';
  }
  throw new Error('addInPlace supports only Float32, Int32, and Uint32 ArrowGPUVectors');
}

function getAlignedUint32Offset(vector: ArrowGPUVector, name: string): number {
  if (vector.byteOffset % 4 !== 0) {
    throw new Error(`addInPlace requires ${name}.byteOffset to be aligned to uint32`);
  }
  return vector.byteOffset / 4;
}

function getAlignedUint32Stride(vector: ArrowGPUVector, name: string): number {
  if (vector.byteStride % 4 !== 0) {
    throw new Error(`addInPlace requires ${name}.byteStride to be aligned to uint32`);
  }
  return vector.byteStride / 4;
}

function getAddInPlaceShader({
  shaderType,
  size,
  length,
  xByteOffset,
  yByteOffset,
  xByteStride,
  yByteStride
}: {
  shaderType: 'f32' | 'i32' | 'u32';
  size: number;
  length: number;
  xByteOffset: number;
  yByteOffset: number;
  xByteStride: number;
  yByteStride: number;
}): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> x: array<${shaderType}>;
@group(0) @binding(1) var<storage, read> y: array<${shaderType}>;

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${length}u) {
    return;
  }

  let xRowOffset = ${xByteOffset}u + rowIndex * ${xByteStride}u;
  let yRowOffset = ${yByteOffset}u + rowIndex * ${yByteStride}u;
  for (var elementIndex = 0u; elementIndex < ${size}u; elementIndex = elementIndex + 1u) {
    x[xRowOffset + elementIndex] = x[xRowOffset + elementIndex] + y[yRowOffset + elementIndex];
  }
}
`;
}
