// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {Buffer, Device, TextureFormat} from '@luma.gl/core';
import {getTestDevices, getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

const EPSILON = 1e-6;
const {abs} = Math;

function getResourceStats(device: Device): Record<string, number> {
  const stats = device.statsManager.getStats('Resource Counts');
  return {
    resourcesActive: stats.get('Resources Active').count,
    commandEncodersActive: stats.get('CommandEncoders Active').count,
    commandBuffersActive: stats.get('CommandBuffers Active').count,
    renderPasssActive: stats.get('RenderPasss Active').count,
    computePasssActive: stats.get('ComputePasss Active').count,
    framebuffersActive: stats.get('Framebuffers Active').count,
    texturesActive: stats.get('Textures Active').count,
    samplersActive: stats.get('Samplers Active').count,
    textureViewsActive: stats.get('TextureViews Active').count
  };
}

test('Transient command resources release core stats', async t => {
  for (const device of await getTestDevices(['webgl', 'webgpu', 'null'])) {
    const beforeStats = getResourceStats(device);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 0]});
    const duringRenderPassStats = getResourceStats(device);
    t.equal(
      duringRenderPassStats.renderPasssActive - beforeStats.renderPasssActive,
      1,
      `${device.type} beginRenderPass increments RenderPasss Active`
    );

    renderPass.end();

    const afterRenderPassStats = getResourceStats(device);
    t.equal(
      afterRenderPassStats.renderPasssActive,
      beforeStats.renderPasssActive,
      `${device.type} RenderPass.end restores RenderPasss Active`
    );

    const commandEncoder = device.createCommandEncoder();
    const afterCommandEncoderStats = getResourceStats(device);
    t.equal(
      afterCommandEncoderStats.commandEncodersActive - afterRenderPassStats.commandEncodersActive,
      1,
      `${device.type} createCommandEncoder increments CommandEncoders Active`
    );

    const commandBuffer = commandEncoder.finish();
    const afterFinishStats = getResourceStats(device);
    t.equal(
      afterFinishStats.commandEncodersActive,
      afterRenderPassStats.commandEncodersActive,
      `${device.type} CommandEncoder.finish restores CommandEncoders Active`
    );
    t.equal(
      afterFinishStats.commandBuffersActive - afterRenderPassStats.commandBuffersActive,
      1,
      `${device.type} CommandEncoder.finish increments CommandBuffers Active`
    );

    device.submit(commandBuffer);

    const afterSubmitStats = getResourceStats(device);
    t.equal(
      afterSubmitStats.commandBuffersActive,
      afterRenderPassStats.commandBuffersActive,
      `${device.type} Device.submit restores CommandBuffers Active`
    );
    t.equal(
      afterSubmitStats.resourcesActive,
      beforeStats.resourcesActive,
      `${device.type} transient command resources restore total Resources Active`
    );
  }

  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const beforeStats = getResourceStats(webgpuDevice);
  const computePass = webgpuDevice.beginComputePass({});
  const duringComputePassStats = getResourceStats(webgpuDevice);
  t.equal(
    duringComputePassStats.computePasssActive - beforeStats.computePasssActive,
    1,
    'webgpu beginComputePass increments ComputePasss Active'
  );

  computePass.end();

  const afterComputePassStats = getResourceStats(webgpuDevice);
  t.equal(
    afterComputePassStats.computePasssActive,
    beforeStats.computePasssActive,
    'webgpu ComputePass.end restores ComputePasss Active'
  );

  const beforeCanvasStats = getResourceStats(webgpuDevice);
  const defaultFramebufferRenderPass = webgpuDevice.beginRenderPass({clearColor: [0, 0, 0, 1]});
  const duringCanvasStats = getResourceStats(webgpuDevice);
  t.equal(
    duringCanvasStats.framebuffersActive - beforeCanvasStats.framebuffersActive,
    1,
    'webgpu default render pass allocates one transient framebuffer wrapper'
  );
  t.equal(
    duringCanvasStats.texturesActive - beforeCanvasStats.texturesActive,
    1,
    'webgpu default render pass allocates one transient swapchain texture wrapper'
  );
  t.equal(
    duringCanvasStats.samplersActive - beforeCanvasStats.samplersActive,
    1,
    'webgpu default render pass allocates one transient sampler wrapper'
  );
  t.equal(
    duringCanvasStats.textureViewsActive - beforeCanvasStats.textureViewsActive,
    1,
    'webgpu default render pass allocates one transient texture view wrapper'
  );

  defaultFramebufferRenderPass.end();
  webgpuDevice.submit();

  const afterCanvasStats = getResourceStats(webgpuDevice);
  t.equal(
    afterCanvasStats.framebuffersActive,
    beforeCanvasStats.framebuffersActive,
    'webgpu default render pass releases framebuffer wrapper stats'
  );
  t.equal(
    afterCanvasStats.texturesActive,
    beforeCanvasStats.texturesActive,
    'webgpu default render pass releases texture wrapper stats'
  );
  t.equal(
    afterCanvasStats.samplersActive,
    beforeCanvasStats.samplersActive,
    'webgpu default render pass releases sampler wrapper stats'
  );
  t.equal(
    afterCanvasStats.textureViewsActive,
    beforeCanvasStats.textureViewsActive,
    'webgpu default render pass releases texture view wrapper stats'
  );

  t.end();
});

