// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Matrix4} from '@math.gl/core';
import {getTestDevices, getWebGLTestDevice} from '../../../test-utils/src';
import {
  DirectionalLightModel,
  PointLightModel,
  SpotLightModel,
  type DirectionalLightModelProps,
  type PointLightModelProps,
  type SpotLightModelProps
} from '@luma.gl/engine';
import type {Light} from '@luma.gl/shadertools';

const VIEW_MATRIX = new Matrix4().lookAt({eye: [0, 0, 5]});
const PROJECTION_MATRIX = new Matrix4().perspective({
  aspect: 1,
  far: 100,
  fovy: Math.PI / 3,
  near: 0.1
});

const MIXED_LIGHTS: Light[] = [
  {type: 'ambient', color: [255, 255, 255], intensity: 0.2},
  {type: 'point', color: [255, 0, 0], position: [1, 2, 3], intensity: 4},
  {
    type: 'spot',
    color: [0, 255, 0],
    direction: [0, 0, -1],
    outerConeAngle: 0.5,
    position: [-1, 0, 2]
  },
  {type: 'directional', color: [0, 0, 255], direction: [0, 0, -1], intensity: 10}
];

const pointLightModelPropsTypecheck: PointLightModelProps = {
  lights: MIXED_LIGHTS,
  projectionMatrix: PROJECTION_MATRIX,
  viewMatrix: VIEW_MATRIX
};

const spotLightModelPropsTypecheck: SpotLightModelProps = {
  lights: MIXED_LIGHTS,
  projectionMatrix: PROJECTION_MATRIX,
  viewMatrix: VIEW_MATRIX
};

const directionalLightModelPropsTypecheck: DirectionalLightModelProps = {
  lights: MIXED_LIGHTS,
  projectionMatrix: PROJECTION_MATRIX,
  viewMatrix: VIEW_MATRIX
};

const TYPECHECK_VALUE_COUNT = [
  pointLightModelPropsTypecheck,
  spotLightModelPropsTypecheck,
  directionalLightModelPropsTypecheck
].length;

// @ts-expect-error position is required for point lights
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const invalidPointLightModelProps: PointLightModelProps = {
  lights: [{type: 'point'}],
  projectionMatrix: PROJECTION_MATRIX,
  viewMatrix: VIEW_MATRIX
};

