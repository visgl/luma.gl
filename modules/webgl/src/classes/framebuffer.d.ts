import Resource, {ResourceProps} from './resource';

export type FramebufferProps = ResourceProps & {
  width?: number;
  height?: number;
  attachments?: any;
  color?: boolean;
  depth?: boolean;
  stencil?: boolean;
  check?: boolean;
  readBuffer?: any;
  drawBuffers?: any;
}

/**
 * Framebuffers hold a collection of Texture and Renderbuffer attachments.
 * Framebuffers allow rendering to non-Default Framebuffer locations
 * without disturbing the main screen.
*/
export default class Framebuffer extends Resource {
  static readonly STATUS: number[];

  readonly handle: WebGLFramebuffer;
  readonly width: number;
  readonly height: number;
  readonly attachments: any[];

  /**
   * Support
   * @param gl
   * @param options.colorBufferFloat  Whether floating point textures can be rendered and read
   * @param options.colorBufferHalfFloat Whether half float textures can be rendered and read
   */
  static isSupported(
    gl: WebGLRenderingContext,
    options?: {
      colorBufferFloat: any;
      colorBufferHalfFloat: any;
    }
  ): boolean;

  /** returns the default Framebuffer */
  static getDefaultFramebuffer(gl: WebGLRenderingContext): Framebuffer;

  get MAX_COLOR_ATTACHMENTS(): any;
  get MAX_DRAW_BUFFERS(): any;
  get color(): any;
  get texture(): any;
  get depth(): any;
  get stencil(): any;

  constructor(gl: WebGLRenderingContext, props?: FramebufferProps);

  initialize(options?: FramebufferProps): this;

  // @ts-ignore
  delete(): void;

  resize(size?: {width: any; height: any}): this;

  update(options?: {
    attachments?: {};
    readBuffer: any;
    drawBuffers: any;
    clearAttachments?: boolean;
    resizeAttachments?: boolean;
  }): this;

  attach(
    attachments: any,
    options?: {
      clearAttachments?: boolean;
      resizeAttachments?: boolean;
    }
  ): this;

  checkStatus(): this;
  getStatus(): any;
  clear(options?: {color?: any; depth?: any; stencil?: any; drawBuffers?: any[]}): this;
  readPixels(opts?: {}): any;
  readPixelsToBuffer(opts?: {}): any;
  copyToDataUrl(opts?: {}): any;
  copyToImage(opts?: {}): any;
  copyToTexture(opts?: {}): any;
  blit(opts?: {}): any;
  invalidate(options: {attachments?: any[]; x?: number; y?: number; width: any; height: any}): this;
  getAttachmentParameter(attachment: any, pname: any, keys: any): any;
  getAttachmentParameters(attachment: any, keys: any, parameters?: any): {};
  getParameters(keys?: boolean): {};
  show(): this;
  log(logLevel?: number, message?: string): this;
  bind({target}?: {target?: any}): this;
  unbind({target}?: {target?: any}): this;
}

export const FRAMEBUFFER_ATTACHMENT_PARAMETERS: any[];
