// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WebGLDevice} from './webgl-device';
import {Adapter, Device, DeviceProps, log} from '@luma.gl/core';
import {enforceRegisteredWebGL2} from '../context/polyfills/webgl1-compatibility-hooks';
import {
  loadRegisteredSpectorJS,
  loadRegisteredWebGLDeveloperTools
} from '../context/debug/debug-hooks';

const LOG_LEVEL = 1;

export class WebGLAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: Device['type'] = 'webgl';

  /** Force any created WebGL contexts to be WebGL2 contexts, polyfilled with WebGL1 extensions */
  enforceWebGL2(enable: boolean): void {
    enforceRegisteredWebGL2(enable);
  }

  /** Check if WebGL 2 is available */
  isSupported(): boolean {
    return typeof WebGL2RenderingContext !== 'undefined';
  }

  override isDeviceHandle(handle: unknown): boolean {
    // WebGL
    if (typeof WebGL2RenderingContext !== 'undefined' && handle instanceof WebGL2RenderingContext) {
      return true;
    }

    if (typeof WebGLRenderingContext !== 'undefined' && handle instanceof WebGLRenderingContext) {
      log.warn('WebGL1 is not supported', handle)();
    }

    return false;
  }

  /**
   * Get a device instance from a GL context
   * Creates a WebGLCanvasContext against the contexts canvas
   * @note autoResize will be disabled, assuming that whoever created the external context will be handling resizes.
   * @param gl
   * @returns
   */
  async attach(gl: Device | WebGL2RenderingContext, props: DeviceProps = {}): Promise<WebGLDevice> {
    const {WebGLDevice} = await import('./webgl-device');
    if (gl instanceof WebGLDevice) {
      return gl;
    }
    const existingDevice = WebGLDevice.getDeviceFromContext(gl as WebGL2RenderingContext | null);
    if (existingDevice) {
      return existingDevice;
    }
    if (!isWebGL(gl)) {
      throw new Error('Invalid WebGL2RenderingContext');
    }

    props = resolveWebGLDebugProps(props);
    await loadWebGLDebugTools(props);

    const createCanvasContext = props.createCanvasContext === true ? {} : props.createCanvasContext;

    // We create a new device using the provided WebGL context and its canvas
    // Assume that whoever created the external context will be handling resizes.
    return new WebGLDevice({
      ...props,
      _handle: gl,
      createCanvasContext: {canvas: gl.canvas, autoResize: false, ...createCanvasContext}
    });
  }

  async create(props: DeviceProps = {}): Promise<WebGLDevice> {
    const {WebGLDevice} = await import('./webgl-device');
    props = resolveWebGLDebugProps(props);
    await loadWebGLDebugTools(props);

    try {
      const device = new WebGLDevice(props);

      log.groupCollapsed(LOG_LEVEL, `WebGLDevice ${device.id} created`)();
      // Log some debug info about the newly created context
      const message = `\
${device._reused ? 'Reusing' : 'Created'} device with WebGL2 ${device.props.debug ? 'debug ' : ''}context: \
${device.info.vendor}, ${device.info.renderer} for canvas: ${device.canvasContext.id}`;
      log.probe(LOG_LEVEL, message)();
      log.table(LOG_LEVEL, device.info)();
      return device;
    } finally {
      log.groupEnd(LOG_LEVEL)();
      log.info(
        LOG_LEVEL,
        `%cWebGL call tracing: luma.log.set('debug-webgl') `,
        'color: white; background: blue; padding: 2px 6px; border-radius: 3px;'
      )();
    }
  }
}

/** Check if supplied parameter is a WebGL2RenderingContext */
function isWebGL(gl: any): gl is WebGL2RenderingContext {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  return Boolean(gl && typeof gl.createVertexArray === 'function');
}

export const webgl2Adapter = new WebGLAdapter();

function resolveWebGLDebugProps(props: DeviceProps): DeviceProps {
  return {
    ...props,
    debug: props.debug ?? Device.defaultProps.debug,
    debugWebGL: props.debugWebGL ?? Device.defaultProps.debugWebGL,
    debugSpectorJS: props.debugSpectorJS ?? Boolean(log.get('debug-spectorjs'))
  };
}

async function loadWebGLDebugTools(props: DeviceProps): Promise<void> {
  const promises: Promise<void>[] = [];
  if (props.debugWebGL || props.debug) {
    promises.push(loadRegisteredWebGLDeveloperTools());
  }
  if (props.debugSpectorJS) {
    promises.push(loadRegisteredSpectorJS(props));
  }

  const results = await Promise.allSettled(promises);
  for (const result of results) {
    if (result.status === 'rejected') {
      log.error(`Failed to initialize debug libraries ${result.reason}`)();
    }
  }
}
