// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Device, SamplerProps, Texture} from '@luma.gl/core';
import {getNullTestDevice, getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {VideoTexture} from '../../src';

const TEXTURE_BINDING = {
  type: 'texture',
  name: 'videoTexture',
  group: 0,
  location: 0
} as const;
const EXTERNAL_TEXTURE_BINDING = {
  type: 'external-texture',
  name: 'videoTexture',
  group: 0,
  location: 0
} as const;

it('VideoTexture resolves copied VideoFrame bindings without owning frames', async () => {
  const device = await getNullTestDevice();
  const firstFrame = makeFakeVideoFrame(1);
  const videoTexture = new VideoTexture(device, {source: firstFrame.frame});

  expect(Boolean(videoTexture.isReady), 'VideoFrame source is ready immediately').toBe(true);
  const firstResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  expect(Boolean(firstResolution), 'ready frame resolves to copied texture').toBe(true);
  const firstTexture = firstResolution!;
  const firstGeneration = videoTexture.generation;
  const firstTimestamp = videoTexture.updateTimestamp;

  const sameFrameResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  expect(sameFrameResolution, 'same frame reuses copied texture').toBe(firstTexture);
  expect(videoTexture.generation, 'same binding preserves generation').toBe(firstGeneration);

  const secondFrame = makeFakeVideoFrame(2);
  videoTexture.setSource(secondFrame.frame);
  const replacementGeneration = videoTexture.generation;
  const secondResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);

  expect(
    Boolean(replacementGeneration > firstGeneration),
    'source replacement advances generation'
  ).toBe(true);
  expect(secondResolution, 'same-size replacement frame reuses texture').toBe(firstTexture);
  expect(videoTexture.generation, 'same-size content upload preserves binding generation').toBe(
    replacementGeneration
  );
  expect(
    Boolean(videoTexture.updateTimestamp > firstTimestamp),
    'replacement frame updates timestamp'
  ).toBe(true);
  expect(firstFrame.closeCount, 'replaced frame remains caller-owned').toBe(0);

  videoTexture.destroy();
  expect(secondFrame.closeCount, 'destroy does not close caller-owned frame').toBe(0);
  void 0;
});

it('VideoTexture waits for HTMLVideoElement current frame data', async () => {
  const device = await getNullTestDevice();
  const video = makeFakeVideoElement();
  const videoTexture = new VideoTexture(device, {source: video as HTMLVideoElement});

  expect(Boolean(videoTexture.isReady), 'video without current frame is not ready').toBe(false);

  video.videoWidth = 4;
  video.videoHeight = 2;
  video.readyState = 2;

  expect(
    Boolean(videoTexture.isReady),
    'video becomes ready with dimensions and current frame'
  ).toBe(true);
  expect(
    Boolean(videoTexture.resolveTextureBinding(TEXTURE_BINDING)),
    'ready video resolves binding'
  ).toBe(true);
  const firstTimestamp = videoTexture.updateTimestamp;
  video.currentTime = 1;
  expect(
    Boolean(videoTexture.updateTimestamp > firstTimestamp),
    'new video time updates timestamp'
  ).toBe(true);

  videoTexture.destroy();
  void 0;
});

