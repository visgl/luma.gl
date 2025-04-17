// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { SignedDataType, Device, Buffer, BufferLayout, BufferRange } from '@luma.gl/core';
import { BufferTransform } from '../../transforms/buffer-transform';
import { ShaderModule } from '@luma.gl/shadertools';
import { GPUTable } from "../../operation/gpu-table";
import { bufferPool } from '../../utils/buffer-pool';

type QualifedVectorSize = 1 | 2 | 3 | 4;

export function runBufferTransform(device: Device, {module, inputs, output, outputBuffer}: {
  /** contains signature
   * void execute(in float x[], in float y[], ..., inout float result[]) {}
   */
  module: ShaderModule;
  inputs: {[name: string]: GPUTable};
  output: GPUTable;
  outputBuffer: Buffer;
}): void {
  const outputModule = getOutputModule('result', output.type, output.size);
  const modules: ShaderModule[] = [
    module,
    outputModule
  ];
  const bufferLayout: BufferLayout[] = [];
  const inputBuffers: {[name: string]: Buffer} = {};
  let inputBlock = '';

  let placeholderBuffer: Buffer | null = null;

  for (const name in inputs) {
    const input = inputs[name];
    modules.push(getInputModule(name, input.type, input.size, output.type, output.size));
    bufferLayout.push(getInputBufferLayout(name, input));
    if (input instanceof GPUTable) {
      inputBuffers[name] = input.buffer;
    } else {
      placeholderBuffer = placeholderBuffer || bufferPool.createOrReuse(device, outputBuffer.byteLength);
      inputBuffers[name] = placeholderBuffer;
    }

    inputBlock += `TYPE ${name}[SIZE]; get_${name}(${name});\n`;
  }

  const outElementType = getAttributeType(output.type, 1);
  const vertexShader = /* glsl */ `\
#version 300 es

void main() {
  ${inputBlock}
  TYPE result[SIZE];
  ${module.name}(${Object.keys(inputs).join(', ')}, result);
  set_result(result);
}
  `;

  const transform = new BufferTransform(device, {
    vs: vertexShader,
    defines: {
      TYPE: outElementType,
      SIZE: output.size
    },
    modules,
    bufferLayout,
    vertexCount: 1,
    instanceCount: output.length,
    attributes: inputBuffers,
    bufferMode: 'interleaved',
    outputs: outputModule.varyings
  });

  transform.run({
    inputBuffers: inputBuffers,
    outputBuffers: {[outputModule.varyings[0]]: outputBuffer}
  });
  if (placeholderBuffer) {
    bufferPool.recycle(placeholderBuffer);
  }
  transform.destroy();
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
  outType: SignedDataType,
  outSize: number
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
      if (i + j < outSize) {
        let element = `a${name}_${i}`;
        if (size > 1) {
          // access element
          element = `${element}[${j}]`
        }
        if (inType !== outType) {
          // cast type
          element = `TYPE(${element})`;
        }
        funcBlock += `v[${i + j}]=${element};\n`;
      }
    }
  }
  const zero = outType.startsWith('float') ? '0.' : '0';
  for (let i = inSize; i < outSize; i++) {
    funcBlock += `v[${i}]=${zero};\n`;
  }

  const vs = `
${attributeBlock}
void get_${name}(out TYPE v[SIZE]) {
  ${funcBlock}
}
`;

  return {
    name,
    vs,
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
function getOutputModule(name: string, outType: SignedDataType, outSize: number): ShaderModule & {
  varyings: string[];
} {
  const varyings: string[] = [];
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
void set_${name}(in TYPE v[SIZE]) {
  ${funcBlock}
}
`;

return { name, vs, varyings } as ShaderModule & {varyings: string[]};
}

/** Returns BufferLayout that corresponds with the shader attributes from getInputModule */
function getInputBufferLayout(name: string, source: GPUTable): BufferLayout {
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
