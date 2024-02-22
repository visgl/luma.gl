import {Device, Shader, ShaderProps} from '@luma.gl/core';

/** Manages a cached pool of Shaders for reuse. */
export class ShaderFactory {
  static readonly defaultProps: Required<ShaderProps> = {...Shader.defaultProps};

  public readonly device: Device;

  private readonly _shaderCache: Record<string, Shader> = {};
  private readonly _useCounts: Record<string, number> = {};

  /** Returns the default ShaderFactory for the given {@link Device}, creating one if necessary. */
  static getDefaultShaderFactory(device: Device): ShaderFactory {
    device._lumaData.defaultShaderFactory =
      device._lumaData.defaultShaderFactory || new ShaderFactory(device);
    return device._lumaData.defaultShaderFactory as ShaderFactory;
  }

  /** @internal */
  constructor(device: Device) {
    this.device = device;
  }

  /** Requests a {@link Shader} from the cache, creating a new Shader only if necessary. */
  createShader(props: ShaderProps): Shader {
    const key = this._hashShader(props);
    if (!this._shaderCache[key]) {
      this._shaderCache[key] = this.device.createShader(props);
      this._useCounts[key] = 0;
    }
    this._useCounts[key]++;
    return this._shaderCache[key];
  }

  /** Releases a previously-requested {@link Shader}, destroying it if no users remain. */
  release(shader: Shader): void {
    const key = this._hashShader(shader);
    this._useCounts[key]--;
    if (this._useCounts[key] === 0) {
      const shader = this._shaderCache[key];
      delete this._shaderCache[key];
      delete this._useCounts[key];
      shader.destroy();
    }
  }

  // PRIVATE

  private _hashShader(value: Shader | ShaderProps): string {
    return `${value.stage}:${value.source}`;
  }
}
