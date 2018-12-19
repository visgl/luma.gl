import test from 'tape-catch';
import GL from 'luma.gl/constants';
import {Framebuffer, Renderbuffer, Texture2D, Buffer, getKey} from 'luma.gl';
import {fixture} from 'luma.gl/test/setup';
import {TEXTURE_FORMATS} from 'luma.gl/webgl/texture';
import {
  copyFramebufferToArray,
  copyFramebufferToBuffer,
  // copyFramebufferToDataUrl,
  // copyFramebufferToImage,
  // copyFramebufferToTexture,
  blitFramebuffer
} from 'luma.gl/webgl/copy-and-blit.js';

const EPSILON = 1e-6;


const FB_READPIXELS_TEST_CASES = [
  {
    format: GL.RGBA, clearColor: [1, 0.5, 0.25, 0.125], expectedColor: [255, 128, 64, 32]
  },

  // TODO: Framebuffer creation fails under Node (browser WebGL1 is fine)
  // {
  //   format: GL.RGB, clearColor: [1, 0.25, 0.125, 0], expectedColor: [255, 64, 32]
  // },

  {
    format: GL.RGBA32F, clearColor: [0.214, -32.23, 1242, -123.847]
  },
  {
    format: GL.RG32F, clearColor: [-0.214, 32.23, 0, 0], expectedColor: [-0.214, 32.23, 0, 1] // ReadPixels returns default values for un-used channels (B and A)
  },
  {
    format: GL.R32F, clearColor: [0.124, 0, 0, 0], expectedColor: [0.124, 0, 0, 1] //  // ReadPixels returns default values for un-used channels (G,B and A)
  }

  // RGB32F is not a renderable format even when EXT_color_buffer_float is supported
  // {
  //   format: GL.RGB32F, clearColor: [-0.214, 32.23, 1242, 0], expectedColor: [-0.214, 32.23, 1242]
  // }
];

function testCopyFramebufferToArray(t, gl) {

  for (const testCase of FB_READPIXELS_TEST_CASES) {
    const format = testCase.format;
    if (Texture2D.isSupported(gl, {format})) {
      const formatInfo = TEXTURE_FORMATS[format];
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

      const framebuffer = new Framebuffer(gl, frameBufferOptions);

      framebuffer.resize({width: 1000, height: 1000});
      framebuffer.checkStatus();

      framebuffer.clear({color: testCase.clearColor});

      const color = copyFramebufferToArray({
        framebuffer,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        format: type === GL.FLOAT ? GL.RGBA : dataFormat, // For float textures only RGBA is supported.
        type});

      const expectedColor = testCase.expectedColor || testCase.clearColor;
      for (const index in color) {
        t.ok(Math.abs(color[index] - expectedColor[index]) < EPSILON, `Readpixels({format: ${getKey(GL, format)}, type: ${getKey(GL, type)}) returned expected value for channel:${index}`);
      }
    }
  }
}

test('WebGL1#CopyAndBlit copyFramebufferToArray', t => {
  const {gl} = fixture;
  testCopyFramebufferToArray(t, gl);
  t.end();
});

test('WebGL2#CopyAndBlit readPixels', t => {
  const {gl2} = fixture;
  if (gl2) {
    testCopyFramebufferToArray(t, gl2);
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

function testCopyFramebufferToBuffer(t, bufferCreation) {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const gl = gl2;
  const {abs} = Math;
  const dataBytes = 6 * 4; // 6 floats
  const colorTexture = new Texture2D(gl, {
    format: GL.RGBA32F,
    type: GL.FLOAT,
    dataFormat: GL.RGBA,
    mipmap: false
  });
  const pbo = new Buffer(gl, {
    bytes: dataBytes,
    type: GL.FLOAT
  });
  const framebuffer = new Framebuffer(gl, {
    attachments: {
      [GL.COLOR_ATTACHMENT0]: colorTexture
    }
  });

  framebuffer.checkStatus();

  const color = new Float32Array(6);
  const clearColor = [0.25, -0.35, 12340.25, 0.005];

  framebuffer.clear({color: clearColor});

  const buffer = copyFramebufferToBuffer({
    framebuffer,
    width: 1,
    height: 1,
    type: GL.FLOAT,
    buffer: bufferCreation ? null : pbo,
    byteOffset: 2 * 4 // start from 3rd element
  });
  buffer.getData({dstData: color});

  t.ok(abs(clearColor[0] - color[2]) < EPSILON, 'Readpixels returned expected value for Red channel');
  t.ok(abs(clearColor[1] - color[3]) < EPSILON, 'Readpixels returned expected value for Green channel');
  t.ok(abs(clearColor[2] - color[4]) < EPSILON, 'Readpixels returned expected value for Blue channel');
  t.ok(abs(clearColor[3] - color[5]) < EPSILON, 'Readpixels returned expected value for Alpha channel');

  t.end();
}

test('WebGL#CopyAndBlit readPixelsToBuffer', t => {
  testCopyFramebufferToBuffer(t, false);
});

test('WebGL#CopyAndBlit readPixelsToBuffer (buffer creation)', t => {
  testCopyFramebufferToBuffer(t, true);
});

test('WebGL2#CopyAndBlit blit', t => {
  const {gl2} = fixture;
  if (gl2) {

    t.doesNotThrow(
      () => {
        const framebufferSrc = new Framebuffer(gl2);
        const framebufferDst = new Framebuffer(gl2);
        blitFramebuffer({
          srcFramebuffer: framebufferSrc,
          srcX0: 0,
          srcY0: 0,
          srcX1: 1,
          srcY1: 1,
          dstFramebuffer: framebufferDst,
          dstX0: 0,
          dstY0: 0,
          dstX1: 1,
          dstY1: 1,
          color: true,
          depth: true,
          stencil: true});
      },
      'Framebuffer blit successful'
    );
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});
