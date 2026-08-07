// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture} from '@luma.gl/core';
import {
  type ANARICamera,
  ANARIDevice,
  type ANARIFrame,
  type ANARIGeometry,
  type ANARIGroup,
  type ANARIInstance,
  type ANARILight,
  type ANARIMaterial,
  type ANARIRenderer,
  type ANARISurface,
  type ANARIWorld
} from '@luma.gl/anari';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';
import {ANARISceneAdapter} from '../src/anari-scene-adapter';

type CachedSceneFixture = {
  graphicsDevice: NullDevice;
  device: ANARIDevice;
  adapter: ANARISceneAdapter;
  geometry: ANARIGeometry;
  material: ANARIMaterial;
  surface: ANARISurface;
  light: ANARILight;
  group: ANARIGroup;
  instances: [ANARIInstance, ANARIInstance];
  world: ANARIWorld;
  camera: ANARICamera;
  renderer: ANARIRenderer;
  frame: ANARIFrame;
};

describe('ANARI retained scene adapter caching', () => {
  test('retains scene, lights, materials, and analytic primitives across camera-only commits', () => {
    const fixture = createCachedSceneFixture();

    try {
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(initialOptions).not.toBeNull();
      const initialPrimitives = fixture.adapter.getAnalyticPrimitives(fixture.world);
      const initialRevision = fixture.device.getSceneCommitRevision();
      const camera = fixture.frame.getParameter('camera');
      camera?.setParameter('position', [0, 1, 7]).commitParameters();
      fixture.renderer.setParameter('exposure', 1.7).commitParameters();
      fixture.frame.setParameter('size', [48, 24]).commitParameters();

      const updatedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(fixture.device.getSceneCommitRevision()).toBe(initialRevision);
      expect(updatedOptions?.surfaces).toBe(initialOptions?.surfaces);
      expect(updatedOptions?.surfaces[0]).toBe(initialOptions?.surfaces[0]);
      expect(updatedOptions?.surfaces[0]?.material).toBe(initialOptions?.surfaces[0]?.material);
      expect(updatedOptions?.lights).toBe(initialOptions?.lights);
      expect(updatedOptions?.sceneRevisions).toEqual(initialOptions?.sceneRevisions);
      expect(fixture.adapter.getAnalyticPrimitives(fixture.world)).toBe(initialPrimitives);
      expect(updatedOptions?.width).toBe(48);
      expect(updatedOptions?.height).toBe(24);
      expect(updatedOptions?.exposure).toBe(1.7);
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('updates only committed instance placements and publishes exact stable dirty identifiers', () => {
    const fixture = createCachedSceneFixture();

    try {
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const initialSurface = initialOptions?.surfaces[0];
      const initialSecondTransform = initialSurface?.transforms[1];
      const initialRevisions = initialOptions?.sceneRevisions;
      const changedTransform = new Matrix4().translate([3, 2, 1]);
      fixture.instances[0].setParameter('transform', changedTransform);

      const stagedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(stagedOptions?.surfaces).toBe(initialOptions?.surfaces);
      expect(stagedOptions?.sceneRevisions).toEqual(initialRevisions);

      fixture.instances[0].commitParameters();
      const updatedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const expectedPlacementIdentifier = initialSurface?.instanceIds?.[0];

      expect(updatedOptions?.surfaces).toBe(initialOptions?.surfaces);
      expect(updatedOptions?.surfaces[0]).toBe(initialSurface);
      expect(updatedOptions?.surfaces[0]?.transforms[0]).toBe(changedTransform);
      expect(updatedOptions?.surfaces[0]?.transforms[1]).toBe(initialSecondTransform);
      expect(updatedOptions?.lights).toBe(initialOptions?.lights);
      expect(updatedOptions?.sceneRevisions?.topology).toBe(initialRevisions?.topology);
      expect(updatedOptions?.sceneRevisions?.materials).toBe(initialRevisions?.materials);
      expect(updatedOptions?.sceneRevisions?.lights).toBe(initialRevisions?.lights);
      expect(updatedOptions?.sceneRevisions?.transforms).toBe(
        (initialRevisions?.transforms ?? 0) + 1
      );
      expect(updatedOptions?.sceneRevisions?.dirtyInstanceIds).toEqual([
        expectedPlacementIdentifier
      ]);
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('publishes every distinct stable placement for one instance shared by multiple surfaces', () => {
    const fixture = createCachedSceneFixture();

    try {
      const anotherSurface = fixture.device.newSurface({
        geometry: fixture.geometry,
        material: fixture.material
      });
      fixture.group.setParameter('surface', [fixture.surface, fixture.surface, anotherSurface]);
      fixture.group.commitParameters();
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const expectedIdentifiers = initialOptions?.surfaces.flatMap(surface =>
        (surface.instanceIds ?? []).filter(identifier =>
          identifier.startsWith(`${fixture.instances[0].id}:`)
        )
      );

      fixture.instances[0]
        .setParameter('transform', new Matrix4().translate([4, 0, 0]))
        .commitParameters();
      const updatedOptions = fixture.adapter.makeRenderOptions(fixture.frame);

      expect(expectedIdentifiers).toHaveLength(3);
      expect(updatedOptions?.sceneRevisions?.dirtyInstanceIds).toEqual(expectedIdentifiers);
      expect(new Set(updatedOptions?.sceneRevisions?.dirtyInstanceIds).size).toBe(3);
      expect(updatedOptions?.surfaces).toBe(initialOptions?.surfaces);
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('assigns unique stable placement identifiers to repeated identical instance handles', () => {
    const fixture = createCachedSceneFixture();

    try {
      fixture.world
        .setParameter('instance', [fixture.instances[0], fixture.instances[0]])
        .commitParameters();
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const baseIdentifier = `${fixture.instances[0].id}:${fixture.group.id}:${fixture.surface.id}`;
      expect(initialOptions?.surfaces[0]?.instanceIds).toEqual([
        baseIdentifier,
        `${baseIdentifier}:1`
      ]);

      fixture.instances[0]
        .setParameter('transform', new Matrix4().translate([5, 0, 0]))
        .commitParameters();
      const updatedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(updatedOptions?.sceneRevisions?.dirtyInstanceIds).toEqual([
        baseIdentifier,
        `${baseIdentifier}:1`
      ]);
      expect(updatedOptions?.surfaces[0]?.transforms[0]).toBe(
        updatedOptions?.surfaces[0]?.transforms[1]
      );
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('updates only affected normalized materials and shared sampler dependencies', () => {
    const fixture = createCachedSceneFixture();
    const image = fixture.graphicsDevice.createTexture({
      id: 'cached-material-image',
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      usage: Texture.SAMPLE
    });

    try {
      const sampler = fixture.device.newSampler('image2D', {image, textureCoordinateSet: 0});
      fixture.material.setParameter('baseColorTexture', sampler).commitParameters();
      const anotherMaterial = fixture.device.newMaterial('matte', {color: [0.2, 0.3, 0.4]});
      const anotherSurface = fixture.device.newSurface({
        geometry: fixture.geometry,
        material: anotherMaterial
      });
      fixture.group.setParameter('surface', [fixture.surface, anotherSurface]).commitParameters();
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const firstMaterial = initialOptions?.surfaces[0]?.material;
      const secondMaterial = initialOptions?.surfaces[1]?.material;
      const initialRevisions = initialOptions?.sceneRevisions;

      fixture.material.setParameter('roughness', 0.8).commitParameters();
      const materialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(materialOptions?.surfaces).toBe(initialOptions?.surfaces);
      expect(materialOptions?.surfaces[0]?.material).not.toBe(firstMaterial);
      expect(materialOptions?.surfaces[1]?.material).toBe(secondMaterial);
      expect(materialOptions?.surfaces[0]?.material.uniforms?.metallicRoughnessValues?.[1]).toBe(
        0.8
      );
      expect(materialOptions?.sceneRevisions?.topology).toBe(initialRevisions?.topology);
      expect(materialOptions?.sceneRevisions?.transforms).toBe(initialRevisions?.transforms);
      expect(materialOptions?.sceneRevisions?.lights).toBe(initialRevisions?.lights);
      expect(materialOptions?.sceneRevisions?.materials).toBe(
        (initialRevisions?.materials ?? 0) + 1
      );

      const previousSamplerMaterial = materialOptions?.surfaces[0]?.material;
      sampler.setParameter('textureCoordinateSet', 1).commitParameters();
      const samplerOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(samplerOptions?.surfaces[0]?.material).not.toBe(previousSamplerMaterial);
      expect(samplerOptions?.surfaces[0]?.material.uniforms?.baseColorUVSet).toBe(1);
      expect(samplerOptions?.surfaces[1]?.material).toBe(secondMaterial);
      expect(samplerOptions?.sceneRevisions?.materials).toBe(
        (initialRevisions?.materials ?? 0) + 2
      );
    } finally {
      image.destroy();
      destroyCachedSceneFixture(fixture);
    }
  });

  test('invalidates lights independently for emitter commits and renderer ambient changes', () => {
    const fixture = createCachedSceneFixture();

    try {
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      fixture.light.setParameter('intensity', 7).commitParameters();
      const changedLightOptions = fixture.adapter.makeRenderOptions(fixture.frame);

      expect(changedLightOptions?.surfaces).toBe(initialOptions?.surfaces);
      expect(changedLightOptions?.lights).not.toBe(initialOptions?.lights);
      expect(changedLightOptions?.lights?.[1]?.intensity).toBe(7);
      expect(changedLightOptions?.sceneRevisions?.topology).toBe(
        initialOptions?.sceneRevisions?.topology
      );
      expect(changedLightOptions?.sceneRevisions?.lights).toBe(
        (initialOptions?.sceneRevisions?.lights ?? 0) + 1
      );

      const sceneCommitRevision = fixture.device.getSceneCommitRevision();
      fixture.renderer.setParameter('ambientRadiance', 0.45).commitParameters();
      const ambientOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(fixture.device.getSceneCommitRevision()).toBe(sceneCommitRevision);
      expect(ambientOptions?.surfaces).toBe(initialOptions?.surfaces);
      expect(ambientOptions?.lights?.[0]?.intensity).toBe(0.45);
      expect(ambientOptions?.sceneRevisions?.lights).toBe(
        (initialOptions?.sceneRevisions?.lights ?? 0) + 2
      );
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('updates committed light-array membership without rebuilding placement topology', () => {
    const fixture = createCachedSceneFixture();

    try {
      const lightArray = fixture.device.newArray({data: [fixture.light]});
      fixture.world.setParameter('light', lightArray).commitParameters();
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const anotherLight = fixture.device.newLight('directional', {
        direction: [0, -1, 0],
        intensity: 2
      });

      lightArray.setParameter('data', [fixture.light, anotherLight]).commitParameters();
      const updatedOptions = fixture.adapter.makeRenderOptions(fixture.frame);

      expect(updatedOptions?.surfaces).toBe(initialOptions?.surfaces);
      expect(updatedOptions?.lights).toHaveLength(3);
      expect(updatedOptions?.sceneRevisions?.topology).toBe(
        initialOptions?.sceneRevisions?.topology
      );
      expect(updatedOptions?.sceneRevisions?.lights).toBe(
        (initialOptions?.sceneRevisions?.lights ?? 0) + 1
      );

      anotherLight.setParameter('intensity', 9).commitParameters();
      const changedAddedLight = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(changedAddedLight?.surfaces).toBe(initialOptions?.surfaces);
      expect(changedAddedLight?.lights?.[2]?.intensity).toBe(9);
      expect(changedAddedLight?.sceneRevisions?.lights).toBe(
        (initialOptions?.sceneRevisions?.lights ?? 0) + 2
      );

      lightArray.setParameter('data', [anotherLight]).commitParameters();
      const removedLight = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(removedLight?.lights).toHaveLength(2);
      fixture.light.setParameter('intensity', 13).commitParameters();
      const unrelatedLight = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(unrelatedLight?.lights).toBe(removedLight?.lights);
      expect(unrelatedLight?.sceneRevisions?.lights).toBe(removedLight?.sceneRevisions?.lights);
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('rebuilds geometry after committed attribute and index array changes without geometry commits', () => {
    const fixture = createCachedSceneFixture();

    try {
      const positionArray = fixture.device.newArray({
        data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
      });
      const normalArray = fixture.device.newArray({
        data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])
      });
      const indexArray = fixture.device.newArray({data: new Uint16Array([0, 1, 2])});
      const geometry = fixture.device.newGeometry('triangle', {
        'vertex.position': positionArray,
        'vertex.normal': normalArray,
        'primitive.index': indexArray
      });
      const surface = fixture.device.newSurface({geometry, material: fixture.material});
      fixture.group.setParameter('surface', [surface]).commitParameters();
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const initialGeometry = initialOptions?.surfaces[0]?.geometry;
      const initialGeometryVersion = initialOptions?.surfaces[0]?.geometryVersion ?? 0;
      const retainedGeometryVersion = geometry.version;

      const changedPositions = new Float32Array([0, 0, 0, 2, 0, 0, 0, 2, 0]);
      positionArray.setParameter('data', changedPositions).commitParameters();
      const positionOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(geometry.version).toBe(retainedGeometryVersion);
      expect(positionOptions?.surfaces[0]?.geometry).not.toBe(initialGeometry);
      expect(positionOptions?.surfaces[0]?.geometry.attributes.POSITION?.value).toBe(
        changedPositions
      );
      expect(positionOptions?.surfaces[0]?.geometryVersion).toBeGreaterThan(initialGeometryVersion);

      const positionGeometry = positionOptions?.surfaces[0]?.geometry;
      const positionGeometryVersion = positionOptions?.surfaces[0]?.geometryVersion ?? 0;
      const changedNormals = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]);
      normalArray.setParameter('data', changedNormals).commitParameters();
      const normalOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(normalOptions?.surfaces[0]?.geometry).not.toBe(positionGeometry);
      expect(normalOptions?.surfaces[0]?.geometry.attributes.NORMAL?.value).toBe(changedNormals);
      expect(normalOptions?.surfaces[0]?.geometryVersion).toBeGreaterThan(positionGeometryVersion);

      const normalGeometryVersion = normalOptions?.surfaces[0]?.geometryVersion ?? 0;
      const changedIndices = new Uint16Array([0, 2, 1]);
      indexArray.setParameter('data', changedIndices).commitParameters();
      const indexOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(indexOptions?.surfaces[0]?.geometry.indices?.value).toBe(changedIndices);
      expect(indexOptions?.surfaces[0]?.geometryVersion).toBeGreaterThan(normalGeometryVersion);
      expect(indexOptions?.sceneRevisions?.topology).toBe(
        (initialOptions?.sceneRevisions?.topology ?? 0) + 3
      );
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('conservatively refreshes raster morph weights and skin palettes without replacing geometry', () => {
    const fixture = createCachedSceneFixture();

    try {
      const geometry = fixture.device.newGeometry('triangle', {
        'vertex.position': new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        'vertex.normal': new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        morphTargets: [{POSITION: new Float32Array([0, 0, 0, 0, 0.5, 0, 0, 0, 0])}],
        morphWeights: [0]
      });
      const initialPalette = new Float32Array(16);
      const surface = fixture.device.newSurface({
        geometry,
        material: fixture.material,
        skin: {jointMatrices: initialPalette}
      });
      fixture.group.setParameter('surface', [surface]).commitParameters();
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const initialGeometry = initialOptions?.surfaces[0]?.geometry;
      const initialGeometryVersion = initialOptions?.surfaces[0]?.geometryVersion;

      geometry.setParameter('morphWeights', [0.75]).commitParameters();
      const morphOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(morphOptions?.surfaces[0]?.morphWeights).toEqual([0.75]);
      expect(morphOptions?.surfaces[0]?.geometry).toBe(initialGeometry);
      expect(morphOptions?.surfaces[0]?.geometryVersion).toBe(initialGeometryVersion);
      expect(morphOptions?.sceneRevisions?.topology).toBe(
        (initialOptions?.sceneRevisions?.topology ?? 0) + 1
      );

      const updatedPalette = new Float32Array(16).fill(2);
      surface.setParameter('skin', {jointMatrices: updatedPalette}).commitParameters();
      const skinOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(skinOptions?.surfaces[0]?.skin?.jointMatrices).toBe(updatedPalette);
      expect(skinOptions?.surfaces[0]?.morphWeights).toEqual([0.75]);
      expect(skinOptions?.surfaces[0]?.geometry).toBe(initialGeometry);
      expect(skinOptions?.sceneRevisions?.topology).toBe(
        (initialOptions?.sceneRevisions?.topology ?? 0) + 2
      );
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('preserves duplicate and reordered placements while rebuilding group and array topology', () => {
    const fixture = createCachedSceneFixture();

    try {
      const surfaceArray = fixture.device.newArray({data: [fixture.surface, fixture.surface]});
      fixture.group.setParameter('surface', surfaceArray).commitParameters();
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const initialSurface = initialOptions?.surfaces[0];
      expect(initialSurface?.instanceIds).toHaveLength(4);
      expect(new Set(initialSurface?.instanceIds).size).toBe(4);

      surfaceArray.setParameter('data', [fixture.surface]).commitParameters();
      const reducedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(reducedOptions?.surfaces).not.toBe(initialOptions?.surfaces);
      expect(reducedOptions?.surfaces[0]?.instanceIds).toEqual(
        fixture.instances.map(
          instance => `${instance.id}:${fixture.group.id}:${fixture.surface.id}`
        )
      );
      expect(reducedOptions?.sceneRevisions?.topology).toBe(
        (initialOptions?.sceneRevisions?.topology ?? 0) + 1
      );

      fixture.world
        .setParameter('instance', [fixture.instances[1], fixture.instances[0]])
        .commitParameters();
      const reorderedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(reorderedOptions?.surfaces[0]?.instanceIds).toEqual([
        `${fixture.instances[1].id}:${fixture.group.id}:${fixture.surface.id}`,
        `${fixture.instances[0].id}:${fixture.group.id}:${fixture.surface.id}`
      ]);
      expect(reorderedOptions?.sceneRevisions?.topology).toBe(
        (initialOptions?.sceneRevisions?.topology ?? 0) + 2
      );
      expect(reorderedOptions?.sceneRevisions?.dirtyInstanceIds).toBeUndefined();
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('distinguishes instance group replacement from transform-only commits', () => {
    const fixture = createCachedSceneFixture();

    try {
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const anotherSurface = fixture.device.newSurface({
        geometry: fixture.geometry,
        material: fixture.material
      });
      const anotherGroup = fixture.device.newGroup({surface: [anotherSurface]});

      fixture.instances[0].setParameter('group', anotherGroup).commitParameters();
      const updatedOptions = fixture.adapter.makeRenderOptions(fixture.frame);

      expect(updatedOptions?.surfaces).not.toBe(initialOptions?.surfaces);
      expect(updatedOptions?.surfaces.map(surface => surface.id)).toEqual([
        anotherSurface.id,
        fixture.surface.id
      ]);
      expect(updatedOptions?.sceneRevisions?.topology).toBe(
        (initialOptions?.sceneRevisions?.topology ?? 0) + 1
      );
      expect(updatedOptions?.sceneRevisions?.dirtyInstanceIds).toBeUndefined();
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('isolates multiple worlds while propagating commits from shared materials', () => {
    const fixture = createCachedSceneFixture();

    try {
      const anotherWorld = fixture.device.newWorld({surface: [fixture.surface]});
      const anotherFrame = fixture.device.newFrame({
        world: anotherWorld,
        camera: fixture.camera,
        renderer: fixture.renderer,
        size: [32, 32]
      });
      const firstOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const secondOptions = fixture.adapter.makeRenderOptions(anotherFrame);
      expect(firstOptions?.sceneRevisions?.identity).toBe(fixture.world.id);
      expect(secondOptions?.sceneRevisions?.identity).toBe(anotherWorld.id);

      fixture.material.setParameter('roughness', 0.73).commitParameters();
      const firstUpdated = fixture.adapter.makeRenderOptions(fixture.frame);
      const secondUpdated = fixture.adapter.makeRenderOptions(anotherFrame);
      expect(firstUpdated?.surfaces).toBe(firstOptions?.surfaces);
      expect(secondUpdated?.surfaces).toBe(secondOptions?.surfaces);
      expect(firstUpdated?.surfaces[0]?.material).toBe(secondUpdated?.surfaces[0]?.material);
      expect(firstUpdated?.sceneRevisions?.materials).toBe(1);
      expect(secondUpdated?.sceneRevisions?.materials).toBe(1);

      const unrelatedWorld = fixture.device.newWorld();
      unrelatedWorld.setParameter('light', [fixture.light]).commitParameters();
      expect(fixture.adapter.makeRenderOptions(fixture.frame)?.surfaces).toBe(
        firstOptions?.surfaces
      );
      expect(fixture.adapter.makeRenderOptions(anotherFrame)?.surfaces).toBe(
        secondOptions?.surfaces
      );
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('changes retained scene identity when one frame swaps committed worlds', () => {
    const fixture = createCachedSceneFixture();

    try {
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const anotherWorld = fixture.device.newWorld({surface: [fixture.surface]});

      fixture.frame.setParameter('world', anotherWorld).commitParameters();
      const replacementOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(replacementOptions?.sceneRevisions?.identity).toBe(anotherWorld.id);
      expect(replacementOptions?.sceneRevisions?.identity).not.toBe(
        initialOptions?.sceneRevisions?.identity
      );
      expect(replacementOptions?.surfaces).not.toBe(initialOptions?.surfaces);

      fixture.frame.setParameter('world', fixture.world).commitParameters();
      const restoredOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(restoredOptions?.sceneRevisions?.identity).toBe(fixture.world.id);
      expect(restoredOptions?.surfaces).toBe(initialOptions?.surfaces);
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('safely rebuilds after the bounded commit journal expires', () => {
    const fixture = createCachedSceneFixture();

    try {
      const initialOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const unrelatedMaterial = fixture.device.newMaterial('matte', {roughness: 0.5});
      for (let revision = 0; revision < 300; revision++) {
        unrelatedMaterial.setParameter('roughness', revision / 300).commitParameters();
      }
      const changedTransform = new Matrix4().translate([6, 0, 0]);
      fixture.instances[0].setParameter('transform', changedTransform).commitParameters();

      const refreshedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      expect(refreshedOptions?.surfaces).not.toBe(initialOptions?.surfaces);
      expect(refreshedOptions?.surfaces[0]?.transforms[0]).toBe(changedTransform);
      expect(refreshedOptions?.sceneRevisions?.topology).toBe(
        (initialOptions?.sceneRevisions?.topology ?? 0) + 1
      );
      expect(refreshedOptions?.sceneRevisions?.dirtyInstanceIds).toBeUndefined();
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });

  test('rebuilds cached analytic primitives after committed sphere radius changes', () => {
    const fixture = createCachedSceneFixture();

    try {
      fixture.adapter.makeRenderOptions(fixture.frame);
      const initialPrimitives = fixture.adapter.getAnalyticPrimitives(fixture.world);
      expect(initialPrimitives[fixture.surface.id]?.radius).toBe(0.75);

      fixture.geometry.setParameter('radius', 1.25).commitParameters();
      const changedOptions = fixture.adapter.makeRenderOptions(fixture.frame);
      const changedPrimitives = fixture.adapter.getAnalyticPrimitives(fixture.world);
      expect(changedPrimitives).not.toBe(initialPrimitives);
      expect(changedPrimitives[fixture.surface.id]?.radius).toBe(1.25);
      expect(changedOptions?.sceneRevisions?.topology).toBe(1);
    } finally {
      destroyCachedSceneFixture(fixture);
    }
  });
});

function createCachedSceneFixture(): CachedSceneFixture {
  const graphicsDevice = new NullDevice({id: 'anari-scene-cache-device'});
  const device = new ANARIDevice(graphicsDevice);
  const geometry = device.newGeometry('sphere', {radius: 0.75, segments: 8});
  const material = device.newMaterial('physicallyBased', {
    baseColor: [0.4, 0.6, 0.8],
    roughness: 0.35
  });
  const surface = device.newSurface({geometry, material});
  const light = device.newLight('point', {position: [0, 2, 3], intensity: 3});
  const group = device.newGroup({surface: [surface]});
  const firstInstance = device.newInstance({
    group,
    transform: new Matrix4().translate([-1, 0, 0])
  });
  const secondInstance = device.newInstance({
    group,
    transform: new Matrix4().translate([1, 0, 0])
  });
  const instances: [ANARIInstance, ANARIInstance] = [firstInstance, secondInstance];
  const world = device.newWorld({instance: instances, light: [light]});
  const camera = device.newCamera('perspective', {position: [0, 0, 6]});
  const renderer = device.newRenderer('raytrace', {ambientRadiance: 0.12});
  const frame = device.newFrame({world, camera, renderer, size: [32, 32]});
  const adapter = new ANARISceneAdapter();
  return {
    graphicsDevice,
    device,
    adapter,
    geometry,
    material,
    surface,
    light,
    group,
    instances,
    world,
    camera,
    renderer,
    frame
  };
}

function destroyCachedSceneFixture(fixture: CachedSceneFixture): void {
  fixture.adapter.destroy();
  fixture.device.destroy();
  fixture.graphicsDevice.destroy();
}
