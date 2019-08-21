import GL from '@luma.gl/constants';
import {Texture2D, TextureCube} from '@luma.gl/core';
import {loadImage} from '@loaders.gl/images';

export default class GLTFEnvironment {
  constructor(gl, {brdfLutUrl, getTexUrl, specularMipLevels = 10}) {
    this.gl = gl;
    this.brdfLutUrl = brdfLutUrl;
    this.getTexUrl = getTexUrl;
    this.specularMipLevels = specularMipLevels;
  }

  makeCube({id, getTextureForFace, parameters}) {
    const pixels = {};
    TextureCube.FACES.forEach(face => {
      pixels[face] = getTextureForFace(face);
    });
    return new TextureCube(this.gl, {
      id,
      mipmaps: false,
      parameters,
      pixels
    });
  }

  getDiffuseEnvSampler() {
    if (!this._DiffuseEnvSampler) {
      this._DiffuseEnvSampler = this.makeCube({
        id: 'DiffuseEnvSampler',
        getTextureForFace: dir => loadImage(this.getTexUrl('diffuse', dir, 0)),
        parameters: {
          [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
          [GL.TEXTURE_MAG_FILTER]: GL.LINEAR
        }
      });
    }

    return this._DiffuseEnvSampler;
  }

  getSpecularEnvSampler() {
    if (!this._SpecularEnvSampler) {
      this._SpecularEnvSampler = this.makeCube({
        id: 'SpecularEnvSampler',
        getTextureForFace: dir => {
          const imageArray = [];
          for (let lod = 0; lod <= this.specularMipLevels - 1; lod++) {
            imageArray.push(loadImage(this.getTexUrl('specular', dir, lod)));
          }
          return imageArray;
        },
        parameters: {
          [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
          [GL.TEXTURE_MAG_FILTER]: GL.LINEAR
        }
      });
    }

    return this._SpecularEnvSampler;
  }

  getBrdfTexture() {
    if (!this._BrdfTexture) {
      this._BrdfTexture = new Texture2D(this.gl, {
        id: 'brdfLUT',
        parameters: {
          [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
          [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
          [GL.TEXTURE_MAG_FILTER]: GL.LINEAR
        },
        pixelStore: {
          [this.gl.UNPACK_FLIP_Y_WEBGL]: false
        },
        // Texture2D accepts a promise that returns an image as data (Async Textures)
        data: loadImage(this.brdfLutUrl)
      });
    }

    return this._BrdfTexture;
  }

  delete() {
    if (this._DiffuseEnvSampler) {
      this._DiffuseEnvSampler.delete();
      this._DiffuseEnvSampler = null;
    }

    if (this._SpecularEnvSampler) {
      this._SpecularEnvSampler.delete();
      this._SpecularEnvSampler = null;
    }

    if (this._BrdfTexture) {
      this._BrdfTexture.delete();
      this._BrdfTexture = null;
    }
  }
}
