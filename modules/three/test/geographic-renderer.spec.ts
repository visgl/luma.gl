// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Deck, MapView, type MapViewState} from '@deck.gl/core';
import {Buffer, Texture, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {ThreeSceneAdapter} from '../src/objects';
import {synchronizeThreeCamera} from '../src/deck';
import {
  HalfFloatType,
  Box3,
  Mesh,
  MeshStandardMaterial,
  RenderTarget,
  SRGBColorSpace,
  WebGPURenderer,
  WebGPUCoordinateSystem
} from 'three/webgpu';
import {
  createGeographicLayers,
  createGeographicScene,
  GEOGRAPHIC_ORIGIN,
  GEOGRAPHIC_OBJECTS
} from '../../../examples/experimental/three/geographic-scene';

test('Geographic Lantern placement, picking, selection and shared depth match upstream Three', async context => {
  if (!navigator.gpu) return context.skip('WebGPU unavailable');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  document.body.append(canvas);
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, autoResize: false}
  });
  const adapter = new ThreeSceneAdapter({device});
  await adapter.init();
  const reference = new WebGPURenderer({
    canvas: document.createElement('canvas'),
    antialias: false,
    outputBufferType: HalfFloatType
  });
  await reference.init();
  const scene = await createGeographicScene(adapter.renderer);
  const referenceScene = await createGeographicScene(reference);
  referenceScene.scene.add(referenceScene.referenceContext);
  for (const fixture of [scene, referenceScene])
    fixture.models.forEach((model, index) => {
      expect(new Box3().setFromObject(model).min.z).toBeCloseTo(
        GEOGRAPHIC_OBJECTS[index].position[2],
        6
      );
    });
  const color = device.createTexture({
    width: 128,
    height: 128,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 128,
    height: 128,
    colorAttachments: [color],
    depthStencilAttachment: 'depth32float'
  });
  const readback = device.createBuffer({
    byteLength: 128 * 128 * 4,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const comparisonTarget = new RenderTarget(128, 128);
  comparisonTarget.texture.colorSpace = SRGBColorSpace;
  reference.setRenderTarget(comparisonTarget);
  reference.setSize(128, 128, false);
  const errors: string[] = [];
  const nativeDevice = device.handle as GPUDevice;
  nativeDevice.addEventListener('uncapturederror', event => errors.push(event.error.message));
  const beginPass = vi.spyOn(device, 'beginRenderPass');
  const drawScene = vi.spyOn(adapter, 'draw');
  const destroyDevice = vi.spyOn(device, 'destroy');
  let geometryDispose: ReturnType<typeof vi.spyOn> | undefined;
  scene.scene.traverse(object => {
    if (
      !geometryDispose &&
      object instanceof Mesh &&
      object.material instanceof MeshStandardMaterial
    )
      geometryDispose = vi.spyOn(object.geometry, 'dispose');
  });
  let deck: Deck<MapView> | undefined;
  try {
    let borrowedEnd: ReturnType<typeof vi.spyOn> | undefined;
    let submissionCount = 0;
    const submit = vi.spyOn(device, 'submit');
    const viewState: MapViewState = {
      longitude: GEOGRAPHIC_ORIGIN[0],
      latitude: GEOGRAPHIC_ORIGIN[1],
      zoom: 16.8,
      pitch: 55,
      bearing: -25
    };
    await new Promise<void>((resolve, reject) => {
      deck = new Deck<MapView>({
        device,
        canvas,
        width: 128,
        height: 128,
        style: {position: 'relative'},
        useDevicePixels: false,
        views: new MapView(),
        controller: false,
        viewState,
        _framebuffer: framebuffer,
        layers: createGeographicLayers(scene, adapter),
        onLoad: resolve,
        onError: reject,
        onBeforeRender: () => {
          const viewport = deck!.getViewports()[0];
          synchronizeThreeCamera(scene.camera, viewport, WebGPUCoordinateSystem, GEOGRAPHIC_ORIGIN);
          adapter.prepare(scene.scene, scene.camera);
          beginPass.mockClear();
          submissionCount = submit.mock.calls.length;
        }
      });
    });
    let baseline: Uint8Array | undefined;
    for (const reverseOrder of [false, true]) {
      let borrowedPassCalls = 0;
      const draw = drawScene.getMockImplementation();
      drawScene.mockImplementation((source, camera, pass) => {
        borrowedEnd = vi.spyOn(pass, 'end');
        const count = submit.mock.calls.length;
        const result = ThreeSceneAdapter.prototype.draw.call(adapter, source, camera, pass);
        expect(borrowedEnd).not.toHaveBeenCalled();
        expect(submit.mock.calls.length).toBe(count);
        borrowedPassCalls++;
        return result;
      });
      await new Promise<void>((resolve, reject) =>
        deck!.setProps({
          layers: createGeographicLayers(scene, adapter, reverseOrder),
          onAfterRender: resolve,
          onError: reject
        })
      );
      drawScene.mockImplementation(draw!);
      expect(borrowedPassCalls).toBe(1);
      expect(beginPass).toHaveBeenCalledTimes(1);
      // Deck submits before onAfterRender and its animation loop also submits at frame end.
      // The borrowed Three draw itself must not submit (checked above).
      expect(submit.mock.calls.length - submissionCount).toBeLessThanOrEqual(2);
      color.readBuffer({}, readback);
      const pixels = await readback.readAsync();
      synchronizeThreeCamera(
        referenceScene.camera,
        deck!.getViewports()[0],
        WebGPUCoordinateSystem,
        GEOGRAPHIC_ORIGIN
      );
      reference.render(referenceScene.scene, referenceScene.camera);
      const expected = await reference.readRenderTargetPixelsAsync(
        comparisonTarget,
        0,
        0,
        128,
        128
      );
      let total = 0;
      let differingPixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        let difference = 0;
        for (let channel = 0; channel < 3; channel++) {
          const error = Math.abs(pixels[index + channel] - expected[index + channel]);
          total += error;
          difference = Math.max(difference, error);
        }
        if (difference > 2) differingPixels++;
      }
      expect(total / (128 * 128 * 3)).toBeLessThan(1);
      expect(differingPixels / (128 * 128)).toBeLessThan(0.005);
      if (!reverseOrder) baseline = pixels;
      else expect(Array.from(pixels)).toEqual(Array.from(baseline!));
    }

    const viewport = deck!.getViewports()[0];
    const picked = await deck!.pickObjectsAsync({x: 8, y: 8, width: 120, height: 120});
    const lanternHits = picked.filter(info => info.layer?.id === 'geographic-lanterns');
    expect(lanternHits.length).toBeGreaterThan(0);
    for (const hit of lanternHits) {
      expect(GEOGRAPHIC_OBJECTS.some(object => object.id === hit.object.id)).toBe(true);
      expect(scene.models.includes(hit.object.object)).toBe(true);
    }
    expect(picked.some(info => info.layer?.id === 'geographic-buildings')).toBe(true);
    const selectedId = String(lanternHits[0].object.id);
    scene.select(selectedId);
    referenceScene.select(selectedId);
    await new Promise<void>((resolve, reject) =>
      deck!.setProps({
        layers: createGeographicLayers(scene, adapter),
        onAfterRender: resolve,
        onError: reject
      })
    );
    color.readBuffer({}, readback);
    const selectedPixels = await readback.readAsync();
    expect(Array.from(selectedPixels)).not.toEqual(Array.from(baseline!));
    synchronizeThreeCamera(
      referenceScene.camera,
      viewport,
      WebGPUCoordinateSystem,
      GEOGRAPHIC_ORIGIN
    );
    reference.render(referenceScene.scene, referenceScene.camera);
    const selectedReference = await reference.readRenderTargetPixelsAsync(
      comparisonTarget,
      0,
      0,
      128,
      128
    );
    let selectedDifference = 0;
    for (let index = 0; index < selectedPixels.length; index++)
      if (index % 4 !== 3)
        selectedDifference += Math.abs(selectedPixels[index] - selectedReference[index]);
    expect(selectedDifference / (128 * 128 * 3)).toBeLessThan(1);
    await new Promise<void>((resolve, reject) =>
      deck!.setProps({
        layers: createGeographicLayers(scene, adapter).filter(
          layer => layer.id !== 'geographic-lanterns'
        ),
        onAfterRender: resolve,
        onError: reject
      })
    );
    expect(geometryDispose).not.toHaveBeenCalled();
    await new Promise<void>((resolve, reject) =>
      deck!.setProps({
        layers: createGeographicLayers(scene, adapter),
        onAfterRender: resolve,
        onError: reject
      })
    );
    color.readBuffer({}, readback);
    expect(Array.from(await readback.readAsync())).toEqual(Array.from(selectedPixels));
    deck!.finalize();
    deck = undefined;
    adapter.dispose();
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(destroyDevice).not.toHaveBeenCalled();
    const probe = device.createBuffer({byteLength: 16});
    probe.destroy();
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    deck?.finalize();
    adapter.dispose();
    reference.dispose();
    comparisonTarget.dispose();
    scene.dispose();
    referenceScene.dispose();
    framebuffer.destroy();
    color.destroy();
    readback.destroy();
    device.destroy();
    canvas.remove();
    vi.restoreAllMocks();
  }
}, 60000);
