// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderModule} from '@luma.gl/shadertools';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {waterMaterial} from '../../../shadertools/src';
import type {Buffer} from '../../../core/src';
import {MaterialFactory} from '../../src';

const defaultUniformMaterial: ShaderModule<{value: number}> = {
  name: 'defaultUniformMaterial',
  bindingLayout: [{name: 'defaultUniformMaterial', group: 3}],
  uniformTypes: {
    value: 'f32'
  },
  defaultUniforms: {
    value: 2.5
  },
  getUniforms: props => props || {},
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

  const uniformBuffer = material.getBindings().defaultUniformMaterialUniforms as unknown as Buffer;
  const storedValue = new Float32Array(uniformBuffer.debugData, 0, 1)[0];

  t.equal(storedValue, 2.5, 'constructor writes module default uniforms into the managed buffer');

  material.destroy();
  t.end();
});

test('Material preserves prior waterMaterial uniforms across partial updates', async t => {
  const webglDevice = await getWebGLTestDevice();
  const materialFactory = new MaterialFactory<{waterMaterial: typeof waterMaterial.props}, {}>(
    webglDevice,
    {
      modules: [waterMaterial]
    }
  );
  const material = materialFactory.createMaterial();

  material.setProps({
    waterMaterial: {
      baseColor: [0, 64, 128],
      fresnelPower: 6,
      waveADirection: [0, 2]
    }
  });
  const uniformsAfterFirstUpdate = material.shaderInputs.getUniformValues().waterMaterial;
  t.deepEqual(
    uniformsAfterFirstUpdate.baseColor,
    [0, 64 / 255, 128 / 255],
    'first update normalizes and stores vector uniforms'
  );
  const directMergedUniforms = waterMaterial.getUniforms(
    {
      time: 3.5,
      mapping: 'world'
    },
    uniformsAfterFirstUpdate
  );
  t.deepEqual(
    directMergedUniforms.baseColor,
    [0, 64 / 255, 128 / 255],
    'waterMaterial.getUniforms preserves prior vector uniforms when previous uniforms are supplied'
  );

  material.setProps({
    waterMaterial: {
      time: 3.5,
      mapping: 'world'
    }
  });

  const uniforms = material.shaderInputs.getUniformValues().waterMaterial;
  t.deepEqual(
    uniforms.baseColor,
    [0, 64 / 255, 128 / 255],
    'partial updates preserve normalized sibling vector uniforms'
  );
  t.equal(uniforms.fresnelPower, 6, 'partial updates preserve sibling scalar uniforms');
  t.deepEqual(uniforms.waveADirection, [0, 1], 'partial updates preserve normalized directions');
  t.equal(uniforms.time, 3.5, 'new scalar uniform is applied');
  t.equal(uniforms.mappingMode, 1, 'mapping prop resolves to world-space mode');

  material.destroy();
  t.end();
});
