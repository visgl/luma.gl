
import {merge} from './utils';

class Texture {

  constructor(gl, opts = {}) {
    this.gl = gl;
    this.target = gl.TEXTURE_2D;

    opts = merge({
      flipY: true,
      alignment: 1,
      magFilter: gl.NEAREST,
      minFilter: gl.NEAREST,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
      generateMipmap: false
    }, opts);

    this.flipY = opts.flipY;
    this.alignment = opts.alignment;
    this.magFilter = opts.magFilter;
    this.minFilter = opts.minFilter;
    this.wrapS = opts.wrapS;
    this.wrapT = opts.wrapT;
    this.format = opts.format;
    this.type = opts.type;
    this.generateMipmap = opts.generateMipmap;

    if (this.type === gl.FLOAT) {
      this.floatExtension = gl.getExtension('OES_texture_float');
      if (!this.floatExtension) {
        throw new Error('OES_texture_foat is not supported.');
      }
    }

    this.texture = gl.createTexture();
  }

}


export class Texture2D extends Texture {

  constructor(gl, opts) {
    super(gl, opts);
    opts.data = opts.data || null;
    this.update(opts);
  }

  bind(index) {
    const gl = this.gl;
    if (index !== undefined) {
      gl.activeTexture(gl.TEXTURE0 + index);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  update(opts) {
    const gl = this.gl;
    this.width = opts.width;
    this.height = opts.height;
    this.border = opts.border || 0;
    this.data = opts.data;
    this.bind();
    if (this.width || this.height) {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, this.data);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
    if (this.generateMipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
  }

}


// rye TODO: add TextureCube class.
