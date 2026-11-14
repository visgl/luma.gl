// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {Matrix4, Vector3} from '@math.gl/core';
import {Geometry, type GeometryAttribute} from '../geometry/geometry';

export type LightmapAtlasInput = {
  /** Stable application-owned identity; unique within an atlas. */
  id: string;
  geometry: Geometry;
  /** Used only to measure world-space texel density. Output positions stay in object space. */
  modelMatrix?: Matrix4;
};
export type LightmapAtlasOptions = {
  width: number;
  height: number;
  texelsPerUnit: number;
  padding?: number;
  uvSet?: 0 | 1;
  /** Join consecutive coplanar triangles that form a quad. */
  mergeCoplanarPairs?: boolean;
};
export type LightmapAtlasChart = {
  id: number;
  meshId: string;
  firstVertex: number;
  vertexCount: number;
  /** Integer pixel rectangle including padding, measured from the atlas top left. */
  rectangle: {x: number; y: number; width: number; height: number};
  worldArea: number;
};
export type LightmapAtlas = Required<Omit<LightmapAtlasOptions, 'mergeCoplanarPairs'>> & {
  meshes: {id: string; geometry: Geometry}[];
  charts: LightmapAtlasChart[];
  /** Independent row-major r32float data, suitable for LightmapBaker chartTexture. Zero is unused. */
  chartOwners: Float32Array;
  /** Fraction of atlas pixels reserved by chart rectangles, including gutters. */
  occupancy: number;
};
type PendingChart = LightmapAtlasChart & {coordinates: number[]; meshIndex: number};

/**
 * Prepare an independent CPU atlas. Each triangle receives a planar chart; no seam heuristics,
 * GPU allocation, texture upload, submission, or source mutation occurs here.
 */
