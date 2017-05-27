import {createGLContext} from 'luma.gl';
import {hasFeatures, FEATURES} from '../../src/webgl/context-features';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

test('WebGL#hasFeatures', t => {
  const {gl} = fixture;

  t.ok(typeof hasFeatures === 'function', 'hasFeatures defined');

  for (const feature in FEATURES) {
    t.ok(hasFeatures(gl, feature) !== undefined, `${feature} is not undefined`);
  }

  t.end();
});

// test('getContextInfo#caps', t => {
//   const {gl} = fixture;

//   const info = getContextInfo(gl);

//   for (const cap in TEST_EXPORTS.WEBGL_CAPS) {
//     const value = info.caps[cap];
//     t.ok(value === false || value === true || value === ES300,
//       `${cap}: cap has one of three allowed values`);
//   }

//   t.end();
// });
