// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Deck, OrbitView} from '@deck.gl/core';
import {PolygonLayer} from '@deck.gl/layers';
import {Buffer, Texture, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {
  Camera,
  Matrix4,
  Vector3,
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
import {Fn, cameraProjectionMatrix, positionView, positionLocal, vec3, vec4} from 'three/tsl';
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
  deformedMaterial.positionNode = positionLocal.add(vec3(0.5, 0, 0.25));
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
  const originalDrawPickingDepth = adapter.drawPickingDepth.bind(adapter);
  const drawPickingDepth = vi
    .spyOn(adapter, 'drawPickingDepth')
    .mockImplementation((...parameters) => {
      const end = vi.spyOn(parameters[2], 'end');
      const submissions = submit.mock.calls.length;
      const passes = beginPass.mock.calls.length;
      try {
        return originalDrawPickingDepth(...parameters);
      } finally {
        expect(end).not.toHaveBeenCalled();
        expect(submit.mock.calls.length).toBe(submissions);
        expect(beginPass.mock.calls.length).toBe(passes);
        end.mockRestore();
      }
    });
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
  let orthographic = true;
  let rotation = 0;
  let modelMatrix: number[] | undefined;
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
      modelMatrix,
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
      deck!.setProps({
        layers: createLayers(),
        views: new OrbitView({orbitAxis: 'Y', orthographic}),
        viewState: {
          target: [0, 0, 0],
          zoom: rotation ? 4 : 5,
          rotationX: rotation,
          rotationOrbit: rotation
        },
        onAfterRender: resolve,
        onError: reject
      })
    );
  }
  async function pick(position: [number, number, number], unproject3D = false) {
    const projected = deck!.getViewports()[0].project(position);
    return deck!.pickObjectAsync({x: projected[0], y: projected[1], unproject3D});
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
        getCursor: ({isHovering}) => (isHovering ? 'pointer' : 'default'),
        _framebuffer: framebuffer,
        layers: createLayers(),
        onLoad: resolve,
        onError: reject,
        onBeforeRender: () => {
          synchronizeThreeCamera(
            camera,
            deck!.getViewports()[0],
            WebGPUCoordinateSystem,
            undefined,
            modelMatrix
          );
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
      expect(device.isTextureFormatRenderable('rgba32float')).toBe(true);
      const depthHit = await pick([-0.8, 0, 1], true);
      expect(drawPickingDepth).toHaveBeenCalled();
      expect(depthHit?.object).toBe(entries[0]);
      expect(depthHit?.coordinate?.[0]).toBeCloseTo(-0.8, 3);
      expect(depthHit?.coordinate?.[1]).toBeCloseTo(0, 3);
      expect(depthHit?.coordinate?.[2]).toBeCloseTo(1, 3);
      const deformedDepthHit = await pick([1.7, 0, 1.25], true);
      expect(deformedDepthHit?.object).toBe(entries[1]);
      expect(deformedDepthHit?.coordinate?.[2]).toBeCloseTo(1.25, 3);
      expect(await pick([0, 1, 1])).toBeNull();
    }
    // Layer placement affects visible color, IDs, highlights and the sampled surface together.
    // Compare depth against a ray/plane intersection in the unchanged source scene frame.
    const sourceMatrices = [scene, left, right, descendant].map(object =>
      object.matrixWorld.clone()
    );
    const placements = [
      new Matrix4()
        .makeTranslation(0.2, -0.1, 0.3)
        .multiply(new Matrix4().makeRotationZ(0.2))
        .multiply(new Matrix4().makeScale(0.8, 1.1, 1.2)),
      new Matrix4()
        .makeTranslation(-0.1, 0.2, 0.2)
        .multiply(new Matrix4().makeRotationX(0.15))
        .multiply(new Matrix4().makeScale(0.9, 0.8, 1.1))
    ];
    for (const placement of placements) {
      modelMatrix = placement.elements;
      const inversePlacement = placement.clone().invert();
      for (const order of [false, true]) {
        reverse = order;
        highlightedObjectIndex = 0;
        await redraw();
        const point = new Vector3(-0.8, 0, 1).applyMatrix4(placement);
        const position: [number, number, number] = [point.x, point.y, point.z];
        expect(await pixel(position)).toEqual([255, 127, 127, 255]);
        const hit = await pick(position, true);
        expect(hit?.object).toBe(entries[0]);
        const viewport = deck!.getViewports()[0];
        const sampledPixel = hit!.devicePixel!;
        const sampleX = sampledPixel[0] + 0.5;
        const sampleY = 128 - sampledPixel[1] - 0.5;
        const near = new Vector3()
          .fromArray(viewport.unproject([sampleX, sampleY, -1]))
          .applyMatrix4(inversePlacement);
        const far = new Vector3()
          .fromArray(viewport.unproject([sampleX, sampleY, 1]))
          .applyMatrix4(inversePlacement);
        const intersection = near
          .clone()
          .lerp(far, (1 - near.z) / (far.z - near.z))
          .applyMatrix4(placement);
        const projected = viewport.project(position);
        const expected = viewport.unproject([
          projected[0],
          projected[1],
          viewport.project(intersection.toArray())[2]
        ]);
        expected.forEach((value, index) => expect(hit!.coordinate![index]).toBeCloseTo(value, 3));
        const hole = new Vector3(-1.2, 0, 1).applyMatrix4(placement);
        expect((await pick([hole.x, hole.y, hole.z]))?.object.id).toBe('native-square');
        // Raising native geometry still occludes the placed Three surface in either order.
        nativeHeight = 2;
        await redraw();
        expect((await pick(position))?.object.id).toBe('native-square');
        nativeHeight = 0;
      }
    }
    modelMatrix = undefined;
    highlightedObjectIndex = null;
    await redraw();
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 255, 255, 255]);
    expect((await pick([-0.8, 0, 1]))?.object).toBe(entries[0]);
    [scene, left, right, descendant].forEach((object, index) =>
      expect(object.matrixWorld.elements).toEqual(sourceMatrices[index].elements)
    );
    // Highlight the final display color, retain alpha holes, and leave other roots untouched.
    for (const useOrthographic of [false, true]) {
      orthographic = useOrthographic;
      rotation = 25;
      await redraw();
      for (const [position, altitude, identity] of [
        [[-0.8, 0, 1], 1, 'alpha-root'],
        [[1.7, 0, 1.25], 1.25, 42]
      ] as const) {
        const projected = deck!.getViewports()[0].project([...position]);
        const hit = await deck!.pickObjectAsync({
          x: Math.floor(projected[0]) + 0.5,
          y: Math.floor(projected[1]) + 0.5,
          unproject3D: true
        });
        expect(hit?.object.id).toBe(identity);
        // deck samples a device pixel but unprojects the requested CSS position.
        // Use the sampled pixel's ray to account for this subpixel quantization.
        const viewport = deck!.getViewports()[0];
        const sampledPixel = hit!.devicePixel!;
        const sampleX = sampledPixel[0] + 0.5;
        const sampleY = 128 - sampledPixel[1] - 0.5;
        const near = viewport.unproject([sampleX, sampleY, -1]);
        const far = viewport.unproject([sampleX, sampleY, 1]);
        const fraction = (altitude - near[2]) / (far[2] - near[2]);
        const point = near.map((value, index) => value + (far[index] - value) * fraction);
        const depth = viewport.project(point)[2];
        const expected = viewport.unproject([
          Math.floor(projected[0]) + 0.5,
          Math.floor(projected[1]) + 0.5,
          depth
        ]);
        expected.forEach((value, index) => expect(hit!.coordinate![index]).toBeCloseTo(value, 3));
      }
    }
    orthographic = true;
    rotation = 0;
    await redraw();
    // A custom vertex node can change clip depth independently of positionView.
    const originalPosition = deck!.getViewports()[0].project([1.7, 0, 1.25]);
    const targetDepth = deck!.getViewports()[0].project([1.7, 0, 1.5])[2];
    const clipDepthOffset = (targetDepth - originalPosition[2]) / 2;
    deformedMaterial.vertexNode = Fn(() => {
      const projectedPosition = cameraProjectionMatrix.mul(vec4(positionView, 1));
      return projectedPosition.add(vec4(0, 0, projectedPosition.w.mul(clipDepthOffset), 0));
    })();
    deformedMaterial.needsUpdate = true;
    await redraw();
    const customDepthHit = await pick([1.7, 0, 1.25], true);
    const customExpected = deck!
      .getViewports()[0]
      .unproject([originalPosition[0], originalPosition[1], targetDepth]);
    expect(customDepthHit?.object).toBe(entries[1]);
    customExpected.forEach((value, index) =>
      expect(customDepthHit!.coordinate![index]).toBeCloseTo(value, 3)
    );
    deformedMaterial.vertexNode = null;
    deformedMaterial.needsUpdate = true;
    await redraw();
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
    const getHighlightColor = vi.fn<(pickingInfo: import('@deck.gl/core').PickingInfo) => number[]>(
      () => [255, 0, 0, 255]
    );
    highlightColor = getHighlightColor;
    await redraw();
    const hit = (await pick([-0.8, 0, 1]))!;
    const projected = deck!.getViewports()[0].project([-0.8, 0, 1]);
    const bounds = canvas.getBoundingClientRect();
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        clientX: bounds.left + projected[0],
        clientY: bounds.top + projected[1],
        bubbles: true
      })
    );
    await vi.waitFor(() => expect(getHighlightColor).toHaveBeenCalled(), {timeout: 5000});
    expect(getHighlightColor.mock.calls[0][0].object).toBe(entries[0]);
    await redraw();
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 0, 0, 255]);
    const hoveredLayer = (await pick([-0.8, 0, 1]))!.layer as ThreeSceneLayer;
    canvas.dispatchEvent(new MouseEvent('mouseleave', {clientX: -1, clientY: -1}));
    await vi.waitFor(() => expect(hoveredLayer.state.highlightedObjectColor).toBeNull(), {
      timeout: 5000
    });
    await redraw();
    expect(await pixel([-0.8, 0, 1])).toEqual([255, 255, 255, 255]);
    expect(getComputedStyle(canvas).cursor).toBe('default');
    // Native layers use the same leave cleanup, including their empty picking callback.
    const onNativeHover = vi.fn();
    deck!.setProps({onHover: onNativeHover});
    const nativePosition = deck!.getViewports()[0].project([-1.2, 0, 1]);
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        clientX: bounds.left + nativePosition[0],
        clientY: bounds.top + nativePosition[1],
        bubbles: true
      })
    );
    await vi.waitFor(
      () =>
        expect(onNativeHover).toHaveBeenCalledWith(
          expect.objectContaining({
            picked: true,
            object: expect.objectContaining({id: 'native-square'})
          }),
          expect.anything()
        ),
      {timeout: 5000}
    );
    canvas.dispatchEvent(new MouseEvent('mouseleave', {clientX: -1, clientY: -1}));
    await vi.waitFor(() => expect(onNativeHover.mock.lastCall?.[0].picked).toBe(false), {
      timeout: 5000
    });
    await redraw();
    expect(getComputedStyle(canvas).cursor).toBe('default');
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
    await pick([1.7, 0, 1.25], true);
    const pipelines = createPipeline.mock.calls.length;
    for (let frame = 0; frame < 3; frame++) {
      await redraw();
      expect((await pick([1.7, 0, 1.25], true))?.object.id).toBe(42);
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
    expect(() => adapter.drawPickingDepth(scene, camera, rejectedPass, () => [1, 0, 0, 1])).toThrow(
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
