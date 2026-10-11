// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ANARISceneSchema} from '@luma.gl/scene/schemas';
import {expect, it} from 'vitest';
import {
  CHART_BASELINE_DATA,
  makeChartBaseline
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
