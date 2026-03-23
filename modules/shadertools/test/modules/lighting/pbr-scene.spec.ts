// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeShaderBlockLayout} from '@luma.gl/core';
import {
  getShaderModuleUniformBlockFields,
  getShaderModuleUniformLayoutValidationResult,
  pbrScene
} from '@luma.gl/shadertools';

const EXPECTED_UNIFORM_NAMES = [
  'exposure',
  'toneMapMode',
  'environmentIntensity',
  'environmentRotation',
  'framebufferSize',
  'viewMatrix',
  'projectionMatrix'
];

test('shadertools#pbrScene exposes stable uniform layout metadata', testCase => {
  testCase.deepEqual(
    Object.keys(pbrScene.uniformTypes),
    EXPECTED_UNIFORM_NAMES,
    'uniform type field order is stable'
  );

  const fragmentValidationResult = getShaderModuleUniformLayoutValidationResult(
    pbrScene,
    'fragment'
  );
  const wgslValidationResult = getShaderModuleUniformLayoutValidationResult(pbrScene, 'wgsl');

  testCase.ok(fragmentValidationResult?.matches, 'fragment validation result matches');
  testCase.ok(wgslValidationResult?.matches, 'WGSL validation result matches');
  testCase.deepEqual(
    getShaderModuleUniformBlockFields(pbrScene, 'fragment'),
    EXPECTED_UNIFORM_NAMES,
    'GLSL uniform block order matches uniformTypes'
  );
  testCase.deepEqual(
    getShaderModuleUniformBlockFields(pbrScene, 'wgsl'),
    EXPECTED_UNIFORM_NAMES,
    'WGSL uniform struct order matches uniformTypes'
  );

  const shaderBlockLayout = makeShaderBlockLayout(pbrScene.uniformTypes);
  testCase.ok(
    shaderBlockLayout.byteLength >= 160,
    'uniform block is large enough for matrices and scene controls'
  );
  testCase.deepEqual(
    Object.keys(shaderBlockLayout.fields),
    EXPECTED_UNIFORM_NAMES,
    'uniform buffer layout key order matches uniform definitions'
  );

  testCase.end();
});
