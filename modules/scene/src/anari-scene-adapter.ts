// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  ConeGeometry,
  CylinderGeometry,
  Geometry,
  PlaneGeometry,
  SphereGeometry
} from '@luma.gl/engine';
import type {
  SceneCamera,
  SceneMaterial,
  SceneRenderOptions,
  SceneSurface
} from '@luma.gl/experimental';
import {
  type Light,
  type PBRMaterialBindings,
  type PBRMaterialUniforms,
  pbrMaterial
} from '@luma.gl/shadertools';
import {Matrix4, type NumberArray9} from '@math.gl/core';
import {
  ANARIArray,
  type ANARICamera,
  type ANARIFrame,
  type ANARIGeometry,
  ANARIGroup,
  type ANARIInstance,
  type ANARILight,
  type ANARIMaterial,
  type ANARISampler,
  type ANARISurface,
  type ANARIWorld
} from './anari-objects';
import type {ANARIGeometryParameters, ANARIVector3} from './anari-types';

type SurfacePlacement = {
  surface: ANARISurface;
  transform: readonly number[];
  instanceId: string;
  instance?: ANARIInstance;
};

type CachedGeometry = {
  version: number;
  structuralVersion: number;
  geometry: Geometry;
  parameters: Readonly<Partial<ANARIGeometryParameters>>;
  arrayVersions: ReadonlyMap<ANARIArray, number>;
};

type CachedAnalyticPrimitive = {type: 'sphere'; radius: number};

type CachedMaterial = {
  version: number;
  samplers: ReadonlyMap<ANARISampler, number>;
  material: SceneMaterial;
};

type CachedInstancePlacement = {
  instance: ANARIInstance;
  transforms: (readonly number[])[];
  transformIndex: number;
  instanceId: string;
};

type CachedSceneSurface = {
  source: ANARISurface;
  material: ANARIMaterial;
  surface: SceneSurface;
};

type CachedWorldScene = {
  world: ANARIWorld;
  surfaces: SceneSurface[];
  surfaceEntries: CachedSceneSurface[];
  lights: Light[];
  analyticPrimitives: Record<string, CachedAnalyticPrimitive>;
  ambientRadiance: number;
  observedCommitRevision: number;
  topologyObjectIds: Set<string>;
  lightObjectIds: Set<string>;
  instancePlacements: Map<string, CachedInstancePlacement[]>;
  materialSurfaces: Map<string, CachedSceneSurface[]>;
  samplerMaterials: Map<string, Set<ANARIMaterial>>;
  revisions: NonNullable<SceneRenderOptions['sceneRevisions']>;
};

type MaterialMapEnabledUniform =
  | 'baseColorMapEnabled'
  | 'normalMapEnabled'
  | 'metallicRoughnessMapEnabled'
  | 'emissiveMapEnabled'
  | 'occlusionMapEnabled'
  | 'specularColorMapEnabled'
  | 'specularIntensityMapEnabled'
  | 'transmissionMapEnabled'
  | 'clearcoatMapEnabled'
  | 'clearcoatRoughnessMapEnabled'
  | 'sheenColorMapEnabled'
  | 'sheenRoughnessMapEnabled'
  | 'iridescenceMapEnabled'
  | 'anisotropyMapEnabled'
  | 'bumpMapEnabled'
  | 'diffuseTransmissionMapEnabled'
  | 'diffuseTransmissionColorMapEnabled'
  | 'multiscatterColorMapEnabled';

type MaterialTextureSlot = {
  parameter:
    | 'baseColorTexture'
    | 'normalTexture'
    | 'bumpTexture'
    | 'metallicRoughnessTexture'
    | 'emissiveTexture'
    | 'occlusionTexture'
    | 'specularColorTexture'
    | 'specularIntensityTexture'
    | 'transmissionTexture'
    | 'diffuseTransmissionTexture'
    | 'diffuseTransmissionColorTexture'
    | 'thicknessTexture'
    | 'multiscatterColorTexture'
    | 'clearcoatTexture'
    | 'clearcoatRoughnessTexture'
    | 'clearcoatNormalTexture'
    | 'sheenColorTexture'
    | 'sheenRoughnessTexture'
    | 'iridescenceTexture'
    | 'iridescenceThicknessTexture'
    | 'anisotropyTexture';
  binding: keyof PBRMaterialBindings;
  enabled: MaterialMapEnabledUniform | null;
  textureCoordinateSet: Extract<keyof PBRMaterialUniforms, `${string}UVSet`>;
  transform: Extract<keyof PBRMaterialUniforms, `${string}UVTransform`>;
};

const IDENTITY_MATRIX = new Matrix4();
const IDENTITY_TEXTURE_TRANSFORM: Readonly<NumberArray9> = [1, 0, 0, 0, 1, 0, 0, 0, 1];

