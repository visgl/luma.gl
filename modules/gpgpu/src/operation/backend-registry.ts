// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import type {OperationHandler} from './operation';
import {cpuBackend} from '../operations/cpu/index';

/** Map from operation names to backend-specific operation handlers. */
export type BackendModule = Record<string, OperationHandler>;

/**
 * Registry for operation backends keyed by luma.gl device type.
 *
 * The CPU backend is registered by default. Applications register GPU backends explicitly so
 * unused WebGL or WebGPU implementations can be tree-shaken or loaded lazily.
 */
class BackendRegistry {
  private _loading: Promise<BackendModule>[] = [];
  private _modules: {[deviceType: string]: BackendModule} = {};

  /**
   * Registers operation handlers for a device type.
   *
   * @param deviceType - Device type such as `'webgl'`, `'webgpu'`, or `'cpu'`.
   * @param moduleOrPromise - Backend module or a promise that resolves to one.
   */
  add(deviceType: string, moduleOrPromise: BackendModule | Promise<BackendModule>) {
    const loader = Promise.resolve(moduleOrPromise);
    const pendingLoaders = this._loading;
    pendingLoaders.push(loader);
    loader
      .then(module => {
        this._modules[deviceType] = module;
      })
      .catch(ex => {
        log.error(`Failed to register ${deviceType} backend: ${ex}`)();
      })
      .finally(() => {
        pendingLoaders.splice(pendingLoaders.indexOf(loader), 1);
      });
  }

  /**
   * Resolves an operation handler for a device type.
   *
   * Pending async backend registrations are awaited before lookup.
   */
  async get(deviceType: string, operationName: string): Promise<OperationHandler> {
    if (this._loading.length) {
      await Promise.all(this._loading);
    }
    const module = this._modules[deviceType];
    if (!module) {
      throw new Error(`${deviceType} backend not registered`);
    }
    if (!(operationName in module)) {
      throw new Error(`${deviceType} backend does not implement ${operationName}`);
    }
    return module[operationName];
  }

  /** Removes all registered backend modules. Primarily intended for tests. */
  clear() {
    this._modules = {};
  }
}

/**
 * Global backend registry used by lazy GPGPU operations.
 *
 * Register `webglBackend` or `webgpuBackend` before evaluating operation-backed tables on GPU
 * devices.
 */
export const backendRegistry = new BackendRegistry();
backendRegistry.add('cpu', cpuBackend);
