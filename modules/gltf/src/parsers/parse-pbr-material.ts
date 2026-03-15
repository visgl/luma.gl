// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Texture, SamplerProps, TextureFormat, TypedArray} from '@luma.gl/core';
import type {GLTFSampler} from '@loaders.gl/gltf';
import {GL} from '@luma.gl/constants';

import {log} from '@luma.gl/core';
import {type ParsedPBRMaterial} from '../pbr/pbr-material';
import {type PBREnvironment} from '../pbr/pbr-environment';
import {type PBRMaterialBindings} from '@luma.gl/shadertools';
import {convertSampler} from '../webgl-to-webgpu/convert-webgl-sampler';

// TODO - synchronize the GLTF... types with loaders.gl
// TODO - remove the glParameters, use only parameters

/* eslint-disable camelcase */

type GLTFTexture = {
  id: string;
  texture: {source: {image: any}; sampler: {parameters: any}};
  uniformName?: string;
  // is this on all textures?
  scale?: number;
  // is this on all textures?
  strength?: number;
};

type GLTFPBRMetallicRoughness = {
  baseColorTexture?: GLTFTexture;
  baseColorFactor?: [number, number, number, number];
  metallicRoughnessTexture?: GLTFTexture;
  metallicFactor?: number;
  roughnessFactor?: number;
};

type GLTFPBRMaterial = {
  unlit?: boolean;
  pbrMetallicRoughness?: GLTFPBRMetallicRoughness;
  normalTexture?: GLTFTexture;
  occlusionTexture?: GLTFTexture;
  emissiveTexture?: GLTFTexture;
  emissiveFactor?: [number, number, number];
  alphaMode?: 'MASK' | 'BLEND';
  alphaCutoff?: number;
};

export type ParsePBRMaterialOptions = {
  /** Debug PBR shader */
  pbrDebug?: boolean;
  /** Enable lights */
  lights?: any;
  /** Use tangents */
  useTangents?: boolean;
  /** provide an image based (texture cube) lighting environment */
  imageBasedLightingEnvironment?: PBREnvironment;
};

/**
 * Parses a GLTF material definition into uniforms and parameters for the PBR shader module
 */
export function parsePBRMaterial(
  device: Device,
  material: GLTFPBRMaterial,
  attributes: Record<string, any>,
  options: ParsePBRMaterialOptions
): ParsedPBRMaterial {
  const parsedMaterial: ParsedPBRMaterial = {
    defines: {
      // TODO: Use EXT_sRGB if available (Standard in WebGL 2.0)
      MANUAL_SRGB: true,
      SRGB_FAST_APPROXIMATION: true
    },
    bindings: {},
    uniforms: {
      // TODO: find better values?
      camera: [0, 0, 0], // Model should override

      metallicRoughnessValues: [1, 1] // Default is 1 and 1
    },
    parameters: {},
    glParameters: {},
    generatedTextures: []
  };

  // TODO - always available
  parsedMaterial.defines['USE_TEX_LOD'] = true;

  const {imageBasedLightingEnvironment} = options;
  if (imageBasedLightingEnvironment) {
    parsedMaterial.bindings.pbr_diffuseEnvSampler =
      imageBasedLightingEnvironment.diffuseEnvSampler.texture;
    parsedMaterial.bindings.pbr_specularEnvSampler =
      imageBasedLightingEnvironment.specularEnvSampler.texture;
    parsedMaterial.bindings.pbr_BrdfLUT = imageBasedLightingEnvironment.brdfLutTexture.texture;
    parsedMaterial.uniforms.scaleIBLAmbient = [1, 1];
  }

  if (options?.pbrDebug) {
    parsedMaterial.defines['PBR_DEBUG'] = true;
    // Override final color for reference app visualization of various parameters in the lighting equation.
    parsedMaterial.uniforms.scaleDiffBaseMR = [0, 0, 0, 0];
    parsedMaterial.uniforms.scaleFGDSpec = [0, 0, 0, 0];
  }

  if (attributes['NORMAL']) parsedMaterial.defines['HAS_NORMALS'] = true;
  if (attributes['TANGENT'] && options?.useTangents) parsedMaterial.defines['HAS_TANGENTS'] = true;
  if (attributes['TEXCOORD_0']) parsedMaterial.defines['HAS_UV'] = true;
  if (attributes['JOINTS_0'] && attributes['WEIGHTS_0']) parsedMaterial.defines['HAS_SKIN'] = true;
  if (attributes['COLOR_0']) parsedMaterial.defines['HAS_COLORS'] = true;

  if (options?.imageBasedLightingEnvironment) parsedMaterial.defines['USE_IBL'] = true;
  if (options?.lights) parsedMaterial.defines['USE_LIGHTS'] = true;

  if (material) {
    parseMaterial(device, material, parsedMaterial);
  }

  return parsedMaterial;
}

