// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import { getWebGPUTestDevice } from '@luma.gl/test-utils';
import { Texture } from '@luma.gl/core';
import { DynamicTexture } from '../../src/index';
const RENDER_MIPMAP_TEST_FORMAT = 'rgba8unorm';
const NON_COLOR_RENDER_TEST_FORMAT = 'rg16uint';
const COMPUTE_MIPMAP_TEST_FORMAT = 'rgba8unorm';
function createTestLabel(method, format, dimension, detail) {
    return `[${method}][${format}][${dimension}] ${detail}`;
}
test('DynamicTexture WebGPU [render][rgba8unorm] 2d mipmaps', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: '2d',
        width: 4,
        height: 4,
        format: RENDER_MIPMAP_TEST_FORMAT,
        mipmaps: true,
        mipLevels: 'auto',
        data: makeQuadrantMipData(4, 4, [
            [0, 0, 0, 255],
            [4, 0, 0, 255],
            [8, 0, 0, 255],
            [12, 0, 0, 255]
        ])
    });
    await texture.ready;
    const manualTexture = new DynamicTexture(device, {
        dimension: '2d',
        width: 4,
        height: 4,
        format: RENDER_MIPMAP_TEST_FORMAT,
        mipmaps: false,
        usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
        mipLevels: 3,
        data: makeQuadrantMipData(4, 4, [
            [0, 0, 0, 255],
            [4, 0, 0, 255],
            [8, 0, 0, 255],
            [12, 0, 0, 255]
        ])
    });
    await manualTexture.ready;
    manualTexture.generateMipmaps();
    const manualArrayBuffer = await manualTexture.texture.readDataAsync({
        mipLevel: 1,
        width: 2,
        height: 2
    });
    const manualBytes = new Uint8Array(manualArrayBuffer);
    const manualBytesPerRowLevel1 = Math.ceil((2 * 4) / manualTexture.texture.byteAlignment) * manualTexture.texture.byteAlignment;
    t.deepEqual(Array.from(manualBytes.slice(0, 4)), [0, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'manual generate mip level 1: quadrant 1'));
    t.deepEqual(Array.from(manualBytes.slice(4, 8)), [4, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'manual generate mip level 1: quadrant 2'));
    t.deepEqual(Array.from(manualBytes.slice(manualBytesPerRowLevel1, manualBytesPerRowLevel1 + 4)), [8, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'manual generate mip level 1: quadrant 3'));
    t.deepEqual(Array.from(manualBytes.slice(manualBytesPerRowLevel1 + 4, manualBytesPerRowLevel1 + 8)), [12, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'manual generate mip level 1: quadrant 4'));
    const manualArrayBuffer2 = await manualTexture.texture.readDataAsync({
        mipLevel: 2,
        width: 1,
        height: 1
    });
    const manualBytesLevel2 = new Uint8Array(manualArrayBuffer2);
    t.deepEqual(Array.from(manualBytesLevel2.slice(0, 4)), [6, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'manual generate mip level 2'));
    manualTexture.destroy();
    const bytesPerRowLevel1 = Math.ceil((2 * 4) / texture.texture.byteAlignment) * texture.texture.byteAlignment;
    const arrayBuffer = await texture.texture.readDataAsync({
        mipLevel: 1,
        width: 2,
        height: 2
    });
    const bytes = new Uint8Array(arrayBuffer);
    t.deepEqual(Array.from(bytes.slice(0, 4)), [0, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 1'));
    t.deepEqual(Array.from(bytes.slice(4, 8)), [4, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 2'));
    t.deepEqual(Array.from(bytes.slice(bytesPerRowLevel1, bytesPerRowLevel1 + 4)), [8, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 3'));
    t.deepEqual(Array.from(bytes.slice(bytesPerRowLevel1 + 4, bytesPerRowLevel1 + 8)), [12, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 1: quadrant 4'));
    const arrayBuffer2 = await texture.texture.readDataAsync({
        mipLevel: 2,
        width: 1,
        height: 1
    });
    const bytesLevel2 = new Uint8Array(arrayBuffer2);
    t.deepEqual(Array.from(bytesLevel2.slice(0, 4)), [6, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'mip level 2'));
    texture.destroy();
    t.end();
});
test('DynamicTexture WebGPU [render][rgba8unorm] 2d-array mipmaps', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: '2d-array',
        width: 2,
        height: 2,
        depth: 2,
        format: RENDER_MIPMAP_TEST_FORMAT,
        mipmaps: true,
        mipLevels: 'auto',
        data: [makeSolidMipData(2, 2, [255, 0, 0, 255]), makeSolidMipData(2, 2, [0, 255, 0, 255])]
    });
    await texture.ready;
    const bytesPerRow = Math.ceil((1 * 4) / texture.texture.byteAlignment) * texture.texture.byteAlignment;
    const bytesPerLayer = Number(bytesPerRow);
    const arrayBuffer = await texture.texture.readDataAsync({
        mipLevel: 1,
        width: 1,
        height: 1,
        depthOrArrayLayers: 2
    });
    const bytes = new Uint8Array(arrayBuffer);
    t.deepEqual(Array.from(bytes.slice(0, 4)), [255, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d-array', 'layer 0 mip level 1'));
    t.deepEqual(Array.from(bytes.slice(bytesPerLayer, bytesPerLayer + 4)), [0, 255, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d-array', 'layer 1 mip level 1'));
    texture.destroy();
    t.end();
});
test('DynamicTexture WebGPU [render][rgba8unorm] cube mipmaps', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: 'cube',
        width: 2,
        height: 2,
        format: RENDER_MIPMAP_TEST_FORMAT,
        mipmaps: true,
        mipLevels: 'auto',
        data: {
            '+X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
            '-X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
            '+Y': makeSolidMipData(2, 2, [0, 0, 255, 255]),
            '-Y': makeSolidMipData(2, 2, [255, 255, 0, 255]),
            '+Z': makeSolidMipData(2, 2, [255, 0, 255, 255]),
            '-Z': makeSolidMipData(2, 2, [0, 255, 255, 255])
        }
    });
    await texture.ready;
    const bytesPerRow = Math.ceil((1 * 4) / texture.texture.byteAlignment) * texture.texture.byteAlignment;
    const bytesPerLayer = Number(bytesPerRow);
    const arrayBuffer = await texture.texture.readDataAsync({
        mipLevel: 1,
        width: 1,
        height: 1,
        depthOrArrayLayers: 6
    });
    const bytes = new Uint8Array(arrayBuffer);
    const cubeExpected = [
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 255, 255],
        [255, 255, 0, 255],
        [255, 0, 255, 255],
        [0, 255, 255, 255]
    ];
    cubeExpected.forEach((expectedValues, layer) => {
        t.deepEqual(Array.from(bytes.slice(layer * bytesPerLayer, layer * bytesPerLayer + 4)), expectedValues, createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, 'cube', `layer ${layer} mip level 1`));
    });
    texture.destroy();
    t.end();
});
test('DynamicTexture WebGPU [render][rgba8unorm] cube-array mipmaps', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const redCube = {
        '+X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
        '-X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
        '+Y': makeSolidMipData(2, 2, [255, 0, 0, 255]),
        '-Y': makeSolidMipData(2, 2, [255, 0, 0, 255]),
        '+Z': makeSolidMipData(2, 2, [255, 0, 0, 255]),
        '-Z': makeSolidMipData(2, 2, [255, 0, 0, 255])
    };
    const greenCube = {
        '+X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
        '-X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
        '+Y': makeSolidMipData(2, 2, [0, 255, 0, 255]),
        '-Y': makeSolidMipData(2, 2, [0, 255, 0, 255]),
        '+Z': makeSolidMipData(2, 2, [0, 255, 0, 255]),
        '-Z': makeSolidMipData(2, 2, [0, 255, 0, 255])
    };
    const texture = new DynamicTexture(device, {
        dimension: 'cube-array',
        width: 2,
        height: 2,
        depth: 12,
        format: RENDER_MIPMAP_TEST_FORMAT,
        mipmaps: true,
        mipLevels: 'auto',
        data: [redCube, greenCube]
    });
    await texture.ready;
    const bytesPerRow = Math.ceil((1 * 4) / texture.texture.byteAlignment) * texture.texture.byteAlignment;
    const bytesPerLayer = Number(bytesPerRow);
    const arrayBuffer = await texture.texture.readDataAsync({
        mipLevel: 1,
        width: 1,
        height: 1,
        depthOrArrayLayers: 12
    });
    const bytes = new Uint8Array(arrayBuffer);
    for (let layer = 0; layer < 6; ++layer) {
        t.deepEqual(Array.from(bytes.slice(layer * bytesPerLayer, layer * bytesPerLayer + 4)), [255, 0, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, 'cube-array', `cube[0] layer ${layer} mip level 1`));
    }
    for (let layer = 6; layer < 12; ++layer) {
        t.deepEqual(Array.from(bytes.slice(layer * bytesPerLayer, layer * bytesPerLayer + 4)), [0, 255, 0, 255], createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, 'cube-array', `cube[1] layer ${layer} mip level 1`));
    }
    texture.destroy();
    t.end();
});
test('DynamicTexture WebGPU [compute][rgba8unorm] 3d mipmaps', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const width = 4;
    const height = 4;
    const depth = 4;
    const data = new Array(depth).fill(0).map(() => ({
        data: new Uint8Array(width * height * 4),
        width,
        height
    }));
    for (let z = 0; z < depth; ++z) {
        const layer = data[z].data;
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const red = (x & 1) === 1 ? 254 : 0;
                const index = (y * width + x) * 4;
                layer[index] = red;
                layer[index + 1] = 0;
                layer[index + 2] = 0;
                layer[index + 3] = 255;
            }
        }
    }
    const texture = new DynamicTexture(device, {
        dimension: '3d',
        width,
        height,
        depth,
        format: COMPUTE_MIPMAP_TEST_FORMAT,
        mipmaps: true,
        mipLevels: 'auto',
        data
    });
    await texture.ready;
    const bytesPerRow = Math.ceil((2 * 4) / texture.texture.byteAlignment) * texture.texture.byteAlignment;
    const bytesPerLayer = bytesPerRow * 2;
    const arrayBuffer = await texture.texture.readDataAsync({
        mipLevel: 1,
        width: 2,
        height: 2,
        depthOrArrayLayers: 2
    });
    const bytes = new Uint8Array(arrayBuffer);
    t.deepEqual(Array.from(bytes.slice(0, 4)), [127, 0, 0, 255], createTestLabel('compute', COMPUTE_MIPMAP_TEST_FORMAT, '3d', 'mip level 1: first voxel'));
    t.deepEqual(Array.from(bytes.slice(bytesPerLayer, bytesPerLayer + 4)), [127, 0, 0, 255], createTestLabel('compute', COMPUTE_MIPMAP_TEST_FORMAT, '3d', 'mip level 1: cross-layer voxel'));
    const arrayBuffer2 = await texture.texture.readDataAsync({
        mipLevel: 2,
        width: 1,
        height: 1,
        depthOrArrayLayers: 1
    });
    const bytesLevel2 = new Uint8Array(arrayBuffer2);
    t.deepEqual(Array.from(bytesLevel2.slice(0, 4)), [127, 0, 0, 255], createTestLabel('compute', COMPUTE_MIPMAP_TEST_FORMAT, '3d', 'mip level 2'));
    texture.destroy();
    t.end();
});
test('DynamicTexture WebGPU [render][rgba8unorm] throws for unsupported 3d render format on cube', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: 'cube',
        width: 2,
        height: 2,
        format: RENDER_MIPMAP_TEST_FORMAT,
        mipmaps: false,
        usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
        mipLevels: 2,
        data: {
            '+X': makeSolidMipData(2, 2, [255, 0, 0, 255]),
            '-X': makeSolidMipData(2, 2, [0, 255, 0, 255]),
            '+Y': makeSolidMipData(2, 2, [0, 0, 255, 255]),
            '-Y': makeSolidMipData(2, 2, [255, 255, 0, 255]),
            '+Z': makeSolidMipData(2, 2, [255, 0, 255, 255]),
            '-Z': makeSolidMipData(2, 2, [0, 255, 255, 255])
        }
    });
    await texture.ready;
    const originalGetTextureFormatCapabilities = device.getTextureFormatCapabilities.bind(device);
    device.getTextureFormatCapabilities = (format) => {
        const capabilities = originalGetTextureFormatCapabilities(format);
        if (format === RENDER_MIPMAP_TEST_FORMAT) {
            return { ...capabilities, render: false, filter: false };
        }
        return capabilities;
    };
    try {
        const error = captureError(() => texture.generateMipmaps());
        t.ok(error && /Cannot run render mipmap generation/.test(error.message), 'should throw');
        t.equal(String(error?.message || '').includes(`format "${RENDER_MIPMAP_TEST_FORMAT}"`), true, createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, 'cube', 'throws for render path capability mismatch'));
    }
    finally {
        device.getTextureFormatCapabilities = originalGetTextureFormatCapabilities;
        texture.destroy();
    }
    t.end();
});
test('DynamicTexture WebGPU [render][rg16uint] throws for unsupported render format capabilities', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: '2d',
        width: 2,
        height: 2,
        format: NON_COLOR_RENDER_TEST_FORMAT,
        mipmaps: false,
        usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
        mipLevels: 2,
        data: makeSolidMipData(2, 2, [3, 0, 0, 0])
    });
    await texture.ready;
    try {
        const error = captureError(() => texture.generateMipmaps());
        t.ok(error && /Cannot run render mipmap generation/.test(error.message), 'should throw');
        t.equal(String(error?.message || '').includes(`format "${NON_COLOR_RENDER_TEST_FORMAT}"`), true, createTestLabel('render', NON_COLOR_RENDER_TEST_FORMAT, '2d', 'throws for non-color format check'));
        t.equal(String(error?.message || '').includes('Required capabilities'), true, createTestLabel('render', NON_COLOR_RENDER_TEST_FORMAT, '2d', 'throws with required capability list'));
    }
    finally {
        texture.destroy();
    }
    t.end();
});
test('DynamicTexture WebGPU [compute][rgba8unorm] throws for unsupported compute format capabilities', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: '3d',
        width: 2,
        height: 2,
        depth: 2,
        format: COMPUTE_MIPMAP_TEST_FORMAT,
        mipmaps: false,
        usage: Texture.SAMPLE | Texture.STORAGE | Texture.COPY_DST | Texture.COPY_SRC,
        mipLevels: 2,
        data: [makeSolidMipData(2, 2, [255, 0, 0, 255]), makeSolidMipData(2, 2, [255, 0, 0, 255])]
    });
    await texture.ready;
    const originalGetTextureFormatCapabilities = device.getTextureFormatCapabilities.bind(device);
    device.getTextureFormatCapabilities = (format) => {
        const capabilities = originalGetTextureFormatCapabilities(format);
        if (format === COMPUTE_MIPMAP_TEST_FORMAT) {
            return { ...capabilities, filter: false, store: false };
        }
        return capabilities;
    };
    try {
        const error = captureError(() => texture.generateMipmaps());
        t.ok(error && /Cannot run compute mipmap generation/.test(error.message), 'should throw');
        t.equal(String(error?.message || '').includes(`format "${COMPUTE_MIPMAP_TEST_FORMAT}"`), true, createTestLabel('compute', COMPUTE_MIPMAP_TEST_FORMAT, '3d', 'throws for compute capability mismatch'));
    }
    finally {
        device.getTextureFormatCapabilities = originalGetTextureFormatCapabilities;
        texture.destroy();
    }
    t.end();
});
test('DynamicTexture WebGPU [compute][rg16uint] throws for unsupported compute format capabilities', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: '3d',
        width: 2,
        height: 2,
        depth: 2,
        format: NON_COLOR_RENDER_TEST_FORMAT,
        mipmaps: false,
        usage: Texture.SAMPLE | Texture.COPY_DST | Texture.COPY_SRC,
        mipLevels: 2,
        data: [makeSolidMipData(2, 2, [3, 0, 0, 0]), makeSolidMipData(2, 2, [3, 0, 0, 0])]
    });
    await texture.ready;
    try {
        const error = captureError(() => texture.generateMipmaps());
        t.ok(error && /Cannot run compute mipmap generation/.test(error.message), 'should throw');
        t.equal(String(error?.message || '').includes(`format "${NON_COLOR_RENDER_TEST_FORMAT}"`), true, createTestLabel('compute', NON_COLOR_RENDER_TEST_FORMAT, '3d', 'throws for non-color format check'));
        t.equal(String(error?.message || '').includes('Required capabilities'), true, createTestLabel('compute', NON_COLOR_RENDER_TEST_FORMAT, '3d', 'throws with required capability list'));
    }
    finally {
        texture.destroy();
    }
    t.end();
});
test('DynamicTexture WebGPU [render][rgba8unorm] throws when render capabilities unsupported', async (t) => {
    const device = await getWebGPUTestDevice();
    if (!device) {
        t.comment('WebGPU device not available');
        t.end();
        return;
    }
    const texture = new DynamicTexture(device, {
        dimension: '2d',
        width: 2,
        height: 2,
        format: RENDER_MIPMAP_TEST_FORMAT,
        mipmaps: false,
        usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC,
        mipLevels: 2,
        data: {
            data: new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]),
            width: 2,
            height: 2
        }
    });
    await texture.ready;
    const originalGetTextureFormatCapabilities = device.getTextureFormatCapabilities.bind(device);
    device.getTextureFormatCapabilities = (format) => {
        const capabilities = originalGetTextureFormatCapabilities(format);
        if (format === RENDER_MIPMAP_TEST_FORMAT) {
            return { ...capabilities, render: false, filter: false };
        }
        return capabilities;
    };
    try {
        const error = captureError(() => texture.generateMipmaps());
        t.ok(error && /Cannot run render mipmap generation/.test(error.message), 'should throw');
        t.equal(String(error?.message || '').includes(`format "${RENDER_MIPMAP_TEST_FORMAT}"`), true, createTestLabel('render', RENDER_MIPMAP_TEST_FORMAT, '2d', 'throws for unsupported render capabilities'));
    }
    finally {
        device.getTextureFormatCapabilities = originalGetTextureFormatCapabilities;
        texture.destroy();
    }
    t.end();
});
function makeSolidMipData(width, height, color) {
    const data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const pixelIndex = (y * width + x) * 4;
            data[pixelIndex] = color[0];
            data[pixelIndex + 1] = color[1];
            data[pixelIndex + 2] = color[2];
            data[pixelIndex + 3] = color[3];
        }
    }
    return { data, width, height };
}
function makeQuadrantMipData(width, height, quadrants) {
    const data = new Uint8Array(width * height * 4);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const index = (y * width + x) * 4;
            const quadrant = (y < halfHeight ? 0 : 2) + (x < halfWidth ? 0 : 1);
            const color = quadrants[quadrant];
            data[index] = color[0];
            data[index + 1] = color[1];
            data[index + 2] = color[2];
            data[index + 3] = color[3];
        }
    }
    return { data, width, height };
}
function captureError(callback) {
    try {
        callback();
        return null;
    }
    catch (error) {
        return error instanceof Error ? error : new Error(String(error));
    }
}
