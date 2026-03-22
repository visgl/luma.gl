import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import type { Buffer } from '../../../core/src';
import { MaterialFactory } from '../../src';
const defaultUniformMaterial = {
  name: 'defaultUniformMaterial',
  bindingLayout: [{
    name: 'defaultUniformMaterial',
    group: 3
  }],
  uniformTypes: {
    value: 'f32'
  },
  defaultUniforms: {
    value: 2.5
  },
  getUniforms: props => props,
  dependencies: []
};
test('Material initializes uniform buffers with default module uniforms', async () => {
  const webglDevice = await getWebGLTestDevice();
  const materialFactory = new MaterialFactory<{
    defaultUniformMaterial: {
      value?: number;
    };
  }, {}>(webglDevice, {
    modules: [defaultUniformMaterial]
  });
  const material = materialFactory.createMaterial();
  const uniformBuffer = material.getBindings().defaultUniformMaterialUniforms as Buffer;
  const storedValue = new Float32Array(uniformBuffer.debugData, 0, 1)[0];
  expect(storedValue, 'constructor writes module default uniforms into the managed buffer').toBe(2.5);
  material.destroy();
});
