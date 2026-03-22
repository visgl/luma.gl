// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, SamplerProps, TextureFormat, TypedArray} from '@luma.gl/core';
import {Texture, log, textureFormatDecoder} from '@luma.gl/core';
import type {GLTFPostprocessed, GLTFSampler} from '@loaders.gl/gltf';
import {GL} from '@luma.gl/constants';

import {type ParsedPBRMaterial} from '../pbr/pbr-material';
import {type PBREnvironment} from '../pbr/pbr-environment';
import {type PBRMaterialBindings} from '@luma.gl/shadertools';
import {convertSampler} from '../webgl-to-webgpu/convert-webgl-sampler';

// TODO - synchronize the GLTF... types with loaders.gl
// TODO - remove the glParameters, use only parameters

/* eslint-disable camelcase */

type GLTFTexture = {
  id: string;
  index?: number;
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
  extensions?: GLTFMaterialExtensions;
  unlit?: boolean;
  pbrMetallicRoughness?: GLTFPBRMetallicRoughness;
  normalTexture?: GLTFTexture;
  occlusionTexture?: GLTFTexture;
  emissiveTexture?: GLTFTexture;
  emissiveFactor?: [number, number, number];
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
  doubleSided?: boolean;
  alphaCutoff?: number;
};

type GLTFMaterialSpecularExtension = {
  specularFactor?: number;
  specularTexture?: GLTFTexture;
  specularColorFactor?: [number, number, number];
  specularColorTexture?: GLTFTexture;
};

type GLTFMaterialIorExtension = {
  ior?: number;
};

type GLTFMaterialTransmissionExtension = {
  transmissionFactor?: number;
  transmissionTexture?: GLTFTexture;
};

type GLTFMaterialVolumeExtension = {
  thicknessFactor?: number;
  thicknessTexture?: GLTFTexture;
  attenuationDistance?: number;
  attenuationColor?: [number, number, number];
};

type GLTFMaterialClearcoatExtension = {
  clearcoatFactor?: number;
  clearcoatTexture?: GLTFTexture;
  clearcoatRoughnessFactor?: number;
  clearcoatRoughnessTexture?: GLTFTexture;
  clearcoatNormalTexture?: GLTFTexture;
};

type GLTFMaterialSheenExtension = {
  sheenColorFactor?: [number, number, number];
  sheenColorTexture?: GLTFTexture;
  sheenRoughnessFactor?: number;
  sheenRoughnessTexture?: GLTFTexture;
};

type GLTFMaterialIridescenceExtension = {
  iridescenceFactor?: number;
  iridescenceTexture?: GLTFTexture;
  iridescenceIor?: number;
  iridescenceThicknessMinimum?: number;
  iridescenceThicknessMaximum?: number;
  iridescenceThicknessTexture?: GLTFTexture;
};

type GLTFMaterialAnisotropyExtension = {
  anisotropyStrength?: number;
  anisotropyRotation?: number;
  anisotropyTexture?: GLTFTexture;
};

type GLTFMaterialEmissiveStrengthExtension = {
  emissiveStrength?: number;
};

type GLTFMaterialExtensions = {
  KHR_materials_unlit?: Record<string, never>;
  KHR_materials_specular?: GLTFMaterialSpecularExtension;
  KHR_materials_ior?: GLTFMaterialIorExtension;
  KHR_materials_transmission?: GLTFMaterialTransmissionExtension;
  KHR_materials_volume?: GLTFMaterialVolumeExtension;
  KHR_materials_clearcoat?: GLTFMaterialClearcoatExtension;
  KHR_materials_sheen?: GLTFMaterialSheenExtension;
  KHR_materials_iridescence?: GLTFMaterialIridescenceExtension;
  KHR_materials_anisotropy?: GLTFMaterialAnisotropyExtension;
  KHR_materials_emissive_strength?: GLTFMaterialEmissiveStrengthExtension;
};

type TextureEnabledUniformName =
  | 'baseColorMapEnabled'
  | 'normalMapEnabled'
  | 'emissiveMapEnabled'
  | 'metallicRoughnessMapEnabled'
  | 'occlusionMapEnabled'
  | 'specularColorMapEnabled'
  | 'specularIntensityMapEnabled'
  | 'transmissionMapEnabled'
  | 'clearcoatMapEnabled'
  | 'clearcoatRoughnessMapEnabled'
  | 'sheenColorMapEnabled'
  | 'sheenRoughnessMapEnabled'
  | 'iridescenceMapEnabled'
  | 'anisotropyMapEnabled';

