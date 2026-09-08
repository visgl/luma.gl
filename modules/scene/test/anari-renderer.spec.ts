import {ANARIDevice} from '@luma.gl/scene';
import type {Device} from '@luma.gl/core';
import {getTestDevices, getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('ANARI renderer draws instanced physically based surfaces on available GPU backends', async () => {
  for (const graphicsDevice of await getLiveTestDevices()) {
    const device = new ANARIDevice(graphicsDevice);
    const geometry = device.newGeometry('sphere', {radius: 0.6, segments: 8});
    const material = device.newMaterial('physicallyBased', {
      baseColor: [0.22, 0.51, 0.91],
      metallic: 0.6,
      roughness: 0.2,
      emissive: [0.1, 0.15, 0.3]
    });
    const surface = device.newSurface({geometry, material});
    const group = device.newGroup({surface: [surface]});
    const movingLight = device.newLight('point', {
      position: [0, 1, 2],
      color: [1, 0.5, 0.25],
      intensity: 34
    });
    const world = device.newWorld({
      instance: [
        device.newInstance({
          group,
          transform: new Matrix4().translate([-0.8, 0, 0]).scale([1.5, 0.75, 0.5])
        }),
        device.newInstance({group, transform: new Matrix4().translate([0.8, 0, 0])})
      ],
      light: [
        device.newLight('directional', {
          direction: [-1, -1, -1],
          color: [1, 1, 1],
          irradiance: 1.4
        }),
        movingLight
      ]
    });
    const camera = device.newCamera('perspective', {position: [0, 0, 5]});
    const renderer = device.newRenderer('default', {bloomIntensity: 0.45});
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});

    const statistics = frame.render();
    graphicsDevice.submit();

    expect(statistics.drawCount, `${graphicsDevice.type} executes one instanced draw`).toBe(1);
    expect(statistics.instanceCount, `${graphicsDevice.type} renders both placements`).toBe(2);
    expect(
      Boolean(statistics.triangleCount > 0),
      `${graphicsDevice.type} produces sphere geometry`
    ).toBe(true);

    movingLight.setParameter('position', [2, 1, -1]).commitParameters();
    const illuminatedStatistics = frame.render();
    graphicsDevice.submit();
    expect(
      illuminatedStatistics.drawCount,
      `${graphicsDevice.type} renders successfully after moving a committed point light`
    ).toBe(1);

    frame.destroy();
    device.destroy();
  }
  void 0;
});

it('ANARI renderer binds indexed RGB vertex colors on available GPU backends', async () => {
  for (const graphicsDevice of await getLiveTestDevices()) {
    const device = new ANARIDevice(graphicsDevice);
    const geometry = device.newGeometry('triangle', {
      'vertex.position': new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]),
      'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      'vertex.attribute0': new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
      'primitive.index': new Uint32Array([0, 1, 2])
    });
    const material = device.newMaterial('physicallyBased', {baseColor: [1, 1, 1]});
    const surface = device.newSurface({geometry, material});
    const world = device.newWorld({surface: [surface]});
    const camera = device.newCamera('perspective', {position: [0, 0, 4]});
    const renderer = device.newRenderer('default');
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    const statistics = frame.render();
    graphicsDevice.submit();

    expect(statistics.drawCount, `${graphicsDevice.type} draws colored indexed meshes`).toBe(1);
    expect(statistics.triangleCount, `${graphicsDevice.type} preserves mesh indices`).toBe(1);

    frame.destroy();
    device.destroy();
  }
  void 0;
});

