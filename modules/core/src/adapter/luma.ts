// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Log} from '@probe.gl/log';
import type {DeviceProps} from './device';
import {Device} from './device';
import {Adapter} from './adapter';
import {StatsManager} from '../utils/stats-manager';
import {lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';

declare global {
  // eslint-disable-next-line no-var
  var luma: Luma;
}

const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';

const ERROR_MESSAGE =
  'No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.';

/** Properties for creating a new device */
export type CreateDeviceProps = DeviceProps & {
  /** Selects the type of device. `best-available` uses webgpu if available, then webgl. */
  type?: 'webgl' | 'webgpu' | 'unknown' | 'best-available';
  adapters?: Adapter[];
};

/** Properties for attaching an existing WebGL context or WebGPU device to a new luma Device */
export type AttachDeviceProps = DeviceProps & {
  /** Externally created WebGL context or WebGPU device */
  handle: unknown; // WebGL2RenderingContext | GPUDevice | null;
  /** List of adapters. Will also search any pre-registered adapterss */
  adapters?: Adapter[];
};

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
export class Luma {
  static defaultProps: Required<CreateDeviceProps> = {
    ...Device.defaultProps,
    type: 'best-available',
    adapters: undefined!
  };

  /** Global stats for all devices */
  readonly stats: StatsManager = lumaStats;

  /**
   * Global log
   *
   * Assign luma.log.level in console to control logging: \
   * 0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
   * luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;
   */
  readonly log: Log = log;

  /** Version of luma.gl */
  readonly VERSION: string =
    // Version detection using build plugin
    // @ts-expect-error no-undef
    typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'running from source';

  spector: unknown;

  protected preregisteredAdapters = new Map<string, Adapter>();

  constructor() {
    if (globalThis.luma) {
      if (globalThis.luma.VERSION !== this.VERSION) {
        log.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)();
        log.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)();
        throw new Error(`luma.gl - multiple versions detected: see console log`);
      }

      log.error('This version of luma.gl has already been initialized')();
    }

    log.log(1, `${this.VERSION} - ${STARTUP_MESSAGE}`)();

    globalThis.luma = this;
  }

  registerAdapters(adapters: Adapter[]): void {
    for (const deviceClass of adapters) {
      this.preregisteredAdapters.set(deviceClass.type, deviceClass);
    }
  }

  /** Get type strings for supported Devices */
  getSupportedAdapters(adapters: Adapter[] = []): string[] {
    const adapterMap = this.getAdapterMap(adapters);
    return Array.from(adapterMap)
      .map(([, adapter]) => adapter)
      .filter(adapter => adapter.isSupported?.())
      .map(adapter => adapter.type);
  }

  /** Get type strings for best available Device */
  getBestAvailableAdapter(adapters: Adapter[] = []): 'webgpu' | 'webgl' | null {
    const adapterMap = this.getAdapterMap(adapters);
    if (adapterMap.get('webgpu')?.isSupported?.()) {
      return 'webgpu';
    }
    if (adapterMap.get('webgl')?.isSupported?.()) {
      return 'webgl';
    }
    return null;
  }

  setDefaultDeviceProps(props: CreateDeviceProps): void {
    Object.assign(Luma.defaultProps, props);
  }

  /** Creates a device. Asynchronously. */
  async createDevice(props: CreateDeviceProps = {}): Promise<Device> {
    props = {...Luma.defaultProps, ...props};

    // Should be handled by attach device
    // if (props.gl) {
    //   props.type = 'webgl';
    // }

    const adapterMap = this.getAdapterMap(props.adapters);

    let type: string = props.type || '';
    if (type === 'best-available') {
      type = this.getBestAvailableAdapter(props.adapters) || type;
    }

    const adapters = this.getAdapterMap(props.adapters) || adapterMap;

    const adapter = adapters.get(type);
    const device = await adapter?.create?.(props);
    if (device) {
      return device;
    }

    throw new Error(ERROR_MESSAGE);
  }

  /** Attach to an existing GPU API handle (WebGL2RenderingContext or GPUDevice). */
  async attachDevice(props: AttachDeviceProps): Promise<Device> {
    const adapters = this.getAdapterMap(props.adapters);

    // WebGL
    let type = '';
    if (props.handle instanceof WebGL2RenderingContext) {
      type = 'webgl';
    }

    // TODO - WebGPU does not yet have a stable API
    // if (props.handle instanceof GPUDevice) {
    //   const WebGPUDevice = adapters.get('webgpu') as any;
    //   if (WebGPUDevice) {
    //     return (await WebGPUDevice.attach(props.handle)) as Device;
    //   }
    // }

    // null
    if (props.handle === null) {
      type = 'unknown';
    }

    const adapter = adapters.get(type);
    const device = await adapter?.attach?.(null);
    if (device) {
      return device;
    }

    throw new Error(ERROR_MESSAGE);
  }

  /**
   * Override `HTMLCanvasContext.getCanvas()` to always create WebGL2 contexts.
   * Used when attaching luma to a context from an external library does not support creating WebGL2 contexts.
   * (luma can only attach to WebGL2 contexts).
   */
  enforceWebGL2(enforce: boolean = true): void {
    const prototype = HTMLCanvasElement.prototype as any;
    if (!enforce && prototype.originalGetContext) {
      // Reset the original getContext function
      prototype.getContext = prototype.originalGetContext;
      prototype.originalGetContext = undefined;
      return;
    }

    // Store the original getContext function
    prototype.originalGetContext = prototype.getContext;

    // Override the getContext function
    prototype.getContext = function (contextId: string, options?: WebGLContextAttributes) {
      // Attempt to force WebGL2 for all WebGL1 contexts
      if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        const context = this.originalGetContext('webgl2', options);
        return context;
      }
      // For any other type, return the original context
      return this.originalGetContext(contextId, options);
    };
  }

  /** Convert a list of adapters to a map */
  protected getAdapterMap(adapters: Adapter[] = []): Map<string, Adapter> {
    const map = new Map(this.preregisteredAdapters);
    for (const adapter of adapters) {
      map.set(adapter.type, adapter);
    }
    return map;
  }
}

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
export const luma = new Luma();
