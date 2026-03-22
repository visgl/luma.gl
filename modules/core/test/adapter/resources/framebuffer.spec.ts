import {expect, test} from 'vitest';
import { getTestDevices } from '@luma.gl/test-utils';
import { Framebuffer } from '@luma.gl/core';
const TEST_CASES = [{
  title: 'Default attachments',
  getOpts: device => ({}),
  pass: false
}, {
  title: 'No attachments',
  getOpts: device => ({
    attachments: {}
  }),
  pass: false
}, {
  title: 'Autocreated Depth Renderbuffer + Color Texture',
  getOpts: device => ({
    colorAttachments: ['rgba8unorm'],
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
      colorAttachment0: webglDevice.createTexture(gl),
      depthStencilAttachment: webglDevice.createTexture({format: 'stencil8'})
    }
  }),
  pass: true
},
{
  title: 'Combined Depth/Stencil Renderbuffer + Color Texture',
  getOpts: (gl) => ({
    attachments: {
      colorAttachment0: webglDevice.createTexture(gl),
      depthStencilAttachment: webglDevice.createTexture({format: 'depth24plus'})
    }
  }),
  pass: true
}
*/
// {
//   features: FEATURES.MULTIPLE_RENDER_TARGETS,
//   getOpts(gl) {
//     attachments: {
//       [GL.COLOR_ATTACHMENT0]: webglDevice.createTexture(gl),
//       [GL.COLOR_ARTTACHMENT1]: webglDevice.createTexture(gl),
//       [GL.DEPTH]: webglDevice.createRenderbuffer(gl)
//     }
//   },
//   pass: true
// }
];
test('WebGLDevice.createFramebuffer()', async () => {
  for (const testDevice of await getTestDevices()) {
    expect(() => testDevice.createFramebuffer({}), 'Framebuffer without attachment fails').toThrow();
    const framebuffer = testDevice.createFramebuffer({
      colorAttachments: ['rgba8unorm'],
      depthStencilAttachment: 'depth16unorm'
    });
    expect(framebuffer instanceof Framebuffer, 'Framebuffer with attachment').toBeTruthy();
    framebuffer.destroy();
    expect(framebuffer instanceof Framebuffer, 'Framebuffer delete successful').toBeTruthy();
    framebuffer.destroy();
    expect(framebuffer instanceof Framebuffer, 'Framebuffer repeated delete successful').toBeTruthy();
  }
});
test('Framebuffer#clone overrides size', async () => {
  for (const device of await getTestDevices()) {
    const framebuffer = device.createFramebuffer({
      width: 2,
      height: 2,
      colorAttachments: ['rgba8unorm'],
      depthStencilAttachment: 'depth16unorm'
    });
    const cloned = framebuffer.clone({
      width: 4,
      height: 4
    });
    expect(cloned, `${device.type}: clone returns new framebuffer`).not.toBe(framebuffer);
    expect(cloned.width, `${device.type}: cloned width is overridden`).toBe(4);
    expect(cloned.height, `${device.type}: cloned height is overridden`).toBe(4);
    expect(cloned.colorAttachments[0].texture.width, `${device.type}: cloned color attachment width overridden`).toBe(4);
    expect(cloned.colorAttachments[0].texture.height, `${device.type}: cloned color attachment height overridden`).toBe(4);
    expect(cloned.colorAttachments[0].texture, `${device.type}: cloned color attachment is new texture`).not.toBe(framebuffer.colorAttachments[0].texture);
    expect(framebuffer.width, `${device.type}: original width unchanged`).toBe(2);
    expect(framebuffer.height, `${device.type}: original height unchanged`).toBe(2);
    framebuffer.destroy();
    cloned.destroy();
  }
});
test('WebGLFramebuffer create and resize attachments', async () => {
  for (const testDevice of await getTestDevices()) {
    for (const tc of TEST_CASES) {
      let props;
      expect(() => {
        props = tc.getOpts(testDevice);
      }, `Framebuffer options constructed for "${tc.title}"`).not.toThrow();
      const testFramebufferOpts = () => {
        const framebuffer = testDevice.createFramebuffer(props);
        framebuffer.resize({
          width: 1000,
          height: 1000
        });
        expect(framebuffer.width, 'Framebuffer width updated correctly on resize').toBe(1000);
        expect(framebuffer.height, 'Framebuffer height updated correctly on resize').toBe(1000);
        framebuffer.resize({
          width: 100,
          height: 100
        });
        expect(framebuffer.width, 'Framebuffer width updated correctly on resize').toBe(100);
        expect(framebuffer.height, 'Framebuffer height updated correctly on resize').toBe(100);
        framebuffer.destroy(); // {recursive: true}
      };
      if (tc.pass) {
        expect(testFramebufferOpts, `${testDevice.id}.createFramebuffer() success as expected for "${tc.title}"`).not.toThrow();
      } else {
        expect(testFramebufferOpts).toThrow(`${testDevice.id}.createFramebuffer() failure as expected for "${tc.title}"`);
      }
    }
  }
});
test('WebGLFramebuffer resize', async () => {
  for (const testDevice of await getTestDevices()) {
    const framebuffer = testDevice.createFramebuffer({
      colorAttachments: ['rgba8unorm'],
      depthStencilAttachment: 'depth16unorm'
    });
    framebuffer.resize({
      width: 2,
      height: 2
    });
    expect(framebuffer.width, 'Framebuffer width updated correctly on resize').toBe(2);
    expect(framebuffer.height, 'Framebuffer height updated correctly on resize').toBe(2);
    framebuffer.delete();
  }
});
test('WebGLFramebuffer contents', async () => {
  for (const testDevice of await getTestDevices()) {
    const framebuffer = testDevice.createFramebuffer({
      colorAttachments: ['rgba8unorm'],
      depthStencilAttachment: 'depth16unorm',
      width: 2,
      height: 2
    });
    if (testDevice.type === 'webgl') {
      try {
        const renderPass = testDevice.beginRenderPass({
          framebuffer,
          clearColor: [1, 0, 0, 1],
          clearDepth: 1
        });
        renderPass.end();
      } catch (error) {}
      const pixels = testDevice.readPixelsToArrayWebGL(framebuffer);
      expect(pixels, 'Framebuffer pixel colors are set correctly').toEqual(
      // prettier-ignore
      [255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]);
    }
    framebuffer.delete();
  }
});
test('Framebuffer#getDefaultFramebuffer', async () => {
  for (const testDevice of await getTestDevices()) {
    if (testDevice.type === 'webgl') {
      const framebuffer = testDevice.getDefaultCanvasContext().getCurrentFramebuffer();
      expect(framebuffer instanceof Framebuffer, 'getDefaultFramebuffer successful').toBeTruthy();
      expect(() => framebuffer.resize({
        width: 1000,
        height: 1000
      }), 'defaultFramebuffer.resize({width, height}) updates size').not.toThrow();
      expect(framebuffer.width, 'defaultFramebuffer width updates').toBe(1000);
      expect(framebuffer.height, 'defaultFramebuffer height updates').toBe(1000);
    }
  }
});

