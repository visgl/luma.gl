import GL from '@luma.gl/constants';

import Resource from './resource';
import Texture from './texture';
import Framebuffer from './framebuffer';
import {parseUniformName, getUniformSetter} from './uniforms';
import {VertexShader, FragmentShader} from './shader';
import ProgramConfiguration from './program-configuration';
import {copyUniform, checkUniformValues} from './uniforms';

import {isWebGL2, assertWebGL2Context, withParameters, log} from '@luma.gl/gltools';
import {getKey} from '../webgl-utils/constants-to-keys';
import {getPrimitiveDrawMode} from '../webgl-utils/attribute-utils';
import {assert} from '../utils/assert';
import {uid} from '../utils/utils';

const LOG_PROGRAM_PERF_PRIORITY = 4;

const GL_SEPARATE_ATTRIBS = 0x8c8d;

const V6_DEPRECATED_METHODS = [
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
];

export default class Program extends Resource {
  constructor(gl, props = {}) {
    super(gl, props);

    this.stubRemovedMethods('Program', 'v6.0', V6_DEPRECATED_METHODS);

    // Experimental flag to avoid deleting Program object while it is cached
    this._isCached = false;

    this.initialize(props);

    Object.seal(this);

    this._setId(props.id);
  }

  initialize(props = {}) {
    const {hash, vs, fs, varyings, bufferMode = GL_SEPARATE_ATTRIBS} = props;

    this.hash = hash || ''; // Used by ProgramManager

    // Create shaders if needed
    this.vs =
      typeof vs === 'string' ? new VertexShader(this.gl, {id: `${props.id}-vs`, source: vs}) : vs;
    this.fs =
      typeof fs === 'string' ? new FragmentShader(this.gl, {id: `${props.id}-fs`, source: fs}) : fs;
    assert(this.vs instanceof VertexShader);
    assert(this.fs instanceof FragmentShader);

    // uniforms
    this.uniforms = {};

    this._textureUniforms = {};

    // Setup varyings if supplied
    if (varyings && varyings.length > 0) {
      assertWebGL2Context(this.gl);
      this.varyings = varyings;
      this.gl2.transformFeedbackVaryings(this.handle, varyings, bufferMode);
    }

    this._compileAndLink();
    this._readUniformLocationsFromLinkedProgram();
    this.configuration = new ProgramConfiguration(this);

    return this.setProps(props);
  }

  delete(options = {}) {
    if (this._isCached) {
      // This object is cached, do not delete
      return this;
    }
    return super.delete(options);
  }

  setProps(props) {
    if ('uniforms' in props) {
      this.setUniforms(props.uniforms);
    }
    return this;
  }

  // A good thing about the WebGL API is that there are so many ways to draw things ;)
  // This function unifies those ways into a single call using common parameters with sane defaults
  draw({
    logPriority, // Probe log priority, enables Model to do more integrated logging

    drawMode = GL.TRIANGLES,
    vertexCount,
    offset = 0,
    start,
    end,
    isIndexed = false,
    indexType = GL.UNSIGNED_SHORT,
    instanceCount = 0,
    isInstanced = instanceCount > 0,

    vertexArray = null,
    transformFeedback,
    framebuffer,
    parameters = {},

    // Deprecated
    uniforms,
    samplers
  }) {
    if (uniforms || samplers) {
      // DEPRECATED: v7.0 (deprecated earlier but warning not properly implemented)
      log.deprecated('Program.draw({uniforms})', 'Program.setUniforms(uniforms)')();
      this.setUniforms(uniforms || {});
    }

    if (log.priority >= logPriority) {
      const fb = framebuffer ? framebuffer.id : 'default';
      const message =
        `mode=${getKey(this.gl, drawMode)} verts=${vertexCount} ` +
        `instances=${instanceCount} indexType=${getKey(this.gl, indexType)} ` +
        `isInstanced=${isInstanced} isIndexed=${isIndexed} ` +
        `Framebuffer=${fb}`;
      log.log(logPriority, message)();
    }

    // TODO - move vertex array binding and transform feedback binding to withParameters?
    assert(vertexArray);

    this.gl.useProgram(this.handle);

    if (
      // Note: async textures set as uniforms might still be loading.
      // Now that all uniforms have been updated, check if any texture
      // in the uniforms is not yet initialized, then we don't draw
      !this._areTexturesRenderable() ||
      // Avoid WebGL draw call when not rendering any data
      vertexCount === 0 ||
      (isInstanced && instanceCount === 0)
    ) {
      return false;
    }

    vertexArray.bindForDraw(vertexCount, instanceCount, () => {
      if (framebuffer !== undefined) {
        parameters = Object.assign({}, parameters, {framebuffer});
      }

      if (transformFeedback) {
        const primitiveMode = getPrimitiveDrawMode(drawMode);
        transformFeedback.begin(primitiveMode);
      }

      this._bindTextures();

      withParameters(this.gl, parameters, () => {
        // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
        if (isIndexed && isInstanced) {
          this.gl2.drawElementsInstanced(drawMode, vertexCount, indexType, offset, instanceCount);
        } else if (isIndexed && isWebGL2(this.gl) && !isNaN(start) && !isNaN(end)) {
          this.gl2.drawRangeElements(drawMode, start, end, vertexCount, indexType, offset);
        } else if (isIndexed) {
          this.gl.drawElements(drawMode, vertexCount, indexType, offset);
        } else if (isInstanced) {
          this.gl2.drawArraysInstanced(drawMode, offset, vertexCount, instanceCount);
        } else {
          this.gl.drawArrays(drawMode, offset, vertexCount);
        }
      });

      if (transformFeedback) {
        transformFeedback.end();
      }
    });

    return true;
  }

