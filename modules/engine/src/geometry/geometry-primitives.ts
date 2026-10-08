// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CubeGeometry as MathCubeGeometry,
  SphereGeometry as MathSphereGeometry,
  IcoSphereGeometry as MathIcoSphereGeometry,
  PlaneGeometry as MathPlaneGeometry,
  TruncatedConeGeometry as MathTruncatedConeGeometry,
  unpackIndexedGeometry,
  type Geometry as MathGeometry,
  type GeometryAttributeInput,
  type SphereGeometryProps,
  type IcoSphereGeometryProps,
  type TruncatedConeGeometryProps
} from '@math.gl/geometry';
import {Geometry} from './geometry';

export type {SphereGeometryProps, IcoSphereGeometryProps, TruncatedConeGeometryProps};

export type CubeGeometryProps = {
  id?: string;
  indices?: boolean;
  attributes?: Record<string, GeometryAttributeInput>;
};

/** Compatibility defaults and face metadata over the math.gl box tessellator. */
export class CubeGeometry extends Geometry {
  constructor(props: CubeGeometryProps = {}) {
    const source = new MathCubeGeometry({size: 2});
    const faceIndices = new Uint32Array(24);
    // The renderer's semantic face order is +Z, -Z, +Y, -Y, +X, -X.
    const faceOrder = [4, 5, 2, 3, 0, 1];
    for (let vertexIndex = 0; vertexIndex < faceIndices.length; vertexIndex++) {
      faceIndices[vertexIndex] = faceOrder[Math.floor(vertexIndex / 4)];
    }
    source.attributes['faceIndex'] = {size: 1, value: faceIndices};
    if (props.indices === false) {
      source.attributes['COLOR_0'] = {
        size: 3,
        value: new Float32Array(
          Array.from(source.attributes['POSITION'].value, value => (value + 1) / 2)
        )
      };
    }
    const data = props.indices === false ? unpackIndexedGeometry(source) : source;
    super({
      id: props.id,
      topology: source.topology,
      indices: props.indices === false ? undefined : source.indices,
      attributes: mergeAttributes(data.attributes, props.attributes)
    });
  }
}

export class SphereGeometry extends Geometry {
  constructor(props: SphereGeometryProps = {}) {
    const source = new MathSphereGeometry({
      ...props,
      attributes: undefined,
      radius: props.radius ?? 1
    });
    // Retain the legacy longitude-to-UV mapping while math.gl tessellates the sphere.
    for (const name of ['POSITION', 'NORMAL']) {
      const values = source.attributes[name].value;
      for (let index = 0; index < values.length; index += 3) {
        const horizontal = values[index];
        values[index] = values[index + 2];
        values[index + 2] = horizontal;
      }
    }
    const indices = source.indices?.value;
    if (indices) {
      for (let index = 0; index < indices.length; index += 3) {
        const second = indices[index + 1];
        indices[index + 1] = indices[index + 2];
        indices[index + 2] = second;
      }
    }
    super({...source, attributes: {...source.attributes, ...props.attributes}});
  }
}

export class IcoSphereGeometry extends Geometry {
  constructor(props: IcoSphereGeometryProps = {}) {
    const source = new MathIcoSphereGeometry({...props, radius: props.radius ?? 1});
    super({...source, attributes: source.attributes});
  }
}

export class TruncatedConeGeometry extends Geometry {
  constructor(props: TruncatedConeGeometryProps = {}) {
    const source = new MathTruncatedConeGeometry({...props, bottomRadius: props.bottomRadius ?? 1});
    super({...source, attributes: source.attributes});
  }
}

export type CylinderGeometryProps = Omit<
  TruncatedConeGeometryProps,
  'topRadius' | 'bottomRadius'
> & {
  radius?: number;
};

export class CylinderGeometry extends TruncatedConeGeometry {
  constructor(props: CylinderGeometryProps = {}) {
    const radius = props.radius ?? 1;
    super({...props, topRadius: radius, bottomRadius: radius});
  }
}

export type ConeGeometryProps = Omit<
  TruncatedConeGeometryProps,
  'topRadius' | 'bottomRadius' | 'topCap' | 'bottomCap'
