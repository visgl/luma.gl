// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Log} from '@probe.gl/log';
import type {Device, DeviceProps, WebGPUFeatureLevel} from './device';
import {DEVICE_DEFAULT_PROPS} from './device-defaults';
import {Adapter} from './adapter';
import {
  DeviceCreationError,
  type DeviceCreationAttempt,
  wrapDeviceCreationError
} from './device-creation-error';
import {StatsManager, lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';

declare global {
  // eslint-disable-next-line no-var
  var luma: Luma;
}

const STARTUP_MESSAGE = 'set luma.log.level=1 (or higher) to trace rendering';

const ERROR_MESSAGE = 'No matching device found. Import `@luma.gl/webgl` and/or `@luma.gl/webgpu`.';

type DeviceCreationCandidate = {
  adapter?: Adapter;
  backend: DeviceCreationAttempt['backend'];
  featureLevel?: WebGPUFeatureLevel;
  software?: boolean;
};

/** Properties for creating a new device */
export type CreateDeviceProps = {
  /** Selects an exact backend or an ordered device creation policy. */
  type?: 'webgl' | 'webgpu' | 'null' | 'unknown' | 'best-available' | 'best-available-webgpu';
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
    ...DEVICE_DEFAULT_PROPS,
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
    const candidates = this._getDeviceCreationCandidates(props);
    const attempts: DeviceCreationAttempt[] = [];
    const isBestAvailablePolicy = props.type.startsWith('best');

    for (const candidate of candidates) {
      const attempt = {
        backend: candidate.backend,
        featureLevel: candidate.featureLevel,
        software: Boolean(candidate.software),
        phase: 'adapter-selection' as const
      };

      if (!candidate.adapter?.isSupported?.()) {
        const error = new Error(`No ${candidate.backend} adapter`);
        attempts.push({...attempt, error});
        continue;
      }

      try {
        if (props.waitForPageLoad) {
          try {
            await candidate.adapter.pageLoaded;
          } catch (error) {
            throw wrapDeviceCreationError(
              error,
              {...attempt, phase: 'adapter-request'},
              `Waiting for ${candidate.backend} failed`
            );
          }
        }

        const device = await candidate.adapter.create({
          ...props,
          featureLevel: candidate.featureLevel,
          _forceFallbackAdapter: Boolean(candidate.software),
          failIfMajorPerformanceCaveat:
            props.failIfMajorPerformanceCaveat ||
            (isBestAvailablePolicy && candidate.backend === 'webgpu' && !candidate.software)
        });
        const selectedSoftware =
          candidate.software ||
          device.info.gpu === 'software' ||
          device.info.gpuType === 'cpu' ||
          Boolean(device.info.fallback);
        if (
          isBestAvailablePolicy &&
          candidate.backend === 'webgpu' &&
          !candidate.software &&
          selectedSoftware
        ) {
          device.destroy();
          attempts.push({
            ...attempt,
            phase: 'adapter-selection',
            error: new Error('Software rejected')
          });
          replaceCanvasAfterFailedInitialization(props);
          continue;
        }
        device.creationInfo = {
          requestedType: props.type,
          selected: {
            backend: candidate.backend,
            featureLevel: device.info.featureLevel,
            software: selectedSoftware
          },
          attempts
        };
        if (attempts.length > 0) {
          log.warn(`Recovered ${candidate.backend}; ${attempts.length} failed`, attempts)();
        }
        return device;
      } catch (error) {
        const structuredError = wrapDeviceCreationError(
          error,
          {...attempt, phase: 'wrapper-initialization'},
          `Failed to create ${candidate.backend}`
        );
        attempts.push(...structuredError.attempts);
        if (structuredError.phase === 'canvas-initialization') {
          replaceCanvasAfterFailedInitialization(props);
        }
      }
    }

    const lastError = attempts[attempts.length - 1]?.error;
    throw new DeviceCreationError(lastError?.message || ERROR_MESSAGE, attempts, lastError);
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
    } else if (type === 'best-available-webgpu') {
      selectedType = 'webgpu';
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

  protected _getDeviceCreationCandidates(
    props: Required<CreateDeviceProps>
  ): DeviceCreationCandidate[] {
    const adapterMap = this._getAdapterMap(props.adapters);
    if (!props.type.startsWith('best')) {
      const adapter = adapterMap.get(props.type);
      return [
        {
          adapter,
          backend: props.type as DeviceCreationCandidate['backend'],
          featureLevel: props.type === 'webgpu' ? props.featureLevel : undefined,
          software: Boolean(props.type === 'webgpu' && props._forceFallbackAdapter)
        }
      ];
    }

    const featureLevels: WebGPUFeatureLevel[] =
      props.featureLevel === 'max'
        ? ['max', 'core', 'compatibility']
        : props.featureLevel === 'compatibility'
          ? ['compatibility']
          : ['core', 'compatibility'];
    const webgpuAdapter = adapterMap.get('webgpu');
    const candidates: DeviceCreationCandidate[] = featureLevels.map(featureLevel => ({
      adapter: webgpuAdapter,
      backend: 'webgpu',
      featureLevel
    }));

    if (props.type === 'best-available') {
      candidates.push({
        adapter: adapterMap.get('webgl'),
        backend: 'webgl'
      });
      candidates.push({
        adapter: adapterMap.get('null'),
        backend: 'null'
      });
    } else if (!props.failIfMajorPerformanceCaveat) {
      candidates.push({
        adapter: webgpuAdapter,
        backend: 'webgpu',
        featureLevel: 'compatibility',
        software: true
      });
    }

    return candidates;
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

function replaceCanvasAfterFailedInitialization(props: Required<CreateDeviceProps>): void {
  const contextProps = props.createCanvasContext;
  if (
    typeof HTMLCanvasElement !== 'undefined' &&
    contextProps &&
    contextProps !== true &&
    contextProps.canvas instanceof HTMLCanvasElement
  ) {
    const canvas = contextProps.canvas;
    const replacement = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(replacement);
    contextProps.canvas = replacement;
  }
}

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL adapters (controls application bundle size)
 * Run-time selection of the first available Device
 */
// biome-ignore lint/suspicious/noRedeclare: the exported singleton intentionally mirrors the global debug handle.
export const luma = new Luma();
