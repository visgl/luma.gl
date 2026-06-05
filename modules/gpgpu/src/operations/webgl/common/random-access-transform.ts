// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, SignedDataType, Texture} from '@luma.gl/core';
import {ShaderModule} from '@luma.gl/shadertools';
import {GPUDataEvaluator} from '../../../operation/gpu-data-evaluator';
import {getAttributeType, getSamplerType, getTextureFormat} from './helper';

export function getSourceValuesTextureModule(
  source: GPUDataEvaluator,
  outputType: SignedDataType,
  textureDataType: SignedDataType
): ShaderModule {
  const samplerType = getSamplerType(textureDataType);
  const outputScalarType = getAttributeType(outputType, 1);

  const body = Array.from({length: source.size}, (_, index) => {
    return `  v[${index}] = ${outputScalarType}(texelFetch(source_values_texture, ivec2(${index}, rowIndex), 0).r);`;
  }).join('\n');

  return {
    name: 'source_values_texture',
    vs: `
uniform highp ${samplerType} source_values_texture;
void read_source_values(int rowIndex, out TYPE v[${source.size}]) {
${body}
}
`
  } as ShaderModule;
}

export function createTableTexture(
  source: GPUDataEvaluator,
  dataType: SignedDataType,
  device: Buffer['device']
): Texture {
  const texture = device.createTexture({
    width: Math.max(source.size, 1),
    height: source.length,
    format: getTextureFormat(dataType),
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  if (source.length === 0) {
    return texture;
  }

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToTexture({
    sourceBuffer: source.buffer,
    destinationTexture: texture,
    byteOffset: source.offset,
    bytesPerRow: source.stride,
    rowsPerImage: source.length,
    size: [source.size, source.length, 1]
  });
  device.submit(commandEncoder.finish());

  return texture;
}
