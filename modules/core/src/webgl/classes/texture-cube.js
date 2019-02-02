import GL from '@luma.gl/constants';
import Texture from './texture';
import {assert} from '../../utils';

const FACES = [
  GL.TEXTURE_CUBE_MAP_POSITIVE_X,
  GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
  GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
  GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
  GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
  GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
];

export default class TextureCube extends Texture {
  constructor(gl, props = {}) {
    super(gl, Object.assign({}, props, {target: GL.TEXTURE_CUBE_MAP}));
    this.initialize(props);
    Object.seal(this);
  }

  /* eslint-disable max-len, max-statements */
  initialize(props = {}) {
    const {format = GL.RGBA, mipmaps = true} = props;

    let {width = 1, height = 1, type = GL.UNSIGNED_BYTE, dataFormat} = props;

    // Deduce width and height based on one of the faces
    ({type, dataFormat} = this._deduceParameters({format, type, dataFormat}));
    ({width, height} = this._deduceImageSize({
      data: props[GL.TEXTURE_CUBE_MAP_POSITIVE_X],
      width,
      height
    }));

    // Enforce cube
    assert(width === height);

    // Temporarily apply any pixel store paramaters and build textures
    // withParameters(this.gl, props, () => {
    //   for (const face of CUBE_MAP_FACES) {
    //     this.setImageData({
    //       target: face,
    //       data: props[face],
    //       width, height, format, type, dataFormat, border, mipmaps
    //     });
    //   }
    // });

    this.setCubeMapImageData(props);

    // Called here so that GL.
    // TODO - should genMipmap() be called on the cubemap or on the faces?
    if (mipmaps) {
      this.generateMipmap(props);
    }

    // Store props for accessors
    this.opts = props;
  }

  subImage({face, data, x = 0, y = 0, mipmapLevel = 0}) {
    return this._subImage({target: face, data, x, y, mipmapLevel});
  }

  /* eslint-disable max-statements, max-len */
  setCubeMapImageData({
    width,
    height,
    pixels,
    data,
    border = 0,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE,
    generateMipmap = false
  }) {
    const {gl} = this;
    const imageDataMap = pixels || data;

    // TODO - Make this a method of Texture, and call that
    // A rare instance where a local function is the lesser evil?
    const setImageData = (face, imageData) => {
      if (this.width || this.height) {
        gl.texImage2D(face, 0, format, width, height, border, format, type, imageData);
      } else {
        gl.texImage2D(face, 0, format, format, type, imageData);
      }
    };

    this.bind();
    for (const face of FACES) {
      const imageData = imageDataMap[face];

      if (imageData instanceof Promise) {
        imageData.then(resolvedImageData => setImageData(face, resolvedImageData));
      } else {
        setImageData(face, imageData);
      }
    }
    this.unbind();
  }

  setImageDataForFace(options) {
    const {
      face,
      width,
      height,
      pixels,
      data,
      border = 0,
      format = GL.RGBA,
      type = GL.UNSIGNED_BYTE
      // generateMipmap = false // TODO
    } = options;

    const {gl} = this;

    const imageData = pixels || data;

    this.bind();
    if (imageData instanceof Promise) {
      imageData.then(resolvedImageData =>
        this.setImageDataForFace(
          Object.assign({}, options, {
            face,
            data: resolvedImageData,
            pixels: resolvedImageData
          })
        )
      );
    } else if (this.width || this.height) {
      gl.texImage2D(face, 0, format, width, height, border, format, type, imageData);
    } else {
      gl.texImage2D(face, 0, format, format, type, imageData);
    }

    return this;
  }

  bind({index} = {}) {
    if (index !== undefined) {
      this.gl.activeTexture(GL.TEXTURE0 + index);
    }
    this.gl.bindTexture(GL.TEXTURE_CUBE_MAP, this.handle);
    return index;
  }

  unbind() {
    this.gl.bindTexture(GL.TEXTURE_CUBE_MAP, null);
    return this;
  }
}

TextureCube.FACES = FACES;
