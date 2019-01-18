/* eslint-disable no-inline-comments */
import GL from '../constants';
import Resource from './resource';
import Texture from './texture';
import Framebuffer from './framebuffer';
import {parseUniformName, getUniformSetter} from './uniforms';
import {VertexShader, FragmentShader} from './shader';
import ProgramConfiguration from './program-configuration';
import {withParameters} from '../webgl-context/context-state';
import {checkUniformValues, areUniformsEqual, getUniformCopy} from '../webgl/uniforms';
import {assertWebGL2Context, isWebGL2} from '../webgl-utils';
import {getPrimitiveDrawMode} from '../webgl-utils/attribute-utils';
import {getKey} from '../webgl-utils/constants-to-keys';
import {log, uid} from '../utils';
import assert from '../utils/assert';

const LOG_PROGRAM_PERF_PRIORITY = 4;

// const GL_INTERLEAVED_ATTRIBS = 0x8C8C;
const GL_SEPARATE_ATTRIBS = 0x8c8d;

export default class Program extends Resource {
  constructor(gl, opts = {}) {
    super(gl, opts);

    this.stubRemovedMethods('Program', 'v6.0', [
      'setVertexArray',
      'setAttributes',
      'setBuffers',
      'unsetBuffers',

      'use',
      'getUniformCount',
      'getUniformInfo',
      'getUniformLocation',
      'getUniformValue',

      'getVarying',
      'getFragDataLocation',
      'getAttachedShaders',
      'getAttributeCount',
      'getAttributeLocation',
      'getAttributeInfo'
    ]);

    // Experimental flag to avoid deleting Program object while it is cached
    this._isCached = false;

    this.initialize(opts);

    Object.seal(this);

    this._setId(opts.id);
  }

  initialize(props = {}) {
    const {vs, fs, varyings, bufferMode = GL_SEPARATE_ATTRIBS} = props;
    // Create shaders if needed
    this.vs =
      typeof vs === 'string' ? new VertexShader(this.gl, {id: `${props.id}-vs`, source: vs}) : vs;
    this.fs =
      typeof fs === 'string' ? new FragmentShader(this.gl, {id: `${props.id}-fs`, source: fs}) : fs;
    assert(this.vs instanceof VertexShader);
    assert(this.fs instanceof FragmentShader);

    // uniforms
    this.uniforms = {};
    this.samplers = {};

    // Setup varyings if supplied
    if (varyings) {
      assertWebGL2Context(this.gl);
      this.varyings = varyings;
      this.gl.transformFeedbackVaryings(this.handle, varyings, bufferMode);
    }

    this._compileAndLink();
    this._readUniformLocationsFromLinkedProgram();
    this.configuration = new ProgramConfiguration(this);

    return this.setProps(props);
  }

  delete(opts = {}) {
    if (this._isCached) {
      // This object is cached, do not delete
      return this;
    }
    return super.delete(opts);
  }

  setProps(props) {
    if ('uniforms' in props) {
      this.setUniforms(props.uniforms, props.samplers);
    }
    return this;
  }

