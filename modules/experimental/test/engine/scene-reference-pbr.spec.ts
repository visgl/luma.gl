// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {SceneRenderer, type SceneRenderOptions, type SceneSurface} from '@luma.gl/experimental';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

type ReferenceRenderTarget = {
  color: Texture;
  depth: Texture;
  framebuffer: Framebuffer;
  destroy(): void;
};

test('SceneRenderer applies exposure, exact sRGB encoding, and selectable reference tone maps', async testCase => {
  let testedDeviceCount = 0;

  for (const device of await getReferenceTestDevices()) {
    if (isSoftwareBackedWebGL(device)) {
      testCase.comment('software WebGL cannot reliably compile full-suite reference PBR variants');
      continue;
    }

    testedDeviceCount++;
    const renderer = new SceneRenderer(device);
    const target = makeRenderTarget(device, 'rgba8unorm');
    const surface: SceneSurface = {
      id: `${device.type}-reference-color-surface`,
      geometry: makeFullscreenGeometry(),
      material: {
        id: `${device.type}-reference-color-material`,
        uniforms: {unlit: true, baseColorFactor: [0.25, 0.5, 1, 1]}
      },
      transforms: [new Matrix4()]
    };
    const options = makeRenderOptions(device, [surface], target.framebuffer);

    try {
      options.toneMapMode = 0;
      options.exposure = 1;
      options.outputColorSpace = 'srgb';
      testCase.equal(
        renderer.render(options).drawCount,
        1,
        `${device.type} shades reference color`
      );
      device.submit();

      if (supportsPixelReadback(device)) {
        const standardColor = await readUnsignedPixel(target.color, 16, 16);
        testCase.ok(
          Math.abs(standardColor[0] - 137) <= 2 && Math.abs(standardColor[1] - 188) <= 2,
          `${device.type} applies the exact linear-to-sRGB transfer function`
        );

        options.outputColorSpace = 'linear';
        renderer.render(options);
        device.submit();
        const linearColor = await readUnsignedPixel(target.color, 16, 16);
        testCase.ok(
          Math.abs(linearColor[0] - 64) <= 2 && Math.abs(linearColor[1] - 128) <= 2,
          `${device.type} preserves linear output without a second transfer function`
        );

        options.outputColorSpace = 'srgb';
        options.exposure = 0.5;
        renderer.render(options);
        device.submit();
        const lowExposure = await readUnsignedPixel(target.color, 16, 16);

        options.exposure = 2;
        renderer.render(options);
        device.submit();
        const highExposure = await readUnsignedPixel(target.color, 16, 16);
        testCase.ok(
          highExposure[0] > lowExposure[0] + 50,
          `${device.type} applies scene exposure to physical fragment output`
        );

        options.toneMapMode = 1;
        renderer.render(options);
        device.submit();
        const reinhardColor = await readUnsignedPixel(target.color, 16, 16);

        options.toneMapMode = 2;
        renderer.render(options);
        device.submit();
        const neutralColor = await readUnsignedPixel(target.color, 16, 16);

        options.toneMapMode = 3;
        renderer.render(options);
        device.submit();
        const acesColor = await readUnsignedPixel(target.color, 16, 16);

        testCase.ok(
          Math.abs(reinhardColor[2] - neutralColor[2]) > 10,
          `${device.type} distinguishes Reinhard and Khronos PBR Neutral highlights`
        );
        testCase.ok(
          Math.abs(acesColor[0] - neutralColor[0]) > 5,
          `${device.type} distinguishes ACES from Khronos PBR Neutral tone mapping`
        );
      } else {
        testCase.comment(
          'software WebGPU renders exposure/tone modes without unsupported MAP_READ'
        );
      }
    } finally {
      renderer.destroy();
      target.destroy();
    }
  }

  testCase.ok(testedDeviceCount > 0, 'at least one portable reference-color backend runs');
  testCase.end();
});

