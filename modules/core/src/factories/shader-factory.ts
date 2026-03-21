// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '../adapter/device';
import {Shader, type ShaderProps} from '../adapter/resources/shader';
import {log} from '../utils/log';
import type {CoreModuleState} from './core-module-state';

type CacheItem = {resource: Shader; useCount: number};

/** Manages a cached pool of Shaders for reuse. */
export class ShaderFactory {
  static readonly defaultProps: Required<ShaderProps> = {...Shader.defaultProps};

  /** Returns the default ShaderFactory for the given {@link Device}, creating one if necessary. */
  static getDefaultShaderFactory(device: Device): ShaderFactory {
    const moduleData = device.getModuleData<CoreModuleState>('@luma.gl/core');
    moduleData.defaultShaderFactory ||= new ShaderFactory(device);
    return moduleData.defaultShaderFactory;
  }

  public readonly device: Device;

  private readonly _cache: Record<string, CacheItem> = {};

  get [Symbol.toStringTag](): string {
    return 'ShaderFactory';
  }

  toString(): string {
    return `${this[Symbol.toStringTag]}(${this.device.id})`;
  }

  /** @internal */
  constructor(device: Device) {
    this.device = device;
  }

  /** Requests a {@link Shader} from the cache, creating a new Shader only if necessary. */
  createShader(props: ShaderProps): Shader {
    if (!this.device.props._cacheShaders) {
      return this.device.createShader(props);
    }

    const key = this._hashShader(props);

    let cacheEntry = this._cache[key];
    if (!cacheEntry) {
      const resource = this.device.createShader({
        ...props,
        id: props.id ? `${props.id}-cached` : undefined
      });
      this._cache[key] = cacheEntry = {resource, useCount: 1};
      if (this.device.props.debugFactories) {
        log.log(3, `${this}: Created new shader ${resource.id}`)();
      }
    } else {
      cacheEntry.useCount++;
      if (this.device.props.debugFactories) {
        log.log(
          3,
          `${this}: Reusing shader ${cacheEntry.resource.id} count=${cacheEntry.useCount}`
        )();
      }
    }

    return cacheEntry.resource;
  }

  /** Releases a previously-requested {@link Shader}, destroying it if no users remain. */
  release(shader: Shader): void {
    if (!this.device.props._cacheShaders) {
      shader.destroy();
      return;
    }

    const key = this._hashShader(shader);
    const cacheEntry = this._cache[key];
    if (cacheEntry) {
      cacheEntry.useCount--;
      if (cacheEntry.useCount === 0) {
        if (this.device.props._destroyShaders) {
          delete this._cache[key];
          cacheEntry.resource.destroy();
          if (this.device.props.debugFactories) {
            log.log(3, `${this}: Releasing shader ${shader.id}, destroyed`)();
          }
        }
      } else if (cacheEntry.useCount < 0) {
        throw new Error(`ShaderFactory: Shader ${shader.id} released too many times`);
      } else if (this.device.props.debugFactories) {
        log.log(3, `${this}: Releasing shader ${shader.id} count=${cacheEntry.useCount}`)();
      }
    }
  }

  // PRIVATE

  protected _hashShader(value: Shader | ShaderProps): string {
    return `${value.stage}:${value.source}`;
  }
}
