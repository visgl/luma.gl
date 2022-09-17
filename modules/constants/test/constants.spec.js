import test from 'tape-catch';
import {fixture} from 'test/setup';

import GL from '@luma.gl/constants';

test('@luma.gl/constants', t => {
  t.equal(typeof GL, 'object', '@luma.gl/constants is an object');
  t.end();
});

test('@luma.gl/constants#WebGL1 context', t => {
  const count = checkConstants(fixture.gl, t);
  t.comment(`Checked ${count} GL constants against platform WebGL1 context`);
  t.end();
});

test('@luma.gl/constants#WebGL2 context', t => {
  const count = checkConstants(fixture.gl2, t);
  t.comment(`Checked ${count} GL constants against platform WebGL2 context`);
  t.end();
});

function checkConstants(gl, t) {
  let count = 0;
  for (const key in gl) {
    const value = gl[key];
    if (Number.isFinite(value) && key.toUpperCase() === key && GL[key] !== undefined) {
      // Avoid generating too much test log
      if (GL[key] !== value) {
        t.equals(GL[key], value, `GL.${key} is equal to gl.${key}`);
      }
      count++;
    }
  }
  return count;
}
