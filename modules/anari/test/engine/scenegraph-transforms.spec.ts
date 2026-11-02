// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  CubeGeometry,
  Geometry,
  GroupNode,
  Model,
  type ScenegraphTransformFrame
} from '@luma.gl/engine';
import {PhysicsController} from '@luma.gl/engine/physics';
import {SceneRenderer, SceneMeshNode, DeferredSceneRenderer} from '@luma.gl/anari';
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
    for (const renderMode of ['debugNormals', 'debugDepth'] as const)
      expect(await renderer.pick({...options, renderMode}, {x: 48, y: 32})).toBe(first);
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

test('alpha-masked GPU meshes keep identity picking consistent through the deferred forward path', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const texture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([255, 255, 255, 0])
  });
  const matrices = device.createBuffer({
    usage: Buffer.STORAGE,
    data: new Float32Array(new Matrix4().translate([0, 0, 0.5]))
  });
  const node = new SceneMeshNode({
    id: 'masked',
    geometry: new CubeGeometry(),
    material: {
      id: 'masked',
      alphaMode: 'MASK',
      uniforms: {alphaCutoff: 0.5},
      bindings: {pbr_baseColorSampler: texture}
    }
  });
  const scene = new GroupNode({
    children: [node],
    transformSource: {
      getFrame: () => ({
        matrices,
        matrixCount: 1,
        revision: 0,
        bindings: new Map([
          [node, {matrixIndex: 0, localMatrix: new Matrix4().scale([0.2, 0.2, 0.2])}]
        ])
      })
    }
  });
  const renderer = new DeferredSceneRenderer(device);
  const options = {scene, camera, width: 32, height: 32};
  try {
    expect(await renderer.pick(options, {x: 16, y: 16})).toBeUndefined();
    texture.writeData(new Uint8Array([255, 255, 255, 255]));
    expect(await renderer.pick(options, {x: 16, y: 16})).toBe(node);
    renderer.destroyScene(scene);
    expect(texture.destroyed).toBe(false);
  } finally {
    renderer.destroy();
    texture.destroy();
    matrices.destroy();
    scene.destroy();
  }
});

test('disposing a queued controller preparation cannot leave a source attached to the scene', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const node = new SceneMeshNode({id: 'box', geometry: new CubeGeometry(), material: {id: 'box'}});
  const scene = new GroupNode({children: [node]});
  const physics = new PhysicsController(device, {scene});
  physics.addBody(node);
  const preparation = physics.prepare();
  const destruction = physics.destroy();
  const [result] = await Promise.allSettled([preparation, destruction]);
  expect(result.status).toBe('rejected');
  expect(scene.transformSource).toBeNull();
  expect(physics.transformSource.getFrame()).toBeNull();
  scene.destroy();
});

test('spot shadows bind opaque capture models before physical transmission samples them', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const geometry = new CubeGeometry();
  const background = new SceneMeshNode({
    geometry,
    matrix: new Matrix4().translate([0, 0, 0.75]).scale([0.8, 0.8, 0.05]),
    material: {id: 'opaque-red', uniforms: {unlit: true, baseColorFactor: [1, 0.01, 0.01, 1]}}
  });
  const glass = new SceneMeshNode({
    geometry,
    matrix: new Matrix4().translate([0, 0, 0.3]).scale([0.4, 0.4, 0.05]),
    material: {
      id: 'glass',
      doubleSided: true,
      uniforms: {
        baseColorFactor: [1, 1, 1, 1],
        metallicRoughnessValues: [0, 0.05],
        transmissionFactor: 1,
        thicknessFactor: 0.01,
        ior: 1.5
      }
    }
  });
  const scene = new GroupNode({children: [background, glass]});
  const renderer = new SceneRenderer(device);
  const color = device.createTexture({
    width: 32,
    height: 32,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 32,
    height: 32,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const readback = device.createBuffer({
    byteLength: color.computeMemoryLayout({width: 1, height: 1}).byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    expect(
      renderer.render({
        scene,
        camera,
        framebuffer,
        background: [0, 0, 0, 1],
        outputColorSpace: 'linear',
        toneMapMode: 0,
        lights: [{type: 'spot', position: [0, 0, 3], direction: [0, 0, -1]}],
        spotShadows: {
          mapSize: 128,
          spotLights: [{position: [0, 0, 3], direction: [0, 0, -1], outerConeAngle: 0.6, range: 10}]
        }
      }).drawCount
    ).toBe(2);
    device.submit();
    color.readBuffer({x: 16, y: 16, width: 1, height: 1}, readback);
    const pixel = await readback.readAsync();
    expect(pixel[0]).toBeGreaterThan(pixel[1] * 2);
    expect(pixel[0]).toBeGreaterThan(100);
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    color.destroy();
    readback.destroy();
    scene.destroy();
  }
});

test('blended scenegraph leaves sort independently against an interleaved material', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])}
    }
  });
  const red = {
    id: 'red-blend',
    alphaMode: 'BLEND' as const,
    uniforms: {unlit: true, baseColorFactor: [1, 0, 0, 0.5]}
  };
  const green = {
    id: 'green-blend',
    alphaMode: 'BLEND' as const,
    uniforms: {unlit: true, baseColorFactor: [0, 1, 0, 0.5]}
  };
  // Deliberately author near-first, far-second; the green object belongs between them.
  const scene = new GroupNode({
    children: [
      new SceneMeshNode({geometry, material: red, position: [0, 0, 0.5]}),
      new SceneMeshNode({geometry, material: red, position: [0, 0, -0.5]}),
      new SceneMeshNode({geometry, material: green})
    ]
  });
  const renderer = new SceneRenderer(device);
  const color = device.createTexture({
    width: 32,
    height: 32,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 32,
    height: 32,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const readback = device.createBuffer({
    byteLength: color.computeMemoryLayout({width: 1, height: 1}).byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 3], center: [0, 0, 0], up: [0, 1, 0]});
    const projectionMatrix = new Matrix4([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
    ]).multiplyRight(new Matrix4().perspective({fovy: Math.PI / 3, aspect: 1, near: 0.1, far: 10}));
    expect(
      renderer.render({
        scene,
        framebuffer,
        camera: {viewMatrix, projectionMatrix, position: [0, 0, 3]},
        background: [0, 0, 0, 1],
        toneMapMode: 0,
        outputColorSpace: 'linear'
      }).drawCount
    ).toBe(3);
    device.submit();
    color.readBuffer({x: 16, y: 16, width: 1, height: 1}, readback);
    const pixel = await readback.readAsync();
    expect(pixel[0]).toBeGreaterThan(pixel[1] * 1.5);
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    color.destroy();
    readback.destroy();
    scene.destroy();
  }
});

