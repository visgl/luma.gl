// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Device, Buffer, Texture, Framebuffer} from '@luma.gl/core';
import {Device, Framebuffer, Texture, TransformFeedback, assert, isObjectEmpty} from '@luma.gl/core';
import {GLParameters} from '@luma.gl/constants';
// import {getShaderInfo, getPassthroughFS} from '@luma.gl/shadertools';
// import {GL} from '@luma.gl/constants';
// import {Model} from '../model/model';

// import {AccessorObject} from '@luma.gl/webgl';
// import {default as TransformFeedback} from '../classic/transform-feedback';
// import BufferTransform from './buffer-transform';
// import TextureTransform from './texture-transform';

type TransformFeedback = any;

// import {WebGLDevice, GLParameters} from '@luma.gl/webgl';
// import {AccessorObject} from '@luma.gl/webgl';

<<<<<<<< HEAD:wip/modules-wip/webgl-legacy/src/transform/transform.ts
import {clear} from '../classic/clear';
import type Buffer from '../classic/buffer';
import {default as Texture2D} from '../classic/texture-2d';
import {default as TransformFeedback} from '../classic/transform-feedback';
import Model from '../engine/classic-model';
import BufferTransform from './buffer-transform';
import TextureTransform from './texture-transform';
========
import type {ClassicBuffer as Buffer, } from '@luma.gl/webgl';
import {Model} from '../lib/model';
import {BufferTransform} from './buffer-transform';
import {TextureTransform} from './texture-transform';
>>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/engine/src/transform/transform.ts
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)

/** Properties for creating Transforms */
export type TransformProps = {
  id?: string;
  vs?: string;
  elementCount?: number;
  sourceBuffers?: Record<string, Buffer>;
  feedbackBuffers?: Record<string, string | Buffer | {buffer: Buffer; byteOffset?: number}>;
  varyings?: string[];
  feedbackMap?: Record<string, string>;
  modules?: object[]; // TODO use ShaderModule type
  attributes?: Record<string, any>;
  uniforms?: Record<string, any>;
  defines?: Record<string, any>
  parameters?: GLParameters;
  discard?: boolean;
  isIndexed?: boolean;
  inject?: Record<string, string>;
  drawMode?: number;
  framebuffer?: Framebuffer;
  _sourceTextures?: Record<string, Texture>;
  _targetTexture?: string | Texture;
  _targetTextureVarying?: string;
  _swapTexture?: string | null;
  _fs?: string;
  fs?: string;
};

/** Options that can be provided when running a Transform */
export type TransformRunOptions = {
  framebuffer?: Framebuffer;
  clearRenderTarget?: boolean;
  uniforms?: Record<string, any>;
  parameters?: Record<string, any>;
  discard?: boolean;
};

/** Options that control drawing a Transform. Used by subclasses to return draw parameters */
export type TransformDrawOptions = {
  attributes?: Record<string, any>;
  framebuffer?: any;
  uniforms?: object;
  discard?: boolean;
  parameters?: object;
  transformFeedback?: any;
};

export type TransformBinding = {
  sourceBuffers: Record<string, Buffer>;
  sourceTextures: Record<string, Texture>;
  feedbackBuffers?: Record<string, Buffer | {buffer: Buffer}>;
  transformFeedback?: TransformFeedback;
  framebuffer?: Framebuffer;
  targetTexture?: Texture;
};

/**
 * Takes source and target buffers/textures and sets up the pipeline
 */
export class Transform {
  /**
   * Check if Transforms are supported (they are not under WebGL1)
   * @todo differentiate writing to buffer vs not
   */
  static isSupported(device: Device | WebGLRenderingContext): boolean {
<<<<<<< HEAD
    // try {
    //   const webglDevice = WebGLDevice.attach(device);
    //   return webglDevice.isWebGL2;
    // } catch {
    //   return false;
    // }
    return false;
  }

  readonly device: Device;
  readonly gl: WebGL2RenderingContext;
  // model: Model;
  elementCount = 0;
  // bufferTransform: BufferTransform | null = null;
  // textureTransform: TextureTransform | null = null;
  elementIDBuffer: Buffer | null = null;

  constructor(device: Device | WebGLRenderingContext, props: TransformProps = {}) {
    /*
=======
    try {
      const webglDevice = WebGLDevice.attach(device);
      return webglDevice.isWebGL2;
    } catch {
      return false;
    }
  }

  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  model: Model;
  elementCount = 0;
  bufferTransform: BufferTransform | null = null;
  textureTransform: TextureTransform | null = null;
  elementIDBuffer: Buffer | null = null;

  constructor(device: Device | WebGLRenderingContext, props: TransformProps = {}) {
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
    this.device = WebGLDevice.attach(device);
    // TODO assert webgl2?
    this.gl = this.device.gl2;
    this._buildResourceTransforms(props);

    props = this._updateModelProps(props);
    // @ts-expect-error TODO this is valid type error for params
    this.model = new Model(this.device, {
      ...props,
      fs: props.fs || getPassthroughFS({version: getShaderInfo(props.vs).version}),
      id: props.id || 'transform-model',
      drawMode: props.drawMode || GL.POINTS,
      vertexCount: props.elementCount
    });

<<<<<<< HEAD
    // if (this.bufferTransform) {
    //   this.bufferTransform.setupResources({model: this.model});
    // }
    Object.seal(this);
    */
=======
    if (this.bufferTransform) {
      this.bufferTransform.setupResources({model: this.model});
    }
    Object.seal(this);
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
  }

