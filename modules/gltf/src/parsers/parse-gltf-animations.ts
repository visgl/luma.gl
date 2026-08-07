// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GLTFAccessorPostprocessed, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {log} from '@luma.gl/core';
import {
  type GLTFAnimation,
  type GLTFAnimationChannel,
  GLTFAnimationPath,
  type GLTFAnimationSampler,
  type GLTFCameraAnimationChannel,
  type GLTFCameraAnimationProperty,
  type GLTFLightAnimationChannel,
  type GLTFLightAnimationProperty,
  type GLTFMaterialAnimationChannel,
  type GLTFMaterialAnimationProperty,
  type GLTFNodeAnimationChannel,
  type GLTFTextureTransformAnimationChannel
} from '../gltf/animations/animations';
import {getRegisteredGLTFExtensionSupport} from '../gltf/gltf-extension-support';
import {
  type PBRTextureTransformPath,
  resolveTextureTransform,
  resolveTextureTransformSlot
} from '../pbr/texture-transform';

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
    const samplerCache = new Map<string, GLTFAnimationSampler>();
    const channels: GLTFAnimationChannel[] = animation.channels.flatMap(({sampler, target}) => {
      const morphTargetCount = getMorphTargetCount(gltf, target);
      const samplerIdentifier = `${sampler}:${morphTargetCount ?? 0}`;
      let parsedSampler = samplerCache.get(samplerIdentifier);
      if (!parsedSampler) {
        const gltfSampler = animation.samplers[sampler];
        if (!gltfSampler) {
          throw new Error(`Cannot find animation sampler ${sampler}`);
        }
        const {input, interpolation = 'LINEAR', output} = gltfSampler;
        const keyframeTimes = accessorToJsArray1D(gltf.accessors[input], accessorCache1D);
        const keyframeValues = accessorToJsArray2D(gltf.accessors[output], accessorCache2D);
        parsedSampler = {
          input: keyframeTimes,
          interpolation,
          output:
            morphTargetCount !== undefined
              ? groupMorphTargetValues(
                  keyframeValues,
                  keyframeTimes.length,
                  interpolation,
                  morphTargetCount
                )
              : keyframeValues
        };
        samplerCache.set(samplerIdentifier, parsedSampler);
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

    case 'cameras':
      return parseCameraPointerAnimationChannel(gltf, pointerSegments, sampler, pointer);

    case 'extensions':
      if (pointerSegments[1] === 'KHR_lights_punctual') {
        return parseLightPointerAnimationChannel(gltf, pointerSegments, sampler, pointer);
      }
      break;

    default:
      break;
  }

  warnUnsupportedAnimationPointer(
    pointer,
    `top-level target "${pointerSegments[0]}" has no runtime animation mapping`
  );
  return null;
}

function parseCameraPointerAnimationChannel(
  gltf: GLTFPostprocessed,
  pointerSegments: string[],
  sampler: GLTFAnimationSampler,
  pointer: string
): GLTFCameraAnimationChannel | null {
  const cameraIndex = Number(pointerSegments[1]);
  const camera = gltf.cameras?.[cameraIndex];
  const projection = pointerSegments[2];
  const property = pointerSegments[3];
  const perspectiveProperties = ['aspectRatio', 'yfov', 'znear', 'zfar'];
  const orthographicProperties = ['xmag', 'ymag', 'znear', 'zfar'];

  if (
    pointerSegments.length !== 4 ||
    !Number.isInteger(cameraIndex) ||
    !camera ||
    (projection !== 'perspective' && projection !== 'orthographic') ||
    camera.type !== projection ||
    !(projection === 'perspective' ? perspectiveProperties : orthographicProperties).includes(
      property
    )
  ) {
    warnUnsupportedAnimationPointer(
      pointer,
      'camera pointers must target a supported projection property'
    );
    return null;
  }

  return {
    type: 'camera',
    sampler,
    pointer,
    targetCameraIndex: cameraIndex,
    projection,
    property: property as GLTFCameraAnimationProperty
  };
}

function parseLightPointerAnimationChannel(
  gltf: GLTFPostprocessed,
  pointerSegments: string[],
  sampler: GLTFAnimationSampler,
  pointer: string
): GLTFLightAnimationChannel | null {
  const lightIndex = Number(pointerSegments[3]);
  const lightDefinitions =
    (gltf as GLTFPostprocessed & {lights?: unknown[]}).lights ||
    gltf.extensions?.['KHR_lights_punctual']?.['lights'];
  const isSpotProperty = pointerSegments[4] === 'spot';
  const property = isSpotProperty ? pointerSegments[5] : pointerSegments[4];
  const component = !isSpotProperty && property === 'color' ? pointerSegments[5] : undefined;
  const allowedProperties: readonly GLTFLightAnimationProperty[] = [
    'color',
    'intensity',
    'range',
    'innerConeAngle',
    'outerConeAngle'
  ];
  const expectedLength = isSpotProperty || component !== undefined ? 6 : 5;

  if (
    pointerSegments[2] !== 'lights' ||
    pointerSegments.length !== expectedLength ||
    !Number.isInteger(lightIndex) ||
    !Array.isArray(lightDefinitions) ||
    !lightDefinitions[lightIndex] ||
    !allowedProperties.includes(property as GLTFLightAnimationProperty) ||
    (isSpotProperty && property !== 'innerConeAngle' && property !== 'outerConeAngle') ||
    (component !== undefined && (!/^[0-2]$/.test(component) || property !== 'color'))
  ) {
    warnUnsupportedAnimationPointer(
      pointer,
      'punctual-light pointers must target supported typed light properties'
    );
    return null;
  }

  return {
    type: 'light',
    sampler,
    pointer,
    targetLightIndex: lightIndex,
    property: property as GLTFLightAnimationProperty,
    ...(component === undefined ? {} : {component: Number(component)})
  };
}

function parseNodePointerAnimationChannel(
  gltf: GLTFPostprocessed,
  pointerSegments: string[],
  sampler: GLTFAnimationSampler,
  pointer: string
): GLTFNodeAnimationChannel | null {
  const isVisibilityPointer =
    pointerSegments.length === 5 &&
    pointerSegments[2] === 'extensions' &&
    pointerSegments[3] === 'KHR_node_visibility' &&
    pointerSegments[4] === 'visible';
  if (pointerSegments.length !== 3 && !isVisibilityPointer) {
    warnUnsupportedAnimationPointer(
      pointer,
      'node pointers must target transforms, morph weights, or KHR_node_visibility.visible'
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

  if (isVisibilityPointer && sampler.interpolation !== 'STEP') {
    warnUnsupportedAnimationPointer(
      pointer,
      'boolean visibility animation requires STEP interpolation'
    );
    return null;
  }

  const path = isVisibilityPointer ? 'visibility' : getNodeAnimationPath(pointerSegments[2]);
  if (!path) {
    warnUnsupportedAnimationPointer(
      pointer,
      `node property "${pointerSegments[2]}" has no runtime animation mapping`
    );
    return null;
  }
  return {
    type: 'node',
    sampler,
    targetNodeId: targetNode.id,
    path
  };
}

function getMorphTargetCount(
  gltf: GLTFPostprocessed,
  target: {node?: number; path: string; extensions?: Record<string, any>}
): number | undefined {
  let nodeIndex: number | undefined;
  if (target.path === 'weights') {
    nodeIndex = target.node;
  } else if (target.path === 'pointer') {
    const pointer = target.extensions?.['KHR_animation_pointer']?.pointer;
    const pointerMatch =
      typeof pointer === 'string' ? /^\/nodes\/(\d+)\/weights$/.exec(pointer) : null;
    if (!pointerMatch) {
      return undefined;
    }
    nodeIndex = Number(pointerMatch[1]);
  } else {
    return undefined;
  }

  const node = gltf.nodes[nodeIndex ?? 0] as
    | {
        weights?: readonly number[];
        mesh?: number | {weights?: readonly number[]; primitives?: any[]};
      }
    | undefined;
  const mesh = typeof node?.mesh === 'number' ? gltf.meshes[node.mesh] : node?.mesh;
  return (
    node?.weights?.length || mesh?.weights?.length || mesh?.primitives?.[0]?.targets?.length || 1
  );
}

function groupMorphTargetValues(
  values: number[][],
  keyframeCount: number,
  interpolation: string,
  declaredTargetCount: number
): number[][] {
  const valuesPerKeyframe = interpolation === 'CUBICSPLINE' ? 3 : 1;
  const inferredTargetCount = values.length / (Math.max(keyframeCount, 1) * valuesPerKeyframe);
  const targetCount =
    declaredTargetCount > 1
      ? declaredTargetCount
      : Number.isInteger(inferredTargetCount) && inferredTargetCount > 1
        ? inferredTargetCount
        : declaredTargetCount;
  if (targetCount <= 1) {
    return values;
  }

  const scalarValues = values.flat();
  const groupedValues: number[][] = [];
  for (let offset = 0; offset < scalarValues.length; offset += targetCount) {
    groupedValues.push(scalarValues.slice(offset, offset + targetCount));
  }
  return groupedValues;
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

    case 'extensions/EXT_materials_bump/bumpFactor':
      return material['extensions']?.['EXT_materials_bump']
        ? {type: 'material', property: 'bumpFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor':
      return material['extensions']?.['KHR_materials_diffuse_transmission']
        ? {type: 'material', property: 'diffuseTransmissionFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor':
      return material['extensions']?.['KHR_materials_diffuse_transmission']
        ? {type: 'material', property: 'diffuseTransmissionColorFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_volume_scatter/multiscatterColorFactor':
    case 'extensions/KHR_materials_volume_scatter/multiscatterColor':
      return material['extensions']?.['KHR_materials_volume_scatter']
        ? {type: 'material', property: 'multiscatterColorFactor'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_volume_scatter/scatterAnisotropy':
      return material['extensions']?.['KHR_materials_volume_scatter']
        ? {type: 'material', property: 'scatterAnisotropy'}
        : {reason: getUnsupportedMaterialPointerReason(pointerSegments)};

    case 'extensions/KHR_materials_dispersion/dispersion':
      return material['extensions']?.['KHR_materials_dispersion']
        ? {type: 'material', property: 'dispersion'}
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

  const {value: array, components} = accessor;
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

  const {value: array, components} = accessor;
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
