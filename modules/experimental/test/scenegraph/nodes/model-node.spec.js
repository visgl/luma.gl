// Copyright (c) 2015 - 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import test from 'tape-promise/tape';
import {makeSpy} from '@probe.gl/test-utils';
import {fixture} from 'test/setup';
import {Model} from '@luma.gl/engine';
import {ModelNode} from '@luma.gl/experimental';

const DUMMY_VS = `
  void main() { gl_Position = vec4(1.0); }
`;

const DUMMY_FS = `
  precision highp float;
  void main() { gl_FragColor = vec4(1.0); }
`;

test('ModelNode#constructor', (t) => {
  const {gl} = fixture;
  const model = new Model(gl, {vs: DUMMY_VS, fs: DUMMY_FS});

  const mNode1 = new ModelNode(gl, {vs: DUMMY_VS, fs: DUMMY_FS});
  t.ok(mNode1.model instanceof Model, 'should get constructed with gl');

  const mNode2 = new ModelNode(model);
  t.ok(mNode2.model instanceof Model, 'should get constructed with Model object');

  t.end();
});

test('ModelNode#setProps', (t) => {
  const props = {
    instanceCount: 100
  };
  const {gl} = fixture;
  const model = new Model(gl, {vs: DUMMY_VS, fs: DUMMY_FS});
  const modelSetPropsSpy = makeSpy(model, 'setProps');
  const mNode = new ModelNode(model);
  mNode.setProps(props);

  // once during construction and once during setProps
  t.equal(modelSetPropsSpy.callCount, 2, 'should call setProps on model');
  modelSetPropsSpy.restore();

  t.end();
});

test('ModelNode#Model forwards', (t) => {
  const {gl} = fixture;
  const model = new Model(gl, {vs: DUMMY_VS, fs: DUMMY_FS});
  const resourceModel = new Model(gl, {vs: DUMMY_VS, fs: DUMMY_FS});
  const resourceSpy = makeSpy(resourceModel, 'delete');
  const managedResources = [resourceModel];
  const mNode = new ModelNode(model, {managedResources});
  // make sure `delete` is the last method to call
  const modelMethods = ['draw', 'setUniforms', 'setAttributes', 'updateModuleSettings', 'delete'];
  modelMethods.forEach((methodName) => {
    const spy = makeSpy(model, methodName);
    mNode[methodName]();
    t.equal(spy.callCount, 1, `should forward ${methodName} to model`);
    spy.restore();
  });
  t.equal(resourceSpy.callCount, 1, 'should call delete on managedResources');
  resourceSpy.restore();
  t.end();
});
