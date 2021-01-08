// ACCESSORS

/**
 * Attribute descriptor object
 */
export type Accessor = {
  format?: string;
  offset?: number;
  location?: number;

  // can now be described with single WebGPU-style `format` string
  type?: number;
  size?: number;
  normalized?: boolean;
  integer?: boolean;

  // deprecated - now shared between accessors in the surrounding BufferAccessor object
  stride?: number;
  divisor?: number;
};

/**
 * List of attribute descriptors for one interleaved buffer
 */
export type BufferAccessors = {
  stride?: number;
  stepMode?: 'vertex' | 'instance';
  attributes: Accessor[];
}
