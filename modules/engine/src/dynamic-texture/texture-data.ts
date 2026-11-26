// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Compatibility export; resource conveniences are owned by core/dynamic.
export {
  type TextureImageSource,
  type TextureImageData,
  type TextureMipLevelData,
  type TextureSliceData,
  type TextureCubeFace,
  TEXTURE_CUBE_FACES,
  TEXTURE_CUBE_FACE_MAP,
  type Texture1DData,
  type Texture2DData,
  type TextureCubeData,
  type Texture3DData,
  type TextureArrayData,
  type TextureCubeArrayData,
  type TextureDataProps,
  type TextureDataAsyncProps,
  type TextureSubresource,
  isTextureSliceData,
  getFirstMipLevel,
  getTextureSizeFromData,
  resolveTextureImageFormat,
  getCubeFaceIndex,
  getCubeArrayFaceIndex,
  getTexture1DSubresources,
  getTexture2DSubresources,
  getTexture3DSubresources,
  getTextureArraySubresources,
  getTextureCubeSubresources,
  getTextureCubeArraySubresources
} from '@luma.gl/core/dynamic';
