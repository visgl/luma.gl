// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {Buffer, Device, TextureFormat} from '@luma.gl/core';
import {getWebGLTestDevices} from '@luma.gl/test-utils';

const EPSILON = 1e-6;
const {abs} = Math;

test('CommandBuffer#copyBufferToBuffer', async t => {
  for (const device of getWebGLTestDevices()) {
    if (!device.isWebGL2) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    const sourceData = new Float32Array([1, 2, 3]);
    const source = device.createBuffer({data: sourceData});
    const destinationData = new Float32Array([4, 5, 6]);
    const destination = device.createBuffer({data: destinationData});

    let receivedData = await readAsyncF32(destination);
    let expectedData = new Float32Array([4, 5, 6]);
    t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: default parameters successful');

    let commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer({
      source,
      destination,
      size: 2 * Float32Array.BYTES_PER_ELEMENT
    });
    commandEncoder.finish();
    commandEncoder.destroy();

    receivedData = await readAsyncF32(destination);
    expectedData = new Float32Array([1, 2, 6]);
    t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size successful');

    commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer({
      source,
      sourceOffset: Float32Array.BYTES_PER_ELEMENT,
      destination,
      destinationOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
      size: Float32Array.BYTES_PER_ELEMENT
    });
    commandEncoder.finish();
    commandEncoder.destroy();

    receivedData = await readAsyncF32(destination);
    expectedData = new Float32Array([1, 2, 2]);
    t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size and offsets successful');
  }
  t.end();
});

type CopyTextureToBufferFixture = {
  title: string;
  format: TextureFormat;
  srcPixel: Uint8Array | Float32Array;
  dstPixel: Uint8Array | Float32Array;
  dstOffset?: number;
};

const COPY_TEXTURE_TO_BUFFER_FIXTURES: CopyTextureToBufferFixture[] = [
  {
    title: 'rgba8',
    format: 'rgba8unorm',
    srcPixel: new Uint8Array([255, 128, 64, 32]),
    dstPixel: new Uint8Array([255, 128, 64, 32])
  },
  {
    title: 'rgba8 + offset',
    format: 'rgba8unorm',
    srcPixel: new Uint8Array([255, 128, 64, 32]),
    dstPixel: new Uint8Array([255, 128, 64, 32]),
    dstOffset: 4,
  },
  // {
  //   // TODO: Framebuffer creation fails under Node (browser WebGL1 is fine)
  //   format: 'rgb8unorm-webgl',
  //   srcPixel: new Uint8Array([255, 64, 32]),
  //   dstPixel: new Uint8Array([255, 64, 32]),
  // },
  {
    title: 'rgba32',
    format: 'rgba32float',
    srcPixel: new Float32Array([0.214, -32.23, 1242, -123.847]),
    dstPixel: new Float32Array([0.214, -32.23, 1242, -123.847]),
  },
  {
    title: 'rgba32 + offset',
    format: 'rgba32float',
    srcPixel: new Float32Array([0.214, -32.23, 1242, -123.847]),
    dstPixel: new Float32Array([0.214, -32.23, 1242, -123.847]),
    dstOffset: 8
  },
  // {
  //   // RGB32F is not a renderable format even when EXT_color_buffer_float is supported
  //   title: 'rgb32',
  //   format: 'rgb32float-webgl',
  //   srcPixel: new Float32Array([-0.214, 32.23, 1242]),
  //   dstPixel: new Float32Array([-0.214, 32.23, 1242]),
  // },
  {
    title: 'rg32',
    format: 'rg32float',
    srcPixel: new Float32Array([-0.214, 32.23]),
    dstPixel: new Float32Array([-0.214, 32.23, 0, 0]),
  },
  {
    title: 'r32',
    format: 'r32float',
    srcPixel: new Float32Array([0.124]),
    dstPixel: new Float32Array([0.124, 0, 0, 0]),
  },
];

test('CommandBuffer#copyTextureToBuffer', async t => {
  for (const device of getWebGLTestDevices()) {
    for (const fixture of COPY_TEXTURE_TO_BUFFER_FIXTURES) {
      await testCopyTextureToBuffer(t, device, {...fixture});
      // TODO(v9): Fix implementation and tests for framebuffer and buffer creation.
      // await testCopyTextureToBuffer(t, device, {...fixture, useFramebuffer: true});
      // await testCopyTextureToBuffer(t, device, {...fixture, bufferCreation: true});
      // await testCopyTextureToBuffer(t, device, {...fixture, bufferCreation: true, useFramebuffer: true});
    }
  }
  t.end();
});

