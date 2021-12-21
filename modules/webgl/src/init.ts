import {luma} from '@luma.gl/api';
import WebGLDevice from './adapter/webgl-device';

luma.registerDevices([WebGLDevice]);