test('SceneRenderer preserves linear HDR radiance and captures chromatic physical dispersion', async testCase => {
  let testedDeviceCount = 0;

  for (const device of await getReferenceTestDevices()) {
    if (isSoftwareBackedWebGL(device)) {
      testCase.comment('software WebGL cannot reliably compile full-suite transmission variants');
      continue;
    }

    testedDeviceCount++;
    const renderer = new SceneRenderer(device);
    const target = makeRenderTarget(device, 'rgba8unorm');
    const background: SceneSurface = {
      id: `${device.type}-dispersion-spectrum`,
      geometry: makeFullscreenGeometry({vertexColors: true}),
      material: {
        id: `${device.type}-dispersion-spectrum-material`,
        uniforms: {unlit: true, baseColorFactor: [1, 1, 1, 1]}
      },
      transforms: [new Matrix4().translate([0, 0, -1])]
    };
    const glass: SceneSurface = {
      id: `${device.type}-dispersion-glass`,
      geometry: makeFullscreenGeometry({tiltedNormal: true}),
      material: {
        id: `${device.type}-dispersion-glass-material`,
        alphaMode: 'OPAQUE',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1],
          metallicRoughnessValues: [0, 0.05],
          transmissionFactor: 1,
          thicknessFactor: 2,
          ior: 1.7,
          dispersion: 0
        }
      },
      transforms: [new Matrix4()]
    };
    const options = makeRenderOptions(device, [glass, background], target.framebuffer);
    options.toneMapMode = 0;

    try {
      testCase.equal(renderer.render(options).drawCount, 2, `${device.type} captures opaque color`);
      device.submit();

      if (supportsPixelReadback(device)) {
        const ordinaryRefraction = await readUnsignedPixel(target.color, 16, 16);
        glass.material.uniforms = {...glass.material.uniforms, dispersion: 24};
        renderer.render(options);
        device.submit();
        const dispersedRefraction = await readUnsignedPixel(target.color, 16, 16);
        const colorDifference =
          Math.abs(ordinaryRefraction[0] - dispersedRefraction[0]) +
          Math.abs(ordinaryRefraction[1] - dispersedRefraction[1]) +
          Math.abs(ordinaryRefraction[2] - dispersedRefraction[2]);
        testCase.ok(
          colorDifference >= 4,
          `${device.type} separates transmission wavelengths using ratified dispersion (${colorDifference})`
        );
        testCase.equal(dispersedRefraction[3], 255, `${device.type} keeps dispersive glass opaque`);
      } else {
        glass.material.uniforms = {...glass.material.uniforms, dispersion: 24};
        testCase.equal(renderer.render(options).drawCount, 2, 'software WebGPU renders dispersion');
        device.submit();
      }

      const capabilities = device.getTextureFormatCapabilities('rgba16float');
      if (capabilities.render && supportsPixelReadback(device)) {
        const highDynamicRangeTarget = makeRenderTarget(device, 'rgba16float');
        try {
          const emissiveSurface: SceneSurface = {
            id: `${device.type}-linear-hdr-emissive`,
            geometry: makeFullscreenGeometry(),
            material: {
              id: `${device.type}-linear-hdr-emissive-material`,
              uniforms: {unlit: true, baseColorFactor: [2, 0.5, 0.125, 1]}
            },
            transforms: [new Matrix4()]
          };
          const highDynamicRangeOptions = makeRenderOptions(
            device,
            [emissiveSurface],
            highDynamicRangeTarget.framebuffer
          );
          highDynamicRangeOptions.exposure = 2;
          testCase.equal(
            renderer.render(highDynamicRangeOptions).drawCount,
            1,
            `${device.type} renders to a true HDR attachment`
          );
          device.submit();
          const highDynamicRangePixel = await readFloat16Pixel(
            highDynamicRangeTarget.color,
            16,
            16
          );
          testCase.ok(
            Math.abs(highDynamicRangePixel[0] - 4) < 0.05,
            `${device.type} preserves unclamped HDR linear red radiance (${highDynamicRangePixel[0]})`
          );
          testCase.ok(
            Math.abs(highDynamicRangePixel[1] - 1) < 0.03,
            `${device.type} applies exposure before linear HDR presentation`
          );
        } finally {
          highDynamicRangeTarget.destroy();
        }
      }
    } finally {
      renderer.destroy();
      target.destroy();
    }
  }

  testCase.ok(testedDeviceCount > 0, 'at least one portable transmission backend runs');
  testCase.end();
});

function makeFullscreenGeometry(
  options: {vertexColors?: boolean; tiltedNormal?: boolean} = {}
): Geometry {
  const normal = options.tiltedNormal ? [0.8, 0, 0.6] : [0, 0, 1];
  const attributes: ConstructorParameters<typeof Geometry>[0]['attributes'] = {
    POSITION: {
      size: 3,
      value: new Float32Array([-5, -5, 0, 5, -5, 0, 5, 5, 0, -5, 5, 0])
    },
    NORMAL: {size: 3, value: new Float32Array([...normal, ...normal, ...normal, ...normal])}
  };
  if (options.vertexColors) {
    attributes.COLOR_0 = {
      size: 3,
      value: new Float32Array([1, 0.05, 0, 0, 0.1, 1, 0, 1, 0.1, 1, 0, 0.05])
    };
  }
  return new Geometry({
    topology: 'triangle-list',
    attributes,
    indices: new Uint16Array([0, 1, 2, 0, 2, 3])
  });
}

function makeRenderTarget(
  device: Device,
  format: 'rgba8unorm' | 'rgba16float'
): ReferenceRenderTarget {
  const color = device.createTexture({
    width: 32,
    height: 32,
    format,
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

function makeRenderOptions(
  device: Device,
  surfaces: SceneSurface[],
  framebuffer: Framebuffer
): SceneRenderOptions {
  return {
    id: `${device.type}-reference-frame`,
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
    background: [0, 0, 0, 1],
    width: 32,
    height: 32
  };
}

async function getReferenceTestDevices(): Promise<Device[]> {
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  return webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;
}

function isSoftwareBackedWebGL(device: Device): boolean {
  return device.type === 'webgl' && isSoftwareBacked(device);
}

function supportsPixelReadback(device: Device): boolean {
  return device.type !== 'webgpu' || !isSoftwareBacked(device);
}

function isSoftwareBacked(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

async function readPixelBytes(texture: Texture, x: number, y: number): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({x, y, width: 1, height: 1}, buffer);
    const data = await buffer.readAsync(0, layout.byteLength);
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
  } finally {
    buffer.destroy();
  }
}

async function readUnsignedPixel(texture: Texture, x: number, y: number): Promise<Uint8Array> {
  const bytes = await readPixelBytes(texture, x, y);
  return bytes.slice(0, 4);
}

async function readFloat16Pixel(texture: Texture, x: number, y: number): Promise<number[]> {
  const bytes = await readPixelBytes(texture, x, y);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [0, 1, 2, 3].map(index => decodeFloat16(view.getUint16(index * 2, true)));
}

function decodeFloat16(value: number): number {
  const sign = (value & 0x8000) === 0 ? 1 : -1;
  const exponent = (value >> 10) & 0x1f;
  const fraction = value & 0x03ff;
  if (exponent === 0) {
    return sign * 2 ** -14 * (fraction / 1024);
  }
  if (exponent === 31) {
    return fraction ? Number.NaN : sign * Number.POSITIVE_INFINITY;
  }
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}