/** Parse GLTF material record */
function parseMaterial(
  device: Device,
  material: GLTFPBRMaterial,
  parsedMaterial: ParsedPBRMaterial
): void {
  parsedMaterial.uniforms.unlit = Boolean(material.unlit);

  if (material.pbrMetallicRoughness) {
    parsePbrMetallicRoughness(device, material.pbrMetallicRoughness, parsedMaterial);
  }
  if (material.normalTexture) {
    addTexture(
      device,
      material.normalTexture,
      'pbr_normalSampler',
      'HAS_NORMALMAP',
      parsedMaterial
    );

    const {scale = 1} = material.normalTexture;
    parsedMaterial.uniforms.normalScale = scale;
  }
  if (material.occlusionTexture) {
    addTexture(
      device,
      material.occlusionTexture,
      'pbr_occlusionSampler',
      'HAS_OCCLUSIONMAP',
      parsedMaterial
    );

    const {strength = 1} = material.occlusionTexture;
    parsedMaterial.uniforms.occlusionStrength = strength;
  }
  if (material.emissiveTexture) {
    addTexture(
      device,
      material.emissiveTexture,
      'pbr_emissiveSampler',
      'HAS_EMISSIVEMAP',
      parsedMaterial
    );
    parsedMaterial.uniforms.emissiveFactor = material.emissiveFactor || [0, 0, 0];
  }

  switch (material.alphaMode || 'MASK') {
    case 'MASK':
      const {alphaCutoff = 0.5} = material;
      parsedMaterial.defines['ALPHA_CUTOFF'] = true;
      parsedMaterial.uniforms.alphaCutoff = alphaCutoff;
      break;
    case 'BLEND':
      log.warn('glTF BLEND alphaMode might not work well because it requires mesh sorting')();

      // WebGPU style parameters
      parsedMaterial.parameters.blend = true;

      parsedMaterial.parameters.blendColorOperation = 'add';
      parsedMaterial.parameters.blendColorSrcFactor = 'src-alpha';
      parsedMaterial.parameters.blendColorDstFactor = 'one-minus-src-alpha';

      parsedMaterial.parameters.blendAlphaOperation = 'add';
      parsedMaterial.parameters.blendAlphaSrcFactor = 'one';
      parsedMaterial.parameters.blendAlphaDstFactor = 'one-minus-src-alpha';

      // GL parameters
      // TODO - remove in favor of parameters
      parsedMaterial.glParameters['blend'] = true;
      parsedMaterial.glParameters['blendEquation'] = GL.FUNC_ADD;
      parsedMaterial.glParameters['blendFunc'] = [
        GL.SRC_ALPHA,
        GL.ONE_MINUS_SRC_ALPHA,
        GL.ONE,
        GL.ONE_MINUS_SRC_ALPHA
      ];

      break;
  }
}

/** Parse GLTF material sub record */
function parsePbrMetallicRoughness(
  device: Device,
  pbrMetallicRoughness: GLTFPBRMetallicRoughness,
  parsedMaterial: ParsedPBRMaterial
): void {
  if (pbrMetallicRoughness.baseColorTexture) {
    addTexture(
      device,
      pbrMetallicRoughness.baseColorTexture,
      'pbr_baseColorSampler',
      'HAS_BASECOLORMAP',
      parsedMaterial
    );
  }
  parsedMaterial.uniforms.baseColorFactor = pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];

  if (pbrMetallicRoughness.metallicRoughnessTexture) {
    addTexture(
      device,
      pbrMetallicRoughness.metallicRoughnessTexture,
      'pbr_metallicRoughnessSampler',
      'HAS_METALROUGHNESSMAP',
      parsedMaterial
    );
  }
  const {metallicFactor = 1, roughnessFactor = 1} = pbrMetallicRoughness;
  parsedMaterial.uniforms.metallicRoughnessValues = [metallicFactor, roughnessFactor];
}

