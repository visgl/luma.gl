import GL from '../constants';
import Model from './model';
import Buffer from '../webgl/buffer';
import Framebuffer from '../webgl/framebuffer';
import Texture2D from '../webgl/texture-2d';
import TransformFeedback from '../webgl/transform-feedback';
import {combineInjects} from '../shadertools/src/lib/inject-shader';
import {_transform as transform, getPassthroughFS, typeToChannelCount} from '../shadertools/src';
import {isWebGL2, assertWebGL2Context, getShaderVersion, cloneTextureFrom} from '../webgl-utils';
import assert from '../utils/assert';
import {log, isObjectEmpty} from '../utils';
import {updateForTextures, getSizeUniforms} from './transform-shader-utils';

// Texture parameters needed so sample can precisely pick pixel for given element id.
const SRC_TEX_PARAMETER_OVERRIDES = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
};
const FS_OUTPUT_VARIABLE = 'transform_output';

export default class Transform {
  static isSupported(gl) {
    // For now WebGL2 only
    return isWebGL2(gl);
  }

  constructor(gl, props = {}) {
    assertWebGL2Context(gl);

    this.gl = gl;
    this.model = null;
    this.elementCount = 0;
    this.currentIndex = 0;

    // Source and destination resources are stored in two element Arrays for easier swapping when
    // 'feedbackMap' is provided. If not only the first array elment is used.

    // Each array element is an object with attribute name as Key and Buffer object as value.
    this.sourceBuffers = new Array(2);

    // Each array element is an object with attribute name as Key and Texture object as value.
    this.sourceTextures = new Array(2);

    // Each array element is an object with varying name as Key and Buffer object as value.
    this.feedbackBuffers = new Array(2);

    // Each array element is a Texture object used as color attachment for framebuffer.
    this.targetTextures = new Array(2);

    // Each array element is a TransformFeedback object.
    this.transformFeedbacks = new Array(2);

    // Each array element is a Framebuffer object.
    this.framebuffers = new Array(2);
    this._createdBuffers = {};
    this.elementIDBuffer = null;

    // reference source texture name for target texture
    this._targetRefTexName = null;

    this._initialize(props);
    Object.seal(this);
  }

  // Delete owned resources.
  delete() {
    for (const name in this._createdBuffers) {
      this._createdBuffers[name].delete();
    }
    this.model.delete();
  }

  // Return Buffer object for given varying name.
  getBuffer(varyingName = null) {
    const bufferOrParams = varyingName
      ? this.feedbackBuffers[this.currentIndex][varyingName]
      : null;
    if (!bufferOrParams) {
      return null;
    }
    return bufferOrParams instanceof Buffer ? bufferOrParams : bufferOrParams.buffer;
  }

  // Returns the color attachment textuer from current framebuffer target
  _getTargetTexture() {
    if (this.framebuffers[this.currentIndex]) {
      return this.framebuffers[this.currentIndex].attachments[GL.COLOR_ATTACHMENT0];
    }
    return null;
  }

