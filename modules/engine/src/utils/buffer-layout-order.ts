// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getBufferLayoutAttributeNames,
  getMinimumAttributeLocation,
  getShaderAttributeLocationMap,
  type BufferLayout,
  type ShaderLayout
} from '@luma.gl/core';

export function sortedBufferLayoutByShaderSourceLocations(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): BufferLayout[] {
  const shaderLayoutMap = getShaderAttributeLocationMap(shaderLayout);

  const sortedLayout = bufferLayout.slice();
  sortedLayout.sort((a, b) => {
    const minLocationA = getMinimumAttributeLocation(
      getBufferLayoutAttributeNames(a).map(attributeName => shaderLayoutMap[attributeName])
    );
    const minLocationB = getMinimumAttributeLocation(
      getBufferLayoutAttributeNames(b).map(attributeName => shaderLayoutMap[attributeName])
    );

    return minLocationA - minLocationB;
  });

  return sortedLayout;
}
