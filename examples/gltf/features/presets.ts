// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Only implemented presets appear here; proposal names alone do not imply support. */
export type GLTFFeature = 'billboard';

export const GLTF_FEATURE_PRESETS = {
  billboard: {
    modelUrl:
      'https://raw.githubusercontent.com/KhronosGroup/glTF-External-Reference/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/BillboardDemo/glTF/BillboardDemo.gltf',
    allowLegacyYAxis: true
  }
} as const satisfies Record<GLTFFeature, {modelUrl: string; allowLegacyYAxis: boolean}>;
