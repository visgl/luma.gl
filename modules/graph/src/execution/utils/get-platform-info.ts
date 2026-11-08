// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, DeviceFeature} from '@luma.gl/core';
import type {PlatformInfo} from '@luma.gl/shaders';

/** Create a shaders platform info from the Device */
export function getPlatformInfo(device: Device): PlatformInfo {
  return {
    type: device.type,
    shaderLanguage: device.info.shadingLanguage,
    shaderLanguageVersion: device.info.shadingLanguageVersion as 100 | 300,
    gpu: device.info.gpu,
    limits: device.limits as unknown as Record<string, number | undefined>,
    // HACK - we pretend that the DeviceFeatures is a Set, it has a similar API
    features: device.features as unknown as Set<DeviceFeature>
  };
}
