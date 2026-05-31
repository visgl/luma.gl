// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferLayout, SignedDataType} from '@luma.gl/core';
import {BufferTransform} from '@luma.gl/engine';
import {getGPUVectorFormatInfo} from '@luma.gl/tables';
import {getGPUVectorBuffer, type GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import type {InterleavedGPUTableEvaluator} from '../../operation/interleaved-gpu-table-evaluator';
import type {OperationHandler} from '../../operation/operation';
import {getAttributeType, getVertexFormat, type QualifiedVectorSize} from './common/helper';

type FieldShaderMapping = {
  fieldName: string;
  inputAttribute: string;
  outputVarying: string;
  input: GPUTableEvaluator;
};

export const scatterInterleaved: OperationHandler<
  Record<string, GPUTableEvaluator>,
  InterleavedGPUTableEvaluator
> = async ({inputs, output, target}) => {
  const mappings = output.layout.attributes.map((attribute, index) => ({
    fieldName: attribute.attribute,
    inputAttribute: `a_field_${index}`,
    outputVarying: `out_field_${index}`,
    input: inputs[attribute.attribute]
  }));
  const bufferLayout = getInputBufferLayout(mappings);
  const attributes = Object.fromEntries(
    mappings.map(mapping => [mapping.fieldName, getGPUVectorBuffer(mapping.input.gpuVector)])
  );
  const outputs = mappings.map(mapping => mapping.outputVarying);
  const vertexShader = getScatterInterleavedVertexShader(mappings, output);

  const transform = new BufferTransform(target.device, {
    vs: vertexShader,
    bufferLayout,
    attributes,
    vertexCount: 1,
    instanceCount: output.length,
    feedbackBufferMode: 'interleaved',
    outputs
  });

  transform.run({
    inputBuffers: attributes,
    outputBuffers: {[outputs[0]]: target}
  });
  transform.destroy();
  return {success: true};
};

function getInputBufferLayout(mappings: FieldShaderMapping[]): BufferLayout[] {
  return mappings.map(({fieldName, inputAttribute, input}) => ({
    name: fieldName,
    stepMode: input.isConstant ? 'vertex' : 'instance',
    byteStride: input.stride,
    attributes: [
      {
        attribute: inputAttribute,
        format: getVertexFormat(input.type, input.size as QualifiedVectorSize, input.normalized),
        byteOffset: input.offset
      }
    ]
  }));
}

function getScatterInterleavedVertexShader(
  mappings: FieldShaderMapping[],
  output: InterleavedGPUTableEvaluator
): string {
  const inputDeclarations = mappings.map(mapping => getInputDeclaration(mapping)).join('\n');
  const outputDeclarations = mappings
    .map(mapping => getOutputDeclaration(mapping, output))
    .join('\n');
  const assignments = mappings.map(mapping => getOutputAssignment(mapping, output)).join('\n');

  return `#version 300 es
precision highp float;
precision highp int;

${inputDeclarations}
${outputDeclarations}

void main() {
${assignments}
}
`;
}

function getInputDeclaration(mapping: FieldShaderMapping): string {
  const input = mapping.input;
  const attributeType = getAttributeType(
    input.type,
    input.size as QualifiedVectorSize,
    input.normalized
  );
  return `in ${attributeType} ${mapping.inputAttribute};`;
}

function getOutputDeclaration(
  mapping: FieldShaderMapping,
  output: InterleavedGPUTableEvaluator
): string {
  const fieldInfo = getFieldFormatInfo(mapping, output);
  const outputType = getOutputVaryingType(fieldInfo.signedDataType, fieldInfo.components);
  const qualifier = outputType.startsWith('u') || outputType.startsWith('i') ? 'flat ' : '';
  return `${qualifier}out ${outputType} ${mapping.outputVarying};`;
}

function getOutputAssignment(
  mapping: FieldShaderMapping,
  output: InterleavedGPUTableEvaluator
): string {
  const fieldInfo = getFieldFormatInfo(mapping, output);
  const input = mapping.input;
  if (fieldInfo.signedDataType === 'float32') {
    return `  ${mapping.outputVarying} = ${mapping.inputAttribute};`;
  }
  if (fieldInfo.signedDataType === 'uint32' || fieldInfo.signedDataType === 'sint32') {
    return `  ${mapping.outputVarying} = ${mapping.inputAttribute};`;
  }
  if (fieldInfo.byteLength !== 4) {
    throw new Error(
      `WebGL scatterInterleaved only supports packed integer fields that occupy 4 bytes, got ${fieldInfo.format}`
    );
  }
  return `  ${mapping.outputVarying} = ${getPackedIntegerExpression(
    mapping.inputAttribute,
    input.type,
    fieldInfo.signedDataType,
    fieldInfo.components
  )};`;
}

function getOutputVaryingType(type: SignedDataType, components: 1 | 2 | 3 | 4): string {
  switch (type) {
    case 'float32':
      return components === 1 ? 'float' : `vec${components}`;
    case 'uint32':
      return components === 1 ? 'uint' : `uvec${components}`;
    case 'sint32':
      return components === 1 ? 'int' : `ivec${components}`;
    case 'uint8':
    case 'sint8':
    case 'uint16':
    case 'sint16':
      return 'uint';
    default:
      throw new Error(`WebGL scatterInterleaved does not support ${type} output fields`);
  }
}

function getPackedIntegerExpression(
  inputAttribute: string,
  inputType: SignedDataType,
  fieldType: SignedDataType,
  components: 1 | 2 | 3 | 4
): string {
  const bitsPerComponent = fieldType.endsWith('16') ? 16 : 8;
  const expectedComponents = 32 / bitsPerComponent;
  if (components !== expectedComponents) {
    throw new Error(
      `WebGL scatterInterleaved cannot pack ${components} ${fieldType} components into 4 bytes`
    );
  }

  const mask = bitsPerComponent === 16 ? '65535u' : '255u';
  const terms = Array.from({length: components}, (_, componentIndex) => {
    const componentAccessor =
      components === 1 ? inputAttribute : `${inputAttribute}.${'xyzw'[componentIndex]}`;
    const castExpression = inputType.startsWith('u')
      ? componentAccessor
      : `uint(${componentAccessor})`;
    const maskedExpression = `(${castExpression} & ${mask})`;
    const shift = componentIndex * bitsPerComponent;
    return shift === 0 ? maskedExpression : `(${maskedExpression} << ${shift}u)`;
  });
  return terms.join(' | ');
}

function getFieldFormatInfo(mapping: FieldShaderMapping, output: InterleavedGPUTableEvaluator) {
  const attribute = output.layout.attributes.find(
    candidate => candidate.attribute === mapping.fieldName
  );
  if (!attribute) {
    throw new Error(`scatterInterleaved field "${mapping.fieldName}" is missing from output`);
  }
  return getGPUVectorFormatInfo(attribute.format);
}
