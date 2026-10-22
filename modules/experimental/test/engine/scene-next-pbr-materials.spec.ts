// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {ClipSpace, Geometry} from '@luma.gl/engine';
import {SceneRenderer, type SceneRenderOptions, type SceneSurface} from '@luma.gl/experimental';
import {pbrMaterial, pbrScene, type ShaderModule} from '@luma.gl/shadertools';
import {PBREnvironmentGenerator} from '@luma.gl/experimental';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

type ExperimentalMaterialTarget = {
  color: Texture;
  depth: Texture;
  framebuffer: Framebuffer;
  destroy(): void;
};

it('SceneRenderer exchanges diffuse reflection for backlit transmission and bounded volume scattering', async () => {
  let testedDeviceCount = 0;

  for (const device of await getExperimentalMaterialDevices()) {
    if (isSoftwareBackedWebGL(device)) {
      void 0;
      continue;
    }

    testedDeviceCount++;
    const renderer = new SceneRenderer(device);
    const target = makeExperimentalMaterialTarget(device);
    const surface = makeExperimentalMaterialSurface(device);
    const options = makeExperimentalMaterialOptions(device, surface, target.framebuffer, [0, 0, 1]);

    try {
      expect(renderer.render(options).drawCount, `${device.type} renders backlit PBR`).toBe(1);
      device.submit();

      if (supportsPixelReadback(device)) {
        const opaqueBacklight = await readMaterialPixel(target.color);

        surface.material.uniforms = {
          ...surface.material.uniforms,
          diffuseTransmissionFactor: 1,
          diffuseTransmissionColorFactor: [1, 0.2, 0.08]
        };
        renderer.render(options);
        device.submit();
        const transmittedBacklight = await readMaterialPixel(target.color);

        expect(
          Boolean(transmittedBacklight[0] > opaqueBacklight[0] + 35),
          `${device.type} receives diffuse light from the opposite hemisphere (${opaqueBacklight[0]} -> ${transmittedBacklight[0]})`
        ).toBe(true);
        expect(
          Boolean(transmittedBacklight[0] > transmittedBacklight[1] * 2),
          `${device.type} applies the authored diffuse-transmission color`
        ).toBe(true);
        expect(transmittedBacklight[3], `${device.type} preserves opaque alpha`).toBe(255);

        options.lights = [
          {type: 'directional', color: [1, 1, 1], direction: [0, 0, -1], intensity: 3}
        ];
        surface.material.uniforms = {
          ...surface.material.uniforms,
          diffuseTransmissionFactor: 0
        };
        renderer.render(options);
        device.submit();
        const opaqueFrontlight = await readMaterialPixel(target.color);

        surface.material.uniforms = {
          ...surface.material.uniforms,
          diffuseTransmissionFactor: 1
        };
        renderer.render(options);
        device.submit();
        const transmittedFrontlight = await readMaterialPixel(target.color);

        expect(
          Boolean(opaqueFrontlight[0] > transmittedFrontlight[0] + 30),
          `${device.type} exchanges front-facing diffuse energy for transmission`
        ).toBe(true);

        options.lights = [
          {type: 'directional', color: [1, 1, 1], direction: [0, 0, 1], intensity: 3}
        ];
        surface.material.uniforms = {
          ...surface.material.uniforms,
          thicknessFactor: 0.8,
          attenuationDistance: 0.6,
          attenuationColor: [1, 1, 1],
          diffuseTransmissionColorFactor: [1, 1, 1],
          multiscatterColorFactor: [0.8, 0.2, 0.08],
          scatterAnisotropy: 0.35
        };
        renderer.render(options);
        device.submit();
        const scatteredBacklight = await readMaterialPixel(target.color);

        expect(
          Boolean(scatteredBacklight[0] > scatteredBacklight[1] + 15),
          `${device.type} applies thickness-aware experimental scattering color`
        ).toBe(true);
      } else {
        surface.material.uniforms = {
          ...surface.material.uniforms,
          diffuseTransmissionFactor: 0.8,
          diffuseTransmissionColorFactor: [1, 0.2, 0.1],
          thicknessFactor: 0.4,
          multiscatterColorFactor: [0.8, 0.4, 0.2],
          scatterAnisotropy: 0.3
        };
        expect(renderer.render(options).drawCount, 'software WebGPU shades transmission').toBe(1);
        device.submit();
      }
    } finally {
      renderer.destroy();
      target.destroy();
    }
  }

  expect(
    Boolean(testedDeviceCount > 0),
    'at least one supported physical-material backend runs'
  ).toBe(true);
  void 0;
});

