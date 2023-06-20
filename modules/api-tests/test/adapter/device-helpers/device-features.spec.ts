import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';
import {DeviceFeature} from '@luma.gl/api';

// true: always supported in WebGL2, false: never supported in WebGL1
const WEBGL2_ALWAYS_FEATURES: DeviceFeature[] = [
  'webgl2',

  // api support
  'vertex-array-object-webgl1',
  'instanced-rendering-webgl1',
  'multiple-render-targets-webgl1',

  // features
  'index-uint32-webgl1',
  'blend-minmax-webgl1',
  'texture-formats-srgb-webgl1',

  'texture-formats-depth-webgl1',
  'texture-formats-float32-webgl1',
  'texture-formats-float16-webgl1',

  // glsl extensions
  'glsl-frag-data',
  'glsl-frag-depth',
  'glsl-derivatives',
  'glsl-texture-lod'
];

const WEBGL2_ONLY_FEATURES: DeviceFeature[] = ['webgl2', 'texture-renderable-float32-webgl'];

test('WebGLDevice#features (query for unknown features)', (t) => {
  // @ts-expect-error
  t.notOk(webgl1Device.features.has('unknown'), 'features.has should return false');
  // @ts-expect-error
  t.notOk(webgl1Device.features.has(''), 'features.has should return false');
  t.end();
});

test('WebGLDevice#features (WebGL1)', (t) => {
  t.notOk(webgl1Device.features.has('webgl2'), 'features.has should return false');
  t.notOk(
    webgl1Device.features.has('texture-renderable-float32-webgl'),
    'features.has should return false'
  );
  t.end();
});

test('WebGLDevice#hasFeatures (WebGL2)', (t) => {
  if (webgl2Device) {
    t.ok(
      webgl2Device.features.has('vertex-array-object-webgl1'),
      'features.has should return true'
    );
    t.ok(
      webgl2Device.features.has('instanced-rendering-webgl1'),
      'features.has should return true'
    );
  }
  t.end();
});

test('WebGLDevice#hasFeature(WebGL1)', (t) => {
  for (const feature of WEBGL2_ONLY_FEATURES) {
    t.equal(
      webgl1Device.features.has(feature),
      false,
      `${feature} is never supported under WebGL1`
    );
  }
  t.end();
});

test('WebGLDevice#hasFeature(WebGL2)', (t) => {
  if (webgl2Device) {
    for (const feature of WEBGL2_ALWAYS_FEATURES) {
      t.equal(
        webgl2Device.features.has(feature),
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
