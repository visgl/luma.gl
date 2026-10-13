// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {BindingDeclaration, VertexFormat, RenderPipelineParameters} from '@luma.gl/core';
import {
  BackSide,
  DoubleSide,
  NormalBlending,
  NoBlending,
  LessEqualDepth,
  FloatType
} from 'three/webgpu';
import type {Material} from 'three/webgpu';

/** The subset of upstream binding metadata consumed by this prototype. */
export type ThreeBinding = {
  name: string;
  visibility: number;
  isUniformBuffer?: boolean;
  isStorageBuffer?: boolean;
  isSampler?: boolean;
  isSampledTexture?: boolean;
  store?: boolean;
  access?: string;
  texture?: {
    type: number;
    isDepthTexture?: boolean;
    isDataArrayTexture?: boolean;
    compareFunction?: number | null;
  };
};

export function translateBinding(
  binding: ThreeBinding,
  group: number,
  location: number,
  float32Filterable = false
): BindingDeclaration {
  const base = {
    name: `group${group}Binding${location}`,
    group,
    location,
    visibility: binding.visibility
  };
  if (binding.isUniformBuffer) return {...base, type: 'uniform'};
  if (binding.isStorageBuffer) {
    return {
      ...base,
      type:
        binding.visibility & 4 && binding.access !== 'readOnly' ? 'storage' : 'read-only-storage'
    };
  }
  if (binding.store) throw new Error('LumaBackend: storage textures are not supported');
  if (binding.isSampledTexture)
    return {
      ...base,
      type: 'texture',
      viewDimension: binding.texture?.isDataArrayTexture ? '2d-array' : '2d',
      sampleType: binding.texture?.isDepthTexture
        ? 'depth'
        : binding.texture?.type === FloatType && !float32Filterable
          ? 'unfilterable-float'
          : 'float'
    };
  if (binding.isSampler)
    return {
      ...base,
      type: 'sampler',
      samplerType: binding.texture?.compareFunction != null ? 'comparison' : 'filtering'
    };
  throw new Error('LumaBackend: unsupported binding');
}

export function translateVertexFormat(
  array: ArrayBufferView,
  itemSize: number,
  normalized = false
): VertexFormat {
  let prefix: string;
  if (array instanceof Float32Array) prefix = 'float32';
  else if (array instanceof Uint32Array) prefix = 'uint32';
  else if (array instanceof Int32Array) prefix = 'sint32';
  else if (array instanceof Uint8Array) prefix = normalized ? 'unorm8' : 'uint8';
  else if (array instanceof Int8Array) prefix = normalized ? 'snorm8' : 'sint8';
  else if (array instanceof Uint16Array) prefix = normalized ? 'unorm16' : 'uint16';
  else if (array instanceof Int16Array) prefix = normalized ? 'snorm16' : 'sint16';
  else throw new Error('LumaBackend: unsupported vertex array type');
  if (
    itemSize < 1 ||
    itemSize > 4 ||
    (!prefix.endsWith('32') && itemSize !== 2 && itemSize !== 4)
  ) {
    throw new Error('LumaBackend: unsupported vertex component count');
  }
  // Prefix and component count above are restricted to valid core vertex formats.
  return `${prefix}${itemSize === 1 ? '' : `x${itemSize}`}` as VertexFormat;
}

export function translateMaterial(
  material: Material,
  negativeScale: boolean
): RenderPipelineParameters {
  if (
    material.stencilWrite ||
    material.polygonOffset ||
    material.alphaToCoverage ||
    material.depthFunc !== LessEqualDepth ||
    (material.blending !== NormalBlending && material.blending !== NoBlending)
  ) {
    throw new Error('LumaBackend: unsupported material pipeline state');
  }
  return {
    cullMode: material.side === DoubleSide ? 'none' : material.side === BackSide ? 'front' : 'back',
    frontFace: negativeScale ? 'cw' : 'ccw',
    depthWriteEnabled: material.depthWrite,
    depthCompare: material.depthTest ? 'less-equal' : 'always',
    colorMask: material.colorWrite ? 15 : 0,
    blend: material.transparent && material.blending === NormalBlending,
    blendColorSrcFactor: material.premultipliedAlpha ? 'one' : 'src-alpha',
    blendColorDstFactor: 'one-minus-src-alpha',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  };
}
