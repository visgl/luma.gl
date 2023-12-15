// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Device, Buffer, BufferRange, Framebuffer, TransformFeedback, assert, PrimitiveTopology, RenderPassParameters, BufferLayout} from '@luma.gl/core';
import {getShaderInfo, getPassthroughFS, ShaderModule} from '@luma.gl/shadertools';
import {Model} from '../model/model';

// import BufferTransform from './buffer-transform';
// import TextureTransform from './texture-transform';

/** Properties for creating Transforms */
export type TransformProps = {
  id?: string;
  vs?: string;
  fs?: string;
  vertexCount?: number;
  sourceBuffers?: Record<string, Buffer>;
  feedbackBuffers?: Record<string, Buffer | BufferRange>;
  varyings?: string[];
  feedbackMap?: Record<string, string>;
  modules?: ShaderModule[];
  attributes?: Record<string, any>;
  bufferLayout?: BufferLayout[];
  uniforms?: Record<string, any>;
  defines?: Record<string, any>
  // parameters?: GLParameters;
  discard?: boolean;
  // isIndexed?: boolean;
  // inject?: Record<string, string>;
  topology?: PrimitiveTopology;
  // framebuffer?: Framebuffer;
  // _sourceTextures?: Record<string, Texture>;
  // _targetTexture?: string | Texture;
  // _targetTextureVarying?: string;
  // _swapTexture?: string | null;
  // _fs?: string;
};

/** Options that can be provided when running a Transform */
export type TransformRunOptions = {
  framebuffer?: Framebuffer;
  // clearRenderTarget?: boolean;
  /** @deprecated Use uniform buffers for portability. */
  uniforms?: Record<string, any>;
  parameters?: RenderPassParameters;
  discard?: boolean;
};

/** Options that control drawing a Transform. Used by subclasses to return draw parameters */
// export type TransformDrawOptions = {
//   attributes?: Record<string, any>;
//   framebuffer?: any;
//   uniforms?: object;
//   discard?: boolean;
//   parameters?: object;
//   transformFeedback?: TransformFeedback;
// };

// export type TransformBinding = {
//   sourceBuffers: Record<string, Buffer>;
//   sourceTextures: Record<string, Texture>;
//   feedbackBuffers?: Record<string, Buffer | BufferRange>;
//   transformFeedback?: TransformFeedback;
//   framebuffer?: Framebuffer;
//   targetTexture?: Texture;
// };

/**
 * Takes source and target buffers/textures and sets up the pipeline
 */
export class Transform {
  readonly device: Device;
  readonly model: Model;
  readonly transformFeedback: TransformFeedback;

  /** @deprecated Use device feature test. */
  static isSupported(device: Device): boolean {
    return device.features.has('transform-feedback-webgl2');
  }

  // bufferTransform: BufferTransform | null = null;
  // textureTransform: TextureTransform | null = null;
  elementIDBuffer: Buffer | null = null;

  constructor(device: Device, props: TransformProps = {}) {
    assert(device.features.has('transform-feedback-webgl2'), 'Device must support transform feedback');

    this.device = device;

    // this._buildResourceTransforms(props);

    // props = this._updateModelProps(props);

    this.model = new Model(this.device, {
      vs: props.vs,
      fs: props.fs || getPassthroughFS({version: getShaderInfo(props.vs).version}),
      id: props.id || 'transform-model',
      varyings: props.varyings,
      attributes: props.attributes,
      bufferLayout: props.bufferLayout,
      topology: props.topology || 'point-list',
      vertexCount:  props.vertexCount,
      defines: props.defines,
      modules: props.modules,
    });

    this.transformFeedback = this.device.createTransformFeedback({
      layout: this.model.pipeline.shaderLayout,
      buffers: props.feedbackBuffers,
    });

    this.model.setTransformFeedback(this.transformFeedback);

    // if (this.bufferTransform) {
    //   this.bufferTransform.setupResources({model: this.model});
    // }

    Object.seal(this);
  }

  /** Destroy owned resources. */
  destroy(): void {
    if (this.model) {
      this.model.destroy();
    }
    // if (this.bufferTransform) {
    //   this.bufferTransform.destroy();
    // }
    // if (this.textureTransform) {
    //   this.textureTransform.destroy();
    // }
  }

