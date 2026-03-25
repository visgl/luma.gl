// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix3} from '@math.gl/core';

export type PBRTextureTransformSlot =
  | 'baseColor'
  | 'metallicRoughness'
  | 'normal'
  | 'occlusion'
  | 'emissive'
  | 'specularColor'
  | 'specularIntensity'
  | 'transmission'
  | 'thickness'
  | 'clearcoat'
  | 'clearcoatRoughness'
  | 'clearcoatNormal'
  | 'sheenColor'
  | 'sheenRoughness'
  | 'iridescence'
  | 'iridescenceThickness'
  | 'anisotropy';

export type PBRTextureTransformPath = 'offset' | 'rotation' | 'scale';

export type PBRTextureTransform = {
  offset: [number, number];
  rotation: number;
  scale: [number, number];
};

export type PBRTextureTransformSlotDefinition = {
  slot: PBRTextureTransformSlot;
  binding: string;
  displayName: string;
  pathSegments: string[];
  uvSetUniform: string;
  uvTransformUniform: string;
};

const IDENTITY_TEXTURE_TRANSFORM: PBRTextureTransform = {
  offset: [0, 0],
  rotation: 0,
  scale: [1, 1]
};

const TEXTURE_TRANSFORM_SLOT_DEFINITIONS: PBRTextureTransformSlotDefinition[] = [
  createTextureTransformSlotDefinition('baseColor', 'pbr_baseColorSampler', 'baseColorTexture', [
    'pbrMetallicRoughness',
    'baseColorTexture'
  ]),
  createTextureTransformSlotDefinition(
    'metallicRoughness',
    'pbr_metallicRoughnessSampler',
    'metallicRoughnessTexture',
    ['pbrMetallicRoughness', 'metallicRoughnessTexture']
  ),
  createTextureTransformSlotDefinition('normal', 'pbr_normalSampler', 'normalTexture', [
    'normalTexture'
  ]),
  createTextureTransformSlotDefinition('occlusion', 'pbr_occlusionSampler', 'occlusionTexture', [
    'occlusionTexture'
  ]),
  createTextureTransformSlotDefinition('emissive', 'pbr_emissiveSampler', 'emissiveTexture', [
    'emissiveTexture'
  ]),
  createTextureTransformSlotDefinition(
    'specularColor',
    'pbr_specularColorSampler',
    'KHR_materials_specular.specularColorTexture',
    ['extensions', 'KHR_materials_specular', 'specularColorTexture']
  ),
  createTextureTransformSlotDefinition(
    'specularIntensity',
    'pbr_specularIntensitySampler',
    'KHR_materials_specular.specularTexture',
    ['extensions', 'KHR_materials_specular', 'specularTexture']
  ),
  createTextureTransformSlotDefinition(
    'transmission',
    'pbr_transmissionSampler',
    'KHR_materials_transmission.transmissionTexture',
    ['extensions', 'KHR_materials_transmission', 'transmissionTexture']
  ),
  createTextureTransformSlotDefinition(
    'thickness',
    'pbr_thicknessSampler',
    'KHR_materials_volume.thicknessTexture',
    ['extensions', 'KHR_materials_volume', 'thicknessTexture']
  ),
  createTextureTransformSlotDefinition(
    'clearcoat',
    'pbr_clearcoatSampler',
    'KHR_materials_clearcoat.clearcoatTexture',
    ['extensions', 'KHR_materials_clearcoat', 'clearcoatTexture']
  ),
  createTextureTransformSlotDefinition(
    'clearcoatRoughness',
    'pbr_clearcoatRoughnessSampler',
    'KHR_materials_clearcoat.clearcoatRoughnessTexture',
    ['extensions', 'KHR_materials_clearcoat', 'clearcoatRoughnessTexture']
  ),
  createTextureTransformSlotDefinition(
    'clearcoatNormal',
    'pbr_clearcoatNormalSampler',
    'KHR_materials_clearcoat.clearcoatNormalTexture',
    ['extensions', 'KHR_materials_clearcoat', 'clearcoatNormalTexture']
  ),
  createTextureTransformSlotDefinition(
    'sheenColor',
    'pbr_sheenColorSampler',
    'KHR_materials_sheen.sheenColorTexture',
    ['extensions', 'KHR_materials_sheen', 'sheenColorTexture']
  ),
  createTextureTransformSlotDefinition(
    'sheenRoughness',
    'pbr_sheenRoughnessSampler',
    'KHR_materials_sheen.sheenRoughnessTexture',
    ['extensions', 'KHR_materials_sheen', 'sheenRoughnessTexture']
  ),
  createTextureTransformSlotDefinition(
    'iridescence',
    'pbr_iridescenceSampler',
    'KHR_materials_iridescence.iridescenceTexture',
    ['extensions', 'KHR_materials_iridescence', 'iridescenceTexture']
  ),
  createTextureTransformSlotDefinition(
    'iridescenceThickness',
    'pbr_iridescenceThicknessSampler',
    'KHR_materials_iridescence.iridescenceThicknessTexture',
    ['extensions', 'KHR_materials_iridescence', 'iridescenceThicknessTexture']
  ),
  createTextureTransformSlotDefinition(
    'anisotropy',
    'pbr_anisotropySampler',
    'KHR_materials_anisotropy.anisotropyTexture',
    ['extensions', 'KHR_materials_anisotropy', 'anisotropyTexture']
  )
];