  // Return data either from Buffer or from Texture
  getData({varyingName = null, packed = false} = {}) {
    // Either there should be specified feedbackBuffer or we should be rendering to a texture
    const buffer = this.getBuffer(varyingName);
    if (buffer) {
      return buffer.getData();
    }

    // When varyingName is not provided return data from framebuffer object.
    assert(!varyingName || varyingName === this.targetTextureVarying);

    const pixels = this.framebuffers[this.currentIndex].readPixels();

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

  // returns current framebuffer object that is being used.
  getFramebuffer() {
    return this.framebuffers[this.currentIndex];
  }

  _getInputs() {
    const uniforms = {};
    const current = this.currentIndex;

    // Buffer inputs
    const attributes = Object.assign({}, this.sourceBuffers[current]);

    // Texture inputs
    if (this.hasSourceTextures || this.targetTextureVarying) {
      // TODO: add option not generate position using element id.
      attributes.transform_elementID = this.elementIDBuffer;
      for (const sampler in this.samplerTextureMap) {
        const textureName = this.samplerTextureMap[sampler];
        uniforms[sampler] = this.sourceTextures[current][textureName];
      }
      // Also update size uniforms , add samplerSizeMap
      this._setSourceTextureParameters();

      // get texture size uniforms
      const sizeUniforms = getSizeUniforms({
        sourceTextureMap: this.sourceTextures[current],
        targetTextureVarying: this.targetTextureVarying,
        targetTexture: this.targetTextures[current]
      });
      Object.assign(uniforms, sizeUniforms);
    }
    return {attributes, uniforms};
  }

  // Run one transform feedback loop.
  run(opts = {}) {
    const {attributes, uniforms} = this._getInputs();
    Object.assign(uniforms, opts.uniforms);
    const parameters = Object.assign({}, opts.parameters);
    const {clearRenderTarget = true} = opts;
    let framebuffer = null;
    let discard = true;

    if (this.renderingToTexture) {
      discard = false;
      framebuffer = this.framebuffers[this.currentIndex];
      assert(framebuffer);
      parameters.viewport = [0, 0, framebuffer.width, framebuffer.height];
      if (clearRenderTarget) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      }
    }
    this.model.setAttributes(attributes);
    this.model.transform(
      Object.assign({}, opts, {
        transformFeedback: this.transformFeedbacks[this.currentIndex],
        uniforms,
        discard,
        framebuffer,
        parameters
      })
    );
  }

  // Swap source and destination buffers and textures.
  swapBuffers() {
    log.deprecated('swapBuffers()', 'swap()');
    this.swap();
  }

  // Swap source and destination buffers and textures.
  swap() {
    assert(this.feedbackMap || this._swapTexture);
    this.currentIndex = (this.currentIndex + 1) % 2;
  }

  // Update some or all buffer bindings.
  update(opts = {}) {
    if (opts.elementCount) {
      this._setElementCount(opts.elementCount);
    }

    const {sourceBuffers = null, feedbackBuffers = null} = opts;
    const {currentIndex} = this;
    if (sourceBuffers || feedbackBuffers) {
      for (const bufferName in feedbackBuffers) {
        assert(
          feedbackBuffers[bufferName] instanceof Buffer ||
            feedbackBuffers[bufferName].buffer instanceof Buffer
        );
      }

      Object.assign(this.sourceBuffers[currentIndex], sourceBuffers);
      Object.assign(this.feedbackBuffers[currentIndex], feedbackBuffers);
      this._createFeedbackBuffers({feedbackBuffers});
      if (this.transformFeedbacks[currentIndex]) {
        this.transformFeedbacks[currentIndex].setBuffers(this.feedbackBuffers[currentIndex]);
      }

      // Buffers have changed, need to re-setup swap buffers.
      this._setupSwapBuffers();
    }

    const {_sourceTextures, _targetTexture} = opts;
    if (_sourceTextures || _targetTexture) {
      Object.assign(this.sourceTextures[currentIndex], _sourceTextures);
      // if _targetTexture specified use it, other wise rebuild traget texture using
      // '_targetRefTexName' as coresponding source texture may have been update.
      this._updateTargetTexture(_targetTexture || this._targetRefTexName, currentIndex);
      // textures have changed, need to re-setup swap textures.
      this._setupSwapTextures();
    }
  }

  // set texture filtering parameters on source textures.
  _setSourceTextureParameters() {
    const index = this.currentIndex;
    for (const name in this.sourceTextures[index]) {
      this.sourceTextures[index][name].setParameters(SRC_TEX_PARAMETER_OVERRIDES);
    }
  }

  // set element count and updated elementID buffer if needed.
  _setElementCount(elementCount) {
    if (this.elementCount === elementCount) {
      return;
    }
    if (this.elementCount < elementCount) {
      this._updateElementIDBuffer(elementCount);
    }
    this.model.setVertexCount(elementCount);
    this.elementCount = elementCount;
  }

