// luma.gl, MIT license

import type {Device, RenderPipelineProps, RenderPipelineParameters, RenderPass} from '@luma.gl/api';
import {log, assert, uid, cast, Shader} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {parseUniformName, getUniformSetter} from './uniforms';
import ProgramConfiguration from './program-configuration';
import {copyUniform, checkUniformValues} from './uniforms';

import {getKey} from '../webgl-utils/constants-to-keys';
import {getPrimitiveDrawMode} from '../webgl-utils/attribute-utils';

import VertexArray from './vertex-array';

import {isWebGL2, assertWebGL2Context} from '@luma.gl/webgl';
import {withParameters, withDeviceParameters} from '@luma.gl/webgl';
import {WebGLDevice, WEBGLBuffer, WEBGLRenderPipeline, WEBGLShader, WEBGLTexture, WEBGLFramebuffer} from '@luma.gl/webgl';

/* eslint-disable max-depth */

const GL_SEPARATE_ATTRIBS = 0x8c8d;

export type ProgramProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  /** Compiled vertex shader */
  vs?: Shader | string;
  /** Compiled fragment shader */
  fs?: Shader | string;
  hash?: string;
  varyings?: string[];
  bufferMode?: number;
};

export type ProgramDrawOptions = {
  renderPass: RenderPass;
  logPriority?: number;
  drawMode?: number;
  vertexCount: any;
  offset?: number;
  start?: number;
  end?: number;
  isIndexed?: boolean;
  indexType?: any;
  instanceCount?: number;
  isInstanced?: boolean;
  vertexArray: VertexArray;
  transformFeedback?: any; // TransformFeedback;
  framebuffer?: WEBGLFramebuffer;
  parameters?: {};
  uniforms?: Record<string, any>;
  samplers?: any;
};

function getRenderPipelineProps(device: WebGLDevice, props: ProgramProps): RenderPipelineProps {
  const newProps: RenderPipelineProps = {...props} as RenderPipelineProps;
  // Create shaders if needed
  if (typeof props.vs === 'string') {
    newProps.vs = device.createShader({id: `${props.id}-vs`, source: props.vs, stage: 'vertex'})
  }
  if (typeof props.fs === 'string') {
    newProps.fs = device.createShader({id: `${props.id}-fs`, source: props.fs, stage: 'fragment'})
  }
  return newProps;
}

/** @deprecated Use device.createRenderPipeline */
export default class Program extends WEBGLRenderPipeline {
  override get [Symbol.toStringTag](): string { return 'Program'; }

  gl: WebGLRenderingContext;
  gl2: WebGL2RenderingContext;

  configuration: ProgramConfiguration;
  // Experimental flag to avoid deleting Program object while it is cached
  // hash: string; // Used by ProgramManager
  // uniforms: Record<string, any>;
  // varyings: string[];
  // _textureUniforms: Record<string, any>;
  _isCached: boolean = false;
  // _textureIndexCounter: number = 0;
  // _uniformCount: number = 0;
  // _uniformSetters: Record<string, Function>;
  private _parameters: RenderPipelineParameters;
  private vertexArray: VertexArray;

  constructor(device: Device | WebGLRenderingContext, props: ProgramProps) {
    super(WebGLDevice.attach(device), getRenderPipelineProps(WebGLDevice.attach(device), props));
    this.gl = this.device.gl;
    this.gl2 = this.device.gl2;
    this._parameters = props.parameters;
    this.vertexArray = new VertexArray(this.device.gl);
    this.initialize(props);
    Object.seal(this);
    this._setId(props.id);
  }

  override destroy(options = {}) {
    // This object is cached, do not delete
    if (!this._isCached) {
      super.destroy();
    }
  }

  initialize(props: ProgramProps) {
    // Create shaders if needed
    props = getRenderPipelineProps(this.device, props);

    const {hash, vs, fs, varyings, bufferMode = GL_SEPARATE_ATTRIBS} = props;

    this.vs = cast<WEBGLShader>(vs);
    this.fs = fs && cast<WEBGLShader>(fs);

    this.hash = hash || ''; // Used by ProgramManager

    assert(this.vs.stage === 'vertex');
    // assert(this.fs.stage === 'fragment');

    // uniforms
    this.uniforms = {};
    this._textureUniforms = {};

    // Setup varyings if supplied
    if (varyings && varyings.length > 0) {
      assertWebGL2Context(this.gl);
      this.varyings = varyings;
      this.gl2.transformFeedbackVaryings(this.handle, varyings, bufferMode);
    }

    // this._compileAndLink();
    this._readUniformLocationsFromLinkedProgram();
    this.configuration = new ProgramConfiguration(this);

    return this.setProps(props);
  }

  setProps(props: ProgramProps) {
    if ('uniforms' in props) {
      this.setUniforms(props.uniforms);
    }
    return this;
  }

  /** @note completely overrides base class */
  override setAttributes(attributes: Record<string, WEBGLBuffer>): void {
    this.vertexArray.setAttributes(attributes);
  }

