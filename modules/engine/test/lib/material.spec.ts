// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import type {Buffer} from '../../../core/src';
import {MaterialFactory} from '../../src';

const defaultUniformMaterial = {
  name: 'defaultUniformMaterial',
  bindingLayout: [{name: 'defaultUniformMaterial', group: 3}],
  uniformTypes: {
    value: 'f32'
  },
  defaultUniforms: {
    value: 2.5
  },
  getUniforms: props => props,
  dependencies: []
};

test('Material initializes uniform buffers with default module uniforms', async t => {
  const webglDevice = await getWebGLTestDevice();
  const materialFactory = new MaterialFactory<{defaultUniformMaterial: {value?: number}}, {}>(
    webglDevice,
    {
      modules: [defaultUniformMaterial]
    }
  );
  const material = materialFactory.createMaterial();

  const uniformBuffer = material.getBindings().defaultUniformMaterialUniforms as Buffer;
  const storedValue = new Float32Array(uniformBuffer.debugData, 0, 1)[0];

  t.equal(storedValue, 2.5, 'constructor writes module default uniforms into the managed buffer');

  material.destroy();
  t.end();
});
