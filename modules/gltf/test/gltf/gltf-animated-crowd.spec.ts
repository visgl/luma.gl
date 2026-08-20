// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('glTF crowds draw independent SimpleSkin actors in one real WebGL and WebGPU call', async testContext => {
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
          testContext.ok(
            pixels.some((value, index) => index % 4 === 3 && value > 0),
            `${device.type} writes visible crowd geometry into the real framebuffer`
          );
        } finally {
          readbackBuffer.destroy();
        }
      }

      testContext.equal(drawCount, 1, `${device.type} submits one shared primitive draw`);
      testContext.equal(model.instanceCount, 3, `${device.type} draws all three actor instances`);
      testContext.ok(model.isInstanced, `${device.type} enables instanced primitive rendering`);
      testContext.notDeepEqual(
        Array.from(first.skins.bindings[0].jointMatrices),
        Array.from(second.skins.bindings[0].jointMatrices),
        `${device.type} preserves independent actor joint poses`
      );
      const resource = crowd.primitiveGroups[0].skinJointMatrices;
      testContext.ok(
        device.type === 'webgpu' ? resource instanceof Buffer : resource instanceof Texture,
        `${device.type} selects its native crowd palette binding`
      );

      const initialModel = model;
      const initialThirdTime = third.time;
      crowd.update(0.1);
      testContext.equal(crowd.models[0], initialModel, `${device.type} reuses its compiled model`);
      testContext.ok(third.time > initialThirdTime, `${device.type} advances actor-local playback`);

      const updatedRenderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      testContext.equal(
        crowd.draw(updatedRenderPass),
        1,
        `${device.type} keeps draw count constant after animation`
      );
      updatedRenderPass.end();
      device.submit();
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  testContext.ok(devices.length > 0, 'at least one live graphics backend is exercised');
  testContext.end();
});

test('glTF crowds select independent authored skin LODs in real WebGL and WebGPU draws', async testContext => {
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

      testContext.equal(drawCount, 3, `${device.type} issues one draw per occupied authored level`);
      testContext.deepEqual(
        crowd.primitiveGroups.map(group => group.model.instanceCount),
        [1, 1, 1],
        `${device.type} densely packs the actors in separate GPU instances`
      );
      testContext.deepEqual(
        crowd.primitiveGroups.map(group => group.triangleCount),
        [8, 4, 2],
        `${device.type} retains decreasing authored indexed geometry`
      );
      testContext.equal(crowd.lodStats.visibleActors, 3, `${device.type} retains visible actors`);
      testContext.equal(crowd.lodStats.culledActors, 1, `${device.type} culls the distant actor`);
      testContext.equal(crowd.lodStats.triangles, 14, `${device.type} reports submitted triangles`);
      testContext.equal(crowd.lodStats.vertices, 42, `${device.type} counts submitted indices`);

      for (const [level, actor] of [near, middle, far].entries()) {
        const group = crowd.primitiveGroups[level];
        testContext.deepEqual(
          Array.from(group.jointMatrices!.subarray(0, 32)),
          Array.from(actor.skins.bindings[0].jointMatrices),
          `${device.type} binds actor ${actor.id}'s private pose to LOD ${level}`
        );
        testContext.ok(
          device.type === 'webgpu'
            ? group.skinJointMatrices instanceof Buffer
            : group.skinJointMatrices instanceof Texture,
          `${device.type} preserves its portable per-level skin palette`
        );
      }

      crowd.setLODVertexBudget(24);
      testContext.deepEqual(
        crowd.primitiveGroups.map(group => group.model.instanceCount),
        [0, 1, 2],
        `${device.type} repacks the smallest actors into lower-detail GPU groups`
      );
      testContext.deepEqual(
        {
          vertices: crowd.lodStats.vertices,
          vertexBudget: crowd.lodStats.vertexBudget,
          demotedActors: crowd.lodStats.demotedActors,
          budgetSatisfied: crowd.lodStats.budgetSatisfied,
          visibleActors: crowd.lodStats.visibleActors
        },
        {vertices: 24, vertexBudget: 24, demotedActors: 2, budgetSatisfied: true, visibleActors: 3},
        `${device.type} enforces the global vertex limit without hiding visible actors`
      );
      testContext.deepEqual(
        Array.from(crowd.primitiveGroups[1].jointMatrices!.subarray(0, 32)),
        Array.from(near.skins.bindings[0].jointMatrices),
        `${device.type} preserves the near actor's independent skin pose after demotion`
      );
      testContext.deepEqual(
        Array.from(crowd.primitiveGroups[2].jointMatrices!.subarray(0, 32)),
        Array.from(middle.skins.bindings[0].jointMatrices),
        `${device.type} packs the middle actor into the first compacted low-detail palette`
      );
      testContext.deepEqual(
        Array.from(crowd.primitiveGroups[2].jointMatrices!.subarray(32, 64)),
        Array.from(far.skins.bindings[0].jointMatrices),
        `${device.type} packs the far actor into the second compacted low-detail palette`
      );

      const budgetedPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      const budgetedDrawCount = crowd.draw(budgetedPass);
      budgetedPass.end();
      device.submit();
      testContext.equal(
        budgetedDrawCount,
        2,
        `${device.type} issues one real instanced draw per occupied budgeted detail bucket`
      );

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
          testContext.ok(
            pixels.some((value, index) => index % 4 === 3 && value > 0),
            `${device.type} writes visible per-actor LOD geometry into the real framebuffer`
          );
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

  testContext.ok(devices.length > 0, 'at least one live graphics backend exercises crowd LOD');
  testContext.end();
});

