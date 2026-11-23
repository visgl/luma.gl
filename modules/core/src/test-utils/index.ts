// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Preserve adapter registration without loading the legacy animation/test runners.
import './register-devices';

export {
  getTestDevices,
  getTestDevice,
  getWebGLTestDevice,
  getPresentationWebGLTestDevice,
  getWebGPUTestDevice,
  getWebGPUTestDevices,
  getNullTestDevice
} from './create-test-device';
export {nullAdapter, NullAdapter} from './null-device/null-adapter';
export {NullDevice} from './null-device/null-device';
export {checkType} from './utils/check-type';
export {deepCopy} from './utils/deep-copy';
export {getResourceCounts, getLeakedResources} from './utils/resource-tracker';
