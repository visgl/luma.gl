// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, ExternalTexture, ResourceProps, Sampler, SamplerProps} from '@luma.gl/core';
import {Texture, log} from '@luma.gl/core';
import {uid} from '../utils/uid';
import type {TextureBindingLayout, TextureBindingSource} from './texture-binding-source';

/** Browser source accepted by {@link VideoTexture}. */
export type VideoTextureSource = HTMLVideoElement | VideoFrame;

/** Properties for a live video binding source. */
export type VideoTextureProps = Pick<ResourceProps, 'id'> & {
  /** Caller-owned live video source followed by this binding source. */
  source: VideoTextureSource;
  /** Color space requested for copied or imported video data. */
  colorSpace?: 'srgb';
  /** Default sampler used by copied and native external bindings. */
  sampler?: Sampler | SamplerProps;
};

/**
 * Live video binding source.
 *
 * GLSL `sampler2D` and WGSL `texture_2d` bindings resolve to copied luma textures.
 * WGSL `texture_external` bindings resolve to native WebGPU external textures.
 */
export class VideoTexture implements TextureBindingSource {
  /** Device used to create copied and native external texture bindings. */
  readonly device: Device;
  /** Stable resource identifier used in loading and debug messages. */
  readonly id: string;

  /** Whether this video binding source has been destroyed. */
  destroyed = false;
  /** Monotonic binding generation advanced when concrete draw bindings may need recreation. */
  generation = 0;

  private _source: VideoTextureSource;
  private _colorSpace: 'srgb';
  private _sampler: Sampler | SamplerProps;
  private _isReady = false;
  private _updateTimestamp: number;
  private _sourceVersion = 0;
  private _sourceFrameToken: unknown = null;
  private _texture: Texture | null = null;
  private _textureFrameToken: unknown = undefined;
  private _externalTexture: ExternalTexture | null = null;

  /** Current caller-owned live video source. */
  get source(): VideoTextureSource {
    return this._source;
  }

  /** Whether the current source exposes dimensions and a current frame. */
  get isReady(): boolean {
    this._observeSource();
    return this._isReady;
  }

  /** Device timestamp of the most recent source content or binding identity update. */
  get updateTimestamp(): number {
    this._observeSource();
    return this._updateTimestamp;
  }

  /** Resource label used by debug output. */
  get [Symbol.toStringTag]() {
    return 'VideoTexture';
  }

  /** Formats the current source dimensions and readiness for debug output. */
  toString(): string {
    const size = getVideoTextureSourceSize(this._source);
    return `VideoTexture:"${this.id}":${size.width}x${size.height}px:(${this._isReady ? 'ready' : 'loading...'})`;
  }

  /**
   * Creates a live video binding source.
   * @param device Device that resolves copied or native external bindings.
   * @param props Live video source and copied texture options.
   */
  constructor(device: Device, props: VideoTextureProps) {
    this.device = device;
    this.id = props.id || uid('video-texture');
    this._source = props.source;
    this._colorSpace = props.colorSpace ?? 'srgb';
    this._sampler = props.sampler ?? {};
    this._updateTimestamp = this.device.incrementTimestamp();

    this.setSource(props.source);
  }

  /**
   * Replaces the caller-owned video source and invalidates resolved bindings.
   * @param source Next caller-owned video source to follow.
   */
  setSource(source: VideoTextureSource): void {
    this._destroyExternalTexture();
    this._source = source;
    this._sourceVersion++;
    this._sourceFrameToken = null;
    this._textureFrameToken = undefined;
    this._observeSource();
    this._touchGeneration();
  }

  /**
   * Resolves one reflected shader texture slot for the current video frame.
   * @param bindingLayout Reflected `texture` or `external-texture` shader slot.
   * @returns A copied texture, native external texture, or `null` while unavailable.
   */
  resolveTextureBinding(bindingLayout: TextureBindingLayout): Texture | ExternalTexture | null {
    this._observeSource();
    if (!this._isReady || this.destroyed) {
      return null;
    }

    if (bindingLayout.type === 'external-texture' && this.device.type === 'webgpu') {
      return this._createNativeExternalTexture();
    }

    return this._resolveCopiedTexture();
  }

  /**
   * Replaces the default sampler used by copied and native external bindings.
   * @param sampler Sampler instance or sampler properties to use for future resolutions.
   */
  setSampler(sampler: Sampler | SamplerProps): void {
    this._sampler = sampler;
    this._texture?.setSampler(sampler);
    this._externalTexture?.setSampler?.(sampler);
    this._touchGeneration();
  }

