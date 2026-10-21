// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  GLTFAudioReverbBus,
  createParametricAudioResponse
} from '../../src/gltf/gltf-audio-environment';

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

test('parametric small-room response preserves onset and decays across its authored RT60', () => {
  const context = new OfflineAudioContext(2, 48000, 48000);
  const response = createParametricAudioResponse(context, {
    preset: 'smallRoom',
    reflectionsGain: 0
  });
  const samples = response.getChannelData(0);
  expect(samples.slice(0, 240).every(value => value === 0)).toBe(true);
  const energy = (start: number, end: number) =>
    samples.slice(start, end).reduce((sum, value) => sum + value * value, 0);
  expect(energy(480, 2400)).toBeGreaterThan(energy(14400, 18000) * 1000);
  expect(response.duration).toBeCloseTo(0.405, 3);
});
