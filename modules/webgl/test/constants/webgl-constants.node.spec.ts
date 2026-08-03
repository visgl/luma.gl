// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GL, type GLConstant, type GLValue} from '@luma.gl/webgl/constants';

test('WebGL constants use a forward-only mapping', t => {
  const triangles: GLConstant<'TRIANGLES'> = GL.TRIANGLES;
  const webglConstant: GLValue = triangles;

  t.is(webglConstant, 0x0004, 'named constants preserve their numeric values');
  t.notOk(String(GL.TRIANGLES) in GL, 'numeric reverse mappings are not generated');
  t.ok(
    Object.values(GL).every(value => typeof value === 'number'),
    'the mapping contains only forward numeric values'
  );
  t.end();
});
