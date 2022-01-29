// luma.gl, MIT license

import {GL} from '@luma.gl/constants';
import {Device, Framebuffer} from '@luma.gl/core';

import {
  getShaderInfo,
  getPassthroughFS,
  typeToChannelCount,
  combineInjects,
  _transform as transformModule
} from '@luma.gl/shadertools';

import {Device, Texture, Framebuffer} from '@luma.gl/api';
import {ClassicBuffer as Buffer} from '@luma.gl/webgl';
import {readPixelsToArray} from '@luma.gl/webgl';
import {cloneTextureFrom} from '../webgl-utils/texture-utils';

import type {TransformProps, TransformDrawOptions} from './transform';
import {updateForTextures, getSizeUniforms} from './transform-shader-utils';

// TODO: move these constants to transform-shader-utils
// Texture parameters needed so sample can precisely pick pixel for given element id.
const SRC_TEX_PARAMETER_OVERRIDES = {
  magFilter: 'nearest',
  minFilter: 'nearest',
  wrapS: 'clamp_to_edge',
  wrapT: 'clamp_to_edge'
};

const FS_OUTPUT_VARIABLE = 'transform_output';

type TextureBinding = {
  sourceBuffers: Record<string, Buffer>;
  sourceTextures: Record<string, Texture>;
  targetTexture: Texture;
  framebuffer?: Framebuffer;
};

export default class TextureTransform {
  device: Device;
  gl: WebGL2RenderingContext;
  id = 0;
  currentIndex = 0;
  _swapTexture: string | null = null;
  targetTextureVarying: string | null = null;
  targetTextureType: string | null = null;
  samplerTextureMap: Record<string, any> | null = null;
  bindings: TextureBinding[] = []; // each element is an object : {sourceTextures, targetTexture, framebuffer}
  resources: Record<string, any> = {}; // resources to be deleted

  hasTargetTexture: boolean = false;
  hasSourceTextures: boolean = false;
  ownTexture: Texture | null = null;
  elementIDBuffer: Buffer | null = null;
  _targetRefTexName: string;
  elementCount: number;

  constructor(device: Device, props: TransformProps = {}) {
    this.device = device;
    this.gl = (device as any).gl2 as WebGL2RenderingContext;
    this._initialize(props);
    Object.seal(this);
  }

  // Delete owned resources.
  destroy() {
    if (this.ownTexture) {
      this.ownTexture.destroy();
    }
    if (this.elementIDBuffer) {
      this.elementIDBuffer.destroy();
    }
  }

  /** @deprecated Use .destroy() */
  delete(): void {
    this.destroy();
  }

  updateModelProps(props: TransformProps = {}) {
    const updatedModelProps = this._processVertexShader(props);
    return Object.assign({}, props, updatedModelProps);
  }

  getDrawOptions(opts: TransformProps = {}): TransformDrawOptions {
    const {sourceBuffers, sourceTextures, framebuffer, targetTexture} =
      this.bindings[this.currentIndex];

    const attributes = Object.assign({}, sourceBuffers, opts.attributes);
    const uniforms = Object.assign({}, opts.uniforms);
    const parameters = Object.assign({}, opts.parameters);
    let discard = opts.discard;

    if (this.hasSourceTextures || this.hasTargetTexture) {
      // eslint-disable-next-line camelcase
      attributes.transform_elementID = this.elementIDBuffer;

      for (const sampler in this.samplerTextureMap) {
        const textureName = this.samplerTextureMap[sampler];
        uniforms[sampler] = sourceTextures[textureName];
      }
      this._setSourceTextureParameters();
      // get texture size uniforms
      const sizeUniforms = getSizeUniforms({
        sourceTextureMap: sourceTextures,
        targetTextureVarying: this.targetTextureVarying,
        targetTexture
      });
      Object.assign(uniforms, sizeUniforms);
    }
    if (this.hasTargetTexture) {
      discard = false;
      parameters.viewport = [0, 0, framebuffer.width, framebuffer.height];
    }

    return {attributes, framebuffer, uniforms, discard, parameters};
  }

