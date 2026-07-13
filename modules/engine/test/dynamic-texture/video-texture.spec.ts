// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('VideoTexture resolves copied VideoFrame bindings without owning frames', async t => {
  const device = await getNullTestDevice();
  const firstFrame = makeFakeVideoFrame(1);
  const videoTexture = new VideoTexture(device, {source: firstFrame.frame});

  t.true(videoTexture.isReady, 'VideoFrame source is ready immediately');
  const firstResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  t.ok(firstResolution, 'ready frame resolves to copied texture');
  const firstTexture = firstResolution!;
  const firstGeneration = videoTexture.generation;
  const firstTimestamp = videoTexture.updateTimestamp;

  const sameFrameResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  t.equal(sameFrameResolution, firstTexture, 'same frame reuses copied texture');
  t.equal(videoTexture.generation, firstGeneration, 'same binding preserves generation');

  const secondFrame = makeFakeVideoFrame(2);
  videoTexture.setSource(secondFrame.frame);
  const replacementGeneration = videoTexture.generation;
  const secondResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);

  t.ok(replacementGeneration > firstGeneration, 'source replacement advances generation');
  t.equal(secondResolution, firstTexture, 'same-size replacement frame reuses texture');
  t.equal(
    videoTexture.generation,
    replacementGeneration,
    'same-size content upload preserves binding generation'
  );
  t.ok(videoTexture.updateTimestamp > firstTimestamp, 'replacement frame updates timestamp');
  t.equal(firstFrame.closeCount, 0, 'replaced frame remains caller-owned');

  videoTexture.destroy();
  t.equal(secondFrame.closeCount, 0, 'destroy does not close caller-owned frame');
  t.end();
});

test('VideoTexture waits for HTMLVideoElement current frame data', async t => {
  const device = await getNullTestDevice();
  const video = makeFakeVideoElement();
  const videoTexture = new VideoTexture(device, {source: video as HTMLVideoElement});

  t.false(videoTexture.isReady, 'video without current frame is not ready');

  video.videoWidth = 4;
  video.videoHeight = 2;
  video.readyState = 2;

  t.true(videoTexture.isReady, 'video becomes ready with dimensions and current frame');
  t.ok(videoTexture.resolveTextureBinding(TEXTURE_BINDING), 'ready video resolves binding');
  const firstTimestamp = videoTexture.updateTimestamp;
  video.currentTime = 1;
  t.ok(videoTexture.updateTimestamp > firstTimestamp, 'new video time updates timestamp');

  videoTexture.destroy();
  t.end();
});

