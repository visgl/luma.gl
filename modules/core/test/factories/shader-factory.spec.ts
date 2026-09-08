// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {ShaderFactory} from '@luma.gl/core';

const vs1 = /* glsl */ `\
void main(void) {
  gl_Position = vec4(0.0, 0.0, 0.0, 0.0);
}
`;

const vs2 = /* glsl */ `\
void main(void) {
  gl_Position = vec4(10.0, 10.0, 10.0, 10.0);
}
`;

it('ShaderFactory#import', async () => {
  expect(Boolean(ShaderFactory !== undefined), 'ShaderFactory import successful').toBe(true);
  void 0;
});

it('ShaderFactory#getDefaultShaderFactory', async () => {
  const webglDevice = await getWebGLTestDevice();

  const factory1 = ShaderFactory.getDefaultShaderFactory(webglDevice);
  const factory2 = ShaderFactory.getDefaultShaderFactory(webglDevice);

  expect(Boolean(factory1 instanceof ShaderFactory), 'Default pipeline manager created').toBe(true);
  expect(factory1, 'Default pipeline manager cached').toBe(factory2);

  void 0;
});

it('ShaderFactory#createShader', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cacheShaders) {
    void 0;
    void 0;
    return;
  }

  const factory = ShaderFactory.getDefaultShaderFactory(webglDevice);
  const shader1 = factory.createShader({id: '1', stage: 'vertex', source: vs1});
  const shader2 = factory.createShader({id: '2', stage: 'vertex', source: vs1});
  const shader3 = factory.createShader({id: '3', stage: 'vertex', source: vs2});

  expect(shader1, 'Caches identical shaders').toBe(shader2);
  expect(shader1, 'Does not cache non-identical shaders').not.toBe(shader3);

  expect([shader1.id, shader2.id, shader3.id], 'Annotates IDs of cached shaders').toEqual([
    '1-cached',
    '1-cached',
    '3-cached'
  ]);

  factory.release(shader1);
  factory.release(shader2);
  factory.release(shader3);

  void 0;
});

it('ShaderFactory#release', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cacheShaders) {
    void 0;
    void 0;
    return;
  }

  const factory = new ShaderFactory(webglDevice);
  const shader1 = factory.createShader({id: '1', stage: 'vertex', source: vs1});
  const shader2 = factory.createShader({id: '2', stage: 'vertex', source: vs1});
  const shader3 = factory.createShader({id: '3', stage: 'vertex', source: vs2});

  factory.release(shader2);
  factory.release(shader3);
  expect(
    [shader1.destroyed, shader2.destroyed, shader3.destroyed],
    'Released shaders remain cached by default'
  ).toEqual([false, false, false]);

  factory.release(shader1);
  expect(
    [shader1.destroyed, shader2.destroyed, shader3.destroyed],
    'Unused shaders remain cached by default'
  ).toEqual([false, false, false]);

  void 0;
});
