// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '../utils/log';
import type {DeviceProps} from './device';

/** Shared defaults for device creation without importing the Device class. */
export const DEVICE_DEFAULT_PROPS: Required<DeviceProps> = {
  id: null!,
  powerPreference: 'high-performance',
  failIfMajorPerformanceCaveat: false,
  featureLevel: undefined!,
  xrCompatible: false,
  createCanvasContext: undefined!,
  // WebGL specific
  webgl: {},

  // Callbacks
  // eslint-disable-next-line handle-callback-err
  onError: (error: Error, context: unknown) => {},
  onResize: (context, info) => {
    const [width, height] = context.getDevicePixelSize();
    log.log(1, `${context} resized => ${width}x${height}px`)();
  },
  onPositionChange: (context, info) => {
    const [left, top] = context.getPosition();
    log.log(1, `${context} repositioned => ${left},${top}`)();
  },
  onVisibilityChange: context => log.log(1, `${context} Visibility changed ${context.isVisible}`)(),
  onDevicePixelRatioChange: (context, info) =>
    log.log(1, `${context} DPR changed ${info.oldRatio} => ${context.devicePixelRatio}`)(),

  // Debug flags
  debug: getDefaultDebugValue(),
  debugGPUTime: false,
  debugShaders: log.get('debug-shaders') || undefined!,
  debugFramebuffers: Boolean(log.get('debug-framebuffers')),
  debugFactories: Boolean(log.get('debug-factories')),
  debugWebGL: Boolean(log.get('debug-webgl')),
  debugSpectorJS: undefined!, // Note: log setting is queried by the spector.js code
  debugSpectorJSUrl: undefined!,

  // Experimental
  _reuseDevices: false,
  _cacheShaders: true,
  _destroyShaders: false,
  _cachePipelines: true,
  _sharePipelines: true,
  _destroyPipelines: false,
  // TODO - Change these after confirming things work as expected
  _initializeFeatures: true,
  _disabledFeatures: {
    'compilation-status-async-webgl': true
  },

  // INTERNAL
  _handle: undefined!
};

/**
 * Internal helper for resolving the default `debug` prop.
 * Precedence is: explicit log debug value first, then `NODE_ENV`, then `false`.
 */
export function _getDefaultDebugValue(logDebugValue: unknown, nodeEnv?: string): boolean {
  if (logDebugValue !== undefined && logDebugValue !== null) {
    return Boolean(logDebugValue);
  }

  if (nodeEnv !== undefined) {
    return nodeEnv !== 'production';
  }

  return false;
}

function getDefaultDebugValue(): boolean {
  return _getDefaultDebugValue(log.get('debug'), getNodeEnv());
}

function getNodeEnv(): string | undefined {
  const processObject = (
    globalThis as typeof globalThis & {
      process?: {env?: Record<string, string | undefined>};
    }
  ).process;
  if (!processObject?.env) {
    return undefined;
  }

  return processObject.env['NODE_ENV'];
}
