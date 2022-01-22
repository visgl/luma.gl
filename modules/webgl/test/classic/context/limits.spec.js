import {getKey, getContextInfo} from '@luma.gl/webgl';
import {WEBGL_LIMITS} from '../../adapter/device-helpers/device-limits.spec';
import test from 'tape-promise/tape';

import {fixture} from 'test/setup';

test('WebGL#getContextInfo', (t) => {
  const {gl} = fixture;

  t.ok(getContextInfo, 'getContextInfo defined');

  const info = getContextInfo(gl);

  t.ok('limits' in info, 'info has limits');
  t.ok('info' in info, 'info has info');

  t.end();
});

test('WebGL1#getContextInfo#limits', (t) => {
  const {gl} = fixture;

  const info = getContextInfo(gl);

  for (const limit in WEBGL_LIMITS) {
    const actual = info.limits[limit];
    t.ok(actual !== undefined, `${getKey(gl, limit)}: limit ${actual}`);
  }

  t.end();
});

test('WebGL2#getContextInfo#limits', (t) => {
  const {gl2} = fixture;

  if (gl2) {
    const info = getContextInfo(gl2);

    for (const limit in WEBGL_LIMITS) {
      const actual = info.limits[limit];
      t.ok(actual !== undefined, `${getKey(gl2, limit)}: limit ${actual}`);
    }
  }

  t.end();
});
