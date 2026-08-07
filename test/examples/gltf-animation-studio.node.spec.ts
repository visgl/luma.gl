// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../examples/showcase/anari/gltf-to-anari';
import {GLTFAnimationStudio} from '../../examples/showcase/gltf/gltf-animation-studio';
import {
  GLTF_FEATURED_ASSETS,
  getBundledGLTFAssetUrl,
  getFeaturedGLTFAsset
} from '../../examples/showcase/gltf/gltf-featured-assets';

const ROBOT_PATH = new URL(
  '../../examples/showcase/anari/public/gltf/RobotExpressive.glb',
  import.meta.url
);

async function loadExpressiveRobot() {
  const bytes = await readFile(ROBOT_PATH);
  return postProcessGLTF(await parse(bytes, GLTFLoader, {gltf: {loadImages: false}}));
}

describe('curated glTF Animation Studio', () => {
  test('vendors the real reusable robot with authored clips, skins, and facial targets', async () => {
    const bytes = await readFile(ROBOT_PATH);
    const robot = await loadExpressiveRobot();

    expect(bytes.byteLength).toBe(463988);
    expect(robot.animations).toHaveLength(14);
    expect(robot.animations.map(animation => animation.name)).toEqual(
      expect.arrayContaining(['Dance', 'Idle', 'Running', 'Walking', 'Wave'])
    );
    expect(robot.skins?.map(skin => skin.joints.length)).toEqual([43, 43]);
    const face = robot.nodes.find(node => node.name === 'Head' && node.mesh);
    expect(face?.mesh?.extras?.['targetNames']).toEqual(['Angry', 'Surprised', 'Sad']);
  });

  test('drives real named clip transitions, loops, speed, seek, skin palettes, and facial morphs', async () => {
    const source = await loadExpressiveRobot();
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    const studio = new GLTFAnimationStudio();

    try {
      studio.attach(scenegraphs);
      expect(studio.getState()).toEqual(
        expect.objectContaining({
          selectedClip: 'Idle',
          skinCount: 2,
          jointCount: 86,
          playing: true
        })
      );
      expect(studio.getState().clipNames).toHaveLength(14);
      expect(studio.getState().morphTargets.map(target => target.label)).toEqual([
        'Angry',
        'Surprised',
        'Sad'
      ]);

      studio.setCrossFadeDuration(0.4);
      studio.selectClip('Walking');
      studio.update(0);
      studio.update(250);
      const firstTime = studio.getState().time;
      expect(firstTime).toBeGreaterThan(0);

      studio.setSpeed(2);
      studio.update(500);
      expect(studio.getState().time).toBeGreaterThan(firstTime);
      expect(scenegraphs.animator.mixer.timeScale).toBe(2);

      studio.setLoop('ping-pong');
      expect(scenegraphs.animator.mixer.getAction('Walking')?.loop).toBe('ping-pong');
      studio.seek(0.15);
      expect(studio.getState().time).toBeCloseTo(0.15, 4);

      const face = studio.getState().morphTargets[0];
      studio.setMorphWeight(face.identifier, 0.75);
      const faceNode = scenegraphs.gltfNodeIndexToNodeMap.get(face.nodeIndex);
      expect(faceNode?.userData['morphWeights']).toEqual([0.75, 0, 0]);

      studio.setPlaying(false);
      const pausedTime = studio.getState().time;
      studio.update(750);
      expect(studio.getState().time).toBe(pausedTime);

      studio.detach();
      expect(studio.getState().clipNames).toEqual([]);
    } finally {
      for (const scene of scenegraphs.scenes) {
        scene.destroy();
      }
      device.destroy();
    }
  });

  test('imports all real robot clips and skin palettes through the retained ANARI showcase', async () => {
    const source = await loadExpressiveRobot();
    const retainedScene = await makeANARIJSONSceneFromGLTF(source, 'EXPRESSIVE ROBOT');
    const skinSurfaces = Object.values(retainedScene.surfaces).filter(surface => surface.skin);

    expect(retainedScene.clips).toHaveLength(14);
    expect(skinSurfaces.length).toBeGreaterThan(1);
    expect(skinSurfaces.every(surface => surface.skin?.joints.length === 43)).toBe(true);
    expect(ANARISceneSchema.safeParse(retainedScene).success).toBe(true);
  });

  test('keeps the complete curated collection explicitly CC0 and resolves website base paths', () => {
    expect(GLTF_FEATURED_ASSETS.every(asset => asset.license === 'CC0-1.0')).toBe(true);
    expect(GLTF_FEATURED_ASSETS.map(asset => asset.name)).toEqual(
      expect.arrayContaining([
        'RobotExpressive',
        'AnimatedMorphCube',
        'SimpleSkin',
        'SimpleInstancing',
        'DiffuseTransmissionTeacup',
        'ScatteringSkull'
      ])
    );

    const robot = getFeaturedGLTFAsset('RobotExpressive');
    expect(robot).toBeDefined();
    expect(
      getBundledGLTFAssetUrl(
        robot!,
        {
          href: 'https://luma.gl/luma.gl/examples/showcase/gltf',
          pathname: '/luma.gl/examples/showcase/gltf'
        },
        true
      )
    ).toBe('https://luma.gl/luma.gl/standalone-examples/anari/gltf/RobotExpressive.glb');
    expect(
      getBundledGLTFAssetUrl(robot!, {href: 'http://localhost:5173/', pathname: '/'}, false)
    ).toContain('raw.githubusercontent.com/mrdoob/three.js/');
  });

  test('surfaces bundled skeletal, morph, and robot samples in both retained-scene surfaces', async () => {
    const samples = await readFile(
      new URL('../../examples/showcase/anari/usd-samples.ts', import.meta.url),
      'utf8'
    );
    const playground = await readFile(
      new URL('../../examples/showcase/anari/playground.html', import.meta.url),
      'utf8'
    );
    const license = await readFile(
      new URL('../../examples/showcase/anari/public/gltf/ASSET-LICENSE.md', import.meta.url),
      'utf8'
    );

    for (const assetName of ['RobotExpressive.glb', 'AnimatedMorphCube.glb', 'SimpleSkin.gltf']) {
      expect(samples).toContain(assetName);
      expect(license).toContain(assetName);
    }
    expect(license).toContain('CC0');
    expect(playground).toContain('id="export-glb"');
  });

  test('provides the settings host when Animation Studio runs outside the website shell', async () => {
    const standaloneStudio = await readFile(
      new URL('../../examples/showcase/gltf/index.html', import.meta.url),
      'utf8'
    );

    expect(standaloneStudio).toContain('<title>glTF Animation Studio</title>');
    expect(standaloneStudio).toContain('aria-label="glTF Animation Studio controls"');
    expect(standaloneStudio).toContain('data-info-box-appearance="cinematic"');
    expect(standaloneStudio).toContain('id="example-panel-host" data-example-panel-host');
  });
});
