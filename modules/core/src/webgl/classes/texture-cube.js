import GL from '@luma.gl/constants';
import Texture from './texture';
import {assertWebGLContext} from '../utils';

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
    assertWebGLContext(gl);

    super(gl, Object.assign({}, props, {target: GL.TEXTURE_CUBE_MAP}));

    this.initialize(props);

    Object.seal(this);
  }

  /* eslint-disable max-len, max-statements */
  initialize(props = {}) {
    const {/* format = GL.RGBA, */ mipmaps = true} = props;

    // let {width = 1, height = 1, type = GL.UNSIGNED_BYTE, dataFormat} = props;

    // Deduce width and height based on one of the faces
    // ({type, dataFormat} = this._deduceParameters({format, type, dataFormat}));
    // ({width, height} = this._deduceImageSize({
    //   data: props[GL.TEXTURE_CUBE_MAP_POSITIVE_X],
    //   width,
    //   height
    // }));

    // Enforce cube
    // assert(width === height);

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

    // Store props for accessors
    this.opts = props;

    this.setCubeMapImageData(props).then(() => {
      this.loaded = true;

      // TODO - should genMipmap() be called on the cubemap or on the faces?
      // TODO - without generateMipmap() cube textures do not work at all!!! Why?
      if (mipmaps) {
        this.generateMipmap(props);
      }
    });
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
    type = GL.UNSIGNED_BYTE
  }) {
    const {gl} = this;
    const imageDataMap = pixels || data;

    return Promise.all(FACES.map(face => imageDataMap[face])).then(resolvedFaces => {
      this.bind();

      FACES.forEach((face, index) => {
        if (width && height) {
          gl.texImage2D(face, 0, format, width, height, border, format, type, resolvedFaces[index]);
        } else {
          gl.texImage2D(face, 0, format, format, type, resolvedFaces[index]);
        }
      });

      this.unbind();
    });
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
}

TextureCube.FACES = FACES;
