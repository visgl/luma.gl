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
import {deepCopy} from '../utils/deep-copy';

export function createScenegraphsFromGLTF(
  device: Device,
  gltf: GLTFPostprocessed,
  options?: ParseGLTFOptions
): {
  scenes: GroupNode[];
  animator: GLTFAnimator;
  lights: Light[];
} {
  gltf = deepCopy(gltf);
  const scenes = parseGLTF(device, gltf, options);
  // Note: There is a nasty dependency on injected nodes in the glTF
  const animations = parseGLTFAnimations(gltf);
  const animator = new GLTFAnimator({animations});
  const lights = parseGLTFLights(gltf);
  return {scenes, animator, lights};
}
