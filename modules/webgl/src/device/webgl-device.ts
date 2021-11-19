// luma.gl, MIT license
import {WebGLDevice as WebGLDeviceBase} from '@luma.gl/gltools';
import type {BufferProps, ShaderProps} from '@luma.gl/api';
import WEBGLBuffer from '../classes/webgl-buffer';
import {WEBGLShader} from '../classes/webgl-shader';
import Texture2D, {Texture2DProps} from '../classes/texture-2d';

export default class WebGLDevice extends WebGLDeviceBase {
  createBuffer(props: BufferProps): WEBGLBuffer {
    return new WEBGLBuffer(this.gl, props);
  }

  createTexture(props: Texture2DProps): Texture2D {
    return new Texture2D(this.gl, props);
  }

  createShader(props: ShaderProps): WEBGLShader {
    return new WEBGLShader(this.gl, props);
  }
}
