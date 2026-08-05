// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  createPBRMaterial,
  createPBRMaterialFactory,
  Geometry,
  getPBRGeometryDefines,
  getPBRTextureDefines,
  getSceneAlphaMode,
  type SceneMaterial,
  SceneRenderer,
  type SceneRenderOptions,
  type SceneSurface
} from '@luma.gl/engine';
import {pbrMaterial, pbrScene, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {getNullTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {PBR_MODEL_WGSL_SHADER} from '../../src/models/pbr-model';

const WEBGPU_PLATFORM = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

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

function makeOptions(surfaces: SceneSurface[]): SceneRenderOptions {
  return {
    id: 'shared-scene',
    surfaces,
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
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 0.2}],
    width: 8,
    height: 8
  };
}

describe('shared PBR material factories', () => {
  test('preserve canonical physical material uniforms and infer bound texture features', async () => {
    const device = await getNullTestDevice();
    const texture = device.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
    const factory = createPBRMaterialFactory(device);
    const material = createPBRMaterial(device, {
      id: 'physical-material',
      factory,
      uniforms: {
        baseColorFactor: [0.2, 0.4, 0.6, 0.8],
        metallicRoughnessValues: [0.65, 0.25],
        ior: 1.4,
        clearcoatFactor: 0.7,
        transmissionFactor: 0.3,
        emissiveStrength: 2
      },
      bindings: {pbr_baseColorSampler: texture}
    });

    expect(material.factory).toBe(factory);
    expect(material.getResourceBindings()['pbr_baseColorSampler']).toBe(texture);
    expect(material.shaderInputs.getUniformValues().pbrMaterial).toMatchObject({
      baseColorFactor: [0.2, 0.4, 0.6, 0.8],
      metallicRoughnessValues: [0.65, 0.25],
      baseColorMapEnabled: true,
      normalMapEnabled: false,
      ior: 1.4,
      clearcoatFactor: 0.7,
      transmissionFactor: 0.3,
      emissiveStrength: 2
    });

    material.destroy();
    texture.destroy();
  });

  test('specializes all canonical texture maps and semantic vertex attributes', () => {
    expect(getPBRGeometryDefines(makeGeometry())).toMatchObject({
      HAS_NORMALS: true,
      HAS_UV: true,
      HAS_UV_1: false,
      HAS_COLORS: true,
      HAS_RGBA_COLORS: false
    });
    expect(
      getPBRTextureDefines({
        pbr_baseColorSampler: {},
        pbr_thicknessSampler: {},
        pbr_clearcoatNormalSampler: {},
        pbr_iridescenceThicknessSampler: {},
        pbr_anisotropySampler: {}
      })
    ).toMatchObject({
      HAS_BASECOLORMAP: true,
      HAS_THICKNESSMAP: true,
      HAS_CLEARCOATNORMALMAP: true,
      HAS_IRIDESCENCETHICKNESSMAP: true,
      HAS_ANISOTROPYMAP: true,
      HAS_NORMALMAP: false
    });
  });

  test('resolves explicit and factor-derived alpha modes', () => {
    expect(getSceneAlphaMode({id: 'opaque'})).toBe('OPAQUE');
    expect(getSceneAlphaMode({id: 'blended', uniforms: {baseColorFactor: [1, 1, 1, 0.4]}})).toBe(
      'BLEND'
    );
    expect(
      getSceneAlphaMode({
        id: 'masked',
        alphaMode: 'MASK',
        uniforms: {baseColorFactor: [1, 1, 1, 0.4]}
      })
    ).toBe('MASK');
  });

  test('assembles instanced canonical PBR WGSL without duplicate interfaces', () => {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: WEBGPU_PLATFORM,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrMaterial, pbrScene],
      defines: {HAS_NORMALS: true, HAS_UV: true, HAS_COLORS: true, HAS_INSTANCING: true}
    });
    const reflection = new WgslReflect(shader.source);

    expect(reflection.entry.vertex.map(entry => entry.name)).toEqual(['vertexMain']);
    expect(reflection.entry.fragment.map(entry => entry.name)).toEqual(['fragmentMain']);
    expect(shader.source).toContain('pbrMaterial.baseColorFactor * vertexColor');
    expect(shader.shaderLayout?.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({name: 'positions', location: 0}),
        expect.objectContaining({name: 'instanceModelMatrixCol0', location: 8}),
        expect.objectContaining({name: 'instanceModelMatrixCol3', location: 11})
      ])
    );
  });
});

