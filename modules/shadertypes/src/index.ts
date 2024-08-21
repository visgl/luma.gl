// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {VertexFormat, VertexType} from './gpu-types/vertex-formats';
export type {
  ShaderDataType,
  ShaderAttributeType,
  ShaderUniformType
} from './gpu-types/shader-types';
export type {
  TextureFormat,
  ColorTextureFormat,
  DepthStencilTextureFormat
} from './gpu-types/texture-formats';
export type {UniformDataType, UniformFormat} from './gpu-types/uniform-types';

// GPU TYPE UTILS - GPU MEMORY LAYOUT HELPERS - CAN BE USED BY APPS BUT MOSTLY USED INTERNALLY

export {decodeVertexFormat} from './gpu-type-utils/decode-vertex-format';
export {decodeTextureFormat} from './gpu-type-utils/decode-texture-format';
export {decodeShaderUniformType} from './gpu-type-utils/decode-shader-types';
export type {ShaderAttributeTypeInfo} from './gpu-type-utils/decode-attribute-type';
export {decodeShaderAttributeType} from './gpu-type-utils/decode-attribute-type';
export {getDataTypeFromTypedArray} from './gpu-type-utils/vertex-format-from-attribute';
export {getTypedArrayFromDataType} from './gpu-type-utils/vertex-format-from-attribute';
export {getVertexFormatFromAttribute} from './gpu-type-utils/vertex-format-from-attribute';

export {isTextureFormatCompressed} from './gpu-type-utils/decode-texture-format';
export {alignTo} from './gpu-type-utils/decode-shader-types';
