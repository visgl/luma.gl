// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {COORDINATE_SYSTEM, Deck, OrthographicView} from '@deck.gl/core';
import {luma, Texture, Buffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {WindParticleLayer, WindSimulationEffect} from '../src';

it('wind effect advances once per render, pauses, and the layer borrows live GPU buffers', async context => {
  if (!(await getTestDevice('webgpu'))) return context.skip();
  const size = 64;
  const parent = document.createElement('div');
  parent.style.cssText = `width:${size}px;height:${size}px`;
  document.body.append(parent);
  const canvas = document.createElement('canvas');
  parent.append(canvas);
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, width: size, height: size, useDevicePixels: false}
  });
  const texture = device.createTexture({
    width: size,
    height: size,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: size,
    height: size,
    colorAttachments: [texture],
    depthStencilAttachment: 'depth24plus'
  });
  let encodings = 0;
  const effect = new WindSimulationEffect(device, {
    input: {
      dimensions: ['y', 'x'],
      shape: [2, 2],
      eastward: new Float32Array(4).fill(0.2),
      northward: new Float32Array(4),
      valid: new Uint8Array(4).fill(1)
    },
    bounds: [-1, -1, 1, 1],
    particleCount: 1,
    paused: true,
    lifetime: 100,
    onEncode: () => encodings++
  });
  effect.simulation.output.write(new Float32Array([0.5, 0.5, 1, 1]));
  effect.simulation.previous.write(new Float32Array([0.5, 0.5, 1, 1]));
  let frames = 0;
  const errors: string[] = [];
  const layer = () =>
    new WindParticleLayer({
      id: 'wind-test',
      simulation: effect.simulation,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      widthPixels: 8,
      altitude: 0,
      pickable: true
    });
  const deck = new Deck({
    parent,
    device,
    width: size,
    height: size,
    useDevicePixels: false,
    _framebuffer: framebuffer,
    views: new OrthographicView({flipY: false}),
    initialViewState: {target: [0, 0, 0], zoom: 4},
    effects: [effect],
    layers: [layer()],
    onAfterRender: () => frames++,
    onError: error => errors.push(error.message)
  });
  async function renderFrames() {
    const previous = frames;
    const deadline = Date.now() + 10000;
    do {
      deck.redraw('wind test');
      await new Promise(resolve => requestAnimationFrame(resolve));
    } while (frames < previous + 2 && !errors.length && Date.now() < deadline);
    expect(errors).toEqual([]);
    expect(frames).toBeGreaterThan(previous);
    device.submit();
  }
  try {
    await renderFrames();
    expect(encodings).toBe(1);
    const picked = await deck.pickObjectAsync({x: 32, y: 32, radius: 4});
    expect(picked?.index).toBe(0);
    expect(encodings).toBe(1);
    const initialTime = effect.simulation.time;
    effect.props.paused = false;
    await renderFrames();
    expect(effect.simulation.time).toBeGreaterThan(initialTime);
    effect.props.paused = true;
    const pausedTime = effect.simulation.time;
    const pausedState = await effect.simulation.output.readAsync();
    await renderFrames();
    expect(effect.simulation.time).toBe(pausedTime);
    expect(await effect.simulation.output.readAsync()).toEqual(pausedState);
    const current = effect.simulation.output;
    const previous = effect.simulation.previous;
    deck.setProps({layers: []});
    await renderFrames();
    expect(current.destroyed).toBe(false);
    expect(previous.destroyed).toBe(false);
    deck.setProps({layers: [layer()]});
    await renderFrames();
    const layout = texture.computeMemoryLayout();
    const output = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      texture.readBuffer({}, output);
      device.submit();
      const pixels = new Uint8Array(await output.readAsync());
      expect(pixels.some((value, index) => index % 4 === 1 && value > 50)).toBe(true);
    } finally {
      output.destroy();
    }
    deck.finalize();
    expect(current.destroyed).toBe(true);
    expect(previous.destroyed).toBe(true);
  } finally {
    deck.finalize();
    framebuffer.destroy();
    texture.destroy();
    device.destroy();
    parent.remove();
  }
});
