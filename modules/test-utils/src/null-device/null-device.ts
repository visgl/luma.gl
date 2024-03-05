// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DeviceProps,
  CanvasContextProps,
  TextureFormat,
  VertexArray,
  VertexArrayProps
} from '@luma.gl/core';
import {Device, CanvasContext, uid, DeviceFeatures} from '@luma.gl/core';

import type {
  BufferProps,
  ShaderProps,
  SamplerProps,
  TextureProps,
  ExternalTexture,
  ExternalTextureProps,
  FramebufferProps,
  RenderPipelineProps,
  ComputePipeline,
  ComputePipelineProps,
  RenderPassProps,
  ComputePass,
  ComputePassProps,
  CommandEncoderProps,
  TransformFeedbackProps,
  QuerySetProps
} from '@luma.gl/core';

import {NullDeviceInfo} from './null-device-info';
import {NullDeviceLimits} from './null-device-features';
import {NullCanvasContext} from './null-canvas-context';
import {NullBuffer} from './resources/null-buffer';
import {NullFramebuffer} from './resources/null-framebuffer';
import {NullShader} from './resources/null-shader';
import {NullCommandEncoder} from './resources/null-command-buffer';
import {NullSampler} from './resources/null-sampler';
import {NullTexture} from './resources/null-texture';
import {NullRenderPass} from './resources/null-render-pass';
import {NullRenderPipeline} from './resources/null-render-pipeline';
import {NullVertexArray} from './resources/null-vertex-array';
import {NullTransformFeedback} from './resources/null-transform-feedback';
import {NullQuerySet} from './resources/null-query-set';

/** Do-nothing device implementation for testing */
export class NullDevice extends Device {
  static type: string = 'webgl';

  static isSupported(): boolean {
    return true;
  }

  readonly type = 'webgl';
  features: DeviceFeatures = new DeviceFeatures();
  limits: NullDeviceLimits = new NullDeviceLimits();
  readonly info = NullDeviceInfo;

  readonly canvasContext: NullCanvasContext;
  readonly lost: Promise<{reason: 'destroyed'; message: string}>;

  static async create(props: DeviceProps = {}): Promise<NullDevice> {
    // Wait for page to load: if canvas is a string we need to query the DOM for the canvas element.
    // We only wait when props.canvas is string to avoids setting the global page onload callback unless necessary.
    if (typeof props.canvas === 'string') {
      await CanvasContext.pageLoaded;
    }

    return new NullDevice(props);
  }

  constructor(props: DeviceProps) {
    super({...props, id: props.id || uid('dummy-device')});

    this.canvasContext = new NullCanvasContext(this, props);
    this.lost = new Promise(resolve => {});
    this.canvasContext.resize();
  }

  /**
   * Destroys the context
   * @note Has no effect for WebGL browser contexts, there is no browser API for destroying contexts
   */
  destroy(): void {}

  get isLost(): boolean {
    return false;
  }

  getSize(): [number, number] {
    return [this.canvasContext.width, this.canvasContext.height];
  }

  isTextureFormatSupported(format: TextureFormat): boolean {
    return true;
  }

  isTextureFormatFilterable(format: TextureFormat): boolean {
    return true;
  }

  isTextureFormatRenderable(format: TextureFormat): boolean {
    return true;
  }

  // IMPLEMENTATION OF ABSTRACT DEVICE

  createCanvasContext(props: CanvasContextProps): NullCanvasContext {
    return new NullCanvasContext(this, props);
  }

  createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): NullBuffer {
    const newProps = this._getBufferProps(props);
    return new NullBuffer(this, newProps);
  }

  getDefaultRenderPass(): NullRenderPass {
    return new NullRenderPass(this, {});
  }

  _createTexture(props: TextureProps): NullTexture {
    return new NullTexture(this, props);
  }

  createExternalTexture(props: ExternalTextureProps): ExternalTexture {
    throw new Error('createExternalTexture() not implemented'); // return new Program(props);
  }

  createSampler(props: SamplerProps): NullSampler {
    return new NullSampler(this, props);
  }

  createShader(props: ShaderProps): NullShader {
    return new NullShader(this, props);
  }

  createFramebuffer(props: FramebufferProps): NullFramebuffer {
    return new NullFramebuffer(this, props);
  }

  createVertexArray(props: VertexArrayProps): VertexArray {
    return new NullVertexArray(this, props);
  }

  createTransformFeedback(props: TransformFeedbackProps): NullTransformFeedback {
    return new NullTransformFeedback(this, props);
  }

  createQuerySet(props: QuerySetProps): NullQuerySet {
    return new NullQuerySet(this, props);
  }

  createRenderPipeline(props: RenderPipelineProps): NullRenderPipeline {
    return new NullRenderPipeline(this, props);
  }

  beginRenderPass(props: RenderPassProps): NullRenderPass {
    return new NullRenderPass(this, props);
  }

  createComputePipeline(props?: ComputePipelineProps): ComputePipeline {
    throw new Error('ComputePipeline not supported in WebGL');
  }

  beginComputePass(props: ComputePassProps): ComputePass {
    throw new Error('ComputePass not supported in WebGL');
  }

  override createCommandEncoder(props: CommandEncoderProps = {}): NullCommandEncoder {
    return new NullCommandEncoder(this, props);
  }

  submit(): void {}

  override setParametersWebGL(parameters: any): void {}

  override getParametersWebGL(parameters: any): any {}

  override withParametersWebGL(parameters: any, func: any): any {
    const {nocatch = true} = parameters;
    let value: any;
    if (nocatch) {
      // Avoid try catch to minimize stack size impact for safe execution paths
      return func();
    }
    // Wrap in a try-catch to ensure that parameters are restored on exceptions
    try {
      value = func();
    } catch {
      // ignore
    }
    return value;
  }
}
