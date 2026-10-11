// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getRayTracingQualityPreset} from '@luma.gl/experimental';
import {ANARIDevice} from '@luma.gl/scene';
import {NullDevice} from '@luma.gl/test-utils';
import {createANARIJSONScene} from '../../../examples/showcase/scene/playground-scene';
import {getChartLabelPositions} from '../../../examples/showcase/scene/chart-labels';

import {ANARISceneSchema} from '@luma.gl/scene/schemas';
import {expect, it} from 'vitest';
import {
  CHART_BASELINE_DATA,
  makeChartBaseline,
  makeChartMotionScene
} from '../../../examples/showcase/scene/chart-baseline';

it('chart baseline preserves data identities and scene inputs across renderers', () => {
  const rasterScene = makeChartBaseline('default');
  const rayScene = makeChartBaseline('raytrace');
  expect(ANARISceneSchema.safeParse(rasterScene).success).toBe(true);
  expect(ANARISceneSchema.safeParse(rayScene).success).toBe(true);
  const {renderer: rasterRenderer, ...rasterInputs} = rasterScene;
  const {renderer: rayRenderer, ...rayInputs} = rayScene;
  expect(rayInputs).toEqual(rasterInputs);
  expect(rasterRenderer?.exposure).toBe(rayRenderer?.exposure);
  expect(rayRenderer?.adaptiveResolution).toBe(false);
  expect(rayRenderer?.resolutionScale).toBe(1);
  expect(rayRenderer?.temporalReprojection).toBe(false);
  expect(rayRenderer?.progressive).toBe(true);

  const instances = rayScene.instances || [];
  expect(new Set(instances.map(instance => instance['@@id'])).size).toBe(instances.length);
  for (const datum of CHART_BASELINE_DATA) {
    const bar = instances.find(instance => instance['@@id'] === `bar-${datum.identifier}`);
    expect(bar?.position?.[1]).toBe(datum.value / 2);
    expect(bar?.scale?.[1]).toBe(datum.value);
    expect(instances.some(instance => instance['@@id'] === `point-${datum.identifier}`)).toBe(true);
    expect(instances.some(instance => instance['@@id'] === `column-${datum.identifier}`)).toBe(
      true
    );
  }
});

it('quality presets are valid ray settings and keep sampling seeds independent', () => {
  for (const preset of ['interactive', 'still'] as const) {
    const scene = makeChartBaseline('raytrace');
    scene.renderer = {
      ...scene.renderer!,
      ...getRayTracingQualityPreset(preset),
      samplingSeed: 0xffffffff
    };
    expect(ANARISceneSchema.safeParse(scene).success).toBe(true);
    expect(scene.renderer.samplingSeed).toBe(0xffffffff);
    expect(scene.renderer.adaptiveResolution).toBe(preset === 'interactive');
    expect(scene.renderer.temporalReprojection).toBe(preset === 'interactive');
  }
  for (const seed of [-1, 1.5, 0x100000000]) {
    const scene = makeChartBaseline('raytrace');
    scene.renderer!.samplingSeed = seed;
    expect(ANARISceneSchema.safeParse(scene).success).toBe(false);
  }
});

it('animated chart labels follow retained placements with projected WebGPU depth', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const description = makeChartMotionScene();
  expect(ANARISceneSchema.safeParse(description).success).toBe(true);
  const scene = createANARIJSONScene(device, description);
  try {
    scene.update(0);
    const initial = getChartLabelPositions(scene, 640, 480);
    const identities = Array.from(scene.instanceIdentifiers.values());
    scene.update(1);
    const moved = getChartLabelPositions(scene, 640, 480);
    expect(Array.from(moved)).not.toEqual(Array.from(initial));
    expect(Array.from(scene.instanceIdentifiers.values())).toEqual(identities);
    expect(initial).toHaveLength(24);
    for (let index = 0; index < 6; index++) {
      expect(initial[index * 4 + 3]).toBeGreaterThan(0);
      const depth = initial[index * 4 + 2] / initial[index * 4 + 3];
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(1);
    }
  } finally {
    scene.destroy();
    device.destroy();
  }
});
