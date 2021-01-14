export type HookFunction = {
  vs: string;
  fs: string;
};

export type AssembleShaderOptions = {
  id: string;
  source: any;
  type: any;
  modules: any[];
  defines?: object;
  hookFunctions?: HookFunction[];
  inject?: object;
  transpileToGLSL100?: boolean;
  prologue?: boolean;
  log: any;
};

export function assembleShaders(
  gl: WebGLRenderingContext,
  opts: AssembleShaderOptions
): {
  gl: WebGLRenderingContext;
  vs: string;
  fs: string;
  getUniforms: any;
};
