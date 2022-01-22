import {Device, assert, isObjectEmpty} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {getShaderInfo, getPassthroughFS} from '@luma.gl/shadertools';
import type {Framebuffer, Buffer} from '@luma.gl/gltools';
import {WebGLDevice} from '@luma.gl/webgl';

import Model from '../lib-classic/classic-model';
import BufferTransform from './buffer-transform';
import TextureTransform from './texture-transform';
import {TransformProps, TransformRunOptions, TransformDrawOptions} from './transform-types';

/**
 * Takes source and target buffers/textures and sets up the pipeline
 */
export default class Transform {
  /**
   * Check if Transforms are supported (they are not under WebGL1)
   * @todo differentiate writing to buffer vs not
   */
  static isSupported(device: Device | WebGL2RenderingContext): boolean {
    try {
      const webglDevice = WebGLDevice.attach(device);
      return webglDevice.isWebGL2;
    } catch {
      return false;
    }
  }

  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  model: Model | null = null;
  elementCount = 0;
  bufferTransform = null;
  textureTransform = null;
  elementIDBuffer = null;

  constructor(device: Device | WebGL2RenderingContext, props: TransformProps = {}) {
    this.device = WebGLDevice.attach(device);
    // TODO assert webgl2?
    this.gl = this.device.gl2;
    this._initialize(props);
    Object.seal(this);
  }

  /** Delete owned resources. */
  destroy(): void {
    const {model, bufferTransform, textureTransform} = this;
    if (model) {
      model.delete();
    }
    if (bufferTransform) {
      bufferTransform.delete();
    }
    if (textureTransform) {
      textureTransform.delete();
    }
  }

  /** @deprecated Use destroy*() */
  delete(): void {
    this.destroy();
  }

  /** Run one transform loop. */
  run(options?: TransformRunOptions): void {
    const {clearRenderTarget = true} = options || {};

    const updatedOpts = this._updateDrawOptions(options);

    if (clearRenderTarget && updatedOpts.framebuffer) {
      updatedOpts.framebuffer.clear({color: true});
    }

    this.model.transform(updatedOpts);
  }

  /** swap resources if a map is provided */
  swap(): void {
    let swapped = false;
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      swapped = swapped || resourceTransform.swap();
    }
    assert(swapped, 'Nothing to swap');
  }

  /** Return Buffer object for given varying name. */
  getBuffer(varyingName: string = null): Buffer {
    return this.bufferTransform && this.bufferTransform.getBuffer(varyingName);
  }

  /** Return data either from Buffer or from Texture */
  getData(options: {packed?: boolean; varyingName?: string} = {}) {
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      const data = resourceTransform.getData(options);
      if (data) {
        return data;
      }
    }
    return null;
  }

  /** Return framebuffer object if rendering to textures */
  getFramebuffer(): Framebuffer | null {
    return this.textureTransform && this.textureTransform.getFramebuffer();
  }

  /** Update some or all buffer/texture bindings. */
  update(props: TransformProps): void {
    if ('elementCount' in props) {
      this.model.setVertexCount(props.elementCount);
    }
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      resourceTransform.update(props);
    }
  }

  // Private

  _initialize(props: TransformProps): void {
    const {gl} = this;
    this._buildResourceTransforms(gl, props);

    props = this._updateModelProps(props);
    this.model = new Model(this.device, {
      ...props,
      fs: props.fs || getPassthroughFS({version: getShaderInfo(props.vs).version}),
      id: props.id || 'transform-model',
      drawMode: props.drawMode || GL.POINTS,
      vertexCount: props.elementCount
    });

    if (this.bufferTransform) {
      this.bufferTransform.setupResources({model: this.model});
    }
  }

  _updateModelProps(props: TransformProps): TransformProps {
    let updatedProps = {...props};
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      updatedProps = resourceTransform.updateModelProps(updatedProps);
    }
    return updatedProps;
  }

  _buildResourceTransforms(gl: WebGL2RenderingContext, props: TransformProps) {
    if (canCreateBufferTransform(props)) {
      this.bufferTransform = new BufferTransform(gl, props);
    }
    if (canCreateTextureTransform(props)) {
      this.textureTransform = new TextureTransform(gl, props);
    }
    assert(
      this.bufferTransform || this.textureTransform,
      'must provide source/feedback buffers or source/target textures'
    );
  }

  _updateDrawOptions(options: TransformRunOptions): TransformDrawOptions {
    let updatedOpts = {...options};
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      updatedOpts = Object.assign(updatedOpts, resourceTransform.getDrawOptions(updatedOpts));
    }
    return updatedOpts;
  }
}

// Helper Methods

function canCreateBufferTransform(props: TransformProps): boolean {
  const canCreate =
    !isObjectEmpty(props.feedbackBuffers) ||
    !isObjectEmpty(props.feedbackMap) ||
    (props.varyings && props.varyings.length > 0);
  return Boolean(canCreate);
}

function canCreateTextureTransform(props: TransformProps): boolean {
  const canCreate =
    !isObjectEmpty(props._sourceTextures) || props._targetTexture || props._targetTextureVarying;
  return canCreate;
}