type TextureFeatureOptions = {
  define?: string;
  enabledUniformName?: TextureEnabledUniformName;
};

type TextureParseOptions = {
  featureOptions?: TextureFeatureOptions;
  gltf?: GLTFPostprocessed;
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
  /** parent post-processed glTF, used to resolve extension texture infos */
  gltf?: GLTFPostprocessed;
  /** run primitive-attribute diagnostics such as missing TEXCOORD_0 / NORMAL */
  validateAttributes?: boolean;
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
    parsedMaterial.bindings.pbr_brdfLUT = imageBasedLightingEnvironment.brdfLutTexture.texture;
    parsedMaterial.uniforms.IBLenabled = true;
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
    if (options.validateAttributes !== false) {
      warnOnMissingExpectedAttributes(material, attributes);
    }
    parseMaterial(device, material, parsedMaterial, options.gltf);
  }

  return parsedMaterial;
}

function warnOnMissingExpectedAttributes(
  material: GLTFPBRMaterial,
  attributes: Record<string, any>
): void {
  const uvDependentTextureSlots = getUvDependentTextureSlots(material);
  if (uvDependentTextureSlots.length > 0 && !attributes['TEXCOORD_0']) {
    log.warn(
      `glTF material uses ${uvDependentTextureSlots.join(', ')} but primitive is missing TEXCOORD_0; textured shading will sample the default UV coordinates`
    )();
  }

  const isUnlitMaterial = Boolean(material.unlit || material.extensions?.KHR_materials_unlit);
  if (isUnlitMaterial || attributes['NORMAL']) {
    return;
  }

  const missingNormalReason = material.normalTexture
    ? 'lit PBR shading with normalTexture'
    : 'lit PBR shading';
  log.warn(
    `glTF primitive is missing NORMAL while using ${missingNormalReason}; shading will fall back to geometric normals`
  )();
}

function getUvDependentTextureSlots(material: GLTFPBRMaterial): string[] {
  const uvDependentTextureSlots: string[] = [];

  if (material.pbrMetallicRoughness?.baseColorTexture) {
    uvDependentTextureSlots.push('baseColorTexture');
  }
  if (material.pbrMetallicRoughness?.metallicRoughnessTexture) {
    uvDependentTextureSlots.push('metallicRoughnessTexture');
  }
  if (material.normalTexture) {
    uvDependentTextureSlots.push('normalTexture');
  }
  if (material.occlusionTexture) {
    uvDependentTextureSlots.push('occlusionTexture');
  }
  if (material.emissiveTexture) {
    uvDependentTextureSlots.push('emissiveTexture');
  }
  if (material.extensions?.KHR_materials_specular?.specularTexture) {
    uvDependentTextureSlots.push('KHR_materials_specular.specularTexture');
  }
  if (material.extensions?.KHR_materials_specular?.specularColorTexture) {
    uvDependentTextureSlots.push('KHR_materials_specular.specularColorTexture');
  }
  if (material.extensions?.KHR_materials_transmission?.transmissionTexture) {
    uvDependentTextureSlots.push('KHR_materials_transmission.transmissionTexture');
  }
  if (material.extensions?.KHR_materials_clearcoat?.clearcoatTexture) {
    uvDependentTextureSlots.push('KHR_materials_clearcoat.clearcoatTexture');
  }
  if (material.extensions?.KHR_materials_clearcoat?.clearcoatRoughnessTexture) {
    uvDependentTextureSlots.push('KHR_materials_clearcoat.clearcoatRoughnessTexture');
  }
  if (material.extensions?.KHR_materials_sheen?.sheenColorTexture) {
    uvDependentTextureSlots.push('KHR_materials_sheen.sheenColorTexture');
  }
  if (material.extensions?.KHR_materials_sheen?.sheenRoughnessTexture) {
    uvDependentTextureSlots.push('KHR_materials_sheen.sheenRoughnessTexture');
  }
  if (material.extensions?.KHR_materials_iridescence?.iridescenceTexture) {
    uvDependentTextureSlots.push('KHR_materials_iridescence.iridescenceTexture');
  }
  if (material.extensions?.KHR_materials_anisotropy?.anisotropyTexture) {
    uvDependentTextureSlots.push('KHR_materials_anisotropy.anisotropyTexture');
  }

  return uvDependentTextureSlots;
}

