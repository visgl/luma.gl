// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {GroupNode, Geometry} from '@luma.gl/engine';
import {getPBRMaterialMapUniforms} from '@luma.gl/engine/lighting';
import {Matrix4, type NumericArray} from '@math.gl/core';
import {pbrMaterial, type Light} from '@luma.gl/shaders';
import type {ANARIDevice} from './anari-device';
import type {ANARIWorld, ANARIGeometry, ANARIMaterial} from './anari-objects';
import type {ANARIGeometryParameters, ANARIMaterialParameters} from './anari-types';
import {ANARISceneAdapter, MATERIAL_TEXTURE_SLOTS} from './anari-scene-adapter';
import {ScenegraphSurfaces} from './engine/scenegraph-surfaces';
import {SceneMeshNode} from './engine/scene-mesh-node';
import {getSceneAlphaMode, type SceneMaterial} from './engine/scene-renderer';

/** An explicit snapshot: CPU geometry is copied; material textures remain borrowed. */
export type ANARIScenegraphSnapshot = {
  scene: GroupNode;
  lights: readonly Light[];
};

/** Convert committed ANARI surfaces into PBR scenegraph leaves, preserving shared geometry/materials. */
export function makeScenegraphFromANARIWorld(world: ANARIWorld): ANARIScenegraphSnapshot {
  const adapter = new ANARISceneAdapter();
  try {
    const snapshot = adapter.getScene(world);
    if (snapshot.surfaces.some(surface => surface.skin || surface.morphTargets?.length))
      throw new Error('Bake skin and morph deformation before creating a scenegraph snapshot');
    const geometries = new Map<Geometry, Geometry>();
    const materials = new Map<SceneMaterial, SceneMaterial>();
    const children = snapshot.surfaces.flatMap(surface =>
      surface.transforms.map(
        (matrix, index) =>
          new SceneMeshNode({
            id: surface.instanceIds?.[index] ?? `${surface.id}-${index}`,
            geometry: copyGeometry(surface.geometry, geometries),
            material: copyMaterial(surface.material, materials),
            matrix: new Matrix4(matrix)
          })
      )
    );
    return {
      scene: new GroupNode({id: world.id, children}),
      lights: structuredClone(snapshot.lights)
    };
  } finally {
    adapter.destroy();
  }
}

/**
 * Snapshot a CPU-transform PBR scenegraph as committed ANARI objects.
 * Geometry arrays are independent; GPU texture resources are borrowed and never destroyed.
 * Node hierarchy is flattened into world-space instances with shared geometry/material handles.
 */
export function makeANARIWorldFromScenegraph(
  device: ANARIDevice,
  scene: GroupNode,
  lights: readonly Light[] = []
): ANARIWorld {
  const pending = [scene];
  const visited = new Set<object>();
  while (pending.length) {
    const group = pending.pop()!;
    if (visited.has(group)) throw new Error('Scenegraph conversion requires a tree');
    visited.add(group);
    if (group.transformSource)
      throw new Error('Snapshot GPU transforms before converting a scenegraph');
    for (const child of group.children) {
      if (child instanceof GroupNode) pending.push(child);
      else if (!(child instanceof SceneMeshNode))
        throw new Error(`Unsupported scenegraph node: ${child.id}`);
      else if (child.connection) throw new Error('Snapshot GPU connections before conversion');
    }
  }
  const adapter = new ScenegraphSurfaces();
  const geometries = new Map<Geometry, ANARIGeometry>();
  const materials = new Map<SceneMaterial, ANARIMaterial>();
  try {
    const instances = adapter.getSurfaces(scene).flatMap(surface => {
      if (surface.environment || surface.gpuTransforms)
        throw new Error('Local probes and GPU placements cannot be converted to ANARI instances');
      let geometry = geometries.get(surface.geometry);
      if (!geometry) {
        geometry = convertGeometry(device, surface.geometry);
        geometries.set(surface.geometry, geometry);
      }
      let material = materials.get(surface.material);
      if (!material) {
        material = convertMaterial(device, surface.material);
        materials.set(surface.material, material);
      }
      const group = device.newGroup({surfaces: [device.newSurface({geometry, material})]});
      return surface.transforms.map(transform =>
        device.newInstance({group, transform: Array.from(transform)})
      );
    });
    return device.newWorld({
      instances,
      lights: lights.map(light => {
        if (light.type === 'rect' || light.type === 'disk')
          throw new Error('Convert area lights to emissive geometry before exporting');
        return device.newLight(light.type, {
          color: copyVector3(light.color),
          intensity: light.intensity,
          ...(light.type === 'point' || light.type === 'spot'
            ? {
                position: copyVector3(light.position),
                attenuation: copyVector3(light.attenuation ?? [1, 0, 0])
              }
            : {}),
          ...('direction' in light ? {direction: copyVector3(light.direction)} : {}),
          ...(light.type === 'spot'
            ? {openingAngle: light.outerConeAngle, falloffAngle: light.innerConeAngle}
            : {})
        });
      })
    });
  } finally {
    adapter.destroy();
  }
}

