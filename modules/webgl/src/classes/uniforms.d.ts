import {Matrix4} from '@math.gl/core';
import Buffer from './buffer';
import Framebuffer from './framebuffer';
import Texture from './texture'


interface NumberUniformDefinition {
  type: 'number'
  value: number
  min: number
  max: number
}

interface BooleanUniformDefinition {
  type: 'boolean'
  value: boolean
}

interface ArrayUniformDefinition {
  type: 'array'
  value: Array<any>
}

interface ObjectUniformDefinition {
  type: 'object'
  value: Object
}

type UniformDefinition = NumberUniformDefinition |
  BooleanUniformDefinition |
  ArrayUniformDefinition |
  ObjectUniformDefinition

// https://luma.gl/docs/developer-guide/shader-modules#getuniforms
interface UniformsOptions {
  [uniformName: string]: UniformDefinition
}

type Uniform = UniformDefinition |
  Buffer | (() => Buffer) | Framebuffer |
  Texture |
  Matrix4 | // TODO: which other math.gl classes?
  number | [number, number] | [number, number, number] | [number, number, number, number]

interface Uniforms {
  [uniformName: string]: Uniform
}

// Returns a Magic Uniform Setter
export function getUniformSetter(gl: WebGLRenderingContext, location: number, info: object): any;

export function parseUniformName(name: string): {name: string; isArray: boolean};

/**
 * Basic checks of uniform values (with or without knowledge of program)
 * To facilitate early detection of e.g. undefined values in JavaScript
 */
export function checkUniformValues(uniforms: object, source?: string, uniformMap?: object): boolean;

/**
 * Creates a copy of the uniform
 */
export function copyUniform(uniforms: object, key: string, value: any): void;
