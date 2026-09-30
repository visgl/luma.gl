// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Deck,
  Layer,
  OrthographicView,
  type LayerProps,
  type LayerContext,
  type Effect
} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {SceneBufferEffect, surfaceBuffer} from '@deck.gl-community/gpu-layers';
import {luma, Buffer, Texture, type Device, type RenderPass} from '@luma.gl/core';
import {webgpuAdapter, WebGPUDevice} from '@luma.gl/webgpu';
import {Model} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

class CaptureTestLayer extends Layer<LayerProps & {transparent?: boolean}> {
  static override layerName = 'CaptureTestLayer';
  declare state: {model: Model};
  override getAttributeManager() {
    return null;
  }
  override initializeState(): void {
    this.setState({
      model: new Model(this.context.device, {
        ...this.getShaders({
          source: this.props.transparent
            ? SOURCE.replace('0.3, 1.0', '0.1, 1.0').replace(
                '4.0, 0.5, 0.25, 1.0',
                '0.0, 0.5, 0.0, 0.5'
              )
            : SOURCE,
          modules: [surfaceBuffer]
        }),
        vertexCount: 3,
        parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
      })
    });
  }
  override getModels(): Model[] {
    return [this.state.model];
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    this.state.model.draw(renderPass);
  }
  override finalizeState(context: LayerContext): void {
    this.state.model.destroy();
    super.finalizeState(context);
  }
}
const SOURCE = /* wgsl */ `
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[index], 0.3, 1.0);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  if (surfaceBuffer.enabled != 0) { return surfaceBuffer_encode(vec3<f32>(0.0, 0.0, 1.0), 0.25); }
  return vec4<f32>(4.0, 0.5, 0.25, 1.0);
}
`;

test.each([false, true])(
  'scene capture selection=%s preserves HDR, depth, per-view history, resize and ownership',
  async (selection, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    context.skip('WebGPU unavailable');
    return;
  }
  const parent = document.createElement('div');
  parent.style.width = '64px';
  parent.style.height = '64px';
  document.body.append(parent);
  let selected = true;
  const effect = new SceneBufferEffect({
    history: true,
    selection,
    getLayerOptions: layer => ({
      mode: layer.id === 'transparent' ? 'transparent' : 'opaque',
      surfaceBuffer: layer.id !== 'transparent',
      selected
    })
  });
  let postprocessDepth = false;
  const postprocess: Effect = {
    id: 'capture-test-postprocess',
    props: {},
    useInPicking: false,
    setup() {},
    preRender() {},
    postRender({inputBuffer}) {
      postprocessDepth = Boolean(inputBuffer.depthStencilAttachment);
      return inputBuffer;
    },
    cleanup() {}
  };
  const errors: string[] = [];
  const deck = new Deck({
    parent,
    device,
    width: 64,
    height: 64,
    useDevicePixels: false,
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 0},
    layers: [
      new CaptureTestLayer({id: 'surface'}),
      new CaptureTestLayer({
        id: 'transparent',
        transparent: true,
        parameters: {blend: true, depthWriteEnabled: false}
      })
    ],
    effects: [effect, postprocess],
    _animate: true,
    onError: error => {
      errors.push(error.message);
    }
  });
  try {
    await waitUntil(() => Boolean(effect.getFrame('main')?.previousBuffer), errors);
    await new Promise(resolve => setTimeout(resolve, 150));
    deck.setProps({_animate: false});
    deck.redraw('capture test');
    expect(postprocessDepth).toBe(true);
    const frame = effect.getFrame('main')!;
    expect(frame.buffer.colorTexture.format).toBe('rgba16float');
    expect(frame.previousBuffer).toBeDefined();
    expect(frame.previousBuffer).not.toBe(frame.buffer);
    expect(frame.buffer.framebuffer.colorAttachments).toHaveLength(selection ? 3 : 2);
    if (!selection) {
      expect(() => frame.buffer.getExtraColorTexture('selection')).toThrow();
    }
    const values = await readCapture(device, effect, 'main');
    expect(values[0]).toBeCloseTo(2, 3);
    expect(values[1]).toBeCloseTo(0.25, 2);
    expect(values[2]).toBeCloseTo(0.3, 3);
    expect(values[3]).toBe(selection ? 1 : 0);
    const firstSlots = [frame.buffer, frame.previousBuffer!];
    selected = false;
    deck.redraw('capture test');
    expect((await readCapture(device, effect, 'main'))[3]).toBe(0);
    selected = true;
    deck.redraw('capture test');
    // Removing all participants clears stale color, depth, normals and selection.
    deck.setProps({layerFilter: () => false});
    deck.redraw('capture test');
    const empty = await readCapture(device, effect, 'main');
    expect(Array.from(empty)).toEqual([0, 1, 1, 0]);
    deck.setProps({layerFilter: null});
    deck.redraw('capture test');

    effect.resetHistory('main');
    deck.redraw('capture test');
    expect(effect.getFrame('main')?.previousBuffer).toBeUndefined();
    deck.redraw('capture test');
    expect(effect.getFrame('main')?.previousBuffer).toBeDefined();
    expect(firstSlots).toContain(effect.getFrame('main')?.buffer);
    // Independent targets prevent views from overwriting each other's history.
    deck.setProps({
      views: [
        new OrthographicView({id: 'left', width: '50%'}),
        new OrthographicView({id: 'right', x: '50%', width: '50%'})
      ]
    });
    deck.redraw('capture test');
    await waitUntil(() => Boolean(effect.getFrame('left') && effect.getFrame('right')), errors);
    expect(effect.getFrame('main')).toBeUndefined();
    expect(firstSlots.every(buffer => buffer.colorTexture.destroyed)).toBe(true);
    const left = effect.getFrame('left')!;
    const right = effect.getFrame('right')!;
    expect(left.buffer).not.toBe(right.buffer);
    expect(left.viewportBounds).toEqual([0, 0, 32, 64]);
    expect(right.viewportBounds).toEqual([32, 0, 32, 64]);
    deck.redraw('capture test');
    const leftValues = await readCapture(device, effect, 'left', [16, 32]);
    const rightValues = await readCapture(device, effect, 'right', [48, 32]);
    expect(leftValues[0]).toBeCloseTo(2, 3);
    expect(rightValues[0]).toBeCloseTo(2, 3);
    deck.setProps({
      views: [
        new OrthographicView({id: 'left', height: '50%'}),
        new OrthographicView({id: 'right', y: '50%', height: '50%'})
      ]
    });
    deck.redraw('capture test');
    expect((await readCapture(device, effect, 'left', [32, 16]))[0]).toBeCloseTo(2, 3);
    expect((await readCapture(device, effect, 'right', [32, 48]))[0]).toBeCloseTo(2, 3);
    expect(effect.getFrame('left')?.viewportBounds).toEqual([0, 0, 64, 32]);
    expect(effect.getFrame('right')?.viewportBounds).toEqual([0, 32, 64, 32]);
    expect(effect.getFrame('left')?.previousBuffer).toBeUndefined();
    const oldColor = effect.getFrame('left')!.buffer.colorTexture;
    deck.setProps({width: 80, height: 48});
    deck.redraw('capture test');
    await waitUntil(
      () => effect.getFrame('left')?.buffer.width === 80,
      errors,
      () => deck.redraw('capture test')
    );
    expect(oldColor.destroyed).toBe(true);
    const finalTexture = effect.getFrame('left')!.buffer.colorTexture;
    deck.finalize();
    effect.cleanup();
    expect(finalTexture.destroyed).toBe(true);
    expect(effect.getFrame('left')).toBeUndefined();
    expect(errors).toEqual([]);
  } finally {
    deck.finalize();
    parent.remove();
  }
});

