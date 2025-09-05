// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GroupNode} from '@luma.gl/engine';

export type GLTFAnimation = {
  name: string;
  channels: GLTFAnimationChannel[];
};

export type GLTFAnimationPath = 'translation' | 'rotation' | 'scale' | 'weights';

export type GLTFAnimationChannel = {
  path: GLTFAnimationPath;
  sampler: GLTFAnimationSampler;
  target: GroupNode;
};

export type GLTFAnimationSampler = {
  input: number[];
  interpolation: string;
  output: number[][];
};
