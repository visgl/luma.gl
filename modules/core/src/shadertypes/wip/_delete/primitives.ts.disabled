/*
 * Copyright 2023 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

import { isTypedArray, TypedArray, TypedArrayConstructor } from './typed-arrays.js';
import { Arrays, getNumComponents, makeTypedArrayFromArrayUnion } from './attribute-utils.js';

/**
 * A class to provide `push` on a typed array.
 *
 * example:
 *
 * ```js
 * const positions = new TypedArrayWrapper(new Float32Array(300), 3);
 * positions.push(1, 2, 3); // add a position
 * positions.push([4, 5, 6]);  // add a position
 * positions.push(new Float32Array(6)); // add 2 positions
 * const data = positions.typedArray;
 * ```
 */
export class TypedArrayWrapper<T extends TypedArray> {
  typedArray: T;
  cursor = 0;
  numComponents: number;

  constructor(arr: T, numComponents: number) {
    this.typedArray = arr;
    this.numComponents = numComponents;
  }
  get numElements(): number {
    return this.typedArray.length / this.numComponents;
  }
  push(...data: (number | Iterable<number>)[]) {
    for (const value of data) {
      if (Array.isArray(value) || isTypedArray(value)) {
        const asArray = data as number[];
        this.typedArray.set(asArray, this.cursor);
        this.cursor += asArray.length;
      } else {
        this.typedArray[this.cursor++] = value as number;
      }
    }
  }
  reset(index = 0) {
    this.cursor = index;
  }
}

/**
 * creates a typed array with a `push` function attached
 * so that you can easily *push* values.
 *
 * `push` can take multiple arguments. If an argument is an array each element
 * of the array will be added to the typed array.
 *
 * Example:
 *
 *     const array = createAugmentedTypedArray(3, 2, Float32Array);
 *     array.push(1, 2, 3);
 *     array.push([4, 5, 6]);
 *     // array now contains [1, 2, 3, 4, 5, 6]
 *
 * Also has `numComponents` and `numElements` properties.
 *
 * @param numComponents number of components
 * @param numElements number of elements. The total size of the array will be `numComponents * numElements`.
 * @param Type A constructor for the type. Default = `Float32Array`.
 */
function createAugmentedTypedArray<T extends TypedArrayConstructor>(numComponents: number, numElements: number, Type: T) {
  return new TypedArrayWrapper(new Type(numComponents * numElements) as InstanceType<T>, numComponents);
}

// I couldn't figure out how to make this because TypedArrayWrapper wants a type
// but this is explicity kind of type-less.
function createAugmentedTypedArrayFromExisting(numComponents: number, numElements: number, existingArray: TypedArray) {
  const Ctor = existingArray.constructor as Float32ArrayConstructor;
  const array: Float32Array = new Ctor(numComponents * numElements) as unknown as Float32Array;
  return new TypedArrayWrapper(array, numComponents);
}

/**
 * Creates XY quad vertices
 *
 * The default with no parameters will return a 2x2 quad with values from -1 to +1.
 * If you want a unit quad with that goes from 0 to 1 you'd call it with
 *
 *     createXYQuadVertices(1, 0.5, 0.5);
 *
 * If you want a unit quad centered above 0,0 you'd call it with
 *
 *     primitives.createXYQuadVertices(1, 0, 0.5);
 *
 * @param params
 * @param params.size the size across the quad. Defaults to 2 which means vertices will go from -1 to +1
 * @param params.xOffset the amount to offset the quad in X. Default = 0
 * @param params.yOffset the amount to offset the quad in Y. Default = 0
 * @return the created XY Quad vertices
 */
export function createXYQuadVertices({
    size: inSize = 2, xOffset = 0, yOffset = 0
  } = {}): Arrays {
  const size = inSize * 0.5;
  return {
    position: {
      numComponents: 2,
      data: [
        xOffset + -1 * size, yOffset + -1 * size,
        xOffset +  1 * size, yOffset + -1 * size,
        xOffset + -1 * size, yOffset +  1 * size,
        xOffset +  1 * size, yOffset +  1 * size,
      ],
    },
    normal: [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ],
    texcoord: [
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ],
    indices: [ 0, 1, 2, 2, 1, 3 ],
  } as Arrays;
}

