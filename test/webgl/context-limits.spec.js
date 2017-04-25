import {createGLContext} from 'luma.gl';
import {getContextInfo, ES300, TEST_LIMITS} from '../../src/webgl/context-limits';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

test('WebGL#getContextInfo', t => {
  const {gl} = fixture;

  t.ok(getContextInfo, 'getContextInfo defined');
  t.ok(ES300, 'ES300 defined');

  const info = getContextInfo(gl);

  t.ok('limits' in info, 'info has limits');
  t.ok('caps' in info, 'info has caps');
  t.ok('info' in info, 'info has info');

  t.end();
});

test('getContextInfo#limits', t => {
  const {gl} = fixture;

  const info = getContextInfo(gl);

  for (const limit in TEST_LIMITS.WEBGL_LIMITS) {
    t.ok(info.limits[limit] >= info.webgl1MinLimits[limit],
      `${limit}: actual limit larger than or equal to webgl1 limit`);
    t.ok(info.webgl2MinLimits[limit] >= info.webgl1MinLimits[limit],
      `${limit}: webgl2 limit larger than or equal to webgl1 limit`);
  }

  t.end();
});

test('getContextInfo#caps', t => {
  const {gl} = fixture;

  const info = getContextInfo(gl);

  for (const cap in TEST_LIMITS.WEBGL_CAPS) {
    const value = info.caps[cap];
    t.ok(value === false || value === true || value === ES300,
      `${cap}: cap has one of three allowed values`);
  }

  t.end();
});
