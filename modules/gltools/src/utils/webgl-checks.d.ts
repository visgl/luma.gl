export const ERR_WEBGL: string;
export const ERR_WEBGL2: string;

/** Check if supplied parameter is a WebGLRenderingContext */
export function isWebGL(gl: any): boolean;

/** Check if supplied parameter is a WebGL2RenderingContext */
export function isWebGL2(gl: any): boolean;

/** Returns a properly typed WebGL2RenderingContext from a WebGL1 context, or null */
export function getWebGL2Context(gl: WebGLRenderingContext): WebGL2RenderingContext | null;

/** Throw if supplied parameter is not a WebGLRenderingContext, otherwise return properly typed value */
export function assertWebGLContext(gl: any): WebGLRenderingContext;

/** Throw if supplied parameter is not a WebGL2RenderingContext, otherwise return properly typed value */
export function assertWebGL2Context(gl: any): WebGL2RenderingContext;
