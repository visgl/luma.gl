// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type BufferLayout, type ShaderLayout} from '@luma.gl/core';

export function sortedBufferLayoutByShaderSourceLocations(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): BufferLayout[] {
  const shaderLayoutMap = Object.fromEntries(
    shaderLayout.attributes.map(attr => [attr.name, attr.location])
  );

  const sortedLayout = bufferLayout.slice();
  sortedLayout.sort((a, b) => {
    const attributeNamesA = a.attributes ? a.attributes.map(attr => attr.attribute) : [a.name];
    const attributeNamesB = b.attributes ? b.attributes.map(attr => attr.attribute) : [b.name];
    const minLocationA = Math.min(...attributeNamesA.map(name => shaderLayoutMap[name]));
    const minLocationB = Math.min(...attributeNamesB.map(name => shaderLayoutMap[name]));

    return minLocationA - minLocationB;
  });

  return sortedLayout;
}
