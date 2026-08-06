// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';

export type GLTFExtensionSupportLevel = 'built-in' | 'parsed-and-wired' | 'loader-only' | 'none';

export type GLTFExtensionSupport = {
  extensionName: string;
  /** Whether the source document declares this extension in `extensionsRequired`. */
  required: boolean;
  supported: boolean;
  supportLevel: GLTFExtensionSupportLevel;
  comment: string;
};

type GLTFExtensionSupportDefinition = Omit<
  GLTFExtensionSupport,
  'extensionName' | 'required' | 'supported'
>;

type GLTFPostprocessedWithRemovedExtensions = GLTFPostprocessed & {
  extensionsRemoved?: string[];
  lights?: unknown[];
};

const UNKNOWN_EXTENSION_SUPPORT: GLTFExtensionSupportDefinition = {
  supportLevel: 'none',
  comment: 'Not currently listed in the luma.gl glTF extension support registry.'
};

const GLTF_EXTENSION_SUPPORT_REGISTRY: Record<string, GLTFExtensionSupportDefinition> = {
  KHR_draco_mesh_compression: {
    supportLevel: 'built-in',
    comment: 'Decoded by loaders.gl before luma.gl builds the scenegraph.'
  },
  EXT_meshopt_compression: {
    supportLevel: 'built-in',
    comment: 'Meshopt-compressed primitives are decoded during load.'
  },
  KHR_mesh_quantization: {
    supportLevel: 'built-in',
    comment: 'Quantized accessors are unpacked before geometry creation.'
  },
  KHR_lights_punctual: {
    supportLevel: 'built-in',
    comment: 'Parsed into luma.gl Light objects.'
  },
  KHR_materials_unlit: {
    supportLevel: 'built-in',
    comment: 'Unlit materials bypass the default lighting path.'
  },
  KHR_materials_emissive_strength: {
    supportLevel: 'built-in',
    comment: 'Applied by the stock PBR shader.'
  },
  KHR_texture_basisu: {
    supportLevel: 'built-in',
    comment: 'BasisU / KTX2 textures pass through when the device supports them.'
  },
  KHR_texture_transform: {
    supportLevel: 'built-in',
    comment: 'UV transforms are applied during load.'
  },
  EXT_texture_webp: {
    supportLevel: 'loader-only',
    comment:
      'Texture source is resolved during load; final support depends on browser and device decode support.'
  },
  EXT_texture_avif: {
    supportLevel: 'loader-only',
    comment:
      'Texture source is resolved during load; final support depends on browser and device decode support.'
  },
  KHR_materials_specular: {
    supportLevel: 'built-in',
    comment: 'The stock shader now applies specular factors and textures to the dielectric F0 term.'
  },
  KHR_materials_ior: {
    supportLevel: 'built-in',
    comment: 'The stock shader now drives dielectric reflectance from the glTF IOR value.'
  },
  KHR_materials_transmission: {
    supportLevel: 'built-in',
    comment:
      'The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer.'
  },
  KHR_materials_volume: {
    supportLevel: 'built-in',
    comment: 'Thickness and attenuation now tint transmitted light in the stock shader.'
  },
  KHR_materials_clearcoat: {
    supportLevel: 'built-in',
    comment: 'The stock shader now adds a secondary clearcoat specular lobe.'
  },
  KHR_materials_sheen: {
    supportLevel: 'built-in',
    comment: 'The stock shader now adds a sheen lobe for cloth-like materials.'
  },
  KHR_materials_iridescence: {
    supportLevel: 'built-in',
    comment:
      'The stock shader now tints specular response with a view-dependent thin-film iridescence approximation.'
  },
  KHR_materials_anisotropy: {
    supportLevel: 'built-in',
    comment:
      'The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation.'
  },
  KHR_materials_pbrSpecularGlossiness: {
    supportLevel: 'loader-only',
    comment:
      'Extension data can be loaded, but it is not translated into the default metallic-roughness material path.'
  },
  KHR_materials_variants: {
    supportLevel: 'parsed-and-wired',
    comment: 'Primitive material variants can be selected and restored on the generated scenegraph.'
  },
  EXT_mesh_gpu_instancing: {
    supportLevel: 'built-in',
    comment: 'Accessor-backed instance transforms use one instanced draw per source primitive.'
  },
  KHR_node_visibility: {
    supportLevel: 'parsed-and-wired',
    comment: 'Recursive node visibility controls rendered geometry, punctual lights, and animation.'
  },
  KHR_animation_pointer: {
    supportLevel: 'parsed-and-wired',
    comment:
      'Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates.'
  },
  KHR_materials_diffuse_transmission: {
    supportLevel: 'none',
    comment: 'Diffuse-transmission shading is not implemented in the stock PBR shader.'
  },
  KHR_materials_dispersion: {
    supportLevel: 'parsed-and-wired',
    comment:
      'The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction.'
  },
  KHR_materials_volume_scatter: {
    supportLevel: 'none',
    comment: 'Volume scattering is not implemented in the stock PBR shader.'
  },
  KHR_xmp: {
    supportLevel: 'none',
    comment: 'Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them.'
  },
  KHR_xmp_json_ld: {
    supportLevel: 'none',
    comment: 'Metadata is preserved in the glTF, but luma.gl does not interpret it.'
  },
  EXT_lights_image_based: {
    supportLevel: 'none',
    comment: 'Use loadPBREnvironment() or custom environment setup instead.'
  },
  EXT_texture_video: {
    supportLevel: 'none',
    comment: 'Video textures are not created automatically by the stock pipeline.'
  },
  MSFT_lod: {
    supportLevel: 'none',
    comment: 'Level-of-detail switching is not implemented in the stock scenegraph loader.'
  }
};

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
          supported:
            extensionSupportDefinition.supportLevel === 'built-in' ||
            extensionSupportDefinition.supportLevel === 'parsed-and-wired',
          supportLevel: extensionSupportDefinition.supportLevel,
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
