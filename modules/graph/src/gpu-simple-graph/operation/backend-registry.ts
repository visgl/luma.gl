// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import type {OperationHandler} from './operation';
import * as cpuBackend from '../operations/cpu/index';

/**
 * Backend endpoint exports keyed by operation name, plus optional endpoint-specific helpers.
 */
export type BackendModule = Record<string, unknown>;

/** Lazily imports the built-in backend module for one device type. */
export type BackendModuleLoader = () => Promise<BackendModule>;

/**
 * Options for a backend registry.
 *
 * @internal Exported for tests. Applications use the global {@link backendRegistry}.
 */
export type BackendRegistryProps = {
  /**
   * Built-in backend loaders keyed by device type. Asynchronous lookup uses them for handlers that
   * have not been registered. Defaults to the WebGL and WebGPU backends.
   */
  defaultModuleLoaders?: Readonly<Record<string, BackendModuleLoader>>;
};

const DEFAULT_MODULE_LOADERS: Readonly<Record<string, BackendModuleLoader>> = {
  webgl: () => import('../operations/webgl/index'),
  webgpu: () => import('../operations/webgpu/index')
};

/**
 * Registry for operation backends keyed by luma.gl device type.
 *
 * The CPU backend is available by default. WebGL and WebGPU backends are loaded lazily
 * with dynamic imports when a requested handler has not been registered for those device types.
 * Registered handlers take precedence over the built-in handlers.
 *
 * @internal Exported so tests can construct a registry with injected `defaultModuleLoaders`.
 * Applications use the global {@link backendRegistry}.
 */
export class BackendRegistry {
  private _modules: {[deviceType: string]: BackendModule | Promise<BackendModule>} = {
    cpu: cpuBackend
  };
  private readonly _defaultModuleLoaders: Readonly<Record<string, BackendModuleLoader>>;

  /** Creates a registry with the CPU backend registered. */
  constructor(props: BackendRegistryProps = {}) {
    this._defaultModuleLoaders = props.defaultModuleLoaders ?? DEFAULT_MODULE_LOADERS;
  }

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
    if (!isPromise(moduleOrPromise) && !isPromise(existingModuleOrPromise)) {
      const mergedModule = {...existingModuleOrPromise, ...moduleOrPromise};
      this._modules[deviceType] = mergedModule;
      return Promise.resolve(mergedModule);
    }

    const loader = Promise.all([existingModuleOrPromise || {}, moduleOrPromise]).then(
      ([existingModule, incomingModule]) => ({...existingModule, ...incomingModule})
    );
    this._modules[deviceType] = loader;
    loader
      .then(module => {
        // A later registration or clear() owns the registry entry now.
        if (this._modules[deviceType] === loader) {
          this._modules[deviceType] = module;
        }
      })
      .catch(ex => {
        log.error(`Failed to register ${deviceType} backend: ${ex}`)();
      });
    return loader;
  }

  /**
   * Resolves an operation handler for a device type.
   *
   * Pending async backend registrations are awaited before lookup. When the requested handler is
   * not registered, the built-in backend for the device type is imported and its handlers are
   * added beneath the registered ones.
   */
  async get(deviceType: string, operationName: string): Promise<OperationHandler> {
    const registeredModule = await this._modules[deviceType];
    let operationHandler = registeredModule?.[operationName];
    const loadDefaultModule = this._defaultModuleLoaders[deviceType];
    if (typeof operationHandler !== 'function' && loadDefaultModule) {
      // The registry entry is not replaced while the import is pending, so getSync() keeps
      // serving registered handlers, and a failed import rejects only this lookup.
      const defaultModule = await loadDefaultModule();
      // Registrations made while the import was pending take precedence. Await only a pending
      // registration: awaiting a plain module would yield, and an add() or clear() in that
      // microtask would be overwritten by a merge of the stale entry.
      let currentModule = this._modules[deviceType];
      while (isPromise(currentModule)) {
        await currentModule;
        currentModule = this._modules[deviceType];
      }
      operationHandler = this._addDefaultModule(deviceType, defaultModule, currentModule)[
        operationName
      ];
    } else if (!registeredModule) {
      throw new Error(`${deviceType} backend not registered`);
    }
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
    if (isPromise(moduleOrPromise)) {
      throw new Error(`${deviceType} backend is not loaded yet`);
    }
    const operationHandler = moduleOrPromise[operationName];
    if (typeof operationHandler !== 'function') {
      throw new Error(`${deviceType} backend does not implement ${operationName}`);
    }
    return operationHandler as OperationHandler;
  }

  /** Removes all registered backend modules. Primarily intended for tests. */
  clear() {
    this._modules = {};
  }

  /**
   * Merges built-in handlers beneath registered ones. Registered values win unless they are
   * `undefined`, so an unset optional handler does not hide the built-in. The merged module is
   * stored only when no newer registration is pending.
   */
  private _addDefaultModule(
    deviceType: string,
    defaultModule: BackendModule,
    registeredModule: BackendModule | undefined
  ): BackendModule {
    const mergedModule: BackendModule = {...defaultModule};
    for (const [name, value] of Object.entries(registeredModule || {})) {
      if (value !== undefined) {
        mergedModule[name] = value;
      }
    }
    if (!isPromise(this._modules[deviceType])) {
      this._modules[deviceType] = mergedModule;
    }
    return mergedModule;
  }
}

function isPromise(
  value: BackendModule | Promise<BackendModule> | undefined
): value is Promise<BackendModule> {
  return typeof (value as Promise<BackendModule> | undefined)?.then === 'function';
}

/**
 * Global backend registry used by lazy GPGPU operations.
 *
 * Applications can use this registry to eagerly load a backend, register a subset of built-in
 * operation handlers, or add handlers for custom operations.
 */
export const backendRegistry = new BackendRegistry();
