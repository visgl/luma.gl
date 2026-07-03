// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {destroyTestDevices} from '@luma.gl/test-utils';
import {afterAll} from 'vitest';

afterAll(async () => {
  await destroyTestDevices();
});
