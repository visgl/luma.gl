// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLTFNodePostprocessed} from '@loaders.gl/gltf';

export type GLTFAnimation = {
  name: string;
  channels: GLTFAnimationChannel[];
};

export type GLTFAnimationChannel = {
  path: 'translation' | 'rotation' | 'scale' | 'weights';
  sampler: GLTFAnimationSampler;
  target: GLTFNodePostprocessed;
};

export type GLTFAnimationSampler = {
  input: number[];
  interpolation: string;
  output: number[] | number[][];
};