it('ANARI renderer samples PBR image maps on available GPU backends', async () => {
  for (const graphicsDevice of await getLiveTestDevices()) {
    if (isSoftwareBackedWebGLDevice(graphicsDevice)) {
      void 0;
      continue;
    }

    const device = new ANARIDevice(graphicsDevice);
    const image = graphicsDevice.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([255, 128, 32, 255])
    });
    const sampler = device.newSampler('image2D', {image});
    const geometry = device.newGeometry('triangle', {
      'vertex.position': new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]),
      'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      'vertex.attribute1': new Float32Array([0, 0, 1, 0, 0.5, 1]),
      'primitive.index': new Uint32Array([0, 1, 2])
    });
    const material = device.newMaterial('physicallyBased', {
      baseColor: [1, 1, 1],
      emissive: [1, 0.5, 0.1],
      baseColorTexture: sampler,
      normalTexture: sampler,
      metallicRoughnessTexture: sampler,
      emissiveTexture: sampler,
      occlusionTexture: sampler,
      clearcoatTexture: sampler,
      transmissionTexture: sampler,
      sheenColorTexture: sampler
    });
    const surface = device.newSurface({geometry, material});
    const world = device.newWorld({surface: [surface]});
    const camera = device.newCamera('perspective', {position: [0, 0, 4]});
    const renderer = device.newRenderer('default');
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    try {
      const statistics = frame.render();
      graphicsDevice.submit();

      expect(statistics.drawCount, `${graphicsDevice.type} draws textured meshes`).toBe(1);
      expect(
        statistics.triangleCount,
        `${graphicsDevice.type} preserves textured mesh geometry`
      ).toBe(1);
    } finally {
      frame.destroy();
      device.destroy();
      image.destroy();
    }
  }
  void 0;
});

it('ANARI renderer samples optional secondary texture coordinates on GPU backends', async () => {
  for (const graphicsDevice of await getLiveTestDevices()) {
    if (isSoftwareBackedWebGLDevice(graphicsDevice)) {
      void 0;
      continue;
    }

    const device = new ANARIDevice(graphicsDevice);
    const image = graphicsDevice.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([224, 160, 96, 255])
    });
    const sampler = device.newSampler('image2D', {image, textureCoordinateSet: 1});
    const geometry = device.newGeometry('triangle', {
      'vertex.position': new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]),
      'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      'vertex.attribute1': new Float32Array([0, 0, 1, 0, 0.5, 1]),
      'vertex.attribute2': new Float32Array([0.25, 0.5, 0.75, 0.5, 0.5, 1])
    });
    const material = device.newMaterial('physicallyBased', {
      baseColor: [1, 1, 1],
      baseColorTexture: sampler,
      clearcoatTexture: sampler
    });
    const surface = device.newSurface({geometry, material});
    const world = device.newWorld({surface: [surface]});
    const camera = device.newCamera('perspective', {position: [0, 0, 4]});
    const renderer = device.newRenderer('default');
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
    try {
      const statistics = frame.render();
      graphicsDevice.submit();

      expect(
        statistics.drawCount,
        `${graphicsDevice.type} binds TEXCOORD_1 and compiles the shared secondary-UV shader path`
      ).toBe(1);
      expect(statistics.triangleCount, `${graphicsDevice.type} preserves UV1 geometry`).toBe(1);
    } finally {
      frame.destroy();
      device.destroy();
      image.destroy();
    }
  }
  void 0;
});

it('ANARI renderer delegates masked extension materials to canonical PBR shaders', async () => {
  for (const graphicsDevice of await getLiveTestDevices()) {
    if (isSoftwareBackedWebGLDevice(graphicsDevice)) {
      void 0;
      continue;
    }

    const device = new ANARIDevice(graphicsDevice);
    const image = graphicsDevice.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([255, 192, 128, 255])
    });
    const sampler = device.newSampler('image2D', {image});
    const geometry = device.newGeometry('triangle', {
      'vertex.position': new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]),
      'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      'vertex.attribute1': new Float32Array([0, 0, 1, 0, 0.5, 1])
    });
    const material = device.newMaterial('physicallyBased', {
      baseColor: [0.8, 0.6, 0.4, 0.75],
      alphaMode: 'mask',
      alphaCutoff: 0.25,
      specularColor: [0.9, 0.8, 0.7],
      specularColorTexture: sampler,
      clearcoat: 0.4,
      clearcoatRoughnessTexture: sampler,
      sheenColor: [0.2, 0.3, 0.4],
      sheenRoughnessTexture: sampler,
      iridescence: 0.2,
      iridescenceThicknessTexture: sampler,
      anisotropyStrength: 0.3,
      anisotropyTexture: sampler
    });
    const surface = device.newSurface({geometry, material});
    const world = device.newWorld({surface: [surface]});
    const camera = device.newCamera('perspective', {position: [0, 0, 4]});
    const renderer = device.newRenderer('default');
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});

    try {
      expect(
        frame.render().drawCount,
        `${graphicsDevice.type} compiles masked PBR extension samplers`
      ).toBe(1);
      graphicsDevice.submit();

      material.setParameters({alphaMode: 'blend', opacity: 0.45}).commitParameters();
      expect(
        frame.render().drawCount,
        `${graphicsDevice.type} recompiles the shared pipeline when committed alpha mode changes`
      ).toBe(1);
      graphicsDevice.submit();
    } finally {
      frame.destroy();
      device.destroy();
      image.destroy();
    }
  }
  void 0;
});