test('the first GPU shadowed frame matches subsequent frames and darkens the receiver', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const geometry = new CubeGeometry();
  const material = {
    id: 'diffuse',
    uniforms: {baseColorFactor: [0.6, 0.6, 0.6, 1], metallicRoughnessValues: [0, 1]}
  };
  const floor = new SceneMeshNode({geometry, material});
  const box = new SceneMeshNode({geometry, material});
  const matrices = device.createBuffer({
    usage: Buffer.STORAGE,
    data: new Float32Array([
      ...new Matrix4().translate([0, 0, -0.05]),
      ...new Matrix4().translate([0, 0, 0.5])
    ])
  });
  const scene = new GroupNode({
    children: [floor, box],
    transformSource: {
      getFrame: () => ({
        matrices,
        matrixCount: 2,
        revision: 0,
        bindings: new Map([
          [floor, {matrixIndex: 0, localMatrix: new Matrix4().scale([2, 2, 0.05])}],
          [box, {matrixIndex: 1, localMatrix: new Matrix4().scale([0.2, 0.2, 0.5])}]
        ])
      })
    }
  });
  const renderer = new SceneRenderer(device);
  const color = device.createTexture({
    width: 64,
    height: 64,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 64,
    height: 64,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const readback = device.createBuffer({
    byteLength: color.computeMemoryLayout().byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  const projectionMatrix = new Matrix4([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
  ]).multiplyRight(new Matrix4().perspective({fovy: Math.PI / 3, aspect: 1, near: 0.1, far: 10}));
  const options = {
    scene,
    framebuffer,
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [3, -3, 4], center: [0, 0, 0], up: [0, 0, 1]}),
      projectionMatrix,
      position: [3, -3, 4]
    },
    lights: [
      {
        type: 'spot' as const,
        color: [1, 1, 1] as const,
        position: [-2, 0, 3] as const,
        direction: [2, 0, -3] as const,
        intensity: 1,
        outerConeAngle: 0.7,
        innerConeAngle: 0.5
      }
    ],
    spotShadows: {
      mapSize: 256,
      spotLights: [
        {
          position: [-2, 0, 3] as const,
          direction: [2, 0, -3] as const,
          outerConeAngle: 0.7,
          range: 10,
          normalBias: 0.005,
          sourceRadius: 0.01
        }
      ]
    },
    toneMapMode: 0,
    outputColorSpace: 'linear' as const
  };
  const renderImage = async (shadowed: boolean) => {
    renderer.render({...options, spotShadows: shadowed ? options.spotShadows : undefined});
    device.submit();
    color.readBuffer({}, readback);
    return readback.readAsync();
  };
  try {
    const first = await renderImage(true);
    const second = await renderImage(true);
    expect(
      first.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - second[index])), 0)
    ).toBeLessThanOrEqual(1);
    const unshadowed = await renderImage(false);
    expect(first.some((value, index) => index % 4 === 0 && unshadowed[index] > value + 20)).toBe(
      true
    );
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    color.destroy();
    readback.destroy();
    matrices.destroy();
    scene.destroy();
  }
});
