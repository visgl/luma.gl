export default function formatGLSLCompilerError(errLog: any, src: any, shaderType: any): string;

/**
 * Parse a GLSL compiler error log into a string showing the source code around each error.
 * Based on https://github.com/wwwtyro/gl-format-compiler-error (public domain)
 */
export function parseGLSLCompilerError(
  errLog: any,
  src: any,
  shaderType: any,
  shaderName: any
): {
  shaderName: string;
  errors: string;
  warnings: string;
};