/** Parse GLTF material record */
function parseMaterial(
  device: Device,
  material: GLTFPBRMaterial,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  parsedMaterial.uniforms.unlit = Boolean(
    material.unlit || material.extensions?.KHR_materials_unlit
  );

  if (material.pbrMetallicRoughness) {
    parsePbrMetallicRoughness(device, material.pbrMetallicRoughness, parsedMaterial, gltf);
  }
  if (material.normalTexture) {
    addTexture(device, material.normalTexture, 'pbr_normalSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_NORMALMAP',
        enabledUniformName: 'normalMapEnabled'
      },
      gltf
    });

    const {scale = 1} = material.normalTexture;
    parsedMaterial.uniforms.normalScale = scale;
  }
  if (material.occlusionTexture) {
    addTexture(device, material.occlusionTexture, 'pbr_occlusionSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_OCCLUSIONMAP',
        enabledUniformName: 'occlusionMapEnabled'
      },
      gltf
    });

    const {strength = 1} = material.occlusionTexture;
    parsedMaterial.uniforms.occlusionStrength = strength;
  }
  parsedMaterial.uniforms.emissiveFactor = material.emissiveFactor || [0, 0, 0];
  if (material.emissiveTexture) {
    addTexture(device, material.emissiveTexture, 'pbr_emissiveSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_EMISSIVEMAP',
        enabledUniformName: 'emissiveMapEnabled'
      },
      gltf
    });
  }

  parseMaterialExtensions(device, material.extensions, parsedMaterial, gltf);

  switch (material.alphaMode || 'OPAQUE') {
    case 'OPAQUE':
      break;
    case 'MASK': {
      const {alphaCutoff = 0.5} = material;
      parsedMaterial.defines['ALPHA_CUTOFF'] = true;
      parsedMaterial.uniforms.alphaCutoffEnabled = true;
      parsedMaterial.uniforms.alphaCutoff = alphaCutoff;
      break;
    }
    case 'BLEND':
      log.warn('glTF BLEND alphaMode might not work well because it requires mesh sorting')();
      applyAlphaBlendParameters(parsedMaterial);

      break;
  }
}

function applyAlphaBlendParameters(parsedMaterial: ParsedPBRMaterial): void {
  parsedMaterial.parameters.blend = true;
  parsedMaterial.parameters.blendColorOperation = 'add';
  parsedMaterial.parameters.blendColorSrcFactor = 'src-alpha';
  parsedMaterial.parameters.blendColorDstFactor = 'one-minus-src-alpha';
  parsedMaterial.parameters.blendAlphaOperation = 'add';
  parsedMaterial.parameters.blendAlphaSrcFactor = 'one';
  parsedMaterial.parameters.blendAlphaDstFactor = 'one-minus-src-alpha';

  parsedMaterial.glParameters['blend'] = true;
  parsedMaterial.glParameters['blendEquation'] = GL.FUNC_ADD;
  parsedMaterial.glParameters['blendFunc'] = [
    GL.SRC_ALPHA,
    GL.ONE_MINUS_SRC_ALPHA,
    GL.ONE,
    GL.ONE_MINUS_SRC_ALPHA
  ];
}

function applyTransmissionBlendApproximation(parsedMaterial: ParsedPBRMaterial): void {
  parsedMaterial.parameters.blend = true;
  parsedMaterial.parameters.depthWriteEnabled = false;
  parsedMaterial.parameters.blendColorOperation = 'add';
  parsedMaterial.parameters.blendColorSrcFactor = 'one';
  parsedMaterial.parameters.blendColorDstFactor = 'one-minus-src-alpha';
  parsedMaterial.parameters.blendAlphaOperation = 'add';
  parsedMaterial.parameters.blendAlphaSrcFactor = 'one';
  parsedMaterial.parameters.blendAlphaDstFactor = 'one-minus-src-alpha';

  parsedMaterial.glParameters['blend'] = true;
  parsedMaterial.glParameters['depthMask'] = false;
  parsedMaterial.glParameters['blendEquation'] = GL.FUNC_ADD;
  parsedMaterial.glParameters['blendFunc'] = [
    GL.ONE,
    GL.ONE_MINUS_SRC_ALPHA,
    GL.ONE,
    GL.ONE_MINUS_SRC_ALPHA
  ];
}

