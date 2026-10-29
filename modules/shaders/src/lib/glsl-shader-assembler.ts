// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderAssembler} from './shader-assembler-base';
import type {ShaderModule} from './shader-module/shader-module';
import type {AssembleShaderProps, GetUniformsFunc} from './shader-assembly/shader-assembly-types';
import {assembleGLSLShaderPair} from './shader-assembly/assemble-glsl-shaders';

/** Stateful assembler for GLSL vertex and fragment shaders. */
export class GLSLShaderAssembler extends ShaderAssembler {
  readonly shaderLanguage: 'glsl' = 'glsl';

  /**
   * Assemble a pair of shaders into a single shader program.
   * @param props GLSL vertex and fragment source, platform information, shader modules, defines, and injections.
   * @returns Assembled GLSL source, resolved modules, and combined uniform getter.
   */
  assembleGLSLShaderPair(props: AssembleShaderProps): {
    vs: string;
    fs: string;
    getUniforms: GetUniformsFunc;
    modules: ShaderModule[];
  } {
    const modules = this._getModuleList(props.modules); // Combine with default modules
    const hookFunctions = this._hookFunctions; // TODO - combine with default hook functions
    const vertex = this._transpileShader(props, modules, props.vs, 'vertex');
    const fragment = this._transpileShader(props, modules, props.fs, 'fragment');
    const assembled = assembleGLSLShaderPair({
      ...props,
      vs: vertex.code,
      fs: props.fs == null ? undefined : fragment.code,
      modules: vertex.modules,
      hookFunctions
    });

    return {...assembled, modules};
  }
}
