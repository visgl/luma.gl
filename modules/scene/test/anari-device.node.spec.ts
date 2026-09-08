import {expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {ANARIDevice, type ANARIRendererRuntimeFactory} from '@luma.gl/scene';
import {ANARISceneAdapter} from '../src/anari-scene-adapter';

it('ANARI objects expose committed rather than staged parameters', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.2, 0.4, 0.8],
    roughness: 0.6
  });

  material.setParameter('roughness', 0.15);
  expect(material.getParameter('roughness'), 'pending updates stay invisible').toBe(0.6);
  expect(material.version, 'construction commits the initial parameters').toBe(1);

  material.commitParameters();
  expect(material.getParameter('roughness'), 'commit exposes pending values').toBe(0.15);
  expect(material.version, 'commits advance the object version').toBe(2);

  material.unsetParameter('roughness').commitParameters();
  expect(material.getParameter('roughness'), 'unset takes effect on commit').toBe(undefined);
  device.destroy();
  void 0;
});

it('ANARI device reports object subtypes and implemented extensions', () => {
  const device = new ANARIDevice(new NullDevice({}));

  expect(device.getObjectSubtypes('renderer'), 'renderer implementations are discoverable').toEqual(
    ['default', 'deferred', 'debugNormals', 'debugDepth', 'raytrace']
  );
  expect(
    device.getObjectInfo('renderer').subtypes,
    'renderer object information reports the live registry'
  ).toEqual(device.getObjectSubtypes('renderer'));
  expect(
    Boolean(device.getObjectInfo('material').extensions.includes('KHR_MATERIAL_PHYSICALLY_BASED')),
    'physically based materials are advertised'
  ).toBe(true);
  expect(device.getObjectSubtypes('sampler'), 'image samplers are discoverable').toEqual([
    'image2D'
  ]);

  device.destroy();
  void 0;
});

it('ANARI device lazily registers and shares custom renderer runtimes', () => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const anotherDevice = new ANARIDevice(new NullDevice({}));
  const renderedFrameIdentifiers: string[] = [];
  const destroyedFrameIdentifiers: string[] = [];
  let createdRuntimeCount = 0;
  let destroyedRuntimeCount = 0;

  const runtimeFactory: ANARIRendererRuntimeFactory = runtimeDevice => {
    expect(runtimeDevice, 'factories receive their owning GPU device').toBe(graphicsDevice);
    createdRuntimeCount++;
    return {
      render(frame) {
        renderedFrameIdentifiers.push(frame.id);
        return {surfaceCount: 2, instanceCount: 3, drawCount: 4, triangleCount: 5};
      },
      destroyFrame(frame) {
        destroyedFrameIdentifiers.push(frame.id);
      },
      destroy() {
        destroyedRuntimeCount++;
      }
    };
  };

  expect(
    device.registerRenderer('customPathtrace', runtimeFactory),
    'renderer registration is chainable'
  ).toBe(device);
  device.registerRenderer('customPathtraceAlias', runtimeFactory);
  expect(
    Boolean(device.getObjectSubtypes('renderer').includes('customPathtrace')),
    'registered renderer subtypes are discoverable'
  ).toBe(true);
  expect(
    Boolean(device.getObjectInfo('renderer').subtypes.includes('customPathtraceAlias')),
    'renderer object information includes dynamically registered aliases'
  ).toBe(true);
  expect(
    Boolean(anotherDevice.getObjectSubtypes('renderer').includes('customPathtrace')),
    'renderer registrations belong to a single ANARI device'
  ).toBe(false);

  const world = device.newWorld();
  const camera = device.newCamera('perspective');
  const renderer = device.newRenderer('customPathtrace', {
    samplesPerPixel: 4,
    maxBounces: 2,
    progressive: true,
    shadows: false
  });
  const alias = device.newRenderer('customPathtraceAlias');
  const frame = device.newFrame({world, camera, renderer});
  const aliasFrame = device.newFrame({world, camera, renderer: alias});

  expect(createdRuntimeCount, 'renderer runtimes are created on the first render').toBe(0);
  expect(frame.render(), 'registered runtimes supply frame statistics').toEqual({
    surfaceCount: 2,
    instanceCount: 3,
    drawCount: 4,
    triangleCount: 5
  });
  frame.render();
  aliasFrame.render();
  expect(createdRuntimeCount, 'matching runtime factories share one backend').toBe(1);
  expect(renderedFrameIdentifiers, 'all frames are dispatched to their registered backend').toEqual(
    [frame.id, frame.id, aliasFrame.id]
  );
  expect(renderer.getParameter('samplesPerPixel'), 'sampling parameters are typed').toBe(4);
  expect(renderer.getParameter('maxBounces'), 'bounce parameters are retained').toBe(2);
  expect(renderer.getParameter('progressive'), 'progressive rendering is retained').toBe(true);
  expect(renderer.getParameter('shadows'), 'shadow controls are retained').toBe(false);

  frame.destroy();
  aliasFrame.destroy();
  expect(destroyedFrameIdentifiers, 'shared runtimes release each frame exactly once').toEqual([
    frame.id,
    aliasFrame.id
  ]);
  device.destroy();
  expect(destroyedRuntimeCount, 'shared runtimes are destroyed exactly once').toBe(1);
  anotherDevice.destroy();
  void 0;
});

