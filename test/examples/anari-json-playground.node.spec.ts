import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {
  getPlaygroundRendererSubtype,
  makePlaygroundRenderer
} from '../../examples/anari/scenes/playground-renderer';
import {expect, it} from 'vitest';
import {ANARIDevice, ANARIGroup} from '@luma.gl/anari';
import {NullDevice} from '@luma.gl/test-utils';
import {PLAYGROUND_PRESETS} from '../../examples/anari/scenes/playground-presets';
import {createANARIJSONScene} from '../../examples/anari/scenes/playground-scene';

it('ANARI JSON presets reproduce the complete showcase scenes', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const expectedInstanceCounts = [312, 429, 318, 19, 19, 19, 19, 19, 21];
  const expectedLightCounts = [3, 5, 5, 1, 1, 1, 1, 1, 1];

  for (const [presetIndex, preset] of PLAYGROUND_PRESETS.entries()) {
    const scene = createANARIJSONScene(device, preset.scene);
    const world = scene.frame.getParameter('world');
    const instances = world?.getParameter('instance');
    const lights = world?.getParameter('light');

    if (!Array.isArray(instances) || !Array.isArray(lights)) {
      throw new Error('JSON scenes must resolve retained instance and light arrays.');
    }

    expect(instances.length, `${preset.label} retains its complete instance population`).toBe(
      expectedInstanceCounts[presetIndex]
    );
    expect(lights.length, `${preset.label} retains its declared real lights`).toBe(
      expectedLightCounts[presetIndex]
    );

    const generatedTriangles = instances.some(instance => {
      const group = instance.getParameter('group');
      if (!(group instanceof ANARIGroup)) {
        return false;
      }
      const surfaces = group.getParameter('surface');
      return Array.isArray(surfaces)
        ? surfaces.some(surface => {
            const subtype = surface.getParameter('geometry')?.subtype;
            return subtype === 'triangle' || subtype === 'hexPrism' || subtype === 'torus';
          })
        : false;
    });

    expect(
      Boolean(generatedTriangles),
      `${preset.label} resolves procedural triangle geometry`
    ).toBe(true);
    scene.update(2.5);
    scene.destroy();
  }

  device.destroy();
  void 0;
});

it('ANARI JSON following lights track animated celestial satellites', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const celestialEngine = createANARIJSONScene(device, PLAYGROUND_PRESETS[2].scene);
  const world = celestialEngine.frame.getParameter('world');
  const instances = world?.getParameter('instance');
  const lights = world?.getParameter('light');

  if (!Array.isArray(instances) || !Array.isArray(lights)) {
    throw new Error('The celestial scene requires resolved instance and light arrays.');
  }

  const orbitingLight = lights.find(light => light.subtype === 'point');
  if (!orbitingLight) {
    throw new Error('The celestial scene requires a real orbiting point light.');
  }

  const initialPosition = orbitingLight.getParameter('position');
  celestialEngine.update(3);
  const updatedPosition = orbitingLight.getParameter('position');

  expect(updatedPosition, 'orbiting lights move with their stars').not.toEqual(initialPosition);
  expect(
    Boolean(
      instances.some(instance => {
        const transform = instance.getParameter('transform');
        return (
          transform &&
          updatedPosition &&
          transform[12] === updatedPosition[0] &&
          transform[13] === updatedPosition[1] &&
          transform[14] === updatedPosition[2]
        );
      })
    ),
    'following lights use the current transform of a retained satellite instance'
  ).toBe(true);

  celestialEngine.destroy();
  device.destroy();
  void 0;
});

it('ANARI JSON scene references fail with actionable errors', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const invalidScene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  invalidScene.surfaces.halo.geometry = 'missing-halo';

  expect(
    () => createANARIJSONScene(device, invalidScene),
    'invalid resource references identify the missing scene object'
  ).toThrow(/Unknown geometry reference "missing-halo"/);

  device.destroy();
  void 0;
});

it('playground renderer switches keep shared settings and remove unsupported settings', () => {
  const scene = structuredClone(PLAYGROUND_PRESETS[3].scene);
  for (const subtype of [
    'default',
    'deferred',
    'debugNormals',
    'debugDepth',
    'raytrace'
  ] as const) {
    const renderer = makePlaygroundRenderer(scene.renderer, subtype);
    expect(ANARISceneSchema.safeParse({...scene, renderer}).success).toBe(true);
    expect(renderer.background).toEqual(scene.renderer?.background);
    expect(renderer['@@type']).toBe(subtype);
    expect(renderer.samplesPerPixel).toBe(
      subtype === 'raytrace' ? scene.renderer?.samplesPerPixel : undefined
    );
    expect(renderer.resolutionScale).toBe(
      subtype === 'raytrace' ? scene.renderer?.resolutionScale : undefined
    );
  }
});

it('playground rejects unsupported JSON renderers before creating a WebGL scene', () => {
  for (const subtype of ['raytrace', 'deferred'] as const) {
    expect(() => getPlaygroundRendererSubtype({'@@type': subtype}, false)).toThrow(
      'requires WebGPU'
    );
    expect(getPlaygroundRendererSubtype({'@@type': subtype}, true)).toBe(subtype);
  }
  for (const subtype of ['default', 'debugNormals', 'debugDepth'] as const) {
    expect(getPlaygroundRendererSubtype({'@@type': subtype}, false)).toBe(subtype);
  }
  expect(getPlaygroundRendererSubtype(undefined, false)).toBe('default');
});
