// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice, ANARIGroup, type ANARIInstance, type ANARISurface} from '@luma.gl/scene';
import {ANARISceneSchema} from '@luma.gl/scene/schemas';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/scene/gltf-to-anari';
import {createANARIJSONScene} from '../../../examples/showcase/scene/playground-scene';

async function loadSimpleSkin() {
  const asset = await readFile(
    new URL('../../../examples/showcase/scene/public/gltf/SimpleSkin.gltf', import.meta.url)
  );
  return postProcessGLTF(await parse(asset, GLTFLoader, {gltf: {loadImages: false}}));
}

it('ANARI imports and animates authored SimpleSkin joint palettes without application setup', async () => {
  const source = await loadSimpleSkin();
  const description = await makeANARIJSONSceneFromGLTF(source, 'SIMPLE SKIN');
  const declaredSurface = Object.values(description.surfaces).find(surface => surface.skin);

  expect(declaredSurface?.skin?.joints.length, 'retains both authored joint nodes').toBe(2);
  expect(
    declaredSurface?.skin?.inverseBindMatrices?.length,
    'preserves authored inverse bind matrices'
  ).toBe(32);
  expect(
    Boolean(ANARISceneSchema.safeParse(description).success),
    'validates portable skin bindings'
  ).toBe(true);

  if (description.renderer) {
    description.renderer.bloomIntensity = 0;
  }
  const device = new ANARIDevice(new NullDevice({}));
  const scene = createANARIJSONScene(device, description);
  const instances = scene.frame
    .getParameter('world')!
    .getParameter('instance') as readonly ANARIInstance[];
  let retainedSurface: ANARISurface | undefined;

  for (const instance of instances) {
    const group = instance.getParameter('group');
    if (!(group instanceof ANARIGroup)) {
      continue;
    }
    for (const surface of group.getParameter('surface') || []) {
      if (surface.getParameter('skin')) {
        retainedSurface = surface;
      }
    }
  }

  expect(Boolean(retainedSurface), 'creates a source-owned retained skin surface').toBe(true);
  expect(Boolean(scene.animations), 'uses the existing shared animation scene').toBe(true);
  if (retainedSurface && scene.animations) {
    const originalPalette = Array.from(retainedSurface.getParameter('skin')!.jointMatrices);
    const originalVersion = retainedSurface.version;
    scene.animations.seek(0.5);

    expect(
      Array.from(retainedSurface.getParameter('skin')!.jointMatrices),
      'animated source joints update the retained mesh-local palette'
    ).not.toEqual(originalPalette);
    expect(retainedSurface.version, 'commits each surface only once').toBe(originalVersion + 1);
    expect(
      Boolean(scene.frame.render().drawCount > 0),
      'renders the existing skinned PBR model'
    ).toBe(true);
  }

  scene.destroy();
  device.destroy();
  void 0;
});

it('ANARI skin schemas reject missing source joints and malformed inverse binds', async () => {
  const source = await loadSimpleSkin();
  const description = await makeANARIJSONSceneFromGLTF(source, 'SIMPLE SKIN');
  const skin = Object.values(description.surfaces).find(surface => surface.skin)?.skin;
  if (!skin) {
    expect(false, 'the fixture should expose a retained skin').toBe(true);
    void 0;
    return;
  }

  skin.joints = [...skin.joints, 'missing-joint'];
  const result = ANARISceneSchema.safeParse(description);
  expect(Boolean(result.success), 'rejects unresolved retained joints').toBe(false);
  if (!result.success) {
    expect(
      Boolean(result.error.issues.some(issue => issue.path.includes('joints'))),
      'identifies the unresolved retained joint'
    ).toBe(true);
    expect(
      Boolean(result.error.issues.some(issue => issue.path.includes('inverseBindMatrices'))),
      'rejects inverse bind palettes whose joint count no longer matches'
    ).toBe(true);
  }

  void 0;
});
