// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '@probe.gl/env';
import {Device, DeviceProps} from './device';

/**
 * Create and attach devices for a specific backend.
 */
export abstract class Adapter {
  // new (props: DeviceProps): Device; Constructor isn't used
  abstract type: string;
  /** Check if this backend is supported */
  abstract isSupported(): boolean;
  /** Check if the given handle is a valid device handle for this backend */
  abstract isDeviceHandle(handle: unknown): boolean;
  /** Create a new device for this backend */
  abstract create(props: DeviceProps): Promise<Device>;
  /** Attach a Device to a valid handle for this backend (GPUDevice, WebGL2RenderingContext etc) */
  abstract attach(handle: unknown, props: DeviceProps): Promise<Device>;

  /**
   * Page load promise
   * Resolves when the DOM is loaded.
   * @note Since are be limitations on number of `load` event listeners,
   * it is recommended avoid calling this accessor until actually needed.
   * I.e. we don't call it unless you know that you will be looking up a string in the DOM.
   */
  get pageLoaded(): Promise<void> {
    return getPageLoadPromise();
  }
}

// HELPER FUNCTIONS

const isPage: boolean = isBrowser() && typeof document !== 'undefined';
const isPageLoaded: () => boolean = () => isPage && document.readyState === 'complete';
let pageLoadPromise: Promise<void> | null = null;

/** Returns a promise that resolves when the page is loaded */
function getPageLoadPromise(): Promise<void> {
  if (!pageLoadPromise) {
    if (isPageLoaded() || typeof window === 'undefined') {
      pageLoadPromise = Promise.resolve();
    } else {
      pageLoadPromise = new Promise(resolve => window.addEventListener('load', () => resolve()));
    }
  }
  return pageLoadPromise;
}
