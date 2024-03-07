// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TruncatedConeGeometry} from './truncated-cone-geometry';
import {uid} from '../utils/uid';

export type ConeGeometryProps = {
  id?: string;
  radius?: number;
  cap?: boolean;
};

export class ConeGeometry extends TruncatedConeGeometry {
  constructor(props: ConeGeometryProps = {}) {
    const {id = uid('cone-geometry'), radius = 1, cap = true} = props;
    super({
      ...props,
      id,
      topRadius: 0,
      topCap: Boolean(cap),
      bottomCap: Boolean(cap),
      bottomRadius: radius
    });
  }
}