const MATERIAL_TEXTURE_SLOTS = [
  {
    parameter: 'baseColorTexture',
    binding: 'pbr_baseColorSampler',
    enabled: 'baseColorMapEnabled',
    textureCoordinateSet: 'baseColorUVSet',
    transform: 'baseColorUVTransform'
  },
  {
    parameter: 'normalTexture',
    binding: 'pbr_normalSampler',
    enabled: 'normalMapEnabled',
    textureCoordinateSet: 'normalUVSet',
    transform: 'normalUVTransform'
  },
  {
    parameter: 'metallicRoughnessTexture',
    binding: 'pbr_metallicRoughnessSampler',
    enabled: 'metallicRoughnessMapEnabled',
    textureCoordinateSet: 'metallicRoughnessUVSet',
    transform: 'metallicRoughnessUVTransform'
  },
  {
    parameter: 'emissiveTexture',
    binding: 'pbr_emissiveSampler',
    enabled: 'emissiveMapEnabled',
    textureCoordinateSet: 'emissiveUVSet',
    transform: 'emissiveUVTransform'
  },
  {
    parameter: 'occlusionTexture',
    binding: 'pbr_occlusionSampler',
    enabled: 'occlusionMapEnabled',
    textureCoordinateSet: 'occlusionUVSet',
    transform: 'occlusionUVTransform'
  },
  {
    parameter: 'specularColorTexture',
    binding: 'pbr_specularColorSampler',
    enabled: 'specularColorMapEnabled',
    textureCoordinateSet: 'specularColorUVSet',
    transform: 'specularColorUVTransform'
  },
  {
    parameter: 'specularIntensityTexture',
    binding: 'pbr_specularIntensitySampler',
    enabled: 'specularIntensityMapEnabled',
    textureCoordinateSet: 'specularIntensityUVSet',
    transform: 'specularIntensityUVTransform'
  },
  {
    parameter: 'transmissionTexture',
    binding: 'pbr_transmissionSampler',
    enabled: 'transmissionMapEnabled',
    textureCoordinateSet: 'transmissionUVSet',
    transform: 'transmissionUVTransform'
  },
  {
    parameter: 'thicknessTexture',
    binding: 'pbr_thicknessSampler',
    enabled: null,
    textureCoordinateSet: 'thicknessUVSet',
    transform: 'thicknessUVTransform'
  },
  {
    parameter: 'clearcoatTexture',
    binding: 'pbr_clearcoatSampler',
    enabled: 'clearcoatMapEnabled',
    textureCoordinateSet: 'clearcoatUVSet',
    transform: 'clearcoatUVTransform'
  },
  {
    parameter: 'clearcoatRoughnessTexture',
    binding: 'pbr_clearcoatRoughnessSampler',
    enabled: 'clearcoatRoughnessMapEnabled',
    textureCoordinateSet: 'clearcoatRoughnessUVSet',
    transform: 'clearcoatRoughnessUVTransform'
  },
  {
    parameter: 'clearcoatNormalTexture',
    binding: 'pbr_clearcoatNormalSampler',
    enabled: null,
    textureCoordinateSet: 'clearcoatNormalUVSet',
    transform: 'clearcoatNormalUVTransform'
  },
  {
    parameter: 'sheenColorTexture',
    binding: 'pbr_sheenColorSampler',
    enabled: 'sheenColorMapEnabled',
    textureCoordinateSet: 'sheenColorUVSet',
    transform: 'sheenColorUVTransform'
  },
  {
    parameter: 'sheenRoughnessTexture',
    binding: 'pbr_sheenRoughnessSampler',
    enabled: 'sheenRoughnessMapEnabled',
    textureCoordinateSet: 'sheenRoughnessUVSet',
    transform: 'sheenRoughnessUVTransform'
  },
  {
    parameter: 'iridescenceTexture',
    binding: 'pbr_iridescenceSampler',
    enabled: 'iridescenceMapEnabled',
    textureCoordinateSet: 'iridescenceUVSet',
    transform: 'iridescenceUVTransform'
  },
  {
    parameter: 'iridescenceThicknessTexture',
    binding: 'pbr_iridescenceThicknessSampler',
    enabled: null,
    textureCoordinateSet: 'iridescenceThicknessUVSet',
    transform: 'iridescenceThicknessUVTransform'
  },
  {
    parameter: 'anisotropyTexture',
    binding: 'pbr_anisotropySampler',
    enabled: 'anisotropyMapEnabled',
    textureCoordinateSet: 'anisotropyUVSet',
    transform: 'anisotropyUVTransform'
  },
  {
    parameter: 'bumpTexture',
    binding: 'pbr_bumpSampler',
    enabled: 'bumpMapEnabled',
    textureCoordinateSet: 'bumpUVSet',
    transform: 'bumpUVTransform'
  },
  {
    parameter: 'diffuseTransmissionTexture',
    binding: 'pbr_diffuseTransmissionSampler',
    enabled: 'diffuseTransmissionMapEnabled',
    textureCoordinateSet: 'diffuseTransmissionUVSet',
    transform: 'diffuseTransmissionUVTransform'
  },
  {
    parameter: 'diffuseTransmissionColorTexture',
    binding: 'pbr_diffuseTransmissionColorSampler',
    enabled: 'diffuseTransmissionColorMapEnabled',
    textureCoordinateSet: 'diffuseTransmissionColorUVSet',
    transform: 'diffuseTransmissionColorUVTransform'
  },
  {
    parameter: 'multiscatterColorTexture',
    binding: 'pbr_multiscatterColorSampler',
    enabled: 'multiscatterColorMapEnabled',
    textureCoordinateSet: 'multiscatterColorUVSet',
    transform: 'multiscatterColorUVTransform'
  }
] as const satisfies readonly MaterialTextureSlot[];

/** Converts committed ANARI descriptions into the shared engine scene contract. */
export class ANARISceneAdapter {
  private readonly geometries = new Map<ANARIGeometry, CachedGeometry>();
  private readonly materials = new Map<ANARIMaterial, CachedMaterial>();
  private readonly worlds = new Map<ANARIWorld, CachedWorldScene>();

