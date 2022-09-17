import Resource, {ResourceProps} from './resource';

export type RenderbufferProps = ResourceProps & {
  format: number;
  width?: number;
  height?: number;
  samples?: number;
};

/**
 * Renderbuffers are GPU objects that contain images. 
 * In contrast to Textures they are optimized for use as render targets, with Framebuffers.
 * while Textures may not be, and are the logical choice when
 * you do not need to sample (i.e. in a post-pass shader) 
 * from the produced image. If you need to resample 
 * (such as when reading depth back in a second shader pass), 
 * use Textures instead. 
 * Renderbuffer objects also natively accommodate Multisampling (MSAA).
 */
export default class Renderbuffer extends Resource {
  static isSupported(gl: WebGLRenderingContext, options?: {format?: number}): boolean;
  static getSamplesForFormat(gl: WebGLRenderingContext, options: {format: number}): number;

  readonly width: number;
  readonly height: number;
  readonly format: number;

  constructor(gl: WebGLRenderingContext, props: RenderbufferProps);

  /** Creates and initializes a renderbuffer object's data store */
  initialize(props: Renderbuffer): this;

  resize(size: {width: number, height: number}): this;
}
