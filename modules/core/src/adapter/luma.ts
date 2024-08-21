// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Log} from '@probe.gl/log';
import {isBrowser} from '@probe.gl/env';
import type {DeviceProps} from './device';
import {Device} from './device';
import {Adapter} from './adapter';
import {StatsManager, lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';

const isPage: boolean = isBrowser() && typeof document !== 'undefined';
const isPageLoaded: () => boolean = () => isPage && document.readyState === 'complete';

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
  type?: 'webgl' | 'webgpu' | 'unknown' | 'best-available';
  /** List of adapters. Will also search any pre-registered adapters */
  adapters?: Adapter[];
  /** Whether to wait for page to be loaded */
  waitForPageLoad?: boolean;
} & DeviceProps;

/** Properties for attaching an existing WebGL context or WebGPU device to a new luma Device */
export type AttachDeviceProps = {
  type?: 'webgl' | 'webgpu' | 'unknown' | 'best-available';
  /** Externally created WebGL context or WebGPU device */
  handle: unknown; // WebGL2RenderingContext | GPUDevice | null;
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

  /**
   * Page load promise
   * Get a 'lazy' promise that resolves when the DOM is loaded.
   * @note Since there may be limitations on number of `load` event listeners,
   * it is recommended avoid calling this function until actually needed.
   * I.e. don't call it until you know that you will be looking up a string in the DOM.
   */
  static pageLoaded: Promise<void> = getPageLoadPromise().then(() => {
    log.probe(2, 'DOM is loaded')();
  });

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

    if (props.waitForPageLoad) {
      // || props.createCanvasContext) {
      await Luma.pageLoaded;
    }

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

    if (props.createCanvasContext) {
      await Luma.pageLoaded;
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
   * Override `HTMLCanvasContext.getCanvas()` to always create WebGL2 contexts with additional WebGL1 compatibility.
   * Useful when attaching luma to a context from an external library does not support creating WebGL2 contexts.
   */
  enforceWebGL2(enforce: boolean = true, adapters: Adapter[] = []): void {
    const adapterMap = this.getAdapterMap(adapters);
    const webgl2Adapter = adapterMap.get('webgl');
    if (!webgl2Adapter) {
      log.warn('enforceWebGL2: webgl adapter not found')();
    }
    (webgl2Adapter as any)?.enforceWebGL2?.(enforce);
  }

  /** Convert a list of adapters to a map */
  protected getAdapterMap(adapters: Adapter[] = []): Map<string, Adapter> {
    const map = new Map(this.preregisteredAdapters);
    for (const adapter of adapters) {
      map.set(adapter.type, adapter);
    }
    return map;
  }

  // DEPRECATED

  /** @deprecated Use registerAdapters */
  registerDevices(deviceClasses: any[]): void {
    log.warn('luma.registerDevices() is deprecated, use luma.registerAdapters() instead');
    for (const deviceClass of deviceClasses) {
      const adapter = deviceClass.adapter as Adapter;
      if (adapter) {
        this.preregisteredAdapters.set(adapter.type, adapter);
      }
    }
  }
}

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
export const luma = new Luma();

// HELPER FUNCTIONS

/** Returns a promise that resolves when the page is loaded */
function getPageLoadPromise(): Promise<void> {
  if (isPageLoaded() || typeof window === 'undefined') {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    window.addEventListener('load', () => resolve());
  });
}
