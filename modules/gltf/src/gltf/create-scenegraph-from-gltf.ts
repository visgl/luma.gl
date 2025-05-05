// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {GLTFPostprocessed} from '@loaders.gl/gltf';
import {parseGLTF, type ParseGLTFOptions} from '../parsers/parse-gltf';
import {GLTFAnimator} from './gltf-animator';
import {parseGLTFAnimations} from '../parsers/parse-gltf-animations';

export type ScenegraphsFromGLTF = {
  scenes: GroupNode[];
  animator: GLTFAnimator;
  nodeMap: Map<number | string, GroupNode>;
  meshMap: Map<number | string, GroupNode>;
};

export function createScenegraphsFromGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options?: ParseGLTFOptions
): ScenegraphsFromGLTF {
  const {scenes, nodeMap, meshMap} = parseGLTF(device, gltf, options);
  const animations = parseGLTFAnimations(gltf, nodeMap);
  const animator = new GLTFAnimator({animations});

  return {scenes, animator, nodeMap, meshMap};
}
