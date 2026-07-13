// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

test('WEBGLTexture keeps borrowed handles read-only', async t => {
  const device = await getWebGLTestDevice(t);
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
    t.throws(
      () => device.createTexture({_isHandleBorrowed: true, width: 1, height: 1}),
      /require.*texture handle/,
      'borrowed wrapper requires an external texture handle'
    );

    const texture = device.createTexture({
      handle: textureHandle,
      _isHandleBorrowed: true,
      width: 4,
      height: 2
    });

    t.true(texture.isHandleBorrowed, 'resource records borrowed handle ownership');
    t.false(texture.ownsHandle, 'resource does not own borrowed handle');
    t.equal(methodCallCounts.texStorage2D, 0, 'borrowed wrapper does not allocate storage');
    t.equal(methodCallCounts.texParameteri, 0, 'borrowed wrapper does not mutate sampler state');
    t.throws(
      () => texture.generateMipmapsWebGL(),
      /borrowed read-only/,
      'borrowed wrapper rejects mipmap generation'
    );
    t.throws(
      () => texture.copyElementImage({} as never),
      /borrowed read-only/,
      'borrowed wrapper rejects element uploads'
    );
    t.throws(
      () => texture.clone({width: 8, height: 4}),
      /resize borrowed read-only/,
      'borrowed wrapper rejects resize-like clones'
    );
    t.equal(methodCallCounts.generateMipmap, 0, 'rejected mipmap generation does not touch GL');

    texture.destroy();
    t.equal(
      methodCallCounts.deleteTexture,
      0,
      'destroying wrapper does not delete borrowed handle'
    );
  } finally {
    gl.deleteTexture = originalDeleteTexture;
    gl.generateMipmap = originalGenerateMipmap;
    gl.texParameteri = originalTexParameteri;
    gl.texStorage2D = originalTexStorage2D;
    originalDeleteTexture(textureHandle);
    device.destroy();
  }

  t.end();
});