test('VideoTexture copies successive browser VideoFrames', async t => {
  if (typeof document === 'undefined' || typeof VideoFrame === 'undefined') {
    t.pass('browser VideoFrame smoke test requires browser WebCodecs');
    t.end();
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  t.ok(context, '2D canvas context is available');
  if (!context) {
    t.end();
    return;
  }

  context.fillStyle = '#ff0000';
  context.fillRect(0, 0, 1, 1);
  const firstFrame = new VideoFrame(canvas, {timestamp: 1});
  const device = await getWebGLTestDevice(t);
  const videoTexture = new VideoTexture(device, {source: firstFrame});
  let secondFrame: VideoFrame | null = null;

  try {
    const texture = videoTexture.resolveTextureBinding(TEXTURE_BINDING) as Texture;
    t.deepEquals(
      device.readPixelsToArrayWebGL(texture),
      new Uint8Array([255, 0, 0, 255]),
      'first browser VideoFrame is copied'
    );

    context.fillStyle = '#0000ff';
    context.fillRect(0, 0, 1, 1);
    secondFrame = new VideoFrame(canvas, {timestamp: 2});
    videoTexture.setSource(secondFrame);
    videoTexture.resolveTextureBinding(TEXTURE_BINDING);
    t.deepEquals(
      device.readPixelsToArrayWebGL(texture),
      new Uint8Array([0, 0, 255, 255]),
      'next browser VideoFrame replaces copied pixels'
    );
  } finally {
    videoTexture.destroy();
    secondFrame?.close();
    firstFrame.close();
  }

  t.end();
});

test('VideoTexture resolves native WebGPU external bindings from browser VideoFrames', async t => {
  if (
    typeof document === 'undefined' ||
    typeof VideoFrame === 'undefined' ||
    typeof navigator === 'undefined' ||
    !navigator.gpu
  ) {
    t.pass('native external texture smoke test requires browser WebGPU and WebCodecs');
    t.end();
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const frame = new VideoFrame(canvas, {timestamp: 1});
  const device = await getWebGPUTestDevice();
  const videoTexture = new VideoTexture(device, {source: frame});

  try {
    t.ok(
      videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING),
      'browser VideoFrame resolves to native WebGPU external binding'
    );
  } finally {
    videoTexture.destroy();
    frame.close();
  }

  t.end();
});

test('VideoTexture uses lightweight assertions for runtime sources', async t => {
  const device = await getNullTestDevice();

  t.throws(
    () => new VideoTexture(device, {source: null as unknown as VideoFrame}),
    /luma.gl assertion failed/,
    'constructor asserts unsupported sources'
  );

  const videoTexture = new VideoTexture(device, {source: makeFakeVideoFrame(1).frame});
  t.throws(
    () => videoTexture.setSource({} as VideoFrame),
    /luma.gl assertion failed/,
    'setSource asserts unsupported sources'
  );

  videoTexture.destroy();
  t.end();
});

test('VideoTexture recreates resized copied textures and updates samplers', t => {
  const {device, textures} = makeFakeCopiedTextureDevice();
  const videoTexture = new VideoTexture(device, {
    source: makeFakeVideoFrame(1, 2, 2).frame
  });

  const firstTexture = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  t.equal(textures.length, 1, 'first resolution creates a copied texture');
  t.equal(textures[0]!.copyCount, 1, 'first resolution copies one frame');

  videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  t.equal(textures[0]!.copyCount, 1, 'same frame does not copy again');

  const sampler: SamplerProps = {magFilter: 'nearest'};
  videoTexture.setSampler(sampler);
  t.equal(textures[0]!.sampler, sampler, 'sampler updates the existing copied texture');

  videoTexture.setSource(makeFakeVideoFrame(2, 4, 3).frame);
  const secondTexture = videoTexture.resolveTextureBinding(TEXTURE_BINDING);

  t.notEqual(secondTexture, firstTexture, 'size changes replace the copied texture');
  t.equal(textures.length, 2, 'size change creates one replacement texture');
  t.equal(textures[0]!.destroyCount, 1, 'size change destroys the previous copied texture');
  t.equal(textures[1]!.width, 4, 'replacement texture uses new width');
  t.equal(textures[1]!.height, 3, 'replacement texture uses new height');

  videoTexture.destroy();
  t.equal(textures[1]!.destroyCount, 1, 'destroy releases the replacement copied texture');
  videoTexture.destroy();
  t.equal(textures[1]!.destroyCount, 1, 'destroy is idempotent');
  t.end();
});

test('VideoTexture preserves copied frame failures', t => {
  const {device} = makeFakeCopiedTextureDevice({throwOnCopy: true});
  const videoTexture = new VideoTexture(device, {source: makeFakeVideoFrame(1).frame});

  t.throws(
    () => videoTexture.resolveTextureBinding(TEXTURE_BINDING),
    /source cannot be copied/,
    'copied frame errors surface without a verbose wrapper'
  );

  videoTexture.destroy();
  t.end();
});

test('VideoTexture reacquires native WebGPU external textures per resolution', t => {
  const {device, externalTextures} = makeSuccessfulFakeWebGPUDevice();
  const frame = makeFakeVideoFrame(1);
  const videoTexture = new VideoTexture(device, {source: frame.frame});
  const initialGeneration = videoTexture.generation;

  const firstExternalTexture = videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING);
  const firstGeneration = videoTexture.generation;
  const secondExternalTexture = videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING);

  t.notEqual(
    secondExternalTexture,
    firstExternalTexture,
    'each resolution acquires a fresh binding'
  );
  t.equal(externalTextures.length, 2, 'two native external textures are acquired');
  t.equal(externalTextures[0]!.destroyCount, 1, 'reacquisition releases the previous wrapper');
  t.ok(firstGeneration > initialGeneration, 'first external binding advances generation');
  t.ok(videoTexture.generation > firstGeneration, 'fresh external binding advances generation');

  const sampler: SamplerProps = {minFilter: 'nearest'};
  videoTexture.setSampler(sampler);
  t.equal(externalTextures[1]!.sampler, sampler, 'sampler updates the current external binding');

  videoTexture.destroy();
  t.equal(externalTextures[1]!.destroyCount, 1, 'destroy releases the current external binding');
  t.equal(frame.closeCount, 0, 'destroy leaves external VideoFrame source caller-owned');
  t.end();
});

test('VideoTexture preserves native WebGPU external import failures', t => {
  const videoTexture = new VideoTexture(makeFakeWebGPUDevice(), {
    source: makeFakeVideoFrame(1).frame
  });

  t.throws(
    () => videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING),
    /native external textures unavailable/,
    'native external import failures surface without a copied fallback'
  );

  videoTexture.destroy();
  t.end();
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
