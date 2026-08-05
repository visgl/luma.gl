import {ANARIDevice} from '@luma.gl/anari';
import {getTestDevices} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('ANARI renderer draws instanced physically based surfaces on available GPU backends', async testContext => {
  for (const graphicsDevice of await getTestDevices()) {
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

    testContext.equal(
      statistics.drawCount,
      1,
      `${graphicsDevice.type} executes one instanced draw`
    );
    testContext.equal(
      statistics.instanceCount,
      2,
      `${graphicsDevice.type} renders both placements`
    );
    testContext.ok(statistics.triangleCount > 0, `${graphicsDevice.type} produces sphere geometry`);

    movingLight.setParameter('position', [2, 1, -1]).commitParameters();
    const illuminatedStatistics = frame.render();
    graphicsDevice.submit();
    testContext.equal(
      illuminatedStatistics.drawCount,
      1,
      `${graphicsDevice.type} renders successfully after moving a committed point light`
    );

    frame.destroy();
    device.destroy();
  }
  testContext.end();
});

test('ANARI renderer binds indexed RGB vertex colors on available GPU backends', async testContext => {
  for (const graphicsDevice of await getTestDevices()) {
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

    testContext.equal(
      statistics.drawCount,
      1,
      `${graphicsDevice.type} draws colored indexed meshes`
    );
    testContext.equal(statistics.triangleCount, 1, `${graphicsDevice.type} preserves mesh indices`);

    frame.destroy();
    device.destroy();
  }
  testContext.end();
});

test('ANARI renderer samples PBR image maps on available GPU backends', async testContext => {
  for (const graphicsDevice of await getTestDevices()) {
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
    const statistics = frame.render();
    graphicsDevice.submit();

    testContext.equal(statistics.drawCount, 1, `${graphicsDevice.type} draws textured meshes`);
    testContext.equal(
      statistics.triangleCount,
      1,
      `${graphicsDevice.type} preserves textured mesh geometry`
    );

    frame.destroy();
    device.destroy();
  }
  testContext.end();
});

test('ANARI renderer samples optional secondary texture coordinates on GPU backends', async testContext => {
  for (const graphicsDevice of await getTestDevices()) {
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
    const statistics = frame.render();
    graphicsDevice.submit();

    testContext.equal(
      statistics.drawCount,
      1,
      `${graphicsDevice.type} binds TEXCOORD_1 and compiles the shared secondary-UV shader path`
    );
    testContext.equal(statistics.triangleCount, 1, `${graphicsDevice.type} preserves UV1 geometry`);

    frame.destroy();
    device.destroy();
  }
  testContext.end();
});

test('ANARI renderer delegates masked extension materials to canonical PBR shaders', async testContext => {
  for (const graphicsDevice of await getTestDevices()) {
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

    testContext.equal(
      frame.render().drawCount,
      1,
      `${graphicsDevice.type} compiles masked PBR extension samplers`
    );
    graphicsDevice.submit();

    material.setParameters({alphaMode: 'blend', opacity: 0.45}).commitParameters();
    testContext.equal(
      frame.render().drawCount,
      1,
      `${graphicsDevice.type} recompiles the shared pipeline when committed alpha mode changes`
    );
    graphicsDevice.submit();

    frame.destroy();
    device.destroy();
  }
  testContext.end();
});

test('ANARI deferred renderer resolves PBR surfaces on WebGPU', async testContext => {
  for (const graphicsDevice of await getTestDevices()) {
    if (graphicsDevice.type !== 'webgpu') {
      continue;
    }

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

    const statistics = frame.render();
    graphicsDevice.submit();

    testContext.equal(statistics.drawCount, 1, 'WebGPU deferred renderer draws one surface batch');
    testContext.equal(statistics.instanceCount, 2, 'WebGPU deferred renderer keeps instances');
    testContext.ok(statistics.triangleCount > 0, 'WebGPU deferred renderer counts geometry');

    material.setParameter('transmission', 0.6).commitParameters();
    const fallbackStatistics = frame.render();
    graphicsDevice.submit();
    testContext.equal(
      fallbackStatistics.drawCount,
      1,
      'unsupported deferred material extensions transparently use the shared forward renderer'
    );
    testContext.equal(
      fallbackStatistics.instanceCount,
      2,
      'deferred-to-forward fallback preserves retained surface instancing'
    );

    frame.destroy();
    device.destroy();
  }
  testContext.end();
});