/** Create a texture from a glTF texture/sampler/image combo and add it to bindings */
function addTexture(
  device: Device,
  gltfTexture: GLTFTexture,
  uniformName: keyof PBRMaterialBindings,
  define: string,
  parsedMaterial: ParsedPBRMaterial
): void {
  const image = gltfTexture.texture.source.image;

  const gltfSampler = {
    wrapS: 10497, // default REPEAT S (U) wrapping mode.
    wrapT: 10497, // default REPEAT T (V) wrapping mode.
    minFilter: 9729, // default LINEAR filtering
    magFilter: 9729, // default LINEAR filtering
    ...gltfTexture?.texture?.sampler
  } as GLTFSampler;

  const baseOptions = {
    id: gltfTexture.uniformName || gltfTexture.id,
    sampler: convertSampler(gltfSampler)
  };

  let texture: Texture;

  if (image.compressed) {
    texture = createCompressedTexture(device, image, baseOptions);
  } else {
    texture = device.createTexture({
      ...baseOptions,
      data: image,
      width: image.width,
      height: image.height
    });
  }

  parsedMaterial.bindings[uniformName] = texture;
  if (define) parsedMaterial.defines[define] = true;
  parsedMaterial.generatedTextures.push(texture);
}

/** One mip level as produced by loaders.gl compressed texture parsers */
export type CompressedMipLevel = {
  data: TypedArray;
  width: number;
  height: number;
  format?: TextureFormat | number;
  compressed?: boolean;
};

/** Compressed image from loaders.gl < 4.2 (flat format) */
export type CompressedImageFlat = {
  compressed: true;
  format: TextureFormat | number;
  data: TypedArray;
  width: number;
  height: number;
};

/**
 * Compressed image from loaders.gl >= 4.3 (actual format observed in 4.3.4).
 * - `mipmaps` is a boolean (true), NOT an array
 * - `data` is an Array of mip-level objects
 * - Per-level `format` is a GL enum number (e.g. 37808 = COMPRESSED_RGBA_ASTC_4x4_KHR)
 * - Top-level `width`/`height` may be undefined
 */
export type CompressedImageDataArray = {
  compressed: true;
  mipmaps?: boolean;
  width?: number;
  height?: number;
  format?: TextureFormat | number;
  data: CompressedMipLevel[];
};

/**
 * Hypothetical future format where `mipmaps` is an actual array.
 * Kept for forward compatibility.
 */
export type CompressedImageMipmapArray = {
  compressed: true;
  width?: number;
  height?: number;
  format?: TextureFormat | number;
  mipmaps: CompressedMipLevel[];
};

/** Union of all known loaders.gl compressed image shapes */
export type CompressedImage =
  | CompressedImageFlat
  | CompressedImageDataArray
  | CompressedImageMipmapArray;

