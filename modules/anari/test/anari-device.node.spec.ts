import test from 'test/utils/vitest-tape';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {ANARIDevice, type ANARIRendererRuntimeFactory} from '@luma.gl/anari';

test('ANARI objects expose committed rather than staged parameters', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.2, 0.4, 0.8],
    roughness: 0.6
  });

  material.setParameter('roughness', 0.15);
  testContext.equal(material.getParameter('roughness'), 0.6, 'pending updates stay invisible');
  testContext.equal(material.version, 1, 'construction commits the initial parameters');

  material.commitParameters();
  testContext.equal(material.getParameter('roughness'), 0.15, 'commit exposes pending values');
  testContext.equal(material.version, 2, 'commits advance the object version');

  material.unsetParameter('roughness').commitParameters();
  testContext.equal(material.getParameter('roughness'), undefined, 'unset takes effect on commit');
  device.destroy();
  testContext.end();
});

test('ANARI device reports object subtypes and implemented extensions', testContext => {
  const device = new ANARIDevice(new NullDevice({}));

  testContext.deepEqual(
    device.getObjectSubtypes('renderer'),
    ['default', 'deferred', 'debugNormals', 'debugDepth', 'raytrace'],
    'renderer implementations are discoverable'
  );
  testContext.deepEqual(
    device.getObjectInfo('renderer').subtypes,
    device.getObjectSubtypes('renderer'),
    'renderer object information reports the live registry'
  );
  testContext.ok(
    device.getObjectInfo('material').extensions.includes('KHR_MATERIAL_PHYSICALLY_BASED'),
    'physically based materials are advertised'
  );
  testContext.deepEqual(
    device.getObjectSubtypes('sampler'),
    ['image2D'],
    'image samplers are discoverable'
  );

  device.destroy();
  testContext.end();
});

test('ANARI device lazily registers and shares custom renderer runtimes', testContext => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const anotherDevice = new ANARIDevice(new NullDevice({}));
  const renderedFrameIdentifiers: string[] = [];
  const destroyedFrameIdentifiers: string[] = [];
  let createdRuntimeCount = 0;
  let destroyedRuntimeCount = 0;

  const runtimeFactory: ANARIRendererRuntimeFactory = runtimeDevice => {
    testContext.equal(runtimeDevice, graphicsDevice, 'factories receive their owning GPU device');
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

  testContext.equal(
    device.registerRenderer('customPathtrace', runtimeFactory),
    device,
    'renderer registration is chainable'
  );
  device.registerRenderer('customPathtraceAlias', runtimeFactory);
  testContext.ok(
    device.getObjectSubtypes('renderer').includes('customPathtrace'),
    'registered renderer subtypes are discoverable'
  );
  testContext.ok(
    device.getObjectInfo('renderer').subtypes.includes('customPathtraceAlias'),
    'renderer object information includes dynamically registered aliases'
  );
  testContext.notOk(
    anotherDevice.getObjectSubtypes('renderer').includes('customPathtrace'),
    'renderer registrations belong to a single ANARI device'
  );

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

  testContext.equal(createdRuntimeCount, 0, 'renderer runtimes are created on the first render');
  testContext.deepEqual(
    frame.render(),
    {surfaceCount: 2, instanceCount: 3, drawCount: 4, triangleCount: 5},
    'registered runtimes supply frame statistics'
  );
  frame.render();
  aliasFrame.render();
  testContext.equal(createdRuntimeCount, 1, 'matching runtime factories share one backend');
  testContext.deepEqual(
    renderedFrameIdentifiers,
    [frame.id, frame.id, aliasFrame.id],
    'all frames are dispatched to their registered backend'
  );
  testContext.equal(renderer.getParameter('samplesPerPixel'), 4, 'sampling parameters are typed');
  testContext.equal(renderer.getParameter('maxBounces'), 2, 'bounce parameters are retained');
  testContext.equal(
    renderer.getParameter('progressive'),
    true,
    'progressive rendering is retained'
  );
  testContext.equal(renderer.getParameter('shadows'), false, 'shadow controls are retained');

  frame.destroy();
  aliasFrame.destroy();
  testContext.deepEqual(
    destroyedFrameIdentifiers,
    [frame.id, aliasFrame.id],
    'shared runtimes release each frame exactly once'
  );
  device.destroy();
  testContext.equal(destroyedRuntimeCount, 1, 'shared runtimes are destroyed exactly once');
  anotherDevice.destroy();
  testContext.end();
});