describe('SceneRenderer', () => {
  test('retains one instanced draw across uniform-only material changes', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const material: SceneMaterial = {
      id: 'retained-material',
      uniforms: {baseColorFactor: [0.1, 0.4, 0.8, 1], metallicRoughnessValues: [0.4, 0.7]}
    };
    const surface: SceneSurface = {
      id: 'instanced-surface',
      geometry: makeGeometry(),
      geometryVersion: 0,
      material,
      transforms: [new Matrix4().translate([-1, 0, 0]), new Matrix4().translate([1, 0, 0])]
    };

    const options = makeOptions([surface]);
    expect(renderer.render(options)).toEqual({
      surfaceCount: 1,
      instanceCount: 2,
      drawCount: 1,
      triangleCount: 2
    });
    const originalModel = renderer.inspect(options).surfaces[0].model;

    material.uniforms = {...material.uniforms, clearcoatFactor: 0.75};
    material.version = 1;
    expect(renderer.render(options)).toMatchObject({drawCount: 1, instanceCount: 2});
    expect(renderer.inspect(options).surfaces[0].model).toBe(originalModel);

    surface.geometryVersion = 1;
    expect(renderer.render(options)).toMatchObject({drawCount: 1, instanceCount: 2});
    expect(renderer.inspect(options).surfaces[0].model).not.toBe(originalModel);

    renderer.destroyFrame('shared-scene');
    renderer.destroy();
  });

  test('draws opaque surfaces before back-to-front blended surfaces', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const geometry = makeGeometry();
    const surfaces: SceneSurface[] = [
      {
        id: 'near-transparent',
        geometry,
        material: {id: 'near-material', alphaMode: 'BLEND'},
        transforms: [new Matrix4().translate([0, 0, 1])]
      },
      {
        id: 'opaque',
        geometry,
        material: {id: 'opaque-material'},
        transforms: [new Matrix4()]
      },
      {
        id: 'far-transparent',
        geometry,
        material: {id: 'far-material', alphaMode: 'BLEND'},
        transforms: [new Matrix4().translate([0, 0, -2])]
      }
    ];
    try {
      const options = makeOptions(surfaces);
      expect(renderer.render(options)).toMatchObject({drawCount: 3});
      expect(renderer.inspect(options).surfaces.map(surface => surface.model.id)).toEqual([
        'opaque-model',
        'far-transparent-model',
        'near-transparent-model'
      ]);
    } finally {
      renderer.destroy();
    }
  });

  test('rebuilds pipelines for texture bindings and alpha-mode changes', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const texture = device.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
    const surface: SceneSurface = {
      id: 'structural-surface',
      geometry: makeGeometry(),
      material: {id: 'structural-material'},
      transforms: [new Matrix4()]
    };
    const options = makeOptions([surface]);

    try {
      const opaqueModel = renderer.inspect(options).surfaces[0].model;
      surface.material.bindings = {pbr_baseColorSampler: texture};
      const texturedModel = renderer.inspect(options).surfaces[0].model;
      expect(texturedModel).not.toBe(opaqueModel);

      surface.material.alphaMode = 'BLEND';
      const blendedModel = renderer.inspect(options).surfaces[0].model;
      expect(blendedModel).not.toBe(texturedModel);
      expect(blendedModel.parameters.depthWriteEnabled).toBe(false);
      expect(blendedModel.parameters.blend).toBe(true);

      surface.material.doubleSided = true;
      const doubleSidedModel = renderer.inspect(options).surfaces[0].model;
      expect(doubleSidedModel).not.toBe(blendedModel);
      expect(doubleSidedModel.parameters.cullMode).toBe('none');
    } finally {
      renderer.destroy();
      texture.destroy();
    }
  });
});
