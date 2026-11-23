// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AudioGraph} from '@luma.gl/engine';
import {expect, test} from 'vitest';

test('audio graph routes fan-in through processing into a borrowed emitter input', async () => {
  const context = new OfflineAudioContext(1, 512, 48000);
  const graph = new AudioGraph(
    {
      nodes: [
        {kind: 'gain', params: {gain: 0.25}},
        {kind: 'gain', params: {gain: 0.5}}
      ],
      connections: [{from: {node: 0}, to: {node: 1}}],
      inputs: [
        {source: 0, node: 0},
        {source: 1, node: 0}
      ],
      outputs: [{node: 1, emitter: 0}]
    },
    context,
    context.destination,
    () => [context.destination]
  );
  for (const index of [0, 1]) {
    const source = context.createConstantSource();
    source.offset.value = 1;
    graph.connectSource(index, source);
    source.start();
  }
  const rendered = await context.startRendering();
  expect(rendered.getChannelData(0)[256]).toBeCloseTo(0.25);
  graph.destroy();
});

test('audio graph rejects cycles and bypasses a processing node', async () => {
  const context = new OfflineAudioContext(1, 512, 48000);
  expect(
    () =>
      new AudioGraph(
        {
          nodes: [{kind: 'gain', params: {gain: 0}}],
          connections: [{from: {node: 0}, to: {node: 0}}]
        },
        context,
        context.destination,
        () => []
      )
  ).toThrow();
  const graph = new AudioGraph(
    {
      nodes: [{kind: 'gain', bypass: true, params: {gain: 0}}],
      connections: [],
      inputs: [{source: 0, node: 0}]
    },
    context,
    context.destination,
    () => []
  );
  const source = context.createConstantSource();
  source.offset.value = 0.3;
  graph.connectSource(0, source);
  source.start();
  const rendered = await context.startRendering();
  expect(rendered.getChannelData(0)[256]).toBeCloseTo(0.3);
  graph.destroy();
});

test('audio graph applies authored linear and custom gain transitions', async () => {
  for (const interpolation of ['linear', 'custom'] as const) {
    const context = new OfflineAudioContext(1, 4800, 48000);
    const graph = new AudioGraph(
      {
        nodes: [
          {kind: 'gain', params: {gain: 0, interpolation, duration: 0.04, curve: [0, 0.25, 1]}}
        ],
        connections: [],
        inputs: [{source: 0, node: 0}]
      },
      context,
      context.destination,
      () => []
    );
    const source = context.createConstantSource();
    source.offset.value = 1;
    graph.connectSource(0, source);
    graph.setGain(0, 0.8, 0.01);
    source.start();
    const samples = (await context.startRendering()).getChannelData(0);
    expect(samples[240]).toBeCloseTo(0);
    expect(samples[1440]).toBeCloseTo(interpolation === 'linear' ? 0.4 : 0.2, 2);
    expect(samples[3600]).toBeCloseTo(0.8, 2);
    graph.destroy();
  }
});

test('audio graph rejects unsupported multi-port bypass before allocating processors', () => {
  const context = new OfflineAudioContext(2, 512, 48000);
  for (const kind of ['splitter', 'channelmerger'] as const) {
    expect(
      () =>
        new AudioGraph(
          {nodes: [{kind, bypass: true, params: {}}], connections: []},
          context,
          context.destination,
          () => []
        )
    ).toThrow();
  }
});