  /** Run one transform loop. */
  run(options?: TransformRunOptions): void {
    const {framebuffer, parameters, discard, uniforms} = options || {};
    // const {clearRenderTarget = true} = options || {};

    // const updatedOpts = this._updateDrawOptions(options);

    // if (clearRenderTarget && updatedOpts.framebuffer) {
    //  clear(this.device, {framebuffer: updatedOpts.framebuffer, color: true});
    // }

    const renderPass = this.device.beginRenderPass({framebuffer, parameters, discard});
    if (uniforms) this.model.setUniforms(uniforms);
    this.model.draw(renderPass);
    renderPass.end();
  }

  /** swap resources if a map is provided */
  swap(): void {
    // let swapped = false;
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    // for (const resourceTransform of resourceTransforms) {
    //   swapped = swapped || Boolean(resourceTransform?.swap());
    // }
    // assert(swapped, 'Nothing to swap');
    throw new Error('Not implemented');
  }

  /** Returns the {@link Buffer} or {@link BufferRange} for given varying name. */
  getBuffer(varyingName: string): Buffer | BufferRange | null {
    return this.transformFeedback.getBuffer(varyingName);
  }

  readAsync(varyingName: string): Promise<Uint8Array> {
    const result = this.getBuffer(varyingName);
    if (result instanceof Buffer) {
      return result.readAsync();
    }
    const {buffer, byteOffset = 0, byteLength = buffer.byteLength} = result;
    return buffer.readAsync(byteOffset, byteLength);
  }

  /**
   * Return data either from Buffer or from Texture.
   * @deprecated Prefer {@link readAsync}.
   */
  getData(options: {packed?: boolean; varyingName?: string} = {}) {
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    // for (const resourceTransform of resourceTransforms) {
    //   const data = resourceTransform?.getData(options);
    //   if (data) {
    //     return data;
    //   }
    // }
    // return null;
    throw new Error('Not implemented');
  }

  /** Return framebuffer object if rendering to textures */
  getFramebuffer(): Framebuffer | null {
    // return this.textureTransform?.getFramebuffer() || null;
    throw new Error('Not implemented');
  }

  /** Update some or all buffer/texture bindings. */
  update(props: TransformProps): void {
    // if (props.elementCount !== undefined) {
    //   this.model.setVertexCount(props.elementCount);
    // }
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    // for (const resourceTransform of resourceTransforms) {
    //   resourceTransform?.update(props);
    // }
    throw new Error('Not implemented');
  }

  // Private

  _updateModelProps(props: TransformProps): TransformProps {
    // const updatedProps: TransformProps = {...props};
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean) ;
    // for (const resourceTransform of resourceTransforms) {
    //   updatedProps = resourceTransform.updateModelProps(updatedProps);
    // }
    // return updatedProps;
    throw new Error('Not implemented');
  }

  // _buildResourceTransforms(props: TransformProps) {
  //   if (canCreateBufferTransform(props)) {
  //     this.bufferTransform = new BufferTransform(this.device, props);
  //   }
  //   if (canCreateTextureTransform(props)) {
  //     this.textureTransform = new TextureTransform(this.device, props);
  //   }
  //   assert(
  //     this.bufferTransform || this.textureTransform,
  //     'must provide source/feedback buffers or source/target textures'
  //   );
  // }

  // _updateDrawOptions(options: TransformRunOptions): TransformDrawOptions {
  //   const updatedOpts = {...options};
  //   const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean) ;
  //   for (const resourceTransform of resourceTransforms) {
  //     updatedOpts = Object.assign(updatedOpts, resourceTransform.getDrawOptions(updatedOpts));
  //   }
  //   return updatedOpts;
  // }
}

// Helper Methods

// function canCreateBufferTransform(props: TransformProps): boolean {
//   const canCreate =
//     (props.feedbackBuffers && !isObjectEmpty(props.feedbackBuffers)) ||
//     (props.feedbackMap && !isObjectEmpty(props.feedbackMap)) ||
//     (props.varyings && props.varyings.length > 0);
//   return Boolean(canCreate);
// }

// function canCreateTextureTransform(props: TransformProps): boolean {
//   const canCreate =
//     (props._sourceTextures && !isObjectEmpty(props._sourceTextures)) ||
//     props._targetTexture ||
//     props._targetTextureVarying;
//   return Boolean(canCreate);
// }
