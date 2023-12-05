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

test('WEBGLBuffer#initialize/subData', t => {
  for (const device of getWebGLTestDevices()) {
    let buffer: WEBGLBuffer;

    // TODO(donmccurdy): If these methods are important in v9, test that they work correctly.

    buffer = device.createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])})
      .initialize({data: new Float32Array([1, 2, 3])})
      .bind()
      .unbind();
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.initialize(ARRAY_BUFFER) successful`);
    buffer.destroy();

    buffer = device.createBuffer({
      usage: Buffer.VERTEX,
      data: new Float32Array([1, 2, 3])
    })
      .subData({data: new Float32Array([1, 2, 3])})
      .bind()
      .unbind();
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.subData(ARRAY_BUFFER) successful`);
    buffer.destroy();

    buffer = device.createBuffer({usage: Buffer.INDEX, data: new Float32Array([1, 2, 3])})
      .initialize({data: new Float32Array([1, 2, 3])})
      .bind()
      .unbind();
    t.ok(
      buffer instanceof Buffer,
      `${device.info.type} buffer.initialize(ELEMENT_ARRAY_BUFFER) successful`
    );
    buffer.destroy();

    buffer = device.createBuffer({usage: Buffer.INDEX, data: new Float32Array([1, 2, 3])})
      .subData({data: new Float32Array([1, 1, 1])})
      .bind()
      .unbind();
    t.ok(
      buffer instanceof Buffer,
      `${device.info.type} Buffer.subData(ARRAY_ELEMENT_BUFFER) successful`
    );
    buffer.destroy();
  }
  t.end();
});

test('WEBGLBuffer#copyData', t => {
  for (const device of getWebGLTestDevices()) {
    if (!device.isWebGL2) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    const sourceData = new Float32Array([1, 2, 3]);
    const sourceBuffer = device.createBuffer({data: sourceData});
    const destinationData = new Float32Array([4, 5, 6]);
    const destinationBuffer = device.createBuffer({data: destinationData});

    let receivedData = destinationBuffer.getData();
    let expectedData = new Float32Array([4, 5, 6]);
    t.deepEqual(receivedData, expectedData, 'Buffer.getData: default parameters successful');

    destinationBuffer.copyData({sourceBuffer, size: 2 * Float32Array.BYTES_PER_ELEMENT});
    receivedData = destinationBuffer.getData();
    expectedData = new Float32Array([1, 2, 6]);
    t.deepEqual(receivedData, expectedData, 'Buffer.copyData: with size successful');

    destinationBuffer.copyData({
      sourceBuffer,
      readOffset: Float32Array.BYTES_PER_ELEMENT,
      writeOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
      size: Float32Array.BYTES_PER_ELEMENT
    });
    receivedData = destinationBuffer.getData();
    expectedData = new Float32Array([1, 2, 2]);
    t.deepEqual(receivedData, expectedData, 'Buffer.copyData: with size and offsets successful');
  }
  t.end();
});

test('WEBGLBuffer#reallocate', t => {
  for (const device of getWebGLTestDevices()) {
    const buffer = device.createBuffer({byteLength: 100});
    t.equal(buffer.byteLength, 100, 'byteLength should match');
    t.equal(buffer.bytesUsed, 100, 'bytesUsed should match');

    let didRealloc = buffer.reallocate(90);
    t.equal(didRealloc, false, 'Should not reallocate');
    t.equal(buffer.byteLength, 100, 'byteLength should be unchanged');
    t.equal(buffer.bytesUsed, 90, 'bytesUsed should have changed');

    didRealloc = buffer.reallocate(110);
    t.equal(didRealloc, true, 'Should reallocate');
    t.equal(buffer.byteLength, 110, 'byteLength should have changed');
    t.equal(buffer.byteLength, 110, 'bytesUsed should have changed');
  }

  t.end();
});