/**
 * Creates XZ plane vertices.
 *
 * The created plane has position, normal, and texcoord data
 *
 * @param params
 * @param params.width Width of the plane. Default = 1
 * @param params.depth Depth of the plane. Default = 1
 * @param params.subdivisionsWidth Number of steps across the plane. Default = 1
 * @param params.subdivisionsDepth Number of steps down the plane. Default = 1
 * @return The created plane vertices.
 */
export function createPlaneVertices({
    width = 1,
    depth = 1,
    subdivisionsWidth = 1,
    subdivisionsDepth = 1,
} = {}): Arrays {
  const numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
  const positions = createAugmentedTypedArray(3, numVertices, Float32Array);
  const normals = createAugmentedTypedArray(3, numVertices, Float32Array);
  const texcoords = createAugmentedTypedArray(2, numVertices, Float32Array);

  for (let z = 0; z <= subdivisionsDepth; z++) {
    for (let x = 0; x <= subdivisionsWidth; x++) {
      const u = x / subdivisionsWidth;
      const v = z / subdivisionsDepth;
      positions.push(
          width * u - width * 0.5,
          0,
          depth * v - depth * 0.5);
      normals.push(0, 1, 0);
      texcoords.push(u, v);
    }
  }

  const numVertsAcross = subdivisionsWidth + 1;
  const indices = createAugmentedTypedArray(
      3, subdivisionsWidth * subdivisionsDepth * 2, Uint16Array);

  for (let z = 0; z < subdivisionsDepth; z++) {  // eslint-disable-line
    for (let x = 0; x < subdivisionsWidth; x++) {  // eslint-disable-line
      // Make triangle 1 of quad.
      indices.push(
          (z + 0) * numVertsAcross + x,
          (z + 1) * numVertsAcross + x,
          (z + 0) * numVertsAcross + x + 1);

      // Make triangle 2 of quad.
      indices.push(
          (z + 1) * numVertsAcross + x,
          (z + 1) * numVertsAcross + x + 1,
          (z + 0) * numVertsAcross + x + 1);
    }
  }

  return {
    position: positions.typedArray,
    normal: normals.typedArray,
    texcoord: texcoords.typedArray,
    indices: indices.typedArray,
  };
}

/**
 * Creates sphere vertices.
 *
 * The created sphere has position, normal, and texcoord data
 *
 * @param params
 * @param params.radius radius of the sphere. Default = 1
 * @param params.subdivisionsAxis number of steps around the sphere. Default = 24
 * @param params.subdivisionsHeight number of vertically on the sphere. Default = 12
 * @param params.startLatitudeInRadians where to start the
 *     top of the sphere. Default = 0
 * @param params.endLatitudeInRadians Where to end the
 *     bottom of the sphere. Default = π
 * @param params.startLongitudeInRadians where to start
 *     wrapping the sphere. Default = 0
 * @param params.endLongitudeInRadians where to end
 *     wrapping the sphere. Default = 2π
 * @return The created sphere vertices.
 */