it('SceneRenderer specializes bump, diffuse alpha/color, and draft scatter texture bindings', async () => {
  let testedDeviceCount = 0;

  for (const device of await getExperimentalMaterialDevices()) {
    if (isSoftwareBackedWebGL(device)) {
      void 0;
      continue;
    }

    testedDeviceCount++;
    const renderer = new SceneRenderer(device);
    const target = makeExperimentalMaterialTarget(device);
    const bumpTexture = makeMaterialTexture(device, (x, _y) => [x * 64, 0, 0, 255]);
    const factorTexture = makeMaterialTexture(device, () => [0, 0, 0, 255]);
    const colorTexture = makeMaterialTexture(device, () => [255, 64, 32, 255]);
    const scatteringTexture = makeMaterialTexture(device, () => [255, 128, 48, 255]);
    const normalTexture = makeMaterialTexture(device, () => [128, 128, 255, 255]);
    const surface = makeExperimentalMaterialSurface(device);
    const options = makeExperimentalMaterialOptions(
      device,
      surface,
      target.framebuffer,
      [-0.8, 0, -0.6]
    );
    surface.material.bindings = {
      pbr_normalSampler: normalTexture,
      pbr_bumpSampler: bumpTexture
    };

    try {
      surface.material.uniforms = {...surface.material.uniforms, bumpFactor: 0};
      expect(renderer.render(options).drawCount, `${device.type} binds bump + normal maps`).toBe(1);
      device.submit();

      if (supportsPixelReadback(device)) {
        const flatNormal = await readMaterialPixel(target.color);
        surface.material.uniforms = {...surface.material.uniforms, bumpFactor: 4};
        renderer.render(options);
        device.submit();
        const bumpedNormal = await readMaterialPixel(target.color);

        expect(
          Boolean(Math.abs(bumpedNormal[0] - flatNormal[0]) > 8),
          `${device.type} perturbs mapped normals from the linear bump height channel (${flatNormal[0]} -> ${bumpedNormal[0]})`
        ).toBe(true);
      }

      surface.material.bindings = {
        pbr_normalSampler: normalTexture,
        pbr_bumpSampler: bumpTexture,
        pbr_diffuseTransmissionSampler: factorTexture,
        pbr_diffuseTransmissionColorSampler: colorTexture,
        pbr_multiscatterColorSampler: scatteringTexture
      };
      surface.material.uniforms = {
        ...surface.material.uniforms,
        bumpFactor: 0,
        diffuseTransmissionFactor: 1,
        diffuseTransmissionColorFactor: [1, 1, 1],
        thicknessFactor: 0.5,
        attenuationDistance: 1,
        attenuationColor: [1, 1, 1],
        multiscatterColorFactor: [0.8, 0.8, 0.8],
        scatterAnisotropy: 0.15
      };
      options.lights = [
        {type: 'directional', color: [1, 1, 1], direction: [0, 0, 1], intensity: 3}
      ];

      expect(
        renderer.render(options).drawCount,
        `${device.type} specializes all four optional extension sampler bindings`
      ).toBe(1);
      device.submit();

      if (supportsPixelReadback(device)) {
        const texturedTransmission = await readMaterialPixel(target.color);
        expect(
          Boolean(texturedTransmission[0] > texturedTransmission[1] * 1.5),
          `${device.type} combines diffuse alpha, authored color, and scattering textures`
        ).toBe(true);
      }
    } finally {
      renderer.destroy();
      target.destroy();
      bumpTexture.destroy();
      factorTexture.destroy();
      colorTexture.destroy();
      scatteringTexture.destroy();
      normalTexture.destroy();
    }
  }

  expect(
    Boolean(testedDeviceCount > 0),
    'at least one supported textured-material backend runs'
  ).toBe(true);
  void 0;
});

