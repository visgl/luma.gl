// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer} from '../resources/buffer';
// import type {VertexFormat} from './data-formats';

// ACCESSORS

/**
 * Attribute descriptor object
 * @deprecated Use ShaderLayout
 */
export interface AccessorObject {
  buffer?: Buffer;
  // format: VertexFormat;
  offset?: number;
  // can now be described with single WebGPU-style `format` string

  //
  stride?: number;

  /** @deprecated - Use accessor.stepMode */
  divisor?: number;

  /** @deprecated - Infer from format */
  type?: number;
  /** @deprecated - Infer from format */
  size?: number;
  /** @deprecated - Infer from format */
  normalized?: boolean;
  /** @deprecated - Infer from format */
  integer?: boolean;

  /** @deprecated */
  index?: number;
}
