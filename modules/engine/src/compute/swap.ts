// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferProps, FramebufferProps} from '@luma.gl/core';
import {Device, Resource, Buffer, Framebuffer, Texture} from '@luma.gl/core';

/**
 * Helper class for working with repeated transformations / computations
 * Primarily intended for GPU buffers `Swap<Buffer>` or textures `Swap<Texture>`)
 * @note the two resources are expected to be structurally identical (same size, length, format, etc)
 * @note the two resources can be destroyed by calling `destroy()`
 */
export class Swap<T extends Resource<any>> {
  /** The current resource - usually the source for renders or computations */
  current: T;
  /** The next resource - usually the target/destination for transforms / computations */
  next: T;

  constructor(props: {current: T; next: T}) {
    this.current = props.current;
    this.next = props.next;
  }

  /** Destroys the two managed resources */
  destroy() {
    this.current?.destroy();
    this.next?.destroy();
  }

  /** Make the next resource into the current resource, and reuse the current resource as the next resource */
  swap() {
    const current = this.current;
    this.current = this.next;
    this.next = current;
  }
}

/** Helper for managing double-buffered framebuffers */
export class SwapFramebuffers extends Swap<Framebuffer> {
  constructor(device: Device, props: FramebufferProps) {
    props = {...props};

    let colorAttachments = props.colorAttachments?.map(colorAttachment =>
      typeof colorAttachment !== 'string'
        ? colorAttachment
        : device.createTexture({
            format: colorAttachment,
            usage: Texture.COPY_DST | Texture.RENDER_ATTACHMENT
          })
    );

    const current = device.createFramebuffer({...props, colorAttachments});

    colorAttachments = props.colorAttachments?.map(colorAttachment =>
      typeof colorAttachment !== 'string'
        ? colorAttachment
        : device.createTexture({
            format: colorAttachment,
            usage: Texture.COPY_DST | Texture.RENDER_ATTACHMENT
          })
    );

    const next = device.createFramebuffer({...props, colorAttachments});

    super({current, next});
  }

  /**
   * Resizes the Framebuffers.
   * @returns true if the size changed, otherwise exiting framebuffers were preserved
   * @note any contents are not preserved!
   */
  resize(size: {width: number; height: number}): boolean {
    if (size.width === this.current.width && size.height === this.current.height) {
      return false;
    }
    const {current, next} = this;

    this.current = current.clone(size);
    current.destroy();

    this.next = next.clone(size);
    next.destroy();

    return true;
  }
}

/** Helper for managing double-buffered GPU buffers */
export class SwapBuffers extends Swap<Buffer> {
  constructor(device: Device, props: BufferProps) {
    super({current: device.createBuffer(props), next: device.createBuffer(props)});
  }

  /**
   * Resizes the Buffers.
   * @returns true if the size changed, otherwise exiting buffers were preserved.
   * @note any contents are not preserved!
   */
  resize(props: {byteLength: number}) {
    if (props.byteLength === this.current.byteLength) {
      return false;
    }

    const {current, next} = this;

    this.current = current.clone(props);
    current.destroy();

    this.next = next.clone(props);
    next.destroy();

    return true;
  }
}