it('ANARI deferred renderer resolves PBR surfaces within WebGPU core limits', async () => {
  for (const graphicsDevice of [await getWebGPUTestDevice('core')]) {
    if (!graphicsDevice) {
      void 0;
      continue;
    }

    const supportsRawValidationErrorScopes =
      graphicsDevice.info.gpu !== 'software' &&
      graphicsDevice.info.gpuType !== 'cpu' &&
      !graphicsDevice.info.fallback;
    if (!supportsRawValidationErrorScopes) {
      void 0;
    }

    expect(
      graphicsDevice.limits.maxColorAttachmentBytesPerSample,
      'deferred rendering preserves the default 32-byte WebGPU core attachment limit'
    ).toBe(32);
    const device = new ANARIDevice(graphicsDevice);
    const geometry = device.newGeometry('sphere', {radius: 0.7, segments: 8});
    const material = device.newMaterial('physicallyBased', {
      baseColor: [0.9, 0.52, 0.18],
      metallic: 0.8,
      roughness: 0.22,
      emissive: [0.3, 0.12, 0.04],
      emissiveStrength: 2
    });
    const surface = device.newSurface({geometry, material});
    const group = device.newGroup({surface: [surface]});
    const world = device.newWorld({
      instance: [
        device.newInstance({
          group,
          transform: new Matrix4().translate([-0.7, 0, 0])
        }),
        device.newInstance({
          group,
          transform: new Matrix4().translate([0.7, 0, 0]).scale([0.75, 1.2, 0.75])
        })
      ],
      light: [
        device.newLight('directional', {
          direction: [-0.4, -1, -0.3],
          color: [1, 0.94, 0.82],
          irradiance: 2.4
        }),
        device.newLight('point', {
          position: [0.4, 1.2, 2],
          color: [1, 0.45, 0.15],
          intensity: 30
        })
      ]
    });
    const camera = device.newCamera('perspective', {position: [0, 0, 5]});
    const renderer = device.newRenderer('deferred', {ambientRadiance: 0.08});
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});

    if (supportsRawValidationErrorScopes) {
      graphicsDevice.handle.pushErrorScope('validation');
    }
    const statistics = frame.render();
    graphicsDevice.submit();
    if (supportsRawValidationErrorScopes) {
      const deferredValidationError = await graphicsDevice.handle.popErrorScope();
      expect(
        deferredValidationError,
        'deferred frame encoding and submission produce no WebGPU validation errors'
      ).toBe(null);
    }
    expect(statistics.drawCount, 'WebGPU deferred renderer draws one surface batch').toBe(1);
    expect(statistics.instanceCount, 'WebGPU deferred renderer keeps instances').toBe(2);
    expect(Boolean(statistics.triangleCount > 0), 'WebGPU deferred renderer counts geometry').toBe(
      true
    );

    material.setParameter('transmission', 0.6).commitParameters();
    const fallbackStatistics = frame.render();
    graphicsDevice.submit();
    expect(
      fallbackStatistics.drawCount,
      'unsupported deferred material extensions transparently use the shared forward renderer'
    ).toBe(1);
    expect(
      fallbackStatistics.instanceCount,
      'deferred-to-forward fallback preserves retained surface instancing'
    ).toBe(2);

    frame.destroy();
    device.destroy();
  }
  void 0;
});

