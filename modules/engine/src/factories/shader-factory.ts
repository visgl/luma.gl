// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Shader, ShaderProps, log} from '@luma.gl/core';

/** Manages a cached pool of Shaders for reuse. */
export class ShaderFactory {
  static readonly defaultProps: Required<ShaderProps> = {...Shader.defaultProps};

  /** Returns the default ShaderFactory for the given {@link Device}, creating one if necessary. */
  static getDefaultShaderFactory(device: Device): ShaderFactory {
    device._lumaData['defaultShaderFactory'] ||= new ShaderFactory(device);
    return device._lumaData['defaultShaderFactory'] as ShaderFactory;
  }

  public readonly device: Device;
  readonly cachingEnabled: boolean;
  readonly destroyPolicy: 'unused' | 'never';
  readonly debug: boolean;

  private readonly _cache: Record<string, {shader: Shader; useCount: number}> = {};

  get [Symbol.toStringTag](): string {
    return 'ShaderFactory';
  }

  toString(): string {
    return `${this[Symbol.toStringTag]}(${this.device.id})`;
  }

  /** @internal */
  constructor(device: Device) {
    this.device = device;
    this.cachingEnabled = device.props._cacheShaders;
    this.destroyPolicy = device.props._cacheDestroyPolicy;
    this.debug = true; // device.props.debugFactories;
  }

  /** Requests a {@link Shader} from the cache, creating a new Shader only if necessary. */
  createShader(props: ShaderProps): Shader {
    if (!this.cachingEnabled) {
      return this.device.createShader(props);
    }

    const key = this._hashShader(props);

    let cacheEntry = this._cache[key];
    if (!cacheEntry) {
      const shader = this.device.createShader({
        ...props,
        id: props.id ? `${props.id}-cached` : undefined
      });
      this._cache[key] = cacheEntry = {shader, useCount: 1};
      if (this.debug) {
        log.log(3, `${this}: Created new shader ${shader.id}`)();
      }
    } else {
      cacheEntry.useCount++;
      if (this.debug) {
        log.log(
          3,
          `${this}: Reusing shader ${cacheEntry.shader.id} count=${cacheEntry.useCount}`
        )();
      }
    }

    return cacheEntry.shader;
  }

  /** Releases a previously-requested {@link Shader}, destroying it if no users remain. */
  release(shader: Shader): void {
    if (!this.cachingEnabled) {
      shader.destroy();
      return;
    }

    const key = this._hashShader(shader);
    const cacheEntry = this._cache[key];
    if (cacheEntry) {
      cacheEntry.useCount--;
      if (cacheEntry.useCount === 0) {
        if (this.destroyPolicy === 'unused') {
          delete this._cache[key];
          cacheEntry.shader.destroy();
          if (this.debug) {
            log.log(3, `${this}: Releasing shader ${shader.id}, destroyed`)();
          }
        }
      } else if (cacheEntry.useCount < 0) {
        throw new Error(`ShaderFactory: Shader ${shader.id} released too many times`);
      } else if (this.debug) {
        log.log(3, `${this}: Releasing shader ${shader.id} count=${cacheEntry.useCount}`)();
      }
    }
  }

  // PRIVATE

  protected _hashShader(value: Shader | ShaderProps): string {
    return `${value.stage}:${value.source}`;
  }
}