  setUniforms(uniforms = {}) {
    if (log.priority >= 2) {
      checkUniformValues(uniforms, this.id, this._uniformSetters);
    }

    this.gl.useProgram(this.handle);

    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];
      const uniformSetter = this._uniformSetters[uniformName];

      if (uniformSetter) {
        let value = uniform;
        let textureUpdate = false;

        if (value instanceof Framebuffer) {
          value = value.texture;
        }
        if (value instanceof Texture) {
          textureUpdate = this.uniforms[uniformName] !== uniform;

          if (textureUpdate) {
            // eslint-disable-next-line max-depth
            if (uniformSetter.textureIndex === undefined) {
              uniformSetter.textureIndex = this._textureIndexCounter++;
            }

            // Bind texture to index
            const texture = value;
            const {textureIndex} = uniformSetter;

            texture.bind(textureIndex);
            value = textureIndex;

            this._textureUniforms[uniformName] = texture;
          } else {
            value = uniformSetter.textureIndex;
          }
        } else if (this._textureUniforms[uniformName]) {
          delete this._textureUniforms[uniformName];
        }

        // NOTE(Tarek): uniformSetter returns whether
        //   value had to be updated or not.
        if (uniformSetter(value) || textureUpdate) {
          copyUniform(this.uniforms, uniformName, uniform);
        }
      }
    }

    return this;
  }

  // PRIVATE METHODS

  // Checks if all texture-values uniforms are renderable (i.e. loaded)
  // Update a texture if needed (e.g. from video)
  // Note: This is currently done before every draw call
  _areTexturesRenderable() {
    let texturesRenderable = true;

    for (const uniformName in this._textureUniforms) {
      const texture = this._textureUniforms[uniformName];
      texture.update();
      texturesRenderable = texturesRenderable && texture.loaded;
    }

    return texturesRenderable;
  }

  // Binds textures
  // Note: This is currently done before every draw call
  _bindTextures() {
    for (const uniformName in this._textureUniforms) {
      const textureIndex = this._uniformSetters[uniformName].textureIndex;
      this._textureUniforms[uniformName].bind(textureIndex);
    }
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
          // @ts-ignore
          opts.vs = new VertexShader({handle: shaderHandle});
          break;
        case GL.FRAGMENT_SHADER:
          // @ts-ignore
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
    // @ts-ignore
    if (gl.debug || log.level > 0) {
      const linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
      if (!linked) {
        throw new Error(`Error linking: ${gl.getProgramInfoLog(this.handle)}`);
      }

      gl.validateProgram(this.handle);
      const validated = gl.getProgramParameter(this.handle, gl.VALIDATE_STATUS);
      if (!validated) {
        throw new Error(`Error validating: ${gl.getProgramInfoLog(this.handle)}`);
      }
    }
  }

  // query uniform locations and build name to setter map.
  // TODO - This overlaps with ProgramConfiguration?
  _readUniformLocationsFromLinkedProgram() {
    const {gl} = this;
    this._uniformSetters = {};
    this._uniformCount = this._getParameter(GL.ACTIVE_UNIFORMS);
    for (let i = 0; i < this._uniformCount; i++) {
      const info = this.gl.getActiveUniform(this.handle, i);
      const {name} = parseUniformName(info.name);
      let location = gl.getUniformLocation(this.handle, name);
      this._uniformSetters[name] = getUniformSetter(gl, location, info);
      if (info.size > 1) {
        for (let l = 0; l < info.size; l++) {
          location = gl.getUniformLocation(this.handle, `${name}[${l}]`);
          this._uniformSetters[`${name}[${l}]`] = getUniformSetter(gl, location, info);
        }
      }
    }
    this._textureIndexCounter = 0;
  }

  // TO BE REMOVED in v7?

  // Rretrieves information about active uniforms identifed by their indices (`uniformIndices`)
  // https://
  // developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getActiveUniforms
  getActiveUniforms(uniformIndices, pname) {
    return this.gl2.getActiveUniforms(this.handle, uniformIndices, pname);
  }

  // Retrieves the index of a uniform block
  getUniformBlockIndex(blockName) {
    return this.gl2.getUniformBlockIndex(this.handle, blockName);
  }

  // Retrieves information about an active uniform block (`blockIndex`)
  // https://
  // developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getActiveUniformBlockParameter
  getActiveUniformBlockParameter(blockIndex, pname) {
    return this.gl2.getActiveUniformBlockParameter(this.handle, blockIndex, pname);
  }

  // Binds a uniform block (`blockIndex`) to a specific binding point (`blockBinding`)
  uniformBlockBinding(blockIndex, blockBinding) {
    this.gl2.uniformBlockBinding(this.handle, blockIndex, blockBinding);
  }
}
