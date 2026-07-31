import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {ANARIDevice} from '@luma.gl/anari';

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
    ['default', 'debugNormals', 'debugDepth'],
    'renderer implementations are discoverable'
  );
  testContext.ok(
    device.getObjectInfo('material').extensions.includes('KHR_MATERIAL_PHYSICALLY_BASED'),
    'physically based materials are advertised'
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
