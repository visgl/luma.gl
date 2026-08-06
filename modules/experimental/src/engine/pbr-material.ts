// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {type Material, MaterialFactory, type TextureBindingSource} from '@luma.gl/engine';
import {
  type PBRMaterialBindings,
  type PBRMaterialUniforms,
  pbrMaterial
} from '@luma.gl/shadertools';

/** Concrete or deferred texture resources accepted by the shared PBR material factory. */
export type PBRMaterialResources = Record<string, Binding | TextureBindingSource>;

/** Typed material instance backed by the canonical shadertools PBR module. */
export type PBRMaterial = Material<{pbrMaterial: PBRMaterialUniforms}, PBRMaterialResources>;

/** Options used to create a reusable physically based material. */
export type CreatePBRMaterialOptions = {
  /** Optional application-provided material identifier. */
  id?: string;
  /** Canonical glTF-compatible physically based material uniforms. */
  uniforms?: PBRMaterialUniforms;
  /** Material-owned texture bindings; absent maps do not allocate fallback resources. */
  bindings?: Partial<PBRMaterialBindings> | PBRMaterialResources;
  /** Existing compatible factory reused across materials in the same scene. */
  factory?: MaterialFactory<{pbrMaterial: PBRMaterialUniforms}, PBRMaterialResources>;
};

/** Creates a material factory that owns the canonical PBR group-3 binding schema. */
export function createPBRMaterialFactory(
  device: Device
): MaterialFactory<{pbrMaterial: PBRMaterialUniforms}, PBRMaterialResources> {
  return new MaterialFactory(device, {modules: [pbrMaterial]});
}

/** Creates a typed shared PBR material without introducing a format-specific material runtime. */
export function createPBRMaterial(
  device: Device,
  options: CreatePBRMaterialOptions = {}
): PBRMaterial {
  const materialFactory = options.factory || createPBRMaterialFactory(device);
  const bindings: PBRMaterialResources = {};

  for (const [bindingName, binding] of Object.entries(options.bindings || {})) {
    if (binding && materialFactory.ownsBinding(bindingName)) {
      bindings[bindingName] = binding;
    }
  }

  const material = materialFactory.createMaterial({id: options.id, bindings});
  material.setProps({
    pbrMaterial: {
      ...getPBRMaterialMapUniforms(bindings),
      ...options.uniforms
    }
  });
  return material;
}

/** Returns texture-presence flags matching the canonical PBR shader bindings. */
export function getPBRMaterialMapUniforms(
  bindings: Partial<PBRMaterialBindings> | PBRMaterialResources
): Partial<PBRMaterialUniforms> {
  return {
    baseColorMapEnabled: Boolean(bindings.pbr_baseColorSampler),
    normalMapEnabled: Boolean(bindings.pbr_normalSampler),
    emissiveMapEnabled: Boolean(bindings.pbr_emissiveSampler),
    metallicRoughnessMapEnabled: Boolean(bindings.pbr_metallicRoughnessSampler),
    occlusionMapEnabled: Boolean(bindings.pbr_occlusionSampler),
    specularColorMapEnabled: Boolean(bindings.pbr_specularColorSampler),
    specularIntensityMapEnabled: Boolean(bindings.pbr_specularIntensitySampler),
    transmissionMapEnabled: Boolean(bindings.pbr_transmissionSampler),
    clearcoatMapEnabled: Boolean(bindings.pbr_clearcoatSampler),
    clearcoatRoughnessMapEnabled: Boolean(bindings.pbr_clearcoatRoughnessSampler),
    sheenColorMapEnabled: Boolean(bindings.pbr_sheenColorSampler),
    sheenRoughnessMapEnabled: Boolean(bindings.pbr_sheenRoughnessSampler),
    iridescenceMapEnabled: Boolean(bindings.pbr_iridescenceSampler),
    anisotropyMapEnabled: Boolean(bindings.pbr_anisotropySampler)
  };
}
