// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import type {RenderPass, Texture, TextureFormatColor} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  getPBRGeometryDefines,
  getPBRTextureDefines,
  getSceneAlphaMode,
  PBREnvironmentGenerator,
  PreparedPBREnvironment,
  type PreparedScene,
  preparePBREnvironment,
  type SceneMaterial,
  SceneRenderer,
  type SceneRenderOptions,
  type SceneSurface
} from '@luma.gl/experimental';
import {PBR_TONE_MAP_MODE, pbrMaterial, pbrScene, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {getNullTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {PBR_MODEL_WGSL_SHADER} from '../../src/engine/pbr-model';

const WEBGPU_PLATFORM = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

describe('scene rendering package architecture', () => {
  test('keeps opinionated rendering and PBR factories out of the stable engine', async () => {
    const engineExports = await import('@luma.gl/engine');

    for (const exportName of [
      'SceneRenderer',
      'createPBRModel',
      'createPBRMaterial',
      'createPBRMaterialFactory'
    ]) {
      expect(engineExports).not.toHaveProperty(exportName);
    }
  });

  test('keeps glTF model construction independent of experimental rendering', () => {
    const gltfPackage = JSON.parse(
      readFileSync(new URL('../../../gltf/package.json', import.meta.url), 'utf8')
    ) as {
      dependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    expect({
      ...gltfPackage.dependencies,
      ...gltfPackage.optionalDependencies,
      ...gltfPackage.peerDependencies
    }).not.toHaveProperty('@luma.gl/experimental');

    for (const sourcePath of ['gltf/create-gltf-model.ts', 'parsers/parse-gltf.ts']) {
      const source = readFileSync(
        new URL(`../../../gltf/src/${sourcePath}`, import.meta.url),
        'utf8'
      );
      expect(source).not.toContain('@luma.gl/experimental');
    }
  });
});

class InspectableSceneRenderer extends SceneRenderer {
  readonly draws: {id: string; scene: PreparedScene; clearColor?: number[]}[] = [];

  inspect(options: SceneRenderOptions) {
    return this.prepareScene(options);
  }

  protected override drawPreparedScene(scene: PreparedScene, renderPass: RenderPass): number {
    const clearColor = renderPass.props.clearColor;
    this.draws.push({
      id: renderPass.id,
      scene,
      clearColor: clearColor ? Array.from(clearColor) : undefined
    });
    return super.drawPreparedScene(scene, renderPass);
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
        pbr_anisotropySampler: {},
        pbr_bumpSampler: {},
        pbr_diffuseTransmissionSampler: {},
        pbr_diffuseTransmissionColorSampler: {},
        pbr_multiscatterColorSampler: {}
      })
    ).toMatchObject({
      HAS_BASECOLORMAP: true,
      HAS_THICKNESSMAP: true,
      HAS_CLEARCOATNORMALMAP: true,
      HAS_IRIDESCENCETHICKNESSMAP: true,
      HAS_ANISOTROPYMAP: true,
      HAS_BUMPMAP: true,
      HAS_DIFFUSETRANSMISSIONMAP: true,
      HAS_DIFFUSETRANSMISSIONCOLORMAP: true,
      HAS_MULTISCATTERCOLORMAP: true,
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

  test('specializes scene refraction bindings and roughness-aware IBL independently', () => {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: WEBGPU_PLATFORM,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrMaterial, pbrScene],
      defines: {
        HAS_NORMALS: true,
        HAS_UV: true,
        HAS_INSTANCING: true,
        USE_MATERIAL_EXTENSIONS: true,
        USE_IBL: true,
        USE_SCENE_ENVIRONMENT: true,
        USE_TEX_LOD: true,
        USE_TRANSMISSION_FRAMEBUFFER: true,
        USE_SCENE_COLOR_MANAGEMENT: true
      }
    });
    const reflection = new WgslReflect(shader.source);

    expect(reflection.entry.vertex.map(entry => entry.name)).toEqual(['vertexMain']);
    expect(reflection.entry.fragment.map(entry => entry.name)).toEqual(['fragmentMain']);
    expect(shader.source).toContain('pbrScene.environmentMipCount - 1.0');
    expect(shader.source).toContain('sin(pbrScene.environmentRotation)');
    expect(shader.source).toContain('max(pbrScene.environmentIntensity, 0.0)');
    expect(shader.source).toContain('getTransmittedSceneColor(');
    expect(shader.source).toContain('sampleTransmittedSceneColor(');
    expect(shader.source).toContain(
      '(max(pbrMaterial.ior, 1.0) - 1.0) * 0.025 * pbrMaterial.dispersion'
    );
    expect(shader.source).toContain('evaluateIridescenceSensitivity(');
    expect(shader.source).toContain('calculateAnisotropicLightColor(');
    expect(shader.source).toContain('toneMapKhronosPBRNeutral(');
    expect(shader.source).toContain('pbrScene.exposure');
    expect(shader.source).toContain('pbrScene.outputEncoding');
    expect(shader.source).toContain('pbr_transmissionFramebufferSampler');
    expect(shader.source).toContain('let alpha = clamp(baseColor.a, 0.0, 1.0)');
  });

  test('retains legacy glTF IBL without requiring scene-only uniforms', () => {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: WEBGPU_PLATFORM,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrMaterial],
      defines: {HAS_NORMALS: true, USE_IBL: true, USE_TEX_LOD: true}
    });

    expect(shader.source).toContain('let maximumMipLevel = 9.0');
    expect(shader.source).not.toContain('pbrScene.environmentMipCount');
    expect(shader.source).not.toContain('pbr_transmissionFramebufferSampler');
  });

  test('samples generated linear IBL directly while retaining legacy sRGB decoding', () => {
    const sceneShader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: WEBGPU_PLATFORM,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrMaterial, pbrScene],
      defines: {
        HAS_NORMALS: true,
        USE_IBL: true,
        USE_SCENE_ENVIRONMENT: true,
        MANUAL_SRGB: true
      }
    });
    const legacyShader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: WEBGPU_PLATFORM,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrMaterial],
      defines: {HAS_NORMALS: true, USE_IBL: true, MANUAL_SRGB: true}
    });

    expect(sceneShader.source).toContain('let brdf = brdfSample.rgb;');
    expect(sceneShader.source).toContain('let diffuseLight = diffuseSample.rgb;');
    expect(sceneShader.source).toContain('let specularLight = specularSample.rgb;');
    expect(sceneShader.source).not.toContain('let brdf = SRGBtoLINEAR(brdfSample).rgb;');

    expect(legacyShader.source).toContain('let brdf = SRGBtoLINEAR(brdfSample).rgb;');
    expect(legacyShader.source).toContain('let diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;');
    expect(legacyShader.source).toContain('let specularLight = SRGBtoLINEAR(specularSample).rgb;');

    expect(pbrMaterial.fs).toContain('vec3 brdf = brdfSample.rgb;');
    expect(pbrMaterial.fs).toContain('vec3 diffuseLight = diffuseSample.rgb;');
    expect(pbrMaterial.fs).toContain('vec3 specularLight = specularSample.rgb;');
    expect(pbrMaterial.fs).toContain('vec3 brdf = SRGBtoLINEAR(brdfSample).rgb;');
  });
});

