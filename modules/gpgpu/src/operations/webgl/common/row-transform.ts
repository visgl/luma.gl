// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SignedDataType, Buffer, BufferLayout} from '@luma.gl/core';
import {BufferTransform} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {getGPUVectorBuffer, GPUTableEvaluator} from '../../../operation/gpu-table-evaluator';
import {bufferPool} from '../../../utils/buffer-pool';
import {getAttributeType, getZeroLiteral, type QualifiedVectorSize} from './helper';

export function runRowTransform({
  module,
  elementWise = false,
  inputs,
  output,
  operationType = output.type,
  outputBuffer
}: {
  module: ShaderModule;
  elementWise?: boolean;
  inputs: {[name: string]: GPUTableEvaluator};
  output: GPUTableEvaluator;
  /** If specified, coerce all parameters to operation to this type.
   * Default to output's data type.
   */
  operationType?: SignedDataType;
  outputBuffer: Buffer;
}): void {
  const device = outputBuffer.device;
  const outputModule = getOutputModule('result', output.type, output.size);
  const modules: ShaderModule[] = [module, outputModule];
  const bufferLayout: BufferLayout[] = [];
  const inputBuffers: {[name: string]: Buffer} = {};
  const outputType = getAttributeType(output.type, 1);
  const castToType = getAttributeType(operationType, 1);
  let inputBlock = '';

  let placeholderBuffer: Buffer | null = null;

  const defines: Record<string, string> = {
    TYPE: castToType,
    RESULT_LEN: output.size.toString()
  };

  for (const name in inputs) {
    const input = inputs[name];
    modules.push(getInputModule(name, input.type, input.size, operationType));
    bufferLayout.push(getInputBufferLayout(name, input));
    if (input instanceof GPUTableEvaluator) {
      inputBuffers[name] = getGPUVectorBuffer(input.gpuVector);
    } else {
      placeholderBuffer =
        placeholderBuffer || bufferPool.createOrReuse(device, outputBuffer.byteLength);
      inputBuffers[name] = placeholderBuffer;
    }

    inputBlock += `TYPE ${name}[${input.size}]; get_${name}(${name});\n`;
    defines[`${name.toUpperCase()}_LEN`] = input.size.toString();
  }

  let computeResult = '';

  if (elementWise) {
    for (let i = 0; i < output.size; i++) {
      const zero = getZeroLiteral(castToType);
      const elementInputs = Object.keys(inputs).map(name => {
        if (i < inputs[name].size) return `${name}[${i}]`;
        return zero;
      });
      computeResult += `result[${i}]=${module.name}(${elementInputs.join(', ')});\n`;
    }
  } else {
    computeResult = `${module.name}(${Object.keys(inputs).join(', ')}, result);`;
  }

  const vertexShader = /* glsl */ `\
#version 300 es

void main() {
${inputBlock}
${outputType} result[${output.size}];
${computeResult}
set_result(result);
}
  `;

  const transform = new BufferTransform(device, {
    vs: vertexShader,
    // @ts-expect-error defines can only be boolean?
    defines,
    modules,
    bufferLayout,
    vertexCount: 1,
    instanceCount: output.length,
    attributes: inputBuffers,
    feedbackBufferMode: 'interleaved',
    outputs: outputModule.varyings
  });

  transform.run({
    inputBuffers: inputBuffers,
    outputBuffers: {[outputModule.varyings[0]]: outputBuffer}
  });
  if (placeholderBuffer) {
    bufferPool.recycle(placeholderBuffer);
  }
}

export function getInputModule(
  name: string,
  inType: SignedDataType,
  inSize: number,
  outType: SignedDataType = inType
): ShaderModule {
  let attributeBlock = '';
  let funcBlock = '';

  for (let i = 0; i < inSize; i += 4) {
    const size = Math.min(inSize - i, 4) as QualifiedVectorSize;
    const inDataType = getAttributeType(inType, size);

    attributeBlock += `in ${inDataType} a${name}_${i};\n`;

    for (let j = 0; j < size; j++) {
      let element = `a${name}_${i}`;
      if (size > 1) {
        element = `${element}[${j}]`;
      }
      if (inType !== outType) {
        element = `TYPE(${element})`;
      }
      funcBlock += `v[${i + j}]=${element};\n`;
    }
  }

  const vs = `
${attributeBlock}
void get_${name}(out TYPE v[${inSize}]) {
  ${funcBlock}
}
`;

  return {
    name,
    vs
  } as ShaderModule;
}

export function getInputBufferLayout(name: string, source: GPUTableEvaluator): BufferLayout {
  const bufferLayout: BufferLayout = {
    name,
    stepMode: source.isConstant ? 'vertex' : 'instance',
    byteStride: source.stride,
    attributes: []
  };
  for (let i = 0; i < source.size; i += 4) {
    const size = Math.min(source.size - i, 4) as QualifiedVectorSize;
    bufferLayout.attributes!.push({
      attribute: `a${name}_${i}`,
      // @ts-ignore
      format: size === 1 ? source.type : `${source.type}x${size}`,
      byteOffset: source.offset + source.ValueType.BYTES_PER_ELEMENT * i
    });
  }
  return bufferLayout;
}

export function getOutputModule(
  name: string,
  outType: SignedDataType,
  outSize: number
): ShaderModule & {varyings: string[]} {
  const varyings: string[] = [];
  const outputType = getAttributeType(outType, 1);
  let varyingBlock = '';
  let functionBlock = '';

  for (let index = 0; index < outSize; index += 4) {
    const size = Math.min(outSize - index, 4) as QualifiedVectorSize;
    const outDataType = getAttributeType(outType, size);
    varyings.push(`${name}_${index}`);
    varyingBlock += `flat out ${outDataType} ${name}_${index};\n`;
    const vectorIndices = Array.from({length: size}, (_, offset) => index + offset);
    functionBlock += `${name}_${index} = ${outDataType}(${vectorIndices.map(vectorIndex => `v[${vectorIndex}]`).join(',')});\n`;
  }

  return {
    name,
    varyings,
    vs: `
${varyingBlock}
void set_${name}(in ${outputType} v[${outSize}]) {
  ${functionBlock}
}
`
  } as ShaderModule & {varyings: string[]};
}