  /**
   * A good thing about the WebGL API is that there are so many ways to draw things ;)
   * This function unifies those ways into a single call using common parameters with sane defaults
   * @note completely overrides base class
   */
  override draw(options: ProgramDrawOptions): boolean {
    const {
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

      // Deprecated
      uniforms,
      samplers
    } = options;

    let {parameters = {}} = options;

    if (uniforms || samplers) {
      // DEPRECATED: v7.0 (deprecated earlier but warning not properly implemented)
      log.deprecated('Program.draw({uniforms})', 'Program.setUniforms(uniforms)')();
      this.setUniforms(uniforms || {});
    }

    if (typeof logPriority === 'number' && log.priority >= logPriority) {
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

      // TODO - double context push/pop
      withDeviceParameters(this.device, this._parameters, () => {
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
      });

      if (transformFeedback) {
        transformFeedback.end();
      }
    });

    return true;
  }

  override setUniforms(uniforms = {}) {
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

        if (value instanceof WEBGLFramebuffer) {
          value = value.texture;
        }
        if (value instanceof WEBGLTexture) {
          textureUpdate = this.uniforms[uniformName] !== uniform;

          if (textureUpdate) {
            // eslint-disable-next-line max-depth
            // @ts-expect-error
            if (uniformSetter.textureIndex === undefined) {
              // @ts-expect-error
              uniformSetter.textureIndex = this._textureIndexCounter++;
            }

            // Bind texture to index
            const texture = value;
            // @ts-expect-error
            const {textureIndex} = uniformSetter;

            texture.bind(textureIndex);
            value = textureIndex;

            this._textureUniforms[uniformName] = texture;
          } else {
            // @ts-expect-error
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
  override _areTexturesRenderable() {
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
      // @ts-expect-error
      const textureIndex = this._uniformSetters[uniformName].textureIndex;
      this._textureUniforms[uniformName].bind(textureIndex);
    }
  }

  // If program is not named, name it after shader names
  // TODO - this.id will already have been initialized
  _setId(id: string): void {
    if (!id) {
      const programName = this._getName();
      this.id = uid(programName);
    }
  }

  // Generate a default name for the program based on names of the shaders
  _getName(): string {
    // let programName = this.vs.getName() || this.fs.getName();
    let programName = this.vs.id || this.fs.id;
    programName = programName.replace(/shader/i, '');
    programName = programName ? `${programName}-program` : 'program';
    return programName;
  }

  // RESOURCE METHODS

  // Extract opts needed to initialize a `Program` from an independently created WebGLProgram handle
  _getOptionsFromHandle(handle: WebGLProgram) {
    const shaderHandles = this.gl.getAttachedShaders(handle);
    const opts = {};
    for (const shaderHandle of shaderHandles) {
      const type = this.gl.getShaderParameter(this.handle, GL.SHADER_TYPE);
      switch (type) {
        case GL.VERTEX_SHADER:
          // @ts-expect-error
          opts.vs = new VertexShader({handle: shaderHandle});
          break;
        case GL.FRAGMENT_SHADER:
          // @ts-expect-error
          opts.fs = new FragmentShader({handle: shaderHandle});
          break;
        default:
      }
    }
    return opts;
  }

  _getParameter(pname: GL): any {
    return this.gl.getProgramParameter(this.handle, pname);
  }

  // TO BE REMOVED in v7?

  // query uniform locations and build name to setter map.
  // TODO - This overlaps with ProgramConfiguration?
  _readUniformLocationsFromLinkedProgram(): void {
    const {gl} = this;
    this._uniformSetters = {};
    this._uniformCount = this._getParameter(GL.ACTIVE_UNIFORMS);
    for (let i = 0; i < this._uniformCount; i++) {
      const info = this.gl.getActiveUniform(this.handle, i);
      const {name} = parseUniformName(info.name);
      let location = gl.getUniformLocation(this.handle, name);
      // @ts-expect-error
      this._uniformSetters[name] = getUniformSetter(gl, location, info);
      if (info.size > 1) {
        for (let l = 0; l < info.size; l++) {
          location = gl.getUniformLocation(this.handle, `${name}[${l}]`);
          // @ts-expect-error
          this._uniformSetters[`${name}[${l}]`] = getUniformSetter(gl, location, info);
        }
      }
    }
    this._textureIndexCounter = 0;
  }

  // Rretrieves information about active uniforms identifed by their indices (`uniformIndices`)
  // https://
  // developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getActiveUniforms
  getActiveUniforms(uniformIndices: number[], pname: GL): any {
    return this.gl2.getActiveUniforms(this.handle, uniformIndices, pname);
  }

  // Retrieves the index of a uniform block
  getUniformBlockIndex(blockName: string): number {
    return this.gl2.getUniformBlockIndex(this.handle, blockName);
  }

  // Retrieves information about an active uniform block (`blockIndex`)
  // https://
  // developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getActiveUniformBlockParameter
  getActiveUniformBlockParameter(blockIndex: number, pname: GL): any {
    return this.gl2.getActiveUniformBlockParameter(this.handle, blockIndex, pname);
  }

  // Binds a uniform block (`blockIndex`) to a specific binding point (`blockBinding`)
  uniformBlockBinding(blockIndex: number, blockBinding: number): void {
    this.gl2.uniformBlockBinding(this.handle, blockIndex, blockBinding);
  }
}

// function setBindings(gl2: WebGL2RenderingContext, program: WebGLProgram, bindings: Binding[]): void {
//   // Set up indirection
//   this.gl2.uniformBlockBinding(this.handle, blockIndex, blockBinding);
// }
