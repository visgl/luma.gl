// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Texture} from '@luma.gl/core';
import {CubeGeometry, Model} from '@luma.gl/engine';
import {fromHalfFloat} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {SpectralCausticsRenderer} from '../../src/rendering/spectral-caustics-renderer';

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

test('spectral caustics renderer records its WebGPU capture, trace, and splat passes', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const renderer = new SpectralCausticsRenderer(device, {
    id: 'spectral-caustics-renderer-browser-test',
    captureSize: 16,
    mapSize: 16,
    splatRadius: 1.5
  });
  const captureModel = new Model(device, {
    id: 'spectral-caustics-capture-cube',
    source: CAPTURE_SHADER,
    geometry: new CubeGeometry({indices: true}),
    colorAttachmentFormats: ['rgba16float'],
    depthStencilAttachmentFormat: 'depth32float'
  });
  try {
    const receiverProps = renderer.encode(device.commandEncoder, {
      lightViewProjectionMatrix: IDENTITY_MATRIX,
      inverseLightViewProjectionMatrix: IDENTITY_MATRIX,
      receiverOrigin: [0, 0, 0.85],
      receiverTangent: [1, 0, 0],
      receiverBitangent: [0, 1, 0],
      receiverNormal: [0, 0, 1],
      receiverWidth: 2,
      receiverHeight: 2,
      intensity: 8,
      prepareRefractor: ({commandEncoder, captureParameters}) => {
        captureModel.setParameters(captureParameters);
        captureModel.predraw(commandEncoder);
      },
      drawRefractor: ({renderPass}) => captureModel.draw(renderPass)
    });
    device.submit();

    t.equal(receiverProps.causticMap, renderer.causticMap, 'encode returns the owned HDR XYZ map');
    t.equal(renderer.causticMap.format, 'rgba16float', 'caustic radiance remains floating point');
    const xyzPixels = await readRgba16FloatTexture(renderer.causticMap, 16, 16);
    t.ok(xyzPixels.every(Number.isFinite), 'traced XYZ radiance remains finite');
    t.ok(Math.max(...xyzPixels) > 1, 'a closed refractor deposits photon energy above SDR white');
  } finally {
    captureModel.destroy();
    renderer.destroy();
  }
  t.end();
});

const CAPTURE_SHADER = /* wgsl */ `\
struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldNormal: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * vec3f(0.4, 0.4, 0.18) + vec3f(0.0, 0.0, 0.4);
  var output: FragmentInputs;
  output.position = vec4f(worldPosition, 1.0);
  output.worldNormal = inputs.normals;
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  return vec4f(normalize(inputs.worldNormal) * 0.5 + 0.5, 1.0);
}
`;

async function readRgba16FloatTexture(
  texture: Texture,
  width: number,
  height: number
): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width, height});
  const readback = texture.device.createBuffer({
    id: 'spectral-caustics-readback',
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, readback);
    texture.device.submit();
    const bytes = await readback.readAsync(0, layout.byteLength);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const pixels: number[] = [];
    for (let yCoordinate = 0; yCoordinate < height; yCoordinate++) {
      for (let xCoordinate = 0; xCoordinate < width; xCoordinate++) {
        const byteOffset = yCoordinate * layout.bytesPerRow + xCoordinate * layout.bytesPerPixel;
        for (let channel = 0; channel < 3; channel++) {
          pixels.push(
            fromHalfFloat(
              view.getUint16(byteOffset + channel * Uint16Array.BYTES_PER_ELEMENT, true)
            )
          );
        }
      }
    }
    return pixels;
  } finally {
    readback.destroy();
  }
}