  makeRenderOptions(frame: ANARIFrame): SceneRenderOptions | null {
    const world = frame.getParameter('world');
    const camera = frame.getParameter('camera');
    const renderer = frame.getParameter('renderer');
    if (!world || !camera || !renderer) {
      return null;
    }

    const [width, height] = getFrameSize(frame, frame.device.device);
    const ambientRadiance = renderer.getParameter('ambientRadiance') ?? 0.12;
    const toneMapMode = renderer.getParameter('toneMapMode');
    const outputColorSpace = renderer.getParameter('outputColorSpace');
    let cachedWorld = this.worlds.get(world);
    if (!cachedWorld) {
      cachedWorld = this.createCachedWorld(world, ambientRadiance);
      this.worlds.set(world, cachedWorld);
    } else {
      this.updateCachedWorld(cachedWorld, ambientRadiance);
    }
    return {
      id: frame.id,
      surfaces: cachedWorld.surfaces,
      sceneRevisions: {...cachedWorld.revisions},
      camera: makeSceneCamera(camera, width, height),
      lights: cachedWorld.lights,
      background: renderer.getParameter('background') || [0.015, 0.018, 0.038, 1],
      width,
      height,
      environment: renderer.getParameter('environment'),
      exposure: renderer.getParameter('exposure') ?? 1.35,
      ...(toneMapMode !== undefined ? {toneMapMode} : {}),
      ...(outputColorSpace !== undefined ? {outputColorSpace} : {}),
      fogColor: renderer.getParameter('fogColor') || [0.025, 0.035, 0.075],
      fogDensity: renderer.getParameter('fogDensity') ?? 0,
      renderMode:
        renderer.subtype === 'debugNormals'
          ? 'debugNormals'
          : renderer.subtype === 'debugDepth'
            ? 'debugDepth'
            : 'default'
    };
  }

  /** Returns cached analytic metadata without traversing the retained world a second time. */
  getAnalyticPrimitives(world: ANARIWorld): Readonly<Record<string, CachedAnalyticPrimitive>> {
    let cachedWorld = this.worlds.get(world);
    if (!cachedWorld) {
      cachedWorld = this.createCachedWorld(world, 0.12);
      this.worlds.set(world, cachedWorld);
    }
    return cachedWorld.analyticPrimitives;
  }

  destroy(): void {
    this.geometries.clear();
    this.materials.clear();
    this.worlds.clear();
  }

  private createCachedWorld(world: ANARIWorld, ambientRadiance: number): CachedWorldScene {
    const cachedWorld: CachedWorldScene = {
      world,
      surfaces: [],
      surfaceEntries: [],
      lights: [],
      analyticPrimitives: {},
      ambientRadiance,
      observedCommitRevision: world.device.getSceneCommitRevision(),
      topologyObjectIds: new Set(),
      lightObjectIds: new Set(),
      instancePlacements: new Map(),
      materialSurfaces: new Map(),
      samplerMaterials: new Map(),
      revisions: {identity: world.id, topology: 0, transforms: 0, materials: 0, lights: 0}
    };
    this.rebuildCachedWorld(cachedWorld, ambientRadiance);
    return cachedWorld;
  }

  private updateCachedWorld(cachedWorld: CachedWorldScene, ambientRadiance: number): void {
    const currentRevision = cachedWorld.world.device.getSceneCommitRevision();
    const ambientChanged = cachedWorld.ambientRadiance !== ambientRadiance;
    if (currentRevision === cachedWorld.observedCommitRevision && !ambientChanged) {
      return;
    }

    const commits = cachedWorld.world.device.getSceneCommitsSince(
      cachedWorld.observedCommitRevision
    );
    let topologyChanged = commits === null;
    let lightsChanged = ambientChanged || commits === null;
    let lightDependenciesNeedRefresh = commits === null;
    const changedInstanceIds = new Set<string>();
    const changedMaterials = new Set<ANARIMaterial>();

    for (const commit of commits ?? []) {
      if (
        commit.categories.includes('topology') &&
        cachedWorld.topologyObjectIds.has(commit.objectId)
      ) {
        topologyChanged = true;
      }
      if (commit.categories.includes('lights') && cachedWorld.lightObjectIds.has(commit.objectId)) {
        lightsChanged = true;
        if (commit.categories.includes('topology')) {
          lightDependenciesNeedRefresh = true;
        }
      }
      if (
        commit.categories.includes('transforms') &&
        cachedWorld.instancePlacements.has(commit.objectId)
      ) {
        changedInstanceIds.add(commit.objectId);
      }
      if (commit.categories.includes('materials')) {
        for (const surface of cachedWorld.materialSurfaces.get(commit.objectId) ?? []) {
          changedMaterials.add(surface.material);
        }
        for (const material of cachedWorld.samplerMaterials.get(commit.objectId) ?? []) {
          changedMaterials.add(material);
        }
      }
    }

    if (topologyChanged) {
      this.rebuildCachedWorld(cachedWorld, ambientRadiance);
      cachedWorld.revisions.topology++;
      cachedWorld.revisions.lights++;
      delete cachedWorld.revisions.dirtyInstanceIds;
      return;
    }

    if (changedInstanceIds.size > 0) {
      const dirtyInstanceIds = new Set<string>();
      for (const instanceId of changedInstanceIds) {
        for (const placement of cachedWorld.instancePlacements.get(instanceId) ?? []) {
          placement.transforms[placement.transformIndex] =
            placement.instance.getParameter('transform') || IDENTITY_MATRIX;
          dirtyInstanceIds.add(placement.instanceId);
        }
      }
      cachedWorld.revisions.transforms++;
      cachedWorld.revisions.dirtyInstanceIds = Array.from(dirtyInstanceIds);
    }

    if (changedMaterials.size > 0) {
      for (const material of changedMaterials) {
        const normalizedMaterial = this.getMaterial(material);
        for (const entry of cachedWorld.materialSurfaces.get(material.id) ?? []) {
          entry.surface.material = normalizedMaterial;
        }
      }
      this.updateMaterialDependencies(cachedWorld);
      cachedWorld.revisions.materials++;
    }

    if (lightsChanged) {
      cachedWorld.lights = collectSceneLights(cachedWorld.world, ambientRadiance);
      cachedWorld.ambientRadiance = ambientRadiance;
      cachedWorld.revisions.lights++;
      if (lightDependenciesNeedRefresh) {
        this.updateLightDependencies(cachedWorld);
      }
    }

    cachedWorld.observedCommitRevision = currentRevision;
  }

