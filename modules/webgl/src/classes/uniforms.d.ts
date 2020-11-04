import {
    Buffer,
    Framebuffer
} from '@luma.gl/webgl';

import Texture from '@luma.gl/webgl/src/classes/texture'

import {Matrix4} from 'math.gl';

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