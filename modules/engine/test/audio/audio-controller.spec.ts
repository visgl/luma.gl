// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {AudioController, GroupNode} from '../../src';

test('engine audio plays a procedural source from resolved scene inputs', async () => {
  const context = new OfflineAudioContext(1, 1024, 48000);
  const controller = new AudioController({
    scene: new GroupNode(),
    audioContext: context,
    baseUrl: 'https://example.com/',
    emitterIndices: [0],
    definition: {
      audio: [],
      sources: [{gain: 0.5, graph: {oscillator: {type: 'sine', frequency: 440}}}],
      emitters: [{type: 'global', sources: [0]}]
    }
  });
  try {
    await controller.play();
    controller.update(new Matrix4());
    const result = await context.startRendering();
    expect(result.getChannelData(0).some(value => Math.abs(value) > 0.1)).toBe(true);
  } finally {
    controller.destroy();
  }
});
