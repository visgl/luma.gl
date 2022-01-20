import type {
  RenderPipelineProps,
  RenderPipelineParameters,
  RenderPass,
  Buffer,
  Binding,
  ShaderLayout,
  PrimitiveTopology
} from '@luma.gl/api';
import {RenderPipeline, cast, log} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {copyUniform, checkUniformValues} from '../../classes/uniforms';
import {getShaderLayout, getProgramBindings} from '../helpers/get-program-bindings';
import {withDeviceParameters} from '../converters/device-parameters';

import VertexArray from '../../classes/vertex-array';

import WebGLDevice from '../webgl-device';
import WEBGLShader from './webgl-shader';
import WEBGLBuffer from '../../classes/webgl-buffer';
import WEBGLTexture from './webgl-texture';

const LOG_PROGRAM_PERF_PRIORITY = 4;

/** Creates a new render pipeline */
export default class WEBGLRenderPipeline extends RenderPipeline {
  device: WebGLDevice;
  handle: WebGLProgram;
  vs: WEBGLShader;
  fs: WEBGLShader;
  layout: ShaderLayout;

  // configuration: ProgramConfiguration;
  // Experimental flag to avoid deleting Program object while it is cached
  varyings: string[];
  vertexArray: VertexArray;
  uniforms: Record<string, any> = {};
  bindings: Record<string, any> = {};
  _textureUniforms: Record<string, any> = {};
  _textureIndexCounter: number = 0;
  _uniformCount: number = 0;
  _uniformSetters: Record<string, Function>;

  constructor(device: WebGLDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle || this.device.gl.createProgram();
    // @ts-expect-error
    this.handle.__SPECTOR_Metadata = {id: this.props.id};

    // Create shaders if needed
    this.vs = cast<WEBGLShader>(props.vs);
    this.fs = cast<WEBGLShader>(props.fs);
    // assert(this.vs.stage === 'vertex');
    // assert(this.fs.stage === 'fragment');

    // Setup varyings if supplied
    // @ts-expect-error WebGL only
    const {varyings, bufferMode = GL.SEPARATE_ATTRIBS} = props;
    if (varyings && varyings.length > 0) {
      this.device.assertWebGL2();
      this.varyings = varyings;
      this.device.gl2.transformFeedbackVaryings(this.handle, varyings, bufferMode);
    }

    this._compileAndLink();

    this.layout = props.layout || getShaderLayout(this.device.gl, this.handle);
    this.vertexArray = new VertexArray(this.device.gl);
  }

  destroy(): void {
    if (this.handle) {
      this.device.gl.deleteProgram(this.handle);
      this.handle = null;
    }
  }

  /** @todo needed for portable model */
  setAttributes(attributes: Record<string, Buffer>): void {
    this.vertexArray.setAttributes(attributes);
  }

  /** @todo needed for portable model */
  setBindings(bindings: Record<string, Binding>): void {
    // if (log.priority >= 2) {
    //   checkUniformValues(uniforms, this.id, this._uniformSetters);
    // }

    for (const [name, value] of Object.entries(bindings)) {
      const binding = this.layout.bindings.find((binding) => binding.name === name);
      if (!binding) {
        log.warn(`Unknown binding ${name} in render pipeline ${this.id}`)();
      }
      if (!value) {
        log.warn(`Unsetting binding ${name} in render pipeline ${this.id}`)();
      }
      switch (binding.type) {
        case 'uniform':
          // @ts-expect-error
          if (!(value instanceof WEBGLBuffer) && !(value.buffer instanceof WEBGLBuffer)) {
            throw new Error('buffer value');
          }
        case 'texture':
          if (!(value instanceof WEBGLTexture)) {
            throw new Error('texture value');
          }
      }

      this.bindings[name] = value;
    }
  }

  _applyBindings() {
    this.device.gl.useProgram(this.handle);

    const {gl2} = this.device;

    let textureUnit = 0;
    let uniformBufferIndex = 0;
    for (const binding of this.layout.bindings) {
      const value = this.bindings[binding.name];
      if (!value) {
        throw new Error(`No value for binding ${binding.name} in ${this.id}`);
      }
      switch (binding.type) {
        case 'uniform':
          // Set buffer
          const {location} = binding;
          // const location = gl2.getUniformBlockIndex(this.handle, name);
          gl2.uniformBlockBinding(this.handle, uniformBufferIndex, location);
          if (value instanceof WEBGLBuffer) {
            gl2.bindBufferBase(GL.UNIFORM_BUFFER, uniformBufferIndex, value.handle);
          } else {
            gl2.bindBufferRange(
              GL.UNIFORM_BUFFER,
              uniformBufferIndex,
              value.buffer.handle,
              value.offset || 0,
              value.size || value.buffer.byteLength - value.offset
            );
          }
          uniformBufferIndex += 1;
          break;

        case 'texture':
          if (!(value instanceof WEBGLTexture)) {
            throw new Error('texture');
          }
          const texture: WEBGLTexture = value;
          gl2.activeTexture(GL.TEXTURE0 + textureUnit);
          gl2.bindTexture(texture.target, texture.handle);
          // gl2.bindSampler(textureUnit, sampler.handle);
          textureUnit += 1;
          break;

        case 'sampler':
        case 'storage':
        case 'read-only-storage':
          throw new Error(`binding type '${binding.type}' not supported in WebGL`);
      }
    }
  }

