import {luma} from '@luma.gl/api';
import WebGPUDevice from './adapter/webgpu-device';

luma.registerDevices([WebGPUDevice]);
