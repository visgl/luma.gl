// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {CubeGeometry, GroupNode, Model, type ScenegraphTransformFrame} from '@luma.gl/engine';
import {PhysicsController} from '@luma.gl/engine/physics';
import {SceneRenderer, SceneMeshNode} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core';
import {expect, test} from 'vitest';

const camera = {viewMatrix: new Matrix4(), projectionMatrix: new Matrix4(), position: [0, 0, 2]};

test('retained color, depth, picking and shadow passes use current borrowed GPU matrices', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const renderer = new SceneRenderer(device);
  const material = {id: 'red', uniforms: {unlit: true, baseColorFactor: [1, 0, 0, 1]}};
  const geometry = new CubeGeometry();
  const first = new SceneMeshNode({
    id: 'duplicate',
    geometry,
    material,
    matrix: new Matrix4().translate([-0.6, 0, 0.5]).scale([0.15, 0.15, 0.15])
  });
  const second = new SceneMeshNode({
    id: 'duplicate',
    geometry,
    material,
    matrix: new Matrix4().translate([-0.6, 0, 0.5]).scale([0.1, 0.1, 0.1])
  });
  const matrices = device.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_DST,
    data: new Float32Array([
      ...new Matrix4().translate([0.5, 0, 0.5]),
      ...new Matrix4().translate([-0.5, 0, 0.5])
    ])
  });
  const replacement = device.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_DST,
    data: new Float32Array([
      ...new Matrix4().translate([-0.5, 0, 0.5]),
      ...new Matrix4().translate([0.5, 0, 0.5])
    ])
  });
  let frame: ScenegraphTransformFrame = {
    matrices,
    matrixCount: 2,
    revision: 0,
    bindings: new Map([
      [first, {matrixIndex: 0, localMatrix: new Matrix4().scale([0.15, 0.15, 0.15])}],
      [second, {matrixIndex: 1, localMatrix: new Matrix4().scale([0.1, 0.1, 0.1])}]
    ])
  };
  const scene = new GroupNode({
    children: [first, second],
    transformSource: {getFrame: () => frame}
  });
  const color = device.createTexture({
    width: 64,
    height: 64,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const depth = device.createTexture({
    width: 64,
    height: 64,
    format: 'depth32float',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 64,
    height: 64,
    colorAttachments: [color],
    depthStencilAttachment: depth
  });
  const overlay = new Model(device, {
    source: `@vertex fn vertexMain(@builtin(vertex_index) index:u32)->@builtin(position) vec4f {
      let points=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
      return vec4f(points[index],0.9,1);
    }
    @fragment fn fragmentMain()->@location(0) vec4f {return vec4f(0,1,0,1);}`,
    vertexCount: 3,
    parameters: {depthCompare: 'less', depthWriteEnabled: false}
  });
  const depthFramebuffer = device.createFramebuffer({
    width: 64,
    height: 64,
    colorAttachments: [],
    depthStencilAttachment: depth
  });
  const options = {scene, camera, framebuffer, outputColorSpace: 'linear' as const};
  const readPixel = async (x: number) => {
    const layout = color.computeMemoryLayout({width: 1, height: 1});
    const readback = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      color.readBuffer({x, y: 32, width: 1, height: 1}, readback);
      return (await readback.readAsync(0, layout.byteLength))[0];
    } finally {
      readback.destroy();
    }
  };
  try {
    const statistics = renderer.render(options);
    device.submit();
    expect(statistics.drawCount).toBe(1); // Shared geometry, material and producer are instanced.
    expect(statistics.instanceCount).toBe(2);
    expect(await readPixel(48)).toBeGreaterThan(200);
    expect(await readPixel(32)).toBe(0);
    expect(await renderer.pick(options, {x: 48, y: 32})).toBe(first);
    expect(await renderer.pick(options, {x: 16, y: 32})).toBe(second);
    expect(await renderer.pick(options, {x: 32, y: 32})).toBeUndefined();
    renderer.render({...options, framebuffer: depthFramebuffer, rasterPass: 'depth'});
    device.submit();
    const overlayPass = device.beginRenderPass({framebuffer, clearColor: false, clearDepth: false});
    overlay.draw(overlayPass);
    overlayPass.end();
    device.submit();
    expect(await readPixel(48)).toBeGreaterThan(200); // GPU-moved depth occludes the green overlay.
    expect(await readPixel(32)).toBe(0);
    frame = {...frame, matrices: replacement, revision: 1};
    renderer.render(options);
    device.submit();
    expect(await renderer.pick(options, {x: 16, y: 32})).toBe(first);
    expect(first.matrix[12]).toBe(-0.6);
    second.display = false;
    scene.add(
      new SceneMeshNode({
        id: 'rod',
        geometry,
        material,
        connection: {first: 0, second: 1, radius: 0.02}
      })
    );
    expect(
      renderer.render({
        ...options,
        lights: [{type: 'spot', position: [0, 0, 3], direction: [0, 0, -1]}],
        spotShadows: {
          mapSize: 128,
          spotLights: [{position: [0, 0, 3], direction: [0, 0, -1], range: 10, outerConeAngle: 0.6}]
        }
      }).instanceCount
    ).toBe(2);
    device.submit();
    renderer.destroyScene(scene);
    expect(matrices.destroyed).toBe(false);
    expect(replacement.destroyed).toBe(false);
  } finally {
    device.submit();
    renderer.destroy();
    overlay.destroy();
    framebuffer.destroy();
    depthFramebuffer.destroy();
    color.destroy();
    depth.destroy();
    matrices.destroy();
    replacement.destroy();
    scene.destroy();
  }
});

test('PhysicsController publishes through the scene and detaches on disposal', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const box = new SceneMeshNode({
    id: 'box',
    geometry: new CubeGeometry(),
    matrix: new Matrix4().translate([0, 0, 0.5]).scale([0.1, 0.1, 0.1]),
    material: {id: 'box', uniforms: {unlit: true}}
  });
  const scene = new GroupNode({children: [box]});
  const physics = new PhysicsController(device, {scene, gravity: [0, 0, 0], timeStep: 0.1});
  const renderer = new SceneRenderer(device);
  physics.addBody('/box', {velocity: [1, 0, 0]});
  try {
    await physics.prepare();
    const source = scene.transformSource!;
    const original = source.getFrame()!;
    expect(original.bindings.get(box)?.matrixIndex).toBe(0);
    physics.update(0.4);
    expect(await renderer.pick({scene, camera, width: 64, height: 64}, {x: 44, y: 32})).toBe(box);
    expect(box.matrix[12]).toBe(0);
    const reset = physics.reset();
    expect(source.getFrame()).toBeNull();
    await reset;
    expect(scene.transformSource).toBe(source);
    expect(source.getFrame()!.revision).toBeGreaterThan(original.revision);
    expect(await renderer.pick({scene, camera, width: 64, height: 64}, {x: 32, y: 32})).toBe(box);
    renderer.destroyScene(scene);
    await physics.destroy();
    expect(scene.transformSource).toBeNull();
    expect(source.getFrame()).toBeNull();
  } finally {
    renderer.destroy();
    await physics.destroy();
    scene.destroy();
  }
});
