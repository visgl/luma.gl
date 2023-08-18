import {uid} from '@luma.gl/core';
import {TruncatedConeGeometry} from './truncated-cone-geometry';

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