/** GL enum → luma.gl TextureFormat string for compressed formats */
const GL_COMPRESSED_TEXTURE_FORMAT: Record<number, TextureFormat> = {
  // S3TC / BC1-BC3
  [GL.COMPRESSED_RGB_S3TC_DXT1_EXT]: 'bc1-rgb-unorm-webgl',
  [GL.COMPRESSED_RGBA_S3TC_DXT1_EXT]: 'bc1-rgba-unorm',
  [GL.COMPRESSED_RGBA_S3TC_DXT3_EXT]: 'bc2-rgba-unorm',
  [GL.COMPRESSED_RGBA_S3TC_DXT5_EXT]: 'bc3-rgba-unorm',
  [GL.COMPRESSED_SRGB_S3TC_DXT1_EXT]: 'bc1-rgb-unorm-srgb-webgl',
  [GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT]: 'bc1-rgba-unorm-srgb',
  [GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT]: 'bc2-rgba-unorm-srgb',
  [GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT]: 'bc3-rgba-unorm-srgb',
  // RGTC / BC4-BC5
  [GL.COMPRESSED_RED_RGTC1_EXT]: 'bc4-r-unorm',
  [GL.COMPRESSED_SIGNED_RED_RGTC1_EXT]: 'bc4-r-snorm',
  [GL.COMPRESSED_RED_GREEN_RGTC2_EXT]: 'bc5-rg-unorm',
  [GL.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT]: 'bc5-rg-snorm',
  // BPTC / BC6-BC7
  [GL.COMPRESSED_RGBA_BPTC_UNORM_EXT]: 'bc7-rgba-unorm',
  [GL.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT]: 'bc7-rgba-unorm-srgb',
  [GL.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT]: 'bc6h-rgb-float',
  [GL.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT]: 'bc6h-rgb-ufloat',
  // ETC2 / EAC
  [GL.COMPRESSED_R11_EAC]: 'eac-r11unorm',
  [GL.COMPRESSED_SIGNED_R11_EAC]: 'eac-r11snorm',
  [GL.COMPRESSED_RG11_EAC]: 'eac-rg11unorm',
  [GL.COMPRESSED_SIGNED_RG11_EAC]: 'eac-rg11snorm',
  [GL.COMPRESSED_RGB8_ETC2]: 'etc2-rgb8unorm',
  [GL.COMPRESSED_SRGB8_ETC2]: 'etc2-rgb8unorm-srgb',
  [GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2]: 'etc2-rgb8a1unorm',
  [GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2]: 'etc2-rgb8a1unorm-srgb',
  [GL.COMPRESSED_RGBA8_ETC2_EAC]: 'etc2-rgba8unorm',
  [GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC]: 'etc2-rgba8unorm-srgb',
  // ASTC
  [GL.COMPRESSED_RGBA_ASTC_4x4_KHR]: 'astc-4x4-unorm',
  [GL.COMPRESSED_RGBA_ASTC_5x4_KHR]: 'astc-5x4-unorm',
  [GL.COMPRESSED_RGBA_ASTC_5x5_KHR]: 'astc-5x5-unorm',
  [GL.COMPRESSED_RGBA_ASTC_6x5_KHR]: 'astc-6x5-unorm',
  [GL.COMPRESSED_RGBA_ASTC_6x6_KHR]: 'astc-6x6-unorm',
  [GL.COMPRESSED_RGBA_ASTC_8x5_KHR]: 'astc-8x5-unorm',
  [GL.COMPRESSED_RGBA_ASTC_8x6_KHR]: 'astc-8x6-unorm',
  [GL.COMPRESSED_RGBA_ASTC_8x8_KHR]: 'astc-8x8-unorm',
  [GL.COMPRESSED_RGBA_ASTC_10x5_KHR]: 'astc-10x5-unorm',
  [GL.COMPRESSED_RGBA_ASTC_10x6_KHR]: 'astc-10x6-unorm',
  [GL.COMPRESSED_RGBA_ASTC_10x8_KHR]: 'astc-10x8-unorm',
  [GL.COMPRESSED_RGBA_ASTC_10x10_KHR]: 'astc-10x10-unorm',
  [GL.COMPRESSED_RGBA_ASTC_12x10_KHR]: 'astc-12x10-unorm',
  [GL.COMPRESSED_RGBA_ASTC_12x12_KHR]: 'astc-12x12-unorm',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR]: 'astc-4x4-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR]: 'astc-5x4-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR]: 'astc-5x5-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR]: 'astc-6x5-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR]: 'astc-6x6-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR]: 'astc-8x5-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR]: 'astc-8x6-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR]: 'astc-8x8-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR]: 'astc-10x5-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR]: 'astc-10x6-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR]: 'astc-10x8-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR]: 'astc-10x10-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR]: 'astc-12x10-unorm-srgb',
  [GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR]: 'astc-12x12-unorm-srgb'
};

/** Resolve a format that may be a GL enum number to a TextureFormat string */
function resolveCompressedTextureFormat(
  format: TextureFormat | number | undefined
): TextureFormat | undefined {
  if (format === undefined) return undefined;
  if (typeof format === 'string') return format;
  return GL_COMPRESSED_TEXTURE_FORMAT[format];
}

