// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {picking} from '../../shadertools/src/index';
// import {_ShaderInputs as ShaderInputs} from '@luma.gl/engine';
import {ShaderInputs} from '../src/shader-inputs';

test('ShaderInputs#picking', (t) => {
  const shaderInputsUntyped = new ShaderInputs({picking});
  // Add 
  shaderInputsUntyped.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  t.ok(shaderInputsUntyped, 'untyped');

  // @ts-expect-error
  shaderInputsUntyped.setProps({picking: {invalidKey: 1}});

  const shaderInputs = new ShaderInputs<{picking: typeof picking.props}>({picking});
  shaderInputs.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  t.ok(shaderInputs, 'typed access');

  t.end();
});

test('ShaderInputs#picking', (t) => {
  const shaderInputsUntyped = new ShaderInputs({picking});
  shaderInputsUntyped.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  t.ok(shaderInputsUntyped, 'untyped');

  const shaderInputs = new ShaderInputs<{picking: typeof picking.props}>({picking});
  shaderInputs.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});

  // @ts-expect-error - if this stops generating an error, we have should trigger a typescript error here
  shaderInputs.setProps({picking: {invalidKey: true}});

  t.ok(shaderInputs, 'typed access');

  // t.comment(JSON.stringify(shaderInputs.getUniformBufferValues(), null, 2));

  t.end();
});
