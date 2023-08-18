import type {
  RenderPipelineProps,
  RenderPass,
  Buffer,
  Binding,
  ShaderLayout,
  PrimitiveTopology,
  // BindingLayout,
  AttributeLayout,
  TypedArray,
  BufferMapping
} from '@luma.gl/core';
import {RenderPipeline, cast, log, decodeVertexFormat} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

import {getWebGLDataType} from '../converters/texture-formats';
import {getShaderLayout, mergeShaderLayout, mergeBufferMap} from '../helpers/get-shader-layout';
import {withDeviceParameters, withGLParameters} from '../converters/device-parameters';
import {setUniform} from '../helpers/set-uniform';
// import {copyUniform, checkUniformValues} from '../../classes/uniforms';

import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from './webgl-buffer';
import {WEBGLShader} from './webgl-shader';
import {WEBGLTexture} from './webgl-texture';
import {WEBGLVertexArrayObject} from '../objects/webgl-vertex-array-object';
import {WEBGLRenderPass} from './webgl-render-pass';

const LOG_PROGRAM_PERF_PRIORITY = 4;

/** Creates a new render pipeline */
export class WEBGLRenderPipeline extends RenderPipeline {
  /** The WebGL device that created this render pipeline */
  device: WebGLDevice;
  /** Handle to underlying WebGL program */
  handle: WebGLProgram;
  /** vertex shader */
  vs: WEBGLShader;
  /** fragment shader */
  fs: WEBGLShader;
  /** The merged layout */
  layout: ShaderLayout;
  /** The layout extracted from shader by WebGL introspection APIs */
  introspectedLayout: ShaderLayout;
  /** Buffer map describing buffer interleaving etc */
  bufferMap: BufferMapping[];

  /** Uniforms set on this model */
  uniforms: Record<string, any> = {};
  /** Bindings set on this model */
  bindings: Record<string, any> = {};
  /** Any constant attributes */
  constantAttributes: Record<string, TypedArray> = {};
  /** Index buffer is stored separately */
  _indexBuffer?: WEBGLBuffer;
  /** WebGL varyings */
  varyings: string[] | null = null;

  /** Stores attribute bindings */
  vertexArrayObject: WEBGLVertexArrayObject;

  _textureUniforms: Record<string, any> = {};
  _textureIndexCounter: number = 0;
  _uniformCount: number = 0;
  _uniformSetters: Record<string, Function> = {}; // TODO are these used?

  constructor(device: WebGLDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle || this.device.gl.createProgram();
    this.device.setSpectorMetadata(this.handle, {id: this.props.id});

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
      this.device.gl2?.transformFeedbackVaryings(this.handle, varyings, bufferMode);
    }

    this._compileAndLink();

