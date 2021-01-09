import {
  canCompileGLGSExtension,
  hasFeature,
  hasFeatures,
  getFeatures,
  FEATURES
} from '@luma.gl/webgl';
import test from 'tape-catch';
import {makeSpy} from '@probe.gl/test-utils';

import {fixture} from 'test/setup';

// true: always supported in WebGL2, false: never supported in WebGL1
const WEBGL_FEATURES = {
  WEBGL2: true,

  // API SUPPORT
  VERTEX_ARRAY_OBJECT: true,
  INSTANCED_RENDERING: true,
  MULTIPLE_RENDER_TARGETS: true,

  // FEATURES
  ELEMENT_INDEX_UINT32: true,
  BLEND_EQUATION_MINMAX: true,
  COLOR_ENCODING_SRGB: true,

  TEXTURE_DEPTH: true,
  TEXTURE_FLOAT: true,
  TEXTURE_HALF_FLOAT: true,

  COLOR_ATTACHMENT_FLOAT: false,

  // GLSL extensions
  GLSL_FRAG_DATA: true,
  GLSL_FRAG_DEPTH: true,
  GLSL_DERIVATIVES: true,
  GLSL_TEXTURE_LOD: true
};

test('webgl#caps#imports', t => {
  t.ok(typeof hasFeature === 'function', 'hasFeature defined');
  t.ok(typeof hasFeatures === 'function', 'hasFeatures defined');
  t.ok(typeof getFeatures === 'function', 'getFeatures defined');
  t.end();
});

test('webgl#caps#hasFeatures (WebGL1)', t => {
  const {gl} = fixture;
  const UNSUPPORTED_WEBGL1_FEATURES = [FEATURES.WEBGL2, FEATURES.COLOR_ATTACHMENT_FLOAT];

  t.notOk(hasFeatures(gl, UNSUPPORTED_WEBGL1_FEATURES), 'hasFeatures should return false');
  t.end();
});

test('webgl#caps#hasFeatures (WebGL2)', t => {
  const {gl2} = fixture;
  const SUPPORTED_WEBGL2_FEATURES = [FEATURES.VERTEX_ARRAY_OBJECT, FEATURES.INSTANCED_RENDERING];

  if (gl2) {
    t.ok(hasFeatures(gl2, SUPPORTED_WEBGL2_FEATURES), 'hasFeatures should return true');
  }
  t.end();
});

test('webgl#caps#getFeatures', t => {
  const {gl} = fixture;

  const info = getFeatures(gl);

  for (const cap in FEATURES) {
    const value = info[cap];
    t.ok(value === false || value === true, `${cap}: is an allowed (boolean) value`);
  }

  t.end();
});

test('webgl#caps#hasFeature(WebGL1)', t => {
  const {gl} = fixture;
  t.ok(typeof hasFeatures === 'function', 'hasFeatures defined');

  for (const feature in WEBGL_FEATURES) {
    if (!WEBGL_FEATURES[feature]) {
      t.equal(hasFeature(gl, feature), false, `${feature} is never supported under WebGL1`);
    }
  }

  t.end();
});

test('webgl#caps#hasFeature(WebGL2)', t => {
  const {gl2} = fixture;

  if (gl2) {
    for (const feature in WEBGL_FEATURES) {
      if (WEBGL_FEATURES[feature]) {
        t.equals(hasFeature(gl2, feature), true, `${feature} is always supported under WebGL2`);
      }
    }
  }

  t.end();
});

test('webgl#caps#canCompileGLGSExtension', t => {
  const {gl} = fixture;

  const userAgentNonIE =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36';
  const userAgentOldIE = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

  t.ok(typeof canCompileGLGSExtension === 'function', 'canCompileGLGSExtension defined');

  // Non-IE version.
  const getShaderParameterStub = makeSpy(gl, 'getShaderParameter');
  getShaderParameterStub.returns(true);
  t.equals(
    canCompileGLGSExtension(gl, FEATURES.GLSL_DERIVATIVES, {
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
    canCompileGLGSExtension(gl, FEATURES.GLSL_DERIVATIVES, {
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
    canCompileGLGSExtension(gl, FEATURES.GLSL_DERIVATIVES, {
      userAgent: userAgentOldIE
    }),
    true,
    'memoizes previous call'
  );

  t.equals(
    canCompileGLGSExtension(gl, FEATURES.GLSL_TEXTURE_LOD, {
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

test('webgl#caps#cache', t => {
  const {gl} = fixture;
  const cap = FEATURES.WEBGL2;
  // @ts-ignore
  gl.luma = gl.luma || {};
  // @ts-ignore
  const {luma} = gl;

  const originalCaps = luma.caps;
  luma.caps = {};
  hasFeature(gl, cap);
  t.ok(luma.caps[cap] !== undefined, 'Feature should cache after query');
  luma.caps = originalCaps;
  t.end();
});
