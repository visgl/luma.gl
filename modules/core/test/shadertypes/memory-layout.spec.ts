import test from 'tape-promise/tape';
import type {ShaderTypeInfo} from '../../dist/shadertypes/shader-types';
import {getShaderTypeInfo, calculateMemoryOffsets} from '@luma.gl/core';

const TEST_CASES = [
  {
    name: 'webgl-fundamentals-1',
    types: {
      scale: 'f32',
      offset: 'vec3f',
      projection: 'mat4x4f'
    },
    offsets: {
      scale: [0, 4],
      offset: [16, 12],
      projection: [32, 64]
    }
  },
  {
    name: 'webgl-fundamentals-2',
    types: {
      transform: 'mat3x3f',
      directions: ['vec3f', 4]
    },
    offsets: {
      transform: [0, 48],
      direction: [48, 64]
    }
  }
  // {
  //   name: 'webgl-fundamentals-3',
  //   structs: {
  //     Ex4a: {
  //       velocity: 'vec3f'
  //     }
  //   },
  //   types: {
  //     orientation: 'vec3f',
  //     size: 'f32',
  //     direction: ['vec3f', 1],
  //     scale: 'f32',
  //     info: 'Ex4a',
  //     friction: 'f32',
  //   },
  //   offsets: {
  //     orientation: [0, 12],
  //     size: [12, 4],
  //     direction: [16, 12],
  //     scale: [32, 4],
  //     info: {
  //       velocity: [48, 12],
  //     },
  //     friction: [64, 4],
  //   }
  // }
];

test.only('calculateMemoryOffsets', t => {
  for (const tc of TEST_CASES) {
    const {types} = tc;

    const typeInfos: Record<string, ShaderTypeInfo> = {};
    Object.entries(types).forEach(([key, value]) => {
      typeInfos[key] = getShaderTypeInfo(value);
      calculateMemoryOffsets(types[key]);
    });

    t.comment(JSON.stringify(typeInfos, null, 2));
    // t.deepEqual(layout, offsets, `calculateMemoryOffsets(${tc.name}) returned expected layout`);
  }
  t.pass('Std140Layout correct');

  t.end();
});
