import {expect, test} from 'vitest';
import { Matrix4 } from '@math.gl/core';
import { getTestDevices, getWebGLTestDevice } from '../../../test-utils/src';
import { DirectionalLightModel, PointLightModel, SpotLightModel, type DirectionalLightModelProps, type PointLightModelProps, type SpotLightModelProps } from '@luma.gl/engine';
import type { Light } from '@luma.gl/shadertools';
const VIEW_MATRIX = new Matrix4().lookAt({
  eye: [0, 0, 5]
});
const PROJECTION_MATRIX = new Matrix4().perspective({
  aspect: 1,
  far: 100,
  fovy: Math.PI / 3,
  near: 0.1
});
const MIXED_LIGHTS: Light[] = [{
  type: 'ambient',
  color: [255, 255, 255],
  intensity: 0.2
}, {
  type: 'point',
  color: [255, 0, 0],
  position: [1, 2, 3],
  intensity: 4
}, {
  type: 'spot',
  color: [0, 255, 0],
  direction: [0, 0, -1],
  outerConeAngle: 0.5,
  position: [-1, 0, 2]
}, {
  type: 'directional',
  color: [0, 0, 255],
  direction: [0, 0, -1],
  intensity: 10
}];
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
const TYPECHECK_VALUE_COUNT = [pointLightModelPropsTypecheck, spotLightModelPropsTypecheck, directionalLightModelPropsTypecheck].length;

