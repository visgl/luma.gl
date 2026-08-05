// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  PBREnvironmentGenerator,
  SceneRenderer,
  type SceneRenderOptions,
  type SceneSurface
} from '@luma.gl/experimental';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('SceneRenderer draws canonical instanced physical materials on available backends', async testCase => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([255, 128, 64, 255])
    });
    const renderer = new SceneRenderer(device);
    const surface: SceneSurface = {
      id: `physical-${device.type}`,
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
          NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
          TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
          COLOR_0: {size: 3, value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])}
        },
        indices: new Uint16Array([0, 1, 2])
      }),
      material: {
        id: `material-${device.type}`,
        doubleSided: true,
        uniforms: {
          baseColorFactor: [1, 1, 1, 1],
          metallicRoughnessValues: [0.7, 0.3],
          clearcoatFactor: 0.35,
          emissiveStrength: 2
        },
        bindings: {pbr_baseColorSampler: texture}
      },
      transforms: [new Matrix4().translate([-0.5, 0, 0]), new Matrix4().translate([0.5, 0, 0])]
    };
    const options = {
      id: `frame-${device.type}`,
      surfaces: [surface],
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
      lights: [
        {type: 'ambient' as const, color: [1, 1, 1] as [number, number, number], intensity: 0.2},
        {
          type: 'directional' as const,
          direction: [0, 0, -1] as [number, number, number],
          intensity: 1
        }
      ],
      width: 32,
      height: 32
    };

    try {
      const statistics = renderer.render(options);
      device.submit();
      testCase.equal(statistics.drawCount, 1, `${device.type} executes one canonical PBR draw`);
      testCase.equal(statistics.instanceCount, 2, `${device.type} preserves both placements`);
      testCase.equal(statistics.triangleCount, 2, `${device.type} counts indexed instances`);

      surface.material.uniforms = {...surface.material.uniforms, clearcoatFactor: 0.8};
      testCase.equal(renderer.render(options).drawCount, 1, `${device.type} updates PBR uniforms`);
      device.submit();
    } finally {
      renderer.destroy();
      texture.destroy();
    }
  }
  testCase.end();
});

test('SceneRenderer refracts captured opaque color while preserving opaque transmission alpha', async testCase => {
  let testedDeviceCount = 0;
  for (const device of await getLiveRenderingDevices()) {
    if (isSoftwareBackedWebGLDevice(device)) {
      testCase.comment('software WebGL cannot reliably compile scene-texture PBR variants');
      continue;
    }

    testedDeviceCount++;
    const colorTexture = device.createTexture({
      id: `${device.type}-refraction-output`,
      width: 32,
      height: 32,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });
    const renderer = new SceneRenderer(device);
    const geometry = makePhysicalTestGeometry();
    const backgroundSurface: SceneSurface = {
      id: `${device.type}-opaque-color`,
      geometry,
      material: {
        id: `${device.type}-opaque-color-material`,
        uniforms: {unlit: true, baseColorFactor: [1, 0.02, 0.02, 1]}
      },
      transforms: [new Matrix4().translate([0, 0, -1])]
    };
    const glassSurface: SceneSurface = {
      id: `${device.type}-transmissive-glass`,
      geometry,
      material: {
        id: `${device.type}-transmissive-glass-material`,
        alphaMode: 'OPAQUE',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1],
          metallicRoughnessValues: [0, 0.15],
          transmissionFactor: 1,
          thicknessFactor: 0.3,
          attenuationDistance: 2,
          attenuationColor: [1, 0.95, 0.95],
          ior: 1.5
        }
      },
      transforms: [new Matrix4()]
    };

    try {
      const statistics = renderer.render(
        makePhysicalRenderOptions(device, [glassSurface, backgroundSurface], framebuffer)
      );
      device.submit();
      const pixel = await readPhysicalTestPixel(colorTexture, 16, 16);
      const red = colorTexture.format.startsWith('bgra') ? pixel[2] : pixel[0];
      const green = pixel[1];

      testCase.equal(statistics.drawCount, 2, `${device.type} counts only final scene draws`);
      testCase.ok(red > green * 2, `${device.type} refracts captured red opaque scene color`);
      testCase.equal(pixel[3], 255, `${device.type} keeps physical transmission opaque`);
    } finally {
      renderer.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  testCase.ok(testedDeviceCount > 0, 'at least one hardware or WebGPU transmission backend runs');
  testCase.end();
});

