// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Deck, OrbitView} from '@deck.gl/core';
import {PolygonLayer} from '@deck.gl/layers';
import {Buffer, Texture, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {
  Camera,
  Scene,
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  DataTexture,
  DoubleSide,
  NearestFilter,
  WebGPUCoordinateSystem
} from 'three/webgpu';
import {positionLocal, vec3, vec4} from 'three/tsl';
import {ThreeSceneAdapter} from '../src/objects';
import {ThreeSceneLayer, synchronizeThreeCamera, type ThreeScenePickingObject} from '../src/deck';

test('Three scene GPU picking shares deck IDs and depth, preserves alpha holes and TSL deformation', async context => {
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
  const scene = new Scene();
  const camera = new Camera();
  const geometry = new PlaneGeometry(0.8, 0.8);
  const alphaTexture = new DataTexture(
    new Uint8Array([255, 255, 255, 0, 255, 255, 255, 255]),
    2,
    1
  );
  alphaTexture.magFilter = alphaTexture.minFilter = NearestFilter;
  alphaTexture.needsUpdate = true;
  const material = new MeshBasicMaterial({map: alphaTexture, alphaTest: 0.5});
  const deformedMaterial = new MeshBasicNodeMaterial({
    map: alphaTexture,
    alphaTest: 0.5,
    transparent: true,
    side: DoubleSide,
    opacity: 0.75
  });
  deformedMaterial.positionNode = positionLocal.add(vec3(0.5, 0, 0));
  const left = new Group();
  left.position.set(-1, 0, 1);
  left.add(new Mesh(geometry, material));
  const descendant = new Mesh(geometry, material);
  descendant.position.y = 1;
  left.add(descendant);
  const sharedMaterialOccluder = new Mesh(geometry, material);
  sharedMaterialOccluder.position.set(-1, -1, 1);
  scene.add(sharedMaterialOccluder);
  let right = new Group();
  right.position.set(1, 0, 1);
  right.add(new Mesh(geometry, deformedMaterial));
  const occluderMaterial = new MeshBasicMaterial();
  const occluder = new Mesh(geometry, occluderMaterial);
  occluder.position.set(0, 1, 1);
  const transparentMaterial = new MeshBasicMaterial({transparent: true, opacity: 0});
  const transparentOccluderMesh = new Mesh(geometry, transparentMaterial);
  transparentOccluderMesh.position.set(0, -1, 1);
  const premultipliedMaterial = new MeshBasicMaterial({
    color: 0x0000ff,
    transparent: true,
    opacity: 0.5,
    premultipliedAlpha: true
  });
  const premultipliedMesh = new Mesh(geometry, premultipliedMaterial);
  premultipliedMesh.position.set(1, -1, 1);
  scene.add(left, right, occluder, transparentOccluderMesh, premultipliedMesh);
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
  const errors: string[] = [];
  const nativeDevice = device.handle as GPUDevice;
  nativeDevice.addEventListener('uncapturederror', event => errors.push(event.error.message));
  const createPipeline = vi.spyOn(device, 'createRenderPipeline');
  const submit = vi.spyOn(device, 'submit');
  const beginPass = vi.spyOn(device, 'beginRenderPass');
  const originalDrawPicking = adapter.drawPicking.bind(adapter);
  vi.spyOn(adapter, 'drawPicking').mockImplementation((...parameters) => {
    const pass = parameters[2];
    const endPass = vi.spyOn(pass, 'end');
    const submissions = submit.mock.calls.length;
    const passes = beginPass.mock.calls.length;
    try {
      return originalDrawPicking(...parameters);
    } finally {
      expect(endPass).not.toHaveBeenCalled();
      expect(submit.mock.calls.length).toBe(submissions);
      expect(beginPass.mock.calls.length).toBe(passes);
      endPass.mockRestore();
    }
  });
  const disposeGeometry = vi.spyOn(geometry, 'dispose');
  let deck: Deck<OrbitView> | undefined;
  let nativeHeight = 0;
  let reverse = false;
  let highlightedObjectIndex: number | null = null;
  let autoHighlight = false;
  let highlightColor: number[] | ((info: import('@deck.gl/core').PickingInfo) => number[]) = [
    255, 0, 0, 128
  ];
  const readback = device.createBuffer({
    byteLength: 128 * 128 * 4,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  async function pixel(position: [number, number, number]) {
    color.readBuffer({}, readback);
    const pixels = await readback.readAsync();
    const projected = deck!.getViewports()[0].project(position);
    const offset = (Math.floor(projected[1]) * 128 + Math.floor(projected[0])) * 4;
    return Array.from(pixels.slice(offset, offset + 4));
  }
  let entries: ThreeScenePickingObject[] = [
    {id: 'alpha-root', object: left},
    {id: 42, object: right}
  ];
  function createLayers() {
    const three = new ThreeSceneLayer({
      id: 'three',
      adapter,
      scene,
      camera,
      pickable: true,
      pickingObjects: entries,
      highlightedObjectIndex,
      autoHighlight,
      highlightColor
    });
    const native = new PolygonLayer({
      id: 'native',
      data: [{id: 'native-square'}],
      pickable: true,
      getPolygon: () => [
        [-2, -2, nativeHeight],
        [2, -2, nativeHeight],
        [2, 2, nativeHeight],
        [-2, 2, nativeHeight]
      ],
      getFillColor: [0, 255, 0],
      stroked: false,
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
    });
    return reverse ? [native, three] : [three, native];
  }
  async function redraw() {
    await new Promise<void>((resolve, reject) =>
      deck!.setProps({layers: createLayers(), onAfterRender: resolve, onError: reject})
    );
  }
  async function pick(position: [number, number, number]) {
    const projected = deck!.getViewports()[0].project(position);
    return deck!.pickObjectAsync({x: projected[0], y: projected[1]});
  }
  try {
    await adapter.init();
    await new Promise<void>((resolve, reject) => {
      deck = new Deck<OrbitView>({
        device,
        canvas,
        width: 128,
        height: 128,
        useDevicePixels: false,
        style: {position: 'relative'},
        views: new OrbitView({orbitAxis: 'Y', orthographic: true}),
        viewState: {target: [0, 0, 0], zoom: 5, rotationX: 0, rotationOrbit: 0},
        controller: false,
        _framebuffer: framebuffer,
        layers: createLayers(),
        onLoad: resolve,
        onError: reject,
        onBeforeRender: () => {
          synchronizeThreeCamera(camera, deck!.getViewports()[0], WebGPUCoordinateSystem);
          adapter.prepare(scene, camera);
        }
      });
    });
    await redraw();
    for (const order of [false, true]) {
      reverse = order;
      await redraw();
      const alphaHit = await pick([-0.8, 0, 1]);
      expect(alphaHit?.layer?.id).toBe('three');
      expect(alphaHit?.object).toBe(entries[0]);
      expect(alphaHit?.index).toBe(0);
      expect((await pick([-1.2, 0, 1]))?.object.id).toBe('native-square');
      const deformedHit = await pick([1.7, 0, 1]);
      expect(deformedHit?.layer?.id).toBe('three');
      expect(deformedHit?.object).toBe(entries[1]);
      expect(deformedHit?.index).toBe(1);
      expect(await pick([0, 1, 1])).toBeNull();
    }
    // Highlight the final display color, retain alpha holes, and leave other roots untouched.
    // Even zero-alpha unselected surfaces retain their original depth-writing behavior.
    reverse = false;
    await redraw();
    const transparentOccluder = await pixel([0, -1, 1]);
    expect(transparentOccluder).not.toEqual([0, 255, 0, 255]);
    highlightedObjectIndex = 0;
    await redraw();
    expect(await pixel([0, -1, 1])).toEqual(transparentOccluder);
    entries = [...entries, {id: 'transparent-root', object: transparentOccluderMesh}];
    highlightedObjectIndex = 2;
    await redraw();
    expect(await pixel([0, -1, 1])).toEqual(transparentOccluder);
    entries = entries.slice(0, 2);
    highlightedObjectIndex = null;
    reverse = true;
    await redraw();
    const baselinePremultiplied = await pixel([1, -1, 1]);
    const baselineRight = await pixel([1.7, 0, 1]);
    const baselineOccluder = await pixel([0, 1, 1]);
    highlightedObjectIndex = 0;
    await redraw();
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 127, 127, 255]);
    expect(await pixel([-0.8, 1, 1])).toEqual([255, 127, 127, 255]);
    expect(await pixel([-0.8, -1, 1])).toEqual([255, 255, 255, 255]);
    expect(await pixel([-1.2, 0, 1])).toEqual([0, 255, 0, 255]);
    expect(await pixel([1.7, 0, 1])).toEqual(baselineRight);
    expect(await pixel([1, -1, 1])).toEqual(baselinePremultiplied);
    expect(await pixel([0, 1, 1])).toEqual(baselineOccluder);
    expect((await pick([-0.8, 0, 1]))?.object).toBe(entries[0]);
    // A zero alpha tint restores the normal image; RGB defaults to an opaque tint.
    highlightColor = [255, 0, 0, 0];
    await redraw();
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 255, 255, 255]);
    highlightColor = [0, 0, 255];
    highlightedObjectIndex = 1;
    await redraw();
    expect(await pixel([1.7, 0, 1])).toEqual([0, 0, 255, 255]);
    entries = [...entries, {id: 'premultiplied-root', object: premultipliedMesh}];
    highlightedObjectIndex = 2;
    highlightColor = [255, 0, 0, 128];
    await redraw();
    const premultipliedPixel = await pixel([1, -1, 1]);
    // Half-alpha red over half-alpha blue, then over the green native polygon.
    [128, 64, 64, 255].forEach((value, channel) =>
      expect(Math.abs(premultipliedPixel[channel] - value)).toBeLessThanOrEqual(1)
    );
    expect(premultipliedMaterial.premultipliedAlpha).toBe(true);
    expect(premultipliedMaterial.opacity).toBe(0.5);
    entries = entries.slice(0, 2);
    highlightColor = [0, 0, 255];
    highlightedObjectIndex = 1;
    await redraw();
    const highlightedPipelines = createPipeline.mock.calls.length;
    for (const index of [0, 1, 0, 1]) {
      highlightedObjectIndex = index;
      await redraw();
      expect((await pick(index ? [1.7, 0, 1] : [-0.8, 0, 1]))?.index).toBe(index);
    }
    expect(createPipeline.mock.calls.length).toBe(highlightedPipelines);
    expect(material.color.getHex()).toBe(0xffffff);
    expect(deformedMaterial.opacity).toBe(0.75);
    // Exercise deck's own hover/accessor path on the managed layer, including mouse leave.
    highlightedObjectIndex = null;
    autoHighlight = true;
    const getHighlightColor = vi.fn(() => [255, 0, 0, 255]);
    highlightColor = getHighlightColor;
    await redraw();
    const hit = (await pick([-0.8, 0, 1]))!;
    hit.color = hit.layer!.encodePickingColor(hit.index);
    hit.layer!.updateAutoHighlight(hit);
    await redraw();
    expect(getHighlightColor).toHaveBeenCalledWith(hit);
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 0, 0, 255]);
    hit.layer!.updateAutoHighlight({...hit, picked: false, index: -1, object: undefined});
    await redraw();
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 255, 255, 255]);
    // A controlled negative index suppresses automatic highlighting.
    highlightedObjectIndex = -1;
    await redraw();
    (await pick([-0.8, 0, 1]))!.layer!.updateAutoHighlight(hit);
    await redraw();
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 255, 255, 255]);
    autoHighlight = false;
    highlightedObjectIndex = null;
    highlightColor = [255, 0, 0, 128];
    nativeHeight = 2;
    highlightedObjectIndex = 0;
    await redraw();
    expect((await pick([-0.8, 0, 1]))?.object.id).toBe('native-square');
    expect(await pixel([-0.8, 0, 1])).toEqual([0, 255, 0, 255]);
    highlightedObjectIndex = null;
    nativeHeight = 0;
    left.visible = false;
    occluder.visible = false;
    await redraw();
    expect((await pick([-0.8, 0, 1]))?.object.id).toBe('native-square');
    expect((await pick([0, 1, 1]))?.object.id).toBe('native-square');
    left.visible = true;
    scene.remove(right);
    right = new Group();
    right.position.set(1, 0, 1);
    right.add(new Mesh(geometry, deformedMaterial));
    scene.add(right);
    entries = [
      {id: 42, object: right},
      {id: 'alpha-root', object: left}
    ];
    await redraw();
    const replacement = await pick([1.7, 0, 1]);
    expect(replacement?.object.id).toBe(42);
    expect(replacement?.object.object).toBe(right);
    expect(replacement?.index).toBe(0);
    const objects = await deck!.pickObjectsAsync({x: 0, y: 0, width: 128, height: 128});
    expect(new Set(objects.map(info => info.object.id))).toEqual(
      new Set(['native-square', 'alpha-root', 42])
    );
    await redraw();
    await pick([1.7, 0, 1]);
    const pipelines = createPipeline.mock.calls.length;
    for (let frame = 0; frame < 3; frame++) {
      await redraw();
      expect((await pick([1.7, 0, 1]))?.object.id).toBe(42);
    }
    expect(createPipeline.mock.calls.length).toBe(pipelines);
    expect(deformedMaterial.forceSinglePass).toBe(false);
    const renderObject = adapter.renderer.getRenderObjectFunction();
    const contextNode = adapter.renderer.contextNode;
    const rejectedPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    const endRejectedPass = vi.spyOn(rejectedPass, 'end');
    deformedMaterial.fragmentNode = vec4(1, 0, 0, 1);
    expect(() =>
      adapter.drawPicking(scene, camera, rejectedPass, () => [1 / 255, 0, 0, 1])
    ).toThrow('fragmentNode');
    expect(() => adapter.drawHighlighted(scene, camera, rejectedPass, () => [1, 0, 0, 1])).toThrow(
      'fragmentNode'
    );
    expect(endRejectedPass).not.toHaveBeenCalled();
    expect(adapter.renderer.getRenderObjectFunction()).toBe(renderObject);
    expect(adapter.renderer.contextNode).toBe(contextNode);
    rejectedPass.end();
    device.submit();
    deformedMaterial.fragmentNode = null;
    await redraw();
    expect((await pick([1.7, 0, 1]))?.object.id).toBe(42);
    highlightedObjectIndex = 0;
    highlightColor = [0, 0, 255, 255];
    await redraw();
    expect(await pixel([1.7, 0, 1])).toEqual([0, 0, 255, 255]);
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 255, 255, 255]);
    deck!.finalize();
    deck = undefined;
    expect(disposeGeometry).not.toHaveBeenCalled();
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    deck?.finalize();
    adapter.dispose();
    geometry.dispose();
    material.dispose();
    deformedMaterial.dispose();
    occluderMaterial.dispose();
    transparentMaterial.dispose();
    premultipliedMaterial.dispose();
    alphaTexture.dispose();
    readback.destroy();
    framebuffer.destroy();
    color.destroy();
    device.destroy();
    canvas.remove();
  }
}, 60000);
