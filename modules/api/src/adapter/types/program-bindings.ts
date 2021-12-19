import {Accessor} from '../types/accessor';

/** Describes an attribute binding for a program */
export type AttributeBinding = {
  location: number;
  name: string;
  accessor: Accessor;
}

/** Describes a varying binding for a program */
export type VaryingBinding = {
  location: number;
  name: string;
  accessor: Accessor;
}

/** Describes a uniform block binding for a program */
export type UniformBlockBinding = {
  location: number;
  name: string;
  byteLength: number;
  vertex: boolean;
  fragment: boolean;
  uniformCount: number;
  uniformIndices: number[];
}

/** Describes a uniform (sampler etc) binding for a program */
export type UniformBinding = {
  location: number;
  name: string;
  size: number;
  type: number;
  isArray: boolean;
}

/**
 * Holds metadata describing attribute configurations for a program's shaders
 */
export type ProgramBindings = {
  readonly attributes: AttributeBinding[];
  readonly varyings: VaryingBinding[];
  readonly uniformBlocks: UniformBlockBinding[];
  // Note - samplers are always in unform bindings, even if uniform blocks are used
  readonly uniforms: UniformBinding[];
}
