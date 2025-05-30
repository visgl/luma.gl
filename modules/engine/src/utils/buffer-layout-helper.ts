// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log, type BufferLayout} from '@luma.gl/core';

/** BufferLayoutHelper is a helper class that should not be used directly by applications */
export class BufferLayoutHelper {
  bufferLayouts: BufferLayout[];

  constructor(bufferLayouts: BufferLayout[]) {
    this.bufferLayouts = bufferLayouts;
  }

  getBufferLayout(name: string): BufferLayout | null {
    return this.bufferLayouts.find(layout => layout.name === name) || null;
  }

  /** Get attribute names from a BufferLayout */
  getAttributeNamesForBuffer(bufferLayout: BufferLayout): string[] {
    return bufferLayout.attributes
      ? bufferLayout.attributes?.map(layout => layout.attribute)
      : [bufferLayout.name];
  }

  mergeBufferLayouts(
    bufferLayouts1: BufferLayout[],
    bufferLayouts2: BufferLayout[]
  ): BufferLayout[] {
    const mergedLayouts = [...bufferLayouts1];
    for (const attribute of bufferLayouts2) {
      const index = mergedLayouts.findIndex(attribute2 => attribute2.name === attribute.name);
      if (index < 0) {
        mergedLayouts.push(attribute);
      } else {
        mergedLayouts[index] = attribute;
      }
    }
    return mergedLayouts;
  }

  getBufferIndex(bufferName: string): number {
    const bufferIndex = this.bufferLayouts.findIndex(layout => layout.name === bufferName);

    if (bufferIndex === -1) {
      log.warn(`BufferLayout: Missing buffer for "${bufferName}".`)();
    }

    return bufferIndex;
  }
}