const TEXTURE_TRANSFORM_SLOT_DEFINITION_MAP = new Map(
  TEXTURE_TRANSFORM_SLOT_DEFINITIONS.map(definition => [definition.slot, definition])
);

function createTextureTransformSlotDefinition(
  slot: PBRTextureTransformSlot,
  binding: string,
  displayName: string,
  pathSegments: string[]
): PBRTextureTransformSlotDefinition {
  return {
    slot,
    binding,
    displayName,
    pathSegments,
    uvSetUniform: `${slot}UVSet`,
    uvTransformUniform: `${slot}UVTransform`
  };
}

export function getTextureTransformSlotDefinitions(): PBRTextureTransformSlotDefinition[] {
  return TEXTURE_TRANSFORM_SLOT_DEFINITIONS;
}

export function getTextureTransformSlotDefinition(
  slot: PBRTextureTransformSlot
): PBRTextureTransformSlotDefinition {
  const definition = TEXTURE_TRANSFORM_SLOT_DEFINITION_MAP.get(slot);
  if (!definition) {
    throw new Error(`Unknown PBR texture transform slot ${slot}`);
  }
  return definition;
}

export function getDefaultTextureTransform(): PBRTextureTransform {
  return {
    offset: [...IDENTITY_TEXTURE_TRANSFORM.offset] as [number, number],
    rotation: IDENTITY_TEXTURE_TRANSFORM.rotation,
    scale: [...IDENTITY_TEXTURE_TRANSFORM.scale] as [number, number]
  };
}

export function resolveTextureTransform(
  textureInfo: Record<string, any> | undefined
): PBRTextureTransform {
  const extensionTextureTransform = textureInfo?.['extensions']?.['KHR_texture_transform'];
  return {
    offset: extensionTextureTransform?.offset
      ? [extensionTextureTransform.offset[0], extensionTextureTransform.offset[1]]
      : [0, 0],
    rotation: extensionTextureTransform?.rotation ?? 0,
    scale: extensionTextureTransform?.scale
      ? [extensionTextureTransform.scale[0], extensionTextureTransform.scale[1]]
      : [1, 1]
  };
}

export function resolveTextureCoordinateSet(textureInfo: Record<string, any> | undefined): number {
  const extensionTextureTransform = textureInfo?.['extensions']?.['KHR_texture_transform'];
  return extensionTextureTransform?.['texCoord'] ?? textureInfo?.['texCoord'] ?? 0;
}

export function resolveTextureTransformSlot(
  pointerSegments: string[]
): PBRTextureTransformSlotDefinition | null {
  return (
    TEXTURE_TRANSFORM_SLOT_DEFINITIONS.find(
      definition =>
        definition.pathSegments.length === pointerSegments.length &&
        definition.pathSegments.every((segment, index) => pointerSegments[index] === segment)
    ) || null
  );
}

export function getTextureTransformMatrix(transform: PBRTextureTransform): number[] {
  const translationMatrix = new Matrix3().set(
    1,
    0,
    0,
    0,
    1,
    0,
    transform.offset[0],
    transform.offset[1],
    1
  );
  const rotationMatrix = new Matrix3().set(
    Math.cos(transform.rotation),
    Math.sin(transform.rotation),
    0,
    -Math.sin(transform.rotation),
    Math.cos(transform.rotation),
    0,
    0,
    0,
    1
  );
  const scaleMatrix = new Matrix3().set(
    transform.scale[0],
    0,
    0,
    0,
    transform.scale[1],
    0,
    0,
    0,
    1
  );

  return Array.from(translationMatrix.multiplyRight(rotationMatrix).multiplyRight(scaleMatrix));
}

export function getTextureTransformDeltaMatrix(
  baseTransform: PBRTextureTransform,
  currentTransform: PBRTextureTransform
): number[] {
  const baseMatrix = new Matrix3(getTextureTransformMatrix(baseTransform));
  const currentMatrix = new Matrix3(getTextureTransformMatrix(currentTransform));
  const inverseBaseMatrix = new Matrix3(baseMatrix).invert();
  return Array.from(currentMatrix.multiplyRight(inverseBaseMatrix));
}
