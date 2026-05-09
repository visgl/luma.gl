// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '../../types';
import type {Device} from '../device';
import type {Buffer} from './buffer';
import type {RenderPass} from './render-pass';
import {Resource, ResourceProps} from './resource';
import {ShaderLayout} from '../types/shader-layout';
import {BufferLayout} from '../types/buffer-layout';

/** Properties for initializing a VertexArray */
export type VertexArrayProps = ResourceProps & {
  /** Shader-side attribute declarations used by the backend-specific vertex-array implementation. */
  shaderLayout: ShaderLayout;
  /** Logical buffer layout declarations used by the backend-specific vertex-array implementation. */
  bufferLayout: BufferLayout[];
};

/**
 * Stores attribute bindings.
 * Makes it easy to share a render pipeline and use separate vertex arrays.
 * @note Backend-specific attribute accessor metadata is no longer stored in the shared base class.
 * WebGL derives and caches that information in its own implementation, while WebGPU only tracks
 * the logical buffer bindings it needs to rebind at draw time.
 */
export abstract class VertexArray extends Resource<VertexArrayProps> {
  static override defaultProps: Required<VertexArrayProps> = {
    ...Resource.defaultProps,
    shaderLayout: undefined!,
    bufferLayout: []
  };

  override get [Symbol.toStringTag](): string {
    return 'VertexArray';
  }

  /** Max number of vertex attributes */
  readonly maxVertexAttributes: number;

  /** Index buffer */
  indexBuffer: Buffer | null = null;
  /** Buffers or constants indexed by backend-defined buffer slot or attribute location. */
  attributes: (Buffer | TypedArray | null)[];

  /**
   * Creates a backend-agnostic vertex-array container.
   * @param device The device that owns the vertex array.
   * @param props Vertex-array initialization properties.
   */
  constructor(device: Device, props: VertexArrayProps) {
    super(device, props, VertexArray.defaultProps);
    this.maxVertexAttributes = device.limits.maxVertexAttributes;
    this.attributes = new Array(this.maxVertexAttributes).fill(null);
  }

  /** Sets the index buffer used for indexed rendering. */
  abstract setIndexBuffer(indices: Buffer | null): void;
  /** Sets one backend-defined buffer slot or attribute location. */
  abstract setBuffer(bufferSlot: number, buffer: Buffer | null): void;

  /** Applies any backend-specific bindings required before a draw call. */
  abstract bindBeforeRender(renderPass: RenderPass): void;
  /** Clears any backend-specific bindings after a draw call. */
  abstract unbindAfterRender(renderPass: RenderPass): void;

  // DEPRECATED METHODS

  /** @deprecated Set constant attributes (WebGL only) */
  setConstantWebGL(location: number, value: TypedArray | null): void {
    this.device.reportError(new Error('constant attributes not supported'), this)();
  }
}
