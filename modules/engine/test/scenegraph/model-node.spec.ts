// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGLTestDevice} from '@luma.gl/test-utils';
// import {makeSpy} from '@probe.gl/test-utils';
import {Model, ModelNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

export const DUMMY_VS = `\
#version 300 es
void main() { gl_Position = vec4(1.0); }
`;

export const DUMMY_FS = `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() { fragmentColor = vec4(1.0); }
`;

it('ModelNode#constructor', async () => {
  const webglDevice = await getWebGLTestDevice();

  for (const device of [webglDevice]) {
    const model = new Model(device, {vs: DUMMY_VS, fs: DUMMY_FS});

    const mNode1 = new ModelNode({model});
    expect(mNode1.model instanceof Model, 'should get constructed with model').toBe(true);
  }
});

it('ModelNode#setProps', async () => {
  const webglDevice = await getWebGLTestDevice();
  const model = new Model(webglDevice, {vs: DUMMY_VS, fs: DUMMY_FS});
  const modelNode = new ModelNode({model});

  modelNode.setProps({position: [1, 2, 3]});
  expect(Array.from(modelNode.position), 'setProps updates position on scenegraph node').toEqual([
    1, 2, 3
  ]);
});

it('ModelNode#getBounds combines transformed instance bounds', async () => {
  const device = await getWebGLTestDevice();
  const model = new Model(device, {vs: DUMMY_VS, fs: DUMMY_FS});
  const node = new ModelNode({
    model,
    bounds: [
      [-1, -1, -1],
      [1, 1, 1]
    ],
    instanceMatrices: [
      new Matrix4().translate([-2, 0, 1]).scale([1, 2, 1]),
      new Matrix4().translate([3, 1, -2]).scale([0.5, 1, 2])
    ]
  });

  expect(
    node.getBounds(),
    'one model node exposes aggregate bounds for every transformed instance'
  ).toEqual([
    [-3, -2, -4],
    [3.5, 2, 2]
  ]);

  const emptyNode = new ModelNode({
    model: new Model(device, {vs: DUMMY_VS, fs: DUMMY_FS}),
    bounds: [
      [-1, -1, -1],
      [1, 1, 1]
    ],
    instanceMatrices: []
  });
  expect(emptyNode.getBounds(), 'an empty instanced model has no visible bounds').toBeNull();

  node.destroy();
  emptyNode.destroy();
});
