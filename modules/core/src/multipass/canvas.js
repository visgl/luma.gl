import 'luma.gl/debug';

import {
  createGLContext,
  Model,
  Texture2D,
  _MultiPassRenderer as MultiPassRenderer,
  _ClearPass as ClearPass,
  _CopyPass as CopyPass,
  _TexturePass as TexturePass
} from 'luma.gl';

import ShaderModulePass from './shader-module-pass';

/* global document */

const DEFAULT_VS = `\
attribute vec2 vertex;
attribute vec2 _texCoord;
varying vec2 texCoord;
void main() {
  texCoord = _texCoord;
  gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);
}
`;

export default class Canvas {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.gl = createGLContext({canvas: this.canvas, opts: {premultipliedAlpha: false}});

    if (!this.gl) {
      throw new Error('This browser does not support WebGL');
    }

    this.texture = null;
    this.spareTexture = null;
    this.flippedModel = null;
  }

  installFiltersAsMethods(filters) {
    // // Filter methods
    for (const key in filters) {
      if (key !== 'canvas') {
        this[key] = props => this.filter(filters[key], props).bind(this);
      }
    }
  }

  setTexture(element) {
    this.texture = new Texture2D(this.gl, {pixels: element});
    this.resize(this.gl, this.texture.width, this.texture.height);
    return this;
  }

  resize(gl, width, height) {
    const realToCSSPixels = 1; // window.devicePixelRatio || 1;

    // Check if the canvas is not the same size.
    if (gl.canvas.width !== width || gl.canvas.height !== height) {
      // Make the canvas the same size
      gl.canvas.width = width;
      gl.canvas.height = height;

      // Lookup the size the browser is displaying the canvas in CSS pixels
      // and compute a size needed to make our drawingbuffer match it in
      // device pixels.
      const displayWidth = Math.floor(width / realToCSSPixels);
      const displayHeight = Math.floor(height / realToCSSPixels);

      gl.canvas.style.width = `${displayWidth}px`;
      gl.canvas.style.height = `${displayHeight}px`;

      gl.viewport(0, 0, width, height);

      this.width = displayWidth;
      this.height = displayHeight;
    }
  }

  replace(node) {
    node.parentNode.insertBefore(this.canvas, node);
    node.parentNode.removeChild(node);
    return this;
  }

  // Draw a texture to the canvas, with an optional width and height to scale to.
  // If no width and height are given then the original texture width and height
  // are used.
  draw() {
    this.multiPassRenderer = new MultiPassRenderer(this.gl, [
      new ClearPass(this.gl),
      new TexturePass(this.gl, {texture: this.texture}),
      new CopyPass(this.gl, {screen: true})
    ]);

    this.multiPassRenderer.render();

    return this;
  }

  update() {
    this.multiPassRenderer.render({});
    return this;
  }

  filter(shaderModule, props) {
    this.multiPassRenderer = new MultiPassRenderer(this.gl, [
      new ClearPass(this.gl),
      new TexturePass(this.gl, {texture: this.texture}),
      new ShaderModulePass(this.gl, shaderModule, props),
      new CopyPass(this.gl, {screen: true})
    ]);

    this.multiPassRenderer.render();

    return this;
  }

  /*
  contents() {
    // const gl = this.gl;
    // const texture = new Texture2D(this.gl, {
    //   width: this.texture.width,
    //   height: this.texture.height,
    //   format: gl.RGBA,
    //   type: gl.UNSIGNED_BYTE
    // });
    // this.texture.use();
    // texture.drawTo(() => this.getDefaultModel(this.gl).drawRect());
    // return wrapTexture(texture);
  }
  */

  // Get a Uint8 array of pixel values: [r, g, b, a, r, g, b, a, ...]
  // Length of the array will be width * height * 4.
  getPixelArray() {
    const gl = this.gl;
    const w = this.texture.width;
    const h = this.texture.height;
    const array = new Uint8Array(w * h * 4);
    this.texture.drawTo(() => gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, array));
    return array;
  }

  _initialize(width, height) {
    const gl = this.gl;
    let type = gl.UNSIGNED_BYTE;

    // Go for floating point buffer textures if we can, it'll make the bokeh
    // filter look a lot better. Note that on Windows, ANGLE does not let you
    // render to a floating-point texture when linear filtering is enabled.
    // See http://crbug.com/172278 for more information.
    if (this.gl.getExtension('OES_texture_float') && gl.getExtension('OES_texture_float_linear')) {
      const testTexture = new Texture2D(this.gl, {
        width: 100,
        height: 100,
        format: gl.RGBA,
        type: gl.FLOAT
      });

      try {
        // Only use gl.FLOAT if we can render to it
        testTexture.drawTo(() => {
          type = gl.FLOAT;
        });
      } catch (error) {
        // ignore
      }
      testTexture.destroy();
    }

    if (this.spareTexture) {
      this.spareTexture.destroy();
    }
    this.width = width;
    this.height = height;
    this.texture = new Texture2D(this.gl, {width, height, format: gl.RGBA, type});
    this.spareTexture = new Texture2D(this.gl, {width, height, format: gl.RGBA, type});
    this.extraTexture =
      this.extraTexture || new Texture2D(this.gl, {width: 0, height: 0, format: gl.RGBA, type});
    this.flippedModel =
      this.flippedModel ||
      new Model(this.gl, {
        vs: DEFAULT_VS,
        fs: `\
uniform sampler2D texture;
varying vec2 texCoord;
void main() {
  gl_FragColor = texture2D(texture, vec2(texCoord.x, 1.0 - texCoord.y));
}
`
      });
    this.isInitialized = true;
  }
}
