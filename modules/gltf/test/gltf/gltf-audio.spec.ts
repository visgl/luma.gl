// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';
import {GLTFAudioController, createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';

function makeWave(): Uint8Array {
  const bytes = new Uint8Array(44 + 4800 * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) =>
    [...value].forEach((character, index) =>
      view.setUint8(offset + index, character.charCodeAt(0))
    );
  text(0, 'RIFF');
  view.setUint32(4, bytes.length - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 48000, true);
  view.setUint32(28, 96000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, bytes.length - 44, true);
  for (let index = 0; index < 4800; index++)
    view.setInt16(44 + index * 2, Math.sin((index * 2 * Math.PI * 440) / 48000) * 8192, true);
  return bytes;
}

async function makeScene(options: {legacy?: boolean; embedded?: boolean; global?: boolean} = {}) {
  const wave = makeWave();
  const uri = `data:audio/wav;base64,${btoa(String.fromCharCode(...wave))}`;
  const source = {
    asset: {version: '2.0'},
    meshes: [],
    materials: [],
    animations: [],
    scene: 0,
    scenes: [{nodes: [0]}],
    nodes: [
      {translation: [0, 0, -2], children: [1]},
      {
        extensions: {KHR_audio_emitter: options.legacy ? {emitters: [0]} : {emitter: 0}}
      }
    ],
    buffers: options.embedded ? [{byteLength: wave.length, uri}] : [],
    bufferViews: options.embedded ? [{buffer: 0, byteLength: wave.length}] : [],
    extensionsUsed: ['KHR_audio_emitter'],
    extensions: {
      KHR_audio_emitter: {
        audio: [options.embedded ? {bufferView: 0, mimeType: 'audio/wav'} : {uri}],
        sources: [
          {
            audio: 0,
            loop: true,
            gain: 0.5,
            ...(options.legacy ? {autoplay: true} : {autoPlay: true})
          }
        ],
        emitters: [{type: options.global ? 'global' : 'positional', gain: 0.5, sources: [0]}]
      }
    }
  };
  const gltf = postProcessGLTF(
    await parse(new TextEncoder().encode(JSON.stringify(source)).buffer, GLTFLoader)
  );
  return createScenegraphsFromGLTF(new NullDevice({}), gltf);
}

function energy(buffer: AudioBuffer, channel: number): number {
  return buffer.getChannelData(channel).reduce((total, value) => total + value * value, 0);
}

describe('GLTFAudioController browser audio rendering', () => {
  test('decodes embedded and external audio; attenuates nested emitters and supports legacy attachments', async () => {
    const results: number[] = [];
    for (const embedded of [false, true]) {
      const scenegraphs = await makeScene({embedded, legacy: embedded});
      const context = new OfflineAudioContext(2, 4800, 48000);
      const audio = new GLTFAudioController({
        scenegraphs,
        audioContext: context,
        baseUrl: 'https://example.com/model.gltf'
      });
      await audio.play({autoplayOnly: true});
      audio.update(new Matrix4().translate([0, 0, embedded ? 2 : 0]));
      const buffer = await context.startRendering();
      results.push(energy(buffer, 0) + energy(buffer, 1));
      audio.destroy();
      audio.destroy();
      scenegraphs.destroy();
    }
    expect(results[0]).toBeGreaterThan(0);
    // Doubling distance halves amplitude, hence quarters energy.
    expect(results[1] / results[0]).toBeCloseTo(0.25, 1);
  });

  test('listener rotation changes stereo balance', async () => {
    const balances: number[] = [];
    for (const yaw of [-Math.PI / 2, Math.PI / 2]) {
      const scenegraphs = await makeScene();
      const context = new OfflineAudioContext(2, 4800, 48000);
      const audio = new GLTFAudioController({
        scenegraphs,
        audioContext: context,
        baseUrl: 'https://example.com/model.gltf'
      });
      await audio.play();
      audio.update(new Matrix4().rotateY(yaw));
      const buffer = await context.startRendering();
      balances.push(energy(buffer, 0) - energy(buffer, 1));
      audio.destroy();
      scenegraphs.destroy();
    }
    expect(balances[0] * balances[1]).toBeLessThan(0);
  });

  test('stop and destroy prevent pending playback without closing a borrowed context', async () => {
    const scenegraphs = await makeScene({global: true});
    const context = new OfflineAudioContext(2, 4800, 48000);
    const audio = new GLTFAudioController({
      scenegraphs,
      audioContext: context,
      baseUrl: 'https://example.com/model.gltf'
    });
    const pending = audio.play();
    audio.stop();
    await pending;
    audio.destroy();
    expect(context.state).toBe('suspended');
    const buffer = await context.startRendering();
    expect(energy(buffer, 0) + energy(buffer, 1)).toBe(0);
    scenegraphs.destroy();
  });
});
