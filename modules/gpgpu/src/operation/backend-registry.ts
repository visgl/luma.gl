// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import type {OperationHandler} from './operation';
import * as cpuBackend from '../operations/cpu/index';

/** Map from operation names to backend-specific operation handlers. */
export type BackendModule = Record<string, OperationHandler>;

/**
 * Registry for operation backends keyed by luma.gl device type.
 *
 * The CPU backend is available by default. WebGL and WebGPU backends are loaded lazily
 * with dynamic imports when no backend has been registered for those device types.
 */
class BackendRegistry {
  private _modules: {[deviceType: string]: BackendModule | Promise<BackendModule>} = {
    cpu: cpuBackend
  };

  /**
   * Registers operation handlers for a device type.
   *
   * @param deviceType - Device type such as `'webgl'`, `'webgpu'`, or `'cpu'`.
   * @param moduleOrPromise - Backend module or a promise that resolves to one.
   */
  add(
    deviceType: string,
    moduleOrPromise: BackendModule | Promise<BackendModule>
  ): Promise<BackendModule> {
    const loader = Promise.resolve(moduleOrPromise);
    this._modules[deviceType] = loader;
    loader
      .then(module => {
        this._modules[deviceType] = module;
      })
      .catch(ex => {
        log.error(`Failed to register ${deviceType} backend: ${ex}`)();
      });
    return loader;
  }

  /**
   * Resolves an operation handler for a device type.
   *
   * Pending async backend registrations are awaited before lookup.
   */
  async get(deviceType: string, operationName: string): Promise<OperationHandler> {
    let module = this._modules[deviceType];
    if (!module) {
      if (deviceType === 'webgl') {
        module = this.add('webgl', import('../operations/webgl/index'));
      } else if (deviceType === 'webgpu') {
        module = this.add('webgpu', import('../operations/webgpu/index'));
      } else {
        throw new Error(`${deviceType} backend not registered`);
      }
    }
    const resolvedModule = await module;
    if (!(operationName in resolvedModule)) {
      throw new Error(`${deviceType} backend does not implement ${operationName}`);
    }
    return resolvedModule[operationName];
  }

  /** Removes all registered backend modules. Primarily intended for tests. */
  clear() {
    this._modules = {};
  }
}

/**
 * Global backend registry used by lazy GPGPU operations.
 *
 * Applications can use this registry to eagerly load a backend, register a subset of built-in
 * operation handlers, or add handlers for custom operations.
 */
export const backendRegistry = new BackendRegistry();
