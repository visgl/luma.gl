// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {SceneRenderer, type SceneRenderOptions, type SceneSurface} from '@luma.gl/experimental';
import {getNullTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';

class InspectableSceneRenderer extends SceneRenderer {
  inspect(options: SceneRenderOptions) {
    return this.prepareScene(options);
  }
}

describe('reviewed scene skin palette specialization', () => {
  test('keeps joint-bearing geometry unskinned until a nonempty palette is available', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const surface: SceneSurface = {
      id: 'optional-skin-surface',
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
          JOINTS_0: {size: 4, value: new Uint16Array(12)},
          WEIGHTS_0: {
            size: 4,
            value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
          }
        }
      }),
      material: {id: 'optional-skin-material'},
      transforms: [new Matrix4()]
    };
    const options: SceneRenderOptions = {
      id: 'optional-skin-frame',
      surfaces: [surface],
      camera: {
        viewMatrix: new Matrix4(),
        projectionMatrix: new Matrix4(),
        position: [0, 0, 5]
      },
      width: 8,
      height: 8
    };

    try {
      const unskinnedModel = renderer.inspect(options).surfaces[0].model;
      expect(unskinnedModel.shaderInputs.getModules().map(module => module.name)).not.toContain(
        'skin'
      );

      surface.skin = {jointMatrices: new Float32Array(new Matrix4())};
      const skinnedModel = renderer.inspect(options).surfaces[0].model;
      expect(skinnedModel).not.toBe(unskinnedModel);
      expect(skinnedModel.shaderInputs.getModules().map(module => module.name)).toContain('skin');
      expect(skinnedModel.shaderInputs.getUniformValues()['skin'].jointMatrix[0]).toBe(1);

      surface.skin = {jointMatrices: new Float32Array()};
      const emptyPaletteModel = renderer.inspect(options).surfaces[0].model;
      expect(emptyPaletteModel).not.toBe(skinnedModel);
      expect(emptyPaletteModel.shaderInputs.getModules().map(module => module.name)).not.toContain(
        'skin'
      );
    } finally {
      renderer.destroy();
    }
  });
});
