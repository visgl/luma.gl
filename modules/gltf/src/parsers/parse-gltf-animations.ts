// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import {type GLTFAccessorPostprocessed, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {
  GLTFAnimationPath,
  type GLTFAnimation,
  type GLTFAnimationChannel,
  type GLTFMaterialAnimationChannel,
  type GLTFMaterialAnimationProperty,
  type GLTFNodeAnimationChannel,
  type GLTFAnimationSampler,
  type GLTFTextureTransformAnimationChannel
} from '../gltf/animations/animations';
import {
  resolveTextureTransform,
  resolveTextureTransformSlot,
  type PBRTextureTransformPath
} from '../pbr/texture-transform';
import {getRegisteredGLTFExtensionSupport} from '../gltf/gltf-extension-support';

import {accessorToTypedArray} from '../webgl-to-webgpu/convert-webgl-attribute';

type UnsupportedAnimationPointerResolution = {
  reason: string;
};

/** Parses glTF animation records into the runtime animation model used by `GLTFAnimator`. */
export function parseGLTFAnimations(gltf: GLTFPostprocessed): GLTFAnimation[] {
  const gltfAnimations = gltf.animations || [];
  const accessorCache1D = new Map<GLTFAccessorPostprocessed, number[]>();
  const accessorCache2D = new Map<GLTFAccessorPostprocessed, number[][]>();

  return gltfAnimations.flatMap((animation, index) => {
    const name = animation.name || `Animation-${index}`;
    const samplerCache = new Map<number, GLTFAnimationSampler>();
    const channels: GLTFAnimationChannel[] = animation.channels.flatMap(({sampler, target}) => {
      let parsedSampler = samplerCache.get(sampler);
      if (!parsedSampler) {
        const gltfSampler = animation.samplers[sampler];
        if (!gltfSampler) {
          throw new Error(`Cannot find animation sampler ${sampler}`);
        }
        const {input, interpolation = 'LINEAR', output} = gltfSampler;
        parsedSampler = {
          input: accessorToJsArray1D(gltf.accessors[input], accessorCache1D),
          interpolation,
          output: accessorToJsArray2D(gltf.accessors[output], accessorCache2D)
        };
        samplerCache.set(sampler, parsedSampler);
      }

      const parsedChannel = parseAnimationChannel(gltf, target, parsedSampler);
      return parsedChannel ? [parsedChannel] : [];
    });

    return channels.length ? [{name, channels}] : [];
  });
}

function parseAnimationChannel(
  gltf: GLTFPostprocessed,
  target: {node?: number; path: string; extensions?: Record<string, any>},
  sampler: GLTFAnimationSampler
): GLTFAnimationChannel | null {
  if (target.path === 'pointer') {
    return parseAnimationPointerChannel(gltf, target, sampler);
  }

  const path = getNodeAnimationPath(target.path);
  if (!path) {
    return null;
  }

  const targetNode = gltf.nodes[target.node ?? 0];
  if (!targetNode) {
    throw new Error(`Cannot find animation target ${target.node}`);
  }

  return {
    type: 'node',
    sampler,
    targetNodeId: targetNode.id,
    path
  };
}

function parseAnimationPointerChannel(
  gltf: GLTFPostprocessed,
  target: {extensions?: Record<string, any>},
  sampler: GLTFAnimationSampler
): GLTFAnimationChannel | null {
  const pointer = target.extensions?.['KHR_animation_pointer']?.pointer;
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) {
    log.warn('KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped')();
    return null;
  }

  const pointerSegments = splitJsonPointer(pointer);
  switch (pointerSegments[0]) {
    case 'nodes':
      return parseNodePointerAnimationChannel(gltf, pointerSegments, sampler, pointer);

    case 'materials':
      return parseMaterialPointerAnimationChannel(gltf, pointerSegments, sampler, pointer);

    default:
      warnUnsupportedAnimationPointer(
        pointer,
        `top-level target "${pointerSegments[0]}" has no runtime animation mapping`
      );
      return null;
  }
}

