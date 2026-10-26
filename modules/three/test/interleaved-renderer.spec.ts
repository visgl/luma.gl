// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {ScatterplotLayer, PathLayer} from '@deck.gl/layers';
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {AnimationLoop} from '@luma.gl/engine';
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from 'three';
import {ThreeDeckInterleaved, getThreeDeckInterleavedSupport} from '../src/interleaved';

const makeLayers = (depth: number) => [
  new ScatterplotLayer({
    id: 'depth-point',
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: [[0, 0, depth]],
    getPosition: position => position,
    getFillColor: [0, 0, 255],
    billboard: true,
    radiusUnits: 'pixels',
    getRadius: 16
  }),
  new PathLayer({
    id: 'depth-path',
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: [
      {
        path: [
          [-1, 0, depth],
          [1, 0, depth]
        ]
      }
    ],
    getPath: record => record.path,
    getColor: [255, 0, 0],
    widthUnits: 'pixels',
    billboard: true,
    getWidth: 8
  })
];

test('native Three and deck share depth in both drawing orders and survive recreation', async () => {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '200px',
    height: '160px',
    touchAction: 'none',
    cursor: 'crosshair'
  });
  document.body.append(canvas);
  const renderer = new WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true});
  renderer.setSize(200, 160, false);
  const context = renderer.getContext();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({color: 0x00ff00});
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const perspective = new PerspectiveCamera(45, 1.25, 0.1, 100);
  const orthographic = new OrthographicCamera(-2.5, 2.5, 2, -2, 0.1, 100);
  perspective.position.z = orthographic.position.z = 6;
  const hostStyle = canvas.getAttribute('style');
  let integration: ThreeDeckInterleaved | undefined;
  const errors: Error[] = [];
  const readCenter = () => {
    const pixel = new Uint8Array(4);
    context.readPixels(
      canvas.width / 2,
      canvas.height / 2,
      1,
      1,
      context.RGBA,
      context.UNSIGNED_BYTE,
      pixel
    );
    return Array.from(pixel);
  };
  const disposeHost = vi.spyOn(renderer, 'dispose');
  const scheduleHost = vi.spyOn(renderer, 'setAnimationLoop');
  const scheduleDeck = vi.spyOn(AnimationLoop.prototype, '_requestAnimationFrame');
  const moveMouse = vi.spyOn(AnimationLoop.prototype, '_onMousemove');
  const leaveMouse = vi.spyOn(AnimationLoop.prototype, '_onMouseleave');
  try {
    renderer.render(scene, perspective);
    expect(getThreeDeckInterleavedSupport(renderer)).toEqual({
      supported: true,
      sharedDevice: true,
      sharedDepth: true
    });
    integration = await ThreeDeckInterleaved.create({
      renderer,
      layers: makeLayers(-1),
      onError: error => errors.push(error)
    });
    expect(canvas.getAttribute('style')).toBe(hostStyle);
    expect(canvas.hasAttribute('tabindex')).toBe(false);
    expect(canvas.parentElement).toBe(document.body);
    const device = await luma.attachDevice(context, {adapters: [webgl2Adapter]});
    const destroyDevice = vi.spyOn(device, 'destroy');
    for (const camera of [perspective, orthographic]) {
      for (const pixelRatio of [1, 2]) {
        canvas.style.width = pixelRatio === 1 ? '200px' : '240px';
        canvas.style.height = pixelRatio === 1 ? '160px' : '180px';
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        perspective.aspect = canvas.clientWidth / canvas.clientHeight;
        perspective.updateProjectionMatrix();
        integration.setProps({layers: makeLayers(-1)});
        renderer.render(scene, camera);
        const clear = vi.spyOn(context, 'clear');
        const width = canvas.width;
        const height = canvas.height;
        integration.render(camera, 1000);
        expect(clear).not.toHaveBeenCalled();
        clear.mockRestore();
        expect(readCenter()).toEqual([0, 255, 0, 255]);
        expect(canvas.width).toBe(width);
        expect(canvas.height).toBe(height);
        integration.setProps({layers: makeLayers(1)});
        renderer.render(scene, camera);
        integration.render(camera, 1500);
        // The path is drawn after the point at the same depth.
        expect(readCenter(), `${camera.type} at ratio ${pixelRatio}`).toEqual([255, 0, 0, 255]);
        // Later Three geometry behind deck must also fail the same depth test.
        renderer.autoClear = false;
        renderer.render(scene, camera);
        expect(readCenter(), `${camera.type} at ratio ${pixelRatio}`).toEqual([255, 0, 0, 255]);
        renderer.autoClear = true;
      }
    }
    expect(scheduleDeck).not.toHaveBeenCalled();
    expect(scheduleHost).not.toHaveBeenCalled();
    integration.dispose();
    integration.dispose();
    integration.render(perspective);
    integration.setProps({layers: []});
    expect(destroyDevice).not.toHaveBeenCalled();
    expect(disposeHost).not.toHaveBeenCalled();
    expect(context.isContextLost()).toBe(false);
    expect(canvas.isConnected).toBe(true);
    integration = await ThreeDeckInterleaved.create({renderer, layers: makeLayers(-1)});
    renderer.render(scene, perspective);
    integration.render(perspective);
    expect(readCenter()).toEqual([0, 255, 0, 255]);
    integration.dispose();
    renderer.render(scene, perspective);
    expect(readCenter()).toEqual([0, 255, 0, 255]);
    canvas.dispatchEvent(new MouseEvent('mousemove'));
    canvas.dispatchEvent(new MouseEvent('mouseleave'));
    expect(moveMouse).not.toHaveBeenCalled();
    expect(leaveMouse).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
  } finally {
    integration?.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    canvas.remove();
    vi.restoreAllMocks();
  }
});

test('shared depth rejects incompatible depth and rendering surfaces before attachment', async () => {
  const renderer = new WebGLRenderer({depth: false});
  try {
    expect(getThreeDeckInterleavedSupport(renderer).supported).toBe(false);
    await expect(ThreeDeckInterleaved.create({renderer})).rejects.toThrow('depth buffer');
  } finally {
    renderer.dispose();
  }
  const depthRenderer = new WebGLRenderer();
  try {
    depthRenderer.setViewport(1, 0, 20, 20);
    expect(getThreeDeckInterleavedSupport(depthRenderer).supported).toBe(false);
    depthRenderer.setScissorTest(true);
    expect(getThreeDeckInterleavedSupport(depthRenderer).supported).toBe(false);
  } finally {
    depthRenderer.dispose();
  }
});

test('failed shared-device attachment preserves native canvas and renderer state', async () => {
  const renderer = new WebGLRenderer();
  renderer.domElement.style.outline = '2px solid red';
  renderer.domElement.tabIndex = 4;
  const style = renderer.domElement.getAttribute('style');
  const failure = new Error('Attachment unavailable');
  const attachDevice = vi.spyOn(luma, 'attachDevice').mockRejectedValueOnce(failure);
  try {
    await expect(ThreeDeckInterleaved.create({renderer})).rejects.toBe(failure);
    expect(renderer.domElement.getAttribute('style')).toBe(style);
    expect(renderer.domElement.tabIndex).toBe(4);
    expect(renderer.getContext().isContextLost()).toBe(false);
  } finally {
    attachDevice.mockRestore();
    renderer.dispose();
  }
});
