// luma.gl, MIT license
import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';
import {CompilerMessage} from '../../lib/compiler-log/compiler-message';

/**
 * Properties for a Shader
 */
export type ShaderProps = ResourceProps & {
  stage: 'vertex' | 'fragment' | 'compute'; // Required by WebGL and GLSL transpiler
  // code: string;
  source: string;
  sourceMap?: string | null; // WebGPU only
  language?: 'glsl' | 'wgsl'; // wgsl in WebGPU only
  // entryPoint?: string;

  // WEBGL
  /** @deprecated use props.stage */
  shaderType?: 0x8b30 | 0x8b31 | 0; // GL_FRAGMENT_SHADER | GL_VERTEX_SHADER
};

/**
 * Immutable Shader object
 * In WebGPU the handle can be copied between threads
 */
export abstract class Shader extends Resource<ShaderProps> {
  static override defaultProps: Required<ShaderProps> = {
    ...Resource.defaultProps,
    stage: 'vertex',
    source: '',
    sourceMap: null,
    language: 'glsl',
    shaderType: 0
  };

  override get [Symbol.toStringTag](): string { return 'Shader'; }

  readonly stage: 'vertex' | 'fragment' | 'compute';
  readonly source: string;

  constructor(device: Device, props: ShaderProps) {
    super(device, props, Shader.defaultProps);
    this.stage = this.props.stage;
    this.source = this.props.source;
  }

  abstract compilationInfo(): Promise<readonly CompilerMessage[]>;
}
