// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {SceneRenderer, type SceneRenderOptions, type SceneSurface} from '@luma.gl/experimental';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

type ExperimentalMaterialTarget = {
  color: Texture;
  depth: Texture;
  framebuffer: Framebuffer;
  destroy(): void;
};

test('SceneRenderer exchanges diffuse reflection for backlit transmission and bounded volume scattering', async testCase => {
  let testedDeviceCount = 0;

  for (const device of await getExperimentalMaterialDevices()) {
    if (isSoftwareBackedWebGL(device)) {
      testCase.comment('software WebGL cannot reliably compile full-suite physical PBR variants');
      continue;
    }

    testedDeviceCount++;
    const renderer = new SceneRenderer(device);
    const target = makeExperimentalMaterialTarget(device);
    const surface = makeExperimentalMaterialSurface(device);
    const options = makeExperimentalMaterialOptions(
      device,
      surface,
      target.framebuffer,
      [0, 0, -1]
    );

    try {
      testCase.equal(renderer.render(options).drawCount, 1, `${device.type} renders backlit PBR`);
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

        testCase.ok(
          transmittedBacklight[0] > opaqueBacklight[0] + 35,
          `${device.type} receives diffuse light from the opposite hemisphere (${opaqueBacklight[0]} -> ${transmittedBacklight[0]})`
        );
        testCase.ok(
          transmittedBacklight[0] > transmittedBacklight[1] * 2,
          `${device.type} applies the authored diffuse-transmission color`
        );
        testCase.equal(transmittedBacklight[3], 255, `${device.type} preserves opaque alpha`);

        options.lights = [
          {type: 'directional', color: [1, 1, 1], direction: [0, 0, 1], intensity: 3}
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

        testCase.ok(
          opaqueFrontlight[0] > transmittedFrontlight[0] + 30,
          `${device.type} exchanges front-facing diffuse energy for transmission`
        );

        options.lights = [
          {type: 'directional', color: [1, 1, 1], direction: [0, 0, -1], intensity: 3}
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

        testCase.ok(
          scatteredBacklight[0] > scatteredBacklight[1] + 15,
          `${device.type} applies thickness-aware experimental scattering color`
        );
      } else {
        surface.material.uniforms = {
          ...surface.material.uniforms,
          diffuseTransmissionFactor: 0.8,
          diffuseTransmissionColorFactor: [1, 0.2, 0.1],
          thicknessFactor: 0.4,
          multiscatterColorFactor: [0.8, 0.4, 0.2],
          scatterAnisotropy: 0.3
        };
        testCase.equal(
          renderer.render(options).drawCount,
          1,
          'software WebGPU shades transmission'
        );
        device.submit();
      }
    } finally {
      renderer.destroy();
      target.destroy();
    }
  }

  testCase.ok(testedDeviceCount > 0, 'at least one supported physical-material backend runs');
  testCase.end();
});

test('SceneRenderer specializes bump, diffuse alpha/color, and draft scatter texture bindings', async testCase => {
  let testedDeviceCount = 0;

  for (const device of await getExperimentalMaterialDevices()) {
    if (isSoftwareBackedWebGL(device)) {
      testCase.comment('software WebGL cannot reliably compile multiple physical texture bindings');
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
      [0.8, 0, 0.6]
    );
    surface.material.bindings = {
      pbr_normalSampler: normalTexture,
      pbr_bumpSampler: bumpTexture
    };

    try {
      surface.material.uniforms = {...surface.material.uniforms, bumpFactor: 0};
      testCase.equal(
        renderer.render(options).drawCount,
        1,
        `${device.type} binds bump + normal maps`
      );
      device.submit();

      if (supportsPixelReadback(device)) {
        const flatNormal = await readMaterialPixel(target.color);
        surface.material.uniforms = {...surface.material.uniforms, bumpFactor: 4};
        renderer.render(options);
        device.submit();
        const bumpedNormal = await readMaterialPixel(target.color);

        testCase.ok(
          Math.abs(bumpedNormal[0] - flatNormal[0]) > 8,
          `${device.type} perturbs mapped normals from the linear bump height channel (${flatNormal[0]} -> ${bumpedNormal[0]})`
        );
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
        {type: 'directional', color: [1, 1, 1], direction: [0, 0, -1], intensity: 3}
      ];

      testCase.equal(
        renderer.render(options).drawCount,
        1,
        `${device.type} specializes all four optional extension sampler bindings`
      );
      device.submit();

      if (supportsPixelReadback(device)) {
        const texturedTransmission = await readMaterialPixel(target.color);
        testCase.ok(
          texturedTransmission[0] > texturedTransmission[1] * 1.5,
          `${device.type} combines diffuse alpha, authored color, and scattering textures`
        );
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

  testCase.ok(testedDeviceCount > 0, 'at least one supported textured-material backend runs');
  testCase.end();
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
