// luma.gl, MIT license

import test from 'tape-promise/tape';
import {fixture} from 'test/setup';
import {makeSpy} from '@probe.gl/test-utils';
import {Model} from '@luma.gl/webgl-legacy';
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