  private rebuildCachedWorld(cachedWorld: CachedWorldScene, ambientRadiance: number): void {
    cachedWorld.topologyObjectIds.clear();
    cachedWorld.lightObjectIds.clear();
    cachedWorld.instancePlacements.clear();
    cachedWorld.materialSurfaces.clear();
    cachedWorld.samplerMaterials.clear();
    cachedWorld.surfaceEntries = [];
    cachedWorld.analyticPrimitives = {};
    cachedWorld.surfaces = this.makeSceneSurfaces(cachedWorld);
    cachedWorld.lights = collectSceneLights(cachedWorld.world, ambientRadiance);
    this.updateLightDependencies(cachedWorld);
    cachedWorld.ambientRadiance = ambientRadiance;
    cachedWorld.observedCommitRevision = cachedWorld.world.device.getSceneCommitRevision();
  }

  private makeSceneSurfaces(cachedWorld: CachedWorldScene): SceneSurface[] {
    const placementsBySurface = new Map<ANARISurface, SurfacePlacement[]>();
    for (const placement of collectSurfacePlacements(cachedWorld.world, cachedWorld)) {
      const placements = placementsBySurface.get(placement.surface) || [];
      placements.push(placement);
      placementsBySurface.set(placement.surface, placements);
    }

    const sceneSurfaces: SceneSurface[] = [];
    for (const [surface, placements] of placementsBySurface) {
      const geometry = surface.getParameter('geometry');
      const material = surface.getParameter('material');
      if (!geometry || !material) {
        continue;
      }

      const engineGeometry = this.getGeometry(geometry);
      const cachedGeometry = this.geometries.get(geometry)!;
      const transforms = placements.map(placement => placement.transform);
      const sceneSurface: SceneSurface = {
        id: surface.id,
        geometry: engineGeometry,
        geometryVersion: cachedGeometry.structuralVersion,
        material: this.getMaterial(material),
        transforms,
        instanceIds: placements.map(placement => placement.instanceId),
        ...(surface.getParameter('skin') ? {skin: surface.getParameter('skin')} : {}),
        ...(geometry.getParameter('morphTargets')
          ? {
              morphTargets: geometry.getParameter('morphTargets'),
              morphWeights: geometry.getParameter('morphWeights') || []
            }
          : {})
      };
      sceneSurfaces.push(sceneSurface);
      cachedWorld.topologyObjectIds.add(surface.id);
      cachedWorld.topologyObjectIds.add(geometry.id);
      for (const parameter of Object.values(geometry.getParameters())) {
        if (parameter instanceof ANARIArray) {
          cachedWorld.topologyObjectIds.add(parameter.id);
        }
      }

      const entry: CachedSceneSurface = {source: surface, material, surface: sceneSurface};
      cachedWorld.surfaceEntries.push(entry);
      const materialSurfaces = cachedWorld.materialSurfaces.get(material.id) ?? [];
      materialSurfaces.push(entry);
      cachedWorld.materialSurfaces.set(material.id, materialSurfaces);

      if (geometry.subtype === 'sphere') {
        cachedWorld.analyticPrimitives[surface.id] = {
          type: 'sphere',
          radius: geometry.getParameter('radius') ?? 1
        };
      }

      for (const [transformIndex, placement] of placements.entries()) {
        if (!placement.instance) {
          continue;
        }
        const instancePlacements = cachedWorld.instancePlacements.get(placement.instance.id) ?? [];
        instancePlacements.push({
          instance: placement.instance,
          transforms,
          transformIndex,
          instanceId: placement.instanceId
        });
        cachedWorld.instancePlacements.set(placement.instance.id, instancePlacements);
      }
    }
    this.updateMaterialDependencies(cachedWorld);
    return sceneSurfaces;
  }

  private updateMaterialDependencies(cachedWorld: CachedWorldScene): void {
    cachedWorld.samplerMaterials.clear();
    for (const entry of cachedWorld.surfaceEntries) {
      const parameters = entry.material.getParameters();
      for (const slot of MATERIAL_TEXTURE_SLOTS) {
        const sampler = parameters[slot.parameter];
        if (!sampler) {
          continue;
        }
        const materials = cachedWorld.samplerMaterials.get(sampler.id) ?? new Set<ANARIMaterial>();
        materials.add(entry.material);
        cachedWorld.samplerMaterials.set(sampler.id, materials);
      }
    }
  }