export function createLightmapAtlas(
  inputs: readonly LightmapAtlasInput[],
  options: LightmapAtlasOptions
): LightmapAtlas {
  const {width, height, texelsPerUnit, padding = 2, uvSet = 1} = options;
  // Dimensions, density and gutters must be explicit and finite. Chart IDs stay exact in float16.
  assert(Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0);
  assert(Number.isFinite(texelsPerUnit) && texelsPerUnit > 0);
  assert(Number.isInteger(padding) && padding >= 0 && padding <= 16);
  assert(uvSet === 0 || uvSet === 1);
  assert(new Set(inputs.map(input => input.id)).size === inputs.length);
  const charts: PendingChart[] = [];
  const meshes = inputs.map((input, meshIndex) => {
    const source = input.geometry;
    const positions = source.attributes['POSITION'];
    // Only tightly packed, per-vertex triangle-list attributes are supported.
    assert(source.topology === 'triangle-list' && positions?.size === 3 && !positions.normalized);
    const indices = source.indices?.value;
    const vertexCount = source.vertexCount;
    assert(!indices || vertexCount <= indices.length);
    assert(vertexCount > 0 && vertexCount % 3 === 0);
    const attributes: Record<string, GeometryAttribute> = {};
    for (const [name, attribute] of Object.entries(source.attributes)) {
      const {size, value} = attribute;
      assert(
        size &&
          !attribute.constant &&
          value.length === (positions.value.length / 3) * size &&
          !attribute['byteStride'] &&
          !attribute['byteOffset'] &&
          !attribute['divisor']
      );
      const copied = value.slice(0, 0);
      // Keep the original numeric storage type, including normalized integer attributes.
      const expanded = new (copied.constructor as typeof Float32Array)(vertexCount * size);
      for (let vertex = 0; vertex < vertexCount; vertex++) {
        const sourceVertex = indices ? indices[vertex] : vertex;
        assert(
          Number.isInteger(sourceVertex) && sourceVertex >= 0 && sourceVertex < value.length / size
        );
        for (let component = 0; component < size; component++)
          expanded[vertex * size + component] = value[sourceVertex * size + component];
      }
      attributes[name] = {...attribute, value: expanded};
    }
    const coordinates = new Float32Array(vertexCount * 2);
    attributes[`TEXCOORD_${uvSet}`] = {size: 2, value: coordinates};
    const matrix = input.modelMatrix ?? new Matrix4();
    // Affine transforms only; a projective matrix has no uniform world-space density.
    assert(
      matrix.every(Number.isFinite) &&
        matrix[3] === 0 &&
        matrix[7] === 0 &&
        matrix[11] === 0 &&
        matrix[15] === 1
    );
    const getPoints = (firstVertex: number) =>
      [0, 1, 2].map(offset => {
        const vertex = indices ? indices[firstVertex + offset] : firstVertex + offset;
        const point = new Vector3(positions.value.slice(vertex * 3, vertex * 3 + 3));
        assert(point.every(Number.isFinite));
        return point.transformAsPoint(matrix);
      });
    for (let firstVertex = 0; firstVertex < vertexCount; ) {
      const points = getPoints(firstVertex);
      const edges = points.map((point, index) =>
        new Vector3(points[(index + 1) % 3]).subtract(point)
      );
      const lengths = edges.map(edge => edge.len());
      const start = lengths.indexOf(Math.max(...lengths));
      const end = (start + 1) % 3;
      const third = (start + 2) % 3;
      const horizontal = edges[start].clone().normalize();
      const relative = new Vector3(points[third]).subtract(points[start]);
      const projected = relative.dot(horizontal);
      const altitude = new Vector3(edges[start]).cross(relative).len() / lengths[start];
      // Degenerate transformed triangles cannot receive lightmap samples.
      assert(Number.isFinite(altitude) && altitude > 0 && lengths[start] > 0);
      const local = new Array<number>(6).fill(0);
      local[end * 2] = lengths[start] * texelsPerUnit;
      local[third * 2] = projected * texelsPerUnit;
      local[third * 2 + 1] = altitude * texelsPerUnit;
      let worldArea = (lengths[start] * altitude) / 2;
      if (options.mergeCoplanarPairs && firstVertex + 6 <= vertexCount) {
        const second = getPoints(firstVertex + 3);
        const shared = second.map(point =>
          points.findIndex(candidate =>
            candidate.every((component, index) => component === point[index])
          )
        );
        if (shared.filter(index => index >= 0).length === 2 && new Set(shared).size === 3) {
          const normal = edges[start].clone().cross(relative).normalize();
          const vertical = normal.clone().cross(horizontal);
          const opposite = shared.indexOf(-1);
          const delta = second[opposite].clone().subtract(points[start]);
          const projectedPoint = [delta.dot(horizontal), delta.dot(vertical)];
          const [sharedFirst, sharedSecond] = shared.filter(index => index >= 0);
          const unshared = [0, 1, 2].find(index => !shared.includes(index))!;
          const side = (x: number, y: number) =>
            (local[sharedSecond * 2] - local[sharedFirst * 2]) * (y - local[sharedFirst * 2 + 1]) -
            (local[sharedSecond * 2 + 1] - local[sharedFirst * 2 + 1]) *
              (x - local[sharedFirst * 2]);
          const secondArea = second[1]
            .clone()
            .subtract(second[0])
            .cross(second[2].clone().subtract(second[0]));
          if (
            Math.abs(delta.dot(normal)) <= 1e-7 * delta.len() &&
            secondArea.dot(normal) > 0 &&
            side(local[unshared * 2], local[unshared * 2 + 1]) *
              side(projectedPoint[0] * texelsPerUnit, projectedPoint[1] * texelsPerUnit) <
              0
          ) {
            for (const index of shared) {
              if (index >= 0) local.push(local[index * 2], local[index * 2 + 1]);
              else local.push(projectedPoint[0] * texelsPerUnit, projectedPoint[1] * texelsPerUnit);
            }
            worldArea += secondArea.len() / 2;
          }
        }
      }
      const horizontalCoordinates = local.filter((_, index) => index % 2 === 0);
      const verticalCoordinates = local.filter((_, index) => index % 2 === 1);
      const chartVertexCount = local.length / 2;
      const minimumX = chartVertexCount === 3 ? 0 : Math.min(...horizontalCoordinates);
      const minimumY = chartVertexCount === 3 ? 0 : Math.min(...verticalCoordinates);
      charts.push({
        id: charts.length + 1,
        meshId: input.id,
        meshIndex,
        firstVertex,
        vertexCount: chartVertexCount,
        rectangle: {
          x: 0,
          y: 0,
          width:
            Math.ceil(
              chartVertexCount === 3
                ? lengths[start] * texelsPerUnit
                : Math.max(...horizontalCoordinates) - minimumX
            ) +
            1 +
            padding * 2,
          height: Math.ceil(Math.max(...verticalCoordinates) - minimumY) + 1 + padding * 2
        },
        worldArea,
        coordinates: local.map((value, index) => value - (index % 2 ? minimumY : minimumX))
      });
      firstVertex += chartVertexCount;
    }
    return {
      id: input.id,
      geometry: new Geometry({
        id: `${source.id}-lightmap`,
        topology: 'triangle-list',
        vertexCount,
        attributes
      })
    };
  });
  // Positive integer chart IDs must survive the default rgba16float bake target exactly.
  assert(charts.length <= 2048);
  let cursorX = 0;
  let cursorY = 0;
  let shelfHeight = 0;
  let allocatedPixels = 0;
  for (const chart of [...charts].sort(
    (left, right) =>
      right.rectangle.height - left.rectangle.height ||
      right.rectangle.width - left.rectangle.width ||
      left.id - right.id
  )) {
    const rectangle = chart.rectangle;
    if (cursorX + rectangle.width > width) {
      cursorX = 0;
      cursorY += shelfHeight;
      shelfHeight = 0;
    }
    // Packing never silently changes density. Increase dimensions or lower texelsPerUnit.
    assert(rectangle.width <= width && cursorY + rectangle.height <= height);
    rectangle.x = cursorX;
    rectangle.y = cursorY;
    cursorX += rectangle.width;
    shelfHeight = Math.max(shelfHeight, rectangle.height);
    allocatedPixels += rectangle.width * rectangle.height;
    const coordinates = meshes[chart.meshIndex].geometry.attributes[`TEXCOORD_${uvSet}`].value;
    for (let vertex = 0; vertex < chart.vertexCount; vertex++) {
      coordinates[(chart.firstVertex + vertex) * 2] =
        (rectangle.x + padding + 0.5 + chart.coordinates[vertex * 2]) / width;
      coordinates[(chart.firstVertex + vertex) * 2 + 1] =
        (rectangle.y + padding + 0.5 + chart.coordinates[vertex * 2 + 1]) / height;
    }
  }
  const chartOwners = new Float32Array(width * height);
  for (const {id, rectangle} of charts)
    for (let row = rectangle.y; row < rectangle.y + rectangle.height; row++)
      chartOwners.fill(id, row * width + rectangle.x, row * width + rectangle.x + rectangle.width);
  return {
    width,
    height,
    texelsPerUnit,
    padding,
    uvSet,
    meshes,
    charts: charts.map(({coordinates, meshIndex, ...chart}) => chart),
    chartOwners,
    occupancy: allocatedPixels / (width * height)
  };
}

