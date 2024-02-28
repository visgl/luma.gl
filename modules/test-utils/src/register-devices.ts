// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGLDevice, WebGPUDevice]);
