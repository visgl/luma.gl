import {Shader, ShaderProps, CompilerMessage} from '@luma.gl/api';
import type WebGPUDevice from './webgpu-device';

export type WebGPUShaderProps = ShaderProps & {
  handle?: GPUShaderModule;
};

/**
 * Immutable shader
 */
export default class WebGPUShader extends Shader {
  readonly device: WebGPUDevice;
  readonly handle: GPUShaderModule;

  constructor(device: WebGPUDevice, props: WebGPUShaderProps) {
    super(device, props);

    this.device = device;

    this.handle = this.props.handle || this.createHandle();
    this.handle.label = this.props.id;
  }

  destroy() {
    // this.handle.destroy();
  }

  readonly [Symbol.toStringTag]: string = 'WebGPUShader';

  protected createHandle(): GPUShaderModule {
    const {source} = this.props;

    let language = this.props.language;
    // Compile from src
    if (!language) {
      // wgsl uses C++ "auto" style arrow notation
      language = source.includes('->') ? 'wgsl' : 'glsl';
    }

    switch(language) {
      case 'wgsl':
        return this.device.handle.createShaderModule({code: source});
      case 'glsl':
        return this.device.handle.createShaderModule({
          code: source,
          // @ts-expect-error
          transform: (glsl) => this.device.glslang.compileGLSL(glsl, type)
        });
      default:
        throw new Error(language);
    }
  }

  /** Returns compilation info for this shader */
  async compilationInfo(): Promise<readonly CompilerMessage[]> {
    const compilationInfo = await this.handle.compilationInfo();
    return compilationInfo.messages;
  }
}
