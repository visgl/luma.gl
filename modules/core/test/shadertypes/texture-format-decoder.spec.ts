import {expect, test} from 'vitest';
import { textureFormatDecoder, type TextureFormat, type TextureFormatCapabilities } from '@luma.gl/core';

// prettier-ignore
const TEST_CASES: {
  format: TextureFormat;
  result: any;
}[] = [
// 8-bit formats
{
  format: 'r8unorm',
  result: {
    attachment: 'color',
    dataType: 'uint8',
    components: 1,
    channels: 'r',
    integer: false,
    signed: false,
    normalized: true,
    bitsPerChannel: [8, 0, 0, 0],
    bytesPerPixel: 1,
    packed: false,
    srgb: false
  }
}, {
  format: 'r8snorm',
  result: {
    attachment: 'color',
    dataType: 'sint8',
    components: 1,
    channels: 'r',
    integer: false,
    signed: true,
    normalized: true,
    bitsPerChannel: [8, 0, 0, 0],
    bytesPerPixel: 1,
    packed: false,
    srgb: false
  }
}, {
  format: 'r8uint',
  result: {
    attachment: 'color',
    dataType: 'uint8',
    components: 1,
    channels: 'r',
    integer: true,
    signed: false,
    normalized: false,
    bitsPerChannel: [8, 0, 0, 0],
    bytesPerPixel: 1,
    packed: false,
    srgb: false
  }
}, {
  format: 'r8sint',
  result: {
    attachment: 'color',
    dataType: 'sint8',
    components: 1,
    channels: 'r',
    integer: true,
    signed: true,
    normalized: false,
    bitsPerChannel: [8, 0, 0, 0],
    bytesPerPixel: 1,
    packed: false,
    srgb: false
  }
},
// 16-bit formats
{
  format: 'r16uint',
  result: {
    attachment: 'color',
    dataType: 'uint16',
    components: 1,
    channels: 'r',
    integer: true,
    signed: false,
    normalized: false,
    bitsPerChannel: [16, 0, 0, 0],
    bytesPerPixel: 2,
    packed: false,
    srgb: false
  }
}, {
  format: 'r16sint',
  result: {
    attachment: 'color',
    dataType: 'sint16',
    components: 1,
    channels: 'r',
    integer: true,
    signed: true,
    normalized: false,
    bitsPerChannel: [16, 0, 0, 0],
    bytesPerPixel: 2,
    packed: false,
    srgb: false
  }
}, {
  format: 'r16float',
  result: {
    attachment: 'color',
    dataType: 'float16',
    components: 1,
    channels: 'r',
    integer: false,
    signed: false,
    normalized: false,
    bitsPerChannel: [16, 0, 0, 0],
    bytesPerPixel: 2,
    packed: false,
    srgb: false
  }
}];
test('shadertype#textureFormatDecoder.getInfo', () => {
  for (const tc of TEST_CASES) {
    const decoded = textureFormatDecoder.getInfo(tc.format);
    expect(decoded, `textureFormatDecoder.getInfo('${tc.format}') => ${JSON.stringify(decoded.dataType)}`).toEqual({
      format: tc.format,
      ...tc.result
    });
  }
});
test('shadertype#textureFormatDecoder.getInfo packed WebGL formats', () => {
  const testCases = [{
    format: 'rgba4unorm-webgl' as const,
    channels: 'rgba',
    bitsPerChannel: [4, 4, 4, 4] as const
  }, {
    format: 'rgb565unorm-webgl' as const,
    channels: 'rgb',
    bitsPerChannel: [5, 6, 5, 0] as const
  }, {
    format: 'rgb5a1unorm-webgl' as const,
    channels: 'rgba',
    bitsPerChannel: [5, 5, 5, 1] as const
  }];
  for (const tc of testCases) {
    const decoded = textureFormatDecoder.getInfo(tc.format);
    expect(decoded.packed, `${tc.format} remains packed`).toBe(true);
    expect(decoded.webgl, `${tc.format} remains webgl-specific`).toBe(true);
    expect(decoded.channels, `${tc.format} keeps channels`).toBe(tc.channels);
    expect(decoded.bitsPerChannel, `${tc.format} keeps packed channel bit sizes`).toEqual(tc.bitsPerChannel);
  }
});

// prettier-ignore
const TEST_CASES_CAPABILITIES: {
  format: TextureFormat;
  result: Omit<TextureFormatCapabilities, 'format'>;
}[] = [
// 8-bit formats
{
  format: 'r8unorm',
  result: {
    create: true,
    render: true,
    filter: true,
    blend: true,
    store: true
  }
},
// 16-bit formats
{
  format: 'r16uint',
  result: {
    create: true,
    render: true,
    filter: false,
    blend: true,
    store: true
  }
}];
test('shadertype#textureFormatDecoder.getCapabilities', () => {
  for (const tc of TEST_CASES_CAPABILITIES) {
    const decoded = textureFormatDecoder.getCapabilities(tc.format);
    expect(decoded, `getVertexFormatInfo('${tc.format}') => ${JSON.stringify(decoded)}`).toEqual({
      format: tc.format,
      ...tc.result
    });
  }
});

/**
 * Compute bytesPerPixel from format metadata.
 * If you prefer not to pass `bytesPerPixel` into `textureFormatDecoder.computeMemoryLayout`,
 * you can derive it from `TextureFormat` via this helper.
 */
const bytesPerPixelFromFormat = (format: TextureFormat) => textureFormatDecoder.getInfo(format).bytesPerPixel;
test('bytesPerPixelFromFormat', () => {
  expect(bytesPerPixelFromFormat('r8unorm'), 'r8unorm = 1 B/px').toBe(1);
  expect(bytesPerPixelFromFormat('rgba8unorm'), 'rgba8unorm = 4 B/px').toBe(4);
  expect(bytesPerPixelFromFormat('bgra8unorm'), 'bgra8unorm = 4 B/px').toBe(4);
  expect(bytesPerPixelFromFormat('r16uint'), 'r16uint = 2 B/px').toBe(2);
  expect(bytesPerPixelFromFormat('rgba16uint'), 'rgba16uint = 8 B/px').toBe(8);
  expect(bytesPerPixelFromFormat('rgba16float'), 'rgba16float = 8 B/px').toBe(8);
  expect(bytesPerPixelFromFormat('r32uint'), 'r32uint = 4 B/px').toBe(4);
  expect(bytesPerPixelFromFormat('rgba32uint'), 'rgba32uint = 16 B/px').toBe(16);
  expect(bytesPerPixelFromFormat('r32float'), 'r32float = 4 B/px').toBe(4);
  expect(bytesPerPixelFromFormat('rgba32float'), 'rgba32float = 16 B/px').toBe(16);
});
