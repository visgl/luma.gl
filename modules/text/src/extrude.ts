// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js ExtrudeGeometry (https://github.com/mrdoob/three.js/) under the MIT License.

import {Vector2, Vector3} from '@math.gl/core'
import {Shape} from './paths/path.ts'
import {ShapeUtils} from './paths/shape-utils.ts'

/** Options for extruding 2D shapes into 3D meshes. */
export type ExtrudeOptions = {
  /** Number of curve subdivisions for each path segment. */
  curveSegments?: number
  /** Number of vertical extrusion steps between front and back faces. */
  steps?: number
  /** Depth of the extrusion along the z axis. */
  depth?: number
  /** Indicates whether bevel geometry should be generated. */
  bevelEnabled?: boolean
  /** Thickness of the bevel offset from the shape contour. */
  bevelThickness?: number
  /** Size of the bevel relative to the contour. */
  bevelSize?: number
  /** Offset applied to bevel sizing calculations. */
  bevelOffset?: number
  /** Number of subdivisions used to smooth the bevel. */
  bevelSegments?: number
}

/** Buffer attributes generated from an extruded shape. */
export type ExtrudedAttributes = {
  /** Packed vertex positions for the extruded mesh. */
  positions: Float32Array
  /** Packed vertex normals for the extruded mesh. */
  normals: Float32Array
  /** Packed UV coordinates for the extruded mesh. */
  uvs: Float32Array
}

/**
 * Extrudes one or more shapes into position, normal, and UV attribute buffers.
 */
export function extrudeShapes(shapes: Shape | Shape[], options: ExtrudeOptions = {}): ExtrudedAttributes {
  const verticesArray: number[] = []
  const uvArray: number[] = []
  const shapeList = Array.isArray(shapes) ? shapes : [shapes]

  for (const shape of shapeList) {
    addShape(shape, options, verticesArray, uvArray)
  }

  const normals = computeVertexNormals(verticesArray)

  return {
    positions: new Float32Array(verticesArray),
    normals,
    uvs: new Float32Array(uvArray)
  }
}