  private updateLightDependencies(cachedWorld: CachedWorldScene): void {
    const {world} = cachedWorld;
    const parameters = world.getParameters();
    cachedWorld.lightObjectIds.clear();
    cachedWorld.lightObjectIds.add(world.id);

    if (parameters.light instanceof ANARIArray) {
      cachedWorld.lightObjectIds.add(parameters.light.id);
    }
    for (const light of resolveObjectArray(parameters.light, parameters.lights)) {
      cachedWorld.lightObjectIds.add(light.id);
    }

    if (parameters.instance instanceof ANARIArray) {
      cachedWorld.lightObjectIds.add(parameters.instance.id);
    }
    for (const instance of resolveObjectArray(parameters.instance, parameters.instances)) {
      cachedWorld.lightObjectIds.add(instance.id);
      const groupValue = instance.getParameter('group');
      if (groupValue instanceof ANARIArray) {
        cachedWorld.lightObjectIds.add(groupValue.id);
      }
      const groups =
        groupValue instanceof ANARIArray
          ? groupValue.data
          : Array.isArray(groupValue)
            ? groupValue
            : groupValue
              ? [groupValue]
              : [];
      for (const group of groups) {
        if (!(group instanceof ANARIGroup)) {
          continue;
        }
        cachedWorld.lightObjectIds.add(group.id);
        const groupParameters = group.getParameters();
        if (groupParameters.light instanceof ANARIArray) {
          cachedWorld.lightObjectIds.add(groupParameters.light.id);
        }
        for (const light of resolveObjectArray(groupParameters.light, groupParameters.lights)) {
          cachedWorld.lightObjectIds.add(light.id);
        }
      }
    }
  }

  private getMaterial(material: ANARIMaterial): SceneMaterial {
    const cachedMaterial = this.materials.get(material);
    if (
      cachedMaterial?.version === material.version &&
      Array.from(cachedMaterial.samplers).every(([sampler, version]) => sampler.version === version)
    ) {
      return cachedMaterial.material;
    }

    const samplers = new Map<ANARISampler, number>();
    const parameters = material.getParameters();
    for (const slot of MATERIAL_TEXTURE_SLOTS) {
      const sampler = parameters[slot.parameter];
      if (sampler) {
        samplers.set(sampler, sampler.version);
      }
    }
    const normalizedMaterial = makeSceneMaterial(material);
    this.materials.set(material, {
      version: material.version,
      samplers,
      material: normalizedMaterial
    });
    return normalizedMaterial;
  }

  private getGeometry(geometry: ANARIGeometry): Geometry {
    const cachedGeometry = this.geometries.get(geometry);
    const cachedArraysAreCurrent =
      cachedGeometry !== undefined &&
      Array.from(cachedGeometry.arrayVersions).every(
        ([array, version]) => array.version === version
      );
    if (cachedGeometry?.version === geometry.version && cachedArraysAreCurrent) {
      return cachedGeometry.geometry;
    }

    const parameters = geometry.getParameters();
    if (
      cachedGeometry &&
      cachedArraysAreCurrent &&
      areGeometryStructuresEqual(cachedGeometry.parameters, parameters)
    ) {
      cachedGeometry.version = geometry.version;
      cachedGeometry.parameters = parameters;
      return cachedGeometry.geometry;
    }

    const engineGeometry = makeEngineGeometry(geometry);
    const arrayVersions = new Map<ANARIArray, number>();
    for (const parameter of Object.values(parameters)) {
      if (parameter instanceof ANARIArray) {
        arrayVersions.set(parameter, parameter.version);
      }
    }
    this.geometries.set(geometry, {
      version: geometry.version,
      structuralVersion: Math.max(geometry.version, (cachedGeometry?.structuralVersion ?? 0) + 1),
      geometry: engineGeometry,
      parameters,
      arrayVersions
    });
    return engineGeometry;
  }
}

function areGeometryStructuresEqual(
  previous: Readonly<Partial<ANARIGeometryParameters>>,
  next: Readonly<Partial<ANARIGeometryParameters>>
): boolean {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  keys.delete('morphWeights');
  return Array.from(keys).every(key => {
    const parameterName = key as keyof ANARIGeometryParameters;
    return previous[parameterName] === next[parameterName];
  });
}

