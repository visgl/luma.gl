// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SCATTER_DEMO_URL} from './scatter-demo';

export const AREA_LIGHT_SOURCE_URL =
  'https://raw.githubusercontent.com/mos9527/Foundation-Resources/3c8df40aece172360612d5a01177d91d6b4ab3e6/living-room-3/living-room-3.gltf';

/** Only implemented presets appear here; proposal names alone do not imply support. */
export type GLTFFeature = 'billboard' | 'lightmap' | 'area-lights' | 'scatter';

export const GLTF_FEATURE_PRESETS = {
  scatter: {modelUrl: SCATTER_DEMO_URL, allowLegacyYAxis: false},
  'area-lights': {
    modelUrl: AREA_LIGHT_SOURCE_URL,
    allowLegacyYAxis: false
  },
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