    this.introspectedLayout = getShaderLayout(this.device.gl, this.handle);
    // Merge provided layout with introspected layout
    this.layout = mergeShaderLayout(this.introspectedLayout, props.layout); 
    // Merge layout with any buffer map overrides
    this.bufferMap = props.bufferMap || [];
    this.layout = mergeBufferMap(this.layout, this.bufferMap); 
    this.vertexArrayObject = new WEBGLVertexArrayObject(this.device);
  }

  override destroy(): void {
    if (this.handle) {
      this.device.gl.deleteProgram(this.handle);
      // this.handle = null;
      this.destroyed = true;
    }
  }

  setIndexBuffer(indexBuffer: Buffer): void {
    const webglBuffer = cast<WEBGLBuffer>(indexBuffer);
    this.vertexArrayObject.setElementBuffer(webglBuffer);
    this._indexBuffer = webglBuffer;
  }

  /** @todo needed for portable model */
  setAttributes(attributes: Record<string, Buffer>): void {
    for (const [name, buffer] of Object.entries(attributes)) {
      const webglBuffer = cast<WEBGLBuffer>(buffer);
      const attribute = getAttributeLayout(this.layout, name);
      if (!attribute) {
        log.warn(`Ignoring buffer supplied for unknown attribute "${name}" in pipeline "${this.id}" (buffer "${buffer.id}")`)();
        continue; // eslint-disable-line no-continue
      }
      const decoded = decodeVertexFormat(attribute.format);
      const {type: typeString, components: size, byteLength: stride, normalized, integer} = decoded;
      const divisor = attribute.stepMode === 'instance' ? 1 : 0;
      const type = getWebGLDataType(typeString);
      this.vertexArrayObject.setBuffer(attribute.location, webglBuffer, {
        size,
        type,
        stride,
        offset: 0,
        normalized,
        integer,
        divisor
      });
    }
  }

  /**
   * Constant attributes are only supported in WebGL, not in WebGPU
   * Any attribute that is disabled in the current vertex array object
   * is read from the context's global constant value for that attribute location.
   * @param attributes 
   */
  setConstantAttributes(attributes: Record<string, TypedArray>): void {
    for (const [name, value] of Object.entries(attributes)) {
      const attribute = getAttributeLayout(this.layout, name);
      if (!attribute) {
        log.warn(`Ignoring constant value supplied for unknown attribute "${name}" in pipeline "${this.id}"`)();
        continue; // eslint-disable-line no-continue
      }
      this.vertexArrayObject.setConstant(attribute.location, value);
    }
    Object.assign(this.constantAttributes, attributes);
  }

  /** 
   * Bindings include: textures, samplers and uniform buffers
   * @todo needed for portable model 
   */
  setBindings(bindings: Record<string, Binding>): void {
    // if (log.priority >= 2) {
    //   checkUniformValues(uniforms, this.id, this._uniformSetters);
    // }

    for (const [name, value] of Object.entries(bindings)) {
      const binding = this.layout.bindings.find((binding) => binding.name === name);
      if (!binding) {
        log.warn(`Unknown binding ${name} in render pipeline ${this.id}`)();
        continue; // eslint-disable-line no-continue
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
          break;
        case 'texture':
          if (!(value instanceof WEBGLTexture)) {
            throw new Error('texture value');
          }
          break;
        case 'sampler':
          log.warn(`Ignoring sampler ${name}`)();
          break;
        default:
          throw new Error(binding.type);
      }

      this.bindings[name] = value;
    }
  }

  setUniforms(uniforms: Record<string, any>) {
    // TODO - check against layout
    Object.assign(this.uniforms, uniforms);
  }

  /** @todo needed for portable model
   * @note The WebGL API is offers many ways to draw things
   * This function unifies those ways into a single call using common parameters with sane defaults
   */
  draw(options: {
    renderPass: RenderPass;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
  }): boolean {
    const {
      renderPass,
      vertexCount,
      // indexCount,
      instanceCount,
      firstVertex = 0,
      // firstIndex,
      // firstInstance,
      // baseVertex
    } = options;

    const drawMode = getDrawMode(this.props.topology);
    const isIndexed: boolean = Boolean(this._indexBuffer);
    const indexType = this._indexBuffer?.glIndexType;
    const isInstanced: boolean = Number(options.instanceCount) > 0;

    // Avoid WebGL draw call when not rendering any data or values are incomplete
    // Note: async textures set as uniforms might still be loading.
    // Now that all uniforms have been updated, check if any texture
    // in the uniforms is not yet initialized, then we don't draw
    if (!this._areTexturesRenderable() || options.vertexCount === 0) {
      // (isInstanced && instanceCount === 0)
      return false;
    }

    this.device.gl.useProgram(this.handle);

    this.vertexArrayObject.bind(() => {
      const primitiveMode = getGLPrimitive(this.props.topology);
      const transformFeedback: any = null;
      if (transformFeedback) {
        transformFeedback.begin(primitiveMode);
      }

      // We have to apply bindings before every draw call since other draw calls will overwrite
      this._applyBindings();
      this._applyUniforms();
      this._applyConstantAttributes();

      const webglRenderPass = renderPass as WEBGLRenderPass;

      // TODO - double context push/pop
      withDeviceParameters(this.device, this.props.parameters, () => {
        withGLParameters(this.device, webglRenderPass.glParameters, () => {
          // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
          if (isIndexed && isInstanced) {
            // ANGLE_instanced_arrays extension
            this.device.gl2?.drawElementsInstanced(
              drawMode,
              vertexCount || 0, // indexCount?
              indexType,
              firstVertex,
              instanceCount || 0
            );
            // } else if (isIndexed && this.device.isWebGL2 && !isNaN(start) && !isNaN(end)) {
            //   this.device.gl2.drawRangeElements(drawMode, start, end, vertexCount, indexType, offset);
          } else if (isIndexed) {
            this.device.gl.drawElements(drawMode, vertexCount || 0, indexType, firstVertex); // indexCount?
          } else if (isInstanced) {
            this.device.gl2?.drawArraysInstanced(drawMode, firstVertex, vertexCount || 0, instanceCount || 0);
          } else {
            this.device.gl.drawArrays(drawMode, firstVertex, vertexCount || 0);
          }
        });

        if (transformFeedback) {
          transformFeedback.end();
        }
      });
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

  /**
   * Checks if all texture-values uniforms are renderable (i.e. loaded)
   * Update a texture if needed (e.g. from video)
   * Note: This is currently done before every draw call
   */
  _areTexturesRenderable() {
    let texturesRenderable = true;

    for (const [, texture] of Object.entries(this._textureUniforms)) {
      texture.update();
      texturesRenderable = texturesRenderable && texture.loaded;
    }

    for (const [, texture] of Object.entries(this.bindings)) {
      // texture.update();
      if (texture.loaded !== undefined) {
        texturesRenderable = texturesRenderable && texture.loaded;
      }
    }

    return texturesRenderable;
  }

  /** Apply any bindings */
  _applyBindings() {
    this.device.gl.useProgram(this.handle);

    const {gl2} = this.device;
    if (!gl2) {
      throw new Error('bindings');
    }

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
          const {name} = binding;
          const location = gl2.getUniformBlockIndex(this.handle, name);
          if (location === GL.INVALID_INDEX) {
            throw new Error(`Invalid uniform block name ${name}`);
          }
          gl2.uniformBlockBinding(this.handle, uniformBufferIndex, location);
          // console.debug(binding, location);
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
          // ignore
          break;

        case 'storage':
        case 'read-only-storage':
          throw new Error(`binding type '${binding.type}' not supported in WebGL`);
      }
    }
  }

  _applyUniforms() {
    for (const uniformLayout of this.layout.uniforms || []) {
      const {name, location, type, textureUnit} = uniformLayout;
      const value = this.uniforms[name] ?? textureUnit;
      if (value !== undefined) {
        setUniform(this.device.gl, location, type, value);
      }
    }
  }

  /**
   * Constant attributes are only supported in WebGL, not in WebGPU
   * Any attribute that is disabled in the current vertex array object
   * is read from the context's global constant value for that attribute location.
   */
  _applyConstantAttributes(): void {
    for (const [name, value] of Object.entries(this.constantAttributes)) {
      const attribute = getAttributeLayout(this.layout, name);
      if (!attribute) {
        log.warn(`Ignoring constant value supplied for unknown attribute "${name}" in pipeline "${this.id}"`)();
        continue; // eslint-disable-line no-continue
      }
      this.vertexArrayObject.setConstant(attribute.location, value);
    }
  }  
}

/** Get the primitive type for draw */
function getDrawMode(
  topology: PrimitiveTopology
): GL.POINTS | GL.LINES | GL.LINE_STRIP | GL.LINE_LOOP | GL.TRIANGLES | GL.TRIANGLE_STRIP | GL.TRIANGLE_FAN {
  // prettier-ignore
  switch (topology) {
    case 'point-list': return GL.POINTS;
    case 'line-list': return GL.LINES;
    case 'line-strip': return GL.LINE_STRIP;
    case 'line-loop-webgl': return GL.LINE_LOOP;
    case 'triangle-list': return GL.TRIANGLES;
    case 'triangle-strip': return GL.TRIANGLE_STRIP;
    case 'triangle-fan-webgl': return GL.TRIANGLE_FAN;
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
    case 'line-loop-webgl': return GL.LINES;
    case 'triangle-list': return GL.TRIANGLES;
    case 'triangle-strip': return GL.TRIANGLES;
    case 'triangle-fan-webgl': return GL.TRIANGLES;
    default: throw new Error(topology);
  }
}

function getAttributeLayout(layout: ShaderLayout, name: string): AttributeLayout | null {
  return layout.attributes.find((binding) => binding.name === name) || null;
}