describe('SceneRenderer', () => {
  test('rebuilds punctual-light shader specialization only when lighting becomes enabled or disabled', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const surface: SceneSurface = {
      id: 'punctual-light-specialization',
      geometry: makeGeometry(),
      material: {id: 'punctual-light-material'},
      transforms: [new Matrix4()]
    };
    const options: SceneRenderOptions = {...makeOptions([surface]), lights: []};
    const unlitModel = renderer.inspect(options).surfaces[0].model;

    options.lights = [{type: 'directional', direction: [0, 0, -1], intensity: 1}];
    const litModel = renderer.inspect(options).surfaces[0].model;
    expect(litModel).not.toBe(unlitModel);

    options.lights = [{type: 'directional', direction: [1, 0, -1], intensity: 2}];
    expect(renderer.inspect(options).surfaces[0].model).toBe(litModel);

    options.lights = [];
    expect(renderer.inspect(options).surfaces[0].model).not.toBe(litModel);
    renderer.destroy();
  });

  test('defaults every floating-point attachment to linear, untonemapped HDR output', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const surface: SceneSurface = {
      id: 'hdr-format-surface',
      geometry: makeGeometry(),
      material: {id: 'hdr-format-material'},
      transforms: [new Matrix4()]
    };

    for (const [format, toneMapMode, outputEncoding] of [
      ['rgba16float', PBR_TONE_MAP_MODE.NONE, 0],
      ['rgba32float', PBR_TONE_MAP_MODE.NONE, 0],
      ['rg11b10ufloat', PBR_TONE_MAP_MODE.NONE, 0],
      ['rgb9e5ufloat', PBR_TONE_MAP_MODE.NONE, 0],
      ['rgba8unorm', PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL, 1],
      ['rgba8unorm-srgb', PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL, 0]
    ] as [TextureFormatColor, number, number][]) {
      const texture = device.createTexture({width: 4, height: 4, format});
      const framebuffer = device.createFramebuffer({
        width: 4,
        height: 4,
        colorAttachments: [texture]
      });
      framebuffer.colorAttachments.push(texture.view);

      try {
        const options = {...makeOptions([surface]), id: `format-${format}`, framebuffer};
        const model = renderer.inspect(options).surfaces[0].model;

        expect(model.shaderInputs.getUniformValues().pbrScene, format).toMatchObject({
          toneMapMode,
          outputEncoding
        });
      } finally {
        renderer.destroyFrame(`format-${format}`);
        framebuffer.destroy();
        texture.destroy();
      }
    }

    renderer.destroy();
  });

  test('presents clear backgrounds exactly like fragments while keeping transmission linear', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const surface: SceneSurface = {
      id: 'background-transmission-surface',
      geometry: makeGeometry(),
      material: {
        id: 'background-transmission-material',
        uniforms: {transmissionFactor: 0.5}
      },
      transforms: [new Matrix4()]
    };
    const options = makeOptions([surface]);
    options.background = [0.125, 0.25, 0.5, 0.75];
    options.exposure = 2;
    options.toneMapMode = PBR_TONE_MAP_MODE.NONE;
    options.outputColorSpace = 'srgb';

    try {
      renderer.render(options);

      expect(renderer.draws).toHaveLength(2);
      expect(renderer.draws[0].clearColor).toEqual([0.125, 0.25, 0.5, 0.75]);
      expect(renderer.draws[1].clearColor?.[0]).toBeCloseTo(0.5370987, 5);
      expect(renderer.draws[1].clearColor?.[1]).toBeCloseTo(0.735357, 5);
      expect(renderer.draws[1].clearColor?.[2]).toBeCloseTo(1, 5);
      expect(renderer.draws[1].clearColor?.[3]).toBe(0.75);

      options.transmission = false;
      options.outputColorSpace = 'linear';
      for (const [toneMapMode, expectedRed] of [
        [PBR_TONE_MAP_MODE.NONE, 0.25],
        [PBR_TONE_MAP_MODE.REINHARD, 0.2],
        [PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL, 0.19924786],
        [PBR_TONE_MAP_MODE.ACES, 0.37411095]
      ]) {
        options.toneMapMode = toneMapMode;
        renderer.render(options);
        expect(renderer.draws.at(-1)?.clearColor?.[0], `tone mapper ${toneMapMode}`).toBeCloseTo(
          expectedRed,
          5
        );
      }
    } finally {
      renderer.destroy();
    }
  });

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

  test('captures only opaque scene color and binds it only to transmissive models', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const geometry = makeGeometry();
    const glass: SceneSurface = {
      id: 'glass-surface',
      geometry,
      material: {
        id: 'glass-material',
        alphaMode: 'OPAQUE',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1],
          transmissionFactor: 0.9,
          thicknessFactor: 0.5,
          attenuationDistance: 1.5,
          attenuationColor: [0.8, 0.9, 1],
          ior: 1.45
        }
      },
      transforms: [new Matrix4()]
    };
    const opaque: SceneSurface = {
      id: 'opaque-background',
      geometry,
      material: {id: 'opaque-background-material'},
      transforms: [new Matrix4().translate([0, 0, -1])]
    };
    const translucent: SceneSurface = {
      id: 'blended-background',
      geometry,
      material: {id: 'blended-background-material', alphaMode: 'BLEND'},
      transforms: [new Matrix4().translate([0, 0, -2])]
    };

    try {
      const statistics = renderer.render(makeOptions([glass, opaque, translucent]));
      expect(statistics).toMatchObject({surfaceCount: 3, instanceCount: 3, drawCount: 3});
      expect(renderer.draws.map(draw => draw.id)).toEqual([
        'scene-shared-scene-transmission',
        'scene-shared-scene'
      ]);
      expect(renderer.draws[0].scene.surfaces.map(surface => surface.model.id)).toEqual([
        'opaque-background-model'
      ]);
      expect(renderer.draws[1].scene.surfaces.map(surface => surface.model.id)).toEqual([
        'opaque-background-model',
        'glass-surface-model',
        'blended-background-model'
      ]);

      const opaqueModel = renderer.draws[1].scene.surfaces[0].model;
      const glassModel = renderer.draws[1].scene.surfaces[1].model;
      const captureTexture = glassModel.shaderInputs.getBindingValues()
        .pbr_transmissionFramebufferSampler as Texture;
      expect(captureTexture).toMatchObject({width: 8, height: 8, format: 'rgba16float'});
      const captureModel = renderer.draws[0].scene.surfaces[0].model;
      expect(captureModel).not.toBe(opaqueModel);
      expect(captureModel.shaderInputs.getUniformValues().pbrScene).toMatchObject({
        exposure: 1,
        toneMapMode: 0,
        outputEncoding: 0
      });
      expect(opaqueModel.shaderInputs.getUniformValues().pbrScene).toMatchObject({
        exposure: 1,
        toneMapMode: 2,
        outputEncoding: 1
      });
      expect(opaqueModel.shaderInputs.getBindingValues()).not.toHaveProperty(
        'pbr_transmissionFramebufferSampler'
      );
      expect(glassModel.parameters.blend).toBe(false);
      expect(glassModel.parameters.depthWriteEnabled).toBe(true);

      renderer.destroyFrame('shared-scene');
      expect(captureTexture.destroyed).toBe(true);
    } finally {
      renderer.destroy();
    }
  });

  test('reuses, resizes, disables, and structurally invalidates scene-color capture', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const surface: SceneSurface = {
      id: 'resizable-glass',
      geometry: makeGeometry(),
      material: {id: 'resizable-glass-material', uniforms: {transmissionFactor: 0.75}},
      transforms: [new Matrix4()]
    };
    const options = makeOptions([surface]);

    try {
      renderer.render(options);
      const originalModel = renderer.draws.at(-1)!.scene.surfaces[0].model;
      const originalTexture = originalModel.shaderInputs.getBindingValues()
        .pbr_transmissionFramebufferSampler as Texture;

      renderer.render(options);
      const reusedModel = renderer.draws.at(-1)!.scene.surfaces[0].model;
      expect(reusedModel).toBe(originalModel);
      expect(reusedModel.shaderInputs.getBindingValues().pbr_transmissionFramebufferSampler).toBe(
        originalTexture
      );

      options.width = 16;
      options.height = 12;
      renderer.render(options);
      const resizedModel = renderer.draws.at(-1)!.scene.surfaces[0].model;
      const resizedTexture = resizedModel.shaderInputs.getBindingValues()
        .pbr_transmissionFramebufferSampler as Texture;
      expect(resizedModel).not.toBe(originalModel);
      expect(resizedTexture).toMatchObject({width: 16, height: 12});
      expect(originalTexture.destroyed).toBe(true);

      options.transmission = false;
      renderer.draws.length = 0;
      renderer.render(options);
      expect(renderer.draws).toHaveLength(1);
      expect(renderer.draws[0].scene.surfaces[0].model).not.toBe(resizedModel);
      expect(
        renderer.draws[0].scene.surfaces[0].model.shaderInputs.getBindingValues()
      ).not.toHaveProperty('pbr_transmissionFramebufferSampler');
      expect(resizedTexture.destroyed).toBe(true);
    } finally {
      renderer.destroy();
    }
  });

  test('passes exact specular mip counts without imposing environment bindings on ordinary scenes', async () => {
    const device = await getNullTestDevice();
    const renderer = new InspectableSceneRenderer(device);
    const diffuseTexture = device.createTexture({
      dimension: 'cube',
      width: 4,
      height: 4,
      format: 'rgba8unorm'
    });
    const specularTexture = device.createTexture({
      dimension: 'cube',
      width: 8,
      height: 8,
      mipLevels: 4,
      format: 'rgba8unorm'
    });
    const brdfLUTTexture = device.createTexture({width: 4, height: 4, format: 'rgba8unorm'});
    const surface: SceneSurface = {
      id: 'environment-surface',
      geometry: makeGeometry(),
      material: {id: 'environment-material'},
      transforms: [new Matrix4()]
    };
    const options = makeOptions([surface]);

    try {
      renderer.render(options);
      const noEnvironmentModel = renderer.draws.at(-1)!.scene.surfaces[0].model;
      expect(noEnvironmentModel.shaderInputs.getUniformValues().pbrScene).toMatchObject({
        environmentMipCount: 1
      });

      options.environment = {diffuseTexture, specularTexture, brdfLUTTexture};
      renderer.render(options);
      const environmentModel = renderer.draws.at(-1)!.scene.surfaces[0].model;
      expect(environmentModel).not.toBe(noEnvironmentModel);
      expect(environmentModel.shaderInputs.getUniformValues().pbrScene).toMatchObject({
        environmentMipCount: 4
      });
      expect(environmentModel.shaderInputs.getBindingValues()).toMatchObject({
        pbr_diffuseEnvSampler: diffuseTexture,
        pbr_specularEnvSampler: specularTexture,
        pbr_brdfLUT: brdfLUTTexture
      });
    } finally {
      renderer.destroy();
      diffuseTexture.destroy();
      specularTexture.destroy();
      brdfLUTTexture.destroy();
    }
  });
});