it('VideoTexture copies successive browser VideoFrames', async () => {
  if (typeof document === 'undefined' || typeof VideoFrame === 'undefined') {
    expect(Boolean('browser VideoFrame smoke test requires browser WebCodecs'), '').toBe(true);
    void 0;
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  expect(Boolean(context), '2D canvas context is available').toBe(true);
  if (!context) {
    void 0;
    return;
  }

  context.fillStyle = '#ff0000';
  context.fillRect(0, 0, 1, 1);
  const firstFrame = new VideoFrame(canvas, {timestamp: 1});
  const device = await getWebGLTestDevice();
  const videoTexture = new VideoTexture(device, {source: firstFrame});
  let secondFrame: VideoFrame | null = null;

  try {
    const texture = videoTexture.resolveTextureBinding(TEXTURE_BINDING) as Texture;
    expect(device.readPixelsToArrayWebGL(texture), 'first browser VideoFrame is copied').toEqual(
      new Uint8Array([255, 0, 0, 255])
    );

    context.fillStyle = '#0000ff';
    context.fillRect(0, 0, 1, 1);
    secondFrame = new VideoFrame(canvas, {timestamp: 2});
    videoTexture.setSource(secondFrame);
    videoTexture.resolveTextureBinding(TEXTURE_BINDING);
    expect(
      device.readPixelsToArrayWebGL(texture),
      'next browser VideoFrame replaces copied pixels'
    ).toEqual(new Uint8Array([0, 0, 255, 255]));
  } finally {
    videoTexture.destroy();
    secondFrame?.close();
    firstFrame.close();
  }

  void 0;
});

it('VideoTexture resolves native WebGPU external bindings from browser VideoFrames', async () => {
  if (
    typeof document === 'undefined' ||
    typeof VideoFrame === 'undefined' ||
    typeof navigator === 'undefined' ||
    !navigator.gpu
  ) {
    expect(
      Boolean('native external texture smoke test requires browser WebGPU and WebCodecs'),
      ''
    ).toBe(true);
    void 0;
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const frame = new VideoFrame(canvas, {timestamp: 1});
  const device = await getWebGPUTestDevice();
  const videoTexture = new VideoTexture(device, {source: frame});

  try {
    expect(
      Boolean(videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING)),
      'browser VideoFrame resolves to native WebGPU external binding'
    ).toBe(true);
  } finally {
    videoTexture.destroy();
    frame.close();
  }

  void 0;
});

it('VideoTexture uses lightweight assertions for runtime sources', async () => {
  const device = await getNullTestDevice();

  expect(
    () => new VideoTexture(device, {source: null as unknown as VideoFrame}),
    'constructor asserts unsupported sources'
  ).toThrow(/luma.gl assertion failed/);

  const videoTexture = new VideoTexture(device, {source: makeFakeVideoFrame(1).frame});
  expect(
    () => videoTexture.setSource({} as VideoFrame),
    'setSource asserts unsupported sources'
  ).toThrow(/luma.gl assertion failed/);

  videoTexture.destroy();
  void 0;
});

it('VideoTexture recreates resized copied textures and updates samplers', () => {
  const {device, textures} = makeFakeCopiedTextureDevice();
  const videoTexture = new VideoTexture(device, {
    source: makeFakeVideoFrame(1, 2, 2).frame
  });

  const firstTexture = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  expect(textures.length, 'first resolution creates a copied texture').toBe(1);
  expect(textures[0]!.copyCount, 'first resolution copies one frame').toBe(1);

  videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  expect(textures[0]!.copyCount, 'same frame does not copy again').toBe(1);

  const sampler: SamplerProps = {magFilter: 'nearest'};
  videoTexture.setSampler(sampler);
  expect(textures[0]!.sampler, 'sampler updates the existing copied texture').toBe(sampler);

  videoTexture.setSource(makeFakeVideoFrame(2, 4, 3).frame);
  const secondTexture = videoTexture.resolveTextureBinding(TEXTURE_BINDING);

  expect(secondTexture, 'size changes replace the copied texture').not.toBe(firstTexture);
  expect(textures.length, 'size change creates one replacement texture').toBe(2);
  expect(textures[0]!.destroyCount, 'size change destroys the previous copied texture').toBe(1);
  expect(textures[1]!.width, 'replacement texture uses new width').toBe(4);
  expect(textures[1]!.height, 'replacement texture uses new height').toBe(3);

  videoTexture.destroy();
  expect(textures[1]!.destroyCount, 'destroy releases the replacement copied texture').toBe(1);
  videoTexture.destroy();
  expect(textures[1]!.destroyCount, 'destroy is idempotent').toBe(1);
  void 0;
});

it('VideoTexture preserves copied frame failures', () => {
  const {device} = makeFakeCopiedTextureDevice({throwOnCopy: true});
  const videoTexture = new VideoTexture(device, {source: makeFakeVideoFrame(1).frame});

  expect(
    () => videoTexture.resolveTextureBinding(TEXTURE_BINDING),
    'copied frame errors surface without a verbose wrapper'
  ).toThrow(/source cannot be copied/);

  videoTexture.destroy();
  void 0;
});

it('VideoTexture reacquires native WebGPU external textures per resolution', () => {
  const {device, externalTextures} = makeSuccessfulFakeWebGPUDevice();
  const frame = makeFakeVideoFrame(1);
  const videoTexture = new VideoTexture(device, {source: frame.frame});
  const initialGeneration = videoTexture.generation;

  const firstExternalTexture = videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING);
  const firstGeneration = videoTexture.generation;
  const secondExternalTexture = videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING);

  expect(secondExternalTexture, 'each resolution acquires a fresh binding').not.toBe(
    firstExternalTexture
  );
  expect(externalTextures.length, 'two native external textures are acquired').toBe(2);
  expect(externalTextures[0]!.destroyCount, 'reacquisition releases the previous wrapper').toBe(1);
  expect(
    Boolean(firstGeneration > initialGeneration),
    'first external binding advances generation'
  ).toBe(true);
  expect(
    Boolean(videoTexture.generation > firstGeneration),
    'fresh external binding advances generation'
  ).toBe(true);

  const sampler: SamplerProps = {minFilter: 'nearest'};
  videoTexture.setSampler(sampler);
  expect(externalTextures[1]!.sampler, 'sampler updates the current external binding').toBe(
    sampler
  );

  videoTexture.destroy();
  expect(externalTextures[1]!.destroyCount, 'destroy releases the current external binding').toBe(
    1
  );
  expect(frame.closeCount, 'destroy leaves external VideoFrame source caller-owned').toBe(0);
  void 0;
});