/** Maps an ANARI material handle into canonical shared PBR uniforms and bindings. */
export function makeSceneMaterial(material: ANARIMaterial): SceneMaterial {
  const parameters = material.getParameters();
  const color = parameters.baseColor || parameters.color || [0.8, 0.8, 0.8];
  const opacity = parameters.opacity ?? (color.length > 3 ? (color[3] ?? 1) : 1);
  const alphaMode = parameters.alphaMode
    ? parameters.alphaMode.toUpperCase()
    : opacity < 1
      ? 'BLEND'
      : 'OPAQUE';
  const uniforms: PBRMaterialUniforms = {
    ...pbrMaterial.defaultUniforms,
    unlit: parameters.unlit ?? false,
    baseColorFactor: [color[0], color[1], color[2], opacity],
    metallicRoughnessValues: [
      material.subtype === 'matte' ? 0 : (parameters.metallic ?? 0),
      material.subtype === 'matte' ? 0.92 : (parameters.roughness ?? 0.38)
    ],
    normalScale: parameters.normalScale ?? 1,
    occlusionStrength: parameters.occlusionStrength ?? 1,
    emissiveFactor: parameters.emissive || [0, 0, 0],
    emissiveStrength: parameters.emissiveStrength ?? 1,
    alphaCutoffEnabled: alphaMode === 'MASK',
    alphaCutoff: parameters.alphaCutoff ?? 0.5,
    specularColorFactor: parameters.specularColor || [1, 1, 1],
    specularIntensityFactor: parameters.specularIntensity ?? 1,
    ior: parameters.indexOfRefraction ?? 1.5,
    transmissionFactor: parameters.transmission ?? 0,
    diffuseTransmissionFactor: parameters.diffuseTransmission ?? 0,
    diffuseTransmissionColorFactor: parameters.diffuseTransmissionColor || [1, 1, 1],
    dispersion: parameters.dispersion ?? 0,
    thicknessFactor: parameters.thickness ?? 0,
    attenuationDistance: parameters.attenuationDistance ?? 1e9,
    attenuationColor: parameters.attenuationColor || [1, 1, 1],
    multiscatterColorFactor: parameters.multiscatterColor || [0, 0, 0],
    scatterAnisotropy: parameters.scatterAnisotropy ?? 0,
    clearcoatFactor: parameters.clearcoat ?? 0,
    clearcoatRoughnessFactor: parameters.clearcoatRoughness ?? 0.18,
    sheenColorFactor: parameters.sheenColor || [0, 0, 0],
    sheenRoughnessFactor: parameters.sheenRoughness ?? 0.5,
    iridescenceFactor: parameters.iridescence ?? 0,
    iridescenceIor: parameters.iridescenceIndexOfRefraction ?? 1.3,
    iridescenceThicknessRange: [
      parameters.iridescenceThicknessMinimum ?? 100,
      parameters.iridescenceThicknessMaximum ?? 400
    ],
    anisotropyStrength: parameters.anisotropyStrength ?? 0,
    anisotropyRotation: parameters.anisotropyRotation ?? 0,
    anisotropyDirection: parameters.anisotropyDirection || [1, 0],
    bumpFactor: parameters.bumpFactor ?? 1
  };
  const bindings: Partial<PBRMaterialBindings> = {};

  for (const slot of MATERIAL_TEXTURE_SLOTS) {
    const sampler = parameters[slot.parameter];
    if (!sampler) {
      continue;
    }
    const image = sampler.getParameter('image');
    if (!image) {
      continue;
    }

    bindings[slot.binding] = image;
    if (slot.enabled) {
      uniforms[slot.enabled] = true;
    }
    uniforms[slot.textureCoordinateSet] = sampler.getParameter('textureCoordinateSet') ?? 0;
    uniforms[slot.transform] = sampler.getParameter('transform') || IDENTITY_TEXTURE_TRANSFORM;
  }

  return {
    id: material.id,
    version: material.version,
    uniforms,
    bindings,
    alphaMode: alphaMode === 'MASK' ? 'MASK' : alphaMode === 'BLEND' ? 'BLEND' : 'OPAQUE',
    doubleSided: parameters.doubleSided ?? true
  };
}

export function getFrameSize(frame: ANARIFrame, device: Device): [number, number] {
  const size = frame.getParameter('size');
  if (size) {
    return [size[0], size[1]];
  }
  return device.getDefaultCanvasContext().getDrawingBufferSize();
}

function collectSurfacePlacements(
  world: ANARIWorld,
  cachedWorld?: CachedWorldScene
): SurfacePlacement[] {
  const placements: SurfacePlacement[] = [];
  const parameters = world.getParameters();
  cachedWorld?.topologyObjectIds.add(world.id);
  cachedWorld?.lightObjectIds.add(world.id);
  if (parameters.surface instanceof ANARIArray) {
    cachedWorld?.topologyObjectIds.add(parameters.surface.id);
  }
  if (parameters.instance instanceof ANARIArray) {
    cachedWorld?.topologyObjectIds.add(parameters.instance.id);
    cachedWorld?.lightObjectIds.add(parameters.instance.id);
  }
  if (parameters.light instanceof ANARIArray) {
    cachedWorld?.lightObjectIds.add(parameters.light.id);
  }
  for (const light of resolveObjectArray(parameters.light, parameters.lights)) {
    cachedWorld?.lightObjectIds.add(light.id);
  }
  const directSurfaceOccurrences = new Map<string, number>();
  for (const surface of resolveObjectArray(parameters.surface, parameters.surfaces)) {
    cachedWorld?.topologyObjectIds.add(surface.id);
    const occurrence = directSurfaceOccurrences.get(surface.id) || 0;
    directSurfaceOccurrences.set(surface.id, occurrence + 1);
    placements.push({
      surface,
      transform: IDENTITY_MATRIX,
      instanceId: occurrence === 0 ? surface.id : `${surface.id}:${occurrence}`
    });
  }

  const instancePlacementOccurrences = new Map<string, number>();
  for (const instance of resolveObjectArray(parameters.instance, parameters.instances)) {
    cachedWorld?.topologyObjectIds.add(instance.id);
    cachedWorld?.lightObjectIds.add(instance.id);
    collectInstancePlacements(instance, placements, cachedWorld, instancePlacementOccurrences);
  }
  return placements;
}