/** Explicit diagnostic pass; returns actionable chart errors without allocating GPU resources. */
export function validateLightmapAtlas(atlas: LightmapAtlas): string[] {
  const errors: string[] = [];
  if (
    !Number.isSafeInteger(atlas.width) ||
    atlas.width <= 0 ||
    !Number.isSafeInteger(atlas.height) ||
    atlas.height <= 0 ||
    atlas.chartOwners.length !== atlas.width * atlas.height
  )
    return ['Invalid atlas dimensions or ownership data length'];
  const occupied = new Uint8Array(atlas.width * atlas.height);
  const identifiers = new Set<number>();
  for (const chart of atlas.charts) {
    const {x, y, width, height} = chart.rectangle;
    if (
      !Number.isInteger(chart.id) ||
      chart.id <= 0 ||
      chart.id > 2048 ||
      identifiers.has(chart.id)
    )
      errors.push(`Invalid chart ID ${chart.id}`);
    identifiers.add(chart.id);
    if (
      ![x, y, width, height].every(Number.isInteger) ||
      x < 0 ||
      y < 0 ||
      width <= 0 ||
      height <= 0 ||
      x + width > atlas.width ||
      y + height > atlas.height
    ) {
      errors.push(`Chart ${chart.id} is outside the atlas`);
      continue;
    }
    let overlaps = false;
    let ownershipMismatch = false;
    for (let row = y; row < y + height; row++)
      for (let column = x; column < x + width; column++) {
        const pixel = row * atlas.width + column;
        overlaps ||= Boolean(occupied[pixel]);
        occupied[pixel] = 1;
        ownershipMismatch ||= atlas.chartOwners[pixel] !== chart.id;
      }
    if (overlaps) errors.push(`Chart ${chart.id} overlaps another chart`);
    if (ownershipMismatch) errors.push(`Chart ${chart.id} has inconsistent gutter ownership`);
    const mesh = atlas.meshes.find(candidate => candidate.id === chart.meshId);
    const coordinates = mesh?.geometry.attributes[`TEXCOORD_${atlas.uvSet}`]?.value;
    if (
      !coordinates ||
      !Number.isInteger(chart.firstVertex) ||
      !Number.isInteger(chart.vertexCount) ||
      chart.vertexCount <= 0 ||
      chart.firstVertex < 0 ||
      chart.firstVertex + chart.vertexCount > coordinates.length / 2
    ) {
      errors.push(`Chart ${chart.id} has an invalid draw range`);
      continue;
    }
    for (let vertex = chart.firstVertex; vertex < chart.firstVertex + chart.vertexCount; vertex++) {
      const horizontal = coordinates[vertex * 2] * atlas.width;
      const vertical = coordinates[vertex * 2 + 1] * atlas.height;
      if (
        !Number.isFinite(horizontal) ||
        !Number.isFinite(vertical) ||
        horizontal < x + atlas.padding ||
        horizontal > x + width - atlas.padding ||
        vertical < y + atlas.padding ||
        vertical > y + height - atlas.padding
      ) {
        errors.push(`Chart ${chart.id} has UVs outside its padded rectangle`);
        break;
      }
    }
  }
  if (atlas.chartOwners.some((owner, pixel) => !occupied[pixel] && owner !== 0))
    errors.push('Unallocated pixels have chart owners');
  return errors;
}

/** Independent RGBA8 chart-ownership preview. Unallocated pixels are opaque black. */
export function getLightmapAtlasDebugData(atlas: LightmapAtlas): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(atlas.width * atlas.height * 4);
  for (let pixel = 0; pixel < atlas.chartOwners.length; pixel++) {
    const identifier = atlas.chartOwners[pixel];
    pixels[pixel * 4] = identifier ? 64 + ((identifier * 67) % 192) : 0;
    pixels[pixel * 4 + 1] = identifier ? 64 + ((identifier * 103) % 192) : 0;
    pixels[pixel * 4 + 2] = identifier ? 64 + ((identifier * 137) % 192) : 0;
    pixels[pixel * 4 + 3] = 255;
  }
  return pixels;
}
