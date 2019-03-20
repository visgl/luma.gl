import test from 'tape-catch';
import GL from '@luma.gl/constants';
import {Framebuffer, Renderbuffer, Texture2D, Buffer, getKey} from '@luma.gl/webgl';
import {fixture} from 'test/setup';
import {TEXTURE_FORMATS} from '@luma.gl/webgl/classes/texture-formats';
import {readPixelsToArray, readPixelsToBuffer, copyToTexture, blit} from '@luma.gl/webgl';

const EPSILON = 1e-6;
const {abs} = Math;

const FB_READPIXELS_TEST_CASES = [
  {
    format: GL.RGBA,
    clearColor: [1, 0.5, 0.25, 0.125],
    textureColor: new Uint8Array([255, 128, 64, 32]),
    expectedColor: [255, 128, 64, 32]
  },

  // TODO: Framebuffer creation fails under Node (browser WebGL1 is fine)
  // {
  //   format: GL.RGB, clearColor: [1, 0.25, 0.125, 0], expectedColor: [255, 64, 32]
  // },

  {
    format: GL.RGBA32F,
    clearColor: [0.214, -32.23, 1242, -123.847],
    textureColor: new Float32Array([0.214, -32.23, 1242, -123.847])
  },
  {
    format: GL.RG32F,
    clearColor: [-0.214, 32.23, 0, 0],
    textureColor: new Float32Array([-0.214, 32.23]),
    expectedColor: [-0.214, 32.23, 0, 1] // ReadPixels returns default values for un-used channels (B and A)
  },
  {
    format: GL.R32F,
    clearColor: [0.124, 0, 0, 0],
    textureColor: new Float32Array([0.124]),
    expectedColor: [0.124, 0, 0, 1] //  // ReadPixels returns default values for un-used channels (G,B and A)
  }

  // RGB32F is not a renderable format even when EXT_color_buffer_float is supported
  // {
  //   format: GL.RGB32F, clearColor: [-0.214, 32.23, 1242, 0], expectedColor: [-0.214, 32.23, 1242]
  // }
];

function testCopyToArray(t, gl) {
  [true, false].forEach(sourceIsFramebuffer => {
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
            `Readpixels({format: ${getKey(GL, format)}, type: ${getKey(
              GL,
              type
            )}) returned expected value for channel:${index}`
          );
        }
      }
    }
  });
}

test('WebGL1#CopyAndBlit readPixelsToArray', t => {
  const {gl} = fixture;
  testCopyToArray(t, gl);
  t.end();
});

