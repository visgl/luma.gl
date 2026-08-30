// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';

import {GL} from '@luma.gl/webgl/constants';
import {WEBGL_TEXTURE_FORMATS} from '../../../src/adapter/converters/webgl-texture-table';

it('WEBGL_TEXTURE_FORMATS maps ASTC 10x5 formats correctly', () => {
  expect(WEBGL_TEXTURE_FORMATS['astc-10x5-unorm'].gl).toBe(GL.COMPRESSED_RGBA_ASTC_10x5_KHR);
  expect(WEBGL_TEXTURE_FORMATS['astc-10x5-unorm-srgb'].gl).toBe(
    GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR
  );
});