export function createSphereVertices({
    radius = 1,
    subdivisionsAxis = 24,
    subdivisionsHeight = 12,
    startLatitudeInRadians = 0,
    endLatitudeInRadians = Math.PI,
    startLongitudeInRadians = 0,
    endLongitudeInRadians = Math.PI * 2,
} = {}): Arrays {
  if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
    throw new Error('subdivisionAxis and subdivisionHeight must be > 0');
  }

  const latRange = endLatitudeInRadians - startLatitudeInRadians;
  const longRange = endLongitudeInRadians - startLongitudeInRadians;

  // We are going to generate our sphere by iterating through its
  // spherical coordinates and generating 2 triangles for each quad on a
  // ring of the sphere.
  const numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
  const positions = createAugmentedTypedArray(3, numVertices, Float32Array);
  const normals   = createAugmentedTypedArray(3, numVertices, Float32Array);
  const texcoords = createAugmentedTypedArray(2, numVertices, Float32Array);

  // Generate the individual vertices in our vertex buffer.
  for (let y = 0; y <= subdivisionsHeight; y++) {
    for (let x = 0; x <= subdivisionsAxis; x++) {
      // Generate a vertex based on its spherical coordinates
      const u = x / subdivisionsAxis;
      const v = y / subdivisionsHeight;
      const theta = longRange * u + startLongitudeInRadians;
      const phi = latRange * v + startLatitudeInRadians;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const ux = cosTheta * sinPhi;
      const uy = cosPhi;
      const uz = sinTheta * sinPhi;
      positions.push(radius * ux, radius * uy, radius * uz);
      normals.push(ux, uy, uz);
      texcoords.push(1 - u, v);
    }
  }

  const numVertsAround = subdivisionsAxis + 1;
  const indices = createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
  for (let x = 0; x < subdivisionsAxis; x++) {  // eslint-disable-line
    for (let y = 0; y < subdivisionsHeight; y++) {  // eslint-disable-line
      // Make triangle 1 of quad.
      indices.push(
          (y + 0) * numVertsAround + x,
          (y + 0) * numVertsAround + x + 1,
          (y + 1) * numVertsAround + x);

      // Make triangle 2 of quad.
      indices.push(
          (y + 1) * numVertsAround + x,
          (y + 0) * numVertsAround + x + 1,
          (y + 1) * numVertsAround + x + 1);
    }
  }

  return {
    position: positions.typedArray,
    normal: normals.typedArray,
    texcoord: texcoords.typedArray,
    indices: indices.typedArray,
  };
}

/**
 * Array of the indices of corners of each face of a cube.
 */
const CUBE_FACE_INDICES = [
  [3, 7, 5, 1],  // right
  [6, 2, 0, 4],  // left
  [6, 7, 3, 2],  // ??
  [0, 1, 5, 4],  // ??
  [7, 6, 4, 5],  // front
  [2, 3, 1, 0],  // back
];

/**
 * Creates the vertices and indices for a cube.
 *
 * The cube is created around the origin. (-size / 2, size / 2).
 *
 * @param params
 * @param params.size width, height and depth of the cube. Default = 1
 * @return The created vertices.
 */
export function createCubeVertices({size = 1} = {}): Arrays {
  const k = size / 2;

  const cornerVertices = [
    [-k, -k, -k],
    [+k, -k, -k],
    [-k, +k, -k],
    [+k, +k, -k],
    [-k, -k, +k],
    [+k, -k, +k],
    [-k, +k, +k],
    [+k, +k, +k],
  ];

  const faceNormals = [
    [+1, +0, +0],
    [-1, +0, +0],
    [+0, +1, +0],
    [+0, -1, +0],
    [+0, +0, +1],
    [+0, +0, -1],
  ];

  const uvCoords = [
    [1, 0],
    [0, 0],
    [0, 1],
    [1, 1],
  ];

  const numVertices = 6 * 4;
  const positions = createAugmentedTypedArray(3, numVertices, Float32Array);
  const normals   = createAugmentedTypedArray(3, numVertices, Float32Array);
  const texcoords = createAugmentedTypedArray(2 , numVertices, Float32Array);
  const indices   = createAugmentedTypedArray(3, 6 * 2, Uint16Array);

  for (let f = 0; f < 6; ++f) {
    const faceIndices = CUBE_FACE_INDICES[f];
    for (let v = 0; v < 4; ++v) {
      const position = cornerVertices[faceIndices[v]];
      const normal = faceNormals[f];
      const uv = uvCoords[v];

      // Each face needs all four vertices because the normals and texture
      // coordinates are not all the same.
      positions.push(...position);
      normals.push(...normal);
      texcoords.push(...uv);

    }
    // Two triangles make a square face.
    const offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }

  return {
    position: positions.typedArray,
    normal: normals.typedArray,
    texcoord: texcoords.typedArray,
    indices: indices.typedArray,
  };
}

/**
 * Creates vertices for a truncated cone, which is like a cylinder
 * except that it has different top and bottom radii. A truncated cone
 * can also be used to create cylinders and regular cones. The
 * truncated cone will be created centered about the origin, with the
 * y axis as its vertical axis. .
 *
 * @param bottomRadius Bottom radius of truncated cone. Default = 1
 * @param topRadius Top radius of truncated cone. Default = 0
 * @param height Height of truncated cone. Default = 1
 * @param radialSubdivisions The number of subdivisions around the
 *     truncated cone. Default = 24
 * @param verticalSubdivisions The number of subdivisions down the
 *     truncated cone. Default = 1
 * @param topCap Create top cap. Default = true.
 * @param bottomCap Create bottom cap. Default = true.
 * @return The created cone vertices.
 */