function parseNodePointerAnimationChannel(
  gltf: GLTFPostprocessed,
  pointerSegments: string[],
  sampler: GLTFAnimationSampler,
  pointer: string
): GLTFNodeAnimationChannel | null {
  if (pointerSegments.length !== 3) {
    warnUnsupportedAnimationPointer(
      pointer,
      'node pointers must use /nodes/{index}/{translation|rotation|scale|weights}'
    );
    return null;
  }

  const nodeIndex = Number(pointerSegments[1]);
  const targetNode = gltf.nodes[nodeIndex];
  if (!Number.isInteger(nodeIndex) || !targetNode) {
    log.warn(
      `KHR_animation_pointer target ${pointer} references a missing node and will be skipped`
    )();
    return null;
  }

  const path = getNodeAnimationPath(pointerSegments[2]);
  if (!path) {
    warnUnsupportedAnimationPointer(
      pointer,
      `node property "${pointerSegments[2]}" has no runtime animation mapping`
    );
    return null;
  }
  if (path === 'weights') {
    log.warn(
      `KHR_animation_pointer target ${pointer} will be skipped because morph weights are not implemented in GLTFAnimator`
    )();
    return null;
  }

  return {
    type: 'node',
    sampler,
    targetNodeId: targetNode.id,
    path
  };
}

function parseMaterialPointerAnimationChannel(
  gltf: GLTFPostprocessed,
  pointerSegments: string[],
  sampler: GLTFAnimationSampler,
  pointer: string
): GLTFMaterialAnimationChannel | GLTFTextureTransformAnimationChannel | null {
  if (pointerSegments.length < 3) {
    warnUnsupportedAnimationPointer(
      pointer,
      'material pointers must include a material index and target property path'
    );
    return null;
  }

  const materialIndex = Number(pointerSegments[1]);
  const material = gltf.materials[materialIndex] as Record<string, any> | undefined;
  if (!Number.isInteger(materialIndex) || !material) {
    log.warn(
      `KHR_animation_pointer target ${pointer} references a missing material and will be skipped`
    )();
    return null;
  }

  const materialTarget = resolveMaterialAnimationTarget(material, pointerSegments.slice(2));
  if ('reason' in materialTarget) {
    warnUnsupportedAnimationPointer(pointer, materialTarget.reason);
    return null;
  }

  return {
    sampler,
    pointer,
    targetMaterialIndex: materialIndex,
    ...materialTarget
  };
}

function getNodeAnimationPath(path: string): GLTFAnimationPath | null {
  switch (path) {
    case 'translation':
    case 'rotation':
    case 'scale':
    case 'weights':
      return path;

    default:
      return null;
  }
}

