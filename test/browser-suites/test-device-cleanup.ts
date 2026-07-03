// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {destroyTestDevices} from '@luma.gl/test-utils';
import {afterAll} from 'vitest';

/** Registers cleanup for one browser suite entry after its imported tests finish. */
export function registerTestDeviceCleanup(): void {
  afterAll(async () => {
    await destroyTestDevices();
  });
}
