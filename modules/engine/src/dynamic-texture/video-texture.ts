// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, ExternalTexture, Sampler, SamplerProps, TextureProps} from '@luma.gl/core';
import {Texture, log} from '@luma.gl/core';
import {uid} from '../utils/uid';
import type {TextureBindingLayout, TextureBindingSource} from './texture-binding-source';

/** Browser source accepted by {@link VideoTexture}. */
export type VideoTextureSource = HTMLVideoElement | VideoFrame;

/** Properties for a live video binding source. */
export type VideoTextureProps = Omit<
  TextureProps,
  'data' | 'dimension' | 'width' | 'height' | 'depth' | 'samples' | 'mipLevels'
> & {
  /** Caller-owned live video source followed by this binding source. */
  source: VideoTextureSource;
  /** Color space requested for copied or imported video data. */
  colorSpace?: 'srgb';
  /** Generate mipmaps after copied-frame uploads. Ignored by native external bindings. */
  mipmaps?: boolean;
  /** Mip levels for copied standard texture bindings. */
  mipLevels?: number | 'auto';
  /** Optional source width override. */
  width?: number;
  /** Optional source height override. */
  height?: number;
};

/** Fully resolved properties stored by {@link VideoTexture}. */
type ResolvedVideoTextureProps = Required<VideoTextureProps>;
/** HTML video element shape used for optional frame callback feature detection. */
type VideoElementWithFrameCallback = HTMLVideoElement & {
  /** Schedules observation of the next presented HTML video frame when supported. */
  requestVideoFrameCallback?: (
    callback: (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => void
  ) => number;
  /** Cancels one previously scheduled HTML video frame callback when supported. */
  cancelVideoFrameCallback?: (handle: number) => void;
};

/**
 * Live video binding source.
 *
 * GLSL `sampler2D` and WGSL `texture_2d` bindings resolve to copied luma textures.
 * WGSL `texture_external` bindings resolve to native WebGPU external textures
 * when possible and otherwise use a copied one-mip compatible texture.
 */
export class VideoTexture implements TextureBindingSource {
  /** Device used to create copied and native external texture bindings. */
  readonly device: Device;
  /** Stable resource identifier used in loading and debug messages. */
  readonly id: string;
  /** Resolved creation properties for this video binding source. */
  readonly props: Readonly<ResolvedVideoTextureProps>;
  /** Resolves after the source exposes dimensions and a current frame. */
  readonly ready: Promise<VideoTexture>;

  /** Whether this video binding source has been destroyed. */
  destroyed = false;
  /** Monotonic binding generation advanced when concrete draw bindings may need recreation. */
  generation = 0;

  private _source: VideoTextureSource;
  private _sampler: Sampler | SamplerProps;
  private _isReady = false;
  private _updateTimestamp: number;
  private _sourceVersion = 0;
  private _sourceFrameToken: unknown = null;
  private _readyResolved = false;
  private _resolveReady: (texture: VideoTexture) => void = () => {};
  private _texture: Texture | null = null;
  private _textureFrameToken: unknown = undefined;
  private _externalFallbackTexture: Texture | null = null;
  private _externalFallbackTextureFrameToken: unknown = undefined;
  private _externalTexture: ExternalTexture | null = null;
  private _nativeExternalTextureSupported: boolean | null = null;
  private _videoFrameCallbackHandle: number | null = null;
  private _videoFrameCallbackCounter = 0;
  private _videoEventListeners: Array<{eventName: string; listener: EventListener}> = [];

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

  /** Standard copied texture, created lazily after the first standard texture resolution. */
  get texture(): Texture {
    if (!this._texture) {
      throw new Error(`${this} standard texture has not been resolved yet`);
    }
    return this._texture;
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
    this.props = {
      ...VideoTexture.defaultProps,
      ...props,
      id: this.id
    };
    this._source = props.source;
    this._sampler = this.props.sampler;
    this._updateTimestamp = this.device.incrementTimestamp();
    this.ready = new Promise<VideoTexture>(resolve => {
      this._resolveReady = resolve;
    });

    this.setSource(props.source);
  }

  /**
   * Replaces the caller-owned video source and invalidates resolved bindings.
   * @param source Next caller-owned video source to follow.
   */
  setSource(source: VideoTextureSource): void {
    this._detachVideoSource();
    this._destroyExternalTexture();
    this._source = source;
    this._sourceVersion++;
    this._sourceFrameToken = null;
    this._textureFrameToken = undefined;
    this._externalFallbackTextureFrameToken = undefined;
    this._nativeExternalTextureSupported = null;
    this._attachVideoSource();
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
      const externalTexture = this._createNativeExternalTexture();
      if (externalTexture) {
        return externalTexture;
      }
      return this._resolveCopiedTexture(true);
    }

    return this._resolveCopiedTexture(false);
  }

  /**
   * Replaces the default sampler used by copied and native external bindings.
   * @param sampler Sampler instance or sampler properties to use for future resolutions.
   */
  setSampler(sampler: Sampler | SamplerProps): void {
    this._sampler = sampler;
    this._texture?.setSampler(sampler);
    this._externalFallbackTexture?.setSampler(sampler);
    this._externalTexture?.setSampler?.(sampler);
    this._touchGeneration();
  }

  /** Releases owned copied/external bindings without closing the caller-owned source. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this._detachVideoSource();
    this._destroyExternalTexture();
    this._texture?.destroy();
    this._externalFallbackTexture?.destroy();
    this._texture = null;
    this._externalFallbackTexture = null;
    this._textureFrameToken = undefined;
    this._externalFallbackTextureFrameToken = undefined;
    this._isReady = false;
    this.destroyed = true;
    this._touchGeneration();
  }

  /**
   * Resolves and uploads the copied texture variant for the current source frame.
   * @param externalCompatible Whether the copy must satisfy `texture_external` fallback limits.
   * @returns Copied texture containing the current observed frame.
   */
  private _resolveCopiedTexture(externalCompatible: boolean): Texture {
    const texture = this._getOrCreateCopiedTexture(externalCompatible);
    const copiedFrameToken = externalCompatible
      ? this._externalFallbackTextureFrameToken
      : this._textureFrameToken;
    if (!Object.is(copiedFrameToken, this._sourceFrameToken)) {
      texture.copyExternalImage({
        image: this._source,
        colorSpace: this.props.colorSpace
      });
      if (!externalCompatible && this.props.mipmaps) {
        this._generateMipmaps(texture);
      }
      if (externalCompatible) {
        this._externalFallbackTextureFrameToken = this._sourceFrameToken;
      } else {
        this._textureFrameToken = this._sourceFrameToken;
      }
    }
    return texture;
  }

  /**
   * Returns an existing size-compatible copied texture or creates one lazily.
   * @param externalCompatible Whether the copy must use external-texture fallback constraints.
   * @returns Copied texture allocated for the current source dimensions.
   */
  private _getOrCreateCopiedTexture(externalCompatible: boolean): Texture {
    const size = this._getResolvedSize();
    const currentTexture = externalCompatible ? this._externalFallbackTexture : this._texture;
    if (
      currentTexture &&
      currentTexture.width === size.width &&
      currentTexture.height === size.height
    ) {
      return currentTexture;
    }

    currentTexture?.destroy();
    const mipLevels = externalCompatible ? 1 : this._getCopiedTextureMipLevels(size);
    let usage = this.props.usage | Texture.SAMPLE | Texture.COPY_DST;
    if (!externalCompatible && this.device.type === 'webgpu' && this.props.mipmaps) {
      usage |= Texture.RENDER | Texture.COPY_SRC;
    }

    const texture = this.device.createTexture({
      id: `${this.id}-${externalCompatible ? 'external-fallback' : 'texture'}`,
      width: size.width,
      height: size.height,
      format: externalCompatible ? 'rgba8unorm' : this.props.format,
      usage,
      mipLevels,
      sampler: this._sampler,
      view: this.props.view
    });
    if (externalCompatible) {
      this._externalFallbackTexture = texture;
      this._externalFallbackTextureFrameToken = undefined;
    } else {
      this._texture = texture;
      this._textureFrameToken = undefined;
    }
    this._touchGeneration();
    return texture;
  }

  /**
   * Acquires one native WebGPU external texture binding when supported.
   * @returns Fresh acquired external texture, or `null` after native import fails.
   */
  private _createNativeExternalTexture(): ExternalTexture | null {
    if (this._nativeExternalTextureSupported === false) {
      return null;
    }

    try {
      this._destroyExternalTexture();
      this._externalTexture = this.device.createExternalTexture({
        id: `${this.id}-external`,
        source: this._source,
        colorSpace: this.props.colorSpace,
        sampler: this._sampler
      });
      this._nativeExternalTextureSupported = true;
      this._incrementGeneration();
      return this._externalTexture;
    } catch (error) {
      this._nativeExternalTextureSupported = false;
      log.probe(1, `${this} falling back to copied external texture binding`, error)();
      return null;
    }
  }

  /** Releases the current acquired external texture wrapper. */
  private _destroyExternalTexture(): void {
    this._externalTexture?.destroy();
    this._externalTexture = null;
  }

  /**
   * Resolves the copied standard texture mip level count.
   * @param size Current copied texture dimensions.
   * @returns Requested mip level count clamped to the current dimensions.
   */
  private _getCopiedTextureMipLevels(size: {width: number; height: number}): number {
    const maxMipLevels = this.device.getMipLevelCount(size.width, size.height);
    return this.props.mipLevels === 'auto'
      ? maxMipLevels
      : Math.max(1, Math.min(maxMipLevels, this.props.mipLevels));
  }

  /**
   * Generates copied standard texture mipmaps on backends that expose generation helpers.
   * @param texture Copied standard texture that received a new source frame.
   */
  private _generateMipmaps(texture: Texture): void {
    if (this.device.type === 'webgl') {
      texture.generateMipmapsWebGL();
    } else if (this.device.type === 'webgpu') {
      this.device.generateMipmapsWebGPU(texture);
    }
  }

  /**
   * Resolves current copied texture dimensions after source size overrides.
   * @returns Positive dimensions for the current source frame.
   */
  private _getResolvedSize(): {width: number; height: number} {
    const sourceSize = getVideoTextureSourceSize(this._source);
    const width = this.props.width || sourceSize.width;
    const height = this.props.height || sourceSize.height;
    if (width <= 0 || height <= 0) {
      throw new Error(`${this} source has no current frame size`);
    }
    return {width, height};
  }

  /** Observes current source readiness and frame identity before binding resolution. */
  private _observeSource(): void {
    if (this.destroyed) {
      return;
    }

    const isReady = isVideoTextureSourceReady(this._source);
    if (isReady !== this._isReady) {
      this._isReady = isReady;
      if (isReady && !this._readyResolved) {
        this._readyResolved = true;
        this._resolveReady(this);
      }
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

  /** Registers readiness and frame observers for an HTML video source. */
  private _attachVideoSource(): void {
    if (!isHTMLVideoElementSource(this._source)) {
      return;
    }

    const video = this._source;
    const listener = () => this._observeSource();
    for (const eventName of ['loadedmetadata', 'loadeddata', 'resize', 'timeupdate', 'seeked']) {
      video.addEventListener(eventName, listener);
      this._videoEventListeners.push({eventName, listener});
    }
    this._scheduleVideoFrameCallback();
  }

  /** Removes readiness and frame observers from the current HTML video source. */
  private _detachVideoSource(): void {
    if (!isHTMLVideoElementSource(this._source)) {
      return;
    }

    const video = this._source as VideoElementWithFrameCallback;
    for (const {eventName, listener} of this._videoEventListeners) {
      video.removeEventListener(eventName, listener);
    }
    this._videoEventListeners = [];
    if (this._videoFrameCallbackHandle !== null) {
      video.cancelVideoFrameCallback?.(this._videoFrameCallbackHandle);
      this._videoFrameCallbackHandle = null;
    }
  }

  /** Schedules the next HTML video frame callback when that browser API is available. */
  private _scheduleVideoFrameCallback(): void {
    if (!isHTMLVideoElementSource(this._source)) {
      return;
    }

    const video = this._source as VideoElementWithFrameCallback;
    if (!video.requestVideoFrameCallback) {
      return;
    }

    this._videoFrameCallbackHandle = video.requestVideoFrameCallback((_now, metadata) => {
      this._videoFrameCallbackHandle = null;
      this._videoFrameCallbackCounter++;
      this._sourceFrameToken = `${this._sourceVersion}:callback:${metadata.presentedFrames ?? this._videoFrameCallbackCounter}:${metadata.mediaTime}`;
      this._touch();
      this._scheduleVideoFrameCallback();
    });
  }

  /** Advances the device timestamp after source content or readiness changes. */
  private _touch(): void {
    this._updateTimestamp = this.device.incrementTimestamp();
  }

  /** Advances binding generation and timestamp after binding identity can change. */
  private _touchGeneration(): void {
    this._incrementGeneration();
    this._touch();
  }

  /** Advances the monotonic binding generation. */
  private _incrementGeneration(): void {
    this.generation++;
  }

  /** Default resolved properties used by {@link VideoTexture}. */
  static defaultProps: ResolvedVideoTextureProps = {
    id: 'undefined',
    handle: undefined,
    userData: undefined!,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    sampler: {},
    view: undefined!,
    source: undefined!,
    colorSpace: 'srgb',
    mipmaps: false,
    mipLevels: 1,
    width: 0,
    height: 0
  };
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

/** Returns whether a video source exposes VideoFrame dimensions and timestamp. */
function isVideoFrameSource(source: VideoTextureSource): source is VideoFrame {
  return (
    (typeof VideoFrame !== 'undefined' && source instanceof VideoFrame) ||
    ('displayWidth' in source && 'displayHeight' in source && !('videoWidth' in source))
  );
}

/** Returns whether a video source exposes dimensions and a current sampleable frame. */
function isVideoTextureSourceReady(source: VideoTextureSource): boolean {
  const size = getVideoTextureSourceSize(source);
  if (size.width <= 0 || size.height <= 0) {
    return false;
  }
  return isHTMLVideoElementSource(source) ? source.readyState >= 2 : isVideoFrameSource(source);
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
