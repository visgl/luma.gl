// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';

export type GLTFExtensionSupportLevel = 'built-in' | 'parsed-and-wired' | 'loader-only' | 'none';

export type GLTFExtensionStandardStatus =
  | 'ratified'
  | 'release-candidate'
  | 'multi-vendor'
  | 'vendor'
  | 'draft'
  | 'archived'
  | 'unknown';

export type GLTFExtensionSupport = {
  extensionName: string;
  /** Whether the source document declares this extension in `extensionsRequired`. */
  required: boolean;
  supported: boolean;
  supportLevel: GLTFExtensionSupportLevel;
  standardStatus: GLTFExtensionStandardStatus;
  comment: string;
};

export type GLTFRegisteredExtensionSupport = Omit<GLTFExtensionSupport, 'required'>;

export type GLTFExtensionSupportSummary = {
  total: number;
  supported: number;
  bySupportLevel: Record<GLTFExtensionSupportLevel, number>;
  byStandardStatus: Record<GLTFExtensionStandardStatus, number>;
};

type GLTFExtensionSupportDefinition = Omit<
  GLTFRegisteredExtensionSupport,
  'extensionName' | 'supported'
>;

type GLTFPostprocessedWithRemovedExtensions = GLTFPostprocessed & {
  extensionsRemoved?: string[];
  lights?: unknown[];
};

const UNKNOWN_EXTENSION_SUPPORT: GLTFExtensionSupportDefinition = {
  supportLevel: 'none',
  standardStatus: 'unknown',
  comment: 'Not currently listed in the luma.gl glTF extension support registry.'
};

