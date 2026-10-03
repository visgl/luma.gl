// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, type AnimationProps, Model} from '@luma.gl/engine';
import {GLSLShaderAssembler, WGSLShaderAssembler, type ShaderModule} from '@luma.gl/shadertools';
import {slangTranspiler} from './slang-transpiler';
import shaderSource from './shader.slang?raw';
import paletteSource from './palette.slang?raw';

const palette: ShaderModule = {
  name: 'palette',
  sourceLanguage: 'slang',
  source: paletteSource
};

export default class SlangShadersExample extends AnimationLoopTemplate {
  static info =
    `<h3>Slang Shaders</h3><p>A single Slang shader and reusable palette module render this triangle on WebGL 2 and WebGPU.</p>`;

  readonly model: Model;

  constructor({device}: AnimationProps) {
    super();
    const shaderAssembler =
      device.info.shadingLanguage === 'wgsl'
        ? new WGSLShaderAssembler()
        : new GLSLShaderAssembler();
    // The application imports and registers its compiler on its own assembler.
    shaderAssembler.addShaderTranspiler(slangTranspiler);
    this.model = new Model(device, {
      id: 'slang-triangle',
      shaderAssembler,
      sourceLanguage: 'slang',
      source: shaderSource,
      vs: shaderSource,
      fs: shaderSource,
      vertexEntryPoint: 'vertexMain',
      fragmentEntryPoint: 'fragmentMain',
      modules: [palette],
      topology: 'triangle-list',
      vertexCount: 3,
      parameters: {depthWriteEnabled: true, depthCompare: 'less'}
    });
  }

  override onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.04, 0.06, 0.12, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.model.destroy();
  }
}
