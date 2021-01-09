// Returns a Magic Uniform Setter
export function getUniformSetter(
  gl: WebGLRenderingContext, location: number, info: object
): any;

export function parseUniformName(name: string): object;

/**
 * Basic checks of uniform values (with or without knowledge of program)
 * To facilitate early detection of e.g. undefined values in JavaScript
 */
export function checkUniformValues(uniforms: object, source?: string, uniformMap?: object): boolean;

/**
 * Creates a copy of the uniform
 */
export function copyUniform(uniforms: object, key: string, value: any): void;
