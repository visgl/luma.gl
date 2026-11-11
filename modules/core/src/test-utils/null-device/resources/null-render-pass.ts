// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Bindings,
  BindingsByGroup,
  Buffer,
  RenderBundle,
  RenderPassBindingOptions,
  RenderPassDrawOptions,
  RenderPipeline,
  VertexArray
} from '@luma.gl/core';
import {RenderPass, RenderPassProps, RenderPassParameters} from '@luma.gl/core';
import {NullDevice} from '../null-device';

export class NullRenderPass extends RenderPass {
  readonly device: NullDevice;
  readonly handle = null;
  private parameters: Required<RenderPassParameters>;
  pipeline: RenderPipeline | null = null;
  bindings: Bindings | BindingsByGroup = {};
  vertexArray: VertexArray | null = null;

  constructor(device: NullDevice, props: RenderPassProps) {
    super(device, props);
    this.device = device;
    this.parameters = {
      viewport: [0, 0, props.framebuffer?.width ?? 1, props.framebuffer?.height ?? 1, 0, 1],
      scissorRect: null,
      blendConstant: [0, 0, 0, 0],
      stencilReference: 0
    };
    this.setParameters(props.parameters);
  }

  end(): void {
    if (this.destroyed) {
      return;
    }
    this.destroy();
  }

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup(): void {}
  insertDebugMarker(markerLabel: string): void {}

  setParameters(parameters: RenderPassParameters = {}): void {
    this.parameters = {
      viewport: parameters.viewport ?? this.parameters.viewport,
      scissorRect:
        parameters.scissorRect === undefined ? this.parameters.scissorRect : parameters.scissorRect,
      blendConstant: parameters.blendConstant ?? this.parameters.blendConstant,
      stencilReference: parameters.stencilReference ?? this.parameters.stencilReference
    };
    this.parameters = this.getParameters();
  }

  override getParameters(): Required<RenderPassParameters> {
    return {
      viewport: [...this.parameters.viewport],
      scissorRect: this.parameters.scissorRect ? [...this.parameters.scissorRect] : null,
      blendConstant: [...this.parameters.blendConstant],
      stencilReference: this.parameters.stencilReference
    };
  }

  setPipeline(pipeline: RenderPipeline): void {
    this.pipeline = pipeline;
  }

  setBindings(bindings: Bindings | BindingsByGroup, _options?: RenderPassBindingOptions): void {
    if (!this.pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before setBindings()');
    }
    this.bindings = bindings;
  }

  setVertexArray(vertexArray: VertexArray): void {
    this.vertexArray = vertexArray;
  }

  draw(_options: RenderPassDrawOptions): boolean {
    if (!this.pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before draw()');
    }
    this.vertexArray?.bindBeforeRender(this);
    this.vertexArray?.unbindAfterRender(this);
    return true;
  }

  drawIndirect(_indirectBuffer: Buffer, _indirectByteOffset: number = 0): void {
    throw new Error('Indirect drawing is only supported in WebGPU');
  }

  drawIndexedIndirect(_indirectBuffer: Buffer, _indirectByteOffset: number = 0): void {
    throw new Error('Indirect drawing is only supported in WebGPU');
  }

  /** @throws Always throws because `NullRenderPass` does not support render bundles. */
  executeBundles(_bundles: Iterable<RenderBundle>): void {
    throw new Error('Render bundles are only supported in WebGPU');
  }

  beginOcclusionQuery(queryIndex: number): void {}
  endOcclusionQuery(): void {}
}