function convertGeometry(device: ANARIDevice, geometry: Geometry): ANARIGeometry {
  if (geometry.topology !== 'triangle-list')
    throw new Error('ANARI scenegraph conversion requires triangle-list geometry');
  const semantics = {
    POSITION: 'vertex.position',
    NORMAL: 'vertex.normal',
    TANGENT: 'vertex.tangent',
    COLOR_0: 'vertex.attribute0',
    TEXCOORD_0: 'vertex.attribute1',
    TEXCOORD_1: 'vertex.attribute2'
  } as const;
  const parameters: ANARIGeometryParameters = {};
  for (const [semantic, attribute] of Object.entries(geometry.attributes)) {
    if (!(semantic in semantics)) throw new Error(`Unsupported geometry attribute: ${semantic}`);
    if (
      attribute.constant ||
      attribute.normalized ||
      attribute['byteStride'] ||
      attribute['byteOffset'] ||
      !(attribute.value instanceof Float32Array)
    )
      throw new Error(`Convert ${semantic} to packed Float32 vertex data before exporting`);
    const parameter = semantics[semantic as keyof typeof semantics];
    parameters[parameter] = attribute.value.slice();
  }
  if (!parameters['vertex.position']) throw new Error('Geometry requires POSITION');
  if (geometry.indices) {
    const indices = geometry.indices.value;
    if (!(indices instanceof Uint16Array || indices instanceof Uint32Array))
      throw new Error('Unsupported index storage');
    parameters['primitive.index'] = indices.slice(0, geometry.vertexCount);
  } else {
    for (const parameter of Object.values(semantics)) {
      const value = parameters[parameter];
      const semantic = Object.keys(semantics).find(
        key => semantics[key as keyof typeof semantics] === parameter
      )!;
      if (value instanceof Float32Array)
        parameters[parameter] = value.slice(
          0,
          geometry.vertexCount * geometry.attributes[semantic].size!
        );
    }
  }
  return device.newGeometry('triangle', parameters);
}

