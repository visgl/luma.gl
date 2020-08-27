import Resource from "@luma.gl/webgl/classes/resource";
export default class Framebuffer extends Resource {
  readonly width: number;
  readonly height: number;

  static isSupported(
    gl: WebGLRenderingContext,
    options?: {
      colorBufferFloat: any;
      colorBufferHalfFloat: any;
    }
  ): boolean;
  static getDefaultFramebuffer(gl: WebGLRenderingContext): any;
  get MAX_COLOR_ATTACHMENTS(): any;
  get MAX_DRAW_BUFFERS(): any;
  constructor(gl: WebGLRenderingContext, opts?: {});
  get color(): any;
  get texture(): any;
  get depth(): any;
  get stencil(): any;
  initialize(options?: {
    width?: number;
    height?: number;
    attachments?: any;
    color?: boolean;
    depth?: boolean;
    stencil?: boolean;
    check?: boolean;
    readBuffer: any;
    drawBuffers: any;
  }): void;
  // @ts-ignore
  delete(): void;
  update(options?: {
    attachments?: {};
    readBuffer: any;
    drawBuffers: any;
    clearAttachments?: boolean;
    resizeAttachments?: boolean;
  }): this;
  resize(options?: { width: any; height: any }): this;
  attach(
    attachments: any,
    options?: {
      clearAttachments?: boolean;
      resizeAttachments?: boolean;
    }
  ): void;
  checkStatus(): this;
  getStatus(): any;
  clear(options?: {
    color?: any;
    depth?: any;
    stencil?: any;
    drawBuffers?: any[];
  }): this;
  readPixels(opts?: {}): any;
  readPixelsToBuffer(opts?: {}): any;
  copyToDataUrl(opts?: {}): any;
  copyToImage(opts?: {}): any;
  copyToTexture(opts?: {}): any;
  blit(opts?: {}): any;
  invalidate(options: {
    attachments?: any[];
    x?: number;
    y?: number;
    width: any;
    height: any;
  }): this;
  getAttachmentParameter(attachment: any, pname: any, keys: any): any;
  getAttachmentParameters(attachment: any, keys: any, parameters?: any): {};
  getParameters(keys?: boolean): {};
  show(): this;
  log(logLevel?: number, message?: string): this;
  bind({ target }?: { target?: any }): this;
  unbind({ target }?: { target?: any }): this;
}

export const FRAMEBUFFER_ATTACHMENT_PARAMETERS: any[];
