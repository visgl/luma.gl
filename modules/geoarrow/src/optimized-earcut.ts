// luma.gl
// SPDX-License-Identifier: MIT and ISC
// Copyright (c) vis.gl contributors

/*
  Adapted from loaders.gl's WKB triangulator and mapbox/earcut.

  ISC License

  Copyright (c) 2016, Mapbox

  Permission to use, copy, modify, and/or distribute this software for any purpose
  with or without fee is hereby granted, provided that the above copyright notice
  and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
  OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
  THIS SOFTWARE.
*/

export type OptimizedEarcutProps = {
  values: Float32Array | Float64Array;
  sourceDimension: 2 | 3 | 4;
  ringOffsets: Int32Array;
  ringStart: number;
  ringEnd: number;
  outputBase: number;
  indices: number[];
};

const HASH_VERTEX_THRESHOLD = 80;
const Z_ORDER_SCALE = 32767;

const vertexPool: EarcutVertex[] = [];
let vertexPoolIndex = 0;
const holeQueue: EarcutVertex[] = [];

export function triangulatePolygon(props: OptimizedEarcutProps): void {
  const {ringStart, ringEnd, ringOffsets, indices} = props;
  if (ringEnd <= ringStart) {
    return;
  }

  resetVertexPool();
  let outerNode = linkedList(props, ringStart, true);
  if (!outerNode || outerNode.next === outerNode.prev) {
    return;
  }

  if (ringEnd > ringStart + 1) {
    outerNode = eliminateHoles(props, outerNode);
  }

  let invSize = 0;
  let minX = 0;
  let minY = 0;

  if (ringOffsets[ringEnd] - ringOffsets[ringStart] > HASH_VERTEX_THRESHOLD) {
    let maxX: number;
    let maxY: number;
    let node = outerNode;
    minX = maxX = node.x;
    minY = maxY = node.y;

    do {
      if (node.x < minX) {
        minX = node.x;
      }
      if (node.y < minY) {
        minY = node.y;
      }
      if (node.x > maxX) {
        maxX = node.x;
      }
      if (node.y > maxY) {
        maxY = node.y;
      }
      node = node.next;
    } while (node !== outerNode);

    const size = Math.max(maxX - minX, maxY - minY);
    invSize = size !== 0 ? Z_ORDER_SCALE / size : 0;
  }

  earcutLinked(outerNode, indices, props.outputBase, minX, minY, invSize);
}

function linkedList(
  props: OptimizedEarcutProps,
  ringIndex: number,
  clockwise: boolean
): EarcutVertex | null {
  const {values, sourceDimension, ringOffsets} = props;
  const coordinateStart = ringOffsets[props.ringStart];
  const ringCoordinateStart = ringOffsets[ringIndex];
  const ringCoordinateEnd = ringOffsets[ringIndex + 1];
  const pointCount = ringCoordinateEnd - ringCoordinateStart;
  if (pointCount === 0) {
    return null;
  }

  let last: EarcutVertex | null = null;
  let signedArea = 0;
  let previousCoordinateIndex = ringCoordinateEnd - 1;
  let previousX = values[previousCoordinateIndex * sourceDimension];
  let previousY = values[previousCoordinateIndex * sourceDimension + 1];

  for (
    let coordinateIndex = ringCoordinateStart;
    coordinateIndex < ringCoordinateEnd;
    coordinateIndex++
  ) {
    const coordinateOffset = coordinateIndex * sourceDimension;
    const x = values[coordinateOffset];
    const y = values[coordinateOffset + 1];
    signedArea += (x - previousX) * (y + previousY);
    last = insertNode(coordinateIndex - coordinateStart, x, y, last);
    previousCoordinateIndex = coordinateIndex;
    previousX = values[previousCoordinateIndex * sourceDimension];
    previousY = values[previousCoordinateIndex * sourceDimension + 1];
  }
  signedArea /= 2;

  if (last && clockwise !== signedArea < 0) {
    reverseLinkedList(last);
  }

  if (last && equals(last, last.next)) {
    removeNode(last);
    last = last.next;
  }

  return last;
}

function reverseLinkedList(start: EarcutVertex): void {
  let node = start;
  do {
    const next = node.next;
    node.next = node.prev;
    node.prev = next;
    node = next;
  } while (node !== start);
}