export function createTruncatedConeVertices({
    bottomRadius = 1,
    topRadius = 0,
    height = 1,
    radialSubdivisions = 24,
    verticalSubdivisions = 1,
    topCap = true,
    bottomCap = true,
} = {}): Arrays {
  if (radialSubdivisions < 3) {
    throw new Error('radialSubdivisions must be 3 or greater');
  }

  if (verticalSubdivisions < 1) {
    throw new Error('verticalSubdivisions must be 1 or greater');
  }

  const extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

  const numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
  const positions = createAugmentedTypedArray(3, numVertices, Float32Array);
  const normals   = createAugmentedTypedArray(3, numVertices, Float32Array);
  const texcoords = createAugmentedTypedArray(2, numVertices, Float32Array);
  const indices   = createAugmentedTypedArray(3, radialSubdivisions * (verticalSubdivisions + extra / 2) * 2, Uint16Array);

  const vertsAroundEdge = radialSubdivisions + 1;

  // The slant of the cone is constant across its surface
  const slant = Math.atan2(bottomRadius - topRadius, height);
  const cosSlant = Math.cos(slant);
  const sinSlant = Math.sin(slant);

  const start = topCap ? -2 : 0;
  const end = verticalSubdivisions + (bottomCap ? 2 : 0);

  for (let yy = start; yy <= end; ++yy) {
    let v = yy / verticalSubdivisions;
    let y = height * v;
    let ringRadius;
    if (yy < 0) {
      y = 0;
      v = 1;
      ringRadius = bottomRadius;
    } else if (yy > verticalSubdivisions) {
      y = height;
      v = 1;
      ringRadius = topRadius;
    } else {
      ringRadius = bottomRadius +
        (topRadius - bottomRadius) * (yy / verticalSubdivisions);
    }
    if (yy === -2 || yy === verticalSubdivisions + 2) {
      ringRadius = 0;
      v = 0;
    }
    y -= height / 2;
    for (let ii = 0; ii < vertsAroundEdge; ++ii) {
      const sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
      const cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
      positions.push(sin * ringRadius, y, cos * ringRadius);
      if (yy < 0) {
        normals.push(0, -1, 0);
      } else if (yy > verticalSubdivisions) {
        normals.push(0, 1, 0);
      } else if (ringRadius === 0.0) {
        normals.push(0, 0, 0);
      } else {
        normals.push(sin * cosSlant, sinSlant, cos * cosSlant);
      }
      texcoords.push((ii / radialSubdivisions), 1 - v);
    }
  }

  for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {  // eslint-disable-line
    if (yy === 1 && topCap || yy === verticalSubdivisions + extra - 2 && bottomCap) {
      continue;
    }
    for (let ii = 0; ii < radialSubdivisions; ++ii) {  // eslint-disable-line
      indices.push(vertsAroundEdge * (yy + 0) + 0 + ii,
                   vertsAroundEdge * (yy + 0) + 1 + ii,
                   vertsAroundEdge * (yy + 1) + 1 + ii);
      indices.push(vertsAroundEdge * (yy + 0) + 0 + ii,
                   vertsAroundEdge * (yy + 1) + 1 + ii,
                   vertsAroundEdge * (yy + 1) + 0 + ii);
    }
  }

  return {
    position: positions.typedArray,
    normal: normals.typedArray,
    texcoord: texcoords.typedArray,
    indices: indices.typedArray,
  };
}

/**
 * Expands RLE data
 * @param rleData data in format of run-length, x, y, z, run-length, x, y, z
 * @param padding value to add each entry with.
 * @return the expanded rleData
 */
function expandRLEData(rleData: number[], padding: number[] = []) {
  padding = padding || [];
  const data: number[] = [];
  for (let ii = 0; ii < rleData.length; ii += 4) {
    const runLength = rleData[ii];
    const element = rleData.slice(ii + 1, ii + 4);
    element.push(...padding);
    for (let jj = 0; jj < runLength; ++jj) {
      data.push(...element);
    }
  }
  return data;
}