it('VideoTexture preserves native WebGPU external import failures', () => {
  const videoTexture = new VideoTexture(makeFakeWebGPUDevice(), {
    source: makeFakeVideoFrame(1).frame
  });

  expect(
    () => videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING),
    'native external import failures surface without a copied fallback'
  ).toThrow(/native external textures unavailable/);

  videoTexture.destroy();
  void 0;
});

function makeFakeVideoFrame(
  timestamp: number,
  width: number = 2,
  height: number = 2
): {frame: VideoFrame; closeCount: number} {
  const result = {
    closeCount: 0,
    frame: {
      displayWidth: width,
      displayHeight: height,
      timestamp,
      close: () => {
        result.closeCount++;
      }
    } as unknown as VideoFrame
  };
  return result;
}

function makeFakeVideoElement(): {
  videoWidth: number;
  videoHeight: number;
  readyState: number;
  currentTime: number;
} {
  return {
    videoWidth: 0,
    videoHeight: 0,
    readyState: 0,
    currentTime: 0
  };
}

type FakeCopiedTexture = {
  width: number;
  height: number;
  copyCount: number;
  destroyCount: number;
  sampler: SamplerProps | null;
  copyExternalImage: () => void;
  setSampler: (sampler: SamplerProps) => void;
  destroy: () => void;
};

function makeFakeCopiedTextureDevice(options?: {throwOnCopy?: boolean}): {
  device: Device;
  textures: FakeCopiedTexture[];
} {
  let timestamp = 0;
  const textures: FakeCopiedTexture[] = [];
  const device = {
    type: 'webgl',
    incrementTimestamp: () => ++timestamp,
    createTexture: ({width, height}: {width: number; height: number}) => {
      const texture: FakeCopiedTexture = {
        width,
        height,
        copyCount: 0,
        destroyCount: 0,
        sampler: null,
        copyExternalImage: () => {
          if (options?.throwOnCopy) {
            throw new Error('source cannot be copied');
          }
          texture.copyCount++;
        },
        setSampler: sampler => {
          texture.sampler = sampler;
        },
        destroy: () => {
          texture.destroyCount++;
        }
      };
      textures.push(texture);
      return texture;
    }
  } as unknown as Device;
  return {device, textures};
}

type FakeExternalTexture = {
  destroyCount: number;
  sampler: SamplerProps | null;
  destroy: () => void;
  setSampler: (sampler: SamplerProps) => void;
};

function makeSuccessfulFakeWebGPUDevice(): {
  device: Device;
  externalTextures: FakeExternalTexture[];
} {
  let timestamp = 0;
  const externalTextures: FakeExternalTexture[] = [];
  const device = {
    type: 'webgpu',
    incrementTimestamp: () => ++timestamp,
    createExternalTexture: () => {
      const externalTexture: FakeExternalTexture = {
        destroyCount: 0,
        sampler: null,
        destroy: () => {
          externalTexture.destroyCount++;
        },
        setSampler: sampler => {
          externalTexture.sampler = sampler;
        }
      };
      externalTextures.push(externalTexture);
      return externalTexture;
    }
  } as unknown as Device;
  return {device, externalTextures};
}

function makeFakeWebGPUDevice(): Device {
  let timestamp = 0;
  return {
    type: 'webgpu',
    incrementTimestamp: () => ++timestamp,
    createExternalTexture: () => {
      throw new Error('native external textures unavailable');
    }
  } as unknown as Device;
}
