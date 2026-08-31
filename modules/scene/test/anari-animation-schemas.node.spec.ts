import {
  ANARIAnimationTrackSchema,
  ANARIGeometrySchema,
  ANARISceneSchema,
  ANARITextureSchema
} from '@luma.gl/scene/schemas';
import {expect, it} from 'vitest';
import {PLAYGROUND_PRESETS} from '../../../examples/showcase/scene/playground-presets';
import type {ANARIJSONScene} from '../../../examples/showcase/scene/playground-scene';

it('ANARI animation schemas preserve optional node hierarchies and keyframe clips', () => {
  const scene: ANARIJSONScene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  const instanceIdentifier = scene.instances?.[0]?.['@@id'];
  if (!instanceIdentifier) {
    expect(false, 'the showcase preset should expose retained instances').toBe(true);
    return;
  }
  scene.nodes = {
    parent: {translation: [0, 1, 0]},
    child: {parent: 'parent', instances: [instanceIdentifier]}
  };
  scene.clips = [
    {
      name: 'Scene animation',
      tracks: [
        {
          target: {type: 'node', identifier: 'parent', path: 'translation'},
          times: [0, 1],
          values: [
            [0, 1, 0],
            [0, 3, 0]
          ]
        }
      ]
    }
  ];
  scene.playback = {clip: 'Scene animation', playing: true, loop: 'ping-pong', speed: -0.5};

  expect(
    Boolean(ANARISceneSchema.safeParse(scene).success),
    'animated JSON remains schema-valid'
  ).toBe(true);
  expect(
    ANARISceneSchema.parse(JSON.parse(JSON.stringify(scene))).clips,
    'animation declarations survive JSON serialization'
  ).toEqual(scene.clips);

  scene.nodes.child.parent = 'missing-parent';
  const invalidParent = ANARISceneSchema.safeParse(scene);
  expect(Boolean(invalidParent.success), 'unknown animated parent nodes are rejected').toBe(false);
  if (!invalidParent.success) {
    expect(
      Boolean(
        invalidParent.error.issues.some(issue => issue.path.join('.') === 'nodes.child.parent')
      ),
      'invalid parent errors identify the source JSON property'
    ).toBe(true);
  }

  scene.nodes.child.parent = 'parent';
  scene.nodes.parent.parent = 'child';
  const cyclicHierarchy = ANARISceneSchema.safeParse(scene);
  expect(Boolean(cyclicHierarchy.success), 'multi-node animated parent cycles are rejected').toBe(
    false
  );
  if (!cyclicHierarchy.success) {
    expect(
      Boolean(cyclicHierarchy.error.issues.some(issue => issue.message.includes('parent cycles'))),
      'hierarchy cycle errors identify the invalid graph'
    ).toBe(true);
  }

  delete scene.nodes.parent.parent;
  scene.clips[0].tracks[0].target.identifier = 'missing-target';
  const invalidTarget = ANARISceneSchema.safeParse(scene);
  expect(Boolean(invalidTarget.success), 'unknown animated scene objects are rejected').toBe(false);
  if (!invalidTarget.success) {
    expect(
      Boolean(
        invalidTarget.error.issues.some(
          issue => issue.path.join('.') === 'clips.0.tracks.0.target.identifier'
        )
      ),
      'invalid track errors identify the target JSON property'
    ).toBe(true);
  }
  void 0;
});

it('ANARI animation schemas validate keyframe ordering and cubic tangent counts', () => {
  const target = {type: 'node' as const, identifier: 'node', path: 'translation'};
  const duplicateTime = ANARIAnimationTrackSchema.safeParse({
    target,
    times: [0, 0],
    values: [
      [0, 0, 0],
      [1, 0, 0]
    ]
  });
  const missingCubicTangent = ANARIAnimationTrackSchema.safeParse({
    target,
    interpolation: 'CUBICSPLINE',
    times: [0, 1],
    values: [
      [0, 0, 0],
      [1, 0, 0]
    ]
  });

  expect(Boolean(duplicateTime.success), 'duplicate keyframe times are rejected').toBe(false);
  expect(
    Boolean(missingCubicTangent.success),
    'cubic keyframes require input and output tangents'
  ).toBe(false);
  void 0;
});

it('ANARI animation schemas preserve second texture coordinate sets', () => {
  const geometry = ANARIGeometrySchema.safeParse({
    '@@type': 'triangle',
    'vertex.position': [0, 0, 0, 1, 0, 0, 0, 1, 0],
    'vertex.attribute1': [0, 0, 1, 0, 0, 1],
    'vertex.attribute2': [0.5, 0.5, 1, 0.5, 0.5, 1]
  });
  const texture = ANARITextureSchema.safeParse({
    source: 'second-uv.png',
    textureCoordinateSet: 1
  });
  const invalidTexture = ANARITextureSchema.safeParse({
    source: 'unsupported-uv.png',
    textureCoordinateSet: 2
  });

  expect(Boolean(geometry.success), 'editable triangle geometry retains TEXCOORD_1').toBe(true);
  expect(Boolean(texture.success), 'retained image samplers can select the second UV set').toBe(
    true
  );
  expect(Boolean(invalidTexture.success), 'unsupported texture coordinate sets are rejected').toBe(
    false
  );
  void 0;
});