it('ANARI ray tracing renderer accelerates analytic spheres and indexed meshes within WebGPU core limits', async () => {
  for (const graphicsDevice of [await getWebGPUTestDevice('core')]) {
    if (!graphicsDevice) {
      void 0;
      continue;
    }

    const supportsRawValidationErrorScopes =
      graphicsDevice.info.gpu !== 'software' &&
      graphicsDevice.info.gpuType !== 'cpu' &&
      !graphicsDevice.info.fallback;
    if (!supportsRawValidationErrorScopes) {
      void 0;
    }

    expect(
      graphicsDevice.limits.maxStorageBuffersPerShaderStage,
      'GPU BVH construction fits the default WebGPU core storage-buffer limit'
    ).toBe(8);
    const device = new ANARIDevice(graphicsDevice);
    const sphereGeometry = device.newGeometry('sphere', {radius: 0.65});
    const sphereMaterial = device.newMaterial('physicallyBased', {
      baseColor: [0.94, 0.42, 0.18],
      metallic: 0.65,
      roughness: 0.24,
      emissive: [0.08, 0.02, 0]
    });
    const sphereSurface = device.newSurface({geometry: sphereGeometry, material: sphereMaterial});
    const group = device.newGroup({surface: [sphereSurface]});
    const triangleGeometry = device.newGeometry('triangle', {
      'vertex.position': new Float32Array([-1, -0.75, -0.5, 1, -0.75, -0.5, 0, 0.8, -0.5]),
      'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      'primitive.index': new Uint16Array([0, 1, 2])
    });
    const triangleSurface = device.newSurface({
      geometry: triangleGeometry,
      material: device.newMaterial('matte', {color: [0.18, 0.52, 0.86]})
    });
    const firstInstance = device.newInstance({
      group,
      transform: new Matrix4()
        .translate([-0.65, 0, 0])
        .rotateY(Math.PI / 5)
        .scale([1.25, 0.8, 0.7])
    });
    const secondInstance = device.newInstance({
      group,
      transform: new Matrix4().translate([0.65, 0, 0])
    });
    const world = device.newWorld({
      surface: [triangleSurface],
      instance: [firstInstance, secondInstance],
      light: [
        device.newLight('directional', {direction: [-0.5, -1, -1], irradiance: 1.8}),
        device.newLight('point', {position: [0, 1, 2], intensity: 8})
      ]
    });
    const camera = device.newCamera('perspective', {position: [0, 0, 4]});
    const renderer = device.newRenderer('raytrace', {
      samplesPerPixel: 2,
      progressive: true,
      shadows: true
    });
    const frame = device.newFrame({world, camera, renderer, size: [32, 32]});

    if (supportsRawValidationErrorScopes) {
      graphicsDevice.handle.pushErrorScope('validation');
    }
    const statistics = frame.render();
    graphicsDevice.submit();
    if (supportsRawValidationErrorScopes) {
      const initialValidationError = await graphicsDevice.handle.popErrorScope();
      expect(
        initialValidationError,
        'GPU object bounds, BVH construction, and shadow traversal produce no core validation errors'
      ).toBe(null);
    }
    expect(statistics.surfaceCount, 'ray tracing retains both unique surfaces').toBe(2);
    expect(statistics.instanceCount, 'ray tracing preserves transformed placements').toBe(3);
    expect(statistics.drawCount, 'ray tracing presents through one fullscreen draw').toBe(1);
    expect(statistics.triangleCount, 'analytic spheres do not generate mesh triangles').toBe(1);
    expect(
      Boolean(
        statistics.rayTracing?.graph?.topology &&
          statistics.rayTracing.graph.acceleration &&
          statistics.rayTracing.graph.trace
      ),
      'retained ANARI frames expose topology, acceleration, and tracing graph-stage diagnostics'
    ).toBe(true);

    if (supportsRawValidationErrorScopes) {
      graphicsDevice.handle.pushErrorScope('validation');
    }
    camera.setParameters({position: [0, 0, 4], direction: [0, 0, -1]}).commitParameters();
    const accumulatedStatistics = frame.render();
    graphicsDevice.submit();
    expect(
      accumulatedStatistics.instanceCount,
      'stable recommitted camera parameters preserve progressive rendering'
    ).toBe(3);
    expect(
      Boolean(
        accumulatedStatistics.rayTracing?.graph?.trace &&
          !accumulatedStatistics.rayTracing.graph.topology &&
          !accumulatedStatistics.rayTracing.graph.acceleration &&
          !accumulatedStatistics.rayTracing.graph.refit
      ),
      'stable ANARI frames expose only the tracing graph without rebuilding acceleration'
    ).toBe(true);

    renderer.setParameters({toneMapMode: 1, outputColorSpace: 'linear'}).commitParameters();
    const colorManagedStatistics = frame.render();
    graphicsDevice.submit();
    expect(
      colorManagedStatistics.instanceCount,
      'committed ANARI tone-mapping and output-color settings preserve retained placements'
    ).toBe(3);
    expect(
      Boolean(
        colorManagedStatistics.rayTracing?.graph?.trace &&
          !colorManagedStatistics.rayTracing.graph.topology &&
          !colorManagedStatistics.rayTracing.graph.acceleration &&
          !colorManagedStatistics.rayTracing.graph.refit
      ),
      'presentation-policy updates recreate only the tracing graph, without rebuilding acceleration'
    ).toBe(true);

    world.setParameter('instance', [firstInstance]).commitParameters();
    const reducedStatistics = frame.render();
    graphicsDevice.submit();
    expect(
      reducedStatistics.instanceCount,
      'the BVH excludes inactive leaves when a retained world removes an instance'
    ).toBe(2);

    firstInstance
      .setParameter(
        'transform',
        new Matrix4()
          .translate([-0.45, 0.2, 0])
          .rotateY(Math.PI / 3)
          .scale([0.8, 1.3, 0.6])
      )
      .commitParameters();
    world.setParameter('instance', [firstInstance, secondInstance]).commitParameters();
    const restoredStatistics = frame.render();
    graphicsDevice.submit();
    expect(
      restoredStatistics.instanceCount,
      'the BVH refits rotated, nonuniformly scaled instances when retained placements return'
    ).toBe(3);

    sphereMaterial.setParameter('roughness', 0.8).commitParameters();
    renderer.setParameters({progressive: false, shadows: false}).commitParameters();
    const updatedStatistics = frame.render();
    graphicsDevice.submit();
    expect(updatedStatistics.drawCount, 'material and renderer updates rebuild history').toBe(1);

    frame.setParameter('size', [16, 16]).commitParameters();
    const resizedStatistics = frame.render();
    graphicsDevice.submit();
    expect(resizedStatistics.triangleCount, 'resizing rebuilds frame-owned resources').toBe(1);

    const primitiveSurfaces = (['quad', 'cylinder', 'cone'] as const).map(subtype =>
      device.newSurface({
        geometry: device.newGeometry(subtype, {radius: 0.35, height: 0.65, segments: 4}),
        material: device.newMaterial('matte', {color: [0.4, 0.65, 0.85]})
      })
    );
    frame
      .setParameters({
        world: device.newWorld({surface: primitiveSurfaces}),
        camera: device.newCamera('orthographic', {position: [0, 0, 4], height: 3})
      })
      .commitParameters();
    const primitiveStatistics = frame.render();
    graphicsDevice.submit();
    expect(primitiveStatistics.surfaceCount, 'generated primitives remain distinct').toBe(3);
    expect(
      Boolean(primitiveStatistics.triangleCount > 1),
      'orthographic rays trace generated quad, cylinder, and cone meshes'
    ).toBe(true);

    frame.setParameter('world', device.newWorld()).commitParameters();
    const emptyStatistics = frame.render();
    graphicsDevice.submit();
    expect(emptyStatistics.instanceCount, 'empty worlds present their background').toBe(0);
    expect(emptyStatistics.drawCount, 'empty worlds still use one presentation draw').toBe(1);

    renderer.setParameters({progressive: true, shadows: true}).commitParameters();
    frame.setParameters({world, camera}).commitParameters();
    const repopulatedStatistics = frame.render();
    graphicsDevice.submit();
    expect(
      repopulatedStatistics.instanceCount,
      'BVH traversal and direct-light shadows recover after an empty retained world'
    ).toBe(3);
    if (supportsRawValidationErrorScopes) {
      const updatedValidationError = await graphicsDevice.handle.popErrorScope();
      expect(
        updatedValidationError,
        'BVH refits, resize, empty scenes, repopulation, and shadow updates remain core-valid'
      ).toBe(null);
    }

    frame.destroy();
    device.destroy();
  }
  void 0;
});

async function getLiveTestDevices(): Promise<Device[]> {
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);

  return webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;
}

function isSoftwareBackedWebGLDevice(device: Device): boolean {
  return (
    device.type === 'webgl' &&
    (device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      Boolean(device.info.fallback))
  );
}
