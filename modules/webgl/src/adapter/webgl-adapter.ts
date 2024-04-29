// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Adapter, Device, DeviceProps, CanvasContext, log} from '@luma.gl/core';
import {WebGLDevice} from './webgl-device';
import {loadSpectorJS, DEFAULT_SPECTOR_PROPS} from '../context/debug/spector';
import {loadWebGLDeveloperTools} from '../context/debug/webgl-developer-tools';

const LOG_LEVEL = 1;

export class WebGLAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: Device['type'] = 'webgl';

  constructor() {
    super();

    // Add spector default props to device default props, so that runtime settings are observed
    Device.defaultProps = {...Device.defaultProps, ...DEFAULT_SPECTOR_PROPS};

    // @ts-ignore DEPRECATED For backwards compatibility luma.registerDevices
    WebGLDevice.adapter = this;
  }

  /** Check if WebGL 2 is available */
  isSupported(): boolean {
    return typeof WebGL2RenderingContext !== 'undefined';
  }

  /**
   * Get a device instance from a GL context
   * Creates and instruments the device if not already created
   * @param gl
   * @returns
   */
  attach(gl: Device | WebGL2RenderingContext): WebGLDevice {
    if (gl instanceof WebGLDevice) {
      return gl;
    }
    // @ts-expect-error
    if (gl?.device instanceof Device) {
      // @ts-expect-error
      return gl.device as WebGLDevice;
    }
    if (!isWebGL(gl)) {
      throw new Error('Invalid WebGL2RenderingContext');
    }
    return new WebGLDevice({gl: gl as WebGL2RenderingContext});
  }

  async create(props: DeviceProps = {}): Promise<WebGLDevice> {
    log.groupCollapsed(LOG_LEVEL, 'WebGLDevice created')();

    const promises: Promise<unknown>[] = [];

    // Load webgl and spector debug scripts from CDN if requested
    if (props.debug) {
      promises.push(loadWebGLDeveloperTools());
    }

    if (props.spector) {
      promises.push(loadSpectorJS());
    }

    // Wait for page to load: if canvas is a string we need to query the DOM for the canvas element.
    // We only wait when props.canvas is string to avoids setting the global page onload callback unless necessary.
    if (typeof props.canvas === 'string') {
      promises.push(CanvasContext.pageLoaded);
    }

    // Wait for all the loads to settle before creating the context.
    // The Device.create() functions are async, so in contrast to the constructor, we can `await` here.
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        log.error(`Failed to initialize debug libraries ${result.reason}`)();
      }
    }

    log.probe(LOG_LEVEL + 1, 'DOM is loaded')();

    const device = this.createSync(props);
    log.groupEnd(LOG_LEVEL)();

    return device;
  }

  /** Create or attach device synchronously. Not supported for all devices. */
  createSync(props: DeviceProps = {}): WebGLDevice {
    // @ts-expect-error
    if (props.gl?.device) {
      log.warn('reattaching existing device')();
      return this.attach(props.gl);
    }

    const device = new WebGLDevice(props);

    // Log some debug info about the newly created context
    const message = `\
Created ${device.type}${device.debug ? ' debug' : ''} context: \
${device.info.vendor}, ${device.info.renderer} for canvas: ${device.canvasContext.id}`;
    log.probe(LOG_LEVEL, message)();
    log.table(LOG_LEVEL, device.info)();

    return device;
  }
}

/** Check if supplied parameter is a WebGL2RenderingContext */
function isWebGL(gl: any): boolean {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && Number.isFinite(gl._version));
}

export const webgl2Adapter = new WebGLAdapter();
