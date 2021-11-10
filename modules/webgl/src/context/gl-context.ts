// 
import type {GLContextOptions} from '@luma.gl/gltools';
import {createGLContext, isWebGL2} from '@luma.gl/gltools';
import {Device} from '@luma.gl/api';
import type {BufferProps, ShaderProps} from '@luma.gl/api';
import WEBGLBuffer from '../classes/webgl-buffer';
import {WEBGLShader, } from '../classes/webgl-shader';
import Texture2D, {Texture2DProps} from '../classes/texture-2d';

export default class GLContext extends Device {
  readonly gl: WebGLRenderingContext;
  readonly gl2: WebGL2RenderingContext | null;

  constructor(props: GLContextOptions) {
    super();
    this.gl = createGLContext(props);
    this.gl2 = isWebGL2(this.gl) ? this.gl as WebGL2RenderingContext : null;
  }

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
