// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';
import {
  GLTFAudioController,
  type GLTFAudioExtension,
  createScenegraphsFromGLTF
} from '@luma.gl/gltf';
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

async function makeScene(
  options: {
    legacy?: boolean;
    embedded?: boolean;
    global?: boolean;
    inactiveAudio?: boolean;
    positional?: GLTFAudioExtension['emitters'][number]['positional'];
  } = {}
) {
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
        emitters: [
          {
            type: options.global ? 'global' : 'positional',
            gain: 0.5,
            sources: [0],
            positional: options.positional
          }
        ]
      }
    }
  };
  if (options.inactiveAudio) {
    // Keep the selected payload at a nonzero index, with both inactive and unused clips.
    const extension = source.extensions.KHR_audio_emitter;
    extension.audio.unshift({uri: 'inactive-scene.mp3'});
    extension.audio.push({uri: 'unused.mp3'});
    extension.sources[0].audio = 1;
    extension.sources.push({...extension.sources[0], audio: 0});
    extension.emitters.push({type: 'positional', gain: 1, sources: [1], positional: undefined});
    source.nodes.push({extensions: {KHR_audio_emitter: {emitter: 1}}});
    source.scenes.push({nodes: [2]});
  }
  const gltf = postProcessGLTF(
    await parse(new TextEncoder().encode(JSON.stringify(source)).buffer, GLTFLoader)
  );
  return createScenegraphsFromGLTF(new NullDevice({}), gltf);
}

function energy(buffer: AudioBuffer, channel: number): number {
  return buffer.getChannelData(channel).reduce((total, value) => total + value * value, 0);
}