/**
 * Return the block dimensions [width, height] for a compressed texture format.
 * Block-compressed formats cannot represent mip levels smaller than one block.
 * - BC1–BC7, ETC2, EAC: 4×4
 * - ASTC: varies (parsed from format name, e.g. 'astc-10x6-unorm' → [10, 6])
 */
function getCompressedFormatBlockSize(format: TextureFormat): [number, number] {
  const astcMatch = format.match(/^astc-(\d+)x(\d+)/);
  if (astcMatch) {
    return [Number(astcMatch[1]), Number(astcMatch[2])];
  }
  // BC1-BC7, ETC2, EAC all use 4×4 blocks
  if (format.startsWith('bc') || format.startsWith('etc2') || format.startsWith('eac')) {
    return [4, 4];
  }
  return [1, 1];
}

/**
 * Maximum mip levels that can be filled for a compressed texture.
 * texStorage2D allocates level i at (baseW >> i) × (baseH >> i).
 * Compressed formats can't upload data for levels smaller than one block,
 * so we stop before either dimension drops below the block size.
 */
function getMaxCompressedMipLevels(
  baseWidth: number,
  baseHeight: number,
  format: TextureFormat
): number {
  const [blockW, blockH] = getCompressedFormatBlockSize(format);
  let count = 1;
  for (let i = 1; ; i++) {
    const w = Math.max(1, baseWidth >> i);
    const h = Math.max(1, baseHeight >> i);
    if (w < blockW || h < blockH) break;
    count++;
  }
  return count;
}

/**
 * Create a texture from compressed image data produced by loaders.gl.
 * Handles three known loaders.gl compressed image layouts:
 *
 *   v4.2 flat:    {compressed, format: "astc-4x4-unorm", data: Uint8Array, width, height}
 *   v4.3 actual:  {compressed, mipmaps: true, data: [{data, width, height, format: 37808}, ...]}
 *   v4.3 mipmaps: {compressed, mipmaps: [{data, width, height, format}, ...]}  (forward compat)
 */
export function createCompressedTexture(
  device: Device,
  image: CompressedImage,
  baseOptions: {id: string; sampler: SamplerProps}
): Texture {
  // Normalize mip levels from all known loaders.gl formats
  let levels: CompressedMipLevel[];

  if (Array.isArray((image as any).data) && (image as any).data[0]?.data) {
    // loaders.gl 4.3 actual format: image.data is Array of mip-level objects
    levels = (image as CompressedImageDataArray).data;
  } else if ('mipmaps' in image && Array.isArray((image as CompressedImageMipmapArray).mipmaps)) {
    // Hypothetical future format: image.mipmaps is an Array
    levels = (image as CompressedImageMipmapArray).mipmaps;
  } else if ((image as any).data && (image as CompressedImageFlat).width) {
    // loaders.gl <4.3 flat format: image.data is a TypedArray
    const flat = image as CompressedImageFlat;
    levels = [{data: flat.data, width: flat.width, height: flat.height, format: flat.format}];
  } else {
    levels = [];
  }

  if (levels.length === 0 || !levels[0]?.data) {
    log.warn(
      'createCompressedTexture: compressed image has no valid mip levels, creating fallback'
    )();
    return device.createTexture({
      ...baseOptions,
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      mipLevels: 1
    });
  }

  const baseLevel = levels[0];
  const baseWidth = baseLevel.width ?? (image as any).width ?? 0;
  const baseHeight = baseLevel.height ?? (image as any).height ?? 0;

  if (baseWidth <= 0 || baseHeight <= 0) {
    log.warn('createCompressedTexture: base level has invalid dimensions, creating fallback')();
    return device.createTexture({
      ...baseOptions,
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      mipLevels: 1
    });
  }

  // Resolve format — may be a GL enum number from loaders.gl 4.3
  const format =
    resolveCompressedTextureFormat(baseLevel.format) ||
    resolveCompressedTextureFormat(image.format);

  if (!format) {
    log.warn(
      `createCompressedTexture: unknown texture format (${baseLevel.format ?? image.format}), creating fallback`
    )();
    return device.createTexture({
      ...baseOptions,
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      mipLevels: 1
    });
  }

  // Validate mip levels: truncate chain at first invalid level.
  // Levels must be contiguous, so we stop at the first level that has
  // a format mismatch, missing data, non-positive dimensions, or
  // dimensions that don't match what texStorage2D will allocate.
  //
  // For block-compressed formats (ASTC, BC, ETC2), texStorage2D allocates
  // mip levels down to 1×1 texels, but compressed data can't be smaller
  // than one block (e.g. 4×4 for ASTC-4x4). Cap the chain so we never
  // try to upload data whose block-aligned size exceeds the allocated level.
  const maxMipLevels = getMaxCompressedMipLevels(baseWidth, baseHeight, format);
  const levelLimit = Math.min(levels.length, maxMipLevels);

  let validLevelCount = 1;
  for (let i = 1; i < levelLimit; i++) {
    const level = levels[i];
    if (!level.data || level.width <= 0 || level.height <= 0) {
      log.warn(`createCompressedTexture: mip level ${i} has invalid data/dimensions, truncating`)();
      break;
    }
    const levelFormat = resolveCompressedTextureFormat(level.format);
    if (levelFormat && levelFormat !== format) {
      log.warn(
        `createCompressedTexture: mip level ${i} format '${levelFormat}' differs from base '${format}', truncating`
      )();
      break;
    }
    const expectedW = Math.max(1, baseWidth >> i);
    const expectedH = Math.max(1, baseHeight >> i);
    if (level.width !== expectedW || level.height !== expectedH) {
      log.warn(
        `createCompressedTexture: mip level ${i} dimensions ${level.width}x${level.height} ` +
          `don't match expected ${expectedW}x${expectedH}, truncating`
      )();
      break;
    }
    validLevelCount++;
  }

  const texture = device.createTexture({
    ...baseOptions,
    format,
    width: baseWidth,
    height: baseHeight,
    mipLevels: validLevelCount,
    data: baseLevel.data
  });

  // Upload additional validated mip levels
  for (let i = 1; i < validLevelCount; i++) {
    texture.writeData(levels[i].data, {
      width: levels[i].width,
      height: levels[i].height,
      mipLevel: i
    });
  }

  return texture;
}

