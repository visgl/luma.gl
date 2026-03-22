import {expect, test} from 'vitest';
import { GL } from '@luma.gl/constants';
import { getDeviceInfo } from '../../../src/adapter/device-helpers/webgl-device-info';
function createMockGL(options: {
  vendor: string;
  renderer: string;
  version?: string;
}): WebGL2RenderingContext {
  const {
    vendor,
    renderer,
    version = 'WebGL 2.0'
  } = options;
  const vendorParameter = Number(GL.VENDOR);
  const rendererParameter = Number(GL.RENDERER);
  const versionParameter = Number(GL.VERSION);
  return {
    getExtension: () => null,
    getParameter: (parameter: number) => {
      switch (parameter) {
        case vendorParameter:
          return vendor;
        case rendererParameter:
          return renderer;
        case versionParameter:
          return version;
        default:
          return null;
      }
    }
  } as WebGL2RenderingContext;
}
test('getDeviceInfo classifies Apple Silicon WebGL GPUs as integrated', () => {
  const gl = createMockGL({
    vendor: 'Apple',
    renderer: 'ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version'
  });
  const info = getDeviceInfo(gl, {});
  expect(info.gpu, 'identifies Apple GPU vendor').toBe('apple');
  expect(info.gpuType, 'classifies Apple Silicon as integrated').toBe('integrated');
});
test('getDeviceInfo leaves ambiguous Apple WebGL GPUs as unknown type', () => {
  const gl = createMockGL({
    vendor: 'Apple',
    renderer: 'Apple'
  });
  const info = getDeviceInfo(gl, {});
  expect(info.gpu, 'identifies Apple GPU vendor').toBe('apple');
  expect(info.gpuType, 'does not default ambiguous Apple GPUs to discrete').toBe('unknown');
});