async function testCopyTextureToBuffer(
  t: Test,
  device: Device,
  options: CopyTextureToBufferFixture & {bufferCreation?: boolean; useFramebuffer?: boolean}
) {
  // TODO - should we have a specific feature string?
  if (device.info.type !== 'webgl2') {
    t.comment('WebGL2 not available, skipping tests');
    return;
  }

  const {title, srcPixel, dstPixel, dstOffset = 0} = options;

  const elementCount = 6;
  const bytesPerElement = srcPixel.BYTES_PER_ELEMENT;
  const dstByteOffset = dstOffset * bytesPerElement;
  const byteLength = elementCount * bytesPerElement + dstByteOffset;

  let source;

  const colorTexture = device.createTexture({
    data: options.useFramebuffer ? null : srcPixel,
    width: 1,
    height: 1,
    format: options.format,
    mipmaps: false
  });

  const destination = device.createBuffer({byteLength});

  if (options.useFramebuffer) {
    const framebuffer = device.createFramebuffer({
      colorAttachments: [colorTexture]
    });
    // framebuffer.checkStatus();
    // framebuffer.clear({color: clearColor});
    source = framebuffer;
  } else {
    source = colorTexture;
  }

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyTextureToBuffer({
    source,
    width: 1,
    height: 1,
    destination,
    byteOffset: dstByteOffset
  });
  commandEncoder.finish();
  commandEncoder.destroy();

  const color = srcPixel instanceof Uint8Array
    ? await readAsyncU8(destination)
    : await readAsyncF32(destination);

  t.ok(abs(dstPixel[0] - color[0 + dstOffset]) < EPSILON, `reads "R" channel (${title})`);
  t.ok(abs(dstPixel[1] - color[1 + dstOffset]) < EPSILON, `reads "G" channel (${title})`);
  t.ok(abs(dstPixel[2] - color[2 + dstOffset]) < EPSILON, `reads "B" channel (${title})`);
  t.ok(abs(dstPixel[3] - color[3 + dstOffset]) < EPSILON, `reads "A" channel (${title})`);
}

async function readAsyncU8(source: Buffer): Promise<Uint8Array> {
  return source.readAsync();
}

async function readAsyncF32(source: Buffer): Promise<Float32Array> {
  const {buffer, byteOffset, byteLength} = await source.readAsync();
  return new Float32Array(buffer, byteOffset, byteLength / Float32Array.BYTES_PER_ELEMENT);
}

