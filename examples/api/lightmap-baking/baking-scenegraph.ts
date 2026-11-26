// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {assert} from '@luma.gl/core';
import {Geometry, GroupNode} from '@luma.gl/engine';
import {SceneMeshNode} from '@luma.gl/anari';

/** The example authors one constant color per face; express those colors as ray materials. */
export function makeBakingScenegraph(geometry: Geometry): GroupNode {
  const positions = geometry.attributes.POSITION;
  const normals = geometry.attributes.NORMAL;
  const colors = geometry.attributes.COLOR_0;
  // This adapter is for the example's packed, unindexed, flat-colored triangles.
  assert(!geometry.indices && colors && (colors.size === 3 || colors.size === 4));
  const groups = new Map<
    string,
    {color: [number, number, number, number]; positions: number[]; normals: number[]}
  >();
  for (let firstVertex = 0; firstVertex < geometry.vertexCount; firstVertex += 3) {
    const offset = firstVertex * colors.size;
    const color: [number, number, number, number] = [
      colors.value[offset],
      colors.value[offset + 1],
      colors.value[offset + 2],
      colors.size === 4 ? colors.value[offset + 3] : 1
    ];
    const identifier = color.join(',');
    let group = groups.get(identifier);
    if (!group) {
      group = {color, positions: [], normals: []};
      groups.set(identifier, group);
    }
    for (let corner = 0; corner < 3; corner++) {
      const vertex = firstVertex + corner;
      for (let component = 0; component < colors.size; component++) {
        // A varying vertex color needs a ray vertex-color implementation, not face grouping.
        assert(colors.value[vertex * colors.size + component] === color[component]);
      }
      for (let component = 0; component < 3; component++) {
        group.positions.push(positions.value[vertex * 3 + component]);
        group.normals.push(normals.value[vertex * 3 + component]);
      }
    }
  }
  return new GroupNode({
    children: Array.from(
      groups,
      ([identifier, group]) =>
        new SceneMeshNode({
          geometry: new Geometry({
            topology: 'triangle-list',
            attributes: {
              POSITION: {size: 3, value: new Float32Array(group.positions)},
              NORMAL: {size: 3, value: new Float32Array(group.normals)}
            }
          }),
          material: {
            id: `bake-color-${identifier}`,
            uniforms: {baseColorFactor: group.color, metallicRoughnessValues: [0, 1]}
          }
        })
    )
  });
}
