// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Bindings,
  BindingsByGroup,
  RenderPassBindingOptions,
  RenderPassDrawOptions,
  RenderBundleEncoderProps,
  ResourceProps,
  VertexArray
} from '@luma.gl/core';
import {
  Buffer,
  RenderBundle,
  RenderBundleEncoder,
  RenderPipeline,
  _getDefaultBindGroupFactory
} from '@luma.gl/core';
import {getWebGPUTextureFormat} from '../helpers/convert-texture-format';
import type {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
import {WebGPURenderPipeline} from './webgpu-render-pipeline';

/** WebGPU implementation of immutable reusable render commands. */
export class WebGPURenderBundle extends RenderBundle {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderBundle;

  override get [Symbol.toStringTag](): string {
    return 'WebGPURenderBundle';
  }

  /**
   * Wraps a finished native WebGPU render bundle.
   * @param device - Device that owns the native bundle.
   * @param props - Resource metadata and the finished native handle.
   */
  constructor(device: WebGPUDevice, props: ResourceProps & {handle: GPURenderBundle}) {
    super(device, props);
    this.device = device;
    this.handle = props.handle;
    this.handle.label = this.props.id;
  }

  /** Releases the luma.gl resource wrapper. */
  override destroy(): void {
    this.destroyResource();
  }
}

/** WebGPU implementation of reusable draw-command recording. */
export class WebGPURenderBundleEncoder extends RenderBundleEncoder {
  readonly device: WebGPUDevice;
  readonly handle: GPURenderBundleEncoder;

  /** Active pipeline */
  pipeline: WebGPURenderPipeline | null = null;

  /** Latest bindings applied to this encoder */
  bindings: Bindings | BindingsByGroup = {};
  private bindingsPipeline: WebGPURenderPipeline | null = null;

  /** Vertex array used by subsequent draw commands. */
  vertexArray: VertexArray | null = null;

  private recordingErrorScopeOpen = false;

  /**
   * Creates a native WebGPU render bundle encoder.
   * @param device - Device that records and owns the finished bundle.
   * @param props - Resource metadata and render-attachment compatibility requirements.
   */
  constructor(device: WebGPUDevice, props: RenderBundleEncoderProps = {}) {
    super(device, props);
    this.device = device;

    const descriptor = this.getRenderBundleEncoderDescriptor();
    this.device.pushErrorScope('validation');
    const suppliedHandle = this.props.handle as GPURenderBundleEncoder | undefined;
    this.handle = suppliedHandle || this.device.handle.createRenderBundleEncoder(descriptor);
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} creation failed:\n"${error.message}"`), this)();
      this.device.debug();
    });
    this.device.pushErrorScope('validation');
    this.recordingErrorScopeOpen = true;
    this.handle.label = this.props.id;
  }

  /** Releases the encoder without producing a render bundle. */
  override destroy(): void {
    this.popRecordingErrorScope('destroy');
    this.destroyResource();
  }

  /**
   * Completes native recording and invalidates this encoder.
   * @returns An immutable reusable WebGPU render bundle.
   */
  finish(): WebGPURenderBundle {
    const handle = this.handle.finish({label: this.id});
    const renderBundle = new WebGPURenderBundle(this.device, {
      id: this.id,
      userData: this.userData,
      handle
    });
    this.popRecordingErrorScope('finish');
    this.destroy();
    return renderBundle;
  }

  /** Sets the render pipeline used by subsequent draw commands. */
  setPipeline(pipeline: RenderPipeline): void {
    this.pipeline = pipeline as WebGPURenderPipeline;
    this.device.pushErrorScope('validation');
    this.handle.setPipeline(this.pipeline.handle);
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} setPipeline failed:\n"${error.message}"`), this)();
      this.device.debug();
    });
  }

  /** Sets bindings used by subsequent draw commands. */
  setBindings(bindings: Bindings | BindingsByGroup, options?: RenderPassBindingOptions): void {
    if (!this.pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before setBindings()');
    }
    this.bindings = bindings;
    this.bindingsPipeline = this.pipeline;
    const bindGroups = _getDefaultBindGroupFactory(this.device).getBindGroups(
      this.pipeline,
      bindings,
      options?._bindGroupCacheKeys
    );
    for (const [group, bindGroup] of Object.entries(bindGroups)) {
      if (bindGroup) {
        this.handle.setBindGroup(Number(group), bindGroup as GPUBindGroup);
      }
    }
  }

  /** Selects the vertex array used by subsequent draw commands. */
  setVertexArray(vertexArray: VertexArray): void {
    this.vertexArray = vertexArray;
  }

  /** Sets the index buffer used by subsequent indexed draw commands. */
  setIndexBuffer(
    buffer: Buffer,
    indexFormat: GPUIndexFormat,
    offset: number = 0,
    size?: number
  ): void {
    this.handle.setIndexBuffer((buffer as WebGPUBuffer).handle, indexFormat, offset, size);
  }

  /** Sets one vertex buffer used by subsequent draw commands. */
  setVertexBuffer(slot: number, buffer: Buffer, offset: number = 0): void {
    this.handle.setVertexBuffer(slot, (buffer as WebGPUBuffer).handle, offset);
  }

  /** Records an indexed or non-indexed draw command. */
  draw(options: RenderPassDrawOptions): boolean {
    if (!this.pipeline) {
      throw new Error('RenderPass.setPipeline() must be called before draw()');
    }
    if (this.pipeline.shaderLayout.bindings.length > 0 && this.bindingsPipeline !== this.pipeline) {
      throw new Error('RenderPass.setBindings() must be called after setPipeline() before draw()');
    }

    this.vertexArray?.bindBeforeRender(this);
    if (options.indexCount) {
      this.handle.drawIndexed(
        options.indexCount,
        options.instanceCount,
        options.firstIndex,
        options.baseVertex,
        options.firstInstance
      );
    } else {
      this.handle.draw(
        options.vertexCount || 0,
        options.instanceCount || 1,
        options.firstVertex,
        options.firstInstance
      );
    }
    this.vertexArray?.unbindAfterRender(this);
    return true;
  }

  drawIndirect(indirectBuffer: Buffer, indirectByteOffset: number = 0): void {
    this.vertexArray?.bindBeforeRender(this);
    this.handle.drawIndirect((indirectBuffer as WebGPUBuffer).handle, indirectByteOffset);
    this.vertexArray?.unbindAfterRender(this);
  }

  drawIndexedIndirect(indirectBuffer: Buffer, indirectByteOffset: number = 0): void {
    this.vertexArray?.bindBeforeRender(this);
    this.handle.drawIndexedIndirect((indirectBuffer as WebGPUBuffer).handle, indirectByteOffset);
    this.vertexArray?.unbindAfterRender(this);
  }

  /**
   * Render bundle encoders cannot replay other render bundles.
   * @throws Always throws.
   */
  executeBundles(_bundles: Iterable<RenderBundle>): void {
    throw new Error('RenderBundleEncoder.executeBundles() is not supported');
  }

  /** Begins a labeled debug group in the recorded command stream. */
  pushDebugGroup(groupLabel: string): void {
    this.handle.pushDebugGroup(groupLabel);
  }

  /** Ends the most recently begun debug group. */
  popDebugGroup(): void {
    this.handle.popDebugGroup();
  }

  /** Inserts a labeled debug marker into the recorded command stream. */
  insertDebugMarker(markerLabel: string): void {
    this.handle.insertDebugMarker(markerLabel);
  }

  private popRecordingErrorScope(operationName: 'destroy' | 'finish'): void {
    if (!this.recordingErrorScopeOpen) {
      return;
    }

    this.recordingErrorScopeOpen = false;
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(
        new Error(`${this} ${operationName} failed:\n"${error.message}"`),
        this
      )();
      this.device.debug();
    });
  }

  private getRenderBundleEncoderDescriptor(): GPURenderBundleEncoderDescriptor {
    const renderBundleEncoderProps = this.props as unknown as Required<RenderBundleEncoderProps>;
    const descriptor: GPURenderBundleEncoderDescriptor = {
      label: this.props.id,
      colorFormats: renderBundleEncoderProps.colorAttachmentFormats.map(format =>
        format ? getWebGPUTextureFormat(format) : null
      ),
      sampleCount: renderBundleEncoderProps.sampleCount
    };

    if (renderBundleEncoderProps.depthStencilAttachmentFormat) {
      descriptor.depthStencilFormat = getWebGPUTextureFormat(
        renderBundleEncoderProps.depthStencilAttachmentFormat
      );
    }
    if (this.props.depthReadOnly) {
      descriptor.depthReadOnly = true;
    }
    if (this.props.stencilReadOnly) {
      descriptor.stencilReadOnly = true;
    }

    return descriptor;
  }
}
