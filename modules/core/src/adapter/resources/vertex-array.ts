// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '../../types';
import {
  AttributeInfo,
  getAttributeInfosByLocation
} from '../../adapter-utils/get-attribute-from-layouts';
import type {Device} from '../device';
import type {Buffer} from './buffer';
import type {RenderPass} from './render-pass';
import {Resource, ResourceProps} from './resource';
import {ShaderLayout} from '../types/shader-layout';
import {BufferLayout} from '../types/buffer-layout';

/** Properties for initializing a VertexArray */
export type VertexArrayProps = ResourceProps & {
  shaderLayout: ShaderLayout;
  bufferLayout: BufferLayout[];
};

/**
 * Stores attribute bindings.
 * Makes it easy to share a render pipeline and use separate vertex arrays.
 * @note On WebGL, VertexArray allows non-constant bindings to be performed in advance
 * reducing the number of WebGL calls per draw call.
 * @note On WebGPU this is just a convenience class that collects the bindings.
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
  /** Attribute infos indexed by location - TODO only needed by webgl module? */
  protected readonly attributeInfos: AttributeInfo[];

  /** Index buffer */
  indexBuffer: Buffer | null = null;
  /** Attributes indexed by buffer slot */
  attributes: (Buffer | TypedArray | null)[];

  constructor(device: Device, props: VertexArrayProps) {
    super(device, props, VertexArray.defaultProps);
    this.maxVertexAttributes = device.limits.maxVertexAttributes;
    this.attributes = new Array(this.maxVertexAttributes).fill(null);
    this.attributeInfos = getAttributeInfosByLocation(
      props.shaderLayout,
      props.bufferLayout,
      this.maxVertexAttributes
    );
  }

  /** Set attributes (stored on pipeline and set before each call) */
  abstract setIndexBuffer(indices: Buffer | null): void;
  /** Set attributes (stored on pipeline and set before each call) */
  abstract setBuffer(bufferSlot: number, buffer: Buffer | null): void;

  abstract bindBeforeRender(renderPass: RenderPass): void;
  abstract unbindAfterRender(renderPass: RenderPass): void;

  // DEPRECATED METHODS

  /** @deprecated Set constant attributes (WebGL only) */
  setConstantWebGL(location: number, value: TypedArray | null): void {
    this.device.reportError(new Error('constant attributes not supported'), this)();
  }
}