function filterPoints(
  start: EarcutVertex | null,
  end: EarcutVertex | null = null
): EarcutVertex | null {
  if (!start) {
    return start;
  }
  end = end || start;

  let node = start;
  let again: boolean;
  do {
    again = false;

    if (!node.steiner && (equals(node, node.next) || area(node.prev, node, node.next) === 0)) {
      removeNode(node);
      node = end = node.prev;
      if (node === node.next) {
        break;
      }
      again = true;
    } else {
      node = node.next;
    }
  } while (again || node !== end);

  return end;
}

function earcutLinked(
  ear: EarcutVertex | null,
  indices: number[],
  outputBase: number,
  minX: number,
  minY: number,
  invSize: number,
  pass = 0
): void {
  if (!ear) {
    return;
  }
  let currentEar = ear;

  if (!pass && invSize) {
    indexCurve(currentEar, minX, minY, invSize);
  }

  let stop = currentEar;

  while (currentEar.prev !== currentEar.next) {
    const previous = currentEar.prev;
    const next = currentEar.next;

    if (invSize ? isEarHashed(currentEar, minX, minY, invSize) : isEar(currentEar)) {
      indices.push(outputBase + previous.i, outputBase + currentEar.i, outputBase + next.i);
      removeNode(currentEar);
      currentEar = next.next;
      stop = currentEar;
      continue;
    }

    currentEar = next;

    if (currentEar === stop) {
      if (!pass) {
        earcutLinked(filterPoints(currentEar), indices, outputBase, minX, minY, invSize, 1);
      } else if (pass === 1) {
        const curedEar = cureLocalIntersections(filterPoints(currentEar), indices, outputBase);
        earcutLinked(curedEar, indices, outputBase, minX, minY, invSize, 2);
      } else if (pass === 2) {
        splitEarcut(currentEar, indices, outputBase, minX, minY, invSize);
      }
      break;
    }
  }
}

function isEar(ear: EarcutVertex): boolean {
  const a = ear.prev;
  const b = ear;
  const c = ear.next;

  if (area(a, b, c) >= 0) {
    return false;
  }

  const ax = a.x;
  const bx = b.x;
  const cx = c.x;
  const ay = a.y;
  const by = b.y;
  const cy = c.y;

  const x0 = ax < bx ? (ax < cx ? ax : cx) : bx < cx ? bx : cx;
  const y0 = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
  const x1 = ax > bx ? (ax > cx ? ax : cx) : bx > cx ? bx : cx;
  const y1 = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;

  let node = c.next;
  while (node !== a) {
    if (
      node.x >= x0 &&
      node.x <= x1 &&
      node.y >= y0 &&
      node.y <= y1 &&
      pointInTriangle(ax, ay, bx, by, cx, cy, node.x, node.y) &&
      area(node.prev, node, node.next) >= 0
    ) {
      return false;
    }
    node = node.next;
  }

  return true;
}

function isEarHashed(ear: EarcutVertex, minX: number, minY: number, invSize: number): boolean {
  const a = ear.prev;
  const b = ear;
  const c = ear.next;

  if (area(a, b, c) >= 0) {
    return false;
  }

  const ax = a.x;
  const bx = b.x;
  const cx = c.x;
  const ay = a.y;
  const by = b.y;
  const cy = c.y;

  const x0 = ax < bx ? (ax < cx ? ax : cx) : bx < cx ? bx : cx;
  const y0 = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
  const x1 = ax > bx ? (ax > cx ? ax : cx) : bx > cx ? bx : cx;
  const y1 = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;

  const minZ = zOrder(x0, y0, minX, minY, invSize);
  const maxZ = zOrder(x1, y1, minX, minY, invSize);

  let previousZ = ear.prevZ;
  let nextZ = ear.nextZ;

  while (previousZ && previousZ.z >= minZ && nextZ && nextZ.z <= maxZ) {
    if (
      previousZ.x >= x0 &&
      previousZ.x <= x1 &&
      previousZ.y >= y0 &&
      previousZ.y <= y1 &&
      previousZ !== a &&
      previousZ !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, previousZ.x, previousZ.y) &&
      area(previousZ.prev, previousZ, previousZ.next) >= 0
    ) {
      return false;
    }
    previousZ = previousZ.prevZ;

    if (
      nextZ.x >= x0 &&
      nextZ.x <= x1 &&
      nextZ.y >= y0 &&
      nextZ.y <= y1 &&
      nextZ !== a &&
      nextZ !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, nextZ.x, nextZ.y) &&
      area(nextZ.prev, nextZ, nextZ.next) >= 0
    ) {
      return false;
    }
    nextZ = nextZ.nextZ;
  }

  while (previousZ && previousZ.z >= minZ) {
    if (
      previousZ.x >= x0 &&
      previousZ.x <= x1 &&
      previousZ.y >= y0 &&
      previousZ.y <= y1 &&
      previousZ !== a &&
      previousZ !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, previousZ.x, previousZ.y) &&
      area(previousZ.prev, previousZ, previousZ.next) >= 0
    ) {
      return false;
    }
    previousZ = previousZ.prevZ;
  }

  while (nextZ && nextZ.z <= maxZ) {
    if (
      nextZ.x >= x0 &&
      nextZ.x <= x1 &&
      nextZ.y >= y0 &&
      nextZ.y <= y1 &&
      nextZ !== a &&
      nextZ !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, nextZ.x, nextZ.y) &&
      area(nextZ.prev, nextZ, nextZ.next) >= 0
    ) {
      return false;
    }
    nextZ = nextZ.nextZ;
  }

  return true;
}

