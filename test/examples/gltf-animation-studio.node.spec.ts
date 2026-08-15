// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARISceneSchema} from '@luma.gl/scene/schemas';
import {createGLTFAnimatedCrowd, createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../examples/showcase/scene/gltf-to-anari';
import {
  GLTFAnimationStudio,
  getGLTFStudioCameraState
} from '../../examples/showcase/gltf/gltf-animation-studio';
import {getGLTFReferenceLedger} from '../../examples/showcase/gltf/gltf-reference-ledger';
import {
  GLTF_STUDIO_ASSETS,
  ROBOT_EXPRESSIVE_SOURCE_REVISION,
  getGLTFStudioAsset
} from '../../examples/showcase/gltf/gltf-studio-assets';

const ROBOT_PATH = new URL(
  '../../examples/showcase/scene/public/gltf/RobotExpressive.glb',
  import.meta.url
);

async function loadExpressiveRobot() {
  const bytes = await readFile(ROBOT_PATH);
  return postProcessGLTF(await parse(bytes, GLTFLoader, {gltf: {loadImages: false}}));
}

describe('curated glTF Animation Studio', () => {
  test('vendors the pinned reusable robot with authored clips, skins, and facial targets', async () => {
    const bytes = await readFile(ROBOT_PATH);
    const robot = await loadExpressiveRobot();

    expect(bytes.byteLength).toBe(463988);
    expect(ROBOT_EXPRESSIVE_SOURCE_REVISION).toMatch(/^[0-9a-f]{40}$/);
    expect(robot.animations).toHaveLength(14);
    expect(robot.animations.map(animation => animation.name)).toEqual(
      expect.arrayContaining(['Dance', 'Idle', 'Running', 'Walking', 'Wave'])
    );
    expect(robot.skins?.map(skin => skin.joints.length)).toEqual([43, 43]);
    const face = robot.nodes.find(node => node.name === 'Head' && node.mesh);
    expect(face?.mesh?.extras?.['targetNames']).toEqual(['Angry', 'Surprised', 'Sad']);
  });

  test('composes public clip, loop, speed, seek, skin, and morph APIs', async () => {
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

  test('controls independently animated crowd actors without taking renderer ownership', async () => {
    const source = await loadExpressiveRobot();
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 2});
    const [walker, dancer] = crowd.addActors([
      {id: 'walker', clip: 'Walking', phase: 0.1},
      {id: 'dancer', clip: 'Dance', phase: 0.5}
    ]);
    const studio = new GLTFAnimationStudio();

    try {
      studio.attach(crowd.scenegraphs);
      studio.attachCrowd(crowd);
      studio.selectActor(1);
      studio.setCrossFadeDuration(0.2);
      studio.selectClip('Running');
      studio.setSpeed(1.75);
      studio.setLoop('once');
      studio.seek(0.3);

      expect(studio.getState()).toEqual(
        expect.objectContaining({
          selectedActorIndex: 1,
          selectedClip: 'Running',
          speed: 1.75
        })
      );
      expect(walker.activeClip).toBe('Walking');
      expect(walker.speed).toBe(1);
      expect(dancer.activeClip).toBe('Running');
      expect(dancer.time).toBeCloseTo(0.3);
      expect(dancer.mixer.getAction('Running')?.loop).toBe('once');

      studio.setPlaying(false);
      expect(walker.playing).toBe(true);
      expect(dancer.playing).toBe(false);
    } finally {
      studio.detach();
      crowd.destroy();
      device.destroy();
    }
  });

  test('uses authored projection and the camera node world transform', async () => {
    const device = new NullDevice({});
    const source = postProcessGLTF(
      await parse(
        new TextEncoder().encode(
          JSON.stringify({
            asset: {version: '2.0'},
            scene: 0,
            scenes: [{nodes: [0]}],
            meshes: [],
            nodes: [{name: 'Studio Camera Node', camera: 0, translation: [1, 2, 3]}],
            cameras: [
              {
                name: 'Studio Camera',
                type: 'perspective',
                perspective: {yfov: Math.PI / 4, aspectRatio: 2, znear: 0.2, zfar: 50}
              }
            ]
          })
        ),
        GLTFLoader,
        {gltf: {loadImages: false}}
      )
    );
    const scenegraphs = createScenegraphsFromGLTF(device, source);

    try {
      const cameraState = getGLTFStudioCameraState(scenegraphs, 0, {
        aspect: 1,
        near: 0.01,
        far: 100
      });

      expect(cameraState?.position).toEqual([1, 2, 3]);
      expect(cameraState?.viewMatrix[12]).toBeCloseTo(-1);
      expect(cameraState?.viewMatrix[13]).toBeCloseTo(-2);
      expect(cameraState?.viewMatrix[14]).toBeCloseTo(-3);
      expect(cameraState?.projectionMatrix[0]).toBeCloseTo(1 / (2 * Math.tan(Math.PI / 8)));
    } finally {
      for (const scene of scenegraphs.scenes) {
        scene.destroy();
      }
      device.destroy();
    }
  });

  test('derives compatibility labels and provenance from the landed reference ledger', () => {
    const ledgerEntries = new Map(
      getGLTFReferenceLedger().extensions.map(extension => [extension.extensionName, extension])
    );

    expect(new Set(GLTF_STUDIO_ASSETS.map(asset => asset.name)).size).toBe(
      GLTF_STUDIO_ASSETS.length
    );
    expect(GLTF_STUDIO_ASSETS.every(asset => asset.license === 'CC0-1.0')).toBe(true);
    expect(GLTF_STUDIO_ASSETS.map(asset => asset.name)).toEqual(
      expect.arrayContaining([
        'RobotExpressive',
        'PotOfCoalsAnimationPointer',
        'SimpleSkinLOD',
        'SimpleInstancing',
        'DiffuseTransmissionPlant',
        'ScatteringSkull'
      ])
    );

    for (const asset of GLTF_STUDIO_ASSETS.filter(asset => asset.name !== 'RobotExpressive')) {
      expect(asset.features.length).toBeGreaterThan(0);
      for (const feature of asset.features) {
        const ledgerEntry = ledgerEntries.get(feature.extensionName);
        expect(feature).toEqual({
          extensionName: ledgerEntry?.extensionName,
          supportLevel: ledgerEntry?.supportLevel,
          standardStatus: ledgerEntry?.standardStatus,
          supported: ledgerEntry?.supported
        });
        expect(ledgerEntry?.positiveFixture?.model.name).toBe(asset.name);
        expect(asset.licenseLocation).toBe(ledgerEntry?.positiveFixture?.licenseLocation);
        expect(asset.sourceRevision).toBe(ledgerEntry?.positiveFixture?.sourceRevision);
      }
    }

    expect(getGLTFStudioAsset('RobotExpressive')).toEqual(
      expect.objectContaining({
        source: 'three.js',
        sourceRevision: ROBOT_EXPRESSIVE_SOURCE_REVISION
      })
    );
  });

  test('imports robot clips and skins through the retained ANARI showcase', async () => {
    const source = await loadExpressiveRobot();
    const retainedScene = await makeANARIJSONSceneFromGLTF(source, 'EXPRESSIVE ROBOT');
    const skinSurfaces = Object.values(retainedScene.surfaces).filter(surface => surface.skin);

    expect(retainedScene.clips).toHaveLength(14);
    expect(skinSurfaces.length).toBeGreaterThan(1);
    expect(skinSurfaces.every(surface => surface.skin?.joints.length === 43)).toBe(true);
    expect(ANARISceneSchema.safeParse(retainedScene).success).toBe(true);
  });

  test('surfaces licensed animation samples and binary export in the retained-scene tools', async () => {
    const samples = await readFile(
      new URL('../../examples/showcase/scene/usd-samples.ts', import.meta.url),
      'utf8'
    );
    const playground = await readFile(
      new URL('../../examples/showcase/scene/playground.html', import.meta.url),
      'utf8'
    );
    const license = await readFile(
      new URL('../../examples/showcase/scene/public/gltf/ASSET-LICENSE.md', import.meta.url),
      'utf8'
    );

    for (const assetName of ['RobotExpressive.glb', 'AnimatedMorphCube.glb', 'SimpleSkin.gltf']) {
      expect(samples).toContain(assetName);
      expect(license).toContain(assetName);
    }
    expect(license).toContain(ROBOT_EXPRESSIVE_SOURCE_REVISION);
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
