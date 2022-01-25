// luma.gl, MIT license
import type {VertexFormat} from './vertex-formats';

// ACCESSORS

/**
 * Attribute descriptor object
 */
export type Accessor = {
  format: VertexFormat;
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
};