/** Parse GLTF material sub record */
function parsePbrMetallicRoughness(
  device: Device,
  pbrMetallicRoughness: GLTFPBRMetallicRoughness,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (pbrMetallicRoughness.baseColorTexture) {
    addTexture(
      device,
      pbrMetallicRoughness.baseColorTexture,
      'pbr_baseColorSampler',
      parsedMaterial,
      {
        featureOptions: {
          define: 'HAS_BASECOLORMAP',
          enabledUniformName: 'baseColorMapEnabled'
        },
        gltf
      }
    );
  }
  parsedMaterial.uniforms.baseColorFactor = pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1];

  if (pbrMetallicRoughness.metallicRoughnessTexture) {
    addTexture(
      device,
      pbrMetallicRoughness.metallicRoughnessTexture,
      'pbr_metallicRoughnessSampler',
      parsedMaterial,
      {
        featureOptions: {
          define: 'HAS_METALROUGHNESSMAP',
          enabledUniformName: 'metallicRoughnessMapEnabled'
        },
        gltf
      }
    );
  }
  const {metallicFactor = 1, roughnessFactor = 1} = pbrMetallicRoughness;
  parsedMaterial.uniforms.metallicRoughnessValues = [metallicFactor, roughnessFactor];
}

function parseMaterialExtensions(
  device: Device,
  extensions: GLTFMaterialExtensions | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extensions) {
    return;
  }

  if (hasMaterialExtensionShading(extensions)) {
    parsedMaterial.defines['USE_MATERIAL_EXTENSIONS'] = true;
  }

  parseSpecularExtension(device, extensions.KHR_materials_specular, parsedMaterial, gltf);
  parseIorExtension(extensions.KHR_materials_ior, parsedMaterial);
  parseTransmissionExtension(device, extensions.KHR_materials_transmission, parsedMaterial, gltf);
  parseVolumeExtension(device, extensions.KHR_materials_volume, parsedMaterial, gltf);
  parseClearcoatExtension(device, extensions.KHR_materials_clearcoat, parsedMaterial, gltf);
  parseSheenExtension(device, extensions.KHR_materials_sheen, parsedMaterial, gltf);
  parseIridescenceExtension(device, extensions.KHR_materials_iridescence, parsedMaterial, gltf);
  parseAnisotropyExtension(device, extensions.KHR_materials_anisotropy, parsedMaterial, gltf);
  parseEmissiveStrengthExtension(extensions.KHR_materials_emissive_strength, parsedMaterial);
}

function hasMaterialExtensionShading(extensions: GLTFMaterialExtensions): boolean {
  return Boolean(
    extensions.KHR_materials_specular ||
      extensions.KHR_materials_ior ||
      extensions.KHR_materials_transmission ||
      extensions.KHR_materials_volume ||
      extensions.KHR_materials_clearcoat ||
      extensions.KHR_materials_sheen ||
      extensions.KHR_materials_iridescence ||
      extensions.KHR_materials_anisotropy
  );
}

function parseSpecularExtension(
  device: Device,
  extension: GLTFMaterialSpecularExtension | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extension) {
    return;
  }

  if (extension.specularColorFactor) {
    parsedMaterial.uniforms.specularColorFactor = extension.specularColorFactor;
  }
  if (extension.specularFactor !== undefined) {
    parsedMaterial.uniforms.specularIntensityFactor = extension.specularFactor;
  }
  if (extension.specularColorTexture) {
    addTexture(device, extension.specularColorTexture, 'pbr_specularColorSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_SPECULARCOLORMAP',
        enabledUniformName: 'specularColorMapEnabled'
      },
      gltf
    });
  }
  if (extension.specularTexture) {
    addTexture(device, extension.specularTexture, 'pbr_specularIntensitySampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_SPECULARINTENSITYMAP',
        enabledUniformName: 'specularIntensityMapEnabled'
      },
      gltf
    });
  }
}

function parseIorExtension(
  extension: GLTFMaterialIorExtension | undefined,
  parsedMaterial: ParsedPBRMaterial
): void {
  if (extension?.ior !== undefined) {
    parsedMaterial.uniforms.ior = extension.ior;
  }
}

