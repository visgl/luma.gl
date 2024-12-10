// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Adapter, Device, DeviceProps, log} from '@luma.gl/core';
import {WebGLDevice} from './webgl-device';
import {enforceWebGL2} from '../context/polyfills/polyfill-webgl1-extensions';
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

  /** Force any created WebGL contexts to be WebGL2 contexts, polyfilled with WebGL1 extensions */
  enforceWebGL2(enable: boolean): void {
    enforceWebGL2(enable);
  }

  /**
   * Get a device instance from a GL context
   * Creates a WebGLCanvasContext against the contexts canvas
   * @note autoResize will be disabled, assuming that whoever created the external context will be handling resizes.
   * @param gl
   * @returns
   */
  async attach(gl: Device | WebGL2RenderingContext): Promise<WebGLDevice> {
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

    // We create a new device using the provided WebGL context and its canvas
    // Assume that whoever created the external context will be handling resizes.
    return new WebGLDevice({
      _handle: gl,
      createCanvasContext: {canvas: gl.canvas, autoResize: false}
    });
  }

  async create(props: DeviceProps = {}): Promise<WebGLDevice> {
    log.groupCollapsed(LOG_LEVEL, 'WebGLDevice created')();

    const promises: Promise<unknown>[] = [];

    // Load webgl and spector debug scripts from CDN if requested
    if (props.debugWebGL || props.debug) {
      promises.push(loadWebGLDeveloperTools());
    }

    if (props.debugSpectorJS) {
      promises.push(loadSpectorJS(props));
    }

    // Wait for all the loads to settle before creating the context.
    // The Device.create() functions are async, so in contrast to the constructor, we can `await` here.
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        log.error(`Failed to initialize debug libraries ${result.reason}`)();
      }
    }

    const device = new WebGLDevice(props);

    // Log some debug info about the newly created context
    const message = `\
Created ${device.type}${device.debug ? ' debug' : ''} context: \
${device.info.vendor}, ${device.info.renderer} for canvas: ${device.canvasContext.id}`;
    log.probe(LOG_LEVEL, message)();
    log.table(LOG_LEVEL, device.info)();

    log.groupEnd(LOG_LEVEL)();

    return device;
  }
}

/** Check if supplied parameter is a WebGL2RenderingContext */
function isWebGL(gl: any): gl is WebGL2RenderingContext {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && Number.isFinite(gl._version));
}

export const webgl2Adapter = new WebGLAdapter();