function makeExperimentalMaterialSurface(device: Device): SceneSurface {
  return {
    id: `${device.type}-next-pbr-surface`,
    geometry: new Geometry({
      topology: 'triangle-list',
      attributes: {
        POSITION: {
          size: 3,
          value: new Float32Array([-5, -5, 0, 5, -5, 0, 5, 5, 0, -5, 5, 0])
        },
        NORMAL: {
          size: 3,
          value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
        },
        TANGENT: {
          size: 4,
          value: new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1])
        },
        TEXCOORD_0: {
          size: 2,
          value: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])
        }
      },
      indices: new Uint16Array([0, 1, 2, 0, 2, 3])
    }),
    material: {
      id: `${device.type}-next-pbr-material`,
      uniforms: {
        baseColorFactor: [1, 1, 1, 1],
        metallicRoughnessValues: [0, 0.9]
      }
    },
    transforms: [new Matrix4()]
  };
}

function makeExperimentalMaterialOptions(
  device: Device,
  surface: SceneSurface,
  framebuffer: Framebuffer,
  direction: [number, number, number]
): SceneRenderOptions {
  return {
    id: `${device.type}-next-pbr-frame`,
    surfaces: [surface],
    framebuffer,
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 1,
        near: 0.1,
        far: 100
      }),
      position: [0, 0, 4]
    },
    lights: [{type: 'directional', color: [1, 1, 1], direction, intensity: 3}],
    background: [0, 0, 0, 1],
    toneMapMode: 0,
    outputColorSpace: 'linear',
    width: 32,
    height: 32
  };
}

