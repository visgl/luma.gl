import GL from '../constants';
import Model from './model';
import Buffer from '../webgl/buffer';
import Texture2D from '../webgl/texture-2d';
import TransformFeedback from '../webgl/transform-feedback';
import {_transform as transform} from '../shadertools/src';
import {isWebGL2, assertWebGL2Context, getShaderVersion} from '../webgl-utils';
import assert from '../utils/assert';
import {log} from '../utils';

const FS100 = 'void main() {}';
const FS300 = `#version 300 es\n${FS100}`;
const REGEX_START_OF_MAIN = /main\s*\([^\)]*\)\s*\{\n?/; // Beginning of main

// Texture parameters needed so sample can precisely pick pixel for given element id.
const SRC_TEX_PARAMETER_OVERRIDES = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
};

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
    this.sourceBuffers = new Array(2);
    this.sourceTextures = new Array(2);
    this.feedbackBuffers = new Array(2);
    this.transformFeedbacks = new Array(2);
    this._buffersCreated = {};
    this.elementIDBuffer = null;

    this._initialize(props);
    Object.seal(this);
  }

  // Delete owned resources.
  delete() {
    for (const name in this._buffersCreated) {
      this._buffersCreated[name].delete();
    }
    this.model.delete();
  }

  // Return Buffer object for given varying name.
  getBuffer(varyingName = null) {
    assert(varyingName && this.feedbackBuffers[this.currentIndex][varyingName]);
    return this.feedbackBuffers[this.currentIndex][varyingName];
  }

  // Run one transform feedback loop.
  /* eslint-disable camelcase */
  run({uniforms = {}, unbindModels = []} = {}) {
    const attributes = Object.assign({}, this.sourceBuffers[this.currentIndex]);
    if (this.hasSourceTextures) {
      Object.assign(attributes, {
        transform_elementID: this.elementIDBuffer
      });
      this._setSourceTextureParameters();
    }
    this.model.setAttributes(attributes);
    this.model.transform({
      transformFeedback: this.transformFeedbacks[this.currentIndex],
      unbindModels
    });
  }
  /* eslint-enable camelcase */

  // Swap source and destination buffers.
  swapBuffers() {
    assert(this.feedbackMap);
    this.currentIndex = (this.currentIndex + 1) % 2;
  }

  // Update some or all buffer bindings.
  update({sourceBuffers = null, feedbackBuffers = null, elementCount = this.elementCount}) {
    if (!sourceBuffers && !feedbackBuffers) {
      log.warn('Transform : no buffers updated')();
      return this;
    }

    this._setElementCount(elementCount);

    for (const bufferName in feedbackBuffers) {
      assert(feedbackBuffers[bufferName] instanceof Buffer);
    }

    const {currentIndex} = this;
    Object.assign(this.sourceBuffers[currentIndex], sourceBuffers);
    Object.assign(this.feedbackBuffers[currentIndex], feedbackBuffers);
    this._createFeedbackBuffers({feedbackBuffers});
    this.transformFeedbacks[currentIndex].setBuffers(this.feedbackBuffers[currentIndex]);

    // Buffers have changed, need to re-setup swap buffers.
    this._setupSwapBuffers();
    return this;
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
      this._createElementIDBuffer(elementCount);
    }
    this.model.setVertexCount(elementCount);
    this.elementCount = elementCount;
  }

  // Private

  _initialize(props = {}) {
    const {feedbackBuffers, feedbackMap} = this._validateProps(props);

    const {sourceBuffers, varyings} = props;
    // If varyings are not provided feedbackMap must be provided to deduce varyings
    assert(Array.isArray(varyings) || feedbackMap);
    let varyingsArray = varyings;
    if (!Array.isArray(varyings)) {
      varyingsArray = Object.values(feedbackMap);
    }
    this.varyingsArray = varyingsArray;
    this.feedbackMap = feedbackMap;

    this._setupBuffers({sourceBuffers, feedbackBuffers});
    this._setupTextures(props);
    this._setupSwapBuffers();
    this._buildModel(Object.assign({}, props, {
      id: props.id || 'transform-model',
      drawMode: props.drawMode || GL.POINTS,
      varyings: varyingsArray
    }));
  }

  // assert on required parameters
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
    const {sourceBuffers, vs, elementCount} = props;
    assert(sourceBuffers && vs && elementCount >= 0);
    // If feedbackBuffers are not provided, sourceDestinationMap must be provided
    // to create destinaitonBuffers with layout of corresponding source buffer.
    assert(feedbackBuffers || feedbackMap, ' Transform needs feedbackBuffers or feedbackMap');
    for (const bufferName in feedbackBuffers || {}) {
      assert(feedbackBuffers[bufferName] instanceof Buffer);
    }
    const {_sourceTextures} = props;
    for (const textureName in _sourceTextures || {}) {
      assert(_sourceTextures[textureName] instanceof Texture2D);
    }

    return {feedbackBuffers, feedbackMap};
  }
  // setup source and destination buffers
  _setupBuffers({sourceBuffers = null, feedbackBuffers = null}) {
    this.sourceBuffers[0] = Object.assign({}, sourceBuffers);
    this.feedbackBuffers[0] = Object.assign({}, feedbackBuffers);
    this._createFeedbackBuffers({feedbackBuffers});
    this.sourceBuffers[1] = {};
    this.feedbackBuffers[1] = {};
  }

  // setup source textures
  _setupTextures(props = {}) {
    const {_sourceTextures} = props;
    this.sourceTextures[0] = Object.assign({}, _sourceTextures);
    this.sourceTextures[1] = {};
    this.hasSourceTextures = Object.keys(this.sourceTextures[0]).length > 0;
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
      if (!feedbackBuffers || !feedbackBuffers[feedbackBufferName]) {
        // Create new buffer with same layout and settings as source buffer
        const sourceBuffer = this.sourceBuffers[current][sourceBufferName];
        const {bytes, type, usage, accessor} = sourceBuffer;
        const buffer = new Buffer(this.gl, {bytes, type, usage, accessor});

        if (this._buffersCreated[feedbackBufferName]) {
          this._buffersCreated[feedbackBufferName].delete();
        }
        this._buffersCreated[feedbackBufferName] = buffer;
        this.feedbackBuffers[current][feedbackBufferName] = buffer;
      }
    }
  }

  // Create a buffer and add to list of buffers to be deleted.
  _createNewBuffer(name, opts) {
    const buffer = new Buffer(this.gl, opts);
    if (this._buffersCreated[name]) {
      this._buffersCreated[name].delete();
      this._buffersCreated[name] = buffer;
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
    Object.assign(this.sourceTextures[next], this.sourceTextures[current]);

    for (const srcName in this.feedbackMap) {
      const dstName = this.feedbackMap[srcName];

      this.sourceBuffers[next][srcName] =
        this.feedbackBuffers[current][dstName];
      this.feedbackBuffers[next][dstName] =
        this.sourceBuffers[current][srcName];

      // make sure the new destination buffer is a Buffer object
      assert(this.feedbackBuffers[next][dstName] instanceof Buffer);
    }

    // When triggered by `update()` TranformFeedback objects are already set up,
    // if so update buffers
    if (this.transformFeedbacks[next]) {
      this.transformFeedbacks[next].setBuffers(this.feedbackBuffers[next]);
    }
  }

  // build Model and TransformFeedback objects
  _buildModel(props = {}) {

    const {vs, fs, modules, uniforms} = this._getShaders(props);
    this.model = new Model(this.gl, Object.assign({}, props, {
      vs,
      fs,
      vertexCount: props.elementCount,
      modules,
      uniforms
    }));

    // setup TF to capture varyings.
    this._setupTransformFeedback();

    // create buffer to access source texture pixesl.
    this._setElementCount(props.elementCount);

  }

  // setup TransformFeedback objects to capture the results
  _setupTransformFeedback() {
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

  // create buffer to access source texture's individual pixels.
  _createElementIDBuffer(elementCount) {
    if (!this.hasSourceTextures) {
      return;
    }
    if (this.elementIDBuffer) {
      this.elementIDBuffer.delete();
    }
    // TODO: can attribute be a uint
    const elementIds = new Float32Array(elementCount);
    elementIds.forEach((_, index, array) => {
      array[index] = index;
    });
    this.elementIDBuffer = new Buffer(this.gl, {data: elementIds, size: 1});
  }

  // build and return shader releated parameters
  _getShaders(props = {}) {
    const {vs, uniforms} = this._processVertexShader(props.vs);
    const fs = getShaderVersion(vs) === 300 ? FS300 : FS100;
    const modules = this.hasSourceTextures ?
      [transform].concat(props.modules || []) : props.modules;
    return {vs, fs, modules, uniforms};
  }

  // scan and update vertex shader for texture atrributes.
  _processVertexShader(vs) {
    const uniforms = {};
    if (!this.hasSourceTextures) {
      return {vs, uniforms};
    }
    let updatedVs = vs;
    let mainInstructions = null;
    const texAttributeNames = Object.keys(this.sourceTextures[this.currentIndex]);
    if (texAttributeNames.length > 0) {
      const vsLines = updatedVs.split('\n');
      const updateVsLines = vsLines.slice();
      const defNameMap = texAttributeNames.reduce((result, name) => {
        const def = `${name};`;
        result[def] = name;
        return result;
      }, {});
      const sampleInstructions = [];
      vsLines.forEach((line, index, lines) => {
        const updated = this._processTextureAttributes(line, defNameMap);
        if (updated) {
          const {updatedLine, sampleInstruction, samplerUniforms} = updated;
          updateVsLines[index] = updatedLine;
          sampleInstructions.push(sampleInstruction);
          Object.assign(uniforms, samplerUniforms);
        }
      });
      updatedVs = updateVsLines.join('\n');
      mainInstructions = mainInstructions ?
        mainInstructions + sampleInstructions : sampleInstructions;
    }

    if (mainInstructions) {
      updatedVs = updatedVs.replace(REGEX_START_OF_MAIN, match => match + mainInstructions);
    }

    return {vs: updatedVs, uniforms};
  }

  // build required definitions, sample instructions and uniforms for each texture attribute
  _processTextureAttributes(line, defNameMap) {
    const samplerUniforms = {};
    const words = line.replace(/^\s+/, '').split(/\s+/);
    const [qualifier, size, definition] = words;
    if (
      (qualifier !== 'attribute' && qualifier !== 'in') ||
      !size ||
      !definition
    ) {
      return null;
    }
    // check if a texture source is specified for this attribute
    const name = defNameMap[definition];
    if (name) {
      assert(this.sourceTextures[0][name]);
      const updatedLine = `\
uniform sampler2D transform_uSampler_${definition} \// ${line}
uniform vec2 transform_uSize_${definition}`;
      const channels = sizeToChannels(size);
      const sampler = `transform_uSampler_${name}`;
      const texSize = `transform_uSize_${name}`;
      const sampleInstruction =
        `  ${size} ${name} = transform_getInput(${sampler}, ${texSize}).${channels};\n`;

      const samplerName = `transform_uSampler_${name}`;
      const sizeName = `transform_uSize_${name}`;
      const {width, height} = this.sourceTextures[this.currentIndex][name];
      samplerUniforms[samplerName] = this.sourceTextures[this.currentIndex][name];
      samplerUniforms[sizeName] = [width, height];

      return {updatedLine, sampleInstruction, samplerUniforms};
    }
    return null;
  }
}

// Utility methods

function sizeToChannels(size) {
  switch (size) {
  case 'float': return 'x';
  case 'vec2': return 'xy';
  case 'vec3': return 'xyz';
  case 'vec4': return 'xyzw';
  default :
    assert(false);
    return null;
  }
}