/*

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
  [GL.UNSIGNED_BYTE]: webglDevice.createUint8Array(RGB_TO[GL.UNSIGNED_BYTE](DATA)),
  [GL.UNSIGNED_SHORT_5_6_5]: webglDevice.createUint16Array(RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
};
const DEFAULT_TEXTURE_DATA = webglDevice.createUint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

test('WebGL2#Framebuffer texture attach and read', t => {
  const {gl2} = fixture;

  const framebuffer = webglDevice.createFramebuffer(gl2, {depth: true, width: 1, height: 1, check: false});

  for (let format in TEXTURE_FORMATS) {
    const textureFormat = TEXTURE_FORMATS[format];

    const {dataFormat, types, compressed} = textureFormat;
    format = Number(format);

    if (Texture2D.isSupported(gl2, {format}) && !compressed) {

      let texture;

      for (const type of types) {
        // texture = webglDevice.createTexture(gl2, Object.assign({format, dataFormat, type}));
        // t.equals(texture.format, format,
        //   `Texture2D({format: ${getKey(format)}, type: ${getKey(type)}, dataFormat: ${getKey(dataFormat)}) created`);
        // texture.destroy()
        const data = TEXTURE_DATA[type] || DEFAULT_TEXTURE_DATA;
        texture = webglDevice.createTexture(gl2, {format, dataFormat, type, data, width: 1, height: 1});
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
