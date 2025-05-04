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
  sceneMap: Map<number, GroupNode>;
  animationMap: Map<number, any>;
};

export function createScenegraphsFromGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options?: ParseGLTFOptions
): ScenegraphsFromGLTF {
  const sceneMap = new Map();
  const animationMap = new Map();

  const scenes = parseGLTF(device, gltf, options, sceneMap);
  const animations = parseGLTFAnimations(gltf);
  const animator = new GLTFAnimator({animations});

  return {scenes, animator, sceneMap, animationMap};
}
