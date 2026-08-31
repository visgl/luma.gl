// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Computation} from '@luma.gl/engine';
import {getGPUVectorFormatInfo} from '../../gpu-data/gpu-vector-format';
import type {OperationHandler} from '../../operation/operation';
import type {CastDataInputs} from '../cast-data';

const WORKGROUP_SIZE = 64;
const GPGPU_OPERATION_STATS = 'GPGPU Operation Counts';
const COMPUTATION_RUNS = 'Computation Runs';

/** WebGPU raw-byte numeric conversion for compact and 32-bit fixed-width formats. */
export const castData: OperationHandler<CastDataInputs> = async ({inputs, output, target}) => {
  const outputWordCount = Math.ceil(output.byteLength / 4);
  const computation = new Computation(target.device, {
    source: getCastDataWGSL(inputs, output.length),
    shaderLayout: {
      bindings: [
        {name: 'source', type: 'storage', group: 0, location: 0},
        {name: 'result', type: 'storage', group: 0, location: 1}
      ]
    }
  });
  computation.setBindings({source: inputs.source.buffer, result: target});
  if (outputWordCount > 0) {
    const computePass = target.device.beginComputePass({});
    target.device.statsManager
      .getStats(GPGPU_OPERATION_STATS)
      .get(COMPUTATION_RUNS)
      .incrementCount();
    computation.dispatch(computePass, Math.ceil(outputWordCount / WORKGROUP_SIZE));
    computePass.end();
    target.device.submit();
  }
  computation.destroy();
  return {success: true};
};

function getCastDataWGSL(inputs: CastDataInputs, rowCount: number): string {
  const inputInfo = getGPUVectorFormatInfo(inputs.inputFormat);
  const outputInfo = getGPUVectorFormatInfo(inputs.outputFormat);
  const componentCount = inputInfo.components;
  const scalarCount = rowCount * componentCount;
  const outputComponentByteLength = outputInfo.elementByteLength / outputInfo.components;
  const scalarsPerWord = 4 / outputComponentByteLength;
  return /* wgsl */ `\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  return (word >> ((byteIndex % 4u) * 8u)) & 0xffu;
}

fn readUint16(byteIndex: u32) -> u32 {
  return readByte(byteIndex) | (readByte(byteIndex + 1u) << 8u);
}

fn readSourceValue(scalarIndex: u32) -> f32 {
  let rowIndex = scalarIndex / ${componentCount}u;
  let componentIndex = scalarIndex % ${componentCount}u;
  let byteIndex = ${inputs.source.offset}u + rowIndex * ${inputs.source.stride}u +
    componentIndex * ${inputInfo.elementByteLength / componentCount}u;
  ${getReadValueExpression(inputInfo.signedDataType, inputInfo.normalized)}
}

${getEncodeValueFunction(inputs.outputFormat)}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let wordIndex = id.x;
  let firstScalarIndex = wordIndex * ${scalarsPerWord}u;
  if (firstScalarIndex >= ${scalarCount}u) {
    return;
  }
  ${getPackOutputWord(outputInfo.signedDataType, outputComponentByteLength, scalarCount)}
}
`;
}

function getReadValueExpression(type: string, normalized: boolean): string {
  switch (type) {
    case 'float32':
      return 'return bitcast<f32>(source[byteIndex / 4u]);';
    case 'float16':
      return `let values = unpack2x16float(source[byteIndex / 4u]);
  return select(values.x, values.y, byteIndex % 4u == 2u);`;
    case 'uint8':
      return normalized
        ? 'return f32(readByte(byteIndex)) / 255.0;'
        : 'return f32(readByte(byteIndex));';
    case 'sint8':
      return normalized
        ? 'return max(f32(i32(readByte(byteIndex) << 24u) >> 24) / 127.0, -1.0);'
        : 'return f32(i32(readByte(byteIndex) << 24u) >> 24);';
    case 'uint16':
      return normalized
        ? 'return f32(readUint16(byteIndex)) / 65535.0;'
        : 'return f32(readUint16(byteIndex));';
    case 'sint16':
      return normalized
        ? 'return max(f32(i32(readUint16(byteIndex) << 16u) >> 16) / 32767.0, -1.0);'
        : 'return f32(i32(readUint16(byteIndex) << 16u) >> 16);';
    case 'uint32':
      return normalized
        ? 'return f32(source[byteIndex / 4u]) / 4294967295.0;'
        : 'return f32(source[byteIndex / 4u]);';
    case 'sint32':
      return normalized
        ? 'return max(f32(bitcast<i32>(source[byteIndex / 4u])) / 2147483647.0, -1.0);'
        : 'return f32(bitcast<i32>(source[byteIndex / 4u]));';
    default:
      throw new Error(`castData WebGPU input does not support ${type}`);
  }
}

function getEncodeValueFunction(outputFormat: CastDataInputs['outputFormat']): string {
  const outputInfo = getGPUVectorFormatInfo(outputFormat);
  const {signedDataType, normalized} = outputInfo;
  if (signedDataType === 'float32' || signedDataType === 'float16') {
    return 'fn encodeValue(value: f32) -> f32 { return value; }';
  }
  const maximum = getIntegerMaximum(signedDataType);
  const minimum = signedDataType.startsWith('sint') ? -maximum : 0;
  const value = normalized
    ? `round(clamp(value, ${minimum < 0 ? '-1.0' : '0.0'}, 1.0) * ${maximum}.0)`
    : `round(clamp(value, ${minimum}.0, ${maximum}.0))`;
  return `fn encodeValue(value: f32) -> f32 { return ${value}; }`;
}

function getPackOutputWord(type: string, componentByteLength: number, scalarCount: number): string {
  if (componentByteLength === 4) {
    const encoded = 'encodeValue(readSourceValue(firstScalarIndex))';
    if (type === 'float32') return `result[wordIndex] = bitcast<u32>(${encoded});`;
    if (type === 'sint32') return `result[wordIndex] = bitcast<u32>(i32(${encoded}));`;
    return `result[wordIndex] = u32(${encoded});`;
  }
  if (componentByteLength === 2 && type === 'float16') {
    return `let second = select(0.0, readSourceValue(firstScalarIndex + 1u), firstScalarIndex + 1u < ${scalarCount}u);
  result[wordIndex] = pack2x16float(vec2<f32>(
    encodeValue(readSourceValue(firstScalarIndex)),
    encodeValue(second)
  ));`;
  }
  const scalarSlots = 4 / componentByteLength;
  const bitWidth = componentByteLength * 8;
  const mask = bitWidth === 8 ? '0xffu' : '0xffffu';
  const values = Array.from({length: scalarSlots}, (_, slot) => {
    const scalarIndex = `firstScalarIndex + ${slot}u`;
    const encoded = type.startsWith('sint')
      ? `bitcast<u32>(i32(encodeValue(readSourceValue(${scalarIndex}))))`
      : `u32(encodeValue(readSourceValue(${scalarIndex})))`;
    return `select(0u, (${encoded}) & ${mask}, ${scalarIndex} < ${scalarCount}u) << ${slot * bitWidth}u`;
  });
  return `result[wordIndex] = ${values.join(' |\n    ')};`;
}

function getIntegerMaximum(type: string): number {
  switch (type) {
    case 'sint8':
      return 127;
    case 'uint8':
      return 255;
    case 'sint16':
      return 32767;
    case 'uint16':
      return 65535;
    case 'sint32':
      return 2147483647;
    case 'uint32':
      return 4294967295;
    default:
      throw new Error(`castData WebGPU output does not support ${type}`);
  }
}
