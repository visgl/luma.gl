import test from 'test/utils/vitest-tape';
import {parseGLTFLights} from '@luma.gl/gltf/parsers/parse-gltf-lights';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

test('gltf#parseGLTFLights - directional', t => {
  const gltf: GLTFPostprocessed = {
    nodes: [
      {
        id: 'n1',
        extensions: {KHR_lights_punctual: {light: 0}},
        rotation: [0, 0, 0, 1]
      } as any
    ],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [
          {
            type: 'directional',
            color: [0.2, 0.3, 0.4],
            intensity: 2
          }
        ]
      }
    }
  } as any;

  const lights = parseGLTFLights(gltf);
  t.equal(lights.length, 1, 'one light parsed');
  const light = lights[0] as any;
  t.equals(light.type, 'directional');
  t.deepEquals(light.color, [51, 76.5, 102], 'glTF colors are normalized to luma light range');
  t.equals(light.intensity, 2);
  t.end();
});

test('gltf#parseGLTFLights - point', t => {
  const gltf: GLTFPostprocessed = {
    nodes: [
      {
        id: 'n2',
        extensions: {KHR_lights_punctual: {light: 0}},
        translation: [1, 2, 3]
      } as any
    ],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [
          {
            type: 'point',
            intensity: 5,
            range: 10
          }
        ]
      }
    }
  } as any;
  const lights = parseGLTFLights(gltf);
  t.equal(lights.length, 1, 'one light parsed');
  const light = lights[0] as any;
  t.equals(light.type, 'point');
  t.deepEquals(light.position, [1, 2, 3]);
  t.equals(light.intensity, 5);
  t.equals(light.attenuation[2], 1 / 100);
  t.end();
});

test('gltf#parseGLTFLights - spot', t => {
  const gltf: GLTFPostprocessed = {
    nodes: [
      {
        id: 'n-spot',
        extensions: {KHR_lights_punctual: {light: 0}},
        translation: [1, 2, 3],
        rotation: [0, 0, 0, 1]
      } as any
    ],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [
          {
            type: 'spot',
            color: [0.2, 0.3, 0.4],
            intensity: 7,
            range: 20,
            spot: {
              innerConeAngle: 0.1,
              outerConeAngle: 0.5
            }
          }
        ]
      }
    }
  } as any;

  const lights = parseGLTFLights(gltf);
  t.equal(lights.length, 1, 'one spot light parsed');
  const light = lights[0] as any;
  t.equals(light.type, 'spot');
  t.deepEquals(light.position, [1, 2, 3]);
  t.deepEquals(light.direction, [0, 0, -1]);
  t.deepEquals(light.color, [51, 76.5, 102], 'glTF colors are normalized to luma light range');
  t.equals(light.intensity, 7);
  t.equals(light.innerConeAngle, 0.1);
  t.equals(light.outerConeAngle, 0.5);
  t.equals(light.attenuation[2], 1 / 400);
  t.end();
});

test('gltf#parseGLTFLights - missing extension', t => {
  const gltf: GLTFPostprocessed = {
    nodes: [],
    scenes: []
  } as any;
  const lights = parseGLTFLights(gltf);
  t.equal(lights.length, 0, 'no lights parsed');
  t.end();
});

test('gltf#parseGLTFLights - postprocessed lights with node matrix', t => {
  const gltf: GLTFPostprocessed = {
    nodes: [
      {
        id: 'n3',
        light: 0,
        matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1]
      } as any
    ],
    scenes: [],
    lights: [
      {
        type: 'point',
        intensity: 3
      }
    ]
  } as any;

  const lights = parseGLTFLights(gltf);
  t.equal(lights.length, 1, 'one postprocessed light parsed');
  const light = lights[0] as any;
  t.equals(light.type, 'point');
  t.deepEquals(light.position, [4, 5, 6]);
  t.equals(light.intensity, 3);
  t.end();
});

test('gltf#parseGLTFLights - nested node transforms are resolved in world space', t => {
  const gltf: GLTFPostprocessed = {
    nodes: [
      {
        id: 'parent',
        children: [{id: 'child'} as any],
        rotation: [0, 1, 0, 0],
        translation: [10, 0, 0]
      } as any,
      {
        id: 'child',
        extensions: {KHR_lights_punctual: {light: 0}},
        translation: [1, 2, 3]
      } as any
    ],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [
          {
            type: 'spot',
            color: [1, 1, 1],
            intensity: 4
          }
        ]
      }
    }
  } as any;

  const lights = parseGLTFLights(gltf);
  t.equal(lights.length, 1, 'one nested light parsed');
  const light = lights[0] as any;
  t.equals(light.type, 'spot');
  t.deepEquals(light.position, [9, 2, -3], 'position includes parent rotation and translation');
  t.deepEquals(light.direction, [0, 0, 1], 'direction includes parent rotation');
  t.deepEquals(light.color, [255, 255, 255], 'white glTF light is normalized to 255');
  t.equals(light.intensity, 4);
  t.end();
});