  // sets target texture for rendering by updating framebuffer
  _updateTargetTexture(texture, index) {
    const targetTexture = this._buildTargetTexture(texture);
    if (targetTexture) {
      this.targetTextures[index] = targetTexture;
      if (this.framebuffers[index]) {
        // First update texture without re-sizing attachments
        this.framebuffers[index].update({
          attachments: {[GL.COLOR_ATTACHMENT0]: this.targetTextures[index]},
          resizeAttachments: false
        });
        // Resize to new taget texture size
        this.framebuffers[index].resize({
          width: targetTexture.width,
          height: targetTexture.height
        });
      }
    }
  }

  // Private

  _initialize(props = {}) {
    const {feedbackBuffers, feedbackMap} = this._validateProps(props);
    const {sourceBuffers, varyings, _targetTexture, _targetTextureVarying, _swapTexture} = props;

    let varyingsArray = varyings;
    if (feedbackMap && !Array.isArray(varyings)) {
      varyingsArray = Object.values(feedbackMap);
    }
    this.varyingsArray = varyingsArray;
    this.feedbackMap = feedbackMap;
    this._swapTexture = _swapTexture;
    if (_targetTexture) {
      this.targetTextureVarying = _targetTextureVarying;
      this.renderingToTexture = true;
      assert(this.targetTextureVarying);
    }

    this._setupBuffers({sourceBuffers, feedbackBuffers});
    this._setupTextures(props);
    this._setupSwapBuffers();
    this._setupSwapTextures();
    this._buildModel(
      Object.assign({}, props, {
        id: props.id || 'transform-model',
        drawMode: props.drawMode || GL.POINTS,
        varyings: varyingsArray
      })
    );
  }

  // assert on required parameters
  /* eslint-disable complexity */
  _validateProps(props) {
    let {feedbackBuffers, feedbackMap} = props;

    // backward compitability
    const {destinationBuffers, sourceDestinationMap} = props;
    if (destinationBuffers) {
      log.deprecated('destinationBuffers', 'feedbackBuffers')();
      feedbackBuffers = feedbackBuffers || destinationBuffers;
    }
    if (sourceDestinationMap) {
      log.deprecated('sourceDestinationMap', 'feedbackMap')();
      feedbackMap = feedbackMap || sourceDestinationMap;
    }

    // assert on required parameters
    const {vs, elementCount, varyings} = props;
    const {_sourceTextures, _targetTexture, _targetTextureVarying, _swapTexture} = props;

    assert(
      vs &&
        // destinations are provided
        (varyings || feedbackMap || _targetTexture) &&
        // when only writting to textures auto-duduce from texture dimenstions
        elementCount
    );

    for (const bufferName in feedbackBuffers || {}) {
      assert(
        feedbackBuffers[bufferName] instanceof Buffer ||
          feedbackBuffers[bufferName].buffer instanceof Buffer
      );
    }
    for (const textureName in _sourceTextures || {}) {
      assert(_sourceTextures[textureName] instanceof Texture2D);
    }

    // If rendering to texture , varying is provided
    assert(!_targetTexture || _targetTextureVarying);

    // swap texture must be a valid source texture
    assert(!_swapTexture || _sourceTextures[_swapTexture]);

    return {feedbackBuffers, feedbackMap};
  }
  /* eslint-enable complexity */

  // setup source and destination buffers
  _setupBuffers({sourceBuffers = null, feedbackBuffers = null}) {
    this.sourceBuffers[0] = Object.assign({}, sourceBuffers);
    this.feedbackBuffers[0] = Object.assign({}, feedbackBuffers);
    this._createFeedbackBuffers({feedbackBuffers});
    this.sourceBuffers[1] = {};
    this.feedbackBuffers[1] = {};
  }