function convertMaterial(device: ANARIDevice, material: SceneMaterial): ANARIMaterial {
  const uniforms = {
    ...pbrMaterial.defaultUniforms,
    ...getPBRMaterialMapUniforms(material.bindings ?? {}),
    ...material.uniforms
  };
  const alphaMode = getSceneAlphaMode(material);
  if (Object.keys(material.defines ?? {}).length)
    throw new Error('Custom shader defines require an explicit ANARI material adapter');
  const color = uniforms.baseColorFactor;
  const parameters: ANARIMaterialParameters = {
    ...(color ? {baseColor: [color[0], color[1], color[2], color[3]]} : {}),
    metallic: uniforms.metallicRoughnessValues?.[0],
    roughness: uniforms.metallicRoughnessValues?.[1],
    alphaMode: alphaMode === 'MASK' ? 'mask' : alphaMode === 'BLEND' ? 'blend' : 'opaque',
    alphaCutoff: uniforms.alphaCutoff,
    doubleSided: material.doubleSided ?? false,
    unlit: uniforms.unlit,
    emissive: copyVector3(uniforms.emissiveFactor),
    emissiveStrength: uniforms.emissiveStrength,
    transmission: uniforms.transmissionFactor,
    indexOfRefraction: uniforms.ior,
    normalScale: uniforms.normalScale,
    occlusionStrength: uniforms.occlusionStrength,
    clearcoat: uniforms.clearcoatFactor,
    clearcoatRoughness: uniforms.clearcoatRoughnessFactor,
    specularColor: copyVector3(uniforms.specularColorFactor),
    specularIntensity: uniforms.specularIntensityFactor,
    thickness: uniforms.thicknessFactor,
    attenuationColor: copyVector3(uniforms.attenuationColor),
    attenuationDistance: uniforms.attenuationDistance,
    diffuseTransmission: uniforms.diffuseTransmissionFactor,
    diffuseTransmissionColor: copyVector3(uniforms.diffuseTransmissionColorFactor),
    dispersion: uniforms.dispersion,
    multiscatterColor: copyVector3(uniforms.multiscatterColorFactor),
    scatterAnisotropy: uniforms.scatterAnisotropy,
    sheenColor: copyVector3(uniforms.sheenColorFactor),
    sheenRoughness: uniforms.sheenRoughnessFactor,
    iridescence: uniforms.iridescenceFactor,
    iridescenceIndexOfRefraction: uniforms.iridescenceIor,
    iridescenceThicknessMinimum: uniforms.iridescenceThicknessRange?.[0],
    iridescenceThicknessMaximum: uniforms.iridescenceThicknessRange?.[1],
    anisotropyStrength: uniforms.anisotropyStrength,
    anisotropyRotation: uniforms.anisotropyRotation,
    anisotropyDirection: uniforms.anisotropyDirection
      ? [uniforms.anisotropyDirection[0], uniforms.anisotropyDirection[1]]
      : undefined,
    bumpFactor: uniforms.bumpFactor
  };
  for (const [binding, texture] of Object.entries(material.bindings ?? {})) {
    if (!texture) continue;
    const slot = MATERIAL_TEXTURE_SLOTS.find(candidate => candidate.binding === binding);
    if (!slot) throw new Error(`Unsupported ANARI texture binding: ${binding}`);
    if (slot.enabled && uniforms[slot.enabled] === false) continue;
    const coordinates = uniforms[slot.textureCoordinateSet];
    if (coordinates !== undefined && coordinates !== 0 && coordinates !== 1)
      throw new Error('ANARI supports UV sets zero and one');
    const transform = uniforms[slot.transform];
    parameters[slot.parameter] = device.newSampler('image2D', {
      image: texture,
      textureCoordinateSet: coordinates,
      transform: transform
        ? [
            transform[0],
            transform[1],
            transform[2],
            transform[3],
            transform[4],
            transform[5],
            transform[6],
            transform[7],
            transform[8]
          ]
        : undefined
    });
  }
  return device.newMaterial('physicallyBased', parameters);
}

function copyVector3(
  value: Readonly<NumericArray> | undefined
): [number, number, number] | undefined {
  return value ? [value[0], value[1], value[2]] : undefined;
}

function copyGeometry(source: Geometry, copies: Map<Geometry, Geometry>): Geometry {
  let copy = copies.get(source);
  if (!copy) {
    copy = new Geometry({
      topology: source.topology,
      vertexCount: source.vertexCount,
      attributes: Object.fromEntries(
        Object.entries(source.attributes).map(([name, attribute]) => [
          name,
          {...attribute, value: attribute.value.slice()}
        ])
      ),
      indices: source.indices ? {...source.indices, value: source.indices.value.slice()} : undefined
    });
    copies.set(source, copy);
  }
  return copy;
}

function copyMaterial(
  source: SceneMaterial,
  copies: Map<SceneMaterial, SceneMaterial>
): SceneMaterial {
  let copy = copies.get(source);
  if (!copy) {
    copy = {
      ...source,
      uniforms: structuredClone(source.uniforms),
      bindings: {...source.bindings},
      defines: {...source.defines}
    };
    copies.set(source, copy);
  }
  return copy;
}
