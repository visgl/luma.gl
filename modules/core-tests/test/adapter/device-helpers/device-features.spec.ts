import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';
import {DeviceFeature} from '@luma.gl/core';

// true: always supported in WebGL
const WEBGL_ALWAYS_FEATURES: DeviceFeature[] = [
  'webgl',
  'transform-feedback-webgl',
  'texture-renderable-float32-webgl'
];

test('WebGLDevice#features (query for unknown features)', (t) => {
  // @ts-expect-error
  t.notOk(webglDevice.features.has('unknown'), 'features.has should return false');
  // @ts-expect-error
  t.notOk(webglDevice.features.has(''), 'features.has should return false');
  t.end();
});

test('WebGLDevice#hasFeature(WebGL)', (t) => {
  for (const feature of WEBGL_ALWAYS_FEATURES) {
    t.equal(
      webglDevice.features.has(feature),
      true,
      `${feature} is supported under WebGL`
    );
  }
  t.end();
});

/** Commented out as IE no longer supported
test.skip('WebGLDevice#canCompileGLGSExtension', (t) => {
  const {gl} = fixture;

  const userAgentNonIE =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36';
  const userAgentOldIE = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

  t.ok(typeof canCompileGLGSExtension === 'function', 'canCompileGLGSExtension defined');

  // Non-IE version.
  const getShaderParameterStub = makeSpy(gl, 'getShaderParameter');
  getShaderParameterStub.returns(true);
  t.equals(
    canCompileGLGSExtension(gl, 'glsl_derivatives', {
      userAgent: userAgentNonIE
    }),
    true,
    'returns true when feature can be compiled'
  );

  t.notOk(
    getShaderParameterStub.called,
    'getShaderParameter should not be called when userAgent is not IE 11'
  );

  // Old-IE version.
  getShaderParameterStub.returns(true);
  t.equals(
    canCompileGLGSExtension(gl, 'glsl_derivatives', {
      userAgent: userAgentOldIE
    }),
    true,
    'returns true when feature can be compiled'
  );

  t.ok(
    getShaderParameterStub.called,
    'getShaderParameter should be called when userAgent is IE 11'
  );

  getShaderParameterStub.returns(false);
  t.equals(
    canCompileGLGSExtension(gl, 'glsl_derivatives', {
      userAgent: userAgentOldIE
    }),
    true,
    'memoizes previous call'
  );

  t.equals(
    canCompileGLGSExtension(gl, 'glsl_texture_lod', {
      userAgent: userAgentOldIE
    }),
    false,
    'returns false when feature can not be compiled'
  );

  t.throws(
    () => canCompileGLGSExtension(gl, 'feature.dne'),
    'should throw exception if feature does not exist'
  );

  getShaderParameterStub.restore();
  t.end();
});
 */