test('ANARI renderer replacement preserves aliases and destroys orphaned runtimes', testContext => {
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
  testContext.equal(frame.render().drawCount, 1, 'the initial runtime handles the frame');

  device.registerRenderer('replaceable', replacementRuntimeFactory);
  testContext.equal(
    originalRuntimeDestroyCount,
    0,
    'a runtime remains alive while another subtype references its factory'
  );
  testContext.equal(frame.render().drawCount, 2, 'replacement factories handle subsequent renders');

  device.registerRenderer('replaceableAlias', replacementRuntimeFactory);
  testContext.equal(
    originalRuntimeDestroyCount,
    1,
    'replacing the last alias immediately destroys its orphaned runtime'
  );

  frame.destroy();
  device.destroy();
  testContext.equal(replacementRuntimeDestroyCount, 1, 'the replacement runtime is destroyed once');
  testContext.end();
});

test('ANARI device rejects renderer subtypes without registered runtimes', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const frame = device.newFrame({
    world: device.newWorld(),
    camera: device.newCamera('perspective'),
    renderer: device.newRenderer('unregisteredRenderer')
  });

  testContext.throws(
    () => frame.render(),
    /unregisteredRenderer.*not registered/,
    'unknown subtypes do not silently use the forward renderer'
  );

  frame.destroy();
  device.destroy();
  testContext.end();
});

test('ANARI ray tracing renderer requires a WebGPU device only when rendered', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const frame = device.newFrame({
    world: device.newWorld(),
    camera: device.newCamera('perspective'),
    renderer: device.newRenderer('raytrace')
  });

  testContext.throws(
    () => frame.render(),
    /WebGPU/,
    'the lazily created ray tracing runtime rejects non-WebGPU devices'
  );

  frame.destroy();
  device.destroy();
  testContext.end();
});

test('ANARI image samplers retain GPU textures and transforms', testContext => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const image = graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
  const transform = [2, 0, 0, 0, 2, 0, 0.25, 0.5, 1] as const;
  const sampler = device.newSampler('image2D', {image, transform});

  testContext.equal(sampler.getParameter('image'), image, 'samplers retain their GPU image');
  testContext.deepEqual(
    sampler.getParameter('transform'),
    transform,
    'samplers retain column-major UV transforms'
  );

  device.destroy();
  testContext.end();
});

test('ANARI point lights expose animated positions after commit', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const light = device.newLight('point', {
    position: [3, 2, 1],
    color: [1, 0.4, 0.2],
    intensity: 42
  });

  light.setParameter('position', [-2, 4, 6]);
  testContext.deepEqual(light.getParameter('position'), [3, 2, 1], 'staged movement stays hidden');

  light.commitParameters();
  testContext.deepEqual(
    light.getParameter('position'),
    [-2, 4, 6],
    'committed movement is visible'
  );
  testContext.equal(light.getParameter('intensity'), 42, 'emitter brightness remains unchanged');

  device.destroy();
  testContext.end();
});

test('ANARI renderer batches repeated group instances by surface', testContext => {
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

  testContext.equal(statistics.surfaceCount, 1, 'the shared surface compiles once');
  testContext.equal(statistics.instanceCount, 2, 'both group placements are retained');
  testContext.equal(statistics.drawCount, 1, 'repeated groups use one instanced draw');
  testContext.ok(statistics.triangleCount > 0, 'generated sphere triangles are counted');

  frame.destroy();
  device.destroy();
  testContext.end();
});

test('ANARI renderer recompiles surfaces after geometry replacement', testContext => {
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

  testContext.equal(frame.render().triangleCount, 1, 'the original geometry is compiled');

  surface.setParameter('geometry', sphere).commitParameters();
  testContext.ok(
    frame.render().triangleCount > 1,
    'a replacement geometry with the same version recompiles the surface'
  );

  frame.destroy();
  device.destroy();
  testContext.end();
});

test('ANARI object arrays preserve zero-copy typed arrays', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const array = device.newArray({data: positions, elementType: 'float32x3'});

  testContext.equal(array.data, positions, 'array keeps its original typed-array storage');
  testContext.equal(array.length, 9, 'array reports its scalar storage length');
  positions[0] = 3;
  testContext.equal(array.data[0], 3, 'shared array mutations remain observable');

  device.destroy();
  testContext.end();
});

test('ANARI triangle geometries render packed RGB vertex colors', testContext => {
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

  testContext.equal(statistics.drawCount, 1, 'colored triangle meshes compile into one draw');
  testContext.equal(statistics.triangleCount, 1, 'RGB attributes preserve triangle geometry');

  frame.destroy();
  device.destroy();
  testContext.end();
});
