// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';

import {TextureFormat} from '@luma.gl/core';
import {_WEBGLRenderbuffer as WEBGLRenderbuffer, _TEXTURE_FORMATS} from '@luma.gl/webgl';

test('WebGL#WEBGLRenderbuffer construct/delete', t => {
  for (const device of getWebGLTestDevices()) {
    t.throws(
      // @ts-ignore
      () => new WEBGLRenderbuffer(),
      'WEBGLRenderbuffer throws on missing gl context'
    );

    const renderbuffer = new WEBGLRenderbuffer(device, {
      format: 'depth16unorm',
      width: 1,
      height: 1
    });
    t.ok(renderbuffer instanceof WEBGLRenderbuffer, 'WEBGLRenderbuffer construction successful');

    renderbuffer.destroy();
    t.ok(renderbuffer instanceof WEBGLRenderbuffer, 'WEBGLRenderbuffer delete successful');

    renderbuffer.destroy();
    t.ok(renderbuffer instanceof WEBGLRenderbuffer, 'WEBGLRenderbuffer repeated delete successful');
  }

  t.end();
});

test('WebGL#WEBGLRenderbuffer format creation', t => {
  for (const device of getWebGLTestDevices()) {
    for (const formatName of Object.keys(_TEXTURE_FORMATS)) {
      const format = formatName as TextureFormat;
      if (WEBGLRenderbuffer.isTextureFormatSupported(device, format)) {
        t.comment(format);
        const renderbuffer = new WEBGLRenderbuffer(device, {format});
        t.equals(
          renderbuffer.format,
          format,
          `${device.info.type}: WEBGLRenderbuffer(${format}) created with correct format`
        );
        t.doesNotThrow(() => renderbuffer.resize({width: 100, height: 100}), 'resize ok');
        t.equals(renderbuffer.width, 100);
        t.equals(renderbuffer.height, 100);
        renderbuffer.destroy();
      } else {
        // TODO - uncomment and make sure all formats are correct in TEXTURE_FORMATS table.
        // t.comment(format);
        // t.throws(() => new WEBGLRenderbuffer(device, {format}),
        //   `${device.info.type}: WEBGLRenderbuffer(${format}) cannot be created with incorrect format`);
      }
    }
  }

  t.end();
});
