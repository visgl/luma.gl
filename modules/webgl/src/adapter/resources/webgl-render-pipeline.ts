// prettier-ignore
import type {RenderPipelineProps, Parameters, RenderPass, Buffer, Binding} from '@luma.gl/api';
import {RenderPipeline, cast, log} from '@luma.gl/api';
import WebGLDevice from '../webgl-device';
import WEBGLShader from './webgl-shader';

const LOG_PROGRAM_PERF_PRIORITY = 4;

/** Creates a new render pipeline */
export default class WEBGLRenderPipeline extends RenderPipeline {
  device: WebGLDevice;
  handle: WebGLProgram;
  vs: WEBGLShader;
  fs: WEBGLShader;
  parameters: Parameters;

  constructor(device: WebGLDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle || this.device.gl.createProgram();
    // @ts-expect-error
    this.handle.__SPECTOR_Metadata = {id: this.props.id};
    this.parameters = this.props.parameters;

    // Create shaders if needed
    this.vs = cast<WEBGLShader>(props.vs);
    this.fs = cast<WEBGLShader>(props.fs);
    // assert(this.vs.stage === 'vertex');
    // assert(this.fs.stage === 'fragment');
  }

  destroy(): void {
    if (this.handle) {
      this.device.gl.deleteProgram(this.handle);
      this.handle = null;
    }
  }

  /** @todo needed for portable model */
  setAttributes(attributes: Record<string, Buffer>): void {
    throw new Error('Not implemented');
  }

  /** @todo needed for portable model */
  setBindings(bindings: Record<string, Binding>): void {
    throw new Error('Not implemented');
  }

  /** @todo needed for portable model */
  draw(options: {
    renderPass?: RenderPass;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    firstVertex?: number;
    firstIndex?: number;
    firstInstance?: number;
    baseVertex?: number;
  }): void {
    throw new Error('Not implemented');
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
}