  /** Delete owned resources. */
  destroy(): void {
<<<<<<< HEAD
    // if (this.model) {
    //   this.model.destroy();
    // }
    // if (this.bufferTransform) {
    //   this.bufferTransform.destroy();
    // }
    // if (this.textureTransform) {
    //   this.textureTransform.destroy();
    // }
=======
    if (this.model) {
      this.model.destroy();
    }
    if (this.bufferTransform) {
      this.bufferTransform.destroy();
    }
    if (this.textureTransform) {
      this.textureTransform.destroy();
    }
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
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
<<<<<<< HEAD
      // clear(this.device, {framebuffer: updatedOpts.framebuffer, color: true});
    }

    // this.model.transform(updatedOpts);
=======
      clear(this.device, {framebuffer: updatedOpts.framebuffer, color: true});
    }

    this.model.transform(updatedOpts);
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
  }

  /** swap resources if a map is provided */
  swap(): void {
<<<<<<< HEAD
    // let swapped = false;
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    // for (const resourceTransform of resourceTransforms) {
    //   swapped = swapped || Boolean(resourceTransform?.swap());
    // }
    // assert(swapped, 'Nothing to swap');
=======
    let swapped = false;
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      swapped = swapped || Boolean(resourceTransform?.swap());
    }
    assert(swapped, 'Nothing to swap');
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
  }

  /** Return Buffer object for given varying name. */
  getBuffer(varyingName: string): Buffer | null {
<<<<<<< HEAD
    // return this.bufferTransform && this.bufferTransform.getBuffer(varyingName);
    return null;
=======
    return this.bufferTransform && this.bufferTransform.getBuffer(varyingName);
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
  }

  /** Return data either from Buffer or from Texture */
  getData(options: {packed?: boolean; varyingName?: string} = {}) {
<<<<<<< HEAD
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    // for (const resourceTransform of resourceTransforms) {
    //   const data = resourceTransform?.getData(options);
    //   if (data) {
    //     return data;
    //   }
    // }
    // return null;
=======
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      const data = resourceTransform?.getData(options);
      if (data) {
        return data;
      }
    }
    return null;
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
  }

  /** Return framebuffer object if rendering to textures */
  getFramebuffer(): Framebuffer | null {
<<<<<<< HEAD
    // return this.textureTransform?.getFramebuffer() || null;
    return null;
=======
    return this.textureTransform?.getFramebuffer() || null;
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
  }

  /** Update some or all buffer/texture bindings. */
  update(props: TransformProps): void {
<<<<<<< HEAD
    // if (props.elementCount !== undefined) {
    //   this.model.setVertexCount(props.elementCount);
    // }
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    // for (const resourceTransform of resourceTransforms) {
    //   resourceTransform?.update(props);
    // }
=======
    if (props.elementCount !== undefined) {
      this.model.setVertexCount(props.elementCount);
    }
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean);
    for (const resourceTransform of resourceTransforms) {
      resourceTransform?.update(props);
    }
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
  }

  // Private

  _updateModelProps(props: TransformProps): TransformProps {
<<<<<<< HEAD
    const updatedProps: TransformProps = {...props};
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean) ;
    // for (const resourceTransform of resourceTransforms) {
    //   updatedProps = resourceTransform.updateModelProps(updatedProps);
    // }
=======
    let updatedProps: TransformProps = {...props};
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean) ;
    for (const resourceTransform of resourceTransforms) {
      updatedProps = resourceTransform.updateModelProps(updatedProps);
    }
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
    return updatedProps;
  }

  _buildResourceTransforms(props: TransformProps) {
<<<<<<< HEAD
    // if (canCreateBufferTransform(props)) {
    //   this.bufferTransform = new BufferTransform(this.device, props);
    // }
    // if (canCreateTextureTransform(props)) {
    //   this.textureTransform = new TextureTransform(this.device, props);
    // }
    // assert(
    //   this.bufferTransform || this.textureTransform,
    //   'must provide source/feedback buffers or source/target textures'
    // );
  }

  _updateDrawOptions(options: TransformRunOptions): TransformDrawOptions {
    const updatedOpts = {...options};
    // const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean) ;
    // for (const resourceTransform of resourceTransforms) {
    //   updatedOpts = Object.assign(updatedOpts, resourceTransform.getDrawOptions(updatedOpts));
    // }
=======
    if (canCreateBufferTransform(props)) {
      this.bufferTransform = new BufferTransform(this.device, props);
    }
    if (canCreateTextureTransform(props)) {
      this.textureTransform = new TextureTransform(this.device, props);
    }
    assert(
      this.bufferTransform || this.textureTransform,
      'must provide source/feedback buffers or source/target textures'
    );
  }

  _updateDrawOptions(options: TransformRunOptions): TransformDrawOptions {
    let updatedOpts = {...options};
    const resourceTransforms = [this.bufferTransform, this.textureTransform].filter(Boolean) ;
    for (const resourceTransform of resourceTransforms) {
      updatedOpts = Object.assign(updatedOpts, resourceTransform.getDrawOptions(updatedOpts));
    }
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
    return updatedOpts;
  }
}

// Helper Methods

<<<<<<< HEAD
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
=======
function canCreateBufferTransform(props: TransformProps): boolean {
  const canCreate =
    (props.feedbackBuffers && !isObjectEmpty(props.feedbackBuffers)) ||
    (props.feedbackMap && !isObjectEmpty(props.feedbackMap)) ||
    (props.varyings && props.varyings.length > 0);
  return Boolean(canCreate);
}

function canCreateTextureTransform(props: TransformProps): boolean {
  const canCreate =
    (props._sourceTextures && !isObjectEmpty(props._sourceTextures)) ||
    props._targetTexture ||
    props._targetTextureVarying;
  return Boolean(canCreate);
}
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects)
