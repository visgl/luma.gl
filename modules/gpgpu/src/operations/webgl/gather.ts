// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BufferLayout} from '@luma.gl/core';
import {BufferTransform} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {
  getAttributeType,
  getTextureDataType,
  getVertexFormat,
  getZeroLiteral
} from './common/helper';
import {getOutputModule} from './common/row-transform';
import {createTableTexture, getSourceValuesTextureModule} from './common/random-access-transform';

export const gather: OperationHandler<{
  ids: GPUDataEvaluator;
  sourceValues: GPUDataEvaluator;
}> = async ({inputs, output, target}) => {
  const {ids, sourceValues} = inputs;
  const device = target.device;
  const outputModule = getOutputModule('result', output.type, output.size);
  const idsIndexType = getAttributeType(ids.type, 1);
  const valueScalarType = getAttributeType(output.type, 1);
  const textureDataType = getTextureDataType(output.type);
  const sourceTexture = createTableTexture(sourceValues, textureDataType, device);

  const vertexShader = /* glsl */ `\
#version 300 es

void main() {
  INDEX_TYPE ids[1];
  get_ids(ids);
  TYPE result[${output.size}];
  gather(ids, result);
  set_result(result);
}
  `;

  const transform = new BufferTransform(device, {
    vs: vertexShader,
    defines: {
      INDEX_TYPE: idsIndexType,
      TYPE: valueScalarType,
      RESULT_LEN: output.size.toString(),
      SOURCE_VALUES_ROWS: sourceValues.length.toString()
    } as any,
    modules: [
      getIdsInputModule(ids, idsIndexType),
      getSourceValuesTextureModule(sourceValues, output.type, textureDataType),
      getGatherModule(output.type),
      outputModule
    ],
    bindings: {source_values_texture: sourceTexture},
    bufferLayout: [getIdsBufferLayout(ids)],
    vertexCount: 1,
    instanceCount: output.length,
    feedbackBufferMode: 'interleaved',
    outputs: outputModule.varyings
  });

  try {
    transform.run({
      inputBuffers: {ids: ids.buffer},
      outputBuffers: {[outputModule.varyings[0]]: target}
    });
    return {success: true};
  } finally {
    transform.destroy();
    sourceTexture.destroy();
  }
};

function getIdsInputModule(source: GPUDataEvaluator, indexType: string): ShaderModule {
  const inputType = getAttributeType(source.type, 1);
  let element = 'aids_0';
  if (source.type !== getSignedDataTypeForScalar(indexType)) {
    element = `${indexType}(${element})`;
  }

  return {
    name: 'ids',
    vs: `
in ${inputType} aids_0;
void get_ids(out INDEX_TYPE v[1]) {
  v[0] = ${element};
}
`
  } as ShaderModule;
}

function getIdsBufferLayout(source: GPUDataEvaluator): BufferLayout {
  return {
    name: 'ids',
    stepMode: source.isConstant ? 'vertex' : 'instance',
    byteStride: source.stride,
    attributes: [
      {
        attribute: 'aids_0',
        format: getVertexFormat(source.type, 1, source.normalized),
        byteOffset: source.offset
      }
    ]
  };
}

function getGatherModule(outputType: GPUDataEvaluator['type']): ShaderModule {
  const zero = getZeroLiteral(outputType);
  return {
    name: 'gather',
    vs: `
void zero_result(out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < RESULT_LEN; i++) {
    result[i] = ${zero};
  }
}

void gather(in INDEX_TYPE ids[1], out TYPE result[RESULT_LEN]) {
  int sourceIndex = int(ids[0]);
  if (sourceIndex < 0 || sourceIndex >= SOURCE_VALUES_ROWS) {
    zero_result(result);
    return;
  }
  read_source_values(sourceIndex, result);
}
`
  } as ShaderModule;
}

function getSignedDataTypeForScalar(type: string): GPUDataEvaluator['type'] {
  switch (type) {
    case 'uint':
      return 'uint32';

    case 'int':
      return 'sint32';

    default:
      return 'float32';
  }
}
