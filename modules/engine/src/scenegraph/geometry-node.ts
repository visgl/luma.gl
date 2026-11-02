// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Geometry} from '../geometry/geometry';
import {ScenegraphNode, type ScenegraphNodeProps} from './scenegraph-node';
import type {ScenegraphBounds} from './scenegraph-bounds';

export type GeometryNodeProps = ScenegraphNodeProps & {geometry: Geometry};

/** Retained CPU geometry shared by render adapters and collider cooking. */
export class GeometryNode extends ScenegraphNode {
  readonly geometry: Geometry;
  constructor(props: GeometryNodeProps) {
    super(props);
    this.geometry = props.geometry;
  }

  override getBounds(): ScenegraphBounds | null {
    const positions = this.geometry.attributes['POSITION'];
    if (!positions || positions.size !== 3 || !positions.value.length) return null;
    const minimum: [number, number, number] = [Infinity, Infinity, Infinity];
    const maximum: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (let index = 0; index < positions.value.length; index++) {
      const axis = index % 3;
      minimum[axis] = Math.min(minimum[axis], positions.value[index]);
      maximum[axis] = Math.max(maximum[axis], positions.value[index]);
    }
    return [minimum, maximum];
  }
}