/*
/**
 * Parses a GLTF material definition into uniforms and parameters for the PBR shader module
 *
export class PBRMaterialParser {
  readonly device: Device;

  readonly defines: Record<string, boolean>;
  readonly bindings: Record<string, Binding>;
  readonly uniforms: Record<string, any>;
  readonly parameters: Record<string, any>;

  /** Hold on to generated textures, we destroy them in the destroy method *
  readonly generatedTextures: Texture[];

  constructor(device: Device, props: PBRMaterialParserProps) {
    const {attributes, material, pbrDebug, imageBasedLightingEnvironment, lights, useTangents} =
      props;
    this.device = device;

    this.defines = {
      // TODO: Use EXT_sRGB if available (Standard in WebGL 2.0)
      MANUAL_SRGB: true,
      SRGB_FAST_APPROXIMATION: true
    };

    if (this.device.features.has('glsl-texture-lod')) {
      this.defines.USE_TEX_LOD = true;
    }

    this.uniforms = {
      // TODO: find better values?
      camera: [0, 0, 0], // Model should override

      metallicRoughnessValues: [1, 1] // Default is 1 and 1
    };

    this.bindings = {};

    this.parameters = {};
    this.generatedTextures = [];

    if (imageBasedLightingEnvironment) {
      this.bindings.pbr_diffuseEnvSampler = imageBasedLightingEnvironment.getDiffuseEnvSampler();
      this.bindings.pbr_specularEnvSampler = imageBasedLightingEnvironment.getSpecularEnvSampler();
      this.bindings.pbr_BrdfLUT = imageBasedLightingEnvironment.getBrdfTexture();
      this.uniforms.scaleIBLAmbient = [1, 1];
    }

    if (pbrDebug) {
      // Override final color for reference app visualization
      // of various parameters in the lighting equation.
      this.uniforms.scaleDiffBaseMR = [0, 0, 0, 0];
      this.uniforms.scaleFGDSpec = [0, 0, 0, 0];
    }

    this.defineIfPresent(attributes.NORMAL, 'HAS_NORMALS');
    this.defineIfPresent(attributes.TANGENT && useTangents, 'HAS_TANGENTS');
    this.defineIfPresent(attributes.TEXCOORD_0, 'HAS_UV');
    this.defineIfPresent(attributes.COLOR_0, 'HAS_COLORS');

    this.defineIfPresent(imageBasedLightingEnvironment, 'USE_IBL');
    this.defineIfPresent(lights, 'USE_LIGHTS');
    this.defineIfPresent(pbrDebug, 'PBR_DEBUG');

    if (material) {
      this.parseMaterial(material);
    }
  }

  /**
   * Destroy all generated resources to release memory.
   *
  destroy(): void {
    this.generatedTextures.forEach(texture => texture.destroy());
  }

  /** Add a define if the the value is non-nullish *
  defineIfPresent(value: unknown, name: string): void {
    if (value) {
      this.defines[name] = 1;
    }
  }

  /** Parse GLTF material record *
  parseMaterial(material) {
    this.uniforms.unlit = Boolean(material.unlit);

    if (material.pbrMetallicRoughness) {
      this.parsePbrMetallicRoughness(material.pbrMetallicRoughness);
    }
    if (material.normalTexture) {
      this.addTexture(material.normalTexture, 'pbr_normalSampler', 'HAS_NORMALMAP');

      const {scale = 1} = material.normalTexture;
      this.uniforms.normalScale = scale;
    }
    if (material.occlusionTexture) {
      this.addTexture(material.occlusionTexture, 'pbr_occlusionSampler', 'HAS_OCCLUSIONMAP');

      const {strength = 1} = material.occlusionTexture;
      this.uniforms.occlusionStrength = strength;
    }
    if (material.emissiveTexture) {
      this.addTexture(material.emissiveTexture, 'pbr_emissiveSampler', 'HAS_EMISSIVEMAP');
      this.uniforms.emissiveFactor = material.emissiveFactor || [0, 0, 0];
    }
    if (material.alphaMode === 'MASK') {
      const {alphaCutoff = 0.5} = material;
      this.defines.ALPHA_CUTOFF = true;
      this.uniforms.u_AlphaCutoff = alphaCutoff;
    } else if (material.alphaMode === 'BLEND') {
      log.warn('BLEND alphaMode might not work well because it requires mesh sorting')();
      Object.assign(this.parameters, {
        blend: true,
        blendEquation: GL.FUNC_ADD,
        blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA]
      });
    }
  }

  /** Parse GLTF material sub record *
  parsePbrMetallicRoughness(pbrMetallicRoughness) {
    if (pbrMetallicRoughness.baseColorTexture) {
      this.addTexture(
        pbrMetallicRoughness.baseColorTexture,
        'pbr_baseColorSampler',
        'HAS_BASECOLORMAP'
      );
    }
    this.uniforms.baseColorFactor = pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];

    if (pbrMetallicRoughness.metallicRoughnessTexture) {
      this.addTexture(
        pbrMetallicRoughness.metallicRoughnessTexture,
        'pbr_metallicRoughnessSampler',
        'HAS_METALROUGHNESSMAP'
      );
    }
    const {metallicFactor = 1, roughnessFactor = 1} = pbrMetallicRoughness;
    this.uniforms.metallicRoughnessValues = [metallicFactor, roughnessFactor];
  }

  /** Create a texture from a glTF texture/sampler/image combo and add it to bindings *
  addTexture(gltfTexture, name, define = null) {
    const parameters = gltfTexture?.texture?.sampler?.parameters || {};

    const image = gltfTexture.texture.source.image;
    let textureOptions;
    let specialTextureParameters = {};
    if (image.compressed) {
      textureOptions = image;
      specialTextureParameters = {
        [GL.TEXTURE_MIN_FILTER]: image.data.length > 1 ? GL.LINEAR_MIPMAP_NEAREST : GL.LINEAR
      };
    } else {
      // Texture2D accepts a promise that returns an image as data (Async Textures)
      textureOptions = {data: image};
    }

    const texture: Texture = this.device.createTexture({
      id: gltfTexture.name || gltfTexture.id,
      parameters: {
        ...parameters,
        ...specialTextureParameters
      },
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      },
      ...textureOptions
    });
    this.bindings[name] = texture;
    this.defineIfPresent(define, define);
    this.generatedTextures.push(texture);
  }
}
*/