// @ts-expect-error position is required for point lights
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const invalidPointLightModelProps: PointLightModelProps = {
  lights: [{
    type: 'point'
  }],
  projectionMatrix: PROJECTION_MATRIX,
  viewMatrix: VIEW_MATRIX
};
test('Light models filter mixed Light[] input', async () => {
  const device = await getWebGLTestDevice();
  expect(TYPECHECK_VALUE_COUNT, 'type-level props compile for all three models').toBe(3);
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
  expect(pointLightModel.instanceCount, 'point model keeps only point lights').toBe(1);
  expect(spotLightModel.instanceCount, 'spot model keeps only spot lights').toBe(1);
  expect(directionalLightModel.instanceCount, 'directional model keeps only directional lights').toBe(1);
  pointLightModel.destroy();
  spotLightModel.destroy();
  directionalLightModel.destroy();
});
test('Light models ignore ambient lights', async () => {
  const device = await getWebGLTestDevice();
  const ambientLights: Light[] = [{
    type: 'ambient',
    color: [255, 255, 255],
    intensity: 1
  }];
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
  expect(pointLightModel.instanceCount, 'point model skips ambient lights').toBe(0);
  expect(spotLightModel.instanceCount, 'spot model skips ambient lights').toBe(0);
  expect(directionalLightModel.instanceCount, 'directional model skips ambient lights').toBe(0);
  pointLightModel.destroy();
  spotLightModel.destroy();
  directionalLightModel.destroy();
});
test('SpotLightModel derives cone scale from outerConeAngle', async () => {
  const device = await getWebGLTestDevice();
  const spotLight = new SpotLightModel(device, {
    lights: [{
      type: 'spot',
      color: [255, 255, 255],
      direction: [0, 0, -1],
      outerConeAngle: 0.5,
      position: [0, 0, 0]
    }],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const scale = Array.from((spotLight as any)._instanceData.instanceScales.slice(0, 3));
  const expectedLength = 0.12;
  const expectedRadius = Math.tan(0.5) * expectedLength;
  expect(almostEqual(scale[0], expectedRadius), 'spot radius uses outerConeAngle').toBeTruthy();
  expect(almostEqual(scale[1], expectedLength), 'spot length uses default scene-scaled length').toBeTruthy();
  expect(almostEqual(scale[2], expectedRadius), 'spot radius is symmetric').toBeTruthy();
  spotLight.destroy();
});
test('DirectionalLightModel uses explicit bounds for anchors', async () => {
  const device = await getWebGLTestDevice();
  const directionalLightModel = new DirectionalLightModel(device, {
    bounds: [[-1, -1, -1], [3, 3, 3]],
    lights: [{
      type: 'directional',
      color: [255, 255, 255],
      direction: [0, 0, -1]
    }],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const position = Array.from((directionalLightModel as any)._instanceData.instancePositions.slice(0, 3));
  const sceneScale = Math.hypot(4, 4, 4);
  expect(almostEqual(position[0], 1), 'explicit bounds control anchor center x').toBeTruthy();
  expect(almostEqual(position[1], 1), 'explicit bounds control anchor center y').toBeTruthy();
  expect(almostEqual(position[2], 1 + sceneScale * 0.35), 'explicit bounds control directional anchor distance').toBeTruthy();
  directionalLightModel.destroy();
});
test('DirectionalLightModel falls back to positional light bounds', async () => {
  const device = await getWebGLTestDevice();
  const directionalLightModel = new DirectionalLightModel(device, {
    lights: [{
      type: 'point',
      color: [255, 255, 255],
      position: [-2, 0, 0]
    }, {
      type: 'spot',
      color: [255, 255, 255],
      direction: [0, 0, -1],
      position: [2, 0, 0]
    }, {
      type: 'directional',
      color: [255, 255, 255],
      direction: [0, 0, -1]
    }],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const position = Array.from((directionalLightModel as any)._instanceData.instancePositions.slice(0, 3));
  expect(almostEqual(position[0], 0), 'fallback bounds center x comes from positional lights').toBeTruthy();
  expect(almostEqual(position[1], 0), 'fallback bounds center y comes from positional lights').toBeTruthy();
  expect(almostEqual(position[2], 1.4), 'fallback bounds scale comes from positional lights').toBeTruthy();
  directionalLightModel.destroy();
});
test('DirectionalLightModel falls back to unit scene without positional lights', async () => {
  const device = await getWebGLTestDevice();
  const directionalLightModel = new DirectionalLightModel(device, {
    lights: [{
      type: 'directional',
      color: [255, 255, 255],
      direction: [1, 0, 0]
    }],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const position = Array.from((directionalLightModel as any)._instanceData.instancePositions.slice(0, 3));
  const expectedUnitSceneScale = Math.sqrt(3);
  expect(almostEqual(position[0], -expectedUnitSceneScale * 0.35), 'unit scene fallback anchor uses default scale').toBeTruthy();
  expect(almostEqual(position[1], 0), 'unit scene fallback anchor keeps y at origin').toBeTruthy();
  expect(almostEqual(position[2], 0), 'unit scene fallback anchor keeps z at origin').toBeTruthy();
  directionalLightModel.destroy();
});
test('Light model marker colors clamp very large intensities', async () => {
  const device = await getWebGLTestDevice();
  const pointLightModel = new PointLightModel(device, {
    lights: [{
      type: 'point',
      color: [255, 255, 255],
      intensity: 1e9,
      position: [0, 0, 0]
    }],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const color = Array.from((pointLightModel as any)._instanceData.instanceColors.slice(0, 4));
  expect(color, 'display color is clamped into the readable range').toEqual([1, 1, 1, 1]);
  pointLightModel.destroy();
});
test('Light models update camera uniforms without rebuilding buffers', async () => {
  const device = await getWebGLTestDevice();
  const pointLightModel = new PointLightModel(device, {
    lights: [{
      type: 'point',
      color: [255, 255, 255],
      position: [0, 0, 0]
    }],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const previousPositionBuffer = (pointLightModel as any)._managedBuffers.instancePosition;
  const nextViewMatrix = new Matrix4().lookAt({
    eye: [2, 1, 5]
  });
  pointLightModel.setProps({
    viewMatrix: nextViewMatrix
  });
  expect((pointLightModel as any)._managedBuffers.instancePosition, 'camera-only updates do not rebuild instance buffers').toBe(previousPositionBuffer);
  expect(pointLightModel.shaderInputs.moduleUniforms.lightMarker.viewProjectionMatrix, 'camera uniform is updated').toEqual(new Matrix4(PROJECTION_MATRIX).multiplyRight(nextViewMatrix));
  pointLightModel.destroy();
});
test('Light models rebuild buffers when lights change', async () => {
  const device = await getWebGLTestDevice();
  const pointLightModel = new PointLightModel(device, {
    lights: [{
      type: 'point',
      color: [255, 255, 255],
      position: [0, 0, 0]
    }],
    projectionMatrix: PROJECTION_MATRIX,
    viewMatrix: VIEW_MATRIX
  });
  const previousPositionBuffer = (pointLightModel as any)._managedBuffers.instancePosition;
  pointLightModel.setProps({
    lights: [{
      type: 'point',
      color: [255, 255, 255],
      position: [0, 0, 0]
    }, {
      type: 'point',
      color: [255, 0, 0],
      position: [1, 1, 1]
    }]
  });
  expect((pointLightModel as any)._managedBuffers.instancePosition, 'changing lights rebuilds the managed instance buffers').not.toBe(previousPositionBuffer);
  expect(pointLightModel.instanceCount, 'instance count tracks the new light set').toBe(2);
  pointLightModel.destroy();
});
test('Light models draw with zero, one, and multiple relevant lights', async () => {
  const devices = await getTestDevices();
  for (const device of devices) {
    const framebuffer = device.getDefaultCanvasContext().getCurrentFramebuffer({
      depthStencilFormat: false
    });
    const pointLightModel = new PointLightModel(device, {
      lights: [{
        type: 'ambient',
        color: [255, 255, 255],
        intensity: 1
      }],
      projectionMatrix: PROJECTION_MATRIX,
      viewMatrix: VIEW_MATRIX
    });
    const spotLightModel = new SpotLightModel(device, {
      lights: [{
        type: 'ambient',
        color: [255, 255, 255],
        intensity: 1
      }],
      projectionMatrix: PROJECTION_MATRIX,
      viewMatrix: VIEW_MATRIX
    });
    const directionalLightModel = new DirectionalLightModel(device, {
      lights: [{
        type: 'ambient',
        color: [255, 255, 255],
        intensity: 1
      }],
      projectionMatrix: PROJECTION_MATRIX,
      viewMatrix: VIEW_MATRIX
    });
    let renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      framebuffer
    });
    expect(pointLightModel.draw(renderPass), `${device.type}: point model draws with zero relevant lights`).toBeTruthy();
    expect(spotLightModel.draw(renderPass), `${device.type}: spot model draws with zero relevant lights`).toBeTruthy();
    expect(directionalLightModel.draw(renderPass), `${device.type}: directional model draws with zero relevant lights`).toBeTruthy();
    renderPass.end();
    pointLightModel.setProps({
      lights: [{
        type: 'point',
        color: [255, 255, 255],
        position: [0, 0, 0]
      }]
    });
    spotLightModel.setProps({
      lights: [{
        type: 'spot',
        color: [255, 255, 255],
        direction: [0, 0, -1],
        position: [0, 0, 0]
      }]
    });
    directionalLightModel.setProps({
      lights: [{
        type: 'directional',
        color: [255, 255, 255],
        direction: [0, 0, -1]
      }]
    });
    renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      framebuffer
    });
    expect(pointLightModel.draw(renderPass), `${device.type}: point model draws with one light`).toBeTruthy();
    expect(spotLightModel.draw(renderPass), `${device.type}: spot model draws with one light`).toBeTruthy();
    expect(directionalLightModel.draw(renderPass), `${device.type}: directional model draws with one light`).toBeTruthy();
    renderPass.end();
    pointLightModel.setProps({
      lights: [{
        type: 'point',
        color: [255, 255, 255],
        position: [0, 0, 0]
      }, {
        type: 'point',
        color: [255, 0, 0],
        position: [1, 0, 0]
      }]
    });
    spotLightModel.setProps({
      lights: [{
        type: 'spot',
        color: [255, 255, 255],
        direction: [0, 0, -1],
        position: [0, 0, 0]
      }, {
        type: 'spot',
        color: [255, 0, 0],
        direction: [0, -1, 0],
        position: [1, 0, 0]
      }]
    });
    directionalLightModel.setProps({
      lights: [{
        type: 'directional',
        color: [255, 255, 255],
        direction: [0, 0, -1]
      }, {
        type: 'directional',
        color: [255, 0, 0],
        direction: [-1, 0, 0]
      }]
    });
    renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      framebuffer
    });
    expect(pointLightModel.draw(renderPass), `${device.type}: point model draws with multiple lights`).toBeTruthy();
    expect(spotLightModel.draw(renderPass), `${device.type}: spot model draws with multiple lights`).toBeTruthy();
    expect(directionalLightModel.draw(renderPass), `${device.type}: directional model draws with multiple lights`).toBeTruthy();
    renderPass.end();
    device.submit();
    pointLightModel.destroy();
    spotLightModel.destroy();
    directionalLightModel.destroy();
  }
});
function almostEqual(left: number, right: number, epsilon = 1e-5): boolean {
  return Math.abs(left - right) <= epsilon;
}
