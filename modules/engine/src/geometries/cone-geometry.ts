// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TruncatedConeGeometryProps} from './truncated-cone-geometry';
import {TruncatedConeGeometry} from './truncated-cone-geometry';
import {uid} from '../utils/uid';

export type ConeGeometryProps = Omit<
  TruncatedConeGeometryProps,
  'topRadius' | 'bottomRadius' | 'topCap' | 'bottomCap'
> & {
  id?: string;
  radius?: number;
  cap?: boolean;
  attributes?: any;
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