const GLTF_EXTENSION_SUPPORT_REGISTRY: Record<string, GLTFExtensionSupportDefinition> = {
  KHR_draco_mesh_compression: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'Decoded by loaders.gl before luma.gl builds the scenegraph.'
  },
  EXT_meshopt_compression: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering.'
  },
  KHR_meshopt_compression: {
    supportLevel: 'none',
    standardStatus: 'release-candidate',
    comment:
      'The installed loaders.gl GLTFLoader supports EXT_meshopt_compression, not the KHR release candidate.'
  },
  KHR_mesh_quantization: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'Loader-materialized quantized accessors retain their typed values and normalization.'
  },
  EXT_mesh_features: {
    supportLevel: 'loader-only',
    standardStatus: 'ratified',
    comment:
      'Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned.'
  },
  EXT_structural_metadata: {
    supportLevel: 'loader-only',
    standardStatus: 'ratified',
    comment:
      'Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned.'
  },
  KHR_lights_punctual: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'Parsed into luma.gl Light objects.'
  },
  KHR_materials_unlit: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'Unlit materials bypass the default lighting path.'
  },
  KHR_materials_emissive_strength: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'Applied by the stock PBR shader.'
  },
  KHR_texture_basisu: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'BasisU / KTX2 textures pass through when the device supports them.'
  },
  KHR_texture_transform: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment:
      'Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking.'
  },
  EXT_texture_webp: {
    supportLevel: 'loader-only',
    standardStatus: 'ratified',
    comment:
      'Texture source is resolved during load; final support depends on browser and device decode support.'
  },
  EXT_texture_avif: {
    supportLevel: 'none',
    standardStatus: 'ratified',
    comment:
      'The image loader can decode supported AVIF images, but GLTFLoader does not select EXT_texture_avif sources.'
  },
  KHR_materials_specular: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'The stock shader now applies specular factors and textures to the dielectric F0 term.'
  },
  KHR_materials_ior: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'The stock shader now drives dielectric reflectance from the glTF IOR value.'
  },
  KHR_materials_transmission: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment:
      'The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer.'
  },
  KHR_materials_volume: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'Thickness and attenuation now tint transmitted light in the stock shader.'
  },
  KHR_materials_clearcoat: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'The stock shader now adds a secondary clearcoat specular lobe.'
  },
  KHR_materials_sheen: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'The stock shader now adds a sheen lobe for cloth-like materials.'
  },
  KHR_materials_iridescence: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment:
      'The stock shader now tints specular response with a view-dependent thin-film iridescence approximation.'
  },
  KHR_materials_anisotropy: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment:
      'The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation.'
  },
  KHR_materials_pbrSpecularGlossiness: {
    supportLevel: 'loader-only',
    standardStatus: 'archived',
    comment:
      'Extension data can be loaded, but it is not translated into the default metallic-roughness material path.'
  },
  KHR_materials_variants: {
    supportLevel: 'parsed-and-wired',
    standardStatus: 'ratified',
    comment: 'Primitive material variants can be selected and restored on the generated scenegraph.'
  },
  EXT_mesh_gpu_instancing: {
    supportLevel: 'built-in',
    standardStatus: 'ratified',
    comment: 'Accessor-backed instance transforms use one instanced draw per source primitive.'
  },
  KHR_node_visibility: {
    supportLevel: 'parsed-and-wired',
    standardStatus: 'ratified',
    comment: 'Recursive node visibility controls rendered geometry, punctual lights, and animation.'
  },
  KHR_animation_pointer: {
    supportLevel: 'parsed-and-wired',
    standardStatus: 'ratified',
    comment:
      'Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates.'
  },
  EXT_materials_bump: {
    supportLevel: 'built-in',
    standardStatus: 'draft',
    comment:
      'The experimental bump-map draft perturbs the canonical surface normal from a linear height texture.'
  },
  KHR_materials_diffuse_transmission: {
    supportLevel: 'built-in',
    standardStatus: 'release-candidate',
    comment:
      'The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures.'
  },
  KHR_materials_dispersion: {
    supportLevel: 'parsed-and-wired',
    standardStatus: 'ratified',
    comment:
      'The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction.'
  },
  KHR_materials_volume_scatter: {
    supportLevel: 'parsed-and-wired',
    standardStatus: 'draft',
    comment:
      'The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented.'
  },
  KHR_xmp: {
    supportLevel: 'none',
    standardStatus: 'archived',
    comment: 'Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them.'
  },
  KHR_xmp_json_ld: {
    supportLevel: 'none',
    standardStatus: 'ratified',
    comment: 'Metadata is preserved in the glTF, but luma.gl does not interpret it.'
  },
  EXT_lights_image_based: {
    supportLevel: 'none',
    standardStatus: 'multi-vendor',
    comment: 'Use loadPBREnvironment() or custom environment setup instead.'
  },
  EXT_texture_video: {
    supportLevel: 'none',
    standardStatus: 'multi-vendor',
    comment: 'Video textures are not created automatically by the stock pipeline.'
  },
  MSFT_lod: {
    supportLevel: 'parsed-and-wired',
    standardStatus: 'vendor',
    comment:
      'Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented.'
  }
};

/** Returns the complete sorted runtime registry used by support checks and documentation ledgers. */
export function getRegisteredGLTFExtensions(): GLTFRegisteredExtensionSupport[] {
  return Object.entries(GLTF_EXTENSION_SUPPORT_REGISTRY)
    .sort(([leftExtensionName], [rightExtensionName]) =>
      leftExtensionName.localeCompare(rightExtensionName)
    )
    .map(([extensionName, definition]) => ({
      extensionName,
      supported: isRuntimeSupported(definition.supportLevel),
      ...definition
    }));
}

/** Summarizes registry counts without requiring documentation to duplicate the registry. */
export function getGLTFExtensionSupportSummary(): GLTFExtensionSupportSummary {
  const summary: GLTFExtensionSupportSummary = {
    total: 0,
    supported: 0,
    bySupportLevel: {'built-in': 0, 'parsed-and-wired': 0, 'loader-only': 0, none: 0},
    byStandardStatus: {
      ratified: 0,
      'release-candidate': 0,
      'multi-vendor': 0,
      vendor: 0,
      draft: 0,
      archived: 0,
      unknown: 0
    }
  };

  for (const extension of getRegisteredGLTFExtensions()) {
    summary.total++;
    summary.supported += extension.supported ? 1 : 0;
    summary.bySupportLevel[extension.supportLevel]++;
    summary.byStandardStatus[extension.standardStatus]++;
  }

  return summary;
}