describe('PBREnvironmentGenerator', () => {
  test('prepares complete roughness-mapped cubemaps, irradiance, and BRDF resources', async () => {
    const device = await getNullTestDevice();
    const source = device.createTexture({width: 16, height: 8, format: 'rgba8unorm'});
    const generator = new PBREnvironmentGenerator(device);

    try {
      const environment = generator.prepare({
        source,
        size: 8,
        irradianceSize: 4,
        brdfLUTSize: 4,
        sampleCount: 8,
        format: 'rgba8unorm',
        sourceEncoding: 'srgb',
        intensity: 2,
        rotation: 0.5
      });

      expect(environment).toBeInstanceOf(PreparedPBREnvironment);
      expect(environment.specularTexture).toMatchObject({
        dimension: 'cube',
        width: 8,
        depth: 6,
        mipLevels: 4
      });
      expect(environment.diffuseTexture).toMatchObject({
        dimension: 'cube',
        width: 4,
        depth: 6,
        mipLevels: 1
      });
      expect(environment.brdfLUTTexture).toMatchObject({
        dimension: '2d',
        width: 4,
        mipLevels: 1
      });
      expect(environment.intensity).toBe(2);
      expect(environment.rotation).toBe(0.5);

      environment.destroy();
      expect(environment.specularTexture.destroyed).toBe(true);
      expect(environment.diffuseTexture.destroyed).toBe(true);
      expect(environment.brdfLUTTexture.destroyed).toBe(true);
      expect(source.destroyed).toBe(false);
    } finally {
      generator.destroy();
      source.destroy();
    }
  });

  test('supports one-shot generation and rejects non-equirectangular texture dimensions', async () => {
    const device = await getNullTestDevice();
    const source = device.createTexture({width: 4, height: 2, format: 'rgba8unorm'});
    const cube = device.createTexture({
      dimension: 'cube',
      width: 4,
      height: 4,
      format: 'rgba8unorm'
    });
    const generator = new PBREnvironmentGenerator(device);

    try {
      expect(() => generator.prepare({source: cube})).toThrow();
      const environment = preparePBREnvironment(device, {
        source,
        size: 2,
        irradianceSize: 2,
        brdfLUTSize: 2,
        sampleCount: 2,
        format: 'rgba8unorm'
      });
      expect(environment.specularTexture.mipLevels).toBe(2);
      environment.destroy();
    } finally {
      generator.destroy();
      source.destroy();
      cube.destroy();
    }
  });

  test('never manually decodes hardware-sRGB source textures a second time', async () => {
    const device = await getNullTestDevice();
    const rawSRGBSource = device.createTexture({
      width: 4,
      height: 2,
      format: 'rgba8unorm'
    });
    const hardwareSRGBSource = device.createTexture({
      width: 4,
      height: 2,
      format: 'rgba8unorm-srgb'
    });
    const generator = new PBREnvironmentGenerator(device);
    const prepareOptions = {
      size: 2,
      irradianceSize: 2,
      brdfLUTSize: 2,
      sampleCount: 2,
      format: 'rgba8unorm' as const,
      sourceEncoding: 'srgb' as const
    };

    try {
      const rawEnvironment = generator.prepare({...prepareOptions, source: rawSRGBSource});
      const filterModel = (
        generator as unknown as {
          model: {shaderInputs: {getUniformValues(): Record<string, {sourceEncoding: number}>}};
        }
      ).model;
      expect(filterModel.shaderInputs.getUniformValues().pbrEnvironmentFilter.sourceEncoding).toBe(
        1
      );
      rawEnvironment.destroy();

      const hardwareEnvironment = generator.prepare({
        ...prepareOptions,
        source: hardwareSRGBSource
      });
      expect(filterModel.shaderInputs.getUniformValues().pbrEnvironmentFilter.sourceEncoding).toBe(
        0
      );
      hardwareEnvironment.destroy();
    } finally {
      generator.destroy();
      rawSRGBSource.destroy();
      hardwareSRGBSource.destroy();
    }
  });
});
