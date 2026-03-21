// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
// import {makeSpy} from '@probe.gl/test-utils';
import {Model, ModelNode} from '@luma.gl/engine';

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

test('ModelNode#constructor', async t => {
  const webglDevice = await getWebGLTestDevice();

  for (const device of [webglDevice]) {
    const model = new Model(device, {vs: DUMMY_VS, fs: DUMMY_FS});

    const mNode1 = new ModelNode({model});
    t.ok(mNode1.model instanceof Model, 'should get constructed with model');
  }
  t.end();
});

test('ModelNode#setProps', async t => {
  const webglDevice = await getWebGLTestDevice();
  const model = new Model(webglDevice, {vs: DUMMY_VS, fs: DUMMY_FS});
  const modelNode = new ModelNode({model});

  modelNode.setProps({position: [1, 2, 3]});
  t.deepEqual(
    Array.from(modelNode.position),
    [1, 2, 3],
    'setProps updates position on scenegraph node'
  );

  t.end();
});
