// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  CubeGeometry,
  Geometry,
  makeEdgeGeometry,
  makeEdgeGeometryFromGeometries
} from '@luma.gl/engine';

function makeQuad(indices = [0, 1, 2, 0, 2, 3]): Geometry {
  return new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])},
    indices: new Uint16Array(indices)
  });
}

test('edge geometry removes coplanar triangulation and ignores face ordering', () => {
  const input = makeQuad();
  const edges = makeEdgeGeometry(input, {angleThreshold: 0});
  expect(edges.topology).toBe('line-list');
  expect(makeEdgeGeometry(input, {includeCoplanarEdges: true}).vertexCount).toBe(10);
  expect(Array.from(edges.indices!.value)).toEqual([0, 1, 0, 3, 1, 2, 2, 3]);
  expect(edges.attributes.POSITION).toBe(input.attributes.POSITION);
  expect(edges.vertexCount).toBe(8);
  expect(Array.from(makeEdgeGeometry(makeQuad([0, 2, 3, 0, 1, 2])).indices!.value)).toEqual(
    Array.from(edges.indices!.value)
  );
  expect(Array.from(input.indices!.value)).toEqual([0, 1, 2, 0, 2, 3]);
});

test('edge geometry welds duplicated face vertices of a cube', () => {
  const cube = new CubeGeometry();
  const edges = makeEdgeGeometry(cube);
  expect(edges.vertexCount).toBe(24);
  const positions = edges.attributes.POSITION!.value;
  const indices = edges.indices!.value;
  const segments = new Set<string>();
  for (let offset = 0; offset < indices.length; offset += 2) {
    const start = Array.from(positions.slice(indices[offset] * 3, indices[offset] * 3 + 3));
    const end = Array.from(positions.slice(indices[offset + 1] * 3, indices[offset + 1] * 3 + 3));
    expect(start.filter((value, axis) => value !== end[axis])).toHaveLength(1);
    segments.add([start.join(','), end.join(',')].sort().join('|'));
  }
  expect(segments.size).toBe(12);
  expect(makeEdgeGeometry(cube, {angleThreshold: 90}).vertexCount).toBe(24);
  expect(makeEdgeGeometry(cube, {angleThreshold: 100}).vertexCount).toBe(0);
});

test('edge geometry uses face angles and supports unindexed input', () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, -1, 1])
    }
  });
  expect(makeEdgeGeometry(geometry, {angleThreshold: 40}).vertexCount).toBe(10);
  expect(makeEdgeGeometry(geometry, {angleThreshold: 50}).vertexCount).toBe(8);
});

test('edge geometry weld tolerance crosses spatial bucket boundaries', () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: new Float32Array([
        0.999999, 0, 0, 2, 0, 0, 0.999999, 1, 0, 1.000001, 0, 0, 1.000001, 1, 0, 0, 0, 0
      ])
    }
  });
  expect(makeEdgeGeometry(geometry).vertexCount).toBe(12);
  expect(makeEdgeGeometry(geometry, {weldTolerance: 0.001}).vertexCount).toBe(8);
});

test('edge geometry skips repeated and degenerate triangles', () => {
  const geometry = makeQuad([0, 1, 2, 0, 2, 3, 2, 1, 0, 0, 0, 1]);
  expect(makeEdgeGeometry(geometry).vertexCount).toBe(8);
  const collinear = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0])}
  });
  expect(makeEdgeGeometry(collinear).vertexCount).toBe(0);
});

test('edge geometry retains non-manifold edges exactly once', () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 2, 0])},
    indices: new Uint16Array([0, 1, 2, 1, 0, 3, 0, 1, 4])
  });
  const edges = makeEdgeGeometry(geometry, {angleThreshold: 180});
  expect(edges.vertexCount).toBe(14);
  expect(Array.from(edges.indices!.value).slice(0, 2)).toEqual([0, 1]);
});

test('edge geometry preserves custom position semantics and active draw ranges', () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    vertexCount: 3,
    attributes: {_CUSTOM_POSITION: {size: 3, value: makeQuad().attributes.POSITION!.value}},
    indices: new Uint16Array([0, 1, 2, 0, 2, 3])
  });
  const edges = makeEdgeGeometry(geometry, {positionAttribute: '_CUSTOM_POSITION'});
  expect(Object.keys(edges.attributes)).toEqual(['_CUSTOM_POSITION']);
  expect(edges.vertexCount).toBe(6);
});

test('edge geometry rejects incompatible topology and incomplete triangles', () => {
  const positions = makeQuad().attributes.POSITION!;
  expect(() =>
    makeEdgeGeometry(new Geometry({topology: 'line-list', attributes: {POSITION: positions}}))
  ).toThrow();
  expect(() => makeEdgeGeometry(makeQuad([0, 1]))).toThrow();
  expect(() => makeEdgeGeometry(makeQuad([0, 1, 10]))).toThrow();
  expect(() => makeEdgeGeometry(makeQuad(), {weldTolerance: -1})).toThrow();
});

