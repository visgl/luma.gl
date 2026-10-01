// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, Layer, OrthographicView} from '@deck.gl/core';
import type {RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {ShaderAssembler} from '@luma.gl/shadertools';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {expect, it} from 'vitest';

const VIEWPORT_SIZE = 16;
const REGION_OFFSET = 4;
const REGION_SIZE = 8;
const CHANNEL_TOLERANCE = 2;
const TEST_TIMEOUT_MILLISECONDS = 10_000;
/** `FULL_VIEWPORT_SHADER` fill color as 8-bit RGBA. */
const EXPECTED_PIXEL = [51, 153, 255, 255];

const FULL_VIEWPORT_SHADER = /* wgsl */ `\
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(0.2, 0.6, 1.0, 1.0);
}
`;

/** Minimal deck.gl layer that covers the viewport with one opaque color. */
class FullViewportLayer extends Layer {
  static override layerName = 'FullViewportLayer';

  override initializeState(): void {
    const model = new Model(this.context.device, {
      id: `${this.id}-model`,
      source: FULL_VIEWPORT_SHADER,
      shaderAssembler: ShaderAssembler.getDefaultShaderAssembler('wgsl'),
      topology: 'triangle-list',
      vertexCount: 3,
      bufferLayout: [],
      parameters: {depthWriteEnabled: false, depthCompare: 'always'}
    });
    this.setState({model});
  }

  override getModels(): Model[] {
    const {model} = this.state as {model?: Model};
    return model ? [model] : [];
  }

  override draw({renderPass}: {renderPass: RenderPass}): void {
    (this.state as {model: Model}).model.draw(renderPass);
  }
}

it('Deck renders one frame on an attached application GPUDevice', async () => {
  // A missing WebGPU adapter must fail this test instead of skipping it.
  expect(navigator.gpu, 'navigator.gpu').toBeTruthy();
  const gpuAdapter = await navigator.gpu.requestAdapter();
  expect(gpuAdapter, 'navigator.gpu.requestAdapter()').not.toBeNull();
  const gpuDevice = await gpuAdapter!.requestDevice({
    requiredLimits: {
      maxStorageBuffersPerShaderStage: gpuAdapter!.limits.maxStorageBuffersPerShaderStage
    }
  });

  const parent = document.createElement('div');
  parent.style.width = `${VIEWPORT_SIZE}px`;
  parent.style.height = `${VIEWPORT_SIZE}px`;
  document.body.append(parent);
  const canvas = document.createElement('canvas');
  canvas.style.width = `${VIEWPORT_SIZE}px`;
  canvas.style.height = `${VIEWPORT_SIZE}px`;
  parent.append(canvas);

  const device = await webgpuAdapter.attach(gpuDevice, {
    createCanvasContext: {canvas, useDevicePixels: false, alphaMode: 'opaque'}
  });

  let deck: Deck<OrthographicView> | null = null;
  let deckError: Error | null = null;
  let frameImage: ImageData | null = null;

  try {
    gpuDevice.pushErrorScope('validation');
    deck = new Deck({
      device,
      parent,
      width: VIEWPORT_SIZE,
      height: VIEWPORT_SIZE,
      useDevicePixels: false,
      views: new OrthographicView({id: 'main'}),
      initialViewState: {target: [0, 0], zoom: 0},
      layers: [new FullViewportLayer({id: 'full-viewport'})],
      onError: error => {
        deckError = error;
      },
      onAfterRender: () => {
        if (!frameImage && deck?.isInitialized) {
          // Submit Deck's pending commands so the current canvas texture can be copied.
          device.submit();
          frameImage = readCanvasImage(device.getDefaultCanvasContext().canvas);
        }
      }
    });

    const timeout = Date.now() + TEST_TIMEOUT_MILLISECONDS;
    while (!frameImage && !deckError && Date.now() < timeout) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    await gpuDevice.queue.onSubmittedWorkDone();
    expect(await gpuDevice.popErrorScope()).toBeNull();
    expect(deckError).toBeNull();
    expect(frameImage, 'Deck rendered a frame').not.toBeNull();

    const actualRegion = getImageRegion(frameImage!);
    for (let byteIndex = 0; byteIndex < actualRegion.length; byteIndex++) {
      const expectedValue = EXPECTED_PIXEL[byteIndex % 4];
      if (Math.abs(actualRegion[byteIndex] - expectedValue) > CHANNEL_TOLERANCE) {
        expect.fail(
          `pixel byte ${byteIndex}: expected ${expectedValue}, got ${actualRegion[byteIndex]}`
        );
      }
    }

    deck.finalize();
    deck = null;
    device.destroy();

    gpuDevice.pushErrorScope('validation');
    const buffer = gpuDevice.createBuffer({size: 16, usage: GPUBufferUsage.COPY_DST});
    await gpuDevice.queue.onSubmittedWorkDone();
    expect(await gpuDevice.popErrorScope(), 'GPUDevice is usable after Deck').toBeNull();
    buffer.destroy();
  } finally {
    deck?.finalize();
    parent.remove();
    gpuDevice.destroy();
  }
});

function readCanvasImage(canvas: HTMLCanvasElement | OffscreenCanvas): ImageData {
  const readbackCanvas = new OffscreenCanvas(VIEWPORT_SIZE, VIEWPORT_SIZE);
  const context = readbackCanvas.getContext('2d')!;
  context.drawImage(canvas, 0, 0);
  return context.getImageData(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
}

function getImageRegion(image: ImageData): Uint8ClampedArray {
  const region = new Uint8ClampedArray(REGION_SIZE * REGION_SIZE * 4);
  for (let row = 0; row < REGION_SIZE; row++) {
    const sourceStart = ((row + REGION_OFFSET) * image.width + REGION_OFFSET) * 4;
    region.set(
      image.data.subarray(sourceStart, sourceStart + REGION_SIZE * 4),
      row * REGION_SIZE * 4
    );
  }
  return region;
}