export function getGLTFExtensionSupport(
  gltf: GLTFPostprocessed
): Map<string, GLTFExtensionSupport> {
  const extensionNames = Array.from(collectGLTFExtensionNames(gltf)).sort();
  const requiredExtensionNames = new Set(gltf.extensionsRequired || []);
  const extensionSupportEntries: [string, GLTFExtensionSupport][] = extensionNames.map(
    extensionName => {
      const extensionSupportDefinition =
        GLTF_EXTENSION_SUPPORT_REGISTRY[extensionName] || UNKNOWN_EXTENSION_SUPPORT;

      return [
        extensionName,
        {
          extensionName,
          required: requiredExtensionNames.has(extensionName),
          supported: isRuntimeSupported(extensionSupportDefinition.supportLevel),
          supportLevel: extensionSupportDefinition.supportLevel,
          standardStatus: extensionSupportDefinition.standardStatus,
          comment: extensionSupportDefinition.comment
        }
      ];
    }
  );

  return new Map(extensionSupportEntries);
}

/** Returns required extensions that have no complete runtime implementation. */
export function getUnsupportedRequiredGLTFExtensions(
  gltf: GLTFPostprocessed
): GLTFExtensionSupport[] {
  return Array.from(getGLTFExtensionSupport(gltf).values()).filter(
    extension => extension.required && !extension.supported
  );
}

/** Rejects documents whose required extensions cannot be honored by the runtime. */
export function assertSupportedGLTFExtensions(gltf: GLTFPostprocessed): void {
  const unsupportedExtensions = getUnsupportedRequiredGLTFExtensions(gltf);
  if (unsupportedExtensions.length) {
    throw new Error(
      `Unsupported required glTF extensions: ${unsupportedExtensions
        .map(extension => extension.extensionName)
        .join(', ')}`
    );
  }
}

export function getRegisteredGLTFExtensionSupport(
  extensionName: string
): GLTFExtensionSupportDefinition | null {
  return GLTF_EXTENSION_SUPPORT_REGISTRY[extensionName] || null;
}

function collectGLTFExtensionNames(gltf: GLTFPostprocessed): Set<string> {
  const gltfWithRemovedExtensions = gltf as GLTFPostprocessedWithRemovedExtensions;
  const extensionNames = new Set<string>();

  addExtensionNames(extensionNames, gltf.extensionsUsed);
  addExtensionNames(extensionNames, gltf.extensionsRequired);
  addExtensionNames(extensionNames, gltfWithRemovedExtensions.extensionsRemoved);
  addExtensionNames(extensionNames, Object.keys(gltf.extensions || {}));

  if (
    gltfWithRemovedExtensions.lights?.length ||
    (gltf.nodes || []).some(node => 'light' in node)
  ) {
    extensionNames.add('KHR_lights_punctual');
  }

  if (
    (gltf.materials || []).some(material => {
      const gltfMaterial = material as typeof material & {unlit?: boolean};
      return gltfMaterial.unlit || gltfMaterial.extensions?.KHR_materials_unlit;
    })
  ) {
    extensionNames.add('KHR_materials_unlit');
  }

  return extensionNames;
}

function addExtensionNames(extensionNames: Set<string>, newExtensionNames: string[] = []): void {
  for (const extensionName of newExtensionNames) {
    extensionNames.add(extensionName);
  }
}

function isRuntimeSupported(supportLevel: GLTFExtensionSupportLevel): boolean {
  return supportLevel === 'built-in' || supportLevel === 'parsed-and-wired';
}
