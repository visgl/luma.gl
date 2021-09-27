import {TruncatedConeGeometry} from './truncated-cone-geometry';
import {uid} from '@luma.gl/webgl';

export type CylinderGeometryProps = {
  id?: string;
  radius?: number;
  attributes?
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
