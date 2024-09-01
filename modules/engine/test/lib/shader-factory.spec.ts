// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {ShaderFactory} from '@luma.gl/engine';

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

test('ShaderFactory#import', async t => {
  t.ok(ShaderFactory !== undefined, 'ShaderFactory import successful');
  t.end();
});

test('ShaderFactory#getDefaultShaderFactory', async t => {
  const webglDevice = await getWebGLTestDevice();

  const factory1 = ShaderFactory.getDefaultShaderFactory(webglDevice);
  const factory2 = ShaderFactory.getDefaultShaderFactory(webglDevice);

  t.ok(factory1 instanceof ShaderFactory, 'Default pipeline manager created');
  t.isEqual(factory1, factory2, 'Default pipeline manager cached');

  t.end();
});

test('ShaderFactory#createShader', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cacheShaders) {
    t.comment('Shader caching not enabled');
    t.end();
    return;
  }

  const factory = ShaderFactory.getDefaultShaderFactory(webglDevice);
  const shader1 = factory.createShader({id: '1', stage: 'vertex', source: vs1});
  const shader2 = factory.createShader({id: '2', stage: 'vertex', source: vs1});
  const shader3 = factory.createShader({id: '3', stage: 'vertex', source: vs2});

  t.isEqual(shader1, shader2, 'Caches identical shaders');
  t.notEqual(shader1, shader3, 'Does not cache non-identical shaders');

  t.deepEqual(
    [shader1.id, shader2.id, shader3.id],
    ['1-cached', '1-cached', '3-cached'],
    'Annotates IDs of cached shaders'
  );

  factory.release(shader1);
  factory.release(shader2);
  factory.release(shader3);

  t.end();
});

test('ShaderFactory#release', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cacheShaders) {
    t.comment('Shader caching not enabled');
    t.end();
    return;
  }

  const factory = new ShaderFactory(webglDevice);
  const shader1 = factory.createShader({id: '1', stage: 'vertex', source: vs1});
  const shader2 = factory.createShader({id: '2', stage: 'vertex', source: vs1});
  const shader3 = factory.createShader({id: '3', stage: 'vertex', source: vs2});

  factory.release(shader2);
  factory.release(shader3);
  t.deepEqual(
    [shader1.destroyed, shader2.destroyed, shader3.destroyed],
    [false, false, true],
    'Keeps used shaders'
  );

  factory.release(shader1);
  t.deepEqual(
    [shader1.destroyed, shader2.destroyed, shader3.destroyed],
    [true, true, true],
    'Destroys unused shaders'
  );

  t.end();
});
