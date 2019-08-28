import GL from '@luma.gl/constants';
import {
  cloneTextureFrom,
  Texture2D,
  readPixelsToArray,
  Buffer,
  getShaderVersion
} from '@luma.gl/webgl';
import {
  _transform as transformModule,
  getPassthroughFS,
  typeToChannelCount,
  combineInjects
} from '@luma.gl/shadertools';
import TextureTransformBinding from './texture-transform-binding';
import {updateForTextures, getSizeUniforms} from './transform-shader-utils';

// TODO: move these constants to transform-shader-utils
// Texture parameters needed so sample can precisely pick pixel for given element id.
const SRC_TEX_PARAMETER_OVERRIDES = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
};
const FS_OUTPUT_VARIABLE = 'transform_output';

export default class TextureTransform {
  constructor(gl, props = {}) {
    this.gl = gl;
    this.currentIndex = 0;
    this._swapTexture = null;
    this.targetTextureVarying = null;
    this.targetTextureType = null;
    this.samplerTextureMap = null;
    this.bindings = [];

    this.resources = {}; // resources to be deleted

    this.initialize(props);
    Object.seal(this);
  }

  getModelProps(props = {}) {
    const updatedModelProps = this.processVertexShader(props);
    return Object.assign({}, props, updatedModelProps);
  }

  getDrawOptions(opts = {}) {
    const {sourceTextures, framebuffer, targetTexture} = this.bindings[
      this.currentIndex
    ].getResources();

    const attributes = Object.assign({}, opts.attributes);
    const uniforms = Object.assign({}, opts.uniforms);
    const parameters = Object.assign({}, opts.paramters);
    let discard = opts.discard;

    if (this.hasSourceTextures || this.hasTargetTexture) {
      attributes.transform_elementID = this.elementIDBuffer;

      for (const sampler in this.samplerTextureMap) {
        const textureName = this.samplerTextureMap[sampler];
        uniforms[sampler] = sourceTextures[textureName];
      }
      this.setSourceTextureParameters();
      // get texture size uniforms
      const sizeUniforms = getSizeUniforms({
        sourceTextureMap: sourceTextures,
        targetTextureVarying: this.targetTextureVarying,
        targetTexture
      });
      Object.assign(uniforms, sizeUniforms, discard);
    }

    if (this.hasTargetTexture) {
      discard = false;
      parameters.viewport = [0, 0, framebuffer.width, framebuffer.height];
    }

    return Object.assign(opts, {attributes, framebuffer, uniforms, discard, parameters});
  }

  swap() {
    if (this._swapTexture) {
      this.currentIndex = (this.currentIndex + 1) % 2;
      return true;
    }
    return false;
  }

  // update source and/or feedbackBuffers
  update(opts = {}) {
    const {_sourceTextures = null, _targetTexture} = opts;
    if (_sourceTextures || _targetTexture) {
      const targetTexture = this.createTargetTexture({
        sourceTextures: _sourceTextures,
        // if targetTexture created using source texture, and that sourceTextuer
        // is updated we should update targetTexture
        textureOrReference: _targetTexture || this._targetRefTexName
      });
      this.updateBindings({sourceTextures: _sourceTextures, targetTexture});
    }
    this.updateElementIDBuffer(opts.elementCount);
  }

  // returns current target texture
  getTargetTexture() {
    const {targetTexture} = this.bindings[this.currentIndex].getResources();
    return targetTexture;
  }

  getData({varyingName = null, packed = false} = {}) {
    if (!varyingName || varyingName === this.targetTextureVarying) {
      const {framebuffer} = this.bindings[this.currentIndex].getResources();
      const pixels = readPixelsToArray(framebuffer);

      if (!packed) {
        return pixels;
      }

      // readPixels returns 4 elements for each pixel, pack the elements when requested
      const ArrayType = pixels.constructor;
      const channelCount = typeToChannelCount(this.targetTextureType);
      const packedPixels = new ArrayType((pixels.length * channelCount) / 4);
      let packCount = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        for (let j = 0; j < channelCount; j++) {
          packedPixels[packCount++] = pixels[i + j];
        }
      }
      return packedPixels;
    }

