import test from 'tape-promise/tape';
import {fixture} from 'test/setup';
import {equals} from '@math.gl/core';
import {Buffer} from '@luma.gl/webgl';
import {GPUPointInPolygon} from '@luma.gl/experimental';
import {cpuPointInPolygon} from './cpu-point-in-polygon';

const {gl2} = fixture;
const TEST_CASES = [
  {
    name: 'all - in',
    polygons: [
      [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0.5, 0.5],
        [-0.5, 0.5],
        [-0.5, -0.5]
      ]
    ],
    points: [
      [0, 0],
      [-0.25, -0.25],
      [0.25, -0.25],
      [0.25, 0.25],
      [-0.25, 0.25],
      [-0.45, 0.45]
    ]
  },
  {
    name: 'all - out',
    polygons: [
      [
        [-0.35, -0.35],
        [0.35, -0.35],
        [0.35, 0.35],
        [-0.35, 0.35],
        [-0.35, -0.35]
      ]
    ],
    points: [
      [-0.45, -0.25],
      [0.25, -0.5],
      [0.45, 0.25],
      [-0.25, 0.45],
      [-0.45, 0.45],
      [10, 0]
    ]
  },
  {
    name: 'mix',
    polygons: [
      [
        [-0.35, -0.35],
        [0.45, -0.35],
        [0.35, 0.45],
        [-0.5, 0.35],
        [-0.35, -0.35]
      ]
    ],
    points: [
      [-0.35, -0.35],
      [0.25, -0.45],
      [0.25, -0.25],
      [0.45, 0.25],
      [0.34, 0.43],
      // [-0.25, 0.45], // on polygon edge, gives different results for CPU and GPU
      [-0.25, 0.5],
      [-0.45, 0.45],
      [0.33, 0.44],
      [10, 5],
      [0, 0],
      [-0.35, -0.35]
    ]
  },
  {
    name: 'mix - 2',
    polygons: [
      [
        [1, -4],
        [2, -1],
        [5, -3],
        [3, -1],
        [4, 2],
        [1, 10],
        [-1, 1],
        [-5, 4],
        [-4, -1],
        [-25, -4],
        [1, -4]
      ]
    ],
    points: [
      [0, 0],
      [1, 0],
      [5, 0],
      [0.5, -3],
      [-0.5, -30],
      [10, -1],
      [1, 7],
      [2, 10],
      [-100, 20],
      [-3, 1]
    ],
    scales: [2, -0.5, 100]
  },
  {
    // randomly generated data
    name: 'multiple polygons',
    polygons: [
      [
        [0.8473027063236651, -86.3501734165155],
        [3.7518798663936996, -84.40338495589492],
        [6.522768228802835, -85.29902707329609],
        [7.8754470219566866, -89.25407431816627],
        [2.7759858381233693, -90.37746599216538],
        [3.5036751881932595, -93.02013379664764],
        [-0.38079306661700824, -90.8155507382388],
        [2.2717464958411537, -98.51490448745484],
        [-0.5210318674069924, -95.08886537312374],
        [-4.023826773093546, -97.07503233729264],
        [-5.651509453124722, -97.19591327984945],
        [-5.209427502337417, -93.32382544933547],
        [-3.1986527853331252, -90.70815651194543],
        [-4.140762974650901, -89.34677058551321],
        [-2.5125501924329807, -89.02077203843078],
        [-4.692806467765156, -84.38578795758295],
        [-1.5149260127239457, -84.61786523331578],
        [0.8473027063236651, -86.3501734165155]
      ],
      [
        [30.454449898171493, -86.00897222844014],
        [33.11940967909238, -93.64781184616005],
        [24.599776599121007, -93.31646641453531],
        [23.245264896876385, -93.21031310065165],
        [17.85964570761259, -87.26601424338588],
        [24.256739038165286, -90.33321457812242],
        [30.454449898171493, -86.00897222844014]
      ]
    ],
    points: [
      [-3.354224681854248, -84.14159393310547], // close to the border outside
      [-3.354224681854248, -85.14159393310547], // close to the border inside

      [2.142691516876221, -93.45799255371094], // inside bbox, outside polygon

      [3.7231504917144775, -87.21636962890625], // inside

      [29.476238250732422, -77.00528717041016], // outside
      [20.560392379760742, -92.24445343017578], // outside

      [29.531993865966797, -87.56260681152344], // inside

      [32.13725280761719, -89.35847473144531], // outside

      [18.95863037109375, -88.05795288085938], // inside

      [-4.68645715713501, -93.49331665039062], // inside

      [30.752777099609375, -90.89189910888672] // inside
    ]
  },
  {
    name: 'geo',
    polygons: [
      [
        [37.7655, -122.4293],
        [37.7773, -122.4173],
        [37.7664, -122.4143],
        [37.7564, -122.409],
        [37.7625, -122.419],
        [37.7655, -122.4293]
      ]
    ],
    points: [
      [37.7671, -122.4274],
      [37.7811, -122.4446],
      [37.7657, -122.4322],
      [37.7657, 122.4322],
      [40.7663, -74.0024]
    ]
  },
  {
    name: 'polygon with hole',
    polygons: [
      [
        [
          [-0.5, -0.5],
          [0.5, -0.5],
          [0.5, 0.5],
          [-0.5, 0.5],
          [-0.5, -0.5]
        ], // outer ring
        [
          [-0.25, -0.25],
          [0.25, -0.25],
          [0.25, 0.25],
          [-0.25, 0.25],
          [-0.25, -0.25]
        ] // hole
      ]
    ],
    points: [
      [0, 0],
      [-0.35, -0.25],
      [0.15, -0.15],
      [0.25, 0.35],
      [-0.75, 0.25],
      [-0.45, 0.45]
    ]
  }
];

/* eslint-disable max-nested-callbacks */
test('gpgpu#GPUPointInPolygon CPU vs GPU', (t) => {
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }
  const gpuPointInPolygon = new GPUPointInPolygon(gl2, {textureSize: 512});

  TEST_CASES.forEach((tc) => {
    const scales = tc.scales || [1];
    scales.forEach((scale) => {
      const polygons = tc.polygons || [tc.polygon];
      const points = tc.points.map((xy) => [xy[0] * scale, xy[1] * scale]);
      const name = `${tc.name} scale:${scale}`;

      const count = points.length;
      const flatArray = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) {
        flatArray[i * 2] = points[i][0];
        flatArray[i * 2 + 1] = points[i][1];
      }

      // gpu
      const positionBuffer = new Buffer(gl2, flatArray);
      const filterValueIndexBuffer = new Buffer(gl2, count * 2 * 4);
      gpuPointInPolygon.update({polygons});
      gpuPointInPolygon.filter({positionBuffer, filterValueIndexBuffer, count});
      const filterValueIndexArray = filterValueIndexBuffer.getData();
      const gpuResults = new Array(count);
      for (let i = 0; i < count; i++) {
        const index = filterValueIndexArray[i * 2 + 1];
        gpuResults[index] = filterValueIndexArray[i * 2];
      }
      positionBuffer.delete();
      filterValueIndexBuffer.delete();

      // cpu
      let cpuResults = tc.cpuResults;
      if (!cpuResults) {
        cpuResults = cpuPointInPolygon({polygons, points});
      }

      t.ok(equals(gpuResults, cpuResults), `${name}: CPU GPU results should match`);
    });
  });
  t.end();
});
/* eslint-enable max-nested-callbacks */
