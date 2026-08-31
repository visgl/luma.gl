// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

it('WEBGLTexture keeps borrowed handles read-only', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const textureHandle = gl.createTexture()!;
  const methodCallCounts = {
    deleteTexture: 0,
    generateMipmap: 0,
    texParameteri: 0,
    texStorage2D: 0
  };
  const originalDeleteTexture = gl.deleteTexture.bind(gl);
  const originalGenerateMipmap = gl.generateMipmap.bind(gl);
  const originalTexParameteri = gl.texParameteri.bind(gl);
  const originalTexStorage2D = gl.texStorage2D.bind(gl);
  gl.deleteTexture = (texture => {
    methodCallCounts.deleteTexture++;
    return originalDeleteTexture(texture);
  }) as typeof gl.deleteTexture;
  gl.generateMipmap = (target => {
    methodCallCounts.generateMipmap++;
    return originalGenerateMipmap(target);
  }) as typeof gl.generateMipmap;
  gl.texParameteri = ((target, parameterName, parameterValue) => {
    methodCallCounts.texParameteri++;
    return originalTexParameteri(target, parameterName, parameterValue);
  }) as typeof gl.texParameteri;
  gl.texStorage2D = ((target, levels, internalFormat, width, height) => {
    methodCallCounts.texStorage2D++;
    return originalTexStorage2D(target, levels, internalFormat, width, height);
  }) as typeof gl.texStorage2D;

  try {
    expect(
      () => device.createTexture({_isHandleBorrowed: true, width: 1, height: 1}),
      'borrowed wrapper requires an external texture handle'
    ).toThrow(/require.*texture handle/);

    const texture = device.createTexture({
      handle: textureHandle,
      _isHandleBorrowed: true,
      width: 4,
      height: 2
    });

    expect(texture.isHandleBorrowed, 'resource records borrowed handle ownership').toBe(true);
    expect(texture.ownsHandle, 'resource does not own borrowed handle').toBe(false);
    expect(methodCallCounts.texStorage2D, 'borrowed wrapper does not allocate storage').toBe(0);
    expect(methodCallCounts.texParameteri, 'borrowed wrapper does not mutate sampler state').toBe(
      0
    );
    expect(
      () => texture.generateMipmapsWebGL(),
      'borrowed wrapper rejects mipmap generation'
    ).toThrow(/borrowed read-only/);
    expect(
      () => texture.copyElementImage({} as never),
      'borrowed wrapper rejects element uploads'
    ).toThrow(/borrowed read-only/);
    expect(
      () => texture.clone({width: 8, height: 4}),
      'borrowed wrapper rejects resize-like clones'
    ).toThrow(/resize borrowed read-only/);
    expect(methodCallCounts.generateMipmap, 'rejected mipmap generation does not touch GL').toBe(0);

    texture.destroy();
    expect(
      methodCallCounts.deleteTexture,
      'destroying wrapper does not delete borrowed handle'
    ).toBe(0);
  } finally {
    gl.deleteTexture = originalDeleteTexture;
    gl.generateMipmap = originalGenerateMipmap;
    gl.texParameteri = originalTexParameteri;
    gl.texStorage2D = originalTexStorage2D;
    originalDeleteTexture(textureHandle);
    device.destroy();
  }
});
