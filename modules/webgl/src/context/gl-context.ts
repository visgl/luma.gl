// 
import type {CreateGLContextOptions} from '@luma.gl/gltools';
import {createGLContext, isWebGL2} from '@luma.gl/gltools';
import Buffer, {BufferProps} from '../classes/buffer';
import Texture2D, {Texture2DProps} from '../classes/texture-2d';

export default class GLContext {
  readonly gl: WebGLRenderingContext;
  readonly gl2: WebGL2RenderingContext | null;

  constructor(props: CreateGLContextOptions) {
    this.gl = createGLContext(props);
    this.gl2 = isWebGL2(this.gl) ? this.gl as WebGL2RenderingContext : null;
  }

  createBuffer(props: BufferProps): Buffer {
    return new Buffer(this.gl, props);
  }

  createTexture(props: Texture2DProps): Texture2D {
    return new Texture2D(this.gl, props);
  }
}