function makeNeighbor(folded = false): Geometry {
  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: new Float32Array(
        folded ? [1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0] : [1, 0, 0, 2, 0, 0, 2, 1, 0, 1, 1, 0]
      )
    },
    indices: new Uint16Array([0, 1, 2, 0, 2, 3])
  });
}

function getEdgeSegments(geometry: Geometry, positionAttribute = 'POSITION'): string[] {
  const positions = geometry.attributes[positionAttribute]!.value;
  const indices = geometry.indices!.value;
  const segments: string[] = [];
  for (let offset = 0; offset < indices.length; offset += 2) {
    const endpoints = [indices[offset], indices[offset + 1]].map(index =>
      Array.from(positions.slice(index * 3, index * 3 + 3)).join(',')
    );
    segments.push(endpoints.sort().join('|'));
  }
  return segments.sort();
}

test('edge geometry batches suppress tile seams across reloads without changing sources', () => {
  const first = makeQuad();
  const second = makeNeighbor();
  const originalPositions = Array.from(first.attributes.POSITION!.value);
  const edges = makeEdgeGeometryFromGeometries([first, second]);
  const segments = getEdgeSegments(edges);
  expect(segments).toHaveLength(6);
  expect(segments).not.toContain('1,0,0|1,1,0');
  expect(getEdgeSegments(makeEdgeGeometryFromGeometries([makeNeighbor(), makeQuad()]))).toEqual(
    segments
  );
  expect(getEdgeSegments(makeEdgeGeometryFromGeometries([first, second, makeQuad()]))).toEqual(
    segments
  );
  expect(getEdgeSegments(makeEdgeGeometryFromGeometries([first]))).toContain('1,0,0|1,1,0');
  expect(edges.attributes.POSITION!.value).not.toBe(first.attributes.POSITION!.value);
  expect(Array.from(first.attributes.POSITION!.value)).toEqual(originalPositions);
  expect(Array.from(first.indices!.value)).toEqual([0, 1, 2, 0, 2, 3]);
});

test('edge geometry batches retain a shared crease exactly once', () => {
  const edges = makeEdgeGeometryFromGeometries([makeQuad(), makeNeighbor(true)]);
  const segments = getEdgeSegments(edges);
  expect(segments).toHaveLength(7);
  expect(segments.filter(segment => segment === '1,0,0|1,1,0')).toHaveLength(1);
  expect(
    makeEdgeGeometryFromGeometries([makeQuad(), makeNeighbor(true)], {angleThreshold: 100})
      .vertexCount
  ).toBe(12);
});

test('edge geometry batches weld small tile coordinate differences only when requested', () => {
  const neighbor = makeNeighbor();
  const positions = neighbor.attributes.POSITION!.value;
  for (let index = 0; index < positions.length; index += 3) positions[index] += 0.00001;
  expect(makeEdgeGeometryFromGeometries([makeQuad(), neighbor]).vertexCount).toBe(16);
  expect(
    makeEdgeGeometryFromGeometries([makeQuad(), neighbor], {weldTolerance: 0.001}).vertexCount
  ).toBe(12);
});

test('edge geometry batches preserve scalar precision, custom semantics and active triangles', () => {
  const positions = new Int32Array([16777216, 0, 0, 16777217, 0, 0, 16777216, 1, 0]);
  const first = new Geometry({
    topology: 'triangle-list',
    vertexCount: 3,
    attributes: {_CUSTOM_POSITION: {size: 3, value: positions}},
    indices: new Uint32Array([0, 1, 2, 0, 0, 0])
  });
  const second = new Geometry({
    topology: 'triangle-list',
    attributes: {
      _CUSTOM_POSITION: {
        size: 3,
        value: new Int32Array([16777217, 0, 0, 16777217, 1, 0, 16777216, 1, 0])
      }
    }
  });
  const edges = makeEdgeGeometryFromGeometries([first, second], {
    positionAttribute: '_CUSTOM_POSITION'
  });
  expect(Object.keys(edges.attributes)).toEqual(['_CUSTOM_POSITION']);
  expect(edges.attributes._CUSTOM_POSITION!.value).toBeInstanceOf(Int32Array);
  expect(getEdgeSegments(edges, '_CUSTOM_POSITION')).toHaveLength(4);
  expect(getEdgeSegments(edges, '_CUSTOM_POSITION')).toContain('16777216,0,0|16777217,0,0');
  expect(first.vertexCount).toBe(3);
  expect(first.indices!.value).toHaveLength(6);
});

test('edge geometry batches reject incompatible storage and indices crossing tile boundaries', () => {
  expect(() => makeEdgeGeometryFromGeometries([])).toThrow();
  expect(() => makeEdgeGeometryFromGeometries([makeQuad([0, 1, 4]), makeNeighbor()])).toThrow();
  const incompatible = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: new Int32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}
  });
  expect(() => makeEdgeGeometryFromGeometries([makeQuad(), incompatible])).toThrow();
  const normalized = makeQuad();
  normalized.attributes.POSITION!['normalized'] = true;
  expect(() => makeEdgeGeometryFromGeometries([makeQuad(), normalized])).toThrow();
});
