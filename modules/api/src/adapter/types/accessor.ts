// luma.gl, MIT license
import type {VertexFormat} from './types';

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
  stepMode?: 'vertex' | 'instance';

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

/**
 * List of attribute descriptors for one interleaved buffer
 */
export type InterleavedAccessors = {
  stride?: number;
  stepMode?: 'vertex' | 'instance';
  attributes: Accessor[];
};
