// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, Layer, MapView, type LayerContext} from '@deck.gl/core';
import {luma, Buffer, Texture, type RenderPass} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';
import {getTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';
import {SunLayer, MoonLayer, CloudLayer, AtmosphereLayer} from '../src';

const SIZE = 128;
const DIRECTION = [0, Math.cos(Math.PI / 18), Math.sin(Math.PI / 18)] as const;

class OccluderLayer extends Layer {
  static override layerName = 'SkyBodyTestOccluder';
  declare state: {model: Model};
  override getAttributeManager() {
    return null;
  }
  override initializeState({device}: LayerContext) {
    this.setState({
      model: new Model(device, {
        source: `@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
        let positions = array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
        return vec4f(positions[index],0.5,1);
      } @fragment fn fragmentMain() -> @location(0) vec4f { return vec4f(0,0,1,1); }`,
        vs: `#version 300 es
        void main() { vec2 positions[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3));
        gl_Position=vec4(positions[gl_VertexID],0.0,1.0); }`,
        fs: '#version 300 es\nprecision highp float; out vec4 color; void main(){color=vec4(0,0,1,1);}',
        vertexCount: 3,
        parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
      })
    });
  }
  override getModels() {
    return this.state.model ? [this.state.model] : [];
  }
  override draw({renderPass}: {renderPass: RenderPass}) {
    this.state.model.draw(renderPass);
  }
  override finalizeState(context: LayerContext) {
    this.state.model.destroy();
    super.finalizeState(context);
  }
}

test.each(['webgpu', 'webgl'] as const)(
  'sky layers on %s render celestial bodies, clouds, occlusion and clean up',
  async (backend, context) => {
    if (!(await getTestDevice(backend))) return context.skip(`${backend} unavailable`);
    const parent = document.createElement('div');
    parent.style.width = `${SIZE}px`;
    parent.style.height = `${SIZE}px`;
    document.body.append(parent);
    const canvas = document.createElement('canvas');
    parent.append(canvas);
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    const device = await luma.createDevice({
      type: backend,
      adapters: [webgpuAdapter, webgl2Adapter],
      createCanvasContext: {canvas, width: SIZE, height: SIZE, useDevicePixels: false}
    });
    const texture = device.createTexture({
      width: SIZE,
      height: SIZE,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: SIZE,
      height: SIZE,
      colorAttachments: [texture],
      depthStencilAttachment: 'depth24plus'
    });
    const errors: Error[] = [];
    let frames = 0;
    const sun = new SunLayer({id: 'sun-test', direction: DIRECTION, radiusPixels: 14});
    const deck = new Deck({
      device,
      parent,
      width: SIZE,
      height: SIZE,
      useDevicePixels: false,
      _framebuffer: framebuffer,
      views: new MapView({fovy: 50}),
      initialViewState: {longitude: 0, latitude: 0, zoom: 10, pitch: 80, maxPitch: 85},
      layers: [sun],
      onError: error => errors.push(error),
      onAfterRender: () => frames++
    });
    async function readFrame(layers?: Layer[]) {
      const previous = frames;
      if (layers) deck.setProps({layers});
      deck.redraw('sky test');
      const deadline = Date.now() + 10_000;
      while (frames < previous + 2 && !errors.length && Date.now() < deadline) {
        // Deck reconciles new layers on the next animation tick.
        deck.redraw('sky test update');
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      expect(errors).toEqual([]);
      expect(frames).toBeGreaterThan(previous);
      device.submit();
      const layout = texture.computeMemoryLayout();
      const buffer = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        texture.readBuffer({}, buffer);
        device.submit();
        return new Uint8Array(await buffer.readAsync()).slice();
      } finally {
        buffer.destroy();
      }
    }
    try {
      const solar = await readFrame();
      expect(Math.max(...solar.filter((_, index) => index % 4 === 0))).toBe(255);
      expect(solar[0], 'quad corners stay transparent').toBe(0);
      const moon = (phase: number) =>
        new MoonLayer({id: 'moon-test', direction: DIRECTION, radiusPixels: 14, phase});
      const full = await readFrame([moon(0.5)]);
      const waxing = await readFrame([moon(0.25)]);
      const waning = await readFrame([moon(0.75)]);
      const newMoon = await readFrame([moon(0)]);
      const energy = (pixels: Uint8Array) =>
        pixels.reduce((sum, value, index) => (index % 4 === 0 ? sum + value : sum), 0);
      expect(energy(full)).toBeGreaterThan(energy(waxing) * 1.5);
      expect(energy(newMoon)).toBeLessThan(energy(full) * 0.15);
      const sideEnergy = (pixels: Uint8Array, right: boolean) =>
        pixels.reduce(
          (sum, value, index) =>
            index % 4 === 0 && Math.floor(index / 4) % SIZE >= SIZE / 2 === right
              ? sum + value
              : sum,
          0
        );
      expect(sideEnergy(waxing, true)).toBeGreaterThan(sideEnergy(waxing, false) * 2);
      expect(sideEnergy(waning, false)).toBeGreaterThan(sideEnergy(waning, true) * 2);
      const lunarLayer = deck
        .layerManager!.getLayers()
        .find(
          (layer): layer is MoonLayer => layer instanceof MoonLayer && layer.id === 'moon-test'
        )!;
      const lunarCorners = lunarLayer.state.corners;
      const covered = await readFrame([new OccluderLayer({id: 'foreground'}), moon(0.5)]);
      expect(energy(covered), 'foreground depth hides the moon').toBe(0);
      expect(covered[2]).toBe(255);
      const cloud = (
        cover: number,
        time = 0,
        sunDirection: [number, number, number] = [0, 0.8, 0.6]
      ) => new CloudLayer({id: 'cloud-test', cover, time, sunDirection, velocity: [30, 10]});
      // Put the camera below the slab and use broken cover, so drift changes visible cloud edges.
      deck.setProps({
        initialViewState: {longitude: 0, latitude: 0, zoom: 15, pitch: 80, maxPitch: 85}
      });
      const clear = await readFrame([cloud(0)]);
      const cloudy = await readFrame([cloud(0.5)]);
      const drifting = await readFrame([cloud(0.5, 40)]);
      const night = await readFrame([cloud(0.5, 0, [0, 0.8, -0.6])]);
      expect(energy(clear), 'zero cover leaves the sky clear').toBe(0);
      expect(energy(cloudy), 'cloud cover renders visible volumes').toBeGreaterThan(5000);
      expect(energy(night), 'clouds dim when the sun sets').toBeLessThan(energy(cloudy) * 0.3);
      const changed = cloudy.reduce(
        (sum, value, index) => sum + (Math.abs(value - drifting[index]) > 10 ? 1 : 0),
        0
      );
      expect(changed, 'wind and elapsed seconds move cloud formations').toBeGreaterThan(500);
      const foreground = await readFrame([new OccluderLayer({id: 'foreground'}), cloud(0.5)]);
      expect(energy(foreground), 'foreground depth occludes sky clouds').toBe(0);
      expect(foreground[2]).toBe(255);
      const cloudLayer = deck
        .layerManager!.getLayers()
        .find((layer): layer is CloudLayer => layer instanceof CloudLayer)!;
      const cloudUniformBuffer =
        cloudLayer.state.model._uniformStore.getManagedUniformBuffer('clouds');
      const atmosphereLayer = new AtmosphereLayer({
        id: 'atmosphere-test',
        sunDirection: [0, 0.6, 0.8]
      });
      const atmospherePixels = await readFrame([atmosphereLayer]);
      expect(energy(atmospherePixels), 'atmosphere fills the sky').toBeGreaterThan(1000);
      expect(deck.pickObject({x: 64, y: 10}), 'sky does not participate in picking').toBeNull();
      const atmosphericForeground = await readFrame([
        new OccluderLayer({id: 'foreground'}),
        atmosphereLayer
      ]);
      expect(energy(atmosphericForeground), 'foreground depth occludes atmosphere').toBe(0);
      expect(atmosphericForeground[2]).toBe(255);
      const activeAtmosphere = deck
        .layerManager!.getLayers()
        .find((layer): layer is AtmosphereLayer => layer instanceof AtmosphereLayer)!;
      const atmosphereUniformBuffer =
        activeAtmosphere.state.model._uniformStore.getManagedUniformBuffer('atmosphere');
      deck.finalize();
      expect(atmosphereUniformBuffer.destroyed).toBe(true);
      expect(cloudUniformBuffer.destroyed).toBe(true);
      expect(lunarCorners.destroyed).toBe(true);
    } finally {
      deck.finalize();
      framebuffer.destroy();
      texture.destroy();
      device.destroy();
      parent.remove();
    }
  },
  30_000
);