function cureLocalIntersections(
  start: EarcutVertex | null,
  indices: number[],
  outputBase: number
): EarcutVertex | null {
  if (!start) {
    return start;
  }

  let node = start;
  do {
    const a = node.prev;
    const b = node.next.next;

    if (
      !equals(a, b) &&
      intersects(a, node, node.next, b) &&
      locallyInside(a, b) &&
      locallyInside(b, a)
    ) {
      indices.push(outputBase + a.i, outputBase + node.i, outputBase + b.i);
      removeNode(node);
      removeNode(node.next);
      node = start = b;
    }
    node = node.next;
  } while (node !== start);

  return filterPoints(node);
}

function splitEarcut(
  start: EarcutVertex,
  indices: number[],
  outputBase: number,
  minX: number,
  minY: number,
  invSize: number
): void {
  let a = start;
  do {
    let b = a.next.next;
    while (b !== a.prev) {
      if (a.i !== b.i && isValidDiagonal(a, b)) {
        let c = splitPolygon(a, b);
        a = filterPoints(a, a.next) as EarcutVertex;
        c = filterPoints(c, c.next) as EarcutVertex;
        earcutLinked(a, indices, outputBase, minX, minY, invSize);
        earcutLinked(c, indices, outputBase, minX, minY, invSize);
        return;
      }
      b = b.next;
    }
    a = a.next;
  } while (a !== start);
}

function eliminateHoles(props: OptimizedEarcutProps, outerNode: EarcutVertex): EarcutVertex {
  holeQueue.length = 0;

  for (let ringIndex = props.ringStart + 1; ringIndex < props.ringEnd; ringIndex++) {
    const list = linkedList(props, ringIndex, false);
    if (list) {
      if (list === list.next) {
        list.steiner = true;
      }
      holeQueue.push(getLeftmost(list));
    }
  }

  holeQueue.sort(compareX);
  for (const hole of holeQueue) {
    outerNode = eliminateHole(hole, outerNode);
  }

  holeQueue.length = 0;
  return outerNode;
}

function compareX(a: EarcutVertex, b: EarcutVertex): number {
  return a.x - b.x;
}

function eliminateHole(hole: EarcutVertex, outerNode: EarcutVertex): EarcutVertex {
  const bridge = findHoleBridge(hole, outerNode);
  if (!bridge) {
    return outerNode;
  }

  const bridgeReverse = splitPolygon(bridge, hole);
  filterPoints(bridgeReverse, bridgeReverse.next);
  return filterPoints(bridge, bridge.next) as EarcutVertex;
}