it('ANARI renderer replacement preserves aliases and destroys orphaned runtimes', () => {
  const device = new ANARIDevice(new NullDevice({}));
  let originalRuntimeDestroyCount = 0;
  let replacementRuntimeDestroyCount = 0;

  const originalRuntimeFactory: ANARIRendererRuntimeFactory = () => ({
    render: () => ({surfaceCount: 1, instanceCount: 1, drawCount: 1, triangleCount: 1}),
    destroyFrame: () => {},
    destroy: () => {
      originalRuntimeDestroyCount++;
    }
  });
  const replacementRuntimeFactory: ANARIRendererRuntimeFactory = () => ({
    render: () => ({surfaceCount: 2, instanceCount: 2, drawCount: 2, triangleCount: 2}),
    destroyFrame: () => {},
    destroy: () => {
      replacementRuntimeDestroyCount++;
    }
  });

  device.registerRenderer('replaceable', originalRuntimeFactory);
  device.registerRenderer('replaceableAlias', originalRuntimeFactory);
  const frame = device.newFrame({
    world: device.newWorld(),
    camera: device.newCamera('perspective'),
    renderer: device.newRenderer('replaceable')
  });
  expect(frame.render().drawCount, 'the initial runtime handles the frame').toBe(1);

  device.registerRenderer('replaceable', replacementRuntimeFactory);
  expect(
    originalRuntimeDestroyCount,
    'a runtime remains alive while another subtype references its factory'
  ).toBe(0);
  expect(frame.render().drawCount, 'replacement factories handle subsequent renders').toBe(2);

  device.registerRenderer('replaceableAlias', replacementRuntimeFactory);
  expect(
    originalRuntimeDestroyCount,
    'replacing the last alias immediately destroys its orphaned runtime'
  ).toBe(1);

  frame.destroy();
  device.destroy();
  expect(replacementRuntimeDestroyCount, 'the replacement runtime is destroyed once').toBe(1);
  void 0;
});

it('ANARI device rejects renderer subtypes without registered runtimes', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const frame = device.newFrame({
    world: device.newWorld(),
    camera: device.newCamera('perspective'),
    renderer: device.newRenderer('unregisteredRenderer')
  });

  expect(() => frame.render(), 'unknown subtypes do not silently use the forward renderer').toThrow(
    /unregisteredRenderer.*not registered/
  );

  frame.destroy();
  device.destroy();
  void 0;
});

it('ANARI ray tracing renderer requires a WebGPU device only when rendered', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const frame = device.newFrame({
    world: device.newWorld(),
    camera: device.newCamera('perspective'),
    renderer: device.newRenderer('raytrace')
  });

  expect(
    () => frame.render(),
    'the lazily created ray tracing runtime rejects non-WebGPU devices'
  ).toThrow(/WebGPU/);

  frame.destroy();
  device.destroy();
  void 0;
});

it('ANARI image samplers retain GPU textures and transforms', () => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const image = graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
  const transform = [2, 0, 0, 0, 2, 0, 0.25, 0.5, 1] as const;
  const sampler = device.newSampler('image2D', {image, transform});

  expect(sampler.getParameter('image'), 'samplers retain their GPU image').toBe(image);
  expect(sampler.getParameter('transform'), 'samplers retain column-major UV transforms').toEqual(
    transform
  );

  device.destroy();
  void 0;
});

it('ANARI point lights expose animated positions after commit', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const light = device.newLight('point', {
    position: [3, 2, 1],
    color: [1, 0.4, 0.2],
    intensity: 42
  });

  light.setParameter('position', [-2, 4, 6]);
  expect(light.getParameter('position'), 'staged movement stays hidden').toEqual([3, 2, 1]);

  light.commitParameters();
  expect(light.getParameter('position'), 'committed movement is visible').toEqual([-2, 4, 6]);
  expect(light.getParameter('intensity'), 'emitter brightness remains unchanged').toBe(42);

  device.destroy();
  void 0;
});

