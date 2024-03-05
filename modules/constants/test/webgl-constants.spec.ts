// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getTestDevices} from '@luma.gl/test-utils';

import {GL} from '@luma.gl/constants';

test('@luma.gl/constants', t => {
  t.equal(typeof GL, 'object', '@luma.gl/constants is an object');
  t.end();
});

test('@luma.gl/constants#WebGL2RenderingContext comparison', async t => {
  for (const device of await getTestDevices('webgl')) {
    // @ts-ignore
    const gl = device.gl;
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
    t.comment(`Checked ${count} GL constants against platform WebGL2 context`);
  }
  t.end();
});
