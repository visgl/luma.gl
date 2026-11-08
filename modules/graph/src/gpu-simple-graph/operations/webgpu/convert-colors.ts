// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Kernel} from '../../../execution/compute/kernel';
import type {OperationHandler} from '../../operation/operation';
import type {ConvertColorsInputs} from '../convert-colors';

const WORKGROUP_SIZE = 64;
const GPGPU_OPERATION_STATS = 'GPGPU Operation Counts';
const COMPUTATION_RUNS = 'Computation Runs';

export const convertColors: OperationHandler<ConvertColorsInputs> = async ({
  inputs,
  output,
  target,
  scope
}) => {
  const {source, inputFormat} = inputs;
  if (output.length === 0) return {success: true};
  const kernel = new Kernel(target.device, {
    source: getConvertColorsWGSL(
      inputFormat,
      source.offset,
      source.stride,
      output.length,
      inputs.outputFormat
    ),
    shaderLayout: {
      bindings: [
        {name: 'source', type: 'storage' as const, group: 0, location: 0},
        {name: 'result', type: 'storage' as const, group: 0, location: 1}
      ]
    }
  });

  const kernelBindings = {
    source: source.buffer,
    result: target
  };

  if (scope) scope.retain(() => kernel.destroy());
  try {
    const computePass = scope
      ? scope.commandEncoder.beginComputePass({})
      : target.device.beginComputePass({});
    try {
      target.device.statsManager
        .getStats(GPGPU_OPERATION_STATS)
        .get(COMPUTATION_RUNS)
        .incrementCount();
      kernel.dispatch(computePass, {
        bindings: kernelBindings,
        x: Math.ceil(output.length / WORKGROUP_SIZE)
      });
    } finally {
      computePass.end();
    }
    if (!scope) target.device.submit();
  } finally {
    if (!scope) kernel.destroy();
  }

  return {success: true};
};
convertColors.supportsEvaluationScope = true;

function getConvertColorsWGSL(
  inputFormat: ConvertColorsInputs['inputFormat'],
  byteOffset: number,
  byteStride: number,
  length: number,
  outputFormat: ConvertColorsInputs['outputFormat']
): string {
  return /* wgsl */ `\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

// Treat the storage binding as raw 32-bit words so one shader can address packed Uint8, Float16,
// and Float32 rows with arbitrary supported strides. The float readers decode IEEE bit patterns;
// they do not numerically convert integer values to floats.

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  let shift = (byteIndex % 4u) * 8u;
  return (word >> shift) & 0xffu;
}

fn readUint8(byteIndex: u32) -> f32 {
  return f32(readByte(byteIndex)) / 255.0;
}

fn readFloat16Bits(byteIndex: u32) -> f32 {
  let word = source[byteIndex / 4u];
  let values = unpack2x16float(word);
  return select(values.x, values.y, byteIndex % 4u == 2u);
}

fn readFloat32Bits(byteIndex: u32) -> f32 {
  return bitcast<f32>(source[byteIndex / 4u]);
}

fn readColor(rowIndex: u32) -> vec4<f32> {
  let rowByteOffset = ${byteOffset}u + rowIndex * ${byteStride}u;
${getReadColorWGSL(inputFormat)}
}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${length}u) {
    return;
  }

  let color = readColor(rowIndex);
${
  outputFormat === 'unorm8x4'
    ? '  result[rowIndex] = pack4x8unorm(color);'
    : outputFormat === 'float16x4'
      ? `  result[rowIndex * 2u] = pack2x16float(color.xy);
  result[rowIndex * 2u + 1u] = pack2x16float(color.zw);`
      : `  result[rowIndex * 4u] = bitcast<u32>(color.x);
  result[rowIndex * 4u + 1u] = bitcast<u32>(color.y);
  result[rowIndex * 4u + 2u] = bitcast<u32>(color.z);
  result[rowIndex * 4u + 3u] = bitcast<u32>(color.w);`
}
}
`;
}

function getReadColorWGSL(inputFormat: ConvertColorsInputs['inputFormat']): string {
  switch (inputFormat) {
    case 'uint8x3':
      return `  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    1.0
  );`;
    case 'uint8x4':
      return `  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    readUint8(rowByteOffset + 3u)
  );`;
    case 'float16x3':
      return `  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    1.0
  );`;
    case 'float16x4':
      return `  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    readFloat16Bits(rowByteOffset + 6u)
  );`;
    case 'float32x3':
      return `  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    1.0
  );`;
    case 'float32x4':
      return `  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    readFloat32Bits(rowByteOffset + 12u)
  );`;
    default: {
      const unreachable: never = inputFormat;
      throw new Error(`Unsupported color input format ${unreachable}`);
    }
  }
}
