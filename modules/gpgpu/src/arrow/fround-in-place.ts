// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowGPUVector} from '@luma.gl/arrow';
import {type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {froundShaderSource} from '../operations/webgpu/fround';

const WORKGROUP_SIZE = 64;

/**
 * Reinterprets a GPU-resident Float64 Arrow vector as high/low Float32 pairs in the same buffer.
 *
 * This function is intentionally independent of the GPUTable operation system. It mutates the
 * input vector's buffer in place with a WebGPU read-write storage pass, then transfers ownership
 * to the returned typed view over the same buffer.
 */
export function froundInPlace(
  fp64Vector: ArrowGPUVector<arrow.Float64>
): ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>>;
export function froundInPlace(
  fp64Vector: ArrowGPUVector<arrow.FixedSizeList<arrow.Float64>>
): ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>>;
export function froundInPlace(
  fp64Vector: ArrowGPUVector<arrow.Float64 | arrow.FixedSizeList<arrow.Float64>>
): ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> {
  const device = fp64Vector.buffer.device as Device;
  if (device.type !== 'webgpu') {
    throw new Error('froundInPlace requires a WebGPU device');
  }

  const size = getFloat64VectorSize(fp64Vector);
  if (fp64Vector.byteOffset % 4 !== 0) {
    throw new Error('froundInPlace requires byteOffset to be aligned to uint32');
  }
  if (fp64Vector.byteStride % 4 !== 0) {
    throw new Error('froundInPlace requires byteStride to be aligned to uint32');
  }

  const inputElementCount = size * 2;
  const byteOffset = fp64Vector.byteOffset / 4;
  const byteStride = fp64Vector.byteStride / 4;
  const source = getFroundInPlaceShader({
    byteOffset,
    byteStride,
    inputElementCount,
    length: fp64Vector.length
  });

  const computation = new Computation(device, {
    source,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
    }
  });

  computation.setBindings({data: fp64Vector.buffer});
  const computePass = device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(fp64Vector.length / WORKGROUP_SIZE));
  computePass.end();
  device.submit();
  computation.destroy();

  const roundedVector = new ArrowGPUVector({
    type: 'buffer',
    name: `${fp64Vector.name}_fround`,
    buffer: fp64Vector.buffer,
    arrowType: new arrow.FixedSizeList(
      inputElementCount,
      new arrow.Field('value', new arrow.Float32())
    ),
    length: fp64Vector.length,
    byteOffset: fp64Vector.byteOffset,
    byteStride: fp64Vector.byteStride,
    ownsBuffer: false
  });
  fp64Vector.transferBufferOwnership(roundedVector);
  return roundedVector;
}

function getFroundInPlaceShader({
  byteOffset,
  byteStride,
  inputElementCount,
  length
}: {
  byteOffset: number;
  byteStride: number;
  inputElementCount: number;
  length: number;
}): string {
  return /* wgsl */ `
${preprocess(froundShaderSource, {
  X_LEN: inputElementCount.toString(),
  RESULT_LEN: inputElementCount.toString()
})}

@group(0) @binding(0) var<storage, read_write> data: array<u32>;

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${length}u) {
    return;
  }

  let rowOffset = ${byteOffset}u + rowIndex * ${byteStride}u;
  var input: array<u32, ${inputElementCount}>;
  for (var elementIndex = 0u; elementIndex < ${inputElementCount}u; elementIndex = elementIndex + 1u) {
    input[elementIndex] = data[rowOffset + elementIndex];
  }

  let result = fround(input);
  for (var elementIndex = 0u; elementIndex < ${inputElementCount}u; elementIndex = elementIndex + 1u) {
    data[rowOffset + elementIndex] = bitcast<u32>(result[elementIndex]);
  }
}
`;
}

function getFloat64VectorSize(
  vector: ArrowGPUVector<arrow.Float64 | arrow.FixedSizeList<arrow.Float64>>
): number {
  const type = vector.type;
  if (arrow.DataType.isFixedSizeList(type)) {
    const childType = type.children[0].type;
    if (arrow.DataType.isFloat(childType) && childType.precision === arrow.Precision.DOUBLE) {
      return type.listSize;
    }
  }
  if (arrow.DataType.isFloat(type) && type.precision === arrow.Precision.DOUBLE) {
    return 1;
  }
  throw new Error('froundInPlace requires a Float64 ArrowGPUVector');
}

function preprocess(source: string, defines: Record<string, string>): string {
  for (const key in defines) {
    source = source.replaceAll(`{${key}}`, defines[key]);
  }
  return source;
}
