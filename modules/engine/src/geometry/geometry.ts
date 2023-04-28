// luma.gl, MIT license
import type {PrimitiveTopology, TypedArray} from '@luma.gl/api';
import {uid, assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';

/**
 * Rendering primitives - "topology" specifies how to extract primitives from vertices.
 * @deprecated - use string constants instead
 */
export type GLTopology =
  GL.POINTS |  // draw single points.
  GL.LINES |  // draw lines. Each vertex connects to the one after it.
  GL.LINE_LOOP |  // draw lines. Each set of two vertices is treated as a separate line segment.
  GL.LINE_STRIP |  // draw a connected group of line segments from the first vertex to the last
  GL.TRIANGLES |  // draw triangles. Each set of three vertices creates a separate triangle.
  GL.TRIANGLE_STRIP |  // draw a connected group of triangles.
  GL.TRIANGLE_FAN // draw a connected group of triangles.
  ;

export type GeometryAttribute = {
  size?: number;
  value: TypedArray;
  [key: string]: any
}

export type GeometryProps = {
  id?: string;
  attributes?: Record<string, GeometryAttribute | TypedArray>,
  indices?: GeometryAttribute | TypedArray;
  vertexCount?: number;
  /** Determines how vertices are read from the 'vertex' attributes */
  topology?: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  /** @deprecated */
  drawMode?: GLTopology;
};

type GeometryAttributes = {
  POSITION: GeometryAttribute,
  NORMAL: GeometryAttribute,
  TEXCOORD_0: GeometryAttribute,
  COLOR_0?: GeometryAttribute,
  indices?: {size?: number, value: Uint32Array | Uint16Array};
};

export default class Geometry {
  /** @deprecated */
  static DRAW_MODE = {
    POINTS: GL.POINTS,  // draw single points.
    LINES: GL.LINES,  // draw lines. Each vertex connects to the one after it.
    LINE_LOOP: GL.LINE_LOOP,  // draw lines. Each set of two vertices is treated as a separate line segment.
    LINE_STRIP: GL.LINE_STRIP,  // draw a connected group of line segments from the first vertex to the last
    TRIANGLES: GL.TRIANGLES,  // draw triangles. Each set of three vertices creates a separate triangle.
    TRIANGLE_STRIP: GL.TRIANGLE_STRIP,  // draw a connected group of triangles.
    TRIANGLE_FAN: GL.TRIANGLE_FAN // draw a connected group of triangles.
  };

  readonly id: string;
  userData: Record<string, unknown> = {};

  /** Determines how vertices are read from the 'vertex' attributes */
  topology?: PrimitiveTopology;
  /** @deprecated */
  readonly drawMode: GLTopology = GL.TRIANGLES;

  readonly vertexCount: number;
  readonly attributes: {
    POSITION: GeometryAttribute,
    NORMAL: GeometryAttribute,
    TEXCOORD_0: GeometryAttribute,
    COLOR_0?: GeometryAttribute,
    [key: string]: GeometryAttribute | undefined
  };
  readonly indices?: Uint16Array | Uint32Array;

  constructor(props: GeometryProps = {}) {
    const {
      id = uid('geometry'),
      drawMode = GL.TRIANGLES,
      attributes = {},
      indices = null,
      vertexCount = null
    } = props;

    this.id = id;
    this.drawMode = drawMode;
    this.topology = props.topology || convertToTopology(drawMode);

    if (indices) {
      // @ts-expect-error
      this.indices = ArrayBuffer.isView(indices) ? {value: indices, size: 1} : indices;
    }

    // @ts-expect-error
    this.attributes = {};

    for (const [attributeName, attributeValue] of Object.entries(attributes)) {

      // Wrap "unwrapped" arrays and try to autodetect their type
      const attribute: GeometryAttribute = ArrayBuffer.isView(attributeValue) ? {value: attributeValue} : attributeValue;

      assert(
        ArrayBuffer.isView(attribute.value),
        `${this._print(attributeName)}: must be typed array or object with value as typed array`
      );

      if ((attributeName === 'POSITION' || attributeName === 'positions') && !attribute.size) {
        attribute.size = 3;
      }

      // Move indices to separate field
      if (attributeName === 'indices') {
        assert(!this.indices);
        // @ts-expect-error
        this.indices = attribute;
      } else {
        this.attributes[attributeName] = attribute;
      }
    }

    // @ts-expect-error
    if (this.indices && this.indices.isIndexed !== undefined) {
      this.indices = Object.assign({}, this.indices);
      // @ts-expect-error
      delete this.indices.isIndexed;
    }

    this.vertexCount = vertexCount || this._calculateVertexCount(this.attributes, this.indices);
  }

  /** @deprecated Use string topology constants instead */
  get mode() {
    return this.drawMode;
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  // Return an object with all attributes plus indices added as a field.
  getAttributes(): GeometryAttributes {
    // @ts-expect-error Geometry types are a mess
    return this.indices ? {indices: this.indices, ...this.attributes} : this.attributes;
  }

  // PRIVATE

  _print(attributeName: string): string {
    return `Geometry ${this.id} attribute ${attributeName}`;
  }

  // GeometryAttribute
  // value: typed array
  // type: indices, vertices, uvs
  // size: elements per vertex
  // target: WebGL buffer type (string or constant)
  _setAttributes(attributes: Record<string, GeometryAttribute>, indices: any): this {

    return this;
  }

  _calculateVertexCount(attributes: any, indices: any): number {
    if (indices) {
      return indices.value.length;
    }
    let vertexCount = Infinity;
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const {value, size, constant} = attribute;
      if (!constant && value && size >= 1) {
        vertexCount = Math.min(vertexCount, value.length / size);
      }
    }

    assert(Number.isFinite(vertexCount));
    return vertexCount;
  }
}

function convertToTopology(drawMode: GLTopology): PrimitiveTopology {
  switch (drawMode) {
    case GL.POINTS: return 'point-list'; // draw single points.
    case GL.LINES: return 'line-list'; // draw lines. Each vertex connects to the one after it.
    case GL.LINE_STRIP: return 'line-strip';  // draw a connected group of line segments from the first vertex to the last
    case GL.TRIANGLES: return 'triangle-list'; // draw triangles. Each set of three vertices creates a separate triangle.
    case GL.TRIANGLE_STRIP: return 'triangle-strip'; // draw a connected group of triangles.

    case GL.TRIANGLE_FAN: return 'triangle-fan'; // draw a connected group of triangles.
    case GL.LINE_LOOP: return 'line-loop'; // draw lines. Each set of two vertices is treated as a separate line segment.
    default:
      throw new Error(String(drawMode));
  }
}
