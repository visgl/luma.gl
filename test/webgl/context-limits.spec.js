import {createGLContext} from 'luma.gl';
import {getContextInfo, ES300, TEST_EXPORTS} from '../../src/webgl/context-limits';
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

  for (const limit in TEST_EXPORTS.WEBGL_LIMITS) {
    t.ok(info.limits[limit] >= info.webgl1MinLimits[limit],
      `${limit}: actual limit larger than or equal to webgl1 limit`);
    t.ok(info.webgl2MinLimits[limit] >= info.webgl1MinLimits[limit],
      `${limit}: webgl2 limit larger than or equal to webgl1 limit`);
  }

  t.end();
});
