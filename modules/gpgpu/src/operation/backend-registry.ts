// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import type {OperationHandler} from './operation';
import * as cpuBackend from '../operations/cpu/index';

/**
 * Backend endpoint exports keyed by operation name, plus optional endpoint-specific helpers.
 */
export type BackendModule = Record<string, unknown>;

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
    const existingModuleOrPromise = this._modules[deviceType];

    if (typeof (moduleOrPromise as Promise<BackendModule>).then === 'function') {
      const loader = Promise.all([
        Promise.resolve(existingModuleOrPromise || {}),
        moduleOrPromise as Promise<BackendModule>
      ]).then(([existingModule, incomingModule]) => ({
        ...existingModule,
        ...incomingModule
      }));
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

    if (
      existingModuleOrPromise &&
      typeof (existingModuleOrPromise as Promise<BackendModule>).then === 'function'
    ) {
      const loader = Promise.resolve(existingModuleOrPromise)
        .then(existingModule => ({
          ...existingModule,
          ...moduleOrPromise
        }))
        .then(module => {
          this._modules[deviceType] = module;
          return module;
        })
        .catch(ex => {
          log.error(`Failed to register ${deviceType} backend: ${ex}`)();
          throw ex;
        });
      this._modules[deviceType] = loader;
      return loader;
    }

    const mergedModule = {
      ...(existingModuleOrPromise || {}),
      ...moduleOrPromise
    };
    this._modules[deviceType] = mergedModule;
    return Promise.resolve(mergedModule);
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
    const operationHandler = resolvedModule[operationName];
    if (typeof operationHandler !== 'function') {
      throw new Error(`${deviceType} backend does not implement ${operationName}`);
    }
    return operationHandler as OperationHandler;
  }

  /**
   * Resolves an operation handler for a device type without awaiting lazy backend imports.
   *
   * @throws if the backend has not been registered synchronously or is still loading.
   */
  getSync(deviceType: string, operationName: string): OperationHandler {
    const moduleOrPromise = this._modules[deviceType];
    if (!moduleOrPromise) {
      throw new Error(`${deviceType} backend not registered`);
    }
    if (typeof (moduleOrPromise as Promise<BackendModule>).then === 'function') {
      throw new Error(`${deviceType} backend is not loaded yet`);
    }
    const module = moduleOrPromise as BackendModule;
    const operationHandler = module[operationName];
    if (typeof operationHandler !== 'function') {
      throw new Error(`${deviceType} backend does not implement ${operationName}`);
    }
    return operationHandler as OperationHandler;
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