/**
 * Creates 3D 'F' vertices.
 * An 'F' is useful because you can easily tell which way it is oriented.
 * The created 'F' has position, normal, texcoord, and color arrays.
 *
 * @return The created vertices.
 */
export function create3DFVertices(): Arrays {
  const positions = [
    // left column front
    0,   0,  0,
    0, 150,  0,
    30,   0,  0,
    0, 150,  0,
    30, 150,  0,
    30,   0,  0,

    // top rung front
    30,   0,  0,
    30,  30,  0,
    100,   0,  0,
    30,  30,  0,
    100,  30,  0,
    100,   0,  0,

    // middle rung front
    30,  60,  0,
    30,  90,  0,
    67,  60,  0,
    30,  90,  0,
    67,  90,  0,
    67,  60,  0,

    // left column back
      0,   0,  30,
     30,   0,  30,
      0, 150,  30,
      0, 150,  30,
     30,   0,  30,
     30, 150,  30,

    // top rung back
     30,   0,  30,
    100,   0,  30,
     30,  30,  30,
     30,  30,  30,
    100,   0,  30,
    100,  30,  30,

    // middle rung back
     30,  60,  30,
     67,  60,  30,
     30,  90,  30,
     30,  90,  30,
     67,  60,  30,
     67,  90,  30,

    // top
      0,   0,   0,
    100,   0,   0,
    100,   0,  30,
      0,   0,   0,
    100,   0,  30,
      0,   0,  30,

    // top rung front
    100,   0,   0,
    100,  30,   0,
    100,  30,  30,
    100,   0,   0,
    100,  30,  30,
    100,   0,  30,

    // under top rung
    30,   30,   0,
    30,   30,  30,
    100,  30,  30,
    30,   30,   0,
    100,  30,  30,
    100,  30,   0,

    // between top rung and middle
    30,   30,   0,
    30,   60,  30,
    30,   30,  30,
    30,   30,   0,
    30,   60,   0,
    30,   60,  30,

    // top of middle rung
    30,   60,   0,
    67,   60,  30,
    30,   60,  30,
    30,   60,   0,
    67,   60,   0,
    67,   60,  30,

    // front of middle rung
    67,   60,   0,
    67,   90,  30,
    67,   60,  30,
    67,   60,   0,
    67,   90,   0,
    67,   90,  30,

    // bottom of middle rung.
    30,   90,   0,
    30,   90,  30,
    67,   90,  30,
    30,   90,   0,
    67,   90,  30,
    67,   90,   0,

    // front of bottom
    30,   90,   0,
    30,  150,  30,
    30,   90,  30,
    30,   90,   0,
    30,  150,   0,
    30,  150,  30,

    // bottom
    0,   150,   0,
    0,   150,  30,
    30,  150,  30,
    0,   150,   0,
    30,  150,  30,
    30,  150,   0,

    // left side
    0,   0,   0,
    0,   0,  30,
    0, 150,  30,
    0,   0,   0,
    0, 150,  30,
    0, 150,   0,
  ];

  const texcoords = [
    // left column front
    0.22, 0.19,
    0.22, 0.79,
    0.34, 0.19,
    0.22, 0.79,
    0.34, 0.79,
    0.34, 0.19,

    // top rung front
    0.34, 0.19,
    0.34, 0.31,
    0.62, 0.19,
    0.34, 0.31,
    0.62, 0.31,
    0.62, 0.19,

    // middle rung front
    0.34, 0.43,
    0.34, 0.55,
    0.49, 0.43,
    0.34, 0.55,
    0.49, 0.55,
    0.49, 0.43,

    // left column back
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    // top rung back
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    // middle rung back
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    // top
    0, 0,
    1, 0,
    1, 1,
    0, 0,
    1, 1,
    0, 1,

    // top rung front
    0, 0,
    1, 0,
    1, 1,
    0, 0,
    1, 1,
    0, 1,

    // under top rung
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,

    // between top rung and middle
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // top of middle rung
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // front of middle rung
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // bottom of middle rung.
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,

    // front of bottom
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // bottom
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,

    // left side
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,
  ];

  const normals = expandRLEData([
    // left column front
    // top rung front
    // middle rung front
    18, 0, 0, 1,

    // left column back
    // top rung back
    // middle rung back
    18, 0, 0, -1,

    // top
    6, 0, 1, 0,

    // top rung front
    6, 1, 0, 0,

    // under top rung
    6, 0, -1, 0,

    // between top rung and middle
    6, 1, 0, 0,

    // top of middle rung
    6, 0, 1, 0,

    // front of middle rung
    6, 1, 0, 0,

    // bottom of middle rung.
    6, 0, -1, 0,

    // front of bottom
    6, 1, 0, 0,

    // bottom
    6, 0, -1, 0,

    // left side
    6, -1, 0, 0,
  ]);

  const colors = expandRLEData([
        // left column front
        // top rung front
        // middle rung front
      18, 200,  70, 120,

        // left column back
        // top rung back
        // middle rung back
      18, 80, 70, 200,

        // top
      6, 70, 200, 210,

        // top rung front
      6, 200, 200, 70,

        // under top rung
      6, 210, 100, 70,

        // between top rung and middle
      6, 210, 160, 70,

        // top of middle rung
      6, 70, 180, 210,

        // front of middle rung
      6, 100, 70, 210,

        // bottom of middle rung.
      6, 76, 210, 100,

        // front of bottom
      6, 140, 210, 80,

        // bottom
      6, 90, 130, 110,

        // left side
      6, 160, 160, 220,
  ], [255]);

  const numVerts = positions.length / 3;

  const arrays = {
    position: createAugmentedTypedArray(3, numVerts, Float32Array),
    texcoord: createAugmentedTypedArray(2,  numVerts, Float32Array),
    normal: createAugmentedTypedArray(3, numVerts, Float32Array),
    color: createAugmentedTypedArray(4, numVerts, Uint8Array),
    indices: createAugmentedTypedArray(3, numVerts / 3, Uint16Array),
  };

  arrays.position.push(positions);
  arrays.texcoord.push(texcoords);
  arrays.normal.push(normals);
  arrays.color.push(colors);

  for (let ii = 0; ii < numVerts; ++ii) {
    arrays.indices.push(ii);
  }

  return Object.fromEntries(Object.entries(arrays).map(([k, v]) => [k, v.typedArray]));
}

 /**
  * Creates cylinder vertices. The cylinder will be created around the origin
  * along the y-axis.
  *
  * @param params
  * @param params.radius Radius of cylinder. Default = 1
  * @param params.height Height of cylinder. Default = 1
  * @param params.radialSubdivisions The number of subdivisions around the cylinder. Default = 24
  * @param params.verticalSubdivisions The number of subdivisions down the cylinder. Default = 1
  * @param params.topCap Create top cap. Default = true.
  * @param params.bottomCap Create bottom cap. Default = true.
  * @return The created vertices.
  */
