import {isUniformValue, splitUniformsAndBindings} from '@luma.gl/core';
import {WEBGLSampler, WEBGLTexture} from '@luma.gl/webgl';
import {webglDevice as device} from '@luma.gl/test-utils';
import test from 'tape-promise/tape';

test('isUniformValue', t => {
  t.ok(isUniformValue(3), 'Number is uniform value');
  t.ok(isUniformValue(3.412), 'Number is uniform value');
  t.ok(isUniformValue(0), 'Number is uniform value');
  t.ok(isUniformValue(false), 'Boolean is uniform value');
  t.ok(isUniformValue(true), 'Boolean is uniform value');
  t.ok(isUniformValue([1, 2, 3, 4]), 'Number array is uniform value');
  t.ok(isUniformValue(new Float32Array([1, 2, 3, 4])), 'Number array is uniform value');

  t.notOk(isUniformValue(new WEBGLTexture(device, {})), 'WEBGLTexture is not a uniform value');
  t.notOk(isUniformValue(new WEBGLSampler(device, {})), 'WEBGLSampler is not a uniform value');
  t.end();
});

test('splitUniformsAndBindings', t => {
  const mixed: Parameters<typeof splitUniformsAndBindings>[0] = {
    array: [1, 2, 3, 4],
    boolean: true,
    float32array: new Float32Array([1, 2, 3, 4]),
    number: 123,
    sampler: new WEBGLSampler(device, {}),
    texture: new WEBGLTexture(device, {})
  };
  const {bindings, uniforms} = splitUniformsAndBindings(mixed);
  t.deepEquals(Object.keys(bindings), ['sampler', 'texture'], 'bindings correctly extracted');
  t.deepEquals(
    Object.keys(uniforms),
    ['array', 'boolean', 'float32array', 'number'],
    'bindings correctly extracted'
  );
  t.end();
});
