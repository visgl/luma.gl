// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Texture} from '../../core/src/index';
import {picking, ShaderModule} from '../../shadertools/src/index';
// import {_ShaderInputs as ShaderInputs} from '@luma.gl/engine';
import {ShaderInputs} from '../src/shader-inputs';

test('ShaderInputs#picking', t => {
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

test('ShaderInputs#picking', t => {
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

test('ShaderInputs#picking prop merge', t => {
  const shaderInputs = new ShaderInputs<{picking: typeof picking.props}>({picking});
  const expected = {...picking.defaultUniforms} as typeof picking.uniforms;
  t.deepEqual(shaderInputs.moduleUniforms.picking, expected, 'defaults set');

  shaderInputs.setProps({picking: {highlightColor: [255, 0, 255]}});
  expected.highlightColor = [1, 0, 1, 1]; // Color normalized and alpha added
  t.deepEqual(shaderInputs.moduleUniforms.picking, expected, 'Only highlight color updated');

  // Setting the highlighted object also enables highlight
  shaderInputs.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  expected.highlightedObjectColor = [255, 255, 255];
  expected.isHighlightActive = true;
  t.deepEqual(
    shaderInputs.moduleUniforms.picking,
    expected,
    'Only highlight object and highlight active updated'
  );

  t.end();
});

[true, false].map(callback =>
  test(`ShaderInputs#bindings${callback ? ' (getUniforms)' : ''}`, t => {
    type CustomProps = {color: number[]; colorTexture: Texture};
    const custom: ShaderModule<CustomProps> = {
      name: 'custom',
      uniformTypes: {color: 'vec3<f32>'},
      uniformPropTypes: {color: {value: [0, 0, 0]}}
    };
    if (callback) {
      custom.getUniforms = ({color, colorTexture}) => ({color, colorTexture});
    }

    const shaderInputs = new ShaderInputs<{
      custom: CustomProps;
    }>({custom});

    const MOCK_TEXTURE = 'MOCK_TEXTURE' as unknown as Texture;
    shaderInputs.setProps({
      custom: {color: [255, 0, 0], colorTexture: MOCK_TEXTURE}
    });
    t.deepEqual(shaderInputs.moduleUniforms.custom.color, [255, 0, 0], 'custom color updated');
    t.equal(shaderInputs.moduleBindings.custom.colorTexture, MOCK_TEXTURE, 'colorTexture updated');

    const uniformValues = shaderInputs.getUniformValues();
    const bindings = shaderInputs.getBindings();
    t.deepEqual(uniformValues, {custom: {color: [255, 0, 0]}}, 'uniformValues correct');
    t.deepEqual(bindings, {colorTexture: 'MOCK_TEXTURE'}, 'bindings correct');

    t.end();
  })
);