test('WebGL2#CopyAndBlit readPixels', t => {
  const {gl2} = fixture;
  if (gl2) {
    testCopyToArray(t, gl2);
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

function testCopyToBuffer(t, bufferCreation) {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  [true, false].forEach(sourceIsFramebuffer => {
    const gl = gl2;
    const byteLength = 6 * 4; // 6 floats
    const clearColor = [0.25, -0.35, 12340.25, 0.005];
    let source;

    const colorTexture = new Texture2D(gl, {
      format: GL.RGBA32F,
      type: GL.FLOAT,
      dataFormat: GL.RGBA,
      mipmap: false,
      width: 1,
      height: 1,
      data: sourceIsFramebuffer ? null : new Float32Array(clearColor)
    });
    const pbo = new Buffer(gl, {byteLength, accessor: {type: GL.FLOAT}});
    if (sourceIsFramebuffer) {
      const framebuffer = new Framebuffer(gl, {
        attachments: {
          [GL.COLOR_ATTACHMENT0]: colorTexture
        }
      });
      framebuffer.checkStatus();
      framebuffer.clear({color: clearColor});
      source = framebuffer;
    } else {
      source = colorTexture;
    }

    const color = new Float32Array(6);
    const buffer = readPixelsToBuffer(source, {
      sourceWidth: 1,
      sourceHeight: 1,
      sourceType: GL.FLOAT,
      target: bufferCreation ? null : pbo,
      targetByteOffset: 2 * 4 // start from 3rd element
    });
    buffer.getData({dstData: color});

    t.ok(
      abs(clearColor[0] - color[2]) < EPSILON,
      `Red channel should have correct value when using ${
        sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
      } as source`
    );
    t.ok(
      abs(clearColor[1] - color[3]) < EPSILON,
      `Green channel should have correct value when using ${
        sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
      } as source`
    );
    t.ok(
      abs(clearColor[2] - color[4]) < EPSILON,
      `Blue channel should have correct value when using ${
        sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
      } as source`
    );
    t.ok(
      abs(clearColor[3] - color[5]) < EPSILON,
      `Alpha channel should have correct value when using ${
        sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
      } as source`
    );
  });

  t.end();
}

test('WebGL#CopyAndBlit readPixelsToBuffer', t => {
  testCopyToBuffer(t, false);
});

test('WebGL#CopyAndBlit readPixelsToBuffer (buffer creation)', t => {
  testCopyToBuffer(t, true);
});

const DEFAULT_TEXTURE_OPTIONS = {
  format: GL.RGBA,
  mipmap: false,
  width: 1,
  height: 1,
  data: null
};

function createTexture(gl, opts) {
  return new Texture2D(gl, Object.assign({}, DEFAULT_TEXTURE_OPTIONS, opts));
}

function testCopyToTexture(t, gl) {
  [true, false].forEach(isSubCopy => {
    [true, false].forEach(sourceIsFramebuffer => {
      // const byteLength = 6 * 4; // 6 floats
      const sourceColor = [255, 128, 64, 32];
      const clearColor = [1, 0.5, 0.25, 0.125];

      const sourceTexture = createTexture(gl, {
        data: sourceIsFramebuffer ? null : new Uint8Array(sourceColor)
      });

      const destinationTexture = createTexture(gl, {
        // allocate extra size to test x/y offsets when using sub copy
        width: 2,
        height: 2,
        // When perfomring sub copy, texture memory is not allcoated by 'copyToTexture', allocate it here
        data: isSubCopy ? new Uint8Array(4 * 4) : null
      });

      let source;
      if (sourceIsFramebuffer) {
        const framebuffer = new Framebuffer(gl, {
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

      const opts = {
        width: 1,
        height: 1
      };
      if (isSubCopy) {
        opts.targetX = 1;
        opts.targetY = 1;
      }
      copyToTexture(source, destinationTexture, opts);

      // Read data form destination texture
      const color = readPixelsToArray(destinationTexture);
      const colorOffset = isSubCopy ? 4 * 3 /* skip first 3 pixels */ : 0;

      t.ok(
        abs(sourceColor[0] - color[0 + colorOffset]) < EPSILON,
        `Red channel should have correct value when using ${
          sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
        } as source, isSubCopy=${isSubCopy}`
      );
      t.ok(
        abs(sourceColor[1] - color[1 + colorOffset]) < EPSILON,
        `Green channel should have correct value when using ${
          sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
        } as source, isSubCopy=${isSubCopy}`
      );
      t.ok(
        abs(sourceColor[2] - color[2 + colorOffset]) < EPSILON,
        `Blue channel should have correct value when using ${
          sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
        } as source, isSubCopy=${isSubCopy}`
      );
      t.ok(
        abs(sourceColor[3] - color[3 + colorOffset]) < EPSILON,
        `Alpha channel should have correct value when using ${
          sourceIsFramebuffer ? 'Framebuffer' : 'Texture'
        } as source, isSubCopy=${isSubCopy}`
      );
    });
  });
  t.end();
}

test('WebGL#copyToTexture', t => {
  const {gl} = fixture;
  testCopyToTexture(t, gl);
});

test('WebGL2#copyToTexture', t => {
  const {gl2} = fixture;
  if (gl2) {
    testCopyToTexture(t, gl2);
  } else {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
  }
});

/* eslint-disable max-statements */
function testBlit(t, gl) {
  [true, false].forEach(destinationIsFramebuffer => {
    [true, false].forEach(sourceIsFramebuffer => {
      // const byteLength = 6 * 4; // 6 floats
      const sourceColor = [255, 128, 64, 32];
      const clearColor = [1, 0.5, 0.25, 0.125];

      const sourceTexture = createTexture(gl, {
        data: sourceIsFramebuffer ? null : new Uint8Array(sourceColor)
      });

      const destinationTexture = createTexture(gl, {
        // allocate extra size to test x/y offsets when using sub copy
        width: 2,
        height: 2,
        // allocate memory with 0's
        data: new Uint8Array(4 * 4)
      });

      let source;
      if (sourceIsFramebuffer) {
        const framebuffer = new Framebuffer(gl, {
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
        const framebuffer = new Framebuffer(gl, {
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
      const colorOffset = 4 * 3; /* skip first 3 pixels */

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

test('WebGL2#CopyAndBlit blit no-crash', t => {
  const {gl2} = fixture;
  if (gl2) {
    t.doesNotThrow(() => {
      const framebufferSrc = new Framebuffer(gl2);
      const framebufferDst = new Framebuffer(gl2);
      blit(framebufferSrc, framebufferDst, {
        sourceX0: 0,
        sourceY0: 0,
        sourceX1: 1,
        sourceY1: 1,
        targetX0: 0,
        targetY0: 0,
        targetX1: 1,
        targetY1: 1,
        color: true,
        depth: true,
        stencil: true
      });
    }, 'Framebuffer blit successful');
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

test('WebGL2#blit', t => {
  const {gl2} = fixture;
  if (gl2) {
    testBlit(t, gl2);
  } else {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
  }
});