  // Another thing about the WebGL API is that there are so many ways to draw things.
  // This function unifies those ways into a single call using common parameters with sane defaults
  draw({
    logPriority,

    drawMode = GL.TRIANGLES,
    vertexCount,
    offset = 0,
    start,
    end,
    isIndexed = false,
    indexType = GL.UNSIGNED_SHORT,
    isInstanced = false,
    instanceCount = 0,

    vertexArray = null,
    transformFeedback,
    framebuffer,
    parameters = {},

    // Deprecated
    uniforms = {},
    samplers = {}
  }) {
    if (logPriority !== undefined) {
      const fb = framebuffer ? framebuffer.id : 'default';
      const message =
        `mode=${getKey(this.gl, drawMode)} verts=${vertexCount} ` +
        `instances=${instanceCount} indexType=${getKey(this.gl, indexType)} ` +
        `isInstanced=${isInstanced} isIndexed=${isIndexed} ` +
        `Framebuffer=${fb}`;
      log.log(logPriority, message)();
    }

    this.gl.useProgram(this.handle);

    // TODO - move vertex array binding and transform feedback binding to withParameters?
    assert(vertexArray);

    vertexArray.bindForDraw(vertexCount, instanceCount, () => {
      if (uniforms) {
        log.deprecated('Program.draw({uniforms})', 'Program.setUniforms(uniforms)');
        this.setUniforms(uniforms, samplers);
      }

      this._bindTextures();

      if (framebuffer !== undefined) {
        parameters = Object.assign({}, parameters, {framebuffer});
      }

      if (transformFeedback) {
        const primitiveMode = getPrimitiveDrawMode(drawMode);
        transformFeedback.begin(primitiveMode);
      }

      withParameters(this.gl, parameters, () => {
        // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
        if (isIndexed && isInstanced) {
          this.gl.drawElementsInstanced(drawMode, vertexCount, indexType, offset, instanceCount);
        } else if (isIndexed && isWebGL2(this.gl) && !isNaN(start) && !isNaN(end)) {
          this.gl.drawRangeElements(drawMode, start, end, vertexCount, indexType, offset);
        } else if (isIndexed) {
          this.gl.drawElements(drawMode, vertexCount, indexType, offset);
        } else if (isInstanced) {
          this.gl.drawArraysInstanced(drawMode, offset, vertexCount, instanceCount);
        } else {
          this.gl.drawArrays(drawMode, offset, vertexCount);
        }
      });

      if (transformFeedback) {
        transformFeedback.end();
      }
    });

    return this;
  }

  setSamplers(samplers) {
    Object.assign(this.samplers, samplers);
  }

  setUniforms(uniforms = {}, samplers = {}, _onChangeCallback = () => {}) {
    // Simple change detection - if all uniforms are unchanged, do nothing
    // TODO - Disabled since it interferes with textures
    // we must still rebind texture units to current program's textures before drawing
    // If modifying, test with `picking` example on website
    let somethingChanged = false;
    const changedUniforms = {};
    for (const key in uniforms) {
      if (!areUniformsEqual(this.uniforms[key], uniforms[key])) {
        somethingChanged = true;
        changedUniforms[key] = uniforms[key];
        this.uniforms[key] = getUniformCopy(uniforms[key]);
      }
    }

    if (somethingChanged) {
      _onChangeCallback();
      checkUniformValues(changedUniforms, this.id, this._uniformSetters);
      Object.assign(this.samplers, samplers);
      this._setUniforms(changedUniforms);
    }

    return this;
  }

  // PRIVATE METHODS

  // This needs to be done before every draw call
  _bindTextures() {
    for (const uniformName in this.uniforms) {
      const uniformSetter = this._uniformSetters[uniformName];

      if (uniformSetter && uniformSetter.textureIndex !== undefined) {
        let uniform = this.uniforms[uniformName];
        const sampler = this.samplers[uniformName];

        if (uniform instanceof Framebuffer) {
          uniform = uniform.texture;
        }
        if (uniform instanceof Texture) {
          // Bind texture to index
          uniform.bind(uniformSetter.textureIndex);
        }
        // Bind a sampler (if supplied) to index
        if (sampler) {
          sampler.bind(uniformSetter.textureIndex);
        }
      }
    }
  }

  // Apply a set of uniform values to a program
  // Only uniforms actually present in the linked program will be updated.
  /* eslint-disable max-depth */
  _setUniforms(uniforms) {
    this.gl.useProgram(this.handle);

    for (const uniformName in uniforms) {
      let uniform = uniforms[uniformName];
      const uniformSetter = this._uniformSetters[uniformName];

      if (uniformSetter) {
        if (uniform instanceof Framebuffer) {
          uniform = uniform.texture;
        }
        if (uniform instanceof Texture) {
          if (uniformSetter.textureIndex === undefined) {
            uniformSetter.textureIndex = this._textureIndexCounter++;
          }

          // Bind texture to index
          const texture = uniform;
          const {textureIndex} = uniformSetter;

          texture.bind(textureIndex);

          // Set the uniform sampler to the texture index
          uniformSetter(textureIndex);
        } else {
          // Just set the value
          uniformSetter(uniform);
        }
      }
    }

    return this;
  }

