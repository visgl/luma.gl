// luma.gl, MIT license
// Copyright (c) 2020 OpenJS Foundation
// Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {WebGLDevice, registerHeadlessGL} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

import headlessGL from 'gl';

registerHeadlessGL(headlessGL);
luma.registerDevices([WebGLDevice, WebGPUDevice]);
