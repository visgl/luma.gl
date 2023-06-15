/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {Framebuffer} from '@luma.gl/api';
import {webgl1Device, getWebGLTestDevices} from '@luma.gl/test-utils';

const TEST_CASES = [
  {
    title: 'Default attachments',
    getOpts: (device) => ({}),
    pass: false
  },
  {
    title: 'No attachments',
    getOpts: (device) => ({attachments: {}}),
    pass: false
  },
  {
    title: 'Autocreated Depth Renderbuffer + Color Texture',
    getOpts: (device) => ({
      colorAttachments: ['rgba8unorm-unsized'],
      depthStencilAttachment: 'depth16unorm'
    }),
    pass: true
  }
  /*
  {
    title: 'Supplied Depth Renderbuffer + Color Texture',
    getOpts: (device) => ({
      colorAttachments: [device.createTexture()],
      depthStencilAttachment: device.createTexture({format: 'depth16unorm'})
    }),
    pass: true
  },
  {
    title: 'Simple Stencil Renderbuffer + Color Texture',
    getOpts: (gl) => ({
      attachments: {
        colorAttachment0: webgl1Device.createTexture(gl),
        depthStencilAttachment: webgl1Device.createTexture({format: 'stencil8'})
      }
    }),
    pass: true
  },
  {
    title: 'Combined Depth/Stencil Renderbuffer + Color Texture',
    getOpts: (gl) => ({
      attachments: {
        colorAttachment0: webgl1Device.createTexture(gl),
        depthStencilAttachment: webgl1Device.createTexture({format: 'depth24plus'})
      }
    }),
    pass: true
  }
  */
  // {
  //   features: FEATURES.MULTIPLE_RENDER_TARGETS,
  //   getOpts(gl) {
  //     attachments: {
  //       [GL.COLOR_ATTACHMENT0]: webgl1Device.createTexture(gl),
  //       [GL.COLOR_ARTTACHMENT1]: webgl1Device.createTexture(gl),
  //       [GL.DEPTH]: webgl1Device.createRenderbuffer(gl)
  //     }
  //   },
  //   pass: true
  // }
];

test('WebGLDevice.createFramebuffer()', async (t) => {
  for (const testDevice of await getWebGLTestDevices()) {
    t.throws(() => testDevice.createFramebuffer({}), 'Framebuffer without attachment fails');

    const framebuffer = testDevice.createFramebuffer({
      colorAttachments: ['rgba8unorm-unsized'],
      depthStencilAttachment: 'depth16unorm'
    });
    t.ok(framebuffer instanceof Framebuffer, 'Framebuffer with attachment');

    framebuffer.destroy();
    t.ok(framebuffer instanceof Framebuffer, 'Framebuffer delete successful');

    framebuffer.destroy();
    t.ok(framebuffer instanceof Framebuffer, 'Framebuffer repeated delete successful');
  }
  t.end();
});

test('WebGLFramebuffer create and resize attachments', async (t) => {
  for (const testDevice of await getWebGLTestDevices()) {
    for (const tc of TEST_CASES) {
      let props;

      t.doesNotThrow(() => {
        props = tc.getOpts(testDevice);
      }, `Framebuffer options constructed for "${tc.title}"`);

      const testFramebufferOpts = () => {
        const framebuffer = testDevice.createFramebuffer(props);

        framebuffer.resize({width: 1000, height: 1000});
        t.equals(framebuffer.width, 1000, 'Framebuffer width updated correctly on resize');
        t.equals(framebuffer.height, 1000, 'Framebuffer height updated correctly on resize');

        framebuffer.resize({width: 100, height: 100});
        t.equals(framebuffer.width, 100, 'Framebuffer width updated correctly on resize');
        t.equals(framebuffer.height, 100, 'Framebuffer height updated correctly on resize');

        framebuffer.destroy(); // {recursive: true}
      };

      if (tc.pass) {
        t.doesNotThrow(
          testFramebufferOpts,
          `${testDevice.id}.createFramebuffer() success as expected for "${tc.title}"`
        );
      } else {
        t.throws(
          testFramebufferOpts,
          `${testDevice.id}.createFramebuffer() failure as expected for "${tc.title}"`
        );
      }
    }
  }
  t.end();
});

