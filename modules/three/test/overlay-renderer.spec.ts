// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Deck, COORDINATE_SYSTEM} from '@deck.gl/core';
import {PathLayer, ScatterplotLayer} from '@deck.gl/layers';
import {luma} from '@luma.gl/core';
import {AnimationLoop} from '@luma.gl/engine';
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  RenderTarget,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import {WebGPURenderer} from 'three/webgpu';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {getThreeDeckOverlaySupport, ThreeDeckOverlay} from '../src/overlay';

for (const backend of ['webgl', 'webgpu']) {
  test(`deck overlay attaches to an initialized Three ${backend} app`, async context => {
    if (backend === 'webgpu' && !navigator.gpu) return context.skip('WebGPU unavailable');
    const nativeDevice =
      backend === 'webgpu'
        ? await (await navigator.gpu.requestAdapter())?.requestDevice()
        : undefined;
    if (backend === 'webgpu' && !nativeDevice) return context.skip('WebGPU adapter unavailable');
    const container = document.createElement('div');
    Object.assign(container.style, {position: 'relative', width: '240px', height: '160px'});
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {display: 'block', width: '100%', height: '100%'});
    container.append(canvas);
    document.body.append(container);
    const renderer =
      backend === 'webgpu'
        ? new WebGPURenderer({canvas, device: nativeDevice, antialias: false})
        : new WebGLRenderer({canvas, antialias: false});
    const hostRenderTarget = nativeDevice ? new RenderTarget(240, 160) : undefined;
    if (renderer instanceof WebGPURenderer) {
      await renderer.init();
      // SwiftShader in CI cannot present WebGPU swap-chain textures. Keep the real host
      // renderer and GPU commands, using the same offscreen path as other Three GPU tests.
      renderer.setRenderTarget(hostRenderTarget!);
    }
    renderer.setSize(240, 160, false);
    const perspective = new PerspectiveCamera(50, 1.5, 0.1, 100);
    perspective.position.set(0, 0, 6);
    const orthographic = new OrthographicCamera(-3, 3, 2, -2, 0.1, 100);
    orthographic.position.copy(perspective.position);
    const controls = new OrbitControls(perspective, canvas);
    const scene = new Scene();
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({color: 0x00ff00});
    scene.add(new Mesh(geometry, material));
    if (renderer instanceof WebGPURenderer) await renderer.compileAsync(scene, perspective);
    renderer.render(scene, perspective);
    if (renderer instanceof WebGPURenderer && hostRenderTarget) {
      const hostPixel = await renderer.readRenderTargetPixelsAsync(hostRenderTarget, 120, 80, 1, 1);
      expect(Array.from(hostPixel).slice(0, 4)).toEqual([0, 255, 0, 255]);
    }
    const hostContext = renderer instanceof WebGLRenderer ? renderer.getContext() : undefined;
    const hostProgram = hostContext?.getParameter(hostContext.CURRENT_PROGRAM);
    const disposeHost = vi.spyOn(renderer, 'dispose');
    const scheduleHost = vi.spyOn(renderer, 'setAnimationLoop');
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const scheduleDeck = vi.spyOn(AnimationLoop.prototype, '_requestAnimationFrame');
    const drawDeck = vi.spyOn(Deck.prototype, '_drawLayers');
    const errors: Error[] = [];
    const point: [number, number, number] = [0.2, 0.25, 0];
    const layers = (opacity = 1) => [
      new ScatterplotLayer({
        id: 'host-points',
        opacity,
        transitions: {opacity: 1000},
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: [point],
        getPosition: position => position,
        radiusUnits: 'pixels',
        billboard: true,
        getRadius: 8,
        getFillColor: [0, 0, 255]
      }),
      new PathLayer({
        id: 'host-path',
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: [
          {
            path: [
              [-1, -1, 0],
              [1, -1, 0]
            ]
          }
        ],
        getPath: record => record.path,
        widthUnits: 'pixels',
        billboard: true,
        getWidth: 12,
        getColor: [255, 0, 0]
      })
    ];
    const initialLayers = layers();
    let overlay: ThreeDeckOverlay | undefined;
    try {
      expect(getThreeDeckOverlaySupport({renderer, container})).toEqual({
        supported: true,
        sharedDevice: false,
        sharedDepth: false
      });
      container.style.position = 'static';
      expect(getThreeDeckOverlaySupport({renderer, container}).supported).toBe(false);
      container.style.position = 'relative';
      overlay = await ThreeDeckOverlay.create({
        renderer,
        container,
        layers: initialLayers,
        onError: error => errors.push(error)
      });
      expect(scheduleDeck).not.toHaveBeenCalled();
      expect(drawDeck).not.toHaveBeenCalled();
      expect(renderer.domElement).toBe(canvas);
      expect(overlay.canvas).not.toBe(canvas);
      expect(overlay.canvas.style.pointerEvents).toBe('none');
      const overlayContext = overlay.canvas.getContext('webgl2')!;
      expect(overlayContext).not.toBe(hostContext);
      const readPixel = (position: number[]) => {
        const pixel = new Uint8Array(4);
        overlayContext.readPixels(
          Math.floor(position[0]),
          Math.floor(position[1]),
          1,
          1,
          overlayContext.RGBA,
          overlayContext.UNSIGNED_BYTE,
          pixel
        );
        return Array.from(pixel);
      };
      for (const camera of [perspective, orthographic]) {
        for (const pixelRatio of [1, 2]) {
          container.style.width = pixelRatio === 1 ? '240px' : '300px';
          container.style.height = pixelRatio === 1 ? '160px' : '180px';
          const width = container.clientWidth;
          const height = container.clientHeight;
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(width, height, false);
          if (camera instanceof PerspectiveCamera) camera.aspect = width / height;
          else {
            camera.left = (-2 * width) / height;
            camera.right = (2 * width) / height;
          }
          camera.position.x = pixelRatio === 1 ? 0 : 0.4;
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
          const cameraMatrix = camera.matrixWorld.toArray();
          overlay.render(camera, 1000);
          expect(overlay.canvas.width).toBe(width * pixelRatio);
          expect(overlay.canvas.height).toBe(height * pixelRatio);
          const hostBounds = canvas.getBoundingClientRect();
          const overlayBounds = overlay.canvas.getBoundingClientRect();
          for (const dimension of ['x', 'y', 'width', 'height'] as const) {
            expect(overlayBounds[dimension]).toBe(hostBounds[dimension]);
          }
          expect(
            document.elementFromPoint(hostBounds.x + width / 2, hostBounds.y + height / 2)
          ).toBe(canvas);
          const normalized = new Vector3(...point).project(camera);
          expect(
            readPixel([
              ((normalized.x + 1) * width * pixelRatio) / 2,
              ((normalized.y + 1) * height * pixelRatio) / 2
            ])
          ).toEqual([0, 0, 255, 255]);
          // Pixel units must remain useful with a perspective camera far from the origin.
          expect(
            readPixel([
              ((normalized.x + 1) * width * pixelRatio) / 2 + 5 * pixelRatio,
              ((normalized.y + 1) * height * pixelRatio) / 2
            ])
          ).toEqual([0, 0, 255, 255]);
          const pathPosition = new Vector3(0, -1, 0).project(camera);
          expect(
            readPixel([
              ((pathPosition.x + 1) * width * pixelRatio) / 2,
              ((pathPosition.y + 1) * height * pixelRatio) / 2
            ])
          ).toEqual([255, 0, 0, 255]);
          expect(
            readPixel([
              ((pathPosition.x + 1) * width * pixelRatio) / 2,
              ((pathPosition.y + 1) * height * pixelRatio) / 2 + 10 * pixelRatio
            ])
          ).toEqual([0, 0, 0, 0]);
          expect(readPixel([1, 1])).toEqual([0, 0, 0, 0]);
          expect(camera.matrixWorld.toArray()).toEqual(cameraMatrix);
        }
      }
      expect(initialLayers[0].context.timeline.getTime()).toBe(0);
      overlay.render(perspective, 1500);
      expect(initialLayers[0].context.timeline.getTime()).toBe(500);
      overlay.render(perspective, 1500);
      expect(initialLayers[0].context.timeline.getTime()).toBe(500);
      overlay.setProps({layers: layers(0)});
      overlay.render(orthographic, 2000);
      const transitionPosition = new Vector3(...point).project(orthographic);
      const readTransitionPixel = () =>
        readPixel([
          ((transitionPosition.x + 1) * overlay.canvas.width) / 2,
          ((transitionPosition.y + 1) * overlay.canvas.height) / 2
        ]);
      expect(readTransitionPixel()).toEqual([0, 0, 255, 255]);
      overlay.render(orthographic, 2500);
      const middlePixel = readTransitionPixel();
      expect(middlePixel[2]).toBeGreaterThan(0);
      expect(middlePixel[2]).toBeLessThan(255);
      expect(middlePixel[3]).toBe(middlePixel[2]);
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      overlay.render(orthographic, 2500);
      expect(readTransitionPixel()).toEqual(middlePixel);
      overlay.render(orthographic, 3000);
      expect(readTransitionPixel()).toEqual([0, 0, 0, 0]);
      const frames = drawDeck.mock.calls.length;
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      expect(drawDeck).toHaveBeenCalledTimes(frames);
      expect(scheduleDeck).not.toHaveBeenCalled();
      expect(scheduleHost).not.toHaveBeenCalled();
      const distance = perspective.position.length();
      canvas.dispatchEvent(new WheelEvent('wheel', {deltaY: 100, cancelable: true, bubbles: true}));
      controls.update();
      expect(perspective.position.length()).not.toBe(distance);
      overlay.setProps({layers: []});
      overlay.render(orthographic);
      expect(readPixel([150, 90])).toEqual([0, 0, 0, 0]);
      overlay.setProps({layers: layers()});
      overlay.render(perspective);
      container.style.display = 'none';
      overlay.render(perspective);
      expect(overlay.canvas.style.display).toBe('none');
      container.style.display = 'block';
      overlay.render(perspective);
      expect(overlay.canvas.style.display).toBe('block');
      const oldCanvas = overlay.canvas;
      const ownedDevice = drawDeck.mock.contexts.at(-1)!.getCanvasContext()!.device;
      const destroyOverlayDevice = vi.spyOn(ownedDevice, 'destroy');
      overlay.dispose();
      overlay.dispose();
      overlay.render(perspective);
      overlay.setProps({layers: []});
      expect(oldCanvas.isConnected).toBe(false);
      expect(destroyOverlayDevice).toHaveBeenCalledTimes(1);
      expect(disposeHost).not.toHaveBeenCalled();
      expect(disposeGeometry).not.toHaveBeenCalled();
      expect(canvas.isConnected).toBe(true);
      container.style.display = 'none';
      overlay = await ThreeDeckOverlay.create({
        renderer,
        container,
        layers: layers(),
        onError: error => errors.push(error)
      });
      container.style.display = 'block';
      renderer.render(scene, perspective);
      overlay.render(perspective);
      expect(overlay.canvas.getBoundingClientRect().toJSON()).toEqual(
        canvas.getBoundingClientRect().toJSON()
      );
      expect(errors).toEqual([]);
      if (hostContext)
        expect(hostContext.getParameter(hostContext.CURRENT_PROGRAM)).toBe(hostProgram);
    } finally {
      overlay?.dispose();
      // Finish host GPU work before disposing Three and releasing its validation scopes.
      await nativeDevice?.queue.onSubmittedWorkDone();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      hostRenderTarget?.dispose();
      renderer.dispose();
      nativeDevice?.destroy();
      container.remove();
      vi.restoreAllMocks();
    }
  });
}

test('failed overlay device initialization removes its canvas and preserves the host', async () => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  const canvas = document.createElement('canvas');
  container.append(canvas);
  document.body.append(container);
  const renderer = {domElement: canvas, getPixelRatio: () => 1};
  const failure = new Error('Overlay device unavailable');
  const createDevice = vi.spyOn(luma, 'createDevice').mockRejectedValueOnce(failure);
  const errors: Error[] = [];
  try {
    await expect(
      ThreeDeckOverlay.create({renderer, container, onError: error => errors.push(error)})
    ).rejects.toBe(failure);
    expect(container.children.length).toBe(1);
    expect(canvas.parentElement).toBe(container);
    expect(errors).toEqual([failure]);
  } finally {
    createDevice.mockRestore();
    container.remove();
  }
});
