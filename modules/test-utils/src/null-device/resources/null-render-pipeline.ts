// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UniformValue, RenderPipelineProps, Binding} from '@luma.gl/core';
import type {RenderPass, VertexArray} from '@luma.gl/core';
import {RenderPipeline, cast} from '@luma.gl/core';

import type {NullDevice} from '../null-device';
import {NullShader} from './null-shader';

/** Creates a new render pipeline */
export class NullRenderPipeline extends RenderPipeline {
  device: NullDevice;
  vs: NullShader;
  fs: NullShader;

  uniforms: Record<string, UniformValue> = {};
  bindings: Record<string, Binding> = {};

  constructor(device: NullDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;

    this.vs = cast<NullShader>(props.vs);
    this.fs = cast<NullShader>(props.fs);

    this.shaderLayout = props.shaderLayout || {
      attributes: [],
      bindings: [],
      uniforms: []
    };
  }

  setBindings(bindings: Record<string, Binding>): void {
    Object.assign(this.bindings, bindings);
  }

  override setUniformsWebGL(uniforms: Record<string, UniformValue>): void {
    Object.assign(this.uniforms, uniforms);
  }

  draw(options: {
    renderPass: RenderPass;
    vertexArray: VertexArray;
    vertexCount?: number;
    instanceCount?: number;
  }): boolean {
    const {renderPass, vertexArray} = options;
    vertexArray.bindBeforeRender(renderPass);
    vertexArray.unbindAfterRender(renderPass);
    return true;
  }
}
