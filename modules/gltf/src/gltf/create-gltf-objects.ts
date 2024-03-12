// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {GLTFInstantiator, GLTFInstantiatorOptions} from './gltf-instantiator';
import {GLTFAnimator} from './gltf-animator';

export function createScenegraphsFromGLTF(
  device: Device,
  gltf: any,
  options?: GLTFInstantiatorOptions
): {
  scenes: GroupNode[];
  animator: GLTFAnimator;
} {
  const instantiator = new GLTFInstantiator(device, options);
  const scenes = instantiator.instantiate(gltf);
  const animator = instantiator.createAnimator();
  return {scenes, animator};
}
