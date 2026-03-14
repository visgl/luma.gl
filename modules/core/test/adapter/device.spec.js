// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import { getTestDevices } from '@luma.gl/test-utils';
// import {luma} from '@luma.gl/core';
test('Device#info', async (t) => {
    for (const device of await getTestDevices()) {
        // TODO
        t.ok(typeof device.info.vendor === 'string', 'info.vendor ok');
        t.ok(typeof device.info.renderer === 'string', 'info.renderer ok');
    }
    t.end();
});
// Minimal test, extensive test in texture-formats.spec
test('Device#isTextureFormatCompressed', async (t) => {
    for (const device of await getTestDevices()) {
        // Just sanity check two types
        t.equal(device.isTextureFormatCompressed('rgba8unorm'), false);
        t.equal(device.isTextureFormatCompressed('bc3-rgba-unorm'), true);
    }
    t.end();
});
test('Device#getSupportedCompressedTextureFormats', async (t) => {
    for (const device of await getTestDevices()) {
        const formats = device.getSupportedCompressedTextureFormats();
        t.ok(Array.isArray(formats), `${device.id} returns an array`);
        t.equal(new Set(formats).size, formats.length, `${device.id} does not return duplicate formats`);
        for (const format of formats) {
            t.equal(device.isTextureFormatCompressed(format), true, `${device.id} returns only compressed formats`);
            t.equal(device.isTextureFormatSupported(format), true, `${device.id} returns only supported compressed formats`);
        }
    }
    t.end();
});
test.skip('WebGLDevice#lost (Promise)', async (t) => {
    const device = await luma.createDevice({});
    // Wrap in a promise to make sure tape waits for us
    await new Promise(async (resolve) => {
        setTimeout(async () => {
            const cause = await device.lost;
            t.equal(cause.reason, 'destroyed', `Context lost: ${cause.message}`);
            t.end();
            resolve();
        }, 0);
        device.loseDevice();
    });
    device.destroy();
    t.end();
});
