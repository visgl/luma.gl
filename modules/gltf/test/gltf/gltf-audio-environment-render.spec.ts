// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GLTFAudioReverbBus} from '../../src/gltf/gltf-audio-environment';

test('environment impulse response preserves authored delay and send/return gains', async () => {
  const context = new OfflineAudioContext(1, 2048, 48000);
  const response = context.createBuffer(1, 512, 48000);
  response.getChannelData(0)[240] = 0.5;
  const bus = new GLTFAudioReverbBus(context, response, context.destination, {
    mix: 0.4,
    normalize: false
  });
  const impulse = context.createBuffer(1, 1, 48000);
  impulse.getChannelData(0)[0] = 1;
  const source = context.createBufferSource();
  source.buffer = impulse;
  bus.connectSend(source, 0.5);
  source.start();
  const samples = (await context.startRendering()).getChannelData(0);
  expect(samples[240]).toBeCloseTo(0.1, 4);
  expect(samples.slice(0, 200).every(value => Math.abs(value) < 0.00001)).toBe(true);
  bus.destroy();
});
