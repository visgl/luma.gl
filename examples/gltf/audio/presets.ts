// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Only implemented presets appear here; graph/environment will be added with their runtimes. */
export type GLTFAudioFeature = 'emitter';

export const GLTF_AUDIO_PRESETS = {
  emitter: {
    modelUrl:
      'https://raw.githubusercontent.com/omigroup/gltf-extensions/4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692/extensions/2.0/KHR_audio_emitter/examples/boom_box/boom_box.gltf'
  }
} as const satisfies Record<GLTFAudioFeature, {modelUrl: string}>;
