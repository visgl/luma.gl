// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

/** GPU backend exposed by the standalone and website-hosted deck.gl examples. */
export type DeckExampleDeviceType = 'webgl' | 'webgpu';

/** Device selection accepted by standalone and website-hosted deck.gl examples. */
export type DeckExampleDeviceOptions = {
  /** Reuse a caller-owned device, such as the device selected by the website DeviceTabs. */
  device?: Device;
  /** Backend Deck should request when it owns device creation. */
  deviceType?: DeckExampleDeviceType;
};

/** Returns the luma.gl device request used when Deck creates its presentation device. */
export function getDeckExampleDeviceProps(deviceType: DeckExampleDeviceType) {
  return {
    type: deviceType,
    adapters: deviceType === 'webgpu' ? [webgpuAdapter, webgl2Adapter] : [webgl2Adapter]
  };
}

/** Resolves host device selection into Deck construction props. */
export function getDeckExampleProps({device, deviceType = 'webgpu'}: DeckExampleDeviceOptions) {
  return device ? {device} : {deviceProps: getDeckExampleDeviceProps(deviceType)};
}