test('scene capture accepts stock Deck color and depth without inventing normals or selection', async context => {
  if (!(await getWebGPUTestDevice())) return context.skip('WebGPU unavailable');
  const errors: string[] = [];
  let stage = 'ordinary stock rendering';
  // Own this presentation context instead of reusing the earlier Deck fixtures' canvas.
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    featureLevel: 'max',
    createCanvasContext: {width: 64, height: 64},
    debug: true,
    onError: error => {
      errors.push(error.message);
    }
  });
  const nativeDevice = device instanceof WebGPUDevice ? device.handle : undefined;
  expect(nativeDevice).toBeDefined();
  let deviceLoss: Awaited<typeof device.lost> | undefined;
  void device.lost.then(info => {
    deviceLoss = info;
  });
  const parent = document.createElement('div');
  parent.style.width = '64px';
  parent.style.height = '64px';
  document.body.append(parent);
  type Point = {position: [number, number, number]};
  const capturedData: Point[] = [{position: [0, 0, 0]}];
  const excludedData: Point[] = [{position: [18, 0, 0]}];
  const captured = new ScatterplotLayer<Point>({
    id: 'stock-captured',
    data: capturedData,
    getPosition: point => point.position,
    radiusUnits: 'pixels',
    getRadius: 10,
    getFillColor: [192, 64, 32, 255],
    antialiasing: false,
    pickable: true,
    parameters: {depthCompare: 'less-equal', depthWriteEnabled: true}
  });
  const excluded = new ScatterplotLayer<Point>({
    id: 'stock-excluded',
    data: excludedData,
    getPosition: point => point.position,
    radiusUnits: 'pixels',
    getRadius: 4,
    getFillColor: [255, 255, 255, 255],
    antialiasing: false,
    pickable: true
  });
  const effect = new SceneBufferEffect({
    selection: true,
    getLayerOptions: layer =>
      layer.id === 'stock-excluded'
        ? null
        : {
            mode: layer.id === 'stock-transparent' ? 'transparent' : 'opaque',
            selected: true
          }
  });
  let frames = 0;
  const deck = new Deck({
    parent,
    device,
    width: 64,
    height: 64,
    useDevicePixels: false,
    views: new OrthographicView({id: 'stock'}),
    initialViewState: {target: [0, 0], zoom: 0},
    layers: [captured, excluded],
    effects: [],
    _animate: true,
    onAfterRender: () => {
      frames++;
    },
    onError: error => {
      errors.push(error.message);
    }
  });
  try {
    await waitUntil(() => frames >= 3 && captured.isLoaded, errors);
    // Distinguish stock layer/device failures from capture-specific failures.
    await nativeDevice!.queue.onSubmittedWorkDone();
    stage = 'captured stock rendering';
    frames = 0;
    deck.setProps({effects: [effect]});
    await waitUntil(
      () => frames >= 3 && captured.isLoaded && Boolean(effect.getFrame('stock')),
      errors
    );
    deck.setProps({_animate: false});
    deck.redraw('stock capture');
    stage = 'opaque capture readback';
    const opaque = await readCapture(device, effect, 'stock');
    expect(opaque[0]).toBeCloseTo(192 / 255, 3);
    expect(opaque[1]).toBe(1);
    expect(opaque[2]).toBeGreaterThan(0);
    expect(opaque[2]).toBeLessThan(1);
    expect(opaque[3]).toBe(0);
    expect(Array.from(await readCapture(device, effect, 'stock', [50, 32]))).toEqual([0, 1, 1, 0]);
    stage = 'stock picking';
    const picked = await deck.pickObjectAsync({x: 32, y: 32});
    expect(picked?.layer?.id).toBe('stock-captured');
    expect(picked?.index).toBe(0);
    expect(picked?.object).toBe(capturedData[0]);
    const excludedPick = await deck.pickObjectAsync({x: 50, y: 32});
    expect(excludedPick?.layer?.id).toBe('stock-excluded');

    stage = 'transparent capture';
    const transparent = new ScatterplotLayer<Point>({
      id: 'stock-transparent',
      data: capturedData,
      getPosition: point => point.position,
      radiusUnits: 'pixels',
      getRadius: 4,
      getFillColor: [0, 255, 0, 128],
      antialiasing: false,
      parameters: {
        blend: true,
        depthWriteEnabled: false,
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    deck.setProps({layers: [captured, excluded, transparent]});
    await waitUntil(
      () => transparent.isLoaded && transparent.getModels().length > 0,
      errors,
      () => deck.redraw('stock transparency')
    );
    deck.redraw('stock transparency');
    const blended = await readCapture(device, effect, 'stock');
    expect(blended[0]).toBeCloseTo((192 / 255) * (1 - 128 / 255), 3);
    expect(blended.slice(1)).toEqual(opaque.slice(1));
    const texture = effect.getFrame('stock')!.buffer.colorTexture;
    stage = 'capture removal';
    deck.setProps({effects: []});
    await waitUntil(
      () => texture.destroyed,
      errors,
      () => deck.redraw('ordinary stock rendering')
    );
    expect((await deck.pickObjectAsync({x: 32, y: 32}))?.object).toBe(capturedData[0]);
    expect(errors).toEqual([]);
  } catch (error) {
    console.error('Stock scene capture failure', {
      stage,
      frames,
      device: device.info,
      isLost: device.isLost,
      deviceLoss,
      errors
    });
    throw error;
  } finally {
    deck.finalize();
    parent.remove();
    device.destroy();
  }
});

async function waitUntil(
  predicate: () => boolean,
  errors: string[],
  progress?: () => void
): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (!predicate() && Date.now() < deadline) {
    if (errors.length) throw new Error(errors.join('\n'));
    progress?.();
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  expect(predicate()).toBe(true);
  expect(errors).toEqual([]);
}

async function readCapture(
  device: Device,
  effect: SceneBufferEffect,
  id: string,
  coordinate = [32, 32]
): Promise<Float32Array> {
  const frame = effect.getFrame(id)!;
  const selection = effect.props.selection;
  const texture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba32float',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({width: 1, height: 1, colorAttachments: [texture]});
  const buffer = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.MAP_READ});
  const model = new Model(device, {
    source: /* wgsl */ `
@group(0) @binding(auto) var colorTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
${selection ? '@group(0) @binding(auto) var selectionTexture: texture_2d<f32>;' : ''}
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  let coordinate = vec2<i32>(${coordinate[0]}, ${coordinate[1]});
  return vec4<f32>(textureLoad(colorTexture, coordinate, 0).r,
    textureLoad(normalTexture, coordinate, 0).a, textureLoad(depthTexture, coordinate, 0),
    ${selection ? 'textureLoad(selectionTexture, coordinate, 0).r' : '0.0'});
}
`,
    vertexCount: 3,
    bindings: {
      colorTexture: frame.buffer.colorTexture,
      normalTexture: frame.buffer.normalRoughnessTexture,
      depthTexture: frame.buffer.depthTexture,
      ...(selection ? {selectionTexture: frame.buffer.getExtraColorTexture('selection')} : {})
    }
  });
  try {
    const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    expect(model.draw(pass)).toBe(true);
    pass.end();
    device.submit();
    pass.destroy();
    texture.readBuffer({width: 1, height: 1}, buffer);
    const values = await buffer.readAsync();
    return new Float32Array(values.buffer, values.byteOffset, 4).slice();
  } finally {
    model.destroy();
    framebuffer.destroy();
    texture.destroy();
    buffer.destroy();
  }
}
