// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Matrix4} from '@math.gl/core/matrix';
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

test('engine audio copies only active borrowed byte ranges and preserves source storage', async () => {
  const context = new OfflineAudioContext(1, 128, 48000);
  const storage = new Uint8Array([99, 1, 2, 3, 99]);
  const view = storage.subarray(1, 4);
  const decoded: number[][] = [];
  const decode = vi.spyOn(context, 'decodeAudioData').mockImplementation(async bytes => {
    decoded.push(Array.from(new Uint8Array(bytes)));
    // Browser decoding may detach the supplied storage; it must never detach caller bytes.
    structuredClone(bytes, {transfer: [bytes]});
    return context.createBuffer(1, 128, 48000);
  });
  const controller = new AudioController({
    scene: new GroupNode(),
    audioContext: context,
    baseUrl: 'https://example.com/',
    emitterIndices: [0],
    definition: {
      audio: [
        {
          get data(): ArrayBuffer {
            throw new Error('Inactive audio must not be read');
          }
        },
        {data: view}
      ],
      sources: [{audio: 1}],
      emitters: [{type: 'global', sources: [0]}]
    }
  });
  try {
    await controller.initialize();
    expect(decode).toHaveBeenCalledTimes(1);
    expect(decoded).toEqual([[1, 2, 3]]);
    expect(Array.from(storage)).toEqual([99, 1, 2, 3, 99]);
    expect(view.byteLength).toBe(3);
  } finally {
    controller.destroy();
    decode.mockRestore();
  }
});

test('stopping clears delayed samples and playback resumes through a fresh delay', async () => {
  const context = new OfflineAudioContext(1, 8192, 48000);
  const controller = new AudioController({
    scene: new GroupNode(),
    audioContext: context,
    baseUrl: 'https://example.com/',
    emitterIndices: [0],
    definition: {
      audio: [],
      sources: [{graph: {oscillator: {type: 'sine', frequency: 440}}}],
      emitters: [{type: 'global', sources: [0]}]
    },
    graphs: [
      {
        nodes: [
          {kind: 'delay', params: {delayTime: 0.05}},
          {kind: 'gain', params: {gain: 1}}
        ],
        connections: [{from: {node: 0}, to: {node: 1}}],
        inputs: [{source: 0, node: 0}],
        outputs: [{node: 1, emitter: 0}]
      }
    ]
  });
  try {
    controller.setGraphGain(0, 1, 0.25);
    await controller.play();
    const pause = context.suspend(0.025);
    const rendering = context.startRendering();
    await pause;
    controller.stop();
    await controller.play({restart: false});
    await context.resume();

    const samples = (await rendering).getChannelData(0);
    expect(samples.slice(2400, 3500).every(value => Math.abs(value) < 1e-6)).toBe(true);
    expect(samples.slice(3800, 5000).some(value => Math.abs(value) > 0.2)).toBe(true);
    expect(samples.slice(3800, 5000).every(value => Math.abs(value) <= 0.251)).toBe(true);
  } finally {
    controller.destroy();
  }
});
