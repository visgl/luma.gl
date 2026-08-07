// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {GroupNode, Material, ModelNode} from '@luma.gl/engine';
import {GLTFPostprocessed} from '@loaders.gl/gltf';
import {Light} from '@luma.gl/shadertools';
import {parseGLTF, type ParseGLTFOptions} from '../parsers/parse-gltf';
import {parseGLTFLights} from '../parsers/parse-gltf-lights';
import {GLTFAnimator} from './gltf-animator';
import {GLTFSkinController} from './gltf-skin';
import {parseGLTFAnimations} from '../parsers/parse-gltf-animations';
import type {GLTFAnimation} from './animations/animations';
import {
  assertSupportedGLTFExtensions,
  getGLTFExtensionSupport,
  type GLTFExtensionSupport
} from './gltf-extension-support';
import {GLTFMaterialVariants} from './gltf-material-variants';

export type GLTFScenegraphBounds = {
  /** World-space axis-aligned bounds for the scene or model. */
  bounds: [[number, number, number], [number, number, number]] | null;
  /** World-space center of the bounds. */
  center: [number, number, number];
  /** World-space bounds size on each axis. */
  size: [number, number, number];
  /** Half of the world-space bounds diagonal, clamped to a small practical minimum. */
  radius: number;
  /** Suggested orbit distance for a 60-degree field of view camera. */
  recommendedOrbitDistance: number;
};

/** Scenegraph bundle returned from a parsed glTF asset. */
export type GLTFScenegraphs = {
  /** Scene roots produced from the glTF scenes array. */
  scenes: GroupNode[];
  /** Materials aligned with the source glTF `materials` array. */
  materials: Material[];
  /** Runtime controller for source-authored `KHR_materials_variants` mappings. */
  variants: GLTFMaterialVariants;
  /** Independent runtime camera projections updated by typed glTF animation pointers. */
  cameras: GLTFPostprocessed['cameras'];
  /** Animation controller for glTF animations. */
  animator: GLTFAnimator;
  /** Parsed source animations, including supported material and texture-transform pointers. */
  animations: GLTFAnimation[];
  /** Parsed punctual lights from the asset. */
  lights: Light[];
  /** Extensions reported by the asset and whether luma.gl supports them. */
  extensionSupport: Map<string, GLTFExtensionSupport>;
  /** Camera-friendly bounds for each scene in `scenes`, in matching order. */
  sceneBounds: GLTFScenegraphBounds[];
  /** Combined camera-friendly bounds for the entire loaded asset. */
  modelBounds: GLTFScenegraphBounds;

  /** Map from glTF mesh ids to generated mesh group nodes. */
  gltfMeshIdToNodeMap: Map<string, GroupNode>;
  /** Map from glTF node indices to generated scenegraph nodes. */
  gltfNodeIndexToNodeMap: Map<number, GroupNode>;
  /** Map from glTF node ids to generated scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;

  /** Automatically updated source skin bindings and reusable mesh-local joint palettes. */
  skins: GLTFSkinController;

  /** Original post-processed glTF document. */
  gltf: GLTFPostprocessed;

  /** Releases every asset-owned model, material, buffer, and source-image texture exactly once. */
  destroy(): void;
};

