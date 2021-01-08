export const ERR_CONTEXT: string;
export const ERR_WEBGL: string;
export const ERR_WEBGL2: string;

/** Check if supplied parameter is a WebGLRenderingContext */
export function isWebGL(gl: any): boolean;

/** Check if supplied parameter is a WebGL2RenderingContext */
export function isWebGL2(gl: any): boolean;

/** Throw if supplied parameter is not a WebGLRenderingContext */
export function assertWebGLContext(gl: any): void;

/** Throw if supplied parameter is not a WebGL2RenderingContext */
export function assertWebGL2Context(gl: any): void;