// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice, ANARIGroup, type ANARIInstance, type ANARISurface} from '@luma.gl/anari';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {NullDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/anari/gltf-to-anari';
import {createANARIJSONScene} from '../../../examples/showcase/anari/playground-scene';

async function loadSimpleSkin() {
  const asset = await readFile(
    new URL('../../../examples/showcase/anari/public/gltf/SimpleSkin.gltf', import.meta.url)
  );
  return postProcessGLTF(await parse(asset, GLTFLoader, {gltf: {loadImages: false}}));
}

test('ANARI imports and animates authored SimpleSkin joint palettes without application setup', async testContext => {
  const source = await loadSimpleSkin();
  const description = await makeANARIJSONSceneFromGLTF(source, 'SIMPLE SKIN');
  const declaredSurface = Object.values(description.surfaces).find(surface => surface.skin);

  testContext.equal(declaredSurface?.skin?.joints.length, 2, 'retains both authored joint nodes');
  testContext.equal(
    declaredSurface?.skin?.inverseBindMatrices?.length,
    32,
    'preserves authored inverse bind matrices'
  );
  testContext.ok(
    ANARISceneSchema.safeParse(description).success,
    'validates portable skin bindings'
  );

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

  testContext.ok(retainedSurface, 'creates a source-owned retained skin surface');
  testContext.ok(scene.animations, 'uses the existing shared animation scene');
  if (retainedSurface && scene.animations) {
    const originalPalette = Array.from(retainedSurface.getParameter('skin')!.jointMatrices);
    const originalVersion = retainedSurface.version;
    scene.animations.seek(0.5);

    testContext.notDeepEqual(
      Array.from(retainedSurface.getParameter('skin')!.jointMatrices),
      originalPalette,
      'animated source joints update the retained mesh-local palette'
    );
    testContext.equal(
      retainedSurface.version,
      originalVersion + 1,
      'commits each surface only once'
    );
    testContext.ok(scene.frame.render().drawCount > 0, 'renders the existing skinned PBR model');
  }

  scene.destroy();
  device.destroy();
  testContext.end();
});

test('ANARI skin schemas reject missing source joints and malformed inverse binds', async testContext => {
  const source = await loadSimpleSkin();
  const description = await makeANARIJSONSceneFromGLTF(source, 'SIMPLE SKIN');
  const skin = Object.values(description.surfaces).find(surface => surface.skin)?.skin;
  if (!skin) {
    testContext.fail('the fixture should expose a retained skin');
    testContext.end();
    return;
  }

  skin.joints = [...skin.joints, 'missing-joint'];
  const result = ANARISceneSchema.safeParse(description);
  testContext.false(result.success, 'rejects unresolved retained joints');
  if (!result.success) {
    testContext.ok(
      result.error.issues.some(issue => issue.path.includes('joints')),
      'identifies the unresolved retained joint'
    );
    testContext.ok(
      result.error.issues.some(issue => issue.path.includes('inverseBindMatrices')),
      'rejects inverse bind palettes whose joint count no longer matches'
    );
  }

  testContext.end();
});