/** Converts a post-processed glTF asset into luma.gl scenegraph nodes and animation helpers. */
export function createScenegraphsFromGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options?: ParseGLTFOptions
): GLTFScenegraphs {
  if (options?.strictExtensions) {
    assertSupportedGLTFExtensions(gltf);
  }

  const {
    scenes,
    materials,
    gltfMeshIdToNodeMap,
    gltfNodeIdToNodeMap,
    gltfNodeIndexToNodeMap,
    generatedTextures
  } = parseGLTF(device, gltf, options);

  const animations = parseGLTFAnimations(gltf);
  const sourceLights =
    (gltf as GLTFPostprocessed & {lights?: Record<string, any>[]}).lights ||
    (gltf.extensions?.['KHR_lights_punctual']?.['lights'] as Record<string, any>[] | undefined) ||
    [];
  const lightDefinitions = sourceLights.map(light => ({
    ...light,
    ...(Array.isArray(light['color']) ? {color: [...light['color']]} : {}),
    ...(light['spot'] ? {spot: {...light['spot']}} : {})
  }));
  const cameras: GLTFPostprocessed['cameras'] = (gltf.cameras || []).map(camera => {
    const runtimeCamera = {...camera};
    if (camera.perspective) {
      runtimeCamera.perspective = {...camera.perspective};
    }
    if (camera.orthographic) {
      runtimeCamera.orthographic = {...camera.orthographic};
    }
    return runtimeCamera;
  });
  const lightOptions = {
    useByteColors: options?.useByteColors ?? true,
    nodeVisibility: gltfNodeIdToNodeMap,
    lightDefinitions
  };
  const lights = parseGLTFLights(gltf, lightOptions);
  const refreshLights = () => {
    lights.splice(0, lights.length, ...parseGLTFLights(gltf, lightOptions));
  };
  const animator = new GLTFAnimator({
    onVisibilityChange: refreshLights,
    cameras,
    lightDefinitions,
    onLightChange: refreshLights,
    animations,
    gltfNodeIdToNodeMap,
    materials
  });
  const variants = new GLTFMaterialVariants(gltf, scenes);
  const extensionSupport = getGLTFExtensionSupport(gltf);
  const sceneBounds = scenes.map(scene => getScenegraphBounds(scene.getBounds()));
  const modelBounds = getCombinedScenegraphBounds(sceneBounds);
  const skins = new GLTFSkinController({gltf, scenes, gltfNodeIndexToNodeMap});
  animator.setUpdateHandler(() => skins.update());

  let destroyed = false;
  const destroy = (): void => {
    if (destroyed) {
      return;
    }
    destroyed = true;

    const groups = new Set<GroupNode>([
      ...scenes,
      ...gltfMeshIdToNodeMap.values(),
      ...gltfNodeIdToNodeMap.values()
    ]);
    const modelNodes = new Set<ModelNode>();
    const ownedMaterials = new Set<Material>(materials);
    for (const group of groups) {
      group.preorderTraversal(node => {
        if (node instanceof ModelNode) {
          modelNodes.add(node);
          if (node.model?.material) {
            ownedMaterials.add(node.model.material);
          }
        }
      });
    }

    for (const modelNode of modelNodes) {
      modelNode.destroy();
    }
    for (const group of groups) {
      group.destroy();
    }
    for (const material of ownedMaterials) {
      material.destroy();
    }
    for (const texture of generatedTextures) {
      texture.destroy();
    }
    generatedTextures.clear();
  };

  return {
    scenes,
    materials,
    variants,
    cameras,
    animator,
    animations,
    lights,
    extensionSupport,
    sceneBounds,
    modelBounds,
    gltfMeshIdToNodeMap,
    gltfNodeIdToNodeMap,
    gltfNodeIndexToNodeMap,
    skins,
    gltf,
    destroy
  };
}

function getScenegraphBounds(bounds: [number[], number[]] | null): GLTFScenegraphBounds {
  if (!bounds) {
    return {
      bounds: null,
      center: [0, 0, 0],
      size: [0, 0, 0],
      radius: 0.5,
      recommendedOrbitDistance: 1
    };
  }

  const normalizedBounds: [[number, number, number], [number, number, number]] = [
    [bounds[0][0], bounds[0][1], bounds[0][2]],
    [bounds[1][0], bounds[1][1], bounds[1][2]]
  ];
  const size: [number, number, number] = [
    normalizedBounds[1][0] - normalizedBounds[0][0],
    normalizedBounds[1][1] - normalizedBounds[0][1],
    normalizedBounds[1][2] - normalizedBounds[0][2]
  ];
  const center: [number, number, number] = [
    normalizedBounds[0][0] + size[0] * 0.5,
    normalizedBounds[0][1] + size[1] * 0.5,
    normalizedBounds[0][2] + size[2] * 0.5
  ];
  const maxHalfExtent = Math.max(size[0], size[1], size[2]) * 0.5;
  const radius = Math.max(0.5 * Math.hypot(size[0], size[1], size[2]), 0.001);

  return {
    bounds: normalizedBounds,
    center,
    size,
    radius,
    recommendedOrbitDistance: Math.max(
      (Math.max(maxHalfExtent, 0.001) / Math.tan(Math.PI / 6)) * 1.15,
      radius * 1.1
    )
  };
}

function getCombinedScenegraphBounds(sceneBounds: GLTFScenegraphBounds[]): GLTFScenegraphBounds {
  let combinedBounds: [[number, number, number], [number, number, number]] | null = null;

  for (const sceneBoundInfo of sceneBounds) {
    if (!sceneBoundInfo.bounds) {
      continue;
    }

    if (!combinedBounds) {
      combinedBounds = [
        [...sceneBoundInfo.bounds[0]] as [number, number, number],
        [...sceneBoundInfo.bounds[1]] as [number, number, number]
      ];
      continue;
    }

    for (let axis = 0; axis < 3; axis++) {
      combinedBounds[0][axis] = Math.min(combinedBounds[0][axis], sceneBoundInfo.bounds[0][axis]);
      combinedBounds[1][axis] = Math.max(combinedBounds[1][axis], sceneBoundInfo.bounds[1][axis]);
    }
  }

  return getScenegraphBounds(combinedBounds);
}
