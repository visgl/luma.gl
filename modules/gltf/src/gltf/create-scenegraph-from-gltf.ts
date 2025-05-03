// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {GLTFPostprocessed} from '@loaders.gl/gltf';
import {parseGLTF, type ParseGLTFOptions} from '../parsers/parse-gltf';
import {GLTFAnimator} from './gltf-animator';
import {parseGLTFAnimations} from '../parsers/parse-gltf-animations';
import {deepCopy} from '../utils/deep-copy';

export function createScenegraphsFromGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options?: ParseGLTFOptions
): {
  scenes: GroupNode[];
  animator: GLTFAnimator;
} {
  gltf = deepCopy(gltf);
  const scenes = parseGLTF(device, gltf, options);
  // Note: There is a nasty dependency on injected nodes in the glTF
  const animations = parseGLTFAnimations(gltf);
  const animator = new GLTFAnimator({animations});
  return {scenes, animator};
}