test('Light models filter mixed Light[] input', async t => {
  const device = await getWebGLTestDevice();

  t.equal(TYPECHECK_VALUE_COUNT, 3, 'type-level props compile for all three models');

  const pointLightModel = new PointLightModel(device, {
    lights: MIXED_LIGHTS,
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const spotLightModel = new SpotLightModel(device, {
    lights: MIXED_LIGHTS,
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const directionalLightModel = new DirectionalLightModel(device, {
    lights: MIXED_LIGHTS,
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  t.equal(pointLightModel.instanceCount, 1, 'point model keeps only point lights');
  t.equal(spotLightModel.instanceCount, 1, 'spot model keeps only spot lights');
  t.equal(
    directionalLightModel.instanceCount,
    1,
    'directional model keeps only directional lights'
  );

  pointLightModel.destroy();
  spotLightModel.destroy();
  directionalLightModel.destroy();

  t.end();
});

test('Light models ignore ambient lights', async t => {
  const device = await getWebGLTestDevice();
  const ambientLights: Light[] = [{type: 'ambient', color: [255, 255, 255], intensity: 1}];

  const pointLightModel = new PointLightModel(device, {
    lights: ambientLights,
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const spotLightModel = new SpotLightModel(device, {
    lights: ambientLights,
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const directionalLightModel = new DirectionalLightModel(device, {
    lights: ambientLights,
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  t.equal(pointLightModel.instanceCount, 0, 'point model skips ambient lights');
  t.equal(spotLightModel.instanceCount, 0, 'spot model skips ambient lights');
  t.equal(directionalLightModel.instanceCount, 0, 'directional model skips ambient lights');

  pointLightModel.destroy();
  spotLightModel.destroy();
  directionalLightModel.destroy();

  t.end();
});

test('SpotLightModel derives cone scale from outerConeAngle', async t => {
  const device = await getWebGLTestDevice();
  const spotLight = new SpotLightModel(device, {
    lights: [
      {
        type: 'spot',
        color: [255, 255, 255],
        direction: [0, 0, -1],
        outerConeAngle: 0.5,
        position: [0, 0, 0]
      }
    ],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  const scale = Array.from((spotLight as any)._instanceData.instanceScales.slice(0, 3));
  const expectedLength = 0.12;
  const expectedRadius = Math.tan(0.5) * expectedLength;

  t.ok(almostEqual(scale[0], expectedRadius), 'spot radius uses outerConeAngle');
  t.ok(almostEqual(scale[1], expectedLength), 'spot length uses default scene-scaled length');
  t.ok(almostEqual(scale[2], expectedRadius), 'spot radius is symmetric');

  spotLight.destroy();
  t.end();
});

test('DirectionalLightModel uses explicit bounds for anchors', async t => {
  const device = await getWebGLTestDevice();
  const directionalLightModel = new DirectionalLightModel(device, {
    bounds: [
      [-1, -1, -1],
      [3, 3, 3]
    ],
    lights: [{type: 'directional', color: [255, 255, 255], direction: [0, 0, -1]}],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  const position = Array.from(
    (directionalLightModel as any)._instanceData.instancePositions.slice(0, 3)
  );
  const sceneScale = Math.hypot(4, 4, 4);

  t.ok(almostEqual(position[0], 1), 'explicit bounds control anchor center x');
  t.ok(almostEqual(position[1], 1), 'explicit bounds control anchor center y');
  t.ok(
    almostEqual(position[2], 1 + sceneScale * 0.35),
    'explicit bounds control directional anchor distance'
  );

  directionalLightModel.destroy();
  t.end();
});

test('DirectionalLightModel falls back to positional light bounds', async t => {
  const device = await getWebGLTestDevice();
  const directionalLightModel = new DirectionalLightModel(device, {
    lights: [
      {type: 'point', color: [255, 255, 255], position: [-2, 0, 0]},
      {
        type: 'spot',
        color: [255, 255, 255],
        direction: [0, 0, -1],
        position: [2, 0, 0]
      },
      {type: 'directional', color: [255, 255, 255], direction: [0, 0, -1]}
    ],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  const position = Array.from(
    (directionalLightModel as any)._instanceData.instancePositions.slice(0, 3)
  );

  t.ok(almostEqual(position[0], 0), 'fallback bounds center x comes from positional lights');
  t.ok(almostEqual(position[1], 0), 'fallback bounds center y comes from positional lights');
  t.ok(almostEqual(position[2], 1.4), 'fallback bounds scale comes from positional lights');

  directionalLightModel.destroy();
  t.end();
});

test('DirectionalLightModel falls back to unit scene without positional lights', async t => {
  const device = await getWebGLTestDevice();
  const directionalLightModel = new DirectionalLightModel(device, {
    lights: [{type: 'directional', color: [255, 255, 255], direction: [1, 0, 0]}],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  const position = Array.from(
    (directionalLightModel as any)._instanceData.instancePositions.slice(0, 3)
  );
  const expectedUnitSceneScale = Math.sqrt(3);

  t.ok(
    almostEqual(position[0], -expectedUnitSceneScale * 0.35),
    'unit scene fallback anchor uses default scale'
  );
  t.ok(almostEqual(position[1], 0), 'unit scene fallback anchor keeps y at origin');
  t.ok(almostEqual(position[2], 0), 'unit scene fallback anchor keeps z at origin');

  directionalLightModel.destroy();
  t.end();
});

test('Light model marker colors clamp very large intensities', async t => {
  const device = await getWebGLTestDevice();
  const pointLightModel = new PointLightModel(device, {
    lights: [{type: 'point', color: [255, 255, 255], intensity: 1e9, position: [0, 0, 0]}],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  const color = Array.from((pointLightModel as any)._instanceData.instanceColors.slice(0, 4));

  t.deepEqual(color, [1, 1, 1, 1], 'display color is clamped into the readable range');

  pointLightModel.destroy();
  t.end();
});

test('Light models update camera uniforms without rebuilding buffers', async t => {
  const device = await getWebGLTestDevice();
  const pointLightModel = new PointLightModel(device, {
    lights: [{type: 'point', color: [255, 255, 255], position: [0, 0, 0]}],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  const previousPositionBuffer = (pointLightModel as any)._managedBuffers.instancePosition;
  const nextViewMatrix = new Matrix4().lookAt({eye: [2, 1, 5]});

  pointLightModel.setProps({viewMatrix: nextViewMatrix});

  t.equal(
    (pointLightModel as any)._managedBuffers.instancePosition,
    previousPositionBuffer,
    'camera-only updates do not rebuild instance buffers'
  );
  t.deepEqual(
    pointLightModel.shaderInputs.moduleUniforms.lightMarker.viewProjectionMatrix,
    new Matrix4(PROJECTION_MATRIX).multiplyRight(nextViewMatrix),
    'camera uniform is updated'
  );

  pointLightModel.destroy();
  t.end();
});

test('Light models rebuild buffers when lights change', async t => {
  const device = await getWebGLTestDevice();
  const pointLightModel = new PointLightModel(device, {
    lights: [{type: 'point', color: [255, 255, 255], position: [0, 0, 0]}],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });

  const previousPositionBuffer = (pointLightModel as any)._managedBuffers.instancePosition;

  pointLightModel.setProps({
    lights: [
      {type: 'point', color: [255, 255, 255], position: [0, 0, 0]},
      {type: 'point', color: [255, 0, 0], position: [1, 1, 1]}
    ]
  });

  t.notEqual(
    (pointLightModel as any)._managedBuffers.instancePosition,
    previousPositionBuffer,
    'changing lights rebuilds the managed instance buffers'
  );
  t.equal(pointLightModel.instanceCount, 2, 'instance count tracks the new light set');

  pointLightModel.destroy();
  t.end();
});

test('Light models draw with zero, one, and multiple relevant lights', async t => {
  const devices = await getTestDevices();

  for (const device of devices) {
    const framebuffer = device
      .getDefaultCanvasContext()
      .getCurrentFramebuffer({depthStencilFormat: false});

    const pointLightModel = new PointLightModel(device, {
      lights: [{type: 'ambient', color: [255, 255, 255], intensity: 1}],
      projectionMatrix: PROJECTION_MATRIX,
      viewMatrix: VIEW_MATRIX
    });
    const spotLightModel = new SpotLightModel(device, {
      lights: [{type: 'ambient', color: [255, 255, 255], intensity: 1}],
      projectionMatrix: PROJECTION_MATRIX,
      viewMatrix: VIEW_MATRIX
    });
    const directionalLightModel = new DirectionalLightModel(device, {
      lights: [{type: 'ambient', color: [255, 255, 255], intensity: 1}],
      projectionMatrix: PROJECTION_MATRIX,
      viewMatrix: VIEW_MATRIX
    });

    let renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      framebuffer
    });
    t.ok(
      pointLightModel.draw(renderPass),
      `${device.type}: point model draws with zero relevant lights`
    );
    t.ok(
      spotLightModel.draw(renderPass),
      `${device.type}: spot model draws with zero relevant lights`
    );
    t.ok(
      directionalLightModel.draw(renderPass),
      `${device.type}: directional model draws with zero relevant lights`
    );
    renderPass.end();

    pointLightModel.setProps({
      lights: [{type: 'point', color: [255, 255, 255], position: [0, 0, 0]}]
    });
    spotLightModel.setProps({
      lights: [{type: 'spot', color: [255, 255, 255], direction: [0, 0, -1], position: [0, 0, 0]}]
    });
    directionalLightModel.setProps({
      lights: [{type: 'directional', color: [255, 255, 255], direction: [0, 0, -1]}]
    });

    renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      framebuffer
    });
    t.ok(pointLightModel.draw(renderPass), `${device.type}: point model draws with one light`);
    t.ok(spotLightModel.draw(renderPass), `${device.type}: spot model draws with one light`);
    t.ok(
      directionalLightModel.draw(renderPass),
      `${device.type}: directional model draws with one light`
    );
    renderPass.end();

    pointLightModel.setProps({
      lights: [
        {type: 'point', color: [255, 255, 255], position: [0, 0, 0]},
        {type: 'point', color: [255, 0, 0], position: [1, 0, 0]}
      ]
    });
    spotLightModel.setProps({
      lights: [
        {type: 'spot', color: [255, 255, 255], direction: [0, 0, -1], position: [0, 0, 0]},
        {type: 'spot', color: [255, 0, 0], direction: [0, -1, 0], position: [1, 0, 0]}
      ]
    });
    directionalLightModel.setProps({
      lights: [
        {type: 'directional', color: [255, 255, 255], direction: [0, 0, -1]},
        {type: 'directional', color: [255, 0, 0], direction: [-1, 0, 0]}
      ]
    });

    renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      framebuffer
    });
    t.ok(
      pointLightModel.draw(renderPass),
      `${device.type}: point model draws with multiple lights`
    );
    t.ok(spotLightModel.draw(renderPass), `${device.type}: spot model draws with multiple lights`);
    t.ok(
      directionalLightModel.draw(renderPass),
      `${device.type}: directional model draws with multiple lights`
    );
    renderPass.end();
    device.submit();

    pointLightModel.destroy();
    spotLightModel.destroy();
    directionalLightModel.destroy();
  }

  t.end();
});

function almostEqual(left: number, right: number, epsilon = 1e-5): boolean {
  return Math.abs(left - right) <= epsilon;
}
