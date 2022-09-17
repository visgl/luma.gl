/**
 * Sets any GL parameter regardless of function (gl.blendMode, ...)
 */
export function setParameters(gl: WebGLRenderingContext, values: object): void;

/**
 * Reads the entire WebGL state from a context
 *
 * Caveat: This can generates a huge amount of synchronous driver roundtrips and should be
 * considered a very slow operation, to be used only if/when a context already manipulated
 * by external code needs to be synchronized for the first time
 * @returns - a newly created map, with values keyed by GL parameters
 */
export function getParameters(gl: WebGLRenderingContext, parameters?: object): object;
export function getParameters(gl: WebGLRenderingContext, parameters: number): any;

/*
 * Reset all parameters to a (almost) pure context state

 * viewport and scissor will be set to the values in GL_PARAMETER_DEFAULTS,
 * NOT the canvas size dimensions, so they will have to be properly set after
 * calling this function.
 */
export function resetParameters(gl: WebGLRenderingContext): void;

/**
 * Execute a function with a set of temporary WebGL parameter overrides
 * - Saves current "global" WebGL context settings
 * - Sets the supplies WebGL context parameters,
 * - Executes supplied function
 * - Restores parameters
 * - Returns the return value of the supplied function
 */
export function withParameters(gl: WebGLRenderingContext, parameters: object, func: any): any;