function parseTransmissionExtension(
  device: Device,
  extension: GLTFMaterialTransmissionExtension | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extension) {
    return;
  }

  if (extension.transmissionFactor !== undefined) {
    parsedMaterial.uniforms.transmissionFactor = extension.transmissionFactor;
  }
  if (extension.transmissionTexture) {
    addTexture(device, extension.transmissionTexture, 'pbr_transmissionSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_TRANSMISSIONMAP',
        enabledUniformName: 'transmissionMapEnabled'
      },
      gltf
    });
  }

  if ((extension.transmissionFactor ?? 0) > 0 || extension.transmissionTexture) {
    log.warn(
      'KHR_materials_transmission uses a premultiplied-alpha blending approximation and may require mesh sorting'
    )();
    applyTransmissionBlendApproximation(parsedMaterial);
  }
}

function parseVolumeExtension(
  device: Device,
  extension: GLTFMaterialVolumeExtension | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extension) {
    return;
  }

  if (extension.thicknessFactor !== undefined) {
    parsedMaterial.uniforms.thicknessFactor = extension.thicknessFactor;
  }
  if (extension.thicknessTexture) {
    addTexture(device, extension.thicknessTexture, 'pbr_thicknessSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_THICKNESSMAP'
      },
      gltf
    });
  }
  if (extension.attenuationDistance !== undefined) {
    parsedMaterial.uniforms.attenuationDistance = extension.attenuationDistance;
  }
  if (extension.attenuationColor) {
    parsedMaterial.uniforms.attenuationColor = extension.attenuationColor;
  }
}

function parseClearcoatExtension(
  device: Device,
  extension: GLTFMaterialClearcoatExtension | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extension) {
    return;
  }

  if (extension.clearcoatFactor !== undefined) {
    parsedMaterial.uniforms.clearcoatFactor = extension.clearcoatFactor;
  }
  if (extension.clearcoatRoughnessFactor !== undefined) {
    parsedMaterial.uniforms.clearcoatRoughnessFactor = extension.clearcoatRoughnessFactor;
  }
  if (extension.clearcoatTexture) {
    addTexture(device, extension.clearcoatTexture, 'pbr_clearcoatSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_CLEARCOATMAP',
        enabledUniformName: 'clearcoatMapEnabled'
      },
      gltf
    });
  }
  if (extension.clearcoatRoughnessTexture) {
    addTexture(
      device,
      extension.clearcoatRoughnessTexture,
      'pbr_clearcoatRoughnessSampler',
      parsedMaterial,
      {
        featureOptions: {
          define: 'HAS_CLEARCOATROUGHNESSMAP',
          enabledUniformName: 'clearcoatRoughnessMapEnabled'
        },
        gltf
      }
    );
  }
  if (extension.clearcoatNormalTexture) {
    addTexture(
      device,
      extension.clearcoatNormalTexture,
      'pbr_clearcoatNormalSampler',
      parsedMaterial,
      {
        featureOptions: {
          define: 'HAS_CLEARCOATNORMALMAP'
        },
        gltf
      }
    );
  }
}

function parseSheenExtension(
  device: Device,
  extension: GLTFMaterialSheenExtension | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extension) {
    return;
  }

  if (extension.sheenColorFactor) {
    parsedMaterial.uniforms.sheenColorFactor = extension.sheenColorFactor;
  }
  if (extension.sheenRoughnessFactor !== undefined) {
    parsedMaterial.uniforms.sheenRoughnessFactor = extension.sheenRoughnessFactor;
  }
  if (extension.sheenColorTexture) {
    addTexture(device, extension.sheenColorTexture, 'pbr_sheenColorSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_SHEENCOLORMAP',
        enabledUniformName: 'sheenColorMapEnabled'
      },
      gltf
    });
  }
  if (extension.sheenRoughnessTexture) {
    addTexture(
      device,
      extension.sheenRoughnessTexture,
      'pbr_sheenRoughnessSampler',
      parsedMaterial,
      {
        featureOptions: {
          define: 'HAS_SHEENROUGHNESSMAP',
          enabledUniformName: 'sheenRoughnessMapEnabled'
        },
        gltf
      }
    );
  }
}

