import {luma} from '@luma.gl/api';
import {WebGLDevice} from '@luma.gl/webgl';
// import {WebGPUDevice} from '@luma.gl/webgpu';
luma.registerDevices([WebGLDevice]);