/** Adds a single shape's extruded geometry to the accumulating buffers. */
function addShape(shape: Shape, options: ExtrudeOptions, verticesArray: number[], uvArray: number[]): void {
  const placeholder: number[] = []

  const curveSegments = options.curveSegments ?? 12
  const steps = options.steps ?? 1
  const depth = options.depth ?? 1

  const bevelEnabled = options.bevelEnabled ?? false
  let bevelThickness = options.bevelThickness ?? 0.2
  let bevelSize = options.bevelSize ?? bevelThickness - 0.1
  let bevelOffset = options.bevelOffset ?? 0
  let bevelSegments = options.bevelSegments ?? 3

  const uvGenerator = WorldUVGenerator

  if (!bevelEnabled) {
    bevelSegments = 0
    bevelThickness = 0
    bevelSize = 0
    bevelOffset = 0
  }

  const shapePoints = shape.extractPoints(curveSegments)
  let vertices = shapePoints.shape
  const holes = shapePoints.holes

  const reverse = !ShapeUtils.isClockWise(vertices)
  if (reverse) {
    vertices = vertices.reverse()
    for (let h = 0; h < holes.length; h++) {
      if (ShapeUtils.isClockWise(holes[h])) {
        holes[h] = holes[h].reverse()
      }
    }
  }

  const faces = ShapeUtils.triangulateShape(vertices, holes)
  const contour = vertices
  for (const hole of holes) {
    vertices = vertices.concat(hole)
  }

  const vlen = vertices.length
  const flen = faces.length

  /** Scales a contour point around an offset for beveling. */
  function scalePoint(point: Vector2, offset: Vector2, scale: number): Vector2 {
    return point.clone().addScaledVector(offset, scale)
  }

  /** Computes the bevel translation vector for the given contour point. */
  function getBevelVector(point: Vector2, previousPoint: Vector2, nextPoint: Vector2): Vector2 {
    const previousOffsetX = point.x - previousPoint.x
    const previousOffsetY = point.y - previousPoint.y
    const nextOffsetX = nextPoint.x - point.x
    const nextOffsetY = nextPoint.y - point.y

    let translationX: number
    let translationY: number
    let shrinkBy: number

    const collinear = previousOffsetX * nextOffsetY - previousOffsetY * nextOffsetX
    if (Math.abs(collinear) > Number.EPSILON) {
      const previousLength = Math.sqrt(previousOffsetX * previousOffsetX + previousOffsetY * previousOffsetY)
      const nextLength = Math.sqrt(nextOffsetX * nextOffsetX + nextOffsetY * nextOffsetY)

      const previousShiftX = previousPoint.x - previousOffsetY / previousLength
      const previousShiftY = previousPoint.y + previousOffsetX / previousLength
      const nextShiftX = nextPoint.x - nextOffsetY / nextLength
      const nextShiftY = nextPoint.y + nextOffsetX / nextLength

      const scaleFactor =
        ((nextShiftX - previousShiftX) * nextOffsetY - (nextShiftY - previousShiftY) * nextOffsetX) /
        (previousOffsetX * nextOffsetY - previousOffsetY * nextOffsetX)

      translationX = previousShiftX + previousOffsetX * scaleFactor - point.x
      translationY = previousShiftY + previousOffsetY * scaleFactor - point.y

      const translationLengthSq = translationX * translationX + translationY * translationY
      if (translationLengthSq <= 2) {
        return new Vector2(translationX, translationY)
      }
      shrinkBy = Math.sqrt(translationLengthSq / 2)
    } else {
      let directionMatches = false
      if (previousOffsetX > Number.EPSILON) {
        if (nextOffsetX > Number.EPSILON) {
          directionMatches = true
        }
      } else if (previousOffsetX < -Number.EPSILON) {
        if (nextOffsetX < -Number.EPSILON) {
          directionMatches = true
        }
      } else if (Math.sign(previousOffsetY) === Math.sign(nextOffsetY)) {
        directionMatches = true
      }

      if (directionMatches) {
        translationX = -previousOffsetY
        translationY = previousOffsetX
        shrinkBy = Math.sqrt(previousOffsetX * previousOffsetX + previousOffsetY * previousOffsetY)
      } else {
        translationX = previousOffsetX
        translationY = previousOffsetY
        shrinkBy = Math.sqrt((previousOffsetX * previousOffsetX + previousOffsetY * previousOffsetY) / 2)
      }
    }

    return new Vector2(translationX / shrinkBy, translationY / shrinkBy)
  }

  const contourMovements: Vector2[] = []
  for (let i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {
    if (j === il) {
      j = 0
    }
    if (k === il) {
      k = 0
    }
    contourMovements[i] = getBevelVector(contour[i], contour[j], contour[k])
  }

  const holesMovements: Vector2[][] = []
  let combinedMovements = contourMovements.concat()
  for (let h = 0, hl = holes.length; h < hl; h++) {
    const hole = holes[h]
    const movement: Vector2[] = []
    for (let i = 0, il = hole.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {
      if (j === il) {
        j = 0
      }
      if (k === il) {
        k = 0
      }
      movement[i] = getBevelVector(hole[i], hole[j], hole[k])
    }
    holesMovements.push(movement)
    combinedMovements = combinedMovements.concat(movement)
  }

  for (let b = 0; b < bevelSegments; b++) {
    const t = b / bevelSegments
    const z = bevelThickness * Math.cos((t * Math.PI) / 2)
    const size = bevelSize * Math.sin((t * Math.PI) / 2) + bevelOffset

    for (let i = 0, il = contour.length; i < il; i++) {
      const vertex = scalePoint(contour[i], contourMovements[i], size)
      v(vertex.x, vertex.y, -z, placeholder)
    }

    for (let h = 0, hl = holes.length; h < hl; h++) {
      const hole = holes[h]
      const movement = holesMovements[h]
      for (let i = 0, il = hole.length; i < il; i++) {
        const vertex = scalePoint(hole[i], movement[i], size)
        v(vertex.x, vertex.y, -z, placeholder)
      }
    }
  }

  const baseSize = bevelSize + bevelOffset
  for (let i = 0; i < vlen; i++) {
    const vertex = bevelEnabled ? scalePoint(vertices[i], combinedMovements[i], baseSize) : vertices[i]
    v(vertex.x, vertex.y, 0, placeholder)
  }

  for (let s = 1; s <= steps; s++) {
    for (let i = 0; i < vlen; i++) {
      const vertex = bevelEnabled ? scalePoint(vertices[i], combinedMovements[i], baseSize) : vertices[i]
      v(vertex.x, vertex.y, (depth / steps) * s, placeholder)
    }
  }

  for (let b = bevelSegments - 1; b >= 0; b--) {
    const t = b / bevelSegments
    const z = bevelThickness * Math.cos((t * Math.PI) / 2)
    const size = bevelSize * Math.sin((t * Math.PI) / 2) + bevelOffset

    for (let i = 0, il = contour.length; i < il; i++) {
      const vertex = scalePoint(contour[i], contourMovements[i], size)
      v(vertex.x, vertex.y, depth + z, placeholder)
    }

    for (let h = 0, hl = holes.length; h < hl; h++) {
      const hole = holes[h]
      const movement = holesMovements[h]
      for (let i = 0, il = hole.length; i < il; i++) {
        const vertex = scalePoint(hole[i], movement[i], size)
        v(vertex.x, vertex.y, depth + z, placeholder)
      }
    }
  }

  buildLidFaces()
  buildSideFaces()

  /** Builds faces for the front and back lids of the extruded mesh. */
  function buildLidFaces() {
    if (bevelEnabled) {
      let layer = 0
      let offset = vlen * layer
      for (let i = 0; i < flen; i++) {
        const face = faces[i]
        f3(face[2] + offset, face[1] + offset, face[0] + offset)
      }

      layer = steps + bevelSegments * 2
      offset = vlen * layer
      for (let i = 0; i < flen; i++) {
        const face = faces[i]
        f3(face[0] + offset, face[1] + offset, face[2] + offset)
      }
    } else {
      for (let i = 0; i < flen; i++) {
        const face = faces[i]
        f3(face[2], face[1], face[0])
      }
      for (let i = 0; i < flen; i++) {
        const face = faces[i]
        f3(face[0] + vlen * steps, face[1] + vlen * steps, face[2] + vlen * steps)
      }
    }
  }

  /** Builds the side faces connecting the front and back contours. */
  function buildSideFaces() {
    let layerOffset = 0
    sidewalls(contour, layerOffset)
    layerOffset += contour.length

    for (let h = 0, hl = holes.length; h < hl; h++) {
      const hole = holes[h]
      sidewalls(hole, layerOffset)
      layerOffset += hole.length
    }
  }

  /** Creates triangles for the sidewalls between two contour layers. */
  function sidewalls(contourPoints: Vector2[], layerOffset: number) {
    let i = contourPoints.length
    while (--i >= 0) {
      const j = i
      let k = i - 1
      if (k < 0) {
        k = contourPoints.length - 1
      }

      for (let s = 0, sl = steps + bevelSegments * 2; s < sl; s++) {
        const firstLayer = vlen * s
        const secondLayer = vlen * (s + 1)

        const a = layerOffset + j + firstLayer
        const b = layerOffset + k + firstLayer
        const c = layerOffset + k + secondLayer
        const d = layerOffset + j + secondLayer

        f4(a, b, c, d)
      }
    }
  }

  /** Pushes a vertex with the provided coordinates into the buffer. */
  function v(x: number, y: number, z: number, target: number[]) {
    target.push(x, y, z)
  }

  /** Stores a single triangle using three indices. */
  function f3(a: number, b: number, c: number) {
    addVertex(a)
    addVertex(b)
    addVertex(c)

    const nextIndex = verticesArray.length / 3
    const uvs = uvGenerator.generateTopUV(verticesArray, nextIndex - 3, nextIndex - 2, nextIndex - 1)

    addUV(uvs[0])
    addUV(uvs[1])
    addUV(uvs[2])
  }

  /** Stores two triangles representing a quad face. */
  function f4(a: number, b: number, c: number, d: number) {
    addVertex(a)
    addVertex(b)
    addVertex(d)

    addVertex(b)
    addVertex(c)
    addVertex(d)

    const nextIndex = verticesArray.length / 3
    const uvs = uvGenerator.generateSideWallUV(verticesArray, nextIndex - 6, nextIndex - 3, nextIndex - 2, nextIndex - 1)

    addUV(uvs[0])
    addUV(uvs[1])
    addUV(uvs[3])

    addUV(uvs[1])
    addUV(uvs[2])
    addUV(uvs[3])
  }

  /** Copies a contour vertex into the bevel buffer. */
  function addVertex(index: number) {
    verticesArray.push(placeholder[index * 3 + 0], placeholder[index * 3 + 1], placeholder[index * 3 + 2])
  }

  /** Pushes a UV coordinate derived from the provided point. */
  function addUV(vector: Vector2) {
    uvArray.push(vector.x, vector.y)
  }
}

/** Provides UV generation helpers for extruded meshes. */
const WorldUVGenerator = {
  /** Calculates UVs for the top or bottom face of the mesh. */
  generateTopUV(vertices: number[], indexA: number, indexB: number, indexC: number): Vector2[] {
    const ax = vertices[indexA * 3]
    const ay = vertices[indexA * 3 + 1]
    const bx = vertices[indexB * 3]
    const by = vertices[indexB * 3 + 1]
    const cx = vertices[indexC * 3]
    const cy = vertices[indexC * 3 + 1]

    return [new Vector2(ax, ay), new Vector2(bx, by), new Vector2(cx, cy)]
  },

  /** Calculates UVs for a sidewall quad face. */
  generateSideWallUV(vertices: number[], indexA: number, indexB: number, indexC: number, indexD: number): Vector2[] {
    const ax = vertices[indexA * 3]
    const ay = vertices[indexA * 3 + 1]
    const az = vertices[indexA * 3 + 2]
    const bx = vertices[indexB * 3]
    const by = vertices[indexB * 3 + 1]
    const bz = vertices[indexB * 3 + 2]
    const cx = vertices[indexC * 3]
    const cy = vertices[indexC * 3 + 1]
    const cz = vertices[indexC * 3 + 2]
    const dx = vertices[indexD * 3]
    const dy = vertices[indexD * 3 + 1]
    const dz = vertices[indexD * 3 + 2]

    if (Math.abs(ay - by) < Math.abs(ax - bx)) {
      return [new Vector2(ax, 1 - az), new Vector2(bx, 1 - bz), new Vector2(cx, 1 - cz), new Vector2(dx, 1 - dz)]
    }

    return [new Vector2(ay, 1 - az), new Vector2(by, 1 - bz), new Vector2(cy, 1 - cz), new Vector2(dy, 1 - dz)]
  }
}

/** Derives per-vertex normals from a flat position array. */
function computeVertexNormals(positions: number[]): Float32Array {
  const normals = new Float32Array(positions.length)
  const vectorAB = new Vector3()
  const vectorAC = new Vector3()
  const normal = new Vector3()

  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i]
    const ay = positions[i + 1]
    const az = positions[i + 2]
    const bx = positions[i + 3]
    const by = positions[i + 4]
    const bz = positions[i + 5]
    const cx = positions[i + 6]
    const cy = positions[i + 7]
    const cz = positions[i + 8]

    vectorAB.set(bx - ax, by - ay, bz - az)
    vectorAC.set(cx - ax, cy - ay, cz - az)
    normal.crossVectors(vectorAB, vectorAC).normalize()

    normals[i] = normal.x
    normals[i + 1] = normal.y
    normals[i + 2] = normal.z
    normals[i + 3] = normal.x
    normals[i + 4] = normal.y
    normals[i + 5] = normal.z
    normals[i + 6] = normal.x
    normals[i + 7] = normal.y
    normals[i + 8] = normal.z
  }

  return normals
}