describe('GLTFAudioController browser audio rendering', () => {
  test('loads only selected-scene audio while preserving original payload indices', async () => {
    const scenegraphs = await makeScene({inactiveAudio: true});
    const context = new OfflineAudioContext(2, 4800, 48000);
    const requests: string[] = [];
    const audio = new GLTFAudioController({
      scenegraphs,
      audioContext: context,
      baseUrl: 'https://example.com/model.gltf',
      fetch: async (input, options) => {
        requests.push(String(input));
        if (!String(input).startsWith('data:')) throw new Error('Inactive clip is unavailable');
        return fetch(input, options);
      }
    });
    try {
      await audio.initialize();
      await audio.play();
      audio.update(new Matrix4());
      expect(requests).toHaveLength(1);
      const buffer = await context.startRendering();
      expect(energy(buffer, 0) + energy(buffer, 1)).toBeGreaterThan(0);
    } finally {
      audio.destroy();
      scenegraphs.destroy();
    }
  });

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

  test('renders linear and exponential attenuation and clamps finite maximum distances', async () => {
    for (const distanceModel of ['linear', 'exponential'] as const) {
      const energies: number[] = [];
      for (const distance of [2, 4, 8]) {
        const scenegraphs = await makeScene({
          positional: {
            distanceModel,
            refDistance: 1,
            maxDistance: 4,
            rolloffFactor: distanceModel === 'linear' ? 0.5 : 2
          }
        });
        const context = new OfflineAudioContext(2, 4800, 48000);
        const audio = new GLTFAudioController({
          scenegraphs,
          audioContext: context,
          baseUrl: 'https://example.com/model.gltf'
        });
        try {
          audio.update(new Matrix4().translate([0, 0, distance - 2]));
          await audio.play();
          const buffer = await context.startRendering();
          energies.push(energy(buffer, 0) + energy(buffer, 1));
        } finally {
          audio.destroy();
          scenegraphs.destroy();
        }
      }
      expect(energies[0]).toBeGreaterThan(0);
      expect(energies[1] / energies[0]).toBeCloseTo(distanceModel === 'linear' ? 0.36 : 0.0625, 2);
      expect(energies[2] / energies[1]).toBeCloseTo(1, 2);
    }
  });

  test('renders sound inside a directional cone and silence outside it', async () => {
    const energies: number[] = [];
    for (const listenerDepth of [-4, 0]) {
      const scenegraphs = await makeScene({
        positional: {
          shapeType: 'cone',
          coneInnerAngle: Math.PI / 3,
          coneOuterAngle: Math.PI / 2,
          coneOuterGain: 0
        }
      });
      const context = new OfflineAudioContext(2, 4800, 48000);
      const audio = new GLTFAudioController({
        scenegraphs,
        audioContext: context,
        baseUrl: 'https://example.com/model.gltf'
      });
      try {
        audio.update(new Matrix4().translate([0, 0, listenerDepth]));
        await audio.play();
        const buffer = await context.startRendering();
        energies.push(energy(buffer, 0) + energy(buffer, 1));
      } finally {
        audio.destroy();
        scenegraphs.destroy();
      }
    }
    expect(energies[0]).toBeGreaterThan(0);
    expect(energies[1]).toBe(0);
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

test('audio graph replaces bound emitter base routing without duplicating clip playback', async () => {
  const results: number[] = [];
  for (const graphGain of [1, 0.25]) {
    const scenegraphs = await makeScene({global: true});
    scenegraphs.gltf.extensions = {
      ...scenegraphs.gltf.extensions,
      KHR_audio_graph: {
        graphs: [
          {
            nodes: [{kind: 'gain', params: {gain: graphGain}}],
            connections: [],
            inputs: [{source: 0, node: 0}],
            outputs: [{node: 0, emitter: 0}]
          }
        ]
      }
    };
    const context = new OfflineAudioContext(2, 4800, 48000);
    const audio = new GLTFAudioController({
      scenegraphs,
      audioContext: context,
      baseUrl: 'https://example.com/model.gltf'
    });
    await audio.play();
    const rendered = await context.startRendering();
    results.push(energy(rendered, 0) + energy(rendered, 1));
    audio.destroy();
    scenegraphs.destroy();
  }
  expect(results[0]).toBeGreaterThan(0);
  expect(results[1] / results[0]).toBeCloseTo(0.0625);
});

test('audio graph procedural sources honor asset-clock start and duration without decoding clips', async () => {
  const scenegraphs = await makeScene({global: true});
  const extension = scenegraphs.gltf.extensions!['KHR_audio_emitter'] as GLTFAudioExtension;
  extension.audio = [];
  extension.sources = [
    {
      gain: 1,
      extensions: {
        KHR_audio_graph: {
          oscillator: {type: 'sine', frequency: 440},
          when: 0.01,
          duration: 0.02
        }
      }
    }
  ];
  scenegraphs.gltf.extensions!['KHR_audio_graph'] = {
    graphs: [
      {
        nodes: [{kind: 'gain', params: {gain: 1}}],
        connections: [],
        inputs: [{source: 0, node: 0}],
        outputs: [{node: 0, emitter: 0}]
      }
    ]
  };
  const context = new OfflineAudioContext(1, 4800, 48000);
  const audio = new GLTFAudioController({
    scenegraphs,
    audioContext: context,
    baseUrl: 'https://example.com/model.gltf',
    fetch: async () => {
      throw new Error('Procedural source must not fetch');
    }
  });
  await audio.play();
  const rendered = await context.startRendering();
  const samples = rendered.getChannelData(0);
  expect(samples.slice(0, 480).every(value => value === 0)).toBe(true);
  expect(samples.slice(500, 1400).some(value => Math.abs(value) > 0.1)).toBe(true);
  expect(samples.slice(1500).every(value => value === 0)).toBe(true);
  audio.destroy();
  scenegraphs.destroy();
});

test('environment listener binding applies authored gain independently of application volume', async () => {
  const energies: number[] = [];
  for (const listenerGain of [1, 0.5]) {
    const scenegraphs = await makeScene({global: true});
    scenegraphs.gltf.extensions ||= {};
    scenegraphs.gltf.extensions['KHR_audio_environment'] = {listeners: [{gain: listenerGain}]};
    scenegraphs.gltf.nodes[0].extensions ||= {};
    scenegraphs.gltf.nodes[0].extensions['KHR_audio_environment'] = {listener: 0};
    const context = new OfflineAudioContext(2, 4800, 48000);
    const audio = new GLTFAudioController({
      scenegraphs,
      audioContext: context,
      baseUrl: 'https://example.com/model.gltf'
    });
    audio.gain.gain.value = 0.8;
    await audio.play();
    audio.update(new Matrix4().translate([100, 0, 0]));
    expect(context.listener.positionX.value).toBeCloseTo(0);
    expect(audio.gain.gain.value).toBeCloseTo(0.8);
    const buffer = await context.startRendering();
    energies.push(energy(buffer, 0) + energy(buffer, 1));
    audio.destroy();
    scenegraphs.destroy();
  }
  expect(energies[1] / energies[0]).toBeCloseTo(0.25, 3);
});

test('environment controller loads a separate impulse response and routes a wet-only emitter', async () => {
  const scenegraphs = await makeScene({global: true});
  const extension = scenegraphs.gltf.extensions!['KHR_audio_emitter'] as GLTFAudioExtension;
  const response = makeWave();
  // A delayed unit impulse provides a measurable return without normalization.
  const view = new DataView(response.buffer);
  for (let index = 0; index < 4800; index++)
    view.setInt16(44 + index * 2, index === 480 ? 32767 : 0, true);
  extension.audio.push({uri: `data:audio/wav;base64,${btoa(String.fromCharCode(...response))}`});
  extension.emitters[0].extensions = {KHR_audio_environment: {directLevel: 0, reverbLevel: 0.5}};
  scenegraphs.gltf.extensions!['KHR_audio_environment'] = {
    environments: [{reverb: {type: 'impulseResponse', audio: 1, mix: 0.5, normalize: false}}]
  };
  scenegraphs.gltf.scenes[0].extensions ||= {};
  scenegraphs.gltf.scenes[0].extensions['KHR_audio_environment'] = {environment: 0};
  const context = new OfflineAudioContext(2, 4800, 48000);
  const audio = new GLTFAudioController({
    scenegraphs,
    audioContext: context,
    baseUrl: 'https://example.com/model.gltf'
  });
  await audio.play();
  audio.update(new Matrix4());
  const rendered = await context.startRendering();
  const samples = rendered.getChannelData(0);
  expect(samples.slice(0, 400).every(value => Math.abs(value) < 0.00001)).toBe(true);
  expect(energy(rendered, 0)).toBeGreaterThan(0.001);
  audio.destroy();
  scenegraphs.destroy();
});

test('audio graphs ignore inactive-scene sources and preserve authored graph indices', async () => {
  const scenegraphs = await makeScene({global: true, inactiveAudio: true});
  scenegraphs.gltf.extensions!['KHR_audio_graph'] = {
    graphs: [
      {
        nodes: [{kind: 'gain', params: {gain: 1}}],
        connections: [],
        inputs: [{source: 1, node: 0}],
        outputs: [{node: 0, emitter: 99}]
      },
      {
        nodes: [{kind: 'gain', params: {gain: 1}}],
        connections: [],
        inputs: [{source: 0, node: 0}],
        outputs: [{node: 0, emitter: 0}]
      }
    ]
  };
  const context = new OfflineAudioContext(2, 4800, 48000);
  const requests: string[] = [];
  const audio = new GLTFAudioController({
    scenegraphs,
    audioContext: context,
    baseUrl: 'https://example.com/model.gltf',
    fetch: async (input, options) => {
      requests.push(String(input));
      if (!String(input).startsWith('data:')) throw new Error('Inactive source fetched');
      return fetch(input, options);
    }
  });
  await audio.play();
  audio.setGraphGain(1, 0, 0.5);
  expect(requests).toHaveLength(1);
  const rendered = await context.startRendering();
  expect(energy(rendered, 0)).toBeGreaterThan(0);
  audio.destroy();
  scenegraphs.destroy();
});

test('restarting audio resets relative authored source timing', async () => {
  const scenegraphs = await makeScene({global: true});
  const extension = scenegraphs.gltf.extensions!['KHR_audio_emitter'] as GLTFAudioExtension;
  extension.audio = [];
  extension.sources = [
    {
      extensions: {
        KHR_audio_graph: {oscillator: {type: 'sine', frequency: 440}, when: 0.01, duration: 0.02}
      }
    }
  ];
  const context = new OfflineAudioContext(1, 4800, 48000);
  const audio = new GLTFAudioController({
    scenegraphs,
    audioContext: context,
    baseUrl: 'https://example.com/model.gltf'
  });
  await audio.play();
  const suspended = context.suspend(0.05);
  const rendering = context.startRendering();
  await suspended;
  await audio.play();
  await context.resume();
  const samples = (await rendering).getChannelData(0);
  expect(samples.slice(2520, 2800).every(value => Math.abs(value) < 0.00001)).toBe(true);
  expect(samples.slice(3200, 3500).some(value => Math.abs(value) > 0.01)).toBe(true);
  audio.destroy();
  scenegraphs.destroy();
});

test('environment controller crossfades zone sends and falls back outside the zone', async () => {
  const energies: number[] = [];
  for (const listenerPosition of [0, 1.5, 3]) {
    const scenegraphs = await makeScene({global: true});
    const extension = scenegraphs.gltf.extensions!['KHR_audio_emitter'] as GLTFAudioExtension;
    const response = makeWave();
    const view = new DataView(response.buffer);
    for (let index = 0; index < 4800; index++)
      view.setInt16(44 + index * 2, index === 0 ? 32767 : 0, true);
    extension.audio.push({uri: `data:audio/wav;base64,${btoa(String.fromCharCode(...response))}`});
    extension.emitters[0].extensions = {KHR_audio_environment: {directLevel: 0, reverbLevel: 1}};
    scenegraphs.gltf.extensions!['KHR_audio_environment'] = {
      environments: [
        {reverb: {type: 'impulseResponse', audio: 1, mix: 1, normalize: false}},
        {reverb: {type: 'impulseResponse', audio: 1, mix: 0, normalize: false}}
      ]
    };
    scenegraphs.gltf.scenes[0].extensions ||= {};
    scenegraphs.gltf.scenes[0].extensions['KHR_audio_environment'] = {environment: 1};
    scenegraphs.gltf.nodes[1].extensions!['KHR_audio_environment'] = {
      environment: 0,
      shape: {type: 'sphere', radius: 2},
      blendDistance: 1
    };
    const context = new OfflineAudioContext(2, 4800, 48000);
    const audio = new GLTFAudioController({
      scenegraphs,
      audioContext: context,
      baseUrl: 'https://example.com/model.gltf'
    });
    await audio.play();
    audio.update(new Matrix4().translate([listenerPosition, 0, -2]));
    const rendered = await context.startRendering();
    energies.push(energy(rendered, 0) + energy(rendered, 1));
    audio.destroy();
    scenegraphs.destroy();
  }
  expect(energies[0]).toBeGreaterThan(0.001);
  expect(energies[1] / energies[0]).toBeCloseTo(0.25, 3);
  expect(energies[2]).toBeCloseTo(0, 6);
});

test('source selection isolates drum hits for direct and graph routing', async () => {
  for (const graphRouting of [false, true]) {
    for (const selected of [false, true]) {
      const scenegraphs = await makeScene({global: true});
      if (graphRouting)
        scenegraphs.gltf.extensions = {
          ...scenegraphs.gltf.extensions,
          KHR_audio_graph: {
            graphs: [
              {
                nodes: [{kind: 'gain', params: {gain: 1}}],
                connections: [],
                inputs: [{source: 0, node: 0}],
                outputs: [{node: 0, emitter: 0}]
              }
            ]
          }
        };
      const context = new OfflineAudioContext(2, 4800, 48000);
      const audio = new GLTFAudioController({
        scenegraphs,
        audioContext: context,
        baseUrl: 'https://example.com/model.gltf'
      });
      await audio.play({sourceIndices: selected ? [0] : []});
      const rendered = await context.startRendering();
      const renderedEnergy = energy(rendered, 0) + energy(rendered, 1);
      if (selected) expect(renderedEnergy).toBeGreaterThan(0);
      else expect(renderedEnergy).toBe(0);
      audio.destroy();
      scenegraphs.destroy();
    }
  }
});
