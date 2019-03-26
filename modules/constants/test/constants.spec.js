import test from 'tape-catch';
import {fixture} from 'test/setup';

import GL from '@luma.gl/constants';

test('@luma.gl/constants', t => {
  t.equal(typeof GL, 'object', '@luma.gl/constants is an object');
  t.end();
});

test('@luma.gl/constants#WebGL1 context', t => {
  for (const key in fixture.gl) {
    const value = fixture.gl[key];
    if (Number.isFinite(value) && key.toUpperCase() === key && GL[key] !== undefined) {
      t.equals(GL[key], value, `GL.${key} is equal to gl.${key}`);
    }
  }
  t.end();
});
