import {Device, Shader, ShaderProps} from '@luma.gl/core';

/** Manages a cached pool of Shaders for reuse. */
export class ShaderFactory {
  static readonly defaultProps: Required<ShaderProps> = {...Shader.defaultProps};

  public readonly device: Device;

  private readonly _cache: Record<string, {shader: Shader; useCount: number}> = {};

  /** Returns the default ShaderFactory for the given {@link Device}, creating one if necessary. */
  static getDefaultShaderFactory(device: Device): ShaderFactory {
    device._lumaData.defaultShaderFactory ||= new ShaderFactory(device);
    return device._lumaData.defaultShaderFactory as ShaderFactory;
  }

  /** @internal */
  constructor(device: Device) {
    this.device = device;
  }

  /** Requests a {@link Shader} from the cache, creating a new Shader only if necessary. */
  createShader(props: ShaderProps): Shader {
    const key = this._hashShader(props);

    let cacheEntry = this._cache[key];
    if (!cacheEntry) {
      const shader = this.device.createShader({
        ...props,
        id: props.id ? `${props.id}-cached` : undefined
      });
      this._cache[key] = cacheEntry = {shader, useCount: 0};
    }

    cacheEntry.useCount++;
    return cacheEntry.shader;
  }

  /** Releases a previously-requested {@link Shader}, destroying it if no users remain. */
  release(shader: Shader): void {
    const key = this._hashShader(shader);
    const cacheEntry = this._cache[key];
    if (cacheEntry) {
      cacheEntry.useCount--;
      if (cacheEntry.useCount === 0) {
        delete this._cache[key];
        cacheEntry.shader.destroy();
      }
    }
  }

  // PRIVATE

  private _hashShader(value: Shader | ShaderProps): string {
    return `${value.stage}:${value.source}`;
  }
}
