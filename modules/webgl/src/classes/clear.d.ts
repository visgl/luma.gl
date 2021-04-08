import Framebuffer from './framebuffer';

export function clear(
  gl: WebGLRenderingContext,
  options?: {framebuffer?: Framebuffer; color?: any; depth?: any; stencil?: any}
): void;

export function clearBuffer(
  gl: any,
  options?: {framebuffer?: Framebuffer; buffer?: any; drawBuffer?: any; value?: any}
);
