import {hasFeature, hasFeatures, getFeatures, FEATURES} from '../../src/webgl/context-features';
import test from 'tape-catch';

import {fixture} from '../setup';

// true: always supported in WebGL2, false: never supported in WebGL1
const WEBGL_FEATURES = {
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
  COLOR_ATTACHMENT_HALF_FLOAT: false,

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

test('webgl#caps#getFeatures', t => {
  const {gl} = fixture;

  const info = getFeatures(gl);

  for (const cap in FEATURES) {
    const value = info[cap];
    t.ok(value === false || value === true,
      `${cap}: is an allowed (boolean) value`);
  }

  t.end();
});

test('webgl#caps#hasFeatures(WebGL1)', t => {
  const {gl} = fixture;
  t.ok(typeof hasFeatures === 'function', 'hasFeatures defined');

  for (const feature in WEBGL_FEATURES) {
    if (!WEBGL_FEATURES[feature]) {
      t.equal(hasFeature(gl, feature), false, `${feature} is never supported under WebGL1`);
    }
  }

  t.end();
});

test('webgl#caps#hasFeatures(WebGL2)', t => {
  const {gl} = fixture;

  if (fixture.gl2) {
    for (const feature in WEBGL_FEATURES) {
      if (WEBGL_FEATURES[feature]) {
        t.equals(hasFeature(gl, feature), true, `${feature} is always supported under WebGL2`);
      }
    }
  }

  t.end();
});