  /** Releases owned copied/external bindings without closing the caller-owned source. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this._destroyExternalTexture();
    this._texture?.destroy();
    this._texture = null;
    this._textureFrameToken = undefined;
    this._isReady = false;
    this.destroyed = true;
    this._touchGeneration();
  }

  /**
   * Resolves and uploads the copied texture variant for the current source frame.
   * @returns Copied texture containing the current observed frame.
   */
  private _resolveCopiedTexture(): Texture {
    const texture = this._getOrCreateCopiedTexture();
    if (!Object.is(this._textureFrameToken, this._sourceFrameToken)) {
      texture.copyExternalImage({
        image: this._source,
        colorSpace: this._colorSpace
      });
      this._textureFrameToken = this._sourceFrameToken;
    }
    return texture;
  }

  /**
   * Returns an existing size-compatible copied texture or creates one lazily.
   * @returns Copied texture allocated for the current source dimensions.
   */
  private _getOrCreateCopiedTexture(): Texture {
    const size = this._getResolvedSize();
    const currentTexture = this._texture;
    if (
      currentTexture &&
      currentTexture.width === size.width &&
      currentTexture.height === size.height
    ) {
      return currentTexture;
    }

    currentTexture?.destroy();

    const texture = this.device.createTexture({
      id: `${this.id}-texture`,
      width: size.width,
      height: size.height,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE | Texture.COPY_DST,
      mipLevels: 1,
      sampler: this._sampler
    });
    this._texture = texture;
    this._textureFrameToken = undefined;
    this._touchGeneration();
    return texture;
  }

  /**
   * Acquires one native WebGPU external texture binding.
   * @returns Fresh acquired external texture.
   */
  private _createNativeExternalTexture(): ExternalTexture {
    try {
      this._destroyExternalTexture();
      this._externalTexture = this.device.createExternalTexture({
        id: `${this.id}-external`,
        source: this._source,
        colorSpace: this._colorSpace,
        sampler: this._sampler
      });
      this.generation++;
      return this._externalTexture;
    } catch (error) {
      log.probe(1, `${this} native WebGPU external texture import unavailable`, error)();
      throw new Error(
        `${this} cannot resolve WebGPU texture_external binding; use texture_2d for copied video path`
      );
    }
  }

  /** Releases the current acquired external texture wrapper. */
  private _destroyExternalTexture(): void {
    this._externalTexture?.destroy();
    this._externalTexture = null;
  }

  /**
   * Resolves current copied texture dimensions.
   * @returns Positive dimensions for the current source frame.
   */
  private _getResolvedSize(): {width: number; height: number} {
    const size = getVideoTextureSourceSize(this._source);
    if (size.width <= 0 || size.height <= 0) {
      throw new Error(`${this} source has no current frame size`);
    }
    return size;
  }

  /** Observes current source readiness and frame identity before binding resolution. */
  private _observeSource(): void {
    if (this.destroyed) {
      return;
    }

    const isReady = isVideoTextureSourceReady(this._source);
    if (isReady !== this._isReady) {
      this._isReady = isReady;
      this._touch();
    }

    if (!isReady) {
      return;
    }

    const frameToken = getVideoTextureSourceFrameToken(this._source, this._sourceVersion);
    if (!Object.is(frameToken, this._sourceFrameToken)) {
      this._sourceFrameToken = frameToken;
      this._touch();
    }
  }

  /** Advances the device timestamp after source content or readiness changes. */
  private _touch(): void {
    this._updateTimestamp = this.device.incrementTimestamp();
  }

  /** Advances binding generation and timestamp after binding identity can change. */
  private _touchGeneration(): void {
    this.generation++;
    this._touch();
  }
}

/** Returns whether a video source exposes HTML video element playback state. */
function isHTMLVideoElementSource(source: VideoTextureSource): source is HTMLVideoElement {
  return (
    (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) ||
    ('videoWidth' in source &&
      'videoHeight' in source &&
      'readyState' in source &&
      'currentTime' in source)
  );
}

/** Returns whether a video source exposes dimensions and a current sampleable frame. */
function isVideoTextureSourceReady(source: VideoTextureSource): boolean {
  const size = getVideoTextureSourceSize(source);
  if (size.width <= 0 || size.height <= 0) {
    return false;
  }
  return isHTMLVideoElementSource(source) ? source.readyState >= 2 : true;
}

/** Returns current sampleable source dimensions. */
function getVideoTextureSourceSize(source: VideoTextureSource): {width: number; height: number} {
  if (isHTMLVideoElementSource(source)) {
    return {width: source.videoWidth, height: source.videoHeight};
  }
  return {width: source.displayWidth, height: source.displayHeight};
}

/** Returns the source token used to detect video frame replacement or advancement. */
function getVideoTextureSourceFrameToken(
  source: VideoTextureSource,
  sourceVersion: number
): unknown {
  if (isHTMLVideoElementSource(source)) {
    return `${sourceVersion}:${source.currentTime}:${source.videoWidth}x${source.videoHeight}`;
  }
  return `${sourceVersion}:${source.timestamp}:${source.displayWidth}x${source.displayHeight}`;
}
