// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {WEBGLBuffer} from '@luma.gl/webgl'
import test from 'tape-promise/tape';

import {getWebGLTestDevices} from '@luma.gl/test-utils';

test('WEBGLBuffer#bind/unbind with index', t => {
  for (const device of getWebGLTestDevices()) {
    if (!device.isWebGL2) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    const buffer = device.createBuffer({usage: Buffer.UNIFORM});
    device.gl2.bindBufferBase(buffer.glTarget, 0, buffer.handle);
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer bind/unbind with index successful`);
    device.gl2.bindBufferBase(buffer.glTarget, 0, null);

    buffer.destroy();
  }

  t.end();
});

test('WEBGLBuffer#subData', t => {
  for (const device of getWebGLTestDevices()) {
    let buffer: WEBGLBuffer;

    buffer = device.createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])});
    t.ok(buffer instanceof Buffer, `${device.info.type} Device.createBuffer(ARRAY_BUFFER) successful`);
    buffer.destroy();

    buffer = device.createBuffer({
      usage: Buffer.VERTEX,
      data: new Float32Array([1, 2, 3])
    })
      .subData({data: new Float32Array([1, 2, 3])});
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.subData(ARRAY_BUFFER) successful`);
    buffer.destroy();

    buffer = device.createBuffer({usage: Buffer.INDEX, data: new Float32Array([1, 2, 3])})
    t.ok(
      buffer instanceof Buffer,
      `${device.info.type} Device.createBuffer(ELEMENT_ARRAY_BUFFER) successful`
    );
    buffer.destroy();

    buffer = device.createBuffer({usage: Buffer.INDEX, data: new Float32Array([1, 2, 3])})
      .subData({data: new Float32Array([1, 1, 1])});
    t.ok(
      buffer instanceof Buffer,
      `${device.info.type} Buffer.subData(ARRAY_ELEMENT_BUFFER) successful`
    );
    buffer.destroy();
  }
  t.end();
});
