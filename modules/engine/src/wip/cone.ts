import {uid} from '@luma.gl/api';
import {TruncatedConeGeometry} from './truncated-cone';

export type ConeGeometryProps = {
  id?: string;
  radius?: number;
  cap?: boolean;
};

/**
 * Primitives inspired by TDL http://code.google.com/p/webglsamples/,
 * copyright 2011 Google Inc. new BSD License
 * (http://www.opensource.org/licenses/bsd-license.php).
 */
 export function makeCone(props?: ConeGeometryProps): GeometryTable {
  const {radius = 1, cap = true} = props;
  const {indices, attributes} = tesselateTruncatedCone({
    ...props,
    topRadius: 0,
    topCap: Boolean(cap),
    bottomCap: Boolean(cap),
    bottomRadius: radius
  });
  return {
    length: indices.length,
    indices,
    attributes
  };
}

export class ConeGeometry extends TruncatedConeGeometry {
  constructor(props: ConeGeometryProps = {}) {
    super();
  }
}