it('ANARI renderer batches repeated group instances by surface', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const geometry = device.newGeometry('sphere', {radius: 1, segments: 8});
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.4, 0.7, 1],
    metallic: 0.5,
    roughness: 0.25
  });
  const surface = device.newSurface({geometry, material});
  const group = device.newGroup({surface: [surface]});
  const instances = [
    device.newInstance({group, transform: new Matrix4().translate([-2, 0, 0])}),
    device.newInstance({group, transform: new Matrix4().translate([2, 0, 0])})
  ];
  const world = device.newWorld({instance: instances});
  const camera = device.newCamera('perspective', {position: [0, 0, 8]});
  const renderer = device.newRenderer('default');
  const frame = device.newFrame({world, camera, renderer, size: [320, 240]});

  const statistics = frame.render();

  expect(statistics.surfaceCount, 'the shared surface compiles once').toBe(1);
  expect(statistics.instanceCount, 'both group placements are retained').toBe(2);
  expect(statistics.drawCount, 'repeated groups use one instanced draw').toBe(1);
  expect(Boolean(statistics.triangleCount > 0), 'generated sphere triangles are counted').toBe(
    true
  );

  const adapter = new ANARISceneAdapter();
  const surfaces = adapter.makeRenderOptions(frame)?.surfaces;
  expect(
    surfaces?.[0]?.instanceIds,
    'shared scene placements retain stable instance, group, and surface identities'
  ).toEqual(instances.map(instance => `${instance.id}:${group.id}:${surface.id}`));

  world
    .setParameters({surface: [surface, surface], instance: [instances[1], instances[0]]})
    .commitParameters();
  expect(
    adapter.makeRenderOptions(frame)?.surfaces[0]?.instanceIds,
    'direct duplicates remain distinct and reordered instances preserve their retained identities'
  ).toEqual([
    surface.id,
    `${surface.id}:1`,
    `${instances[1].id}:${group.id}:${surface.id}`,
    `${instances[0].id}:${group.id}:${surface.id}`
  ]);
  adapter.destroy();

  frame.destroy();
  device.destroy();
  void 0;
});

it('ANARI renderer recompiles surfaces after geometry replacement', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const triangle = device.newGeometry('triangle', {
    'vertex.position': new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])
  });
  const sphere = device.newGeometry('sphere', {radius: 1, segments: 8});
  const material = device.newMaterial('physicallyBased', {baseColor: [1, 1, 1]});
  const surface = device.newSurface({geometry: triangle, material});
  const world = device.newWorld({surface: [surface]});
  const camera = device.newCamera('perspective', {position: [0, 0, 4]});
  const renderer = device.newRenderer('default');
  const frame = device.newFrame({world, camera, renderer, size: [320, 240]});

  expect(frame.render().triangleCount, 'the original geometry is compiled').toBe(1);

  surface.setParameter('geometry', sphere).commitParameters();
  expect(
    Boolean(frame.render().triangleCount > 1),
    'a replacement geometry with the same version recompiles the surface'
  ).toBe(true);

  frame.destroy();
  device.destroy();
  void 0;
});

it('ANARI object arrays preserve zero-copy typed arrays', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const array = device.newArray({data: positions, elementType: 'float32x3'});

  expect(array.data, 'array keeps its original typed-array storage').toBe(positions);
  expect(array.length, 'array reports its scalar storage length').toBe(9);
  positions[0] = 3;
  expect(array.data[0], 'shared array mutations remain observable').toBe(3);

  device.destroy();
  void 0;
});

it('ANARI triangle geometries render packed RGB vertex colors', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const geometry = device.newGeometry('triangle', {
    'vertex.position': new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
    'vertex.attribute0': new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
  });
  const material = device.newMaterial('physicallyBased', {baseColor: [1, 1, 1]});
  const surface = device.newSurface({geometry, material});
  const world = device.newWorld({surface: [surface]});
  const camera = device.newCamera('perspective', {position: [0, 0, 4]});
  const renderer = device.newRenderer('default');
  const frame = device.newFrame({world, camera, renderer, size: [320, 240]});
  const statistics = frame.render();

  expect(statistics.drawCount, 'colored triangle meshes compile into one draw').toBe(1);
  expect(statistics.triangleCount, 'RGB attributes preserve triangle geometry').toBe(1);

  frame.destroy();
  device.destroy();
  void 0;
});