  // setup source and destination textures
  _setupTextures(props = {}) {
    const {_sourceTextures, _targetTexture} = props;
    // Setup source texture
    this.sourceTextures[0] = Object.assign({}, _sourceTextures);
    this.sourceTextures[1] = {};
    this.hasSourceTextures = Object.keys(this.sourceTextures[0]).length > 0;

    if (this.targetTextureVarying) {
      const texture = this._buildTargetTexture(_targetTexture);
      // Either a texture or refAttribute must be provided
      assert(texture);
      this.targetTextures[0] = texture;
      this.targetTextures[1] = null;
    }
  }

  // Builds target texture using source reference or provided texture object.
  _buildTargetTexture(textureOrAttribute) {
    if (textureOrAttribute instanceof Texture2D) {
      return textureOrAttribute;
    }
    const refTexture = this.sourceTextures[0][textureOrAttribute];
    if (!refTexture) {
      return null;
    }
    // save reference texture name, when corresponding source texture is updated
    // we also update target texture.
    this._targetRefTexName = textureOrAttribute;
    return cloneTextureFrom(refTexture, {
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
  }

  // auto create any feedback buffers
  _createFeedbackBuffers({feedbackBuffers}) {
    if (!this.feedbackMap) {
      // feedbackMap required to auto create buffers.
      return;
    }
    const current = this.currentIndex;
    for (const sourceBufferName in this.feedbackMap) {
      const feedbackBufferName = this.feedbackMap[sourceBufferName];
      if (
        feedbackBufferName !== this.targetTextureVarying &&
        (!feedbackBuffers || !feedbackBuffers[feedbackBufferName])
      ) {
        // Create new buffer with same layout and settings as source buffer
        const sourceBuffer = this.sourceBuffers[current][sourceBufferName];
        const {bytes, type, usage, accessor} = sourceBuffer;
        const buffer = new Buffer(this.gl, {bytes, type, usage, accessor});

        if (this._createdBuffers[feedbackBufferName]) {
          this._createdBuffers[feedbackBufferName].delete();
        }
        this._createdBuffers[feedbackBufferName] = buffer;
        this.feedbackBuffers[current][feedbackBufferName] = buffer;
      }
    }
  }

  // Create a buffer and add to list of buffers to be deleted.
  _createNewBuffer(name, opts) {
    const buffer = new Buffer(this.gl, opts);
    if (this._createdBuffers[name]) {
      this._createdBuffers[name].delete();
      this._createdBuffers[name] = buffer;
    }
    return buffer;
  }

  // setup buffers for swapping.
  // Second set of source and feedback objects are setup to point
  // to corresponding feedback and source buffers.
  _setupSwapBuffers() {
    if (!this.feedbackMap) {
      // feedbackMap required set up swap buffers.
      return;
    }
    const current = this.currentIndex;
    const next = (current + 1) % 2;

    // Copy all buffers/textures so un-mapped sources will remain same
    Object.assign(this.sourceBuffers[next], this.sourceBuffers[current]);
    Object.assign(this.feedbackBuffers[next], this.feedbackBuffers[current]);

    for (const srcName in this.feedbackMap) {
      const dstName = this.feedbackMap[srcName];
      // TODO: add textureMap and remove this if loop
      if (dstName !== this.targetTextureVarying) {
        this.sourceBuffers[next][srcName] = this.feedbackBuffers[current][dstName];
        this.feedbackBuffers[next][dstName] = this.sourceBuffers[current][srcName];

        // make sure the new destination buffer is a Buffer object
        assert(this.feedbackBuffers[next][dstName] instanceof Buffer);
      }
    }

    // When triggered by `update()` TranformFeedback objects are already set up,
    // if so update buffers
    if (this.transformFeedbacks[next]) {
      this.transformFeedbacks[next].setBuffers(this.feedbackBuffers[next]);
    }

    // TODO: add swap support for targetTexture and framebuffers
  }

  // setup textures for swapping.
  _setupSwapTextures() {
    if (!this._swapTexture || !this.targetTextureVarying) {
      // Must be rendering to a texture and _swapTexture is provided
      return;
    }
    const current = this.currentIndex;
    const next = (current + 1) % 2;

    Object.assign(this.sourceTextures[next], this.sourceTextures[current]);

    this.sourceTextures[next][this._swapTexture] = this.targetTextures[current];

    this._updateTargetTexture(this.sourceTextures[current][this._swapTexture], next);
  }

  // build Model and TransformFeedback objects
  _buildModel(props = {}) {
    const {vs, fs, modules, uniforms, inject, samplerTextureMap} = this._getShaders(props);
    this.model = new Model(
      this.gl,
      Object.assign({}, props, {
        vs,
        fs,
        vertexCount: props.elementCount,
        modules,
        uniforms,
        inject
      })
    );
    this.samplerTextureMap = samplerTextureMap;

    // setup TF to capture varyings.
    this._setupTransformFeedback();

    // setup Framebuffer object for rendering to Texture.
    this._setupFramebuffers();

    // create buffer to access source texture pixesl.
    this._setElementCount(props.elementCount);
  }

  // setup TransformFeedback objects to capture the results
  _setupTransformFeedback() {
    if (isObjectEmpty(this.feedbackBuffers[0])) {
      return;
    }
    this.transformFeedbacks[0] = new TransformFeedback(this.gl, {
      program: this.model.program,
      buffers: this.feedbackBuffers[0]
    });

    // If buffers are swappable setup second transform feedback object.
    if (this.feedbackMap) {
      this.transformFeedbacks[1] = new TransformFeedback(this.gl, {
        program: this.model.program,
        buffers: this.feedbackBuffers[1]
      });
    }
  }

  // setup framebuffers with texture attachments, to which results are rendered
  _setupFramebuffers() {
    if (!this.renderingToTexture) {
      return;
    }

    let {width, height} = this.targetTextures[0];
    this.framebuffers[0] = new Framebuffer(this.gl, {
      id: `${this.id || 'transform'}-framebuffer-0`,
      width,
      height,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: this.targetTextures[0]
      }
    });

    if (this._swapTexture) {
      ({width, height} = this.targetTextures[1]);

      this.framebuffers[1] = new Framebuffer(this.gl, {
        id: `${this.id || 'transform'}-framebuffer-1`,
        width,
        height,
        attachments: {
          [GL.COLOR_ATTACHMENT0]: this.targetTextures[1]
        }
      });
    }
  }

  // create/update buffer to access source texture's individual pixels.
  _updateElementIDBuffer(elementCount) {
    if (!this.hasSourceTextures && !this.targetTextureVarying) {
      return;
    }
    // NOTE: using float so this will work with GLSL 1.0 shaders.
    const elementIds = new Float32Array(elementCount);
    elementIds.forEach((_, index, array) => {
      array[index] = index;
    });
    if (!this.elementIDBuffer) {
      this.elementIDBuffer = new Buffer(this.gl, {data: elementIds, size: 1});
    } else {
      this.elementIDBuffer.setData({data: elementIds});
    }
  }

  // build and return shader releated parameters
  _getShaders(props = {}) {
    const {vs, uniforms, targetTextureType, inject, samplerTextureMap} = this._processVertexShader(
      props.vs
    );
    const combinedInject = combineInjects([props.inject || {}, inject]);
    this.targetTextureType = targetTextureType;
    const fs = getPassthroughFS({
      version: getShaderVersion(vs),
      input: this.targetTextureVarying,
      inputType: targetTextureType,
      output: FS_OUTPUT_VARIABLE
    });
    const modules =
      this.hasSourceTextures || this.targetTextureVarying
        ? [transform].concat(props.modules || [])
        : props.modules;
    return {vs, fs, modules, uniforms, inject: combinedInject, samplerTextureMap};
  }

  // scan and update vertex shader for texture atrributes.
  _processVertexShader(vs) {
    return updateForTextures({
      vs,
      sourceTextureMap: this.sourceTextures[this.currentIndex],
      targetTextureVarying: this.targetTextureVarying,
      targetTexture: this.targetTextures[this.currentIndex]
    });
  }
}
