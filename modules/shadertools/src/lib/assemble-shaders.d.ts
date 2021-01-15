interface DefineMap {
  [define: string]: boolean | number
}

export type HookFunction = string | { hook: string; header: string; footer: string; } | {
  vs: string;
  fs: string;
};

export type AssembleShaderOptions = {
  id?: string;
  vs: string;
  fs: string;
  type?: any;
  modules?: any[];
  defines?: object;
  hookFunctions?: HookFunction[] | [string, string];
  inject?: object;
  transpileToGLSL100?: boolean;
  prologue?: boolean;
  log?: any;
};

export function assembleShaders(
  gl: WebGLRenderingContext,
  options: AssembleShaderOptions
): {
  gl: WebGLRenderingContext;
  vs: string;
  fs: string;
  getUniforms: any;
};
