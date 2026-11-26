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

type BackendEntry = {
  registered?: BackendModule | Promise<BackendModule>;
  builtIn?: BackendModule;
  loadingBuiltIn?: Promise<void>;
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
  private readonly _entries = new Map<string, BackendEntry>([['cpu', {registered: cpuBackend}]]);
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
    const entry = this._getEntry(deviceType);
    const existingModuleOrPromise = entry.registered;
    if (!isPromise(moduleOrPromise) && !isPromise(existingModuleOrPromise)) {
      const mergedModule = {...existingModuleOrPromise, ...moduleOrPromise};
      entry.registered = mergedModule;
      return Promise.resolve(mergedModule);
    }

    const loader = Promise.all([existingModuleOrPromise || {}, moduleOrPromise]).then(
      ([existingModule, incomingModule]) => ({...existingModule, ...incomingModule})
    );
    entry.registered = loader;
    loader
      .then(module => {
        // Only the latest registration can publish the merged handlers.
        if (entry.registered === loader) {
          entry.registered = module;
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
    const entry = this._getEntry(deviceType);
    const registered = await entry.registered;
    const registeredHandler = registered?.[operationName];
    if (typeof registeredHandler === 'function') {
      return registeredHandler as OperationHandler;
    }
    const load = this._defaultModuleLoaders[deviceType];
    if (load && !entry.builtIn) {
      entry.loadingBuiltIn ??= load()
        .then(module => {
          entry.builtIn = module;
        })
        .finally(() => {
          entry.loadingBuiltIn = undefined;
        });
      await entry.loadingBuiltIn;
    }
    while (isPromise(entry.registered)) {
      await entry.registered;
    }
    return this._getHandler(entry, deviceType, operationName);
  }

  /**
   * Resolves an operation handler for a device type without awaiting lazy backend imports.
   *
   * @throws if the backend has not been registered synchronously or is still loading.
   */
  getSync(deviceType: string, operationName: string): OperationHandler {
    return this._getHandler(this._entries.get(deviceType), deviceType, operationName);
  }

  /** Removes all registrations and cached built-ins. */
  clear() {
    this._entries.clear();
  }

  private _getEntry(deviceType: string): BackendEntry {
    let entry = this._entries.get(deviceType);
    if (!entry) {
      entry = {};
      this._entries.set(deviceType, entry);
    }
    return entry;
  }

  private _getHandler(
    entry: BackendEntry | undefined,
    deviceType: string,
    operationName: string
  ): OperationHandler {
    const moduleOrPromise = entry?.registered;
    if (!moduleOrPromise && !entry?.builtIn) {
      throw new Error(`${deviceType} backend not registered`);
    }
    if (isPromise(moduleOrPromise)) {
      throw new Error(`${deviceType} backend is not loaded yet`);
    }
    const registered = moduleOrPromise?.[operationName];
    const operationHandler =
      registered === undefined ? entry?.builtIn?.[operationName] : registered;
    if (typeof operationHandler !== 'function') {
      throw new Error(`${deviceType} backend does not implement ${operationName}`);
    }
    return operationHandler as OperationHandler;
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
