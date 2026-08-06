// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {
  getPBRGeometryDefines,
  SceneRenderer,
  type SceneRenderOptions,
  type SceneSurface
} from '@luma.gl/experimental';
import {pbrMaterial, pbrScene, skin, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {getNullTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';
import {PBR_MODEL_WGSL_SHADER} from '../../src/engine/pbr-model';

class InspectableSceneRenderer extends SceneRenderer {
  inspect(options: SceneRenderOptions) {
    return this.prepareScene(options);
  }
}

function makeGeometry(): Geometry {
  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
      TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
      COLOR_0: {size: 3, value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])}
    },
    indices: new Uint16Array([0, 1, 2])
  });
}

function makeOptions(surface: SceneSurface): SceneRenderOptions {
  return {
    id: 'deformation-scene',
    surfaces: [surface],
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 5], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 1,
        near: 0.1,
        far: 100
      }),
      position: [0, 0, 5]
    },
    width: 8,
    height: 8
  };
}

describe('shared scene deformation', () => {
  test('recognizes existing paired glTF joints and assembles the existing skin shader', () => {
    const geometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        POSITION: {size: 3, value: new Float32Array(9)},
        JOINTS_0: {size: 4, value: new Uint16Array(12)},
        WEIGHTS_0: {
          size: 4,
          value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
        }
      }
    });

    expect(getPBRGeometryDefines(geometry)['HAS_SKIN']).toBe(true);
    const assembled = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: {
        type: 'webgpu',
        shaderLanguage: 'wgsl',
        shaderLanguageVersion: 300,
        gpu: 'test',
        features: new Set<string>()
      },
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrScene, pbrMaterial, skin],
      defines: {HAS_SKIN: true}
    });
    expect(assembled.source).toContain('fn getSkinMatrix');
    expect(assembled.source).toContain('jointMatrix: array<mat4x4<f32>, 64>');
  });

  test('updates packed morph vertex buffers without rebuilding shared models', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const geometry = makeGeometry();
    const sourcePositions = new Float32Array(
      geometry.attributes['POSITION']!.value as Float32Array
    );
    const surface: SceneSurface = {
      id: 'morph-surface',
      geometry,
      material: {id: 'morph-material'},
      transforms: [new Matrix4()],
      morphTargets: [
        {POSITION: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])},
        {POSITION: new Float32Array([0, 1, 0, 1, 0, 0, 0, 1, 0])}
      ],
      morphWeights: [0, 0]
    };

    try {
      const options = makeOptions(surface);
      const firstModel = renderer.inspect(options).surfaces[0].model;
      const vertexBuffer = firstModel._gpuGeometry!.attributes['geometry'];
      const initialBytes = new Uint8Array(await vertexBuffer.readAsync());

      surface.morphWeights = [0.5, 0.25];
      const morphedModel = renderer.inspect(options).surfaces[0].model;
      const morphedBytes = await vertexBuffer.readAsync();

      expect(morphedModel).toBe(firstModel);
      expect(Array.from(morphedBytes)).not.toEqual(Array.from(initialBytes));
      expect(Array.from(geometry.attributes['POSITION']!.value)).toEqual(
        Array.from(sourcePositions)
      );
    } finally {
      renderer.destroy();
    }
  });
});
