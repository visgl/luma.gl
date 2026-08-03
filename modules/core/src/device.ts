// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Narrow entry point for adapter and device interfaces. */

export {Adapter} from './adapter/adapter';

export type {
  DeviceProps,
  DeviceInfo,
  DeviceFeature,
  BrowserDeviceFeature,
  DeviceTextureFormatCapabilities,
  WebGPUFeatureLevel,
  WebGPUDeviceFeatureLevel
} from './adapter/device';
export {Device, DeviceFeatures, DeviceLimits, isHTMLInCanvasSupported} from './adapter/device';

export type {CanvasContextProps} from './adapter/canvas-context';
export {CanvasContext} from './adapter/canvas-context';
export type {PresentationContextProps} from './adapter/presentation-context';
export {PresentationContext} from './adapter/presentation-context';
