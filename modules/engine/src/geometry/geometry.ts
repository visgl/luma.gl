// luma.gl, MIT license
import type {TypedArray} from '@luma.gl/api';
import {uid, assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';

/**
 * Rendering primitives - "opology" specifies how to extract primitives from vertices.
 */
export type Topology =
  GL.POINTS |  // draw single points.
  GL.LINES |  // draw lines. Each vertex connects to the one after it.
  GL.LINE_LOOP |  // draw lines. Each set of two vertices is treated as a separate line segment.
  GL.LINE_STRIP |  // draw a connected group of line segments from the first vertex to the last
  GL.TRIANGLES |  // draw triangles. Each set of three vertices creates a separate triangle.
  GL.TRIANGLE_STRIP |  // draw a connected group of triangles.
  GL.TRIANGLE_FAN // draw a connected group of triangles.
  ;

export type GeometryProps = {
  id?: string;
  drawMode?: Topology,
  attributes?: {},
  indices?;
  vertexCount?: number
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
  readonly drawMode: Topology = GL.TRIANGLES;

  vertexCount: number;
  attributes: {
    POSITION: {size: number, value: TypedArray, [key: string]: any},
    NORMAL: {size: number, value: TypedArray, [key: string]: any},
    TEXCOORD_0: {size: number, value: TypedArray, [key: string]: any},
    COLOR_0?: {size: number, value: TypedArray, [key: string]: any},
  };
  indices;
  userData: Record<string, any> = {};

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

    this._setAttributes(attributes, indices);

    this.vertexCount = vertexCount || this._calculateVertexCount(this.attributes, this.indices);
  }

  get mode() {
    return this.drawMode;
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  // Return an object with all attributes plus indices added as a field.
  getAttributes() {
    return this.indices ? {indices: this.indices, ...this.attributes} : this.attributes;
  }

  // PRIVATE

  _print(attributeName): string {
    return `Geometry ${this.id} attribute ${attributeName}`;
  }

  // Attribute
  // value: typed array
  // type: indices, vertices, uvs
  // size: elements per vertex
  // target: WebGL buffer type (string or constant)
  _setAttributes(attributes, indices): this {
    if (indices) {
      this.indices = ArrayBuffer.isView(indices) ? {value: indices, size: 1} : indices;
    }

    // @ts-expect-error
    this.attributes = {};

    for (const attributeName in attributes) {
      let attribute = attributes[attributeName];

      // Wrap "unwrapped" arrays and try to autodetect their type
      attribute = ArrayBuffer.isView(attribute) ? {value: attribute} : attribute;

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
        this.indices = attribute;
      } else {
        this.attributes[attributeName] = attribute;
      }
    }

    if (this.indices && this.indices.isIndexed !== undefined) {
      this.indices = Object.assign({}, this.indices);
      delete this.indices.isIndexed;
    }

    return this;
  }

  _calculateVertexCount(attributes, indices): number {
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