test('CommandBuffer#copyBufferToBuffer', async t => {
  const device = await getWebGLTestDevice();

  const sourceData = new Float32Array([1, 2, 3]);
  const sourceBuffer = device.createBuffer({data: sourceData});
  const destinationData = new Float32Array([4, 5, 6]);
  const destinationBuffer = device.createBuffer({data: destinationData});

  let receivedData = await readAsyncF32(destinationBuffer);
  let expectedData = new Float32Array([4, 5, 6]);
  t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: default parameters successful');

  let commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer({
    sourceBuffer,
    destinationBuffer,
    size: 2 * Float32Array.BYTES_PER_ELEMENT
  });
  let commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  receivedData = await readAsyncF32(destinationBuffer);
  expectedData = new Float32Array([1, 2, 6]);
  t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size successful');

  commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer({
    sourceBuffer,
    sourceOffset: Float32Array.BYTES_PER_ELEMENT,
    destinationBuffer,
    destinationOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
    size: Float32Array.BYTES_PER_ELEMENT
  });
  commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  receivedData = await readAsyncF32(destinationBuffer);
  expectedData = new Float32Array([1, 2, 2]);
  t.deepEqual(receivedData, expectedData, 'copyBufferToBuffer: with size and offsets successful');

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
    dstOffset: 4
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
    dstPixel: new Float32Array([0.214, -32.23, 1242, -123.847])
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
    dstPixel: new Float32Array([-0.214, 32.23, 0, 0])
  },
  {
    title: 'r32',
    format: 'r32float',
    srcPixel: new Float32Array([0.124]),
    dstPixel: new Float32Array([0.124, 0, 0, 0])
  }
];

test('CommandBuffer#copyTextureToBuffer', async t => {
  const device = await getWebGLTestDevice();

  for (const fixture of COPY_TEXTURE_TO_BUFFER_FIXTURES) {
    await testCopyTextureToBuffer(t, device, {...fixture});
    await testCopyTextureToBuffer(t, device, {
      ...fixture,
      useFramebuffer: true,
      title: `${fixture.title} + framebuffer`
    });
  }

  t.end();
});