function resolveMaterialAnimationTarget(
  material: Record<string, any>,
  pointerSegments: string[]
):
  | {type: 'material'; property: GLTFMaterialAnimationProperty; component?: number}
  | {
      type: 'textureTransform';
      textureSlot: import('../pbr/texture-transform').PBRTextureTransformSlot;
      path: PBRTextureTransformPath;
      component?: number;
      baseTransform: import('../pbr/texture-transform').PBRTextureTransform;
    }
  | UnsupportedAnimationPointerResolution {
  const textureTransformTarget = resolveTextureTransformAnimationTarget(material, pointerSegments);
  if (!('reason' in textureTransformTarget)) {
    return textureTransformTarget;
  }
  if (textureTransformTarget.reason !== 'not-a-texture-transform-target') {
    return textureTransformTarget;
  }

  const pointerPath = pointerSegments.join('/');

  switch (pointerPath) {
    case 'pbrMetallicRoughness/baseColorFactor':
      return material['pbrMetallicRoughness']
        ? {type: 'material', property: 'baseColorFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'pbrMetallicRoughness/metallicFactor':
      return material['pbrMetallicRoughness']
        ? {type: 'material', property: 'metallicRoughnessValues', component: 0}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'pbrMetallicRoughness/roughnessFactor':
      return material['pbrMetallicRoughness']
        ? {type: 'material', property: 'metallicRoughnessValues', component: 1}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'normalTexture/scale':
      return material['normalTexture']
        ? {type: 'material', property: 'normalScale'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'occlusionTexture/strength':
      return material['occlusionTexture']
        ? {type: 'material', property: 'occlusionStrength'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'emissiveFactor':
      return {type: 'material', property: 'emissiveFactor'};

    case 'alphaCutoff':
      return {type: 'material', property: 'alphaCutoff'};

    case 'extensions/KHR_materials_specular/specularFactor':
      return material['extensions']?.['KHR_materials_specular']
        ? {type: 'material', property: 'specularIntensityFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_specular/specularColorFactor':
      return material['extensions']?.['KHR_materials_specular']
        ? {type: 'material', property: 'specularColorFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_ior/ior':
      return material['extensions']?.['KHR_materials_ior']
        ? {type: 'material', property: 'ior'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_transmission/transmissionFactor':
      return material['extensions']?.['KHR_materials_transmission']
        ? {type: 'material', property: 'transmissionFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_volume/thicknessFactor':
      return material['extensions']?.['KHR_materials_volume']
        ? {type: 'material', property: 'thicknessFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_volume/attenuationDistance':
      return material['extensions']?.['KHR_materials_volume']
        ? {type: 'material', property: 'attenuationDistance'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_volume/attenuationColor':
      return material['extensions']?.['KHR_materials_volume']
        ? {type: 'material', property: 'attenuationColor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_clearcoat/clearcoatFactor':
      return material['extensions']?.['KHR_materials_clearcoat']
        ? {type: 'material', property: 'clearcoatFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor':
      return material['extensions']?.['KHR_materials_clearcoat']
        ? {type: 'material', property: 'clearcoatRoughnessFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_sheen/sheenColorFactor':
      return material['extensions']?.['KHR_materials_sheen']
        ? {type: 'material', property: 'sheenColorFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_sheen/sheenRoughnessFactor':
      return material['extensions']?.['KHR_materials_sheen']
        ? {type: 'material', property: 'sheenRoughnessFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_iridescence/iridescenceFactor':
      return material['extensions']?.['KHR_materials_iridescence']
        ? {type: 'material', property: 'iridescenceFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_iridescence/iridescenceIor':
      return material['extensions']?.['KHR_materials_iridescence']
        ? {type: 'material', property: 'iridescenceIor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_iridescence/iridescenceThicknessMinimum':
      return material['extensions']?.['KHR_materials_iridescence']
        ? {type: 'material', property: 'iridescenceThicknessRange', component: 0}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_iridescence/iridescenceThicknessMaximum':
      return material['extensions']?.['KHR_materials_iridescence']
        ? {type: 'material', property: 'iridescenceThicknessRange', component: 1}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_anisotropy/anisotropyStrength':
      return material['extensions']?.['KHR_materials_anisotropy']
        ? {type: 'material', property: 'anisotropyStrength'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_anisotropy/anisotropyRotation':
      return material['extensions']?.['KHR_materials_anisotropy']
        ? {type: 'material', property: 'anisotropyRotation'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_emissive_strength/emissiveStrength':
      return material['extensions']?.['KHR_materials_emissive_strength']
        ? {type: 'material', property: 'emissiveStrength'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    default:
      return {reason: getUnsupportedMaterialPointerReason(pointerSegments)};
  }
}

function resolveTextureTransformAnimationTarget(
  material: Record<string, any>,
  pointerSegments: string[]
):
  | {
      type: 'textureTransform';
      textureSlot: import('../pbr/texture-transform').PBRTextureTransformSlot;
      path: PBRTextureTransformPath;
      component?: number;
      baseTransform: import('../pbr/texture-transform').PBRTextureTransform;
    }
  | UnsupportedAnimationPointerResolution {
  const extensionIndex = pointerSegments.lastIndexOf('extensions');
  if (
    extensionIndex < 0 ||
    pointerSegments[extensionIndex + 1] !== 'KHR_texture_transform' ||
    extensionIndex < 1
  ) {
    return {reason: 'not-a-texture-transform-target'};
  }

  const textureSlotDefinition = resolveTextureTransformSlot(
    pointerSegments.slice(0, extensionIndex)
  );
  if (!textureSlotDefinition) {
    return {
      reason: getUnsupportedTextureTransformSlotReason(pointerSegments.slice(0, extensionIndex))
    };
  }

  const textureInfo = getNestedMaterialValue(material, textureSlotDefinition.pathSegments);
  if (!textureInfo) {
    return {
      reason: `texture-transform target "${pointerSegments
        .slice(0, extensionIndex)
        .join('/')}" does not exist on the referenced material`
    };
  }

  const textureTransformPath = pointerSegments[extensionIndex + 2];
  if (textureTransformPath === 'texCoord') {
    return {
      reason:
        'animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update'
    };
  }
  if (
    textureTransformPath !== 'offset' &&
    textureTransformPath !== 'rotation' &&
    textureTransformPath !== 'scale'
  ) {
    return {
      reason: `KHR_texture_transform property "${textureTransformPath}" is not animatable; supported properties are offset, rotation, and scale`
    };
  }

  const componentSegment = pointerSegments[extensionIndex + 3];
  if (pointerSegments.length > extensionIndex + 4) {
    return {
      reason: `KHR_texture_transform.${textureTransformPath} does not support nested property paths`
    };
  }

  let component: number | undefined;
  if (componentSegment !== undefined) {
    component = Number(componentSegment);
    if (textureTransformPath === 'rotation') {
      return {
        reason: 'KHR_texture_transform.rotation does not support component indices'
      };
    }
    if (!Number.isInteger(component) || component < 0 || component > 1) {
      return {
        reason: `KHR_texture_transform.${textureTransformPath} component index "${componentSegment}" is invalid; only 0 and 1 are supported`
      };
    }
  }

  return {
    type: 'textureTransform',
    textureSlot: textureSlotDefinition.slot,
    path: textureTransformPath,
    component,
    baseTransform: resolveTextureTransform(textureInfo)
  };
}

function getNestedMaterialValue(
  material: Record<string, any>,
  pathSegments: string[]
): Record<string, any> | null {
  let value: any = material;
  for (const pathSegment of pathSegments) {
    value = value?.[pathSegment];
    if (!value) {
      return null;
    }
  }

  return value;
}

function splitJsonPointer(pointer: string): string[] {
  return pointer
    .slice(1)
    .split('/')
    .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function getUnsupportedMaterialPointerReason(pointerSegments: string[]): string {
  const extensionName = getPointerExtensionName(pointerSegments);
  if (extensionName) {
    const extensionSupport = getRegisteredGLTFExtensionSupport(extensionName);
    if (extensionSupport?.supportLevel === 'none') {
      return `${extensionName} is referenced by this pointer, but ${extensionSupport.comment
        .charAt(0)
        .toLowerCase()}${extensionSupport.comment.slice(1)}`;
    }
  }

  return `no runtime target exists for material property "${pointerSegments.join('/')}"`;
}

function getUnsupportedTextureTransformSlotReason(pointerSegments: string[]): string {
  const extensionName = getPointerExtensionName(pointerSegments);
  if (extensionName) {
    const extensionSupport = getRegisteredGLTFExtensionSupport(extensionName);
    if (extensionSupport?.supportLevel === 'none') {
      return `${extensionName} is referenced by this pointer, but ${extensionSupport.comment
        .charAt(0)
        .toLowerCase()}${extensionSupport.comment.slice(1)}`;
    }
  }

  return `texture-transform target "${pointerSegments.join('/')}" has no runtime texture-slot mapping`;
}

function getPointerExtensionName(pointerSegments: string[]): string | null {
  const extensionIndex = pointerSegments.indexOf('extensions');
  const extensionName = pointerSegments[extensionIndex + 1];
  return extensionIndex >= 0 && extensionName ? extensionName : null;
}

function warnUnsupportedAnimationPointer(pointer: string, reason: string): void {
  log.warn(`KHR_animation_pointer target ${pointer} will be skipped because ${reason}`)();
}

/** Converts a scalar accessor into a cached JavaScript number array. */
function accessorToJsArray1D(
  accessor: GLTFAccessorPostprocessed,
  accessorCache: Map<GLTFAccessorPostprocessed, number[]>
): number[] {
  if (accessorCache.has(accessor)) {
    return accessorCache.get(accessor)!;
  }

  const {typedArray: array, components} = accessorToTypedArray(accessor);
  assert(components === 1, 'accessorToJsArray1D must have exactly 1 component');
  const result = Array.from(array);

  accessorCache.set(accessor, result);
  return result;
}

/** Converts a scalar, vector, or matrix accessor into a cached JavaScript array-of-arrays. */
function accessorToJsArray2D(
  accessor: GLTFAccessorPostprocessed,
  accessorCache: Map<GLTFAccessorPostprocessed, number[][]>
): number[][] {
  if (accessorCache.has(accessor)) {
    return accessorCache.get(accessor)!;
  }

  const {typedArray: array, components} = accessorToTypedArray(accessor);
  assert(components >= 1, 'accessorToJsArray2D must have at least 1 component');

  const result = [];

  // Slice array
  for (let i = 0; i < array.length; i += components) {
    result.push(Array.from(array.slice(i, i + components)));
  }

  accessorCache.set(accessor, result);
  return result;
}

/** Throws when the supplied condition is false. */
function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
