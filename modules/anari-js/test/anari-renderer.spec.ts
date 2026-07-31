import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getTestDevices} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {ANARIDevice} from '@luma.gl/anari-js';

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
        device.newInstance({group, transform: new Matrix4().translate([-0.8, 0, 0])}),
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
