import {luma} from '@luma.gl/api';
import WebGPUDevice from './adapter/webpu-device';

luma.registerDevices([WebGPUDevice]);