test('PBREnvironmentGenerator integrates cubemap roughness mips and renders portable IBL', async testCase => {
  let testedDeviceCount = 0;
  for (const device of await getLiveRenderingDevices()) {
    if (isSoftwareBackedWebGLDevice(device)) {
      testCase.comment('software WebGL cannot reliably compile environment-texture PBR variants');
      continue;
    }

    testedDeviceCount++;
    const sourceData = new Uint8Array(4 * 2 * 4);
    for (let index = 0; index < sourceData.length; index += 4) {
      const horizontalCoordinate = (index / 4) % 4;
      sourceData.set(horizontalCoordinate < 2 ? [240, 20, 20, 255] : [240, 180, 20, 255], index);
    }
    const source = device.createTexture({
      id: `${device.type}-environment-equirectangular`,
      width: 4,
      height: 2,
      format: 'rgba8unorm',
      data: sourceData
    });
    const generator = new PBREnvironmentGenerator(device);
    const renderer = new SceneRenderer(device);

    try {
      const environment = generator.prepare({
        source,
        size: 4,
        irradianceSize: 2,
        brdfLUTSize: 4,
        sampleCount: 8,
        format: 'rgba8unorm',
        sourceEncoding: 'linear'
      });

      try {
        testCase.equal(
          environment.specularTexture.mipLevels,
          3,
          `${device.type} generates all mips`
        );
        const specularPixel = await readPhysicalTestPixel(environment.specularTexture, 0, 0);
        const roughSpecularPixel = await readPhysicalTestPixel(
          environment.specularTexture,
          0,
          0,
          2
        );
        const diffusePixel = await readPhysicalTestPixel(environment.diffuseTexture, 0, 0);
        const brdfPixel = await readPhysicalTestPixel(environment.brdfLUTTexture, 2, 2);
        testCase.ok(specularPixel[0] > specularPixel[1], `${device.type} filters source radiance`);
        testCase.ok(
          Math.abs(specularPixel[1] - roughSpecularPixel[1]) > 5,
          `${device.type} integrates different radiance at rough specular mip levels`
        );
        testCase.ok(
          diffusePixel[0] > diffusePixel[1],
          `${device.type} integrates diffuse irradiance`
        );
        testCase.ok(brdfPixel[0] > 0, `${device.type} integrates the split-sum BRDF lookup`);

        const surface: SceneSurface = {
          id: `${device.type}-environment-surface`,
          geometry: makePhysicalTestGeometry(),
          material: {
            id: `${device.type}-environment-material`,
            uniforms: {baseColorFactor: [1, 1, 1, 1], metallicRoughnessValues: [0.7, 0.8]}
          },
          transforms: [new Matrix4()]
        };
        const options = makePhysicalRenderOptions(device, [surface]);
        options.environment = environment;
        testCase.equal(
          renderer.render(options).drawCount,
          1,
          `${device.type} shades generated IBL`
        );
        device.submit();

        const srgbEnvironment = generator.prepare({
          source,
          size: 2,
          irradianceSize: 2,
          brdfLUTSize: 2,
          sampleCount: 8,
          format: 'rgba8unorm',
          sourceEncoding: 'srgb'
        });
        try {
          const linearSourcePixel = await readPhysicalTestPixel(environment.diffuseTexture, 0, 0);
          const convertedSourcePixel = await readPhysicalTestPixel(
            srgbEnvironment.diffuseTexture,
            0,
            0
          );
          testCase.ok(
            convertedSourcePixel[0] < linearSourcePixel[0],
            `${device.type} converts sRGB source radiance exactly once`
          );

          const hardwareSRGBSource = device.createTexture({
            id: `${device.type}-hardware-srgb-environment`,
            width: 4,
            height: 2,
            format: 'rgba8unorm-srgb',
            data: sourceData
          });
          try {
            const hardwareSRGBEnvironment = generator.prepare({
              source: hardwareSRGBSource,
              size: 2,
              irradianceSize: 2,
              brdfLUTSize: 2,
              sampleCount: 8,
              format: 'rgba8unorm',
              sourceEncoding: 'srgb'
            });
            try {
              const hardwareConvertedPixel = await readPhysicalTestPixel(
                hardwareSRGBEnvironment.diffuseTexture,
                0,
                0
              );
              testCase.ok(
                Math.abs(hardwareConvertedPixel[0] - convertedSourcePixel[0]) <= 2,
                `${device.type} avoids double-decoding hardware sRGB environment textures`
              );
            } finally {
              hardwareSRGBEnvironment.destroy();
            }
          } finally {
            hardwareSRGBSource.destroy();
          }
        } finally {
          srgbEnvironment.destroy();
        }
      } finally {
        environment.destroy();
      }
    } finally {
      renderer.destroy();
      generator.destroy();
      source.destroy();
    }
  }

  testCase.ok(testedDeviceCount > 0, 'at least one hardware or WebGPU environment backend runs');
  testCase.end();
});

function makePhysicalTestGeometry(): Geometry {
  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-4, -4, 0, 4, -4, 0, 0, 4, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
    },
    indices: new Uint16Array([0, 1, 2])
  });
}

function makePhysicalRenderOptions(
  device: Device,
  surfaces: SceneSurface[],
  framebuffer?: SceneRenderOptions['framebuffer']
): SceneRenderOptions {
  return {
    id: `${device.type}-physical-frame`,
    surfaces,
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
    background: [0.02, 0.65, 0.1, 1],
    width: 32,
    height: 32
  };
}

async function getLiveRenderingDevices(): Promise<Device[]> {
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  return webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;
}

function isSoftwareBackedWebGLDevice(device: Device): boolean {
  return (
    device.type === 'webgl' &&
    (device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      Boolean(device.info.fallback))
  );
}

async function readPhysicalTestPixel(
  texture: Texture,
  x: number,
  y: number,
  mipLevel = 0
): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1, mipLevel});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  try {
    texture.readBuffer({x, y, width: 1, height: 1, mipLevel}, buffer);
    const result = await buffer.readAsync(0, layout.byteLength);
    return new Uint8Array(result.buffer, result.byteOffset, 4);
  } finally {
    buffer.destroy();
  }
}
