import {assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {Buffer, Texture2D} from '@luma.gl/webgl-legacy';
import {Transform} from '@luma.gl/webgl-legacy';
import {textureFilterModule} from './texture-filter';
import {POLY_TEX_VS, FILTER_VS} from './shaders';
import {normalize, getSurfaceIndices, getVertexCount} from './polygon';

/* eslint-disable camelcase */

const TEXTURE_SIZE = 512;

export type GPUPointInPolygonProps = {polygons?, textureSize?};

export class GPUPointInPolygon {
  gl: WebGL2RenderingContext;
  textureSize = TEXTURE_SIZE;

  boundingBox: number[];
  
  polygonTexture: Texture2D;
  positionBuffer: Buffer;
  idBuffer: Buffer;
  indexBuffer: Buffer;
  polyTextureTransform: Transform;
  filterTransform: Transform;

  constructor(gl: WebGL2RenderingContext, props: GPUPointInPolygonProps = {}) {
    this.gl = gl;
    this._setupResources();
    this.update(props);
  }

  update(props: GPUPointInPolygonProps = {}) {
    const {polygons, textureSize} = props;
    if (textureSize) {
      this.textureSize = textureSize;
    }
    if (!polygons || polygons.length === 0) {
      return;
    }

    const {vertices, indices, vertexCount, ids} = triangulatePolygons(polygons);
    this._updateResources(vertices, indices, ids, vertexCount);
  }

  filter({positionBuffer, filterValueIndexBuffer, count}) {
    this.filterTransform.update({
      sourceBuffers: {
        a_position: positionBuffer
      },
      feedbackBuffers: {
        filterValueIndex: filterValueIndexBuffer
      },
      elementCount: count
    });
    const {polygonTexture, boundingBox} = this;

    this.filterTransform.run({
      // @ts-expect-error
      moduleSettings: {boundingBox, texture: polygonTexture}
    });
  }

  // PRIVATE

  _setupResources() {
    const {gl} = this;

    // texture to render polygons to
    this.polygonTexture = new Texture2D(gl, {
      // @ts-expect-error TODO rewrite with Texture
      format: 'GL.RGB',
      type: GL.UNSIGNED_BYTE,
      dataFormat: GL.RGB,
      border: 0,
      mipmaps: false,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
        [GL.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });
    this.positionBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 2}});
    this.idBuffer = new Buffer(gl, {accessor: {type: GL.FLOAT, size: 1}});
    this.indexBuffer = new Buffer(gl, {
      target: GL.ELEMENT_ARRAY_BUFFER,
      accessor: {type: GL.UNSIGNED_SHORT}
    });

    // transform to generate polygon texture
    this.polyTextureTransform = new Transform(gl, {
      id: 'polygon-texture-creation-transform',
      elementCount: 0,
      _targetTexture: this.polygonTexture,
      _targetTextureVarying: 'v_polygonColor',
      vs: POLY_TEX_VS,
      drawMode: GL.TRIANGLES,
      isIndexed: true,
      sourceBuffers: {
        a_position: this.positionBuffer,
        a_polygonID: this.idBuffer,
        indices: this.indexBuffer
      }
    });

    // transform to perform filtering
    this.filterTransform = new Transform(gl, {
      id: 'filter transform',
      vs: FILTER_VS,
      modules: [textureFilterModule],
      varyings: ['filterValueIndex']
    });
  }

  _updateResources(vertices, indices, ids, vertexCount) {
    const boundingBox = getBoundingBox(vertices, vertexCount);
    const [xMin, yMin, xMax, yMax] = boundingBox;
    const width = xMax - xMin;
    const height = yMax - yMin;
    const whRatio = width / height;
    const {textureSize} = this;

    // calculate max texture size with same aspect ratio
    let texWidth = textureSize;
    let texHeight = textureSize;
    if (whRatio > 1) {
      texHeight = texWidth / whRatio;
    } else {
      texWidth = texHeight * whRatio;
    }

    this.boundingBox = boundingBox;
    this.polygonTexture.resize({width: texWidth, height: texHeight, mipmaps: false});
    this.positionBuffer.setData(new Float32Array(vertices));
    this.idBuffer.setData(new Float32Array(ids));
    this.indexBuffer.setData(new Uint16Array(indices));
    this.polyTextureTransform.update({
      elementCount: indices.length,
      _targetTexture: this.polygonTexture
    });

    this.polyTextureTransform.run({
      uniforms: {
        boundingBoxOriginSize: [xMin, yMin, width, height]
      }
    });
  }
}

// Helper methods

function getBoundingBox(positions, vertexCount) {
  let yMin = Infinity;
  let yMax = -Infinity;
  let xMin = Infinity;
  let xMax = -Infinity;
  let y;
  let x;

  for (let i = 0; i < vertexCount; i++) {
    x = positions[i * 2];
    y = positions[i * 2 + 1];
    yMin = y < yMin ? y : yMin;
    yMax = y > yMax ? y : yMax;
    xMin = x < xMin ? x : xMin;
    xMax = x > xMax ? x : xMax;
  }

  return [xMin, yMin, xMax, yMax];
}

function triangulatePolygons(polygons) {
  const SIZE = 2;
  const vertices = [];
  const indices = [];
  const ids = [];
  let count = 0;
  let polygonId = 0;
  for (let i = 0; i < polygons.length; i++) {
    const normalized = normalize(polygons[i], SIZE);
    // @ts-expect-error
    const curVertices = normalized.positions || normalized;
    const curCount = curVertices.length / SIZE;
    const curIds = new Array(curCount).fill(polygonId);
    vertices.push(...curVertices);
    ids.push(...curIds);
    const curIndices = getSurfaceIndices(normalized, SIZE);
    const indexCount = curIndices.length;
    for (let j = 0; j < indexCount; j++) {
      curIndices[j] += count;
    }
    count += curCount;
    indices.push(...curIndices);
    polygonId++;
  }

  // UInt16 (UNSIGNED_SHORT) buffer is used for indices
  assert(count < 65536); // 0xFFFF

  const vertexCount = getVertexCount(vertices, SIZE);

  return {vertices, indices, ids, vertexCount};
}