function findHoleBridge(hole: EarcutVertex, outerNode: EarcutVertex): EarcutVertex | null {
  let node = outerNode;
  const hx = hole.x;
  const hy = hole.y;
  let qx = -Infinity;
  let m: EarcutVertex | null = null;

  do {
    if (hy <= node.y && hy >= node.next.y && node.next.y !== node.y) {
      const x = node.x + ((hy - node.y) * (node.next.x - node.x)) / (node.next.y - node.y);
      if (x <= hx && x > qx) {
        qx = x;
        m = node.x < node.next.x ? node : node.next;
        if (x === hx) {
          return m;
        }
      }
    }
    node = node.next;
  } while (node !== outerNode);

  if (!m) {
    return null;
  }

  const stop = m;
  const mx = m.x;
  const my = m.y;
  let tanMin = Infinity;
  node = m;

  do {
    if (
      hx >= node.x &&
      node.x >= mx &&
      hx !== node.x &&
      pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, node.x, node.y)
    ) {
      const tan = Math.abs(hy - node.y) / (hx - node.x);

      if (
        locallyInside(node, hole) &&
        (tan < tanMin ||
          (tan === tanMin && (node.x > m.x || (node.x === m.x && sectorContainsSector(m, node)))))
      ) {
        m = node;
        tanMin = tan;
      }
    }

    node = node.next;
  } while (node !== stop);

  return m;
}

function sectorContainsSector(m: EarcutVertex, node: EarcutVertex): boolean {
  return area(m.prev, m, node.prev) < 0 && area(node.next, m, m.next) < 0;
}

function indexCurve(start: EarcutVertex, minX: number, minY: number, invSize: number): void {
  let node = start;
  do {
    if (node.z === 0) {
      node.z = zOrder(node.x, node.y, minX, minY, invSize);
    }
    node.prevZ = node.prev;
    node.nextZ = node.next;
    node = node.next;
  } while (node !== start);

  node.prevZ!.nextZ = null;
  node.prevZ = null;

  sortLinked(node);
}

function sortLinked(list: EarcutVertex | null): EarcutVertex | null {
  let inSize = 1;
  let numMerges: number;

  do {
    let node: EarcutVertex | null = list;
    list = null;
    let tail: EarcutVertex | null = null;
    numMerges = 0;

    while (node) {
      numMerges++;
      let q: EarcutVertex | null = node;
      let pSize = 0;
      for (let index = 0; index < inSize; index++) {
        pSize++;
        q = q!.nextZ;
        if (!q) {
          break;
        }
      }
      let qSize = inSize;

      while (pSize > 0 || (qSize > 0 && q)) {
        let e: EarcutVertex;
        if (pSize !== 0 && node && (qSize === 0 || !q || node.z <= q.z)) {
          e = node;
          node = node.nextZ;
          pSize--;
        } else if (q) {
          e = q;
          q = q.nextZ;
          qSize--;
        } else {
          break;
        }

        if (tail) {
          tail.nextZ = e;
        } else {
          list = e;
        }

        e.prevZ = tail;
        tail = e;
      }

      node = q;
    }

    if (tail) {
      tail.nextZ = null;
    }
    inSize *= 2;
  } while (numMerges > 1);

  return list;
}