/*

import type {TextureFormat} from '@luma.gl/core';
import {Device, CommandEncoder, Framebuffer, Renderbuffer, Texture, Buffer} from '@luma.gl/core';

type WebGLTextureInfo = {
  dataFormat: number;
  types: number[];
  gl2?: boolean;
  gl1?: boolean | string;
  compressed?: boolean;
};

const WEBGL_TEXTURE_FORMATS: Record<TextureFormat, WebGLTextureInfo> = {
  // Unsized texture format - more performance
  'rgb8unorm-unsized': {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5]},
  // TODO: format: GL.RGBA type: GL.FLOAT is supported in WebGL1 when 'OES_texure_float' is suported
  // we need to update this table structure to specify extensions (gl1ext: 'OES_texure_float', gl2ext: false) for each type.
  rgba8unorm: {
    dataFormat: GL.RGBA,
    types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4, GL.UNSIGNED_SHORT_5_5_5_1]
  },
  // [GL.ALPHA]: {dataFormat: GL.ALPHA, types: [GL.UNSIGNED_BYTE]},
  // [GL.LUMINANCE]: {dataFormat: GL.LUMINANCE, types: [GL.UNSIGNED_BYTE]},
  // [GL.LUMINANCE_ALPHA]: {dataFormat: GL.LUMINANCE_ALPHA, types: [GL.UNSIGNED_BYTE]},

  // 32 bit floats
  r32float: {dataFormat: GL.RED, types: [GL.FLOAT], gl2: true},
  rg32float: {dataFormat: GL.RG, types: [GL.FLOAT], gl2: true},
  // 'rgb32float': {dataFormat: GL.RGB, types: [GL.FLOAT], gl2: true},
  rbga32float: {dataFormat: GL.RGBA, types: [GL.FLOAT], gl2: true}
};

// COPY TEXTURE TO TEXTURE

test('CommandEncoder#copyTextureToTexture', t => {
  for (const device of getWebGLTestDevices()) {
    testCopyToTexture(t, device, {isSubCopy: false, sourceIsFramebuffer: false});
    testCopyToTexture(t, device, {isSubCopy: false, sourceIsFramebuffer: true});
    testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: false});
    testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: true});
  }
});

function testCopyToTexture(
  t: Test,
  device: Device,
  options: {isSubCopy: boolean; sourceIsFramebuffer: boolean}
): void {
  // const byteLength = 6 * 4; // 6 floats
  const sourceColor = [255, 128, 64, 32];
  const clearColor = [1, 0.5, 0.25, 0.125];

  const sourceTexture = device.createTexture({
    data: options.sourceIsFramebuffer ? null : new Uint8Array(sourceColor)
  });

  const destinationTexture = device.createTexture({
    // allocate extra size to test x/y offsets when using sub copy
    width: 2,
    height: 2,
    // When perfomring sub copy, texture memory is not allcoated CommandEncoder'copyTextureToTexture', allocate it here
    data: options.isSubCopy ? new Uint8Array(4 * 4) : null
  });

  let source;
  if (options.sourceIsFramebuffer) {
    const framebuffer = device.createFramebuffer({
      colorAttachments: [sourceTexture]
    });
    framebuffer.checkStatus();
    framebuffer.clear({color: clearColor});
    source = framebuffer;
  } else {
    source = sourceTexture;
  }

  const opts = {
    width: 1,
    height: 1
  };
  if (options.isSubCopy) {
    // @ts-expect-error
    opts.targetX = 1;
    // @ts-expect-error
    opts.targetY = 1;
  }
  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyTextureToTexture(source, destinationTexture, opts);

  // Read data form destination texture
  const color = device.readTexture(destinationTexture);
  const colorOffset = options.isSubCopy ? 4 * 3 /* skip first 3 pixels * : 0;

  t.ok(
    abs(sourceColor[0] - color[0 + colorOffset]) < EPSILON,
    `Red channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source, isSubCopy=${options.isSubCopy}`
  );
  t.ok(
    abs(sourceColor[1] - color[1 + colorOffset]) < EPSILON,
    `Green channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source, isSubCopy=${options.isSubCopy}`
  );
  t.ok(
    abs(sourceColor[2] - color[2 + colorOffset]) < EPSILON,
    `Blue channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source, isSubCopy=${options.isSubCopy}`
  );
  t.ok(
    abs(sourceColor[3] - color[3 + colorOffset]) < EPSILON,
    `Alpha channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source, isSubCopy=${options.isSubCopy}`
  );

  t.end();
}

function testCopyToArray(t: Test, device: Device) {
  [true, false].forEach(sourceIsFramebuffer => {
    for (const testCase of FB_READPIXELS_TEST_CASES) {
      const format = testCase.format;
      if (Texture2D.isSupported(gl, {format})) {
        const formatInfo = WEBGL_TEXTURE_FORMATS[format];
        const type = formatInfo.types[0]; // TODO : test all other types
        const dataFormat = formatInfo.dataFormat;
        const texOptions = Object.assign({}, formatInfo, {
          format,
          type,
          mipmaps: format !== GL.RGB32F
        });

        const frameBufferOptions = {
          attachments: {
            [GL.COLOR_ATTACHMENT0]: new Texture2D(gl, texOptions),
            [GL.DEPTH_STENCIL_ATTACHMENT]: new Renderbuffer(gl, {format: GL.DEPTH_STENCIL})
          }
        };
        let source;
        const width = 1;
        const height = 1;
        if (sourceIsFramebuffer) {
          const framebuffer = new Framebuffer(gl, frameBufferOptions);

          framebuffer.resize({width: 1000, height: 1000});
          framebuffer.checkStatus();

          framebuffer.clear({color: testCase.clearColor});
          source = framebuffer;
        } else {
          const texture = new Texture2D(gl, {
            format,
            dataFormat,
            type,
            mipmaps: false,
            width,
            height,
            data: testCase.textureColor
          });
          source = texture;
        }

        const color = readPixelsToArray(source, {
          sourceX: 0,
          sourceY: 0,
          sourceWidth: width,
          sourceHeight: height,
          sourceFormat: type === GL.FLOAT ? GL.RGBA : dataFormat, // For float textures only RGBA is supported.
          sourceType: type
        });

        const expectedColor = testCase.expectedColor || testCase.clearColor;
        for (const index in color) {
          t.ok(
            Math.abs(color[index] - expectedColor[index]) < EPSILON,
            `Readpixels({format: ${getKey(gl, format)}, type: ${getKey(
              gl,
              type
            )}) returned expected value for channel:${index}`
          );
        }
      }
    }
  });
}

test('WebGL1#CopyAndBlit readPixelsToArray', t => {
  for (const device of getWebGLTestDevices()) {
    testCopyToArray(t, device);
  }
  t.end();
});

test('WebGL2#CopyAndBlit readPixels', t => {
  for (const device of getWebGLTestDevices()) {
    if (device.info.type === 'webgl2') {
      testCopyToArray(t, device);
    } else {
      t.comment('WebGL2 not available, skipping tests');
    }
  }
  t.end();
});

/*
const DEFAULT_TEXTURE_OPTIONS = {
  format: GL.RGBA,
  mipmaps: false,
  width: 1,
  height: 1,
  data: null
};

function createTexture(device, opts) {
  return new Texture2D(device, Object.assign({}, DEFAULT_TEXTURE_OPTIONS, opts));
}

/* eslint-disable max-statements *
function testBlit(t: Test, device: Device) {
  [true, false].forEach(destinationIsFramebuffer => {
    [true, false].forEach(sourceIsFramebuffer => {
      // const byteLength = 6 * 4; // 6 floats
      const sourceColor = [255, 128, 64, 32];
      const clearColor = [1, 0.5, 0.25, 0.125];

      const sourceTexture = createTexture(device, {
        data: sourceIsFramebuffer ? null : new Uint8Array(sourceColor)
      });

      const destinationTexture = createTexture(device, {
        // allocate extra size to test x/y offsets when using sub copy
        width: 2,
        height: 2,
        // allocate memory with 0's
        data: new Uint8Array(4 * 4)
      });

      let source;
      if (sourceIsFramebuffer) {
        const framebuffer = new Framebuffer(device, {
          attachments: {
            [GL.COLOR_ATTACHMENT0]: sourceTexture
          }
        });
        framebuffer.checkStatus();
        framebuffer.clear({color: clearColor});
        source = framebuffer;
      } else {
        source = sourceTexture;
      }
      let destination;
      if (destinationIsFramebuffer) {
        const framebuffer = new Framebuffer(device, {
          width: 2,
          height: 2,
          attachments: {
            [GL.COLOR_ATTACHMENT0]: destinationTexture
          }
        });
        framebuffer.checkStatus();
        framebuffer.clear({color: [0, 0, 0, 0]});
        destination = framebuffer;
      } else {
        destination = destinationTexture;
      }

      // const color = new Float32Array(6);
      blit(source, destination, {
        targetX0: 1,
        targetY0: 1
      });

      // Read data form destination texture
      const color = readPixelsToArray(destination);
      const colorOffset = 4 * 3; /* skip first 3 pixels *

      const src = `${sourceIsFramebuffer ? 'Framebuffer' : 'Texture'}`;
      const dst = `${destinationIsFramebuffer ? 'Framebuffer' : 'Texture'}`;
      t.ok(
        abs(sourceColor[0] - color[0 + colorOffset]) < EPSILON,
        `Red channel should have correct value when blintting from ${src} to ${dst}`
      );
      t.ok(
        abs(sourceColor[1] - color[1 + colorOffset]) < EPSILON,
        `Green channel should have correct value when blintting from ${src} to ${dst}`
      );
      t.ok(
        abs(sourceColor[2] - color[2 + colorOffset]) < EPSILON,
        `Blue channel should have correct value when blintting from ${src} to ${dst}`
      );
      t.ok(
        abs(sourceColor[3] - color[3 + colorOffset]) < EPSILON,
        `Alpha channel should have correct value when blintting from ${src} to ${dst}`
      );
    });
  });
  t.end();
}
/* eslint-disable max-statements */
