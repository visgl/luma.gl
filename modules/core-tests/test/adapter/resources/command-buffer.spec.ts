// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';

test('CommandBuffer#copyBufferToBuffer', t => {
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

    let receivedData = destination.getData();
    let expectedData = new Float32Array([4, 5, 6]);
    t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: default parameters successful');

    let commandEncoder = device.createCommandEncoder({});
    commandEncoder.copyBufferToBuffer({source, destination, size: 2 * Float32Array.BYTES_PER_ELEMENT});
    commandEncoder.finish();
    commandEncoder.destroy();

    receivedData = destination.getData();
    expectedData = new Float32Array([1, 2, 6]);
    t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size successful');

    commandEncoder = device.createCommandEncoder({});
    commandEncoder.copyBufferToBuffer({
      source,
      sourceOffset: Float32Array.BYTES_PER_ELEMENT,
      destination,
      destinationOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
      size: Float32Array.BYTES_PER_ELEMENT
    });
    commandEncoder.finish();
    commandEncoder.destroy();

    receivedData = destination.getData();
    expectedData = new Float32Array([1, 2, 2]);
    t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size and offsets successful');
  }
  t.end();
});


/*

import type {TextureFormat} from '@luma.gl/core';
import {Device, CommandEncoder, Framebuffer, Renderbuffer, Texture, Buffer} from '@luma.gl/core';

const EPSILON = 1e-6;
const {abs} = Math;

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

const FB_READPIXELS_TEST_CASES: {
  format: TextureFormat;
  clearColor: any;
  textureColor: any;
  expectedColor?: any;
}[] = [
  {
    format: 'rgba8unorm',
    clearColor: [1, 0.5, 0.25, 0.125],
    textureColor: new Uint8Array([255, 128, 64, 32]),
    expectedColor: [255, 128, 64, 32]
  },

  // TODO: Framebuffer creation fails under Node (browser WebGL1 is fine)
  // {
  //   format: GL.RGB, clearColor: [1, 0.25, 0.125, 0], expectedColor: [255, 64, 32]
  // },

  {
    format: 'rgba32float',
    clearColor: [0.214, -32.23, 1242, -123.847],
    textureColor: new Float32Array([0.214, -32.23, 1242, -123.847])
  },
  {
    format: 'rg32float',
    clearColor: [-0.214, 32.23, 0, 0],
    textureColor: new Float32Array([-0.214, 32.23]),
    expectedColor: [-0.214, 32.23, 0, 1] // ReadPixels returns default values for un-used channels (B and A)
  },
  {
    format: 'r32float',
    clearColor: [0.124, 0, 0, 0],
    textureColor: new Float32Array([0.124]),
    expectedColor: [0.124, 0, 0, 1] //  // ReadPixels returns default values for un-used channels (G,B and A)
  }

  // RGB32F is not a renderable format even when EXT_color_buffer_float is supported
  // {
  //   format: GL.RGB32F, clearColor: [-0.214, 32.23, 1242, 0], expectedColor: [-0.214, 32.23, 1242]
  // }
];

test('CommandBuffer#copyTextureToTexture', t => {
  for (const device of getWebGLTestDevices()) {
    testCopyTextureToBuffer(t, device, {bufferCreation: false, sourceIsFramebuffer: false});
    testCopyTextureToBuffer(t, device, {bufferCreation: false, sourceIsFramebuffer: true});
  }
});

test('CommandBuffer#copyTextureToTexture (buffer creation)', t => {
  for (const device of getWebGLTestDevices()) {
    testCopyTextureToBuffer(t, device, {bufferCreation: true, sourceIsFramebuffer: false});
    testCopyTextureToBuffer(t, device, {bufferCreation: true, sourceIsFramebuffer: true});
  }
});

function testCopyTextureToBuffer(
  t: Test,
  device: Device,
  options: {bufferCreation: boolean; sourceIsFramebuffer: boolean}
) {
  // TODO - should we have a specific feature string?
  if (device.info.type !== 'webgl2') {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const byteLength = 6 * 4; // 6 floats
  const clearColor = [0.25, -0.35, 12340.25, 0.005];
  let source;

  const colorTexture = device.createTexture({
    data: options.sourceIsFramebuffer ? null : new Float32Array(clearColor),
    width: 1,
    height: 1,
    format: 'rgba32float',
    // type: GL.FLOAT,
    // dataFormat: GL.RGBA,
    mipmaps: false
  });
  const buffer = device.createBuffer({byteLength});
  if (options.sourceIsFramebuffer) {
    const framebuffer = device.createFramebuffer({
      colorAttachments: [colorTexture]
    });
    // framebuffer.checkStatus();
    // framebuffer.clear({color: clearColor});
    source = framebuffer;
  } else {
    source = colorTexture;
  }

  const commandEncoder = device.createCommandEncoder({});

  commandEncoder.copyTextureToBuffer({
    source,
    width: 1,
    height: 1,
    // sourceType: GL.FLOAT,
    destination: buffer,
    byteOffset: 2 * 4 // start from 3rd element
  });

  // const color = new Float32Array(6);
  // buffer.getData({dstData: color});
  const color = buffer.getData();

  t.ok(
    abs(clearColor[0] - color[2]) < EPSILON,
    `Red channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source`
  );
  t.ok(
    abs(clearColor[1] - color[3]) < EPSILON,
    `Green channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source`
  );
  t.ok(
    abs(clearColor[2] - color[4]) < EPSILON,
    `Blue channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source`
  );
  t.ok(
    abs(clearColor[3] - color[5]) < EPSILON,
    `Alpha channel should have correct value when using ${
      options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
    } as source`
  );

  t.end();
}

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