  /** @todo needed for portable model
   * @note The WebGL API is offers many ways to draw things
   * This function unifies those ways into a single call using common parameters with sane defaults
   */
  draw(options: {
    renderPass?: RenderPass;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
  }): boolean {
    const {
      renderPass = this.device.getDefaultRenderPass(),
      vertexCount,
      indexCount,
      instanceCount,
      firstVertex = 0,
      firstIndex,
      firstInstance,
      baseVertex
    } = options;

    const drawMode = getDrawMode(this.props.topology);
    const isIndexed: boolean = false;
    const indexType = GL.UNSIGNED_INT;
    const isInstanced: boolean = options.instanceCount !== undefined;

    // Avoid WebGL draw call when not rendering any data or values are incomplete
    // Note: async textures set as uniforms might still be loading.
    // Now that all uniforms have been updated, check if any texture
    // in the uniforms is not yet initialized, then we don't draw
    if (!this._areTexturesRenderable() || options.vertexCount === 0) {
      // (isInstanced && instanceCount === 0)
      return false;
    }

    this.device.gl.useProgram(this.handle);

    this.vertexArray.bindForDraw(vertexCount, instanceCount, () => {
      const parameters = {...this.props.parameters, framebuffer: renderPass.props.framebuffer};

      const primitiveMode = getGLPrimitive(this.props.topology);
      const transformFeedback = null;
      if (transformFeedback) {
        transformFeedback.begin(primitiveMode);
      }

      // We have to apply bindings before every draw call since other draw calls will overwrite
      this._applyBindings();

      // TODO - double context push/pop
      withDeviceParameters(this.device, parameters, () => {
        // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
        if (isIndexed && isInstanced) {
          // ANGLE_instanced_arrays extension
          this.device.gl2.drawElementsInstanced(
            drawMode,
            vertexCount,
            indexType,
            firstVertex,
            instanceCount
          );
          // } else if (isIndexed && this.device.isWebGL2 && !isNaN(start) && !isNaN(end)) {
          //   this.device.gl2.drawRangeElements(drawMode, start, end, vertexCount, indexType, offset);
        } else if (isIndexed) {
          this.device.gl.drawElements(drawMode, vertexCount, indexType, firstVertex);
        } else if (isInstanced) {
          this.device.gl2.drawArraysInstanced(drawMode, firstVertex, vertexCount, instanceCount);
        } else {
          this.device.gl.drawArrays(drawMode, firstVertex, vertexCount);
        }
      });

      if (transformFeedback) {
        transformFeedback.end();
      }
    });

    return true;
  }

  // setAttributes(attributes: Record<string, Buffer>): void {}
  // setBindings(bindings: Record<string, Binding>): void {}

  protected _compileAndLink() {
    const {gl} = this.device;
    gl.attachShader(this.handle, this.vs.handle);
    gl.attachShader(this.handle, this.fs.handle);
    log.time(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this.id}`)();
    gl.linkProgram(this.handle);
    log.timeEnd(LOG_PROGRAM_PERF_PRIORITY, `linkProgram for ${this.id}`)();

    // Avoid checking program linking error in production
    // @ts-expect-error
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
}

/** Get the primitive type for transform feedback */
function getDrawMode(
  topology: PrimitiveTopology
): GL.POINTS | GL.LINES | GL.LINE_STRIP | GL.TRIANGLES | GL.TRIANGLE_STRIP {
  // prettier-ignore
  switch (topology) {
  case 'point-list': return GL.POINTS;
  case 'line-list': return GL.LINES;
  case 'line-strip': return GL.LINE_STRIP;
  case 'triangle-list': return GL.TRIANGLES;
  case 'triangle-strip': return GL.TRIANGLE_STRIP;
  default: throw new Error(topology);
  }
}

/** Get the primitive type for transform feedback */
function getGLPrimitive(topology: PrimitiveTopology): GL.POINTS | GL.LINES | GL.TRIANGLES {
  // prettier-ignore
  switch (topology) {
  case 'point-list': return GL.POINTS;
  case 'line-list': return GL.LINES;
  case 'line-strip': return GL.LINES;
  case 'triangle-list': return GL.TRIANGLES;
  case 'triangle-strip': return GL.TRIANGLES;
  default: throw new Error(topology);
  }
}
