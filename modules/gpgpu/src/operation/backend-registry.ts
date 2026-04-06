// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import type {OperationHandler} from './operation';
import {cpuBackend} from '../operations/cpu';

export type BackendModule = Record<string, OperationHandler>;

/** Optional inclusion of GPU-based compute functions for specific device types
 * Allows for tree-shaking, bundle-splitting, etc. controlled by the client */
class BackendRegistry {
  private _loading: Promise<BackendModule>[] = [];
  private _modules: {[deviceType: string]: BackendModule} = {};

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

  clear() {
    this._modules = {};
  }
}

export const backendRegistry = new BackendRegistry();
backendRegistry.add('cpu', cpuBackend);
