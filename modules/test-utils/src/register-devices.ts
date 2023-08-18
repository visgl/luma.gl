// luma.gl, MIT license

import {luma} from '@luma.gl/core';
import {WebGLDevice, registerHeadlessGL} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

import headlessGL from 'gl';

registerHeadlessGL(headlessGL);
luma.registerDevices([WebGLDevice, WebGPUDevice]);