test.skip('WebGLFramebuffer resize', (t) => {
  const frameBufferOptions = {
    colorAttachments: [webgl1Device.createTexture({})]
    // depthStencilAttachment: webgl1Device.createRenderbuffer({format: GL.DEPTH_STENCIL})
  };

  const framebuffer = webgl1Device.createFramebuffer(frameBufferOptions);

  framebuffer.resize({width: 1000,height:  1000});
  t.equals(framebuffer.width, 1000, 'Framebuffer width updated correctly on resize');
  t.equals(framebuffer.height, 1000, 'Framebuffer height updated correctly on resize');

  framebuffer.resize({width: 100, height: 100});
  t.equals(framebuffer.width, 100, 'Framebuffer width updated correctly on resize');
  t.equals(framebuffer.height, 100, 'Framebuffer height updated correctly on resize');
  t.end();
});

/*
test.skip('Framebuffer#getDefaultFramebuffer', (t) => {
  const framebuffer = webgl1Device.getDefaultCanvasContext().getCurrentFramebuffer();
  t.ok(framebuffer instanceof Framebuffer, 'getDefaultFramebuffer successful');

  t.throws(
    () => framebuffer.resize(1000, 1000),
    'defaultFramebuffer.resize({width, height}) throws'
  );

  t.end();
});
*/

/*
import {TEXTURE_FORMATS} from '@luma.gl/webgl/texture-formats';

const RGB_TO = {
  [GL.UNSIGNED_BYTE]: (r, g, b) => [r * 256, g * 256, b * 256],
  [GL.UNSIGNED_SHORT_5_6_5]: (r, g, b) => r * 32 << 11 + g * 64 << 6 + b * 32
};
// const RGB_FROM = {
//   [GL.UNSIGNED_BYTE]: v => [v[0] / 256, v[1] / 256, v[2] / 256],
//   [GL.UNSIGNED_SHORT_5_6_5]: v => [v >> 11 / 32, v >> 6 % 64 / 64, v % 32 * 32]
// };

const DATA = [1, 0.5, 0.25, 0.125];
const TEXTURE_DATA = {
  [GL.UNSIGNED_BYTE]: webgl1Device.createUint8Array(RGB_TO[GL.UNSIGNED_BYTE](DATA)),
  [GL.UNSIGNED_SHORT_5_6_5]: webgl1Device.createUint16Array(RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
};
const DEFAULT_TEXTURE_DATA = webgl1Device.createUint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

test('WebGL2#Framebuffer texture attach and read', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const framebuffer = webgl1Device.createFramebuffer(gl2, {depth: true, width: 1, height: 1, check: false});

  for (let format in TEXTURE_FORMATS) {
    const textureFormat = TEXTURE_FORMATS[format];

    const {dataFormat, types, compressed} = textureFormat;
    format = Number(format);

    if (Texture2D.isSupported(gl2, {format}) && !compressed) {

      let texture;

      for (const type of types) {
        // texture = webgl1Device.createTexture(gl2, Object.assign({format, dataFormat, type}));
        // t.equals(texture.format, format,
        //   `Texture2D({format: ${getKey(format)}, type: ${getKey(type)}, dataFormat: ${getKey(dataFormat)}) created`);
        // texture.destroy()
        const data = TEXTURE_DATA[type] || DEFAULT_TEXTURE_DATA;
        texture = webgl1Device.createTexture(gl2, {format, dataFormat, type, data, width: 1, height: 1});
        t.equals(texture.format, format,
          `Texture2D({format: ${getKey(format)}, type: ${getKey(type)}, dataFormat: ${getKey(dataFormat)}) created`);

        framebuffer.attach({
          [GL.COLOR_ATTACHMENT0]: texture
        });
        t.doesNotThrow(
          () => framebuffer.checkStatus(),
          'Framebuffer is attachment complete'
        );

        let pixels;
        t.doesNotThrow(
          () => {
            pixels = radPixelsToArray(framebuffer);
          },
          'Framebuffer.readPixels returned'
        );
        t.ok(pixels, 'Received pixels');
        texture.destroy();
      }
    }
  }

  t.end();
});
*/
