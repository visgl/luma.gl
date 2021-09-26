import {isBrowser} from 'probe.gl/env';
import {WebGLDevice, WebGLDeviceProps} from '@luma.gl/gltools';
import { createHeadlessContext } from './create-headless-context';

const ERR_HEADLESSGL_FAILED =
  'Failed to create WebGL context in Node.js, headless gl returned null';

const ERR_HEADLESSGL_LOAD = `\
  luma.gl: loaded under Node.js without headless gl installed, meaning that WebGL \
  contexts can not be created. This may not be an error. For example, this is a \
  typical configuration for isorender applications running on the server.`;

const CONTEXT_DEFAULTS: Partial<WebGLDeviceProps> = {
  width: 1,
  height: 1,
  debug: true
};

export function createTestDevice(props: WebGLDeviceProps = {}): WebGLDevice | null {
  try {
    const gl = !isBrowser() ? createHeadlessContext(props) : undefined;
    props = {...CONTEXT_DEFAULTS, ...props, gl};
    return new WebGLDevice(props);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const webgl1TestDevice = createTestDevice({webgl1: true, webgl2: false});
export const webgl2TestDevice = createTestDevice({webgl1: true, webgl2: true});
