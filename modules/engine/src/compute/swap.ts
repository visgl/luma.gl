// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Resource} from '@luma.gl/core';

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