function collectInstancePlacements(
  instance: ANARIInstance,
  placements: SurfacePlacement[],
  cachedWorld: CachedWorldScene | undefined,
  placementOccurrences: Map<string, number>
): void {
  const parameters = instance.getParameters();
  if (parameters.group instanceof ANARIArray) {
    cachedWorld?.topologyObjectIds.add(parameters.group.id);
    cachedWorld?.lightObjectIds.add(parameters.group.id);
  }
  const groups =
    parameters.group instanceof ANARIArray
      ? parameters.group.data
      : Array.isArray(parameters.group)
        ? parameters.group
        : parameters.group
          ? [parameters.group]
          : [];
  for (const group of groups) {
    if (!(group instanceof ANARIGroup)) {
      continue;
    }
    cachedWorld?.topologyObjectIds.add(group.id);
    cachedWorld?.lightObjectIds.add(group.id);
    const groupParameters = group.getParameters();
    if (groupParameters.surface instanceof ANARIArray) {
      cachedWorld?.topologyObjectIds.add(groupParameters.surface.id);
    }
    if (groupParameters.light instanceof ANARIArray) {
      cachedWorld?.lightObjectIds.add(groupParameters.light.id);
    }
    for (const light of resolveObjectArray(groupParameters.light, groupParameters.lights)) {
      cachedWorld?.lightObjectIds.add(light.id);
    }
    for (const surface of resolveObjectArray(groupParameters.surface, groupParameters.surfaces)) {
      cachedWorld?.topologyObjectIds.add(surface.id);
      const placementId = `${instance.id}:${group.id}:${surface.id}`;
      const occurrence = placementOccurrences.get(placementId) || 0;
      placementOccurrences.set(placementId, occurrence + 1);
      placements.push({
        surface,
        transform: parameters.transform || IDENTITY_MATRIX,
        instanceId: occurrence === 0 ? placementId : `${placementId}:${occurrence}`,
        instance
      });
    }
  }
}

function resolveObjectArray<ObjectType extends ANARISurface | ANARIInstance | ANARILight>(
  canonicalValue: readonly ObjectType[] | ANARIArray | undefined,
  friendlyValue: readonly ObjectType[] | undefined
): ObjectType[] {
  const value = canonicalValue || friendlyValue || [];
  if (value instanceof ANARIArray) {
    const data = value.data;
    if (ArrayBuffer.isView(data)) {
      return [];
    }
    return data.filter(
      (item): item is ObjectType => typeof item === 'object' && item !== null && 'type' in item
    );
  }
  return Array.from(value);
}

function collectSceneLights(world: ANARIWorld, ambientRadiance: number): Light[] {
  const lights: Light[] = [{type: 'ambient', color: [1, 1, 1], intensity: ambientRadiance}];
  const parameters = world.getParameters();
  for (const light of resolveObjectArray(parameters.light, parameters.lights)) {
    addSceneLight(light, lights);
  }

  for (const instance of resolveObjectArray(parameters.instance, parameters.instances)) {
    const groupValue = instance.getParameter('group');
    const groups =
      groupValue instanceof ANARIArray
        ? groupValue.data
        : Array.isArray(groupValue)
          ? groupValue
          : groupValue
            ? [groupValue]
            : [];
    for (const group of groups) {
      if (!(group instanceof ANARIGroup)) {
        continue;
      }
      const groupParameters = group.getParameters();
      for (const light of resolveObjectArray(groupParameters.light, groupParameters.lights)) {
        addSceneLight(light, lights);
      }
    }
  }
  return lights;
}

function addSceneLight(light: ANARILight, lights: Light[]): void {
  const parameters = light.getParameters();
  const color = parameters.color || [1, 1, 1];
  switch (light.subtype) {
    case 'ambient':
      lights.push({
        type: 'ambient',
        color,
        intensity: parameters.radiance ?? parameters.intensity ?? 1
      });
      break;
    case 'directional':
      lights.push({
        type: 'directional',
        color,
        direction: parameters.direction || [0, -1, -1],
        intensity: parameters.irradiance ?? parameters.intensity ?? 1
      });
      break;
    case 'point':
      lights.push({
        type: 'point',
        color,
        position: parameters.position || [0, 0, 0],
        intensity: parameters.intensity ?? 1,
        attenuation: [1, 0, 0.025]
      });
      break;
    case 'spot':
      lights.push({
        type: 'spot',
        color,
        position: parameters.position || [0, 0, 0],
        direction: parameters.direction || [0, -1, 0],
        intensity: parameters.intensity ?? 1,
        attenuation: [1, 0, 0.018],
        innerConeAngle: parameters.falloffAngle ?? (parameters.openingAngle ?? 0.5) * 0.7,
        outerConeAngle: parameters.openingAngle ?? 0.5
      });
      break;
  }
}

function makeSceneCamera(camera: ANARICamera, width: number, height: number): SceneCamera {
  const parameters = camera.getParameters();
  const position = parameters.position || [0, 0, 5];
  const direction = parameters.direction || [0, 0, -1];
  const center: ANARIVector3 = [
    position[0] + direction[0],
    position[1] + direction[1],
    position[2] + direction[2]
  ];
  const aspect = parameters.aspect || width / Math.max(height, 1);
  const near = parameters.near ?? 0.05;
  const far = parameters.far ?? 500;
  const projectionMatrix =
    camera.subtype === 'orthographic'
      ? new Matrix4().ortho({
          left: -(parameters.height ?? 12) * aspect * 0.5,
          right: (parameters.height ?? 12) * aspect * 0.5,
          bottom: -(parameters.height ?? 12) * 0.5,
          top: (parameters.height ?? 12) * 0.5,
          near,
          far
        })
      : new Matrix4().perspective({fovy: parameters.fovy ?? Math.PI / 3, aspect, near, far});

  return {
    projectionMatrix,
    viewMatrix: new Matrix4().lookAt({eye: position, center, up: parameters.up || [0, 1, 0]}),
    position
  };
}

