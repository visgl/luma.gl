import test from 'tape-promise/tape';
import {webgl1TestDevice, webgl2TestDevice} from '@luma.gl/test-utils';
import {DeviceFeature} from '@luma.gl/api';

// true: always supported in WebGL2, false: never supported in WebGL1
/** @type {import('../../src/adapter/device-helpers/device-features').Feature[]} */
const WEBGL2_ALWAYS_FEATURES: DeviceFeature[] = [
  'webgl2',

  // api support
  'webgl-vertex-array-object',
  'webgl-instanced-rendering',
  'webgl-multiple-render-targets',

  // features
  'webgl-element-index-uint32',
  'webgl-blend-equation-minmax',
  'webgl-color-encoding-srgb',

  'webgl-texture-depth',
  'webgl-texture-float',
  'webgl-texture-half-float',

  // glsl extensions
  'glsl-frag-data',
  'glsl-frag-depth',
  'glsl-derivatives',
  'glsl-texture-lod'
];

const WEBGL2_ONLY_FEATURES: DeviceFeature[] = ['webgl2', 'webgl-color-attachment-float'];

test('WebGLDevice#features (unknown)', (t) => {
  // @ts-expect-error
  t.notOk(webgl1TestDevice.features.has('unknown'), 'features.has should return false');
  // @ts-expect-error
  t.notOk(webgl1TestDevice.features.has(''), 'features.has should return false');
  t.end();
});

test('WebGLDevice#features (WebGL1)', (t) => {
  t.notOk(webgl1TestDevice.features.has('webgl2'), 'features.has should return false');
  t.notOk(
    webgl1TestDevice.features.has('webgl-color-attachment-float'),
    'features.has should return false'
  );
  t.end();
});

test('WebGLDevice#hasFeatures (WebGL2)', (t) => {
  if (webgl2TestDevice) {
    t.ok(
      webgl2TestDevice.features.has('webgl-vertex-array-object'),
      'features.has should return true'
    );
    t.ok(
      webgl2TestDevice.features.has('webgl-instanced-rendering'),
      'features.has should return true'
    );
  }
  t.end();
});

test('WebGLDevice#hasFeature(WebGL1)', (t) => {
  for (const feature of WEBGL2_ONLY_FEATURES) {
    t.equal(
      webgl1TestDevice.features.has(feature),
      false,
      `${feature} is never supported under WebGL1`
    );
  }
  t.end();
});

test('WebGLDevice#hasFeature(WebGL2)', (t) => {
  if (webgl2TestDevice) {
    for (const feature of WEBGL2_ALWAYS_FEATURES) {
      t.equal(
        webgl2TestDevice.features.has(feature),
        true,
        `${feature} is always supported under WebGL2`
      );
    }
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
