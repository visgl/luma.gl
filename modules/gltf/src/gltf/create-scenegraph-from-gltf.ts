// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {GroupNode, Material} from '@luma.gl/engine';
import {GLTFPostprocessed} from '@loaders.gl/gltf';
import {Light} from '@luma.gl/shadertools';
import {parseGLTF, type ParseGLTFOptions} from '../parsers/parse-gltf';
import {parseGLTFLights} from '../parsers/parse-gltf-lights';
import {GLTFAnimator} from './gltf-animator';
import {parseGLTFAnimations} from '../parsers/parse-gltf-animations';

/** Scenegraph bundle returned from a parsed glTF asset. */
export type GLTFScenegraphs = {
  /** Scene roots produced from the glTF scenes array. */
  scenes: GroupNode[];
  /** Materials aligned with the source glTF `materials` array. */
  materials: Material[];
  /** Animation controller for glTF animations. */
  animator: GLTFAnimator;
  /** Parsed punctual lights from the asset. */
  lights: Light[];

  /** Map from glTF mesh ids to generated mesh group nodes. */
  gltfMeshIdToNodeMap: Map<string, GroupNode>;
  /** Map from glTF node indices to generated scenegraph nodes. */
  gltfNodeIndexToNodeMap: Map<number, GroupNode>;
  /** Map from glTF node ids to generated scenegraph nodes. */
  gltfNodeIdToNodeMap: Map<string, GroupNode>;

  /** Original post-processed glTF document. */
  gltf: GLTFPostprocessed;
};

/** Converts a post-processed glTF asset into luma.gl scenegraph nodes and animation helpers. */
export function createScenegraphsFromGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options?: ParseGLTFOptions
): GLTFScenegraphs {
  const {scenes, materials, gltfMeshIdToNodeMap, gltfNodeIdToNodeMap, gltfNodeIndexToNodeMap} =
    parseGLTF(device, gltf, options);

  const animations = parseGLTFAnimations(gltf);
  const animator = new GLTFAnimator({animations, gltfNodeIdToNodeMap});
  const lights = parseGLTFLights(gltf);

  return {
    scenes,
    materials,
    animator,
    lights,
    gltfMeshIdToNodeMap,
    gltfNodeIdToNodeMap,
    gltfNodeIndexToNodeMap,
    gltf
  };
}
