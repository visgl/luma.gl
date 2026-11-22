// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {textureFormatDecoder} from '@luma.gl/core';
import {WEBGLTexture} from '../../../../src/webgl/adapter/resources/webgl-texture';
import {GL} from '@luma.gl/core/webgl-constants';

it('compressed uploads dispatch full and partial mips without an unpack scope', () => {
  const gl = {
    bindTexture: vi.fn(),
    bindBuffer: vi.fn(),
    compressedTexImage2D: vi.fn(),
    compressedTexSubImage2D: vi.fn()
  };
  // No state tracker is installed: compressed uploads do not require unpack overrides.
  const texture = Object.assign(Object.create(WEBGLTexture.prototype), {
    width: 8,
    height: 8,
    depth: 1,
    dimension: '2d',
    baseDimension: '2d',
    format: 'bc1-rgba-unorm',
    compressed: true,
    byteAlignment: 1,
    glTarget: GL.TEXTURE_2D,
    glFormat: 0x83f1,
    gl,
    handle: {},
    device: {getTextureFormatInfo: format => textureFormatDecoder.getInfo(format)},
    _assertWritable: () => {}
  });
  const data = new Uint8Array(32);
  texture.writeData(data);
  expect(gl.compressedTexImage2D).toHaveBeenCalledOnce();
  expect(gl.compressedTexSubImage2D).not.toHaveBeenCalled();
  texture.writeData(data, {x: 4, width: 4, height: 4});
  expect(gl.compressedTexSubImage2D).toHaveBeenCalledOnce();
  expect(gl.compressedTexSubImage2D.mock.calls[0].slice(2, 6)).toEqual([4, 0, 4, 4]);
});