test('glTF crowds render generated index-only skin LODs on real WebGL and WebGPU', async testContext => {
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

      testContext.equal(crowd.lodStats.source, 'generated', `${device.type} reports generated LOD`);
      testContext.equal(drawCount, 3, `${device.type} draws three simplified instance buckets`);
      const triangleCounts = crowd.primitiveGroups.map(group => group.triangleCount);
      testContext.ok(
        triangleCounts[0] === 8 &&
          triangleCounts[1] < triangleCounts[0] &&
          triangleCounts[2] < triangleCounts[1],
        `${device.type} renders progressively simplified generated index buffers`
      );
      testContext.equal(
        source.nodes.length,
        originalNodeCount,
        `${device.type} preserves the source node hierarchy`
      );
      testContext.equal(
        crowd.lodStats.triangles,
        triangleCounts.reduce((total, count) => total + count, 0),
        `${device.type} reports real generated work`
      );
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  testContext.ok(devices.length > 0, 'at least one real backend exercises generated skin LOD');
  testContext.end();
});

test('glTF crowds sample baked skin clips on the GPU in real WebGL and WebGPU', async testContext => {
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
      testContext.equal(drawCount, 1, `${device.type} keeps baked skin clips in one draw`);
      testContext.equal(crowd.animationStats.mode, 'gpu', `${device.type} reports GPU sampling`);
      testContext.equal(
        group.skinJointMatrices,
        undefined,
        `${device.type} avoids CPU skin palettes`
      );
      testContext.ok(
        device.type === 'webgpu'
          ? group.animationFrames instanceof Buffer
          : group.animationFrames instanceof Texture,
        `${device.type} binds its native baked frame resource`
      );
      testContext.notDeepEqual(
        Array.from(group.animationParameters!.subarray(0, 3)),
        Array.from(group.animationParameters!.subarray(4, 7)),
        `${device.type} preserves independent actor frame addresses`
      );

      const firstTime = first.time;
      const secondTime = second.time;
      crowd.update(0.1);
      testContext.ok(first.time > firstTime, `${device.type} advances the first GPU clock`);
      testContext.ok(second.time > secondTime, `${device.type} advances the second GPU clock`);

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
          testContext.ok(
            pixels.some((value, index) => index % 4 === 3 && value > 0),
            `${device.type} writes GPU-sampled skin geometry into the framebuffer`
          );
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

  testContext.ok(devices.length > 0, 'at least one real backend samples baked skin clips');
  testContext.end();
});

test('glTF crowds render independently phased GPU morph targets in real WebGL and WebGPU', async testContext => {
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
      testContext.equal(drawCount, 1, `${device.type} draws phased morph actors together`);
      testContext.equal(crowd.animationStats.mode, 'gpu', `${device.type} bakes morph clips`);
      testContext.equal(group.morphTargetCount, 2, `${device.type} retains both morph targets`);
      testContext.equal(group.morphWeights, undefined, `${device.type} avoids CPU morph uploads`);
      testContext.ok(
        device.type === 'webgpu'
          ? group.morphTargetData instanceof Buffer
          : group.morphTargetData instanceof Texture,
        `${device.type} binds immutable native morph deltas`
      );
      testContext.notDeepEqual(
        Array.from(group.animationParameters!.subarray(0, 3)),
        Array.from(group.animationParameters!.subarray(4, 7)),
        `${device.type} sends distinct morph frame addresses per actor`
      );

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
          testContext.ok(
            pixels.some((value, index) => index % 4 === 3 && value > 0),
            `${device.type} writes GPU-morphed geometry into the framebuffer`
          );
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

  testContext.ok(devices.length > 0, 'at least one real backend samples independent morph clips');
  testContext.end();
});
