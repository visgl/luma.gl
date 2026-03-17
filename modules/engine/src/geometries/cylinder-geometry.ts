// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TruncatedConeGeometryProps} from './truncated-cone-geometry';
import {TruncatedConeGeometry} from './truncated-cone-geometry';
import {uid} from '../utils/uid';

export type CylinderGeometryProps = Omit<
  TruncatedConeGeometryProps,
  'topRadius' | 'bottomRadius'
> & {
  id?: string;
  radius?: number;
  attributes?: any;
};

export class CylinderGeometry extends TruncatedConeGeometry {
  constructor(props: CylinderGeometryProps = {}) {
    const {id = uid('cylinder-geometry'), radius = 1} = props;
    super({
      ...props,
      id,
      bottomRadius: radius,
      topRadius: radius
    });
  }
}
