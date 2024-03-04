// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';
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

test('ModelNode#constructor', t => {
  for (const device of [webglDevice]) {
    const model = new Model(device, {vs: DUMMY_VS, fs: DUMMY_FS});

    const mNode1 = new ModelNode({model});
    t.ok(mNode1.model instanceof Model, 'should get constructed with model');
  }
  t.end();
});

// setProps disabled
// test.skip('ModelNode#setProps', (t) => {
//   const props = {
//     instanceCount: 100
//   };

//   for (const device of getWebGLTestDevices()) {
//     const model = new Model(device, {vs: DUMMY_VS, fs: DUMMY_FS});
//     const modelSetPropsSpy = makeSpy(model, 'setProps');
//     const mNode = new ModelNode({model});
//     mNode.setProps(props);
//     t.equal(modelSetPropsSpy.callCount, 1, 'should call setProps on model');
//     modelSetPropsSpy.restore();
//   }

//   t.end();
// });
