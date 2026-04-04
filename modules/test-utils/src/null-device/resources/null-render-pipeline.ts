// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPipelineProps, Binding, RenderPass, VertexArray} from '@luma.gl/core';
import {RenderPipeline} from '@luma.gl/core';

import type {NullDevice} from '../null-device';
import {NullShader} from './null-shader';

/** Creates a new render pipeline */
export class NullRenderPipeline extends RenderPipeline {
  device: NullDevice;
  readonly handle = null;

  vs: NullShader;
  fs: NullShader;

  constructor(device: NullDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;

    this.vs = props.vs as NullShader;
    this.fs = props.fs as NullShader;

    this.shaderLayout = props.shaderLayout || {
      attributes: [],
      bindings: [],
      uniforms: []
    };
  }

  draw(options: {
    renderPass: RenderPass;
    vertexArray: VertexArray;
    vertexCount?: number;
    instanceCount?: number;
    bindings?: Record<string, Binding>;
    uniforms?: Record<string, unknown>;
  }): boolean {
    const {renderPass, vertexArray} = options;
    vertexArray.bindBeforeRender(renderPass);
    vertexArray.unbindAfterRender(renderPass);
    return true;
  }
}
