// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('glTF crowds draw independent SimpleSkin actors in one real WebGL and WebGPU call', async () => {
  const source = postProcessGLTF(
    await load('/examples/showcase/scene/public/gltf/SimpleSkin.gltf', GLTFLoader, {
      gltf: {loadImages: false}
    })
  );
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const device of devices) {
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 8});
    const colorTexture = device.createTexture({
      width: 32,
      height: 32,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });

    try {
      const [first, second, third] = crowd.addActors([
        {id: 'left', phase: 0, transform: new Matrix4().translate([-0.5, 0, 0])},
        {id: 'center', phase: 0.35, transform: new Matrix4()},
        {id: 'right', phase: 0.7, speed: 2, transform: new Matrix4().translate([0.5, 0, 0])}
      ]);
      const model = crowd.models[0];
      const identity = Array.from(new Matrix4());
      model.shaderInputs.setProps({
        pbrProjection: {
          modelViewProjectionMatrix: identity,
          modelMatrix: identity,
          normalMatrix: identity,
          camera: [0, 0, 4]
        }
      });

      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      const drawCount = crowd.draw(renderPass);
      renderPass.end();
      device.submit();

      if (
        device.info.gpu !== 'software' &&
        device.info.gpuType !== 'cpu' &&
        !device.info.fallback
      ) {
        const memoryLayout = colorTexture.computeMemoryLayout({width: 32, height: 32});
        const readbackBuffer = device.createBuffer({
          byteLength: memoryLayout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        try {
          colorTexture.readBuffer({width: 32, height: 32}, readbackBuffer);
          const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
          expect(
            Boolean(pixels.some((value, index) => index % 4 === 3 && value > 0)),
            `${device.type} writes visible crowd geometry into the real framebuffer`
          ).toBe(true);
        } finally {
          readbackBuffer.destroy();
        }
      }

      expect(drawCount, `${device.type} submits one shared primitive draw`).toBe(1);
      expect(model.instanceCount, `${device.type} draws all three actor instances`).toBe(3);
      expect(
        Boolean(model.isInstanced),
        `${device.type} enables instanced primitive rendering`
      ).toBe(true);
      expect(
        Array.from(first.skins.bindings[0].jointMatrices),
        `${device.type} preserves independent actor joint poses`
      ).not.toEqual(Array.from(second.skins.bindings[0].jointMatrices));
      const resource = crowd.primitiveGroups[0].skinJointMatrices;
      expect(
        Boolean(
          device.type === 'webgpu' ? resource instanceof Buffer : resource instanceof Texture
        ),
        `${device.type} selects its native crowd palette binding`
      ).toBe(true);

      const initialModel = model;
      const initialThirdTime = third.time;
      crowd.update(0.1);
      expect(crowd.models[0], `${device.type} reuses its compiled model`).toBe(initialModel);
      expect(
        Boolean(third.time > initialThirdTime),
        `${device.type} advances actor-local playback`
      ).toBe(true);

      const updatedRenderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      expect(
        crowd.draw(updatedRenderPass),
        `${device.type} keeps draw count constant after animation`
      ).toBe(1);
      updatedRenderPass.end();
      device.submit();
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  expect(Boolean(devices.length > 0), 'at least one live graphics backend is exercised').toBe(true);
  void 0;
});

it('glTF crowds select independent authored skin LODs in real WebGL and WebGPU draws', async () => {
  const source = postProcessGLTF(
    await load('/modules/gltf/test/data/SimpleSkinLOD.gltf', GLTFLoader, {
      gltf: {loadImages: false}
    })
  );
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const device of devices) {
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 8,
      lod: {enabled: true, hysteresis: 0}
    });
    const colorTexture = device.createTexture({
      width: 64,
      height: 64,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 64,
      height: 64,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 64,
      height: 64,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });

    try {
      const [near, middle, far] = crowd.addActors([
        {id: 'near', phase: 0, transform: new Matrix4().translate([-0.3, 0, -1.5])},
        {id: 'middle', phase: 0.25, transform: new Matrix4().translate([0, 0, -4])},
        {id: 'far', phase: 0.5, transform: new Matrix4().translate([0.3, 0, -12])},
        {id: 'culled', phase: 0.75, transform: new Matrix4().translate([0, 0, -150])}
      ]);
      const identity = Array.from(new Matrix4());
      const projectionMatrix = new Matrix4().perspective({
        fovy: Math.PI / 2,
        aspect: 1,
        near: 0.1,
        far: 500
      });
      crowd.setLODView({
        viewMatrix: new Matrix4(),
        projectionMatrix,
        viewportWidth: 64,
        viewportHeight: 64
      });

      for (const model of crowd.models) {
        model.shaderInputs.setProps({
          pbrProjection: {
            modelViewProjectionMatrix: Array.from(projectionMatrix),
            modelMatrix: identity,
            normalMatrix: identity,
            camera: [0, 0, 0]
          }
        });
      }

      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      const drawCount = crowd.draw(renderPass);
      renderPass.end();
      device.submit();

      expect(drawCount, `${device.type} issues one draw per occupied authored level`).toBe(3);
      expect(
        crowd.primitiveGroups.map(group => group.model.instanceCount),
        `${device.type} densely packs the actors in separate GPU instances`
      ).toEqual([1, 1, 1]);
      expect(
        crowd.primitiveGroups.map(group => group.triangleCount),
        `${device.type} retains decreasing authored indexed geometry`
      ).toEqual([8, 4, 2]);
      expect(crowd.lodStats.visibleActors, `${device.type} retains visible actors`).toBe(3);
      expect(crowd.lodStats.culledActors, `${device.type} culls the distant actor`).toBe(1);
      expect(crowd.lodStats.triangles, `${device.type} reports submitted triangles`).toBe(14);
      expect(crowd.lodStats.vertices, `${device.type} counts submitted indices`).toBe(42);

      for (const [level, actor] of [near, middle, far].entries()) {
        const group = crowd.primitiveGroups[level];
        expect(
          Array.from(group.jointMatrices!.subarray(0, 32)),
          `${device.type} binds actor ${actor.id}'s private pose to LOD ${level}`
        ).toEqual(Array.from(actor.skins.bindings[0].jointMatrices));
        expect(
          Boolean(
            device.type === 'webgpu'
              ? group.skinJointMatrices instanceof Buffer
              : group.skinJointMatrices instanceof Texture
          ),
          `${device.type} preserves its portable per-level skin palette`
        ).toBe(true);
      }

      crowd.setLODVertexBudget(24);
      expect(
        crowd.primitiveGroups.map(group => group.model.instanceCount),
        `${device.type} repacks the smallest actors into lower-detail GPU groups`
      ).toEqual([0, 1, 2]);
      expect(
        {
          vertices: crowd.lodStats.vertices,
          vertexBudget: crowd.lodStats.vertexBudget,
          demotedActors: crowd.lodStats.demotedActors,
          budgetSatisfied: crowd.lodStats.budgetSatisfied,
          visibleActors: crowd.lodStats.visibleActors
        },
        `${device.type} enforces the global vertex limit without hiding visible actors`
      ).toEqual({
        vertices: 24,
        vertexBudget: 24,
        demotedActors: 2,
        budgetSatisfied: true,
        visibleActors: 3
      });
      expect(
        Array.from(crowd.primitiveGroups[1].jointMatrices!.subarray(0, 32)),
        `${device.type} preserves the near actor's independent skin pose after demotion`
      ).toEqual(Array.from(near.skins.bindings[0].jointMatrices));
      expect(
        Array.from(crowd.primitiveGroups[2].jointMatrices!.subarray(0, 32)),
        `${device.type} packs the middle actor into the first compacted low-detail palette`
      ).toEqual(Array.from(middle.skins.bindings[0].jointMatrices));
      expect(
        Array.from(crowd.primitiveGroups[2].jointMatrices!.subarray(32, 64)),
        `${device.type} packs the far actor into the second compacted low-detail palette`
      ).toEqual(Array.from(far.skins.bindings[0].jointMatrices));

      const budgetedPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      const budgetedDrawCount = crowd.draw(budgetedPass);
      budgetedPass.end();
      device.submit();
      expect(
        budgetedDrawCount,
        `${device.type} issues one real instanced draw per occupied budgeted detail bucket`
      ).toBe(2);

      if (
        device.info.gpu !== 'software' &&
        device.info.gpuType !== 'cpu' &&
        !device.info.fallback
      ) {
        const memoryLayout = colorTexture.computeMemoryLayout({width: 64, height: 64});
        const readbackBuffer = device.createBuffer({
          byteLength: memoryLayout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        try {
          colorTexture.readBuffer({width: 64, height: 64}, readbackBuffer);
          const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
          expect(
            Boolean(pixels.some((value, index) => index % 4 === 3 && value > 0)),
            `${device.type} writes visible per-actor LOD geometry into the real framebuffer`
          ).toBe(true);
        } finally {
          readbackBuffer.destroy();
        }
      }
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  expect(
    Boolean(devices.length > 0),
    'at least one live graphics backend exercises crowd LOD'
  ).toBe(true);
  void 0;
});

it('glTF crowds render generated index-only skin LODs on real WebGL and WebGPU', async () => {
  const source = postProcessGLTF(
    await load('/modules/gltf/test/data/SimpleSkinLOD.gltf', GLTFLoader, {
      gltf: {loadImages: false}
    })
  );
  delete source.nodes[0].extensions;
  delete source.nodes[0].extras;
  const originalNodeCount = source.nodes.length;
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const device of devices) {
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 4,
      lod: {enabled: true, autoGenerate: true, ratios: [0.5, 0.25], hysteresis: 0}
    });
    const colorTexture = device.createTexture({
      width: 32,
      height: 32,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });

    try {
      const projectionMatrix = new Matrix4().perspective({
        fovy: Math.PI / 2,
        aspect: 1,
        near: 0.1,
        far: 500
      });
      crowd.addActors([
        {id: 'near', phase: 0, transform: new Matrix4().translate([-0.3, 0, -1.5])},
        {id: 'middle', phase: 0.25, transform: new Matrix4().translate([0, 0, -4])},
        {id: 'far', phase: 0.5, transform: new Matrix4().translate([0.3, 0, -12])}
      ]);
      crowd.setLODView({viewMatrix: new Matrix4(), projectionMatrix});
      for (const model of crowd.models) {
        model.shaderInputs.setProps({
          pbrProjection: {
            modelViewProjectionMatrix: Array.from(projectionMatrix),
            modelMatrix: Array.from(new Matrix4()),
            normalMatrix: Array.from(new Matrix4()),
            camera: [0, 0, 0]
          }
        });
      }

      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      const drawCount = crowd.draw(renderPass);
      renderPass.end();
      device.submit();

      expect(crowd.lodStats.source, `${device.type} reports generated LOD`).toBe('generated');
      expect(drawCount, `${device.type} draws three simplified instance buckets`).toBe(3);
      const triangleCounts = crowd.primitiveGroups.map(group => group.triangleCount);
      expect(
        Boolean(
          triangleCounts[0] === 8 &&
            triangleCounts[1] < triangleCounts[0] &&
            triangleCounts[2] < triangleCounts[1]
        ),
        `${device.type} renders progressively simplified generated index buffers`
      ).toBe(true);
      expect(source.nodes.length, `${device.type} preserves the source node hierarchy`).toBe(
        originalNodeCount
      );
      expect(crowd.lodStats.triangles, `${device.type} reports real generated work`).toBe(
        triangleCounts.reduce((total, count) => total + count, 0)
      );
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  expect(
    Boolean(devices.length > 0),
    'at least one real backend exercises generated skin LOD'
  ).toBe(true);
  void 0;
});

it('glTF crowds sample baked skin clips on the GPU in real WebGL and WebGPU', async () => {
  const source = postProcessGLTF(
    await load('/examples/showcase/scene/public/gltf/SimpleSkin.gltf', GLTFLoader, {
      gltf: {loadImages: false}
    })
  );
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const device of devices) {
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 4,
      gpuAnimation: {sampleRate: 12}
    });
    const colorTexture = device.createTexture({
      width: 32,
      height: 32,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });

    try {
      const [first, second] = crowd.addActors([
        {id: 'left', phase: 0.1, transform: new Matrix4().translate([-0.35, 0, 0])},
        {id: 'right', phase: 0.65, speed: 1.5, transform: new Matrix4().translate([0.35, 0, 0])}
      ]);
      const model = crowd.models[0];
      const identity = Array.from(new Matrix4());
      model.shaderInputs.setProps({
        pbrProjection: {
          modelViewProjectionMatrix: identity,
          modelMatrix: identity,
          normalMatrix: identity,
          camera: [0, 0, 4]
        }
      });

      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      const drawCount = crowd.draw(renderPass);
      renderPass.end();
      device.submit();

      const group = crowd.primitiveGroups[0];
      expect(drawCount, `${device.type} keeps baked skin clips in one draw`).toBe(1);
      expect(crowd.animationStats.mode, `${device.type} reports GPU sampling`).toBe('gpu');
      expect(group.skinJointMatrices, `${device.type} avoids CPU skin palettes`).toBe(undefined);
      expect(
        Boolean(
          device.type === 'webgpu'
            ? group.animationFrames instanceof Buffer
            : group.animationFrames instanceof Texture
        ),
        `${device.type} binds its native baked frame resource`
      ).toBe(true);
      expect(
        Array.from(group.animationParameters!.subarray(0, 3)),
        `${device.type} preserves independent actor frame addresses`
      ).not.toEqual(Array.from(group.animationParameters!.subarray(4, 7)));

      const firstTime = first.time;
      const secondTime = second.time;
      crowd.update(0.1);
      expect(Boolean(first.time > firstTime), `${device.type} advances the first GPU clock`).toBe(
        true
      );
      expect(
        Boolean(second.time > secondTime),
        `${device.type} advances the second GPU clock`
      ).toBe(true);

      if (
        device.info.gpu !== 'software' &&
        device.info.gpuType !== 'cpu' &&
        !device.info.fallback
      ) {
        const memoryLayout = colorTexture.computeMemoryLayout({width: 32, height: 32});
        const readbackBuffer = device.createBuffer({
          byteLength: memoryLayout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        try {
          colorTexture.readBuffer({width: 32, height: 32}, readbackBuffer);
          const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
          expect(
            Boolean(pixels.some((value, index) => index % 4 === 3 && value > 0)),
            `${device.type} writes GPU-sampled skin geometry into the framebuffer`
          ).toBe(true);
        } finally {
          readbackBuffer.destroy();
        }
      }
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  expect(Boolean(devices.length > 0), 'at least one real backend samples baked skin clips').toBe(
    true
  );
  void 0;
});

it('glTF crowds render independently phased GPU morph targets in real WebGL and WebGPU', async () => {
  const source = postProcessGLTF(
    await load('/examples/showcase/scene/public/gltf/AnimatedMorphCube.glb', GLTFLoader, {
      gltf: {loadImages: false}
    })
  );
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const device of devices) {
    const crowd = createGLTFAnimatedCrowd(device, source, {
      capacity: 4,
      gpuAnimation: {sampleRate: 20}
    });
    const colorTexture = device.createTexture({
      width: 64,
      height: 64,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 64,
      height: 64,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 64,
      height: 64,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });

    try {
      crowd.addActors([
        {id: 'left', phase: 0.1, transform: new Matrix4().translate([-0.45, 0, 0])},
        {id: 'right', phase: 0.65, transform: new Matrix4().translate([0.45, 0, 0])}
      ]);
      const model = crowd.models[0];
      const identity = Array.from(new Matrix4());
      model.shaderInputs.setProps({
        pbrProjection: {
          modelViewProjectionMatrix: identity,
          modelMatrix: identity,
          normalMatrix: identity,
          camera: [0, 0, 4]
        }
      });

      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      const drawCount = crowd.draw(renderPass);
      renderPass.end();
      device.submit();

      const group = crowd.primitiveGroups[0];
      expect(drawCount, `${device.type} draws phased morph actors together`).toBe(1);
      expect(crowd.animationStats.mode, `${device.type} bakes morph clips`).toBe('gpu');
      expect(group.morphTargetCount, `${device.type} retains both morph targets`).toBe(2);
      expect(group.morphWeights, `${device.type} avoids CPU morph uploads`).toBe(undefined);
      expect(
        Boolean(
          device.type === 'webgpu'
            ? group.morphTargetData instanceof Buffer
            : group.morphTargetData instanceof Texture
        ),
        `${device.type} binds immutable native morph deltas`
      ).toBe(true);
      expect(
        Array.from(group.animationParameters!.subarray(0, 3)),
        `${device.type} sends distinct morph frame addresses per actor`
      ).not.toEqual(Array.from(group.animationParameters!.subarray(4, 7)));

      if (
        device.info.gpu !== 'software' &&
        device.info.gpuType !== 'cpu' &&
        !device.info.fallback
      ) {
        const memoryLayout = colorTexture.computeMemoryLayout({width: 64, height: 64});
        const readbackBuffer = device.createBuffer({
          byteLength: memoryLayout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        try {
          colorTexture.readBuffer({width: 64, height: 64}, readbackBuffer);
          const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
          expect(
            Boolean(pixels.some((value, index) => index % 4 === 3 && value > 0)),
            `${device.type} writes GPU-morphed geometry into the framebuffer`
          ).toBe(true);
        } finally {
          readbackBuffer.destroy();
        }
      }
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  expect(
    Boolean(devices.length > 0),
    'at least one real backend samples independent morph clips'
  ).toBe(true);
  void 0;
});
