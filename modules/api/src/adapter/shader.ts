// luma.gl, MIT license
import type Device from './device';
import Resource, {ResourceProps} from './resource';

export type CompilerMessageType = 'error' | 'warning' | 'info';

export type CompilerMessage = {
  type: CompilerMessageType;
  message: string;
  lineNum: number;
  linePos: number;
}

/**
 * Properties for a Shader
 */
export type ShaderProps = ResourceProps & {
  stage: 'vertex' | 'fragment' | 'compute'; // Required by WebGL and GLSL transpiler
  // code: string;
  source: string;
  sourceMap?: string; // WebGPU only
  language?: 'glsl' | 'wgsl'; // wgsl in WebGPU only
  // entryPoint?: string;

  // WEBGL
  /** @deprecated use props.stage */
  shaderType?: 0x8b30 | 0x8b31; // GL_FRAGMENT_SHADER | GL_VERTEX_SHADER
};

/**
 * Immutable Shader object
 * In WebGPU the handle can be copied between threads
 */
export default abstract class Shader extends Resource<ShaderProps> {
  readonly [Symbol.toStringTag] = 'Shader';

  constructor(device: Device, props: ShaderProps) {
    super(device, props, {} as any);
  }

  abstract compilationInfo(): Promise<readonly CompilerMessage[]>;
}

