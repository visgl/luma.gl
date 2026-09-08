// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeShaderBlockLayout} from '@luma.gl/core';
import {
  getShaderModuleUniformBlockFields,
  getShaderModuleUniformLayoutValidationResult,
  PBR_TONE_MAP_MODE,
  pbrScene
} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

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

it('shadertools#pbrScene exposes stable uniform layout metadata', () => {
  expect(PBR_TONE_MAP_MODE, 'portable public tone-mapping mode selectors remain stable').toEqual({
    NONE: 0,
    REINHARD: 1,
    KHRONOS_PBR_NEUTRAL: 2,
    ACES: 3
  });
  expect(Object.keys(pbrScene.uniformTypes), 'uniform type field order is stable').toEqual(
    EXPECTED_UNIFORM_NAMES
  );

  const fragmentValidationResult = getShaderModuleUniformLayoutValidationResult(
    pbrScene,
    'fragment'
  );
  const wgslValidationResult = getShaderModuleUniformLayoutValidationResult(pbrScene, 'wgsl');

  expect(Boolean(fragmentValidationResult?.matches), 'fragment validation result matches').toBe(
    true
  );
  expect(Boolean(wgslValidationResult?.matches), 'WGSL validation result matches').toBe(true);
  expect(
    getShaderModuleUniformBlockFields(pbrScene, 'fragment'),
    'GLSL uniform block order matches uniformTypes'
  ).toEqual(EXPECTED_UNIFORM_NAMES);
  expect(
    getShaderModuleUniformBlockFields(pbrScene, 'wgsl'),
    'WGSL uniform struct order matches uniformTypes'
  ).toEqual(EXPECTED_UNIFORM_NAMES);

  const shaderBlockLayout = makeShaderBlockLayout(pbrScene.uniformTypes);
  expect(shaderBlockLayout.byteLength, 'scene controls preserve the packed block size').toBe(160);
  expect(
    shaderBlockLayout.fields.environmentMipCount.offset,
    'environment mip count occupies the previously unused scalar position'
  ).toBe(4);
  expect(
    shaderBlockLayout.fields.outputEncoding.offset,
    'output encoding occupies the remaining scene-uniform padding slot'
  ).toBe(5);
  expect(
    shaderBlockLayout.fields.framebufferSize.offset,
    'framebuffer dimensions retain vector alignment after the mip count'
  ).toBe(6);
  expect(
    Object.keys(shaderBlockLayout.fields),
    'uniform buffer layout key order matches uniform definitions'
  ).toEqual(EXPECTED_UNIFORM_NAMES);

  void 0;
});
