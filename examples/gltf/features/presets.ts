// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Only implemented presets appear here; proposal names alone do not imply support. */
export type GLTFFeature = 'billboard' | 'lightmap';

export const GLTF_FEATURE_PRESETS = {
  lightmap: {
    modelUrl:
      'https://raw.githubusercontent.com/bhouston/three.js/91de5714e5abaf1f7105f4f1c8858bed93171a25/examples/models/gltf/LightmappedCornellBox/LightmappedCornellBox.glb',
    allowLegacyYAxis: false
  },
  billboard: {
    modelUrl:
      'https://raw.githubusercontent.com/KhronosGroup/glTF-External-Reference/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/BillboardDemo/glTF/BillboardDemo.gltf',
    allowLegacyYAxis: true
  }
} as const satisfies Record<GLTFFeature, {modelUrl: string; allowLegacyYAxis: boolean}>;
