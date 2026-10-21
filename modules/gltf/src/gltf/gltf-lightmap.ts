// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {Matrix3} from '@math.gl/core';
import type {GLTFGPUInstancing} from './gltf-instancing';
import {
  getTextureTransformMatrix,
  resolveTextureCoordinateSet,
  resolveTextureTransform,
  type PBRTextureTransform
} from '../pbr/texture-transform';

/** Texture information from the pinned KHR_lightmap draft. RGB is linear irradiance. */
export type GLTFLightmapBinding = {
  lightmapTexture: {
    index: number;
    texCoord?: number;
    extensions?: {KHR_texture_transform?: Partial<PBRTextureTransform> & {texCoord?: number}};
  };
  intensity?: number;
};

export type GLTFNodeLightmapExtension = {
  lightmaps: (GLTFLightmapBinding & {primitive: number})[];
};

/** A node entry replaces the complete material binding; omitted fields use their own defaults. */
export function resolveGLTFLightmapBinding(options: {
  primitiveIndex: number;
  materialBinding?: GLTFLightmapBinding;
  nodeExtension?: GLTFNodeLightmapExtension;
}): GLTFLightmapBinding | undefined {
  return (
    options.nodeExtension?.lightmaps.find(
      binding => binding.primitive === options.primitiveIndex
    ) || options.materialBinding
  );
}

/** Validate node primitive indices before uploading GPU resources. */
export function validateGLTFNodeLightmaps(
  extension: GLTFNodeLightmapExtension,
  primitiveCount: number
): void {
  // Node bindings must be nonempty, unique, and reference primitives belonging to this mesh.
  assert(extension.lightmaps.length > 0);
  const primitiveIndices = new Set<number>();
  for (const binding of extension.lightmaps) {
    assert(
      Number.isInteger(binding.primitive) &&
        binding.primitive >= 0 &&
        binding.primitive < primitiveCount
    );
    assert(!primitiveIndices.has(binding.primitive));
    primitiveIndices.add(binding.primitive);
  }
}

/** Instance atlas placement follows binding placement: I * B * uv. */
export function resolveGLTFLightmapTransform(
  binding: GLTFLightmapBinding,
  instance: Partial<PBRTextureTransform> & {intensity?: number} = {}
): {
  textureIndex: number;
  texCoord: number;
  transform: Matrix3;
  intensity: number;
} {
  const materialIntensity = binding.intensity ?? 1;
  const instanceIntensity = instance.intensity ?? 1;
  // Each intensity must be finite and nonnegative, even if the other factor is zero.
  assert(Number.isFinite(materialIntensity) && materialIntensity >= 0);
  assert(Number.isFinite(instanceIntensity) && instanceIntensity >= 0);
  const instanceTransform = new Matrix3(
    getTextureTransformMatrix({
      offset: instance.offset ?? [0, 0],
      rotation: instance.rotation ?? 0,
      scale: instance.scale ?? [1, 1]
    })
  );
  const bindingTransform = getTextureTransformMatrix(
    resolveTextureTransform(binding.lightmapTexture)
  );
  return {
    textureIndex: binding.lightmapTexture.index,
    texCoord: resolveTextureCoordinateSet(binding.lightmapTexture),
    transform: instanceTransform.multiplyRight(bindingTransform),
    intensity: materialIntensity * instanceIntensity
  };
}

export type GLTFLightmapInstance = Partial<PBRTextureTransform> & {intensity?: number};

/** Decode the draft atlas attributes once, before constructing per-instance render bindings. */
export function getGLTFLightmapInstances(
  instancing: GLTFGPUInstancing
): GLTFLightmapInstance[] | null {
  const semantics = [
    '_LIGHTMAP_OFFSET',
    '_LIGHTMAP_SCALE',
    '_LIGHTMAP_ROTATION',
    '_LIGHTMAP_INTENSITY'
  ];
  if (!semantics.some(semantic => instancing.attributes[semantic])) return null;
  const componentCounts = [2, 2, 1, 1];
  for (const [semanticIndex, semantic] of semantics.entries()) {
    const attribute = instancing.attributes[semantic];
    if (!attribute) continue;
    // Draft atlas attributes are finite, unnormalized FLOAT accessors with matching counts.
    assert(attribute.value instanceof Float32Array && !attribute.normalized);
    assert(attribute.size === componentCounts[semanticIndex]);
    assert(attribute.count === instancing.matrices.length);
    assert(attribute.value.length === attribute.count * attribute.size);
    assert(
      attribute.value.every(
        value => Number.isFinite(value) && (semantic !== '_LIGHTMAP_INTENSITY' || value >= 0)
      )
    );
  }
  return instancing.matrices.map((_, instanceIndex) => {
    const offset = instancing.attributes['_LIGHTMAP_OFFSET']?.value as Float32Array | undefined;
    const scale = instancing.attributes['_LIGHTMAP_SCALE']?.value as Float32Array | undefined;
    const rotation = instancing.attributes['_LIGHTMAP_ROTATION']?.value as Float32Array | undefined;
    const intensity = instancing.attributes['_LIGHTMAP_INTENSITY']?.value as
      | Float32Array
      | undefined;
    return {
      offset: offset ? [offset[instanceIndex * 2], offset[instanceIndex * 2 + 1]] : [0, 0],
      scale: scale ? [scale[instanceIndex * 2], scale[instanceIndex * 2 + 1]] : [1, 1],
      rotation: rotation?.[instanceIndex] ?? 0,
      intensity: intensity?.[instanceIndex] ?? 1
    };
  });
}
