import {merge} from '../utils';
import {glCheckError} from './context';

class Texture {

  /* eslint-disable max-statements */
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
        throw new Error('OES_texture_float is not supported.');
      }
    }

    this.texture = gl.createTexture();
    if (!this.texture) {
      glCheckError(gl);
    }

    this.userData = {};
  }
  /* eslint-enable max-statements */

  delete() {
    const {gl} = this;
    gl.deleteTexture(this.texture);
    this.texture = null;
    glCheckError(gl);

    return this;
  }

}

export class Texture2D extends Texture {

  constructor(gl, opts) {
    super(gl, opts);
    opts.data = opts.data || null;

    this.width = 0;
    this.height = 0;
    this.border = 0;
    this.data = null;
    Object.seal(this);

    this.update(opts);
  }

  bind(index) {
    const gl = this.gl;
    if (index !== undefined) {
      gl.activeTexture(gl.TEXTURE0 + index);
      glCheckError(gl);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    glCheckError(gl);
    if (index === undefined) {
      const result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
      glCheckError(gl);
      return result;
    }
    return index;
  }

  /* eslint-disable max-statements */
  update(opts) {
    const gl = this.gl;
    this.width = opts.width;
    this.height = opts.height;
    this.border = opts.border || 0;
    this.data = opts.data;
    if (this.flipY) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      glCheckError(gl);
    } else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      glCheckError(gl);
    }
    this.bind();
    if (this.width || this.height) {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height,
        this.border, this.format, this.type, this.data);
      glCheckError(gl);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type,
        this.data);
      glCheckError(gl);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
    glCheckError(gl);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
    glCheckError(gl);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
    glCheckError(gl);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
    glCheckError(gl);
    if (this.generateMipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
      glCheckError(gl);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    glCheckError(gl);
  }

}

export class TextureCube extends Texture {

  constructor(gl, opts) {
    super(gl, opts);
    opts.data = opts.data || null;
    this.update(opts);
  }

  bind(index) {
    const gl = this.gl;
    if (index !== undefined) {
      gl.activeTexture(gl.TEXTURE0 + index);
      glCheckError(gl);
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    glCheckError(gl);
    if (index === undefined) {
      const result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
      glCheckError(gl);
      return result;
    }
    return index;
  }

  /* eslint-disable max-statements, max-len */
  update(opts) {
    const gl = this.gl;
    this.width = opts.width;
    this.height = opts.height;
    this.border = opts.border || 0;
    this.data = opts.data;
    this.bind();
    if (this.width || this.height) {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.x);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.y);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.z);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.x);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.y);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.z);
      glCheckError(gl);
    } else {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.format, this.format, this.type, this.data.pos.x);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.format, this.format, this.type, this.data.pos.y);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.format, this.format, this.type, this.data.pos.z);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.format, this.format, this.type, this.data.neg.x);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.format, this.format, this.type, this.data.neg.y);
      glCheckError(gl);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.format, this.format, this.type, this.data.neg.z);
      glCheckError(gl);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, this.minFilter);
    glCheckError(gl);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, this.magFilter);
    glCheckError(gl);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, this.wrapS);
    glCheckError(gl);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, this.wrapT);
    glCheckError(gl);
    if (this.generateMipmap) {
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      glCheckError(gl);
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    glCheckError(gl);
  }

}
