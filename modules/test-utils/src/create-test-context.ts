import { createTestDevice } from "./create-test-device";

export function createTestContext(opts: Record<string, any> = {}): WebGLRenderingContext | null {
  const device = createTestDevice(opts);
  return device && device.gl;
}

  /*
import {isBrowser} from '@probe.gl/env';
import {createGLContext, instrumentGLContext} from '@luma.gl/gltools';
import {createHeadlessContext} from './create-headless-context';

export function createTestContext(opts: Record<string, any> = {}): WebGLRenderingContext | null {
  // try {
    if (!isBrowser()) {
      if (opts.webgl2 && !opts.webgl1) {
        return null;
      }
      const gl = createHeadlessContext(opts);
      return gl ? instrumentGLContext(gl) : null;
    }
    return createGLContext(opts);
  // } catch {
  //   if (opts.webgl2) {
  //     return null;
  //   }
  // }
}
*/