function parseIridescenceExtension(
  device: Device,
  extension: GLTFMaterialIridescenceExtension | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extension) {
    return;
  }

  if (extension.iridescenceFactor !== undefined) {
    parsedMaterial.uniforms.iridescenceFactor = extension.iridescenceFactor;
  }
  if (extension.iridescenceIor !== undefined) {
    parsedMaterial.uniforms.iridescenceIor = extension.iridescenceIor;
  }
  if (
    extension.iridescenceThicknessMinimum !== undefined ||
    extension.iridescenceThicknessMaximum !== undefined
  ) {
    parsedMaterial.uniforms.iridescenceThicknessRange = [
      extension.iridescenceThicknessMinimum ?? 100,
      extension.iridescenceThicknessMaximum ?? 400
    ];
  }
  if (extension.iridescenceTexture) {
    addTexture(device, extension.iridescenceTexture, 'pbr_iridescenceSampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_IRIDESCENCEMAP',
        enabledUniformName: 'iridescenceMapEnabled'
      },
      gltf
    });
  }
  if (extension.iridescenceThicknessTexture) {
    addTexture(
      device,
      extension.iridescenceThicknessTexture,
      'pbr_iridescenceThicknessSampler',
      parsedMaterial,
      {
        featureOptions: {
          define: 'HAS_IRIDESCENCETHICKNESSMAP'
        },
        gltf
      }
    );
  }
}

function parseAnisotropyExtension(
  device: Device,
  extension: GLTFMaterialAnisotropyExtension | undefined,
  parsedMaterial: ParsedPBRMaterial,
  gltf?: GLTFPostprocessed
): void {
  if (!extension) {
    return;
  }

  if (extension.anisotropyStrength !== undefined) {
    parsedMaterial.uniforms.anisotropyStrength = extension.anisotropyStrength;
  }
  if (extension.anisotropyRotation !== undefined) {
    parsedMaterial.uniforms.anisotropyRotation = extension.anisotropyRotation;
  }
  if (extension.anisotropyTexture) {
    addTexture(device, extension.anisotropyTexture, 'pbr_anisotropySampler', parsedMaterial, {
      featureOptions: {
        define: 'HAS_ANISOTROPYMAP',
        enabledUniformName: 'anisotropyMapEnabled'
      },
      gltf
    });
  }
}

function parseEmissiveStrengthExtension(
  extension: GLTFMaterialEmissiveStrengthExtension | undefined,
  parsedMaterial: ParsedPBRMaterial
): void {
  if (extension?.emissiveStrength !== undefined) {
    parsedMaterial.uniforms.emissiveStrength = extension.emissiveStrength;
  }
}

/** Create a texture from a glTF texture/sampler/image combo and add it to bindings */
function addTexture(
  device: Device,
  gltfTexture: GLTFTexture,
  uniformName: keyof PBRMaterialBindings,
  parsedMaterial: ParsedPBRMaterial,
  textureParseOptions: TextureParseOptions = {}
): void {
  const {featureOptions = {}, gltf} = textureParseOptions;
  const {define, enabledUniformName} = featureOptions;
  const resolvedTextureInfo = resolveTextureInfo(gltfTexture, gltf);
  const image = resolvedTextureInfo.texture?.source?.image;
  if (!image) {
    log.warn(`Skipping unresolved glTF texture for ${String(uniformName)}`)();
    return;
  }

  const gltfSampler = {
    wrapS: 10497, // default REPEAT S (U) wrapping mode.
    wrapT: 10497, // default REPEAT T (V) wrapping mode.
    minFilter: 9729, // default LINEAR filtering
    magFilter: 9729, // default LINEAR filtering
    ...resolvedTextureInfo?.texture?.sampler
  } as GLTFSampler;

  const baseOptions = {
    id: resolvedTextureInfo.uniformName || resolvedTextureInfo.id,
    sampler: convertSampler(gltfSampler)
  };

  let texture: Texture;

  if (image.compressed) {
    texture = createCompressedTexture(device, image, baseOptions);
  } else {
    const {width, height} = device.getExternalImageSize(image);
    texture = device.createTexture({
      ...baseOptions,
      width,
      height,
      data: image
    });
  }

  parsedMaterial.bindings[uniformName] = texture;
  if (define) parsedMaterial.defines[define] = true;
  if (enabledUniformName) {
    parsedMaterial.uniforms[enabledUniformName] = true;
  }
  parsedMaterial.generatedTextures.push(texture);
}

