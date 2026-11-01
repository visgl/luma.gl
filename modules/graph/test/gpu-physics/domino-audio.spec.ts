// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it, vi} from 'vitest';
import {DominoAudio} from '../../../../examples/experimental/gpu-rigid-body-world/domino-audio';
import type {GPURigidBodyContactEvent} from '../../src/gpu-physics';

it('ignores base support without consuming clacks for later domino impacts', async () => {
  const sourceStarts = vi.fn();
  const samples = new Float32Array(4410).fill(0.3);
  const buffer = {getChannelData: () => samples};
  const node = () => ({connect: vi.fn().mockReturnThis(), disconnect: vi.fn()});
  const decode = vi.fn(async () => buffer);
  class TestAudioContext {
    currentTime = 1;
    sampleRate = 44100;
    state = 'running';
    destination = {};
    resume = async () => {};
    close = async () => {};
    decodeAudioData = decode;
    createBuffer = () => buffer;
    createBufferSource = () => ({
      ...node(),
      buffer: null,
      start: sourceStarts,
      stop: vi.fn(),
      onended: null
    });
    createGain = () => ({
      ...node(),
      gain: {setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn()}
    });
    createBiquadFilter = () => ({...node(), type: '', frequency: {value: 0}, Q: {value: 0}});
  }
  vi.stubGlobal('AudioContext', TestAudioContext);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ok: true, arrayBuffer: async () => new ArrayBuffer(1)}))
  );
  const audio = new DominoAudio();
  const event = (first: number, second: number): GPURigidBodyContactEvent => ({
    sequence: 1,
    step: 1,
    phase: 'impact',
    bodies: [first, second],
    colliders: [first, second],
    point: [0, 0, 0],
    normal: [0, 0, 1],
    normalImpulse: 1
  });
  try {
    audio.enabled = true;
    audio.unlock();
    await vi.waitFor(() => expect(decode).toHaveBeenCalledTimes(3));
    audio.play([event(0, 1), event(0, 2), event(0, 3)]);
    expect(sourceStarts).not.toHaveBeenCalled();
    audio.play([event(1, 2)]);
    expect(sourceStarts).toHaveBeenCalledTimes(1);
    audio.play([event(1, 2), event(2, 3)]);
    expect(sourceStarts).toHaveBeenCalledTimes(2);
    audio.reset();
    audio.play([event(1, 2)]);
    expect(sourceStarts).toHaveBeenCalledTimes(3);
  } finally {
    audio.destroy();
    vi.unstubAllGlobals();
  }
});