  // RESOURCE METHODS

  _createHandle() {
    return this.gl.createProgram();
  }

  _deleteHandle() {
    this.gl.deleteProgram(this.handle);
  }

  // Extract opts needed to initialize a `Program` from an independently created WebGLProgram handle
  _getOptionsFromHandle(handle) {
    const shaderHandles = this.gl.getAttachedShaders(handle);
    const opts = {};
    for (const shaderHandle of shaderHandles) {
      const type = this.gl.getShaderParameter(this.handle, GL.SHADER_TYPE);
      switch (type) {
        case GL.VERTEX_SHADER:
          opts.vs = new VertexShader({handle: shaderHandle});
          break;
        case GL.FRAGMENT_SHADER:
          opts.fs = new FragmentShader({handle: shaderHandle});
          break;
        default:
      }
    }
    return opts;
  }

  _getParameter(pname) {
    return this.gl.getProgramParameter(this.handle, pname);
  }

  // If program is not named, name it after shader names
  // TODO - this.id will already have been initialized
  _setId(id) {
    if (!id) {
      const programName = this._getName();
      this.id = uid(programName);
    }
  }

  // Generate a default name for the program based on names of the shaders
  _getName() {
    let programName = this.vs.getName() || this.fs.getName();
    programName = programName.replace(/shader/i, '');
    programName = programName ? `${programName}-program` : 'program';
    return programName;
  }

  _compileAndLink() {
    const {gl} = this;
    gl.attachShader(this.handle, this.vs.handle);
    gl.attachShader(this.handle, this.fs.handle);
    log.time(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this._getName()}`)();
    gl.linkProgram(this.handle);
    log.timeEnd(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this._getName()}`)();

    // Avoid checking program linking error in production
    if (gl.debug || log.priority > 0) {
      gl.validateProgram(this.handle);
      const linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
      if (!linked) {
        throw new Error(`Error linking: ${gl.getProgramInfoLog(this.handle)}`);
      }
    }
  }

  // query uniform locations and build name to setter map.
  _readUniformLocationsFromLinkedProgram() {
    const {gl} = this;
    this._uniformSetters = {};
    this._uniformCount = this._getParameter(GL.ACTIVE_UNIFORMS);
    for (let i = 0; i < this._uniformCount; i++) {
      const info = this.gl.getActiveUniform(this.handle, i);
      const {name, isArray} = parseUniformName(info.name);
      const location = gl.getUniformLocation(this.handle, name);
      this._uniformSetters[name] = getUniformSetter(gl, location, info, isArray);
    }
    this._textureIndexCounter = 0;
  }

  // stub for shader chache, should reset uniforms to default valiues
  reset() {}

  // TO BE REMOVED in v7?

  // Rretrieves information about active uniforms identifed by their indices (`uniformIndices`)
  // https://
  // developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getActiveUniforms
  getActiveUniforms(uniformIndices, pname) {
    return this.gl.getActiveUniforms(this.handle, uniformIndices, pname);
  }

  // Retrieves the index of a uniform block
  getUniformBlockIndex(blockName) {
    return this.gl.getUniformBlockIndex(this.handle, blockName);
  }

  // Retrieves information about an active uniform block (`blockIndex`)
  // https://
  // developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getActiveUniformBlockParameter
  getActiveUniformBlockParameter(blockIndex, pname) {
    return this.gl.getActiveUniformBlockParameter(this.handle, blockIndex, pname);
  }

  // Binds a uniform block (`blockIndex`) to a specific binding point (`blockBinding`)
  uniformBlockBinding(blockIndex, blockBinding) {
    this.gl.uniformBlockBinding(this.handle, blockIndex, blockBinding);
  }
}
