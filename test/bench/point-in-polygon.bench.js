// luma.gl, MIT license

import {GPUPointInPolygon} from '@luma.gl/experimental';
import {Buffer} from '@luma.gl/webgl';
import {createTestContext} from '@luma.gl/test-utils';
import {cpuPointInPolygon} from '../../modules/experimental/test/gpgpu/point-in-polygon/cpu-point-in-polygon';
const gl = createTestContext();

const random = getRandom();

const Count10K = 10000;
const Count1M = 1000000;
const Count10M = 10000000;
const polygon5 = getRandomPolygon(4);
const polygon10 = getRandomPolygon(10);
const points10K = getRandomPoints(Count10K);
const points1M = getRandomPoints(Count1M);
const points10M = getRandomPoints(Count10M);

const positionBuffer10K = new Buffer(gl, points10K.flatArray);
const filterValueIndexBuffer10K = new Buffer(gl, Count10K * 2 * 4);
const positionBuffer1M = new Buffer(gl, points1M.flatArray);
const filterValueIndexBuffer1M = new Buffer(gl, Count1M * 2 * 4);
const positionBuffer10M = new Buffer(gl, points10M.flatArray);
const filterValueIndexBuffer10M = new Buffer(gl, Count10M * 2 * 4);

const gpuPolygonClip = new GPUPointInPolygon(gl, {textureSize: 512});

export default function pointInPolygonBench(suite) {
  return suite

    .group('Point-In-Polygon')

    .add('CPU: 10K points, 5 polygon edges', () => {
      cpuPointInPolygon({polygons: [polygon5], points: points10K.pointsArray});
    })
    .add('GPU: 10K points, 5 polygon edges', () => {
      gpuPolygonClip.update({polygons: [polygon5]});
      gpuPolygonClip.filter({
        positionBuffer: positionBuffer10K,
        filterValueIndexBuffer: filterValueIndexBuffer10K,
        count: Count10K
      });
    })
    .add('CPU: 10K points, 10 polygon edges', () => {
      cpuPointInPolygon({polygons: [polygon10], points: points10K.pointsArray});
    })
    .add('GPU: 10K points, 10 polygon edges', () => {
      gpuPolygonClip.update({polygons: [polygon10]});
      gpuPolygonClip.filter({
        positionBuffer: positionBuffer10K,
        filterValueIndexBuffer: filterValueIndexBuffer10K,
        count: Count10K
      });
    })
    .add('CPU: 1M points, 10 polygon edges', () => {
      cpuPointInPolygon({polygons: [polygon10], points: points1M.pointsArray});
    })
    .add('GPU: 1M points, 10 polygon edges', () => {
      gpuPolygonClip.update({polygons: [polygon10]});
      gpuPolygonClip.filter({
        positionBuffer: positionBuffer1M,
        filterValueIndexBuffer: filterValueIndexBuffer1M,
        count: Count1M
      });
    })
    .add('CPU: 10M points, 10 polygon edges', () => {
      cpuPointInPolygon({polygons: [polygon10], points: points10M.pointsArray});
    })
    .add('GPU: 10M points, 10 polygon edges', () => {
      gpuPolygonClip.update({polygons: [polygon10]});
      gpuPolygonClip.filter({
        positionBuffer: positionBuffer10M,
        filterValueIndexBuffer: filterValueIndexBuffer10M,
        count: Count10M
      });
    });
}

function getRandomPoints(count) {
  const flatArray = new Float32Array(count * 2);
  const pointsArray = new Array(count);
  for (let i = 0; i < count; ++i) {
    flatArray[i * 2] = random() * 2.0 - 1.0;
    flatArray[i * 2 + 1] = random() * 2.0 - 1.0;
    pointsArray[i] = [flatArray[i * 2], flatArray[i * 2 + 1]];
  }
  return {flatArray, pointsArray};
}

export function getRandomPolygon(size) {
  size = size || Math.floor(random() * 50);
  size = Math.max(size, 4);
  const angleStep = 360 / size;
  let angle = 0;
  const radiusStep = 0.25;
  let radius = 0;
  const polygon = [];
  const xOffset = (random() - 0.5) / 4;
  const yOffset = (random() - 0.5) / 4;
  for (let i = 0; i < size; i++) {
    radius = 0.25 + radiusStep * random(); // random value between 0.25 to 0.5
    angle = angleStep * i + angleStep * random();
    const cos = Math.cos((angle * Math.PI) / 180);
    const sin = Math.sin((angle * Math.PI) / 180);
    polygon.push([radius * sin + xOffset, radius * cos + yOffset]);
  }
  polygon.push([...polygon[0]]);
  return polygon;
}

function getRandom() {
  let s = 1;
  let c = 1;
  return () => {
    s = Math.sin(c * 17.23);
    c = Math.cos(s * 27.92);
    return fract(Math.abs(s * c) * 1432.71);
  };
}

function fract(n) {
  return n - Math.floor(n);
}
