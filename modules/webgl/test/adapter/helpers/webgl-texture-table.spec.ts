// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {GL} from '@luma.gl/constants';
import {WEBGL_TEXTURE_FORMATS} from '../../../src/adapter/converters/webgl-texture-table';

test('WEBGL_TEXTURE_FORMATS maps ASTC 10x5 formats correctly', t => {
  t.equal(WEBGL_TEXTURE_FORMATS['astc-10x5-unorm'].gl, GL.COMPRESSED_RGBA_ASTC_10x5_KHR);
  t.equal(
    WEBGL_TEXTURE_FORMATS['astc-10x5-unorm-srgb'].gl,
    GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR
  );
  t.end();
});
