// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Only implemented presets appear here; graph/environment will be added with their runtimes. */
export type GLTFAudioFeature = 'emitter' | 'graph';

export const GLTF_AUDIO_PRESETS = {
  graph: {
    modelUrl:
      'https://raw.githubusercontent.com/rudybear/gltf-webgpu/188965dd2ea0a1492c39dedf69f8e75f730baf9a/examples/drum-kit/drum-kit.gltf'
  },
  emitter: {
    modelUrl:
      'https://raw.githubusercontent.com/omigroup/gltf-extensions/4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692/extensions/2.0/KHR_audio_emitter/examples/boom_box/boom_box.gltf'
  }
} as const satisfies Record<GLTFAudioFeature, {modelUrl: string}>;
