// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SignedDataType, Buffer, BufferLayout} from '@luma.gl/core';
import {BufferTransform} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {GPUTableEvaluator} from '../../operation/gpu-table';
import {bufferPool} from '../../utils/buffer-pool';

type QualifedVectorSize = 1 | 2 | 3 | 4;

export function runBufferTransform({
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
      inputBuffers[name] = input.buffer;
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
      const zero = castToType === 'float' ? '0.' : castToType === 'uint' ? '0u' : '0';
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

  // console.log(transform.model.pipeline.vs.source);

  transform.run({
    inputBuffers: inputBuffers,
    outputBuffers: {[outputModule.varyings[0]]: outputBuffer}
  });
  if (placeholderBuffer) {
    bufferPool.recycle(placeholderBuffer);
  }
  // transform.destroy();
}

/** Sample vs from name=x, type=float32, size=6

  in vec4 ax_0;
  in vec2 ax_4;

  void get_x(out float v[6]) {
    v[0] = ax_0[0];
    v[1] = ax_0[1];
    v[2] = ax_0[2];
    v[3] = ax_0[3];
    v[4] = ax_4[0];
    v[5] = ax_4[1];
  }
*/
/** Get a shader module that reads an array from attributes or uniforms */
function getInputModule(
  name: string,
  inType: SignedDataType,
  inSize: number,
  outType: SignedDataType = inType
): ShaderModule {
  let attributeBlock = '';
  let funcBlock = '';

  // Each bound attribute pointer can be up to vec4
  // If the input data size is 10
  // Send them in as 3 attributes vec4 + vec4 + vec2
  // Or 3 equivalent uniforms if constant
  // At runtime, assemble them into float[10]
  for (let i = 0; i < inSize; i += 4) {
    const size = Math.min(inSize - i, 4) as QualifedVectorSize;
    const inDataType = getAttributeType(inType, size);

    attributeBlock += `in ${inDataType} a${name}_${i};\n`;

    for (let j = 0; j < size; j++) {
      let element = `a${name}_${i}`;
      if (size > 1) {
        // access element
        element = `${element}[${j}]`;
      }
      if (inType !== outType) {
        // cast type
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

/** Sample vs from name=result, type=float32, size=6

  out vec4 result_0;
  out vec2 result_4;

  void set_result(in float v[6]) {
    result_0 = vec4(v[0], v[1], v[2], v[3]);
    result_4 = vec2(v[4], v[5]);
  }
*/
/** Get a shader module that writes an array into varyings */
function getOutputModule(
  name: string,
  outType: SignedDataType,
  outSize: number
): ShaderModule & {
  varyings: string[];
} {
  const varyings: string[] = [];
  const outputType = getAttributeType(outType, 1);
  let varyingBlock = '';
  let funcBlock = '';

  for (let i = 0; i < outSize; i += 4) {
    const size = Math.min(outSize - i, 4) as QualifedVectorSize;
    const outDataType = getAttributeType(outType, size);
    varyings.push(`${name}_${i}`);
    varyingBlock += `flat out ${outDataType} ${name}_${i};\n`;
    const vectorIndices = Array.from({length: size}, (_, d) => i + d);
    funcBlock += `${name}_${i} = ${outDataType}(${vectorIndices.map(index => `v[${index}]`).join(',')});\n`;
  }

  const vs = `
${varyingBlock}
void set_${name}(in ${outputType} v[${outSize}]) {
  ${funcBlock}
}
`;

  return {name, vs, varyings} as ShaderModule & {varyings: string[]};
}

/** Returns BufferLayout that corresponds with the shader attributes from getInputModule */
function getInputBufferLayout(name: string, source: GPUTableEvaluator): BufferLayout {
  const bufferLayout: BufferLayout = {
    name,
    stepMode: source.isConstant ? 'vertex' : 'instance',
    byteStride: source.stride,
    attributes: []
  };
  for (let i = 0; i < source.size; i += 4) {
    const size = Math.min(source.size - i, 4) as QualifedVectorSize;
    bufferLayout.attributes!.push({
      attribute: `a${name}_${i}`,
      // @ts-ignore
      format: size === 1 ? source.type : `${source.type}x${size}`,
      byteOffset: source.offset + source.ValueType.BYTES_PER_ELEMENT * i
    });
  }
  return bufferLayout;
}

/** Get GLSL attribute data type */
function getAttributeType(type: SignedDataType, size: QualifedVectorSize): string {
  switch (type) {
    case 'uint8':
    case 'uint16':
    case 'uint32':
      return size === 1 ? 'uint' : `uvec${size}`;

    case 'sint8':
    case 'sint16':
    case 'sint32':
      return size === 1 ? 'int' : `ivec${size}`;

    default:
      return size === 1 ? 'float' : `vec${size}`;
  }
}