function zOrder(x: number, y: number, minX: number, minY: number, invSize: number): number {
  x = ((x - minX) * invSize) | 0;
  y = ((y - minY) * invSize) | 0;

  x = (x | (x << 8)) & 0x00ff00ff;
  x = (x | (x << 4)) & 0x0f0f0f0f;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y = (y | (y << 8)) & 0x00ff00ff;
  y = (y | (y << 4)) & 0x0f0f0f0f;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

function getLeftmost(start: EarcutVertex): EarcutVertex {
  let node = start;
  let leftmost = start;
  do {
    if (node.x < leftmost.x || (node.x === leftmost.x && node.y < leftmost.y)) {
      leftmost = node;
    }
    node = node.next;
  } while (node !== start);

  return leftmost;
}

function pointInTriangle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  px: number,
  py: number
): boolean {
  return (
    (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
    (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
    (bx - px) * (cy - py) >= (cx - px) * (by - py)
  );
}

function isValidDiagonal(a: EarcutVertex, b: EarcutVertex): boolean {
  return (
    a.next.i !== b.i &&
    a.prev.i !== b.i &&
    !intersectsPolygon(a, b) &&
    ((locallyInside(a, b) &&
      locallyInside(b, a) &&
      middleInside(a, b) &&
      (area(a.prev, a, b.prev) !== 0 || area(a, b.prev, b) !== 0)) ||
      (equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0))
  );
}

function area(p: EarcutVertex, q: EarcutVertex, r: EarcutVertex): number {
  return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

function equals(p1: EarcutVertex, p2: EarcutVertex): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

function intersects(
  p1: EarcutVertex,
  q1: EarcutVertex,
  p2: EarcutVertex,
  q2: EarcutVertex
): boolean {
  const o1 = sign(area(p1, q1, p2));
  const o2 = sign(area(p1, q1, q2));
  const o3 = sign(area(p2, q2, p1));
  const o4 = sign(area(p2, q2, q1));

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }
  if (o1 === 0 && onSegment(p1, p2, q1)) {
    return true;
  }
  if (o2 === 0 && onSegment(p1, q2, q1)) {
    return true;
  }
  if (o3 === 0 && onSegment(p2, p1, q2)) {
    return true;
  }
  if (o4 === 0 && onSegment(p2, q1, q2)) {
    return true;
  }

  return false;
}

function onSegment(p: EarcutVertex, q: EarcutVertex, r: EarcutVertex): boolean {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

function sign(value: number): number {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

function intersectsPolygon(a: EarcutVertex, b: EarcutVertex): boolean {
  let node = a;
  do {
    if (
      node.i !== a.i &&
      node.next.i !== a.i &&
      node.i !== b.i &&
      node.next.i !== b.i &&
      intersects(node, node.next, a, b)
    ) {
      return true;
    }
    node = node.next;
  } while (node !== a);

  return false;
}

function locallyInside(a: EarcutVertex, b: EarcutVertex): boolean {
  return area(a.prev, a, a.next) < 0
    ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0
    : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

function middleInside(a: EarcutVertex, b: EarcutVertex): boolean {
  let node = a;
  let inside = false;
  const px = (a.x + b.x) / 2;
  const py = (a.y + b.y) / 2;
  do {
    if (
      node.y > py !== node.next.y > py &&
      node.next.y !== node.y &&
      px < ((node.next.x - node.x) * (py - node.y)) / (node.next.y - node.y) + node.x
    ) {
      inside = !inside;
    }
    node = node.next;
  } while (node !== a);

  return inside;
}

function splitPolygon(a: EarcutVertex, b: EarcutVertex): EarcutVertex {
  const a2 = allocateVertex(a.i, a.x, a.y);
  const b2 = allocateVertex(b.i, b.x, b.y);
  const an = a.next;
  const bp = b.prev;

  a.next = b;
  b.prev = a;

  a2.next = an;
  an.prev = a2;

  b2.next = a2;
  a2.prev = b2;

  bp.next = b2;
  b2.prev = bp;

  return b2;
}

function insertNode(index: number, x: number, y: number, last: EarcutVertex | null): EarcutVertex {
  const vertex = allocateVertex(index, x, y);

  if (!last) {
    vertex.prev = vertex;
    vertex.next = vertex;
  } else {
    vertex.next = last.next;
    vertex.prev = last;
    last.next.prev = vertex;
    last.next = vertex;
  }
  return vertex;
}

function removeNode(vertex: EarcutVertex): void {
  vertex.next.prev = vertex.prev;
  vertex.prev.next = vertex.next;

  if (vertex.prevZ) {
    vertex.prevZ.nextZ = vertex.nextZ;
  }
  if (vertex.nextZ) {
    vertex.nextZ.prevZ = vertex.prevZ;
  }
}

function resetVertexPool(): void {
  vertexPoolIndex = 0;
}

function allocateVertex(index: number, x: number, y: number): EarcutVertex {
  let vertex = vertexPool[vertexPoolIndex];
  if (!vertex) {
    vertex = new EarcutVertex();
    vertexPool[vertexPoolIndex] = vertex;
  }
  vertexPoolIndex++;

  vertex.i = index;
  vertex.x = x;
  vertex.y = y;
  vertex.prev = vertex;
  vertex.next = vertex;
  vertex.z = 0;
  vertex.prevZ = null;
  vertex.nextZ = null;
  vertex.steiner = false;

  return vertex;
}

class EarcutVertex {
  i = 0;
  x = 0;
  y = 0;
  prev: EarcutVertex = this;
  next: EarcutVertex = this;
  z = 0;
  prevZ: EarcutVertex | null = null;
  nextZ: EarcutVertex | null = null;
  steiner = false;
}
