import test from 'tape-promise/tape';
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
  t.deepEquals(light.color, [0.2, 0.3, 0.4]);
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

test('gltf#parseGLTFLights - missing extension', t => {
  const gltf: GLTFPostprocessed = {
    nodes: [],
    scenes: []
  } as any;
  const lights = parseGLTFLights(gltf);
  t.equal(lights.length, 0, 'no lights parsed');
  t.end();
});