export function createCylinderVertices({
    radius = 1,
    height = 1,
    radialSubdivisions = 24,
    verticalSubdivisions = 1,
    topCap = true,
    bottomCap = true,
} = {}): Arrays {
  return createTruncatedConeVertices({
      bottomRadius: radius,
      topRadius: radius,
      height,
      radialSubdivisions,
      verticalSubdivisions,
      topCap,
      bottomCap,
  });
}

/**
 * Creates vertices for a torus
 *
 * @param params
 * @param params.radius radius of center of torus circle. Default = 1
 * @param params.thickness radius of torus ring. Default = 0.24
 * @param params.radialSubdivisions The number of subdivisions around the torus. Default = 24
 * @param params.bodySubdivisions The number of subdivisions around the body torus. Default = 12
 * @param params.startAngle start angle in radians. Default = 0.
 * @param params.endAngle end angle in radians. Default = Math.PI * 2.
 * @return The created vertices.
 */
export function createTorusVertices({
    radius = 1,
    thickness = 0.24,
    radialSubdivisions = 24,
    bodySubdivisions = 12,
    startAngle = 0,
    endAngle = Math.PI * 2,
} = {}): Arrays {
  if (radialSubdivisions < 3) {
    throw new Error('radialSubdivisions must be 3 or greater');
  }

  if (bodySubdivisions < 3) {
    throw new Error('verticalSubdivisions must be 3 or greater');
  }
  const range = endAngle - startAngle;

  const radialParts = radialSubdivisions + 1;
  const bodyParts   = bodySubdivisions + 1;
  const numVertices = radialParts * bodyParts;
  const positions   = createAugmentedTypedArray(3, numVertices, Float32Array);
  const normals     = createAugmentedTypedArray(3, numVertices, Float32Array);
  const texcoords   = createAugmentedTypedArray(2, numVertices, Float32Array);
  const indices     = createAugmentedTypedArray(3, (radialSubdivisions) * (bodySubdivisions) * 2, Uint16Array);

  for (let slice = 0; slice < bodyParts; ++slice) {
    const v = slice / bodySubdivisions;
    const sliceAngle = v * Math.PI * 2;
    const sliceSin = Math.sin(sliceAngle);
    const ringRadius = radius + sliceSin * thickness;
    const ny = Math.cos(sliceAngle);
    const y = ny * thickness;
    for (let ring = 0; ring < radialParts; ++ring) {
      const u = ring / radialSubdivisions;
      const ringAngle = startAngle + u * range;
      const xSin = Math.sin(ringAngle);
      const zCos = Math.cos(ringAngle);
      const x = xSin * ringRadius;
      const z = zCos * ringRadius;
      const nx = xSin * sliceSin;
      const nz = zCos * sliceSin;
      positions.push(x, y, z);
      normals.push(nx, ny, nz);
      texcoords.push(u, 1 - v);
    }
  }

  for (let slice = 0; slice < bodySubdivisions; ++slice) {  // eslint-disable-line
    for (let ring = 0; ring < radialSubdivisions; ++ring) {  // eslint-disable-line
      const nextRingIndex  = 1 + ring;
      const nextSliceIndex = 1 + slice;
      indices.push(radialParts * slice          + ring,
                   radialParts * nextSliceIndex + ring,
                   radialParts * slice          + nextRingIndex);
      indices.push(radialParts * nextSliceIndex + ring,
                   radialParts * nextSliceIndex + nextRingIndex,
                   radialParts * slice          + nextRingIndex);
    }
  }

  return {
    position: positions.typedArray,
    normal:   normals.typedArray,
    texcoord: texcoords.typedArray,
    indices:  indices.typedArray,
  };
}

