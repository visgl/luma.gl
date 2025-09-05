// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {GLTFPostprocessed} from '@loaders.gl/gltf';
import {Light} from '@luma.gl/shadertools';
import {parseGLTF, type ParseGLTFOptions} from '../parsers/parse-gltf';
import {parseGLTFLights} from '../parsers/parse-gltf-lights';
import {GLTFAnimator} from './gltf-animator';
import {parseGLTFAnimations} from '../parsers/parse-gltf-animations';

export function createScenegraphsFromGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options?: ParseGLTFOptions
): {
  scenes: GroupNode[];
  animator: GLTFAnimator;
  lights: Light[];

  gltfMeshIdToNodeMap: Map<string, GroupNode>;
  gltfNodeIndexToNodeMap: Map<number, GroupNode>;
  gltfNodeIdToNodeMap: Map<string, GroupNode>;

  gltf: GLTFPostprocessed;
} {
  const {scenes, gltfMeshIdToNodeMap, gltfNodeIdToNodeMap, gltfNodeIndexToNodeMap} = parseGLTF(
    device,
    gltf,
    options
  );
  
  const animations = parseGLTFAnimations(gltf, gltfNodeIndexToNodeMap);
  const animator = new GLTFAnimator({animations});
  const lights = parseGLTFLights(gltf);

  return {scenes, animator, lights, gltfMeshIdToNodeMap, gltfNodeIdToNodeMap, gltfNodeIndexToNodeMap, gltf};
}