function makeExperimentalMaterialTarget(device: Device): ExperimentalMaterialTarget {
  const color = device.createTexture({
    width: 32,
    height: 32,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const depth = device.createTexture({
    width: 32,
    height: 32,
    format: 'depth24plus',
    usage: Texture.RENDER
  });
  const framebuffer = device.createFramebuffer({
    width: 32,
    height: 32,
    colorAttachments: [color],
    depthStencilAttachment: depth
  });

  return {
    color,
    depth,
    framebuffer,
    destroy() {
      framebuffer.destroy();
      color.destroy();
      depth.destroy();
    }
  };
}

function makeMaterialTexture(
  device: Device,
  getPixel: (x: number, y: number) => [number, number, number, number]
): Texture {
  const pixels = new Uint8Array(4 * 4 * 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      pixels.set(getPixel(x, y), (y * 4 + x) * 4);
    }
  }
  return device.createTexture({width: 4, height: 4, format: 'rgba8unorm', data: pixels});
}

async function getExperimentalMaterialDevices(): Promise<Device[]> {
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  return webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;
}

function isSoftwareBackedWebGL(device: Device): boolean {
  return device.type === 'webgl' && isSoftwareBackedDevice(device);
}

function supportsPixelReadback(device: Device): boolean {
  return device.type !== 'webgpu' || !isSoftwareBackedDevice(device);
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

async function readMaterialPixel(texture: Texture): Promise<Uint8Array> {
  const memoryLayout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: memoryLayout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({x: 16, y: 16, width: 1, height: 1}, buffer);
    const bytes = await buffer.readAsync(0, memoryLayout.byteLength);
    return new Uint8Array(bytes.buffer, bytes.byteOffset, 4).slice();
  } finally {
    buffer.destroy();
  }
}

it('PBR spotlight shadows preserve image-based lighting and emissive radiance', async () => {
  const visibility = {
    name: 'shadowTest',
    uniformTypes: {visibility: 'f32'},
    source:
      'struct ShadowTest {visibility:f32}; @group(0) @binding(auto) var<uniform> shadowTest:ShadowTest;',
    fs: 'layout(std140) uniform shadowTestUniforms {float visibility;} shadowTest;'
  } as const satisfies ShaderModule;
  for (const device of await getExperimentalMaterialDevices()) {
    if (!supportsPixelReadback(device) || isSoftwareBackedWebGL(device)) continue;
    const target = makeExperimentalMaterialTarget(device);
    const source = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([90, 110, 130, 255])
    });
    const generator = new PBREnvironmentGenerator(device);
    const environment = generator.prepare({
      source,
      size: 8,
      irradianceSize: 4,
      brdfLUTSize: 8,
      sampleCount: 16
    });
    const model = new ClipSpace(device, {
      modules: [pbrMaterial, pbrScene, visibility],
      defines: {
        USE_LIGHTS: true,
        USE_IBL: true,
        USE_SCENE_ENVIRONMENT: true,
        USE_SCENE_COLOR_MANAGEMENT: true,
        HAS_NORMALS: true,
        HAS_UV: true,
        USE_MATERIAL_EXTENSIONS: true
      },
      source: `@fragment fn fragmentMain(input:FragmentInputs)->@location(0) vec4f {
        fragmentInputs.pbr_vPosition=vec3f(input.uv*2.0-1.0,0);
        fragmentInputs.pbr_vNormal=vec3f(0,0,1);
        fragmentInputs.pbr_vUV0=input.uv;fragmentInputs.pbr_vUV1=input.uv;
        return pbr_filterColorWithSpotShadows(vec4f(1),vec4f(shadowTest.visibility,1,1,1));
      }`,
      fs: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 color;
      void main() {
        color=pbr_filterColorWithSpotShadows(vec4(1.0),vec4(shadowTest.visibility,1.0,1.0,1.0));
      }`,
      inject:
        device.type === 'webgl'
          ? {
              'vs:#main-end':
                'pbr_vPosition=vec3(clipSpacePositions,0.0); pbr_vNormal=vec3(0.0,0.0,1.0); pbr_vUV0=texCoords; pbr_vUV1=texCoords;'
            }
          : {},
      colorAttachmentFormats: ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    const draw = async (
      shadowVisibility: number,
      lightIntensity: number,
      clearcoatFactor: number
    ) => {
      model.shaderInputs.setProps({
        shadowTest: {visibility: shadowVisibility},
        pbrProjection: {camera: [0, 0, 3]},
        pbrMaterial: {
          baseColorFactor: [0.5, 0.5, 0.5, 1],
          metallicRoughnessValues: [0, 0.5],
          IBLenabled: true,
          emissiveFactor: [0.03, 0.02, 0.01],
          clearcoatFactor
        },
        pbrScene: {
          outputEncoding: 0,
          toneMapMode: 0,
          environmentRotation: 0,
          environmentMipCount: environment.specularTexture.mipLevels
        },
        ibl: {
          pbr_diffuseEnvSampler: environment.diffuseTexture,
          pbr_specularEnvSampler: environment.specularTexture,
          pbr_brdfLUT: environment.brdfLUTTexture
        },
        lighting: {
          lights: [
            {
              type: 'spot',
              position: [0, 0, 3],
              direction: [0, 0, -1],
              color: [255, 255, 255],
              intensity: lightIntensity,
              innerConeAngle: 0.3,
              outerConeAngle: 0.6
            }
          ]
        }
      });
      const pass = device.beginRenderPass({
        framebuffer: target.framebuffer,
        clearColor: [0, 0, 0, 1],
        clearDepth: 1
      });
      model.draw(pass);
      pass.end();
      device.submit();
      return readMaterialPixel(target.color);
    };
    try {
      for (const clearcoat of [0, 0.5]) {
        const environmentOnly = await draw(1, 0, clearcoat);
        const shadowed = await draw(0, 2, clearcoat);
        const illuminated = await draw(1, 2, clearcoat);
        expect(
          Array.from(shadowed),
          `${device.type}: shadows leave IBL and emission unchanged`
        ).toEqual(Array.from(environmentOnly));
        expect(shadowed[0], `${device.type}: indirect lighting remains visible`).toBeGreaterThan(
          10
        );
        expect(
          illuminated[0],
          `${device.type}: only the direct spotlight is removed`
        ).toBeGreaterThan(shadowed[0] + 20);
      }
    } finally {
      model.destroy();
      target.destroy();
      environment.destroy();
      generator.destroy();
      source.destroy();
    }
  }
});
