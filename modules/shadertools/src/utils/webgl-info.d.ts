export const FEATURES: {
  GLSL_FRAG_DATA: [string, boolean];
  GLSL_FRAG_DEPTH: [string, boolean];
  GLSL_DERIVATIVES: [string, boolean];
  GLSL_TEXTURE_LOD: [string, boolean];
};

export function getContextInfo(
  gl: WebGLRenderingContext
): {
  gpuVendor: string;
  vendor: any;
  renderer: any;
  version: any;
  shadingLanguageVersion: any;
};

export function canCompileGLGSExtension(gl: WebGLRenderingContext, cap: any, opts?: {}): any;

export function hasFeatures(gl: WebGLRenderingContext, features: any): any;