    return null;
  }

  // returns current framebuffer object that is being used.
  getFramebuffer() {
    const currentResources = this.bindings[this.currentIndex].getResources();
    return currentResources.framebuffer;
  }

  // Delete owned resources.
  delete() {
    const ownResources = [this.ownTexture, this.elementIDBuffer];
    for (const name in ownResources) {
      ownResources[name].delete();
    }
  }

  // Private

  initialize(props = {}) {
    const {_sourceTextures, _targetTexture, _targetTextureVarying, _swapTexture} = props;
    this._swapTexture = _swapTexture;
    this.targetTextureVarying = _targetTextureVarying;
    const targetTexture = this.createTargetTexture({
      sourceTextures: _sourceTextures,
      textureOrReference: _targetTexture
    });
    this.hasSourceTextures = _sourceTextures && Object.keys(_sourceTextures).length > 0;
    this.hasTargetTexture = _targetTextureVarying;
    this.updateElementIDBuffer(props.elementCount);
    this.updateBindings({sourceTextures: _sourceTextures, targetTexture});
    // TODO: setup this.varyings
  }

  // auto create target texture if requested
  createTargetTexture(props) {
    const {sourceTextures, textureOrReference} = props;
    if (textureOrReference instanceof Texture2D) {
      return textureOrReference;
    }
    // 'targetTexture' is a reference souce texture.
    const refTexture = sourceTextures[textureOrReference];
    if (!refTexture) {
      return null;
    }

    // save reference texture name, when corresponding source texture is updated
    // we also update target texture.
    this._targetRefTexName = textureOrReference;

    return this.createNewTexture(refTexture);
  }

  updateElementIDBuffer(elementCount) {
    if (typeof elementCount !== 'number' || this.elementCount >= elementCount) {
      return;
    }
    // NOTE: using float so this will work with GLSL 1.0 shaders.
    const elementIds = new Float32Array(elementCount);
    elementIds.forEach((_, index, array) => {
      array[index] = index;
    });
    if (!this.elementIDBuffer) {
      this.elementIDBuffer = new Buffer(this.gl, {
        data: elementIds,
        accessor: {size: 1}
      });
    } else {
      this.elementIDBuffer.setData({data: elementIds});
    }
    this.elementCount = elementCount;
  }

  updateBindings(opts) {
    this.bindings[this.currentIndex] = this.updateBinding(this.bindings[this.currentIndex], opts);
    if (this._swapTexture) {
      const {sourceTextures, targetTexture} = this.swapTextures(
        this.bindings[this.currentIndex].getResources()
      );
      const nextIndex = this.getNextIndex();
      this.bindings[nextIndex] = this.updateBinding(this.bindings[nextIndex], {
        sourceTextures,
        targetTexture
      });
    }
  }

  updateBinding(binding, opts) {
    if (!binding) {
      return new TextureTransformBinding(this.gl, opts);
    }
    binding.setProps(opts);
    return binding;
  }

  // set texture filtering parameters on source textures.
  setSourceTextureParameters() {
    const index = this.currentIndex;
    const {sourceTextures} = this.bindings[index].getResources();
    for (const name in sourceTextures) {
      sourceTextures[name].setParameters(SRC_TEX_PARAMETER_OVERRIDES);
    }
  }

  swapTextures(opts) {
    if (!this._swapTexture) {
      return null;
    }
    const sourceTextures = Object.assign({}, opts.sourceTextures);
    sourceTextures[this._swapTexture] = opts.targetTexture;

    const targetTexture = opts.sourceTextures[this._swapTexture];

    return {sourceTextures, targetTexture};
  }

  // Create a buffer and add to list of buffers to be deleted.
  createNewTexture(refTexture) {
    const texture = cloneTextureFrom(refTexture, {
      parameters: {
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
        [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
      },
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: false
      }
    });

    // thre can only be one target texture
    if (this.ownTexture) {
      this.ownTexture.delete();
    }
    this.ownTexture = texture;

    return texture;
  }

  getNextIndex() {
    return (this.currentIndex + 1) % 2;
  }

  // build and return shader releated parameters
  processVertexShader(props = {}) {
    const {sourceTextures, targetTexture} = this.bindings[this.currentIndex].getResources();
    const {vs, uniforms, targetTextureType, inject, samplerTextureMap} = updateForTextures({
      vs: props.vs,
      sourceTextureMap: sourceTextures,
      targetTextureVarying: this.targetTextureVarying,
      targetTexture
    });
    const combinedInject = combineInjects([props.inject || {}, inject]);
    this.targetTextureType = targetTextureType;
    this.samplerTextureMap = samplerTextureMap;
    const fs =
      props._fs ||
      getPassthroughFS({
        version: getShaderVersion(vs),
        input: this.targetTextureVarying,
        inputType: targetTextureType,
        output: FS_OUTPUT_VARIABLE
      });
    const modules =
      this.hasSourceTextures || this.targetTextureVarying
        ? [transformModule].concat(props.modules || [])
        : props.modules;
    return {vs, fs, modules, uniforms, inject: combinedInject, samplerTextureMap};
  }
}