function makeEngineGeometry(geometry: ANARIGeometry): Geometry {
  const parameters = geometry.getParameters();
  const segments = parameters.segments ?? 32;
  let sourceGeometry: Geometry;
  switch (geometry.subtype) {
    case 'sphere':
      sourceGeometry = new SphereGeometry({
        radius: parameters.radius ?? 1,
        nlat: segments,
        nlong: segments * 2
      });
      break;
    case 'cylinder':
      sourceGeometry = new CylinderGeometry({
        radius: parameters.radius ?? 1,
        height: parameters.height ?? 1,
        nradial: segments,
        nvertical: 1,
        topCap: true,
        bottomCap: true
      });
      break;
    case 'cone':
      sourceGeometry = new ConeGeometry({
        radius: parameters.radius ?? 1,
        height: parameters.height ?? 1,
        nradial: segments,
        nvertical: 1,
        cap: true
      });
      break;
    case 'quad':
      sourceGeometry = new PlaneGeometry({
        type: 'x,z',
        xlen: parameters.width ?? 1,
        zlen: parameters.height ?? parameters.width ?? 1,
        flipCull: true
      });
      break;
    case 'triangle': {
      const positions = unwrapArray(parameters['vertex.position']);
      const normals = unwrapArray(parameters['vertex.normal']);
      const tangents = unwrapArray(parameters['vertex.tangent']);
      const joints = unwrapArray(parameters['vertex.joint']);
      const jointWeights = unwrapArray(parameters['vertex.weight']);
      const textureCoordinates = unwrapArray(parameters['vertex.attribute1']);
      const secondTextureCoordinates = unwrapArray(parameters['vertex.attribute2']);
      const indices = unwrapArray(parameters['primitive.index']);
      if (!(positions instanceof Float32Array)) {
        throw new Error('Triangle geometry requires vertex.position');
      }
      sourceGeometry = new Geometry({
        topology: 'triangle-list',
        attributes: {
          POSITION: {size: 3, value: positions},
          NORMAL: {
            size: 3,
            value: normals instanceof Float32Array ? normals : makeVertexNormals(positions)
          },
          ...(tangents instanceof Float32Array ? {TANGENT: {size: 4, value: tangents}} : {}),
          ...(joints instanceof Uint8Array ||
          joints instanceof Uint16Array ||
          joints instanceof Uint32Array
            ? {JOINTS_0: {size: 4, value: joints}}
            : {}),
          ...(jointWeights instanceof Float32Array
            ? {WEIGHTS_0: {size: 4, value: jointWeights}}
            : {}),
          TEXCOORD_0: {
            size: 2,
            value:
              textureCoordinates instanceof Float32Array
                ? textureCoordinates
                : new Float32Array((positions.length / 3) * 2)
          },
          ...(secondTextureCoordinates instanceof Float32Array
            ? {TEXCOORD_1: {size: 2, value: secondTextureCoordinates}}
            : {})
        },
        indices:
          indices instanceof Uint16Array || indices instanceof Uint32Array ? indices : undefined
      });
      break;
    }
  }

  const positions = sourceGeometry.attributes['POSITION']?.value;
  const vertexCount = positions ? positions.length / 3 : sourceGeometry.vertexCount;
  const attributes = unwrapArray(parameters['vertex.attribute0']);
  const vertexColors =
    attributes instanceof Float32Array ? attributes : new Float32Array(vertexCount * 3).fill(1);
  const colorSize = vertexColors.length === vertexCount * 4 ? 4 : 3;
  const textureCoordinates = sourceGeometry.attributes['TEXCOORD_0']?.value;

  return new Geometry({
    topology: sourceGeometry.topology || 'triangle-list',
    attributes: {
      ...sourceGeometry.attributes,
      COLOR_0: {size: colorSize, value: vertexColors},
      TEXCOORD_0: {
        size: 2,
        value:
          textureCoordinates instanceof Float32Array
            ? textureCoordinates
            : new Float32Array(vertexCount * 2)
      }
    },
    indices: sourceGeometry.indices
  });
}

function unwrapArray(value: unknown): unknown {
  return value instanceof ANARIArray ? value.data : value;
}

function makeVertexNormals(positions: Float32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let vertexIndex = 0; vertexIndex < positions.length; vertexIndex += 9) {
    const firstEdgeX = positions[vertexIndex + 3] - positions[vertexIndex];
    const firstEdgeY = positions[vertexIndex + 4] - positions[vertexIndex + 1];
    const firstEdgeZ = positions[vertexIndex + 5] - positions[vertexIndex + 2];
    const secondEdgeX = positions[vertexIndex + 6] - positions[vertexIndex];
    const secondEdgeY = positions[vertexIndex + 7] - positions[vertexIndex + 1];
    const secondEdgeZ = positions[vertexIndex + 8] - positions[vertexIndex + 2];
    const normalX = firstEdgeY * secondEdgeZ - firstEdgeZ * secondEdgeY;
    const normalY = firstEdgeZ * secondEdgeX - firstEdgeX * secondEdgeZ;
    const normalZ = firstEdgeX * secondEdgeY - firstEdgeY * secondEdgeX;
    const normalLength = Math.hypot(normalX, normalY, normalZ) || 1;
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      normals[vertexIndex + cornerIndex * 3] = normalX / normalLength;
      normals[vertexIndex + cornerIndex * 3 + 1] = normalY / normalLength;
      normals[vertexIndex + cornerIndex * 3 + 2] = normalZ / normalLength;
    }
  }
  return normals;
}
