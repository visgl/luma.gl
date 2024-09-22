// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Log} from '@probe.gl/log';
import type {DeviceProps} from './device';
import {Device} from './device';
import {Adapter} from './adapter';
import {StatsManager, lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';

declare global {
  // eslint-disable-next-line no-var
  var luma: Luma;
}

const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';

const ERROR_MESSAGE =
  'No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.';

/** Properties for creating a new device */
export type CreateDeviceProps = {
  /** Selects the type of device. `best-available` uses webgpu if available, then webgl. */
  type?: 'webgl' | 'webgpu' | 'null' | 'unknown' | 'best-available';
  /** List of adapters. Will also search any pre-registered adapters */
  adapters?: Adapter[];
  /**
   * Whether to wait for page to be loaded so that CanvasContext's can access the DOM.
   * The browser only supports one 'load' event listener so it may be necessary for the application to set this to false to avoid conflicts.
   */
  waitForPageLoad?: boolean;
} & DeviceProps;

/** Properties for attaching an existing WebGL context or WebGPU device to a new luma Device */
export type AttachDeviceProps = {
  /** List of adapters. Will also search any pre-registered adapters */
  adapters?: Adapter[];
} & DeviceProps;

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
export class Luma {
  static defaultProps: Required<CreateDeviceProps> = {
    ...Device.defaultProps,
    type: 'best-available',
    adapters: undefined!,
    waitForPageLoad: true
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

  /** Creates a device. Asynchronously. */
  async createDevice(props_: CreateDeviceProps = {}): Promise<Device> {
    const props: Required<CreateDeviceProps> = {...Luma.defaultProps, ...props_};

    const adapter = this.selectAdapter(props.type, props.adapters);
    if (!adapter) {
      throw new Error(ERROR_MESSAGE);
    }

    // Wait for page to load so that CanvasContext's can access the DOM.
    if (props.waitForPageLoad) {
      await adapter.pageLoaded;
    }

    return await adapter.create(props);
  }

  /**
   * Attach to an existing GPU API handle (WebGL2RenderingContext or GPUDevice).
   * @param handle Externally created WebGL context or WebGPU device
   */
  async attachDevice(handle: unknown, props: AttachDeviceProps): Promise<Device> {
    const type = this._getTypeFromHandle(handle, props.adapters);

    const adapter = type && this.selectAdapter(type, props.adapters);
    if (!adapter) {
      throw new Error(ERROR_MESSAGE);
    }

    return await adapter?.attach?.(handle, props);
  }

  /**
   * Global adapter registration.
   * @deprecated Use props.adapters instead
   */
  registerAdapters(adapters: Adapter[]): void {
    for (const deviceClass of adapters) {
      this.preregisteredAdapters.set(deviceClass.type, deviceClass);
    }
  }

  /** Get type strings for supported Devices */
  getSupportedAdapters(adapters: Adapter[] = []): string[] {
    const adapterMap = this._getAdapterMap(adapters);
    return Array.from(adapterMap)
      .map(([, adapter]) => adapter)
      .filter(adapter => adapter.isSupported?.())
      .map(adapter => adapter.type);
  }

  /** Get type strings for best available Device */
  getBestAvailableAdapterType(adapters: Adapter[] = []): 'webgpu' | 'webgl' | 'null' | null {
    const KNOWN_ADAPTERS: ('webgpu' | 'webgl' | 'null')[] = ['webgpu', 'webgl', 'null'];
    const adapterMap = this._getAdapterMap(adapters);
    for (const type of KNOWN_ADAPTERS) {
      if (adapterMap.get(type)?.isSupported?.()) {
        return type;
      }
    }
    return null;
  }

  /** Select adapter of type from registered adapters */
  selectAdapter(type: string, adapters: Adapter[] = []): Adapter | null {
    let selectedType: string | null = type;
    if (type === 'best-available') {
      selectedType = this.getBestAvailableAdapterType(adapters);
    }

    const adapterMap = this._getAdapterMap(adapters);
    return (selectedType && adapterMap.get(selectedType)) || null;
  }

  /**
   * Override `HTMLCanvasContext.getCanvas()` to always create WebGL2 contexts with additional WebGL1 compatibility.
   * Useful when attaching luma to a context from an external library does not support creating WebGL2 contexts.
   */
  enforceWebGL2(enforce: boolean = true, adapters: Adapter[] = []): void {
    const adapterMap = this._getAdapterMap(adapters);
    const webgl2Adapter = adapterMap.get('webgl');
    if (!webgl2Adapter) {
      log.warn('enforceWebGL2: webgl adapter not found')();
    }
    (webgl2Adapter as any)?.enforceWebGL2?.(enforce);
  }

  // DEPRECATED

  /** @deprecated */
  setDefaultDeviceProps(props: CreateDeviceProps): void {
    Object.assign(Luma.defaultProps, props);
  }

  // HELPERS

  /** Convert a list of adapters to a map */
  protected _getAdapterMap(adapters: Adapter[] = []): Map<string, Adapter> {
    const map = new Map(this.preregisteredAdapters);
    for (const adapter of adapters) {
      map.set(adapter.type, adapter);
    }
    return map;
  }

  /** Get type of a handle (for attachDevice) */
  protected _getTypeFromHandle(
    handle: unknown,
    adapters: Adapter[] = []
  ): 'webgpu' | 'webgl' | 'null' | null {
    // TODO - delegate handle identification to adapters

    // WebGL
    if (handle instanceof WebGL2RenderingContext) {
      return 'webgl';
    }

    if (typeof GPUDevice !== 'undefined' && handle instanceof GPUDevice) {
      return 'webgpu';
    }

    // TODO - WebGPU does not yet seem to have a stable in-browser API, so we "sniff" for members instead
    if ((handle as any)?.queue) {
      return 'webgpu';
    }

    // null
    if (handle === null) {
      return 'null';
    }

    if (handle instanceof WebGLRenderingContext) {
      log.warn('WebGL1 is not supported', handle)();
    } else {
      log.warn('Unknown handle type', handle)();
    }

    return null;
  }
}

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
export const luma = new Luma();