  swap() {
    if (this._swapTexture) {
      this.currentIndex = this._getNextIndex();
      return true;
    }
    return false;
  }

  // update source and/or feedbackBuffers
  update(opts = {}) {
    this._setupTextures(opts);
  }

  // returns current target texture
  getTargetTexture() {
    const {targetTexture} = this.bindings[this.currentIndex];
    return targetTexture;
  }

  getData({packed = false} = {}) {
    const {framebuffer} = this.bindings[this.currentIndex];
    const pixels = readPixelsToArray(framebuffer);

    if (!packed) {
      return pixels;
    }

    // readPixels returns 4 elements for each pixel, pack the elements when requested
    const ArrayType = pixels.constructor;
    const channelCount = typeToChannelCount(this.targetTextureType);
    // @ts-expect-error
    const packedPixels = new ArrayType((pixels.length * channelCount) / 4);
    let packCount = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      for (let j = 0; j < channelCount; j++) {
        packedPixels[packCount++] = pixels[i + j];
      }
    }
    return packedPixels;
  }

  // returns current framebuffer object that is being used.
  getFramebuffer() {
    const currentResources = this.bindings[this.currentIndex];
    return currentResources.framebuffer;
  }

  // Private

  _initialize(props: TransformProps = {}): void {
    const {_targetTextureVarying, _swapTexture} = props;
    this._swapTexture = _swapTexture;
    this.targetTextureVarying = _targetTextureVarying;
    this.hasTargetTexture = Boolean(_targetTextureVarying);
    this._setupTextures(props);
  }

  // auto create target texture if requested
  _createTargetTexture(props: {
    sourceTextures: Record<string, Texture>;
    textureOrReference: string | Texture;
  }): Texture {
    const {sourceTextures, textureOrReference} = props;
    if (textureOrReference instanceof Texture) {
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

    return this._createNewTexture(refTexture);
  }

  _setupTextures(props: TransformProps = {}) {
    const {sourceBuffers, _sourceTextures = {}, _targetTexture} = props;
    const targetTexture = this._createTargetTexture({
      sourceTextures: _sourceTextures,
      textureOrReference: _targetTexture
    });
    this.hasSourceTextures =
      this.hasSourceTextures || (_sourceTextures && Object.keys(_sourceTextures).length > 0);
    this._updateBindings({sourceBuffers, sourceTextures: _sourceTextures, targetTexture});
    if ('elementCount' in props) {
      this._updateElementIDBuffer(props.elementCount);
    }
  }

  _updateElementIDBuffer(elementCount: number): void {
    if (typeof elementCount !== 'number' || this.elementCount >= elementCount) {
      return;
    }
    // NOTE: using float so this will work with GLSL 1.0 shaders.
    const elementIds = new Float32Array(elementCount);
    elementIds.forEach((_, index, array) => {
      array[index] = index;
    });
    if (!this.elementIDBuffer) {
      this.elementIDBuffer = this.device.createBuffer({
        data: elementIds,
        accessor: {size: 1}
      });
    } else {
      this.elementIDBuffer.setData({data: elementIds});
    }
    this.elementCount = elementCount;
  }

  _updateBindings(opts: {
    sourceBuffers: Record<string, Buffer>;
    sourceTextures: Record<string, Texture>;
    targetTexture: Texture;
  }) {
    this.bindings[this.currentIndex] = this._updateBinding(this.bindings[this.currentIndex], opts);
    if (this._swapTexture) {
      const {sourceTextures, targetTexture} = this._swapTextures(this.bindings[this.currentIndex]);
      const nextIndex = this._getNextIndex();
      this.bindings[nextIndex] = this._updateBinding(this.bindings[nextIndex], {
        sourceTextures,
        targetTexture
      });
    }
  }

  _updateBinding(
    binding: TextureBinding,
    opts: {
      sourceBuffers?: Record<string, Buffer>;
      sourceTextures: Record<string, Texture>;
      targetTexture: Texture;
    }
  ): TextureBinding {
    const {sourceBuffers, sourceTextures, targetTexture} = opts;
    if (!binding) {
      binding = {
        sourceBuffers: {},
        sourceTextures: {},
        targetTexture: null
      };
    }
    Object.assign(binding.sourceTextures, sourceTextures);
    Object.assign(binding.sourceBuffers, sourceBuffers);
    if (targetTexture) {
      binding.targetTexture = targetTexture;

      const {width, height} = targetTexture;
<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/src/transform/texture-transform.ts
      if (binding.framebuffer) {
        binding.framebuffer.destroy();
========
      const {framebuffer} = binding;
      if (framebuffer) {
        // First update texture without re-sizing attachments
        framebuffer.update({
          attachments: {[GL.COLOR_ATTACHMENT0]: targetTexture},
          resizeAttachments: false
        });
        // Resize to new taget texture size
        framebuffer.resize({width, height});
      } else {
        binding.framebuffer = this.device.createFramebuffer({
          id: 'transform-framebuffer',
          width,
          height,
          attachments: {
            [GL.COLOR_ATTACHMENT0]: targetTexture
          }
        });
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/src/transform/texture-transform.ts
      }
      binding.framebuffer = this.device.createFramebuffer({
        id: 'transform-framebuffer',
        width,
        height,
        colorAttachments: [targetTexture]
      });
      binding.framebuffer.resize({width, height});
    }
    return binding;
  }

  // set texture filtering parameters on source textures.
  _setSourceTextureParameters(): void {
    const index = this.currentIndex;
    const {sourceTextures} = this.bindings[index];
    for (const name in sourceTextures) {
      sourceTextures[name].setParameters(SRC_TEX_PARAMETER_OVERRIDES);
    }
  }

<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/src/transform/texture-transform.ts
  _swapTextures(opts: {
    sourceTextures: Record<string, Texture2D>;
    targetTexture: Texture2D;
  }): {sourceTextures: Record<string, Texture2D>; targetTexture: Texture2D} | null {
========
  _swapTextures(
    opts: {sourceTextures: Record<string, Texture>; targetTexture: Texture}
  ): {sourceTextures: Record<string, Texture>; targetTexture: Texture} | null {
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/src/transform/texture-transform.ts
    if (!this._swapTexture) {
      return null;
    }
    const sourceTextures = Object.assign({}, opts.sourceTextures);
    sourceTextures[this._swapTexture] = opts.targetTexture;

    const targetTexture = opts.sourceTextures[this._swapTexture];

    return {sourceTextures, targetTexture};
  }

  // Create a buffer and add to list of buffers to be deleted.
  _createNewTexture(refTexture: Texture) {
    const texture = cloneTextureFrom(refTexture, {
      sampler: SRC_TEX_PARAMETER_OVERRIDES
      // pixelStore: {
      //   [GL.UNPACK_FLIP_Y_WEBGL]: false
      // }
    });

    // thre can only be one target texture
    if (this.ownTexture) {
      this.ownTexture.destroy();
    }
    this.ownTexture = texture;

    return texture;
  }

  _getNextIndex() {
    return (this.currentIndex + 1) % 2;
  }

  // build and return shader releated parameters
  _processVertexShader(props: TransformProps = {}) {
    const {sourceTextures, targetTexture} = this.bindings[this.currentIndex];
    // @ts-expect-error TODO - uniforms is not present
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
        version: getShaderInfo(vs).version,
        input: this.targetTextureVarying,
        inputType: targetTextureType,
        output: FS_OUTPUT_VARIABLE
      });
    const modules =
      this.hasSourceTextures || this.targetTextureVarying
        ? // @ts-expect-error
          [transformModule].concat(props.modules || [])
        : props.modules;
    return {vs, fs, modules, uniforms, inject: combinedInject};
  }
}
