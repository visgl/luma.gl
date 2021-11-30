// luma.gl, MIT license
import {WebGLDevice as WebGLDeviceBase} from '@luma.gl/gltools';
import type {BufferProps, ShaderProps} from '@luma.gl/api';
import WEBGLBuffer from '../classes/webgl-buffer';
import {WEBGLShader} from '../classes/webgl-shader';
import Texture2D, {Texture2DProps} from '../classes/texture-2d';

export default class WebGLDevice extends WebGLDeviceBase {
  /** Is this device attached to an offscreen context */
  offScreen: boolean = false;

  constructor(props) {
    super(props);
    this.offScreen =
      typeof OffscreenCanvas !== 'undefined' &&
      props.canvas instanceof OffscreenCanvas;
  }

  _createBuffer(props: BufferProps): WEBGLBuffer {
    return new WEBGLBuffer(this.gl, props);
  }

  createTexture(props: Texture2DProps): Texture2D {
    return new Texture2D(this.gl, props);
  }

  createShader(props: ShaderProps): WEBGLShader {
    return new WEBGLShader(this.gl, props);
  }

  commit(): void {
    // Offscreen Canvas Support: Commit the frame
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/commit
    // Chrome's offscreen canvas does not require gl.commit
    // @ts-expect-error gl.commit is not officially part of WebGLRenderingContext
    if (this.offScreen && this.gl.commit) {
      // @ts-expect-error gl.commit is not officially part of WebGLRenderingContext
      this.gl.commit();
    }
  }
}
