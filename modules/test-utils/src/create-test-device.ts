import {isBrowser} from 'probe.gl/env';
import type {DeviceProps} from '@luma.gl/api';
import {WebGLDevice} from '@luma.gl/webgl';
import {createHeadlessContext} from './create-headless-context';

const ERR_HEADLESSGL_FAILED =
  'Failed to create WebGL context in Node.js, headless gl returned null';

const ERR_HEADLESSGL_LOAD = `\
  luma.gl: loaded under Node.js without headless gl installed, meaning that WebGL \
  contexts can not be created. This may not be an error. For example, this is a \
  typical configuration for isorender applications running on the server.`;

const CONTEXT_DEFAULTS: Partial<DeviceProps> = {
  width: 1,
  height: 1,
  debug: true
};

export function createTestDevice(props: DeviceProps = {}): WebGLDevice | null {
  try {
    const gl = !isBrowser() ? createHeadlessContext(props) : undefined;
    props = {...CONTEXT_DEFAULTS, ...props, gl, debug: true};
    // We dont use luma.createDevice since this tests current expect this context to be created synchronously
    return new WebGLDevice(props);
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

export const webgl1TestDevice: WebGLDevice = createTestDevice({webgl1: true, webgl2: false});
export const webgl2TestDevice: WebGLDevice = createTestDevice({webgl1: false, webgl2: true});
