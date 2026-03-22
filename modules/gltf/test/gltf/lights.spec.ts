import {expect, test} from 'vitest';
import { parseGLTFLights } from '@luma.gl/gltf/parsers/parse-gltf-lights';
import type { GLTFPostprocessed } from '@loaders.gl/gltf';
test('gltf#parseGLTFLights - directional', () => {
  const gltf: GLTFPostprocessed = {
    nodes: [{
      id: 'n1',
      extensions: {
        KHR_lights_punctual: {
          light: 0
        }
      },
      rotation: [0, 0, 0, 1]
    } as any],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [{
          type: 'directional',
          color: [0.2, 0.3, 0.4],
          intensity: 2
        }]
      }
    }
  } as any;
  const lights = parseGLTFLights(gltf);
  expect(lights.length, 'one light parsed').toBe(1);
  const light = lights[0] as any;
  expect(light.type).toBe('directional');
  expect(light.color, 'glTF colors are normalized to luma light range').toEqual([51, 76.5, 102]);
  expect(light.intensity).toBe(2);
});
test('gltf#parseGLTFLights - point', () => {
  const gltf: GLTFPostprocessed = {
    nodes: [{
      id: 'n2',
      extensions: {
        KHR_lights_punctual: {
          light: 0
        }
      },
      translation: [1, 2, 3]
    } as any],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [{
          type: 'point',
          intensity: 5,
          range: 10
        }]
      }
    }
  } as any;
  const lights = parseGLTFLights(gltf);
  expect(lights.length, 'one light parsed').toBe(1);
  const light = lights[0] as any;
  expect(light.type).toBe('point');
  expect(light.position).toEqual([1, 2, 3]);
  expect(light.intensity).toBe(5);
  expect(light.attenuation[2]).toBe(1 / 100);
});
test('gltf#parseGLTFLights - spot', () => {
  const gltf: GLTFPostprocessed = {
    nodes: [{
      id: 'n-spot',
      extensions: {
        KHR_lights_punctual: {
          light: 0
        }
      },
      translation: [1, 2, 3],
      rotation: [0, 0, 0, 1]
    } as any],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [{
          type: 'spot',
          color: [0.2, 0.3, 0.4],
          intensity: 7,
          range: 20,
          spot: {
            innerConeAngle: 0.1,
            outerConeAngle: 0.5
          }
        }]
      }
    }
  } as any;
  const lights = parseGLTFLights(gltf);
  expect(lights.length, 'one spot light parsed').toBe(1);
  const light = lights[0] as any;
  expect(light.type).toBe('spot');
  expect(light.position).toEqual([1, 2, 3]);
  expect(light.direction).toEqual([0, 0, -1]);
  expect(light.color, 'glTF colors are normalized to luma light range').toEqual([51, 76.5, 102]);
  expect(light.intensity).toBe(7);
  expect(light.innerConeAngle).toBe(0.1);
  expect(light.outerConeAngle).toBe(0.5);
  expect(light.attenuation[2]).toBe(1 / 400);
});
test('gltf#parseGLTFLights - missing extension', () => {
  const gltf: GLTFPostprocessed = {
    nodes: [],
    scenes: []
  } as any;
  const lights = parseGLTFLights(gltf);
  expect(lights.length, 'no lights parsed').toBe(0);
});
test('gltf#parseGLTFLights - postprocessed lights with node matrix', () => {
  const gltf: GLTFPostprocessed = {
    nodes: [{
      id: 'n3',
      light: 0,
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1]
    } as any],
    scenes: [],
    lights: [{
      type: 'point',
      intensity: 3
    }]
  } as any;
  const lights = parseGLTFLights(gltf);
  expect(lights.length, 'one postprocessed light parsed').toBe(1);
  const light = lights[0] as any;
  expect(light.type).toBe('point');
  expect(light.position).toEqual([4, 5, 6]);
  expect(light.intensity).toBe(3);
});
test('gltf#parseGLTFLights - nested node transforms are resolved in world space', () => {
  const gltf: GLTFPostprocessed = {
    nodes: [{
      id: 'parent',
      children: [{
        id: 'child'
      } as any],
      rotation: [0, 1, 0, 0],
      translation: [10, 0, 0]
    } as any, {
      id: 'child',
      extensions: {
        KHR_lights_punctual: {
          light: 0
        }
      },
      translation: [1, 2, 3]
    } as any],
    scenes: [],
    extensions: {
      KHR_lights_punctual: {
        lights: [{
          type: 'spot',
          color: [1, 1, 1],
          intensity: 4
        }]
      }
    }
  } as any;
  const lights = parseGLTFLights(gltf);
  expect(lights.length, 'one nested light parsed').toBe(1);
  const light = lights[0] as any;
  expect(light.type).toBe('spot');
  expect(light.position, 'position includes parent rotation and translation').toEqual([9, 2, -3]);
  expect(light.direction, 'direction includes parent rotation').toEqual([0, 0, 1]);
  expect(light.color, 'white glTF light is normalized to 255').toEqual([255, 255, 255]);
  expect(light.intensity).toBe(4);
});
