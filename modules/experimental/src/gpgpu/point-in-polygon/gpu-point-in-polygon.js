import GL from '@luma.gl/constants';
import {Buffer, Texture2D, assert} from '@luma.gl/webgl';
import {isWebGL2} from '@luma.gl/gltools';
import {Transform} from '@luma.gl/engine';
import {default as textureFilterModule} from './texture-filter';
import {POLY_TEX_VS, FILTER_VS} from './shaders';
import * as Polygon from './polygon';
const TEXTURE_SIZE = 512;

export default class GPUPointInPolygon {
  constructor(gl, opts = {}) {
    this.gl = gl;
    assert(isWebGL2(gl)); // supports WebGL2 only
    this.textureSize = TEXTURE_SIZE;
    this._setupResources();
    this.update(opts);
  }

  update({polygons, textureSize} = {}) {
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
      moduleSettings: {boundingBox, texture: polygonTexture}
    });
  }

  // PRIVATE

  _setupResources() {
    const {gl} = this;

    // texture to render polygons to
    this.polygonTexture = new Texture2D(gl, {
      format: GL.RGB,
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
      id: `polygon-texture-creation-transform`,
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
    const normalized = Polygon.normalize(polygons[i], SIZE);
    const curVertices = normalized.positions || normalized;
    const curCount = curVertices.length / SIZE;
    const curIds = new Array(curCount).fill(polygonId);
    vertices.push(...curVertices);
    ids.push(...curIds);
    const curIndices = Polygon.getSurfaceIndices(normalized, SIZE);
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

  const vertexCount = Polygon.getVertexCount(vertices, SIZE);

  return {vertices, indices, ids, vertexCount};
}