> & {radius?: number; cap?: boolean};

export class ConeGeometry extends TruncatedConeGeometry {
  constructor(props: ConeGeometryProps = {}) {
    const cap = props.cap ?? true;
    super({...props, topRadius: 0, bottomRadius: props.radius ?? 1, topCap: cap, bottomCap: cap});
  }
}

export type PlaneGeometryProps = {
  id?: string;
  radius?: number;
  attributes?: Record<string, GeometryAttributeInput>;
  type?: 'x,y' | 'x,z' | 'y,z';
  offset?: number;
  flipCull?: boolean;
  unpack?: boolean;
  xlen?: number;
  ylen?: number;
  zlen?: number;
  nx?: number;
  ny?: number;
  nz?: number;
};

/** Adapts legacy plane axes and facing to math.gl's XZ plane. */
export class PlaneGeometry extends Geometry {
  constructor(props: PlaneGeometryProps = {}) {
    const {type = 'x,y', offset = 0, flipCull = false} = props;
    const planeAxes = {
      'x,y': {sizeX: props.xlen, sizeZ: props.ylen, nx: props.nx, nz: props.ny},
      'x,z': {sizeX: props.xlen, sizeZ: props.zlen, nx: props.nx, nz: props.nz},
      'y,z': {sizeX: props.ylen, sizeZ: props.zlen, nx: props.ny, nz: props.nz}
    }[type];
    // Only the three legacy axis pairs are supported.
    if (!planeAxes) throw new Error('Invalid plane axes');
    const source = new MathPlaneGeometry({
      sizeX: planeAxes.sizeX || 1,
      sizeZ: planeAxes.sizeZ || 1,
      nx: planeAxes.nx || 1,
      nz: planeAxes.nz || 1
    });
    orientPlane(source, type, offset, flipCull);
    const data = props.unpack ? unpackIndexedGeometry(source) : source;
    super({
      id: props.id,
      topology: source.topology,
      indices: props.unpack ? undefined : source.indices,
      attributes: mergeAttributes(data.attributes, props.attributes)
    });
  }
}

function orientPlane(
  geometry: MathGeometry,
  type: NonNullable<PlaneGeometryProps['type']>,
  offset: number,
  flipCull: boolean
): void {
  const positions = geometry.attributes['POSITION'].value;
  const normals = geometry.attributes['NORMAL'].value;
  const texCoords = geometry.attributes['TEXCOORD_0'].value;
  for (let vertexIndex = 0; vertexIndex < positions.length / 3; vertexIndex++) {
    const positionIndex = vertexIndex * 3;
    const horizontal = Number(positions[positionIndex]) * (flipCull ? -1 : 1);
    const vertical = -Number(positions[positionIndex + 2]);
    const normal = flipCull ? 1 : -1;
    if (type === 'x,y') {
      positions.set([horizontal, vertical, offset], positionIndex);
      normals.set([0, 0, normal], positionIndex);
    } else if (type === 'x,z') {
      positions.set([horizontal, offset, vertical], positionIndex);
      normals.set([0, normal, 0], positionIndex);
    } else {
      positions.set([offset, horizontal, vertical], positionIndex);
      normals.set([normal, 0, 0], positionIndex);
    }
    if (flipCull) texCoords[vertexIndex * 2] = 1 - Number(texCoords[vertexIndex * 2]);
  }
  // The legacy XY and YZ planes face the negative perpendicular axis.
  if (type !== 'x,z' && geometry.indices) {
    const indices = geometry.indices.value;
    for (let index = 0; index < indices.length; index += 3) {
      const second = indices[index + 1];
      indices[index + 1] = indices[index + 2];
      indices[index + 2] = second;
    }
  }
}

function mergeAttributes(
  source: Record<string, GeometryAttributeInput | undefined>,
  overrides: Record<string, GeometryAttributeInput> = {}
): Record<string, GeometryAttributeInput> {
  const attributes: Record<string, GeometryAttributeInput> = {};
  for (const [name, attribute] of Object.entries(source)) {
    if (attribute) attributes[name] = attribute;
  }
  return {...attributes, ...overrides};
}