async function testCopyTextureToBuffer(
  t: Test,
  device_: Device,
  options: CopyTextureToBufferFixture & {useFramebuffer?: boolean}
) {
  const {title, srcPixel, dstPixel, dstOffset = 0} = options;

  const elementCount = 6;
  const bytesPerElement = srcPixel.BYTES_PER_ELEMENT;
  const dstByteOffset = dstOffset * bytesPerElement;
  const byteLength = elementCount * bytesPerElement + dstByteOffset;

  let sourceTexture;

  const colorTexture = device_.createTexture({
    data: srcPixel,
    width: 1,
    height: 1,
    format: options.format,
    mipmaps: false
  });

  const destinationBuffer = device_.createBuffer({byteLength});

  if (options.useFramebuffer) {
    sourceTexture = device_.createFramebuffer({colorAttachments: [colorTexture]});
  } else {
    sourceTexture = colorTexture;
  }

  const commandEncoder = device_.createCommandEncoder();
  commandEncoder.copyTextureToBuffer({
    sourceTexture,
    width: 1,
    height: 1,
    destinationBuffer,
    byteOffset: dstByteOffset
  });
  const commandBuffer = commandEncoder.finish();
  device_.submit(commandBuffer);

  const color =
    srcPixel instanceof Uint8Array
      ? await readAsyncU8(destinationBuffer)
      : await readAsyncF32(destinationBuffer);

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

test('CommandEncoder#copyTextureToTexture', async t => {
  const device = await getWebGLTestDevice();

  // for (const device of await getTestDevices()) {
  testCopyToTexture(t, device, {isSubCopy: false, sourceIsFramebuffer: false});
  // testCopyToTexture(t, device, {isSubCopy: false, sourceIsFramebuffer: true});
  // testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: false});
  // testCopyToTexture(t, device, {isSubCopy: true, sourceIsFramebuffer: true});
  // }
});

function testCopyToTexture(
  t: Test,
  device_: Device,
  options: {isSubCopy: boolean; sourceIsFramebuffer: boolean}
): void {
  // const byteLength = 6 * 4; // 6 floats
  const sourceColor = [255, 128, 64, 32];

  const sourceTexture = device_.createTexture({
    data: options.sourceIsFramebuffer ? null : new Uint8Array(sourceColor),
    width: 1,
    height: 1
  });

  const destinationTexture = sourceTexture.clone();

  const commandEncoder = device_.createCommandEncoder();
  commandEncoder.copyTextureToTexture({sourceTexture, destinationTexture});
  const commandBuffer = commandEncoder.finish();
  device_.submit(commandBuffer);

  // Read data form destination texture
  const color = device_.readPixelsToArrayWebGL(destinationTexture);

  t.deepEqual(color, sourceColor, 'copyTextureToTexture() successful');

  // const opts = {width: 1, height: 1};
  // if (options.isSubCopy) {
  //   // @ts-expect-error
  //   opts.targetX = 1;
  //   // @ts-expect-error
  //   opts.targetY = 1;
  // }

  // const clearColor = [1, 0.5, 0.25, 0.125];
  // const colorOffset = options.isSubCopy ? 4 * 3 /* skip first 3 pixels * : 0;

  // t.ok(
  //   abs(sourceColor[0] - color[0 + colorOffset]) < EPSILON,
  //   `Red channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );
  // t.ok(
  //   abs(sourceColor[1] - color[1 + colorOffset]) < EPSILON,
  //   `Green channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );
  // t.ok(
  //   abs(sourceColor[2] - color[2 + colorOffset]) < EPSILON,
  //   `Blue channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );
  // t.ok(
  //   abs(sourceColor[3] - color[3 + colorOffset]) < EPSILON,
  //   `Alpha channel should have correct value when using ${
  //     options.sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
  //   } as source, isSubCopy=${options.isSubCopy}`
  // );

  t.end();
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

test('WebGL1#CopyAndBlit readPixelsToArray', async t => {
  for (const device of getWebGLTestDevices()) {
    testCopyToArray(t, device);
  }
  t.end();
});

test('WebGL2#CopyAndBlit readPixels', async t => {
  for (const device of getWebGLTestDevices()) {
      testCopyToArray(t, device);
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