/**
 * Creates disc vertices. The disc will be in the xz plane, centered at
 * the origin. When creating, at least 3 divisions, or pie
 * pieces, need to be specified, otherwise the triangles making
 * up the disc will be degenerate. You can also specify the
 * number of radial pieces `stacks`. A value of 1 for
 * stacks will give you a simple disc of pie pieces.  If you
 * want to create an annulus you can set `innerRadius` to a
 * value > 0. Finally, `stackPower` allows you to have the widths
 * increase or decrease as you move away from the center. This
 * is particularly useful when using the disc as a ground plane
 * with a fixed camera such that you don't need the resolution
 * of small triangles near the perimeter. For example, a value
 * of 2 will produce stacks whose outside radius increases with
 * the square of the stack index. A value of 1 will give uniform
 * stacks.
 *
 * @param params
 * @param params.radius Radius of the ground plane. Default = 1
 * @param params.divisions Number of triangles in the ground plane (at least 3). Default = 24
 * @param params.stacks Number of radial divisions. Default = 1
 * @param params.innerRadius Default = 0
 * @param params.stackPower Power to raise stack size to for decreasing width. Default = 1
 * @return The created vertices.
 */
export function createDiscVertices({
    radius = 1,
    divisions = 24,
    stacks = 1,
    innerRadius = 0,
    stackPower = 1,
} = {}): Arrays {
  if (divisions < 3) {
    throw new Error('divisions must be at least 3');
  }

  // Note: We don't share the center vertex because that would
  // mess up texture coordinates.
  const numVertices = (divisions + 1) * (stacks + 1);

  const positions = createAugmentedTypedArray(3, numVertices, Float32Array);
  const normals   = createAugmentedTypedArray(3, numVertices, Float32Array);
  const texcoords = createAugmentedTypedArray(2, numVertices, Float32Array);
  const indices   = createAugmentedTypedArray(3, stacks * divisions * 2, Uint16Array);

  let firstIndex = 0;
  const radiusSpan = radius - innerRadius;
  const pointsPerStack = divisions + 1;

  // Build the disk one stack at a time.
  for (let stack = 0; stack <= stacks; ++stack) {
    const stackRadius = innerRadius + radiusSpan * Math.pow(stack / stacks, stackPower);

    for (let i = 0; i <= divisions; ++i) {
      const theta = 2.0 * Math.PI * i / divisions;
      const x = stackRadius * Math.cos(theta);
      const z = stackRadius * Math.sin(theta);

      positions.push(x, 0, z);
      normals.push(0, 1, 0);
      texcoords.push(1 - (i / divisions), stack / stacks);
      if (stack > 0 && i !== divisions) {
        // a, b, c and d are the indices of the vertices of a quad.  unless
        // the current stack is the one closest to the center, in which case
        // the vertices a and b connect to the center vertex.
        const a = firstIndex + (i + 1);
        const b = firstIndex + i;
        const c = firstIndex + i - pointsPerStack;
        const d = firstIndex + (i + 1) - pointsPerStack;

        // Make a quad of the vertices a, b, c, d.
        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    }

    firstIndex += divisions + 1;
  }

  return {
    position: positions.typedArray,
    normal: normals.typedArray,
    texcoord: texcoords.typedArray,
    indices: indices.typedArray,
  };
}

function allButIndices(name: string) {
  return name !== "indices";
}

/**
 * Given indexed vertices creates a new set of vertices un-indexed by expanding the vertices by index.
 */
export function deindex(arrays: Arrays): Arrays {
  const indicesP = arrays.indices;
  const newVertices: Arrays = {};
  const indices = makeTypedArrayFromArrayUnion(indicesP, 'indices');
  const numElements = indices.length;

  function expandToUnindexed(channel: string) {
    const srcBuffer = makeTypedArrayFromArrayUnion(arrays[channel], channel);
    const numComponents = getNumComponents(srcBuffer, channel);
    const dstBuffer = createAugmentedTypedArrayFromExisting(numComponents, numElements, srcBuffer);
    for (let ii = 0; ii < numElements; ++ii) {
      const ndx = indices[ii];
      const offset = ndx * numComponents;
      for (let jj = 0; jj < numComponents; ++jj) {
        dstBuffer.push(srcBuffer[offset + jj]);
      }
    }
    newVertices[channel] = dstBuffer.typedArray;
  }

  Object.keys(arrays).filter(allButIndices).forEach(expandToUnindexed);

  return newVertices;
}

// I don't want to pull in a whole math library
const normalize = ([x, y, z]: Float32Array) => {
  const len = x * x + y * y + z * z;
  return new Float32Array([x / len, y / len, z / len]);
};

const subtract = (a: Float32Array, b: Float32Array) => {
  const r = new Float32Array(a.length);
  for (let i = 0; i < a.length; ++i) {
    r[i] = a[i] - b[i];
  }
  return r;
};

const cross = (a: Float32Array, b: Float32Array) => {
  const r = new Float32Array(a.length);

  r[0] = a[1] * b[2] - a[2] * b[1];
  r[1] = a[2] * b[0] - a[0] * b[2];
  r[2] = a[0] * b[1] - a[1] * b[0];

  return r;
};

/**
 * Generate triangle normals from positions.
 * Assumes every 3 values is a position and every 3 positions come from the same triangle
 */
export function generateTriangleNormals(positions: Float32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let ii = 0; ii < positions.length; ii += 9) {
    // pull out the 3 positions for this triangle
    const p0 = positions.subarray(ii    , ii + 3);
    const p1 = positions.subarray(ii + 3, ii + 6);
    const p2 = positions.subarray(ii + 6, ii + 9);

    const n0 = normalize(subtract(p0, p1));
    const n1 = normalize(subtract(p0, p2));
    const n = cross(n0, n1);

    // copy them back in
    normals.set(n, ii);
    normals.set(n, ii + 3);
    normals.set(n, ii + 6);
  }

  return normals;
}

