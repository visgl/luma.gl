// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, TextureProps} from '@luma.gl/core';
import {Texture} from '@luma.gl/core';
import type {TextureBindingLayout, TextureBindingSource} from '@luma.gl/engine';
import type {WebXRRawCameraBinding} from './webxr-types';

/** Experimental v10 properties for a raw WebXR camera texture source. */
export type WebXRCameraTextureProps = Omit<
  TextureProps,
  | 'data'
  | '_isHandleBorrowed'
  | 'dimension'
  | 'width'
  | 'height'
  | 'depth'
  | 'samples'
  | 'mipLevels'
  | 'handle'
  | 'sampler'
>;

type ResolvedWebXRCameraTextureProps = Required<WebXRCameraTextureProps>;

/**
 * Experimental v10 binding source for the WebXR Raw Camera Access texture.
 *
 * WebXRCameraTexture is WebGL-only in v10 work in progress and resolves only
 * ordinary texture bindings such as GLSL sampler2D.
 */
export class WebXRCameraTexture implements TextureBindingSource {
  readonly device: Device;
  readonly xrWebGLBinding: WebXRRawCameraBinding;
  readonly id: string;
  readonly props: Readonly<ResolvedWebXRCameraTextureProps>;

  destroyed = false;
  generation = 0;

  private _view: XRView | null = null;
  private _camera: XRCamera | null = null;
  private _texture: Texture | null = null;
  private _resolvedGeneration = -1;
  private _updateTimestamp: number;

  get view(): XRView | null {
    return this._view;
  }

  get camera(): XRCamera | null {
    return this._camera;
  }

  get isReady(): boolean {
    return !this.destroyed && this._camera !== null;
  }

  get updateTimestamp(): number {
    return this._updateTimestamp;
  }

  /** Borrowed luma wrapper after the current XR camera frame has been resolved. */
  get texture(): Texture {
    if (!this._texture) {
      throw new Error(`${this} texture has not been resolved yet`);
    }
    return this._texture;
  }

  get [Symbol.toStringTag]() {
    return 'WebXRCameraTexture';
  }

  toString(): string {
    const size = this._camera ? `${this._camera.width}x${this._camera.height}px` : 'unbound';
    return `WebXRCameraTexture:"${this.id}":${size}:(${this.isReady ? 'ready' : 'not ready'})`;
  }

  constructor(
    device: Device,
    xrWebGLBinding: WebXRRawCameraBinding,
    props: WebXRCameraTextureProps = {}
  ) {
    if (device.type !== 'webgl') {
      throw new Error('WebXRCameraTexture is only available on WebGL in v10 work in progress');
    }

    this.device = device;
    this.xrWebGLBinding = xrWebGLBinding;
    this.id = props.id || makeWebXRId('webxr-camera-texture');
    this.props = {
      ...WebXRCameraTexture.defaultProps,
      ...props,
      id: this.id
    };
    this._updateTimestamp = this.device.incrementTimestamp();
  }

  /**
   * Selects the WebXR view whose raw camera image should be resolved for the next draw.
   *
   * Call once for each XR view render. Repeated calls intentionally advance the
   * generation because the browser may update the camera image each XR frame.
   */
  setView(view: XRView | null): void {
    this._view = view;
    this._camera = view?.camera ?? null;
    this._resolvedGeneration = -1;
    this._touchGeneration();
  }

  resolveTextureBinding(bindingLayout: TextureBindingLayout): Texture | null {
    if (bindingLayout.type === 'external-texture') {
      throw new Error(
        `${this} does not support external-texture bindings; use an ordinary texture binding`
      );
    }
    if (!this.isReady) {
      return null;
    }
    if (this._resolvedGeneration === this.generation) {
      return this._texture;
    }

    const camera = this._camera;
    if (!camera) {
      return null;
    }

    const textureHandle = this.xrWebGLBinding.getCameraImage(camera);
    if (!textureHandle) {
      return null;
    }

    if (
      !this._texture ||
      this._texture.props.handle !== textureHandle ||
      this._texture.width !== camera.width ||
      this._texture.height !== camera.height
    ) {
      this._texture?.destroy();
      // XRWebGLBinding owns this opaque camera texture. _isHandleBorrowed tells Resource/WebGL to
      // make a sampler2D-compatible luma wrapper without allocating, uploading, or deleting it.
      this._texture = this.device.createTexture({
        id: `${this.id}-texture`,
        handle: textureHandle,
        _isHandleBorrowed: true,
        width: camera.width,
        height: camera.height,
        format: this.props.format,
        usage: this.props.usage,
        view: this.props.view,
        userData: this.props.userData
      });
    }

    this._resolvedGeneration = this.generation;
    return this._texture;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this._texture?.destroy();
    this._texture = null;
    this._view = null;
    this._camera = null;
    this.destroyed = true;
    this._touchGeneration();
  }

  private _touchGeneration(): void {
    this.generation++;
    this._updateTimestamp = this.device.incrementTimestamp();
  }

  static defaultProps: ResolvedWebXRCameraTextureProps = {
    id: undefined!,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE,
    view: undefined!,
    userData: undefined!
  };
}

const webXRIdCounters: Record<string, number> = {};

function makeWebXRId(id: string): string {
  webXRIdCounters[id] = webXRIdCounters[id] || 1;
  const count = webXRIdCounters[id]++;
  return `${id}-${count}`;
}