function resolveTextureInfo(gltfTexture: GLTFTexture, gltf?: GLTFPostprocessed): GLTFTexture {
  if (gltfTexture.texture || gltfTexture.index === undefined || !gltf?.textures) {
    return gltfTexture;
  }

  const resolvedTextureEntry = gltf.textures[gltfTexture.index] as
    | Partial<GLTFTexture>
    | GLTFTexture['texture']
    | undefined;
  if (!resolvedTextureEntry) {
    return gltfTexture;
  }

  if ('texture' in resolvedTextureEntry && resolvedTextureEntry.texture) {
    return {
      ...resolvedTextureEntry,
      ...gltfTexture,
      texture: resolvedTextureEntry.texture
    } as GLTFTexture;
  }

  if (!('source' in resolvedTextureEntry)) {
    return gltfTexture;
  }

  return {
    ...gltfTexture,
    texture: resolvedTextureEntry
  };
}

/** One mip level as produced by loaders.gl compressed texture parsers */
export type CompressedMipLevel = {
  data: TypedArray;
  width: number;
  height: number;
  textureFormat?: TextureFormat;
};

/**
 * Compressed image from current loaders.gl releases.
 * - `mipmaps` is a boolean (true), NOT an array
 * - `data` is an Array of TextureLevel-like objects
 * - Per-level `textureFormat` is already a luma.gl TextureFormat
 * - Top-level `width`/`height` may be undefined
 */
export type CompressedImageDataArray = {
  compressed: true;
  mipmaps?: boolean;
  width?: number;
  height?: number;
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
  mipmaps: CompressedMipLevel[];
};

/** Union of all known loaders.gl compressed image shapes */
export type CompressedImage = CompressedImageDataArray | CompressedImageMipmapArray;

function createCompressedTextureFallback(
  device: Device,
  baseOptions: {id: string; sampler: SamplerProps}
): Texture {
  return device.createTexture({
    ...baseOptions,
    format: 'rgba8unorm',
    width: 1,
    height: 1,
    mipLevels: 1
  });
}

function resolveCompressedTextureFormat(level: CompressedMipLevel): TextureFormat | undefined {
  return level.textureFormat;
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
  const {blockWidth = 1, blockHeight = 1} = textureFormatDecoder.getInfo(format);
  let count = 1;
  for (let i = 1; ; i++) {
    const w = Math.max(1, baseWidth >> i);
    const h = Math.max(1, baseHeight >> i);
    if (w < blockWidth || h < blockHeight) break;
    count++;
  }
  return count;
}

/**
 * Create a texture from compressed image data produced by loaders.gl.
 * Handles current loaders.gl compressed image layouts:
 *
 *   current:      {compressed, mipmaps: true, data: [{data, width, height, textureFormat}, ...]}
 *   forward:      {compressed, mipmaps: [{data, width, height, textureFormat}, ...]}
 */
export function createCompressedTexture(
  device: Device,
  image: CompressedImage,
  baseOptions: {id: string; sampler: SamplerProps}
): Texture {
  // Normalize mip levels from all known loaders.gl formats
  let levels: CompressedMipLevel[];

  if (Array.isArray((image as any).data) && (image as any).data[0]?.data) {
    // loaders.gl current format: image.data is Array of mip-level objects
    levels = (image as CompressedImageDataArray).data;
  } else if ('mipmaps' in image && Array.isArray((image as CompressedImageMipmapArray).mipmaps)) {
    // Hypothetical future format: image.mipmaps is an Array
    levels = (image as CompressedImageMipmapArray).mipmaps;
  } else {
    levels = [];
  }

  if (levels.length === 0 || !levels[0]?.data) {
    log.warn(
      'createCompressedTexture: compressed image has no valid mip levels, creating fallback'
    )();
    return createCompressedTextureFallback(device, baseOptions);
  }

  const baseLevel = levels[0];
  const baseWidth = baseLevel.width ?? (image as any).width ?? 0;
  const baseHeight = baseLevel.height ?? (image as any).height ?? 0;

  if (baseWidth <= 0 || baseHeight <= 0) {
    log.warn('createCompressedTexture: base level has invalid dimensions, creating fallback')();
    return createCompressedTextureFallback(device, baseOptions);
  }

  const format = resolveCompressedTextureFormat(baseLevel);

  if (!format) {
    log.warn('createCompressedTexture: compressed image has no textureFormat, creating fallback')();
    return createCompressedTextureFallback(device, baseOptions);
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
    const levelFormat = resolveCompressedTextureFormat(level);
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
    usage: Texture.TEXTURE | Texture.COPY_DST,
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
      this.bindings.pbr_brdfLUT = imageBasedLightingEnvironment.getBrdfTexture();
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
