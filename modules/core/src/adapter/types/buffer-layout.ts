// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {VertexFormat} from '../../gpu-type-utils/vertex-formats';

/**
 * Provides specific details about the memory layout of the actual buffers
 * that will be provided to a `RenderPipeline`.
 *
 * BufferLayout lets the application describe whether
 * - A single buffer can be used for multiple attributes (using interleaving or offsets),
 * - The data format of the memory being supplied to a specific shader attribute.
 *
 * `BufferLayout` complements the "static" attribute declarations in a ShaderLayout
 * with information about the "dynamic" memory layout of each buffer that will be bound
 * to the render pipeline.
 */

/** 
 * Specify memory layout for one buffer, describing how it is used by one or more attribute
 * @note Specifies format, stride, offset and step mode
 * @note The buffer can be set using the buffer name:`.setAttributes({[bufferName]: buffer})`.
 * @note Needs to match type/components of the ShaderLayout ('f32', 'i32', 's32')
 *
 * A buffer layout is used to specify "non-standard" buffer layouts (buffers with offsets, interleaved buffers etc)
 *
 * @example
 * ```
  device.createRenderPipeline({
    ...
    shaderLayout,
    bufferLayout: [
      {name: 'positions', stepMode: 'vertex', format: 'float32x3'},
      // interleaved bindings, auto offset
      {name: 'particles', stepMode: 'instance', byteStride: 32, attributes: [
        {name: 'instancePositions', format: 'float32x4', byteOffset: 0},
        {name: 'instanceVelocities', format: 'float32x4', byteOffset: 16}
      ]},
    ]
  ];
  ```
  */
export type BufferLayout = {
  /** Name of buffer */
  name: string;
  /** Is the attribute is instanced. Default: auto-deduced from shader name. */
  stepMode?: 'vertex' | 'instance';
  /** bytes between successive elements. If omitted, stride is set to reflect a "packed" buffer */
  byteStride?: number;
  /** Option 1: interleaved attributes that read from this buffer */
  attributes?: BufferAttributeLayout[];
  /** Option 2: Single attribute with same name as buffer. */
  format?: VertexFormat;
};

/** Specifies how the GPU should read one specific attribute from a buffer.  */
export type BufferAttributeLayout = {
  /** Name of attribute that maps to a "view" of this buffer */
  attribute: string;
  /** Data format of the memory in the buffer that is mapped to this attribute */
  format: VertexFormat;
  /** Sum up any the "global" offset (or 0) and the offset each stride (for interleaved data). */
  byteOffset: number;
};
