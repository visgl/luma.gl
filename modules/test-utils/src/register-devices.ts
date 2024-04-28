// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

luma.registerAdapters([webgl2Adapter, webgpuAdapter]);
