// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeShaderBlockLayout} from '@luma.gl/core';
import {
  getShaderModuleUniformBlockFields,
  getShaderModuleUniformLayoutValidationResult,
  PBR_TONE_MAP_MODE,
  pbrScene
} from '@luma.gl/shadertools';
import test from 'test/utils/vitest-tape';

const EXPECTED_UNIFORM_NAMES = [
  'exposure',
  'toneMapMode',
  'environmentIntensity',
  'environmentRotation',
  'environmentMipCount',
  'outputEncoding',
  'framebufferSize',
  'viewMatrix',
  'projectionMatrix'
];

test('shadertools#pbrScene exposes stable uniform layout metadata', testCase => {
  testCase.deepEqual(
    PBR_TONE_MAP_MODE,
    {NONE: 0, REINHARD: 1, KHRONOS_PBR_NEUTRAL: 2, ACES: 3},
    'portable public tone-mapping mode selectors remain stable'
  );
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
  testCase.equal(
    shaderBlockLayout.byteLength,
    160,
    'scene controls preserve the packed block size'
  );
  testCase.equal(
    shaderBlockLayout.fields.environmentMipCount.offset,
    4,
    'environment mip count occupies the previously unused scalar position'
  );
  testCase.equal(
    shaderBlockLayout.fields.outputEncoding.offset,
    5,
    'output encoding occupies the remaining scene-uniform padding slot'
  );
  testCase.equal(
    shaderBlockLayout.fields.framebufferSize.offset,
    6,
    'framebuffer dimensions retain vector alignment after the mip count'
  );
  testCase.deepEqual(
    Object.keys(shaderBlockLayout.fields),
    EXPECTED_UNIFORM_NAMES,
    'uniform buffer layout key order matches uniform definitions'
  );

  testCase.end();
});
