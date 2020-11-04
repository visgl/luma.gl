import {
  Uniforms,
  UniformsOptions
} from '@luma.gl/webgl/src/classes/uniforms'

interface ShaderModuleDeprecatedApi {
  type: 'function' | string
  old: string
  new: string
  deprecated: boolean
}

interface Injection {
  injection: string
  order: number
}

// https://luma.gl/docs/api-reference/shadertools/assemble-shaders#injection-map
interface InjectionMap {
  [shaderHook: string]: string | Injection
}

// https://luma.gl/docs/developer-guide/shader-modules#shader-module-descriptor
interface ShaderModuleObject {
  name: string
  fs?: string
  vs?: string
  inject?: InjectionMap
  getUniforms: (opts: UniformsOptions, context: Uniforms) => Uniforms
  uniforms: Uniforms
  dependencies: Array<ShaderModuleObject>
  deprecations: Array<ShaderModuleDeprecatedApi>
}