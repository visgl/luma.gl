/*
import {
  isWebGL, isWebGL2,
  createGLContext,
  instrumentGLContext,
  getContextDebugInfo,
  resizeGLContext
} from '@luma.gl/gltools';

// prettier-ignore
import {
  Device, DeviceInfo, DeviceLimits,
  Buffer, BufferProps
} from '@luma.gl/api';

import {getWebGLDeviceInfo} from '../converters/webgl-device-info';
import {getWebGLLimits} from '../converters/webgl-limits';
import {getWebGLFeatures} from '../converters/webgl-features';

export default class WEBGLDevice implements Device {
  readonly handle: WebGLRenderingContext;
  readonly gl: WebGLRenderingContext;
  readonly gl2: WebGL2RenderingContext | null;
  readonly canvas: HTMLCanvasElement;

  static isSupported(options: {canvas?: HTMLCanvasElement}): boolean {
    const {canvas} = options;
    let gl;
    try {
      gl = canvas && canvas.getContext("webgl");
      gl = gl && canvas && canvas.getContext("experimental-webgl");
    } catch (x) {
      gl = null;
    }
    return Boolean(gl);
  }

  constructor(props = {}) {
    const {canvas, swapChainFormat = "bgra8unorm"} = props;

    const gl = createGLContext(props);
    this.handle =
    this.gl = gl;
    this.gl2 = gl instanceof WebGL2RenderingContext ? gl : null;
    this.canvas = canvas;
  }

  resize(width, height) {
    resizeGLContext(this.gl);
  }

  getInfo(): DeviceInfo {
    return getWebGLDeviceInfo(this.gl);
  }

  getLimits(): DeviceLimits {
    return getWebGLLimits(this.gl, this.gl2);
  }

  getFeatures(): string[] {
    return getWebGLFeatures(this.gl);
  }

  createBuffer(props: WebGPUBufferProps): WEBGLBuffer {
    return new WEBGLBuffer(this.gl2 || this.gl, props);
  }

  createTexture(props: WebGPUTextureProps): WEBGLTexture {
    return new WEBGLTexture(this, props);
  }

  createSampler(props: WebGPUSamplerProps): WEBGLSampler {
    return new WEBGLSampler(this, props);
  }

  createShader(props: WebGPUShaderProps): WEBGLShader {
    return new WEBGLShader(this, props);
  }

  createRenderPipeline(props: WebGPURenderPipelineProps): WEBGLPipeline {
    return new WEBGLRenderPipeline(this, props);
  }

  createComputePipeline(props: WebGPUComputePipelineProps): WebGPUPipeline {
    return new WebGPUComputePipeline(this, props);
  }


  // PRIVATE

  _startFrame() {}

  _endFrame() {}
}
*/
