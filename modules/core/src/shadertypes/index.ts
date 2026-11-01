// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  makeShaderBlockLayout,
  type ShaderBlockLayout,
  type ShaderBlockLayoutEntry,
  type ShaderBlockLayoutOptions
} from './shader-types/shader-block-layout';

export type {ExternalImage} from './image-types/image-types';

export {
  type PrimitiveDataType,
  type SignedDataType,
  type NormalizedDataType,
  type DataTypeInfo,
  type PrimitiveDataTypeT,
  type SignedDataTypeT,
  type TypedArrayConstructorT,
  type NormalizedTypedArrayConstructorT
} from './data-types/data-types';

export {dataTypeDecoder} from './data-types/data-type-decoder';

export {
  getDataTypeByteLength,
  getDataTypeFromTypedArray,
  getTypedArrayConstructor,
  getTypedArrayFromDataType
} from './data-types/decode-data-types';

export {
  type AttributeShaderTypeT,
  type AttributeShaderType,
  type ArrayShaderType,
  type CompositeShaderType,
  type StructShaderType,
  type VariableShaderTypeT,
  type VariableShaderType
} from './shader-types/shader-types';

export {
  shaderTypeDecoder,
  getAttributeShaderTypeInfo,
  getVariableShaderTypeInfo,
  type AttributeShaderTypeInfo
} from './shader-types/shader-type-decoder';

export {
  type VertexFormat,
  type VertexFormatDataTypeT
} from './vertex-types/vertex-formats';

export {vertexFormatDecoder} from './vertex-types/vertex-format-decoder';

export {
  type TextureFormat,
  type TextureFormatColor,
  type TextureFormatDepthStencil,
  type CompressedTextureFormat,
  type TextureCompression,
  type TextureFormatInfo,
  type TextureFormatCapabilities,
  type TextureMemoryLayout
} from './texture-types/texture-formats';

export {type TextureFormatDataTypeT} from './texture-types/texture-format-generics';

export {
  type TextureFormatDecoder,
  textureFormatDecoder
} from './texture-types/texture-format-decoder';

export {
  getTextureImageView,
  setTextureImageData
} from './texture-types/texture-layout';

export {type PixelData, readPixel, writePixel} from './texture-types/pixel-utils';

export {isExternalImage, getExternalImageSize} from './image-types/image-types';

export {
  getTextureFormatDefinition as _getTextureFormatDefinition,
  getTextureFormatTable as _getTextureFormatTable
} from './texture-types/texture-format-table';
