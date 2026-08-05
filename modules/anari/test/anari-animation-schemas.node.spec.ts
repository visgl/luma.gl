import {
  ANARIAnimationTrackSchema,
  ANARIGeometrySchema,
  ANARISceneSchema,
  ANARITextureSchema
} from '@luma.gl/anari/schemas';
import test from 'test/utils/vitest-tape';
import {PLAYGROUND_PRESETS} from '../../../examples/showcase/anari/playground-presets';
import type {ANARIJSONScene} from '../../../examples/showcase/anari/playground-scene';

test('ANARI animation schemas preserve optional node hierarchies and keyframe clips', testContext => {
  const scene: ANARIJSONScene = structuredClone(PLAYGROUND_PRESETS[0].scene);
  const instanceIdentifier = scene.instances?.[0]?.['@@id'];
  if (!instanceIdentifier) {
    testContext.fail('the showcase preset should expose retained instances');
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

  testContext.ok(ANARISceneSchema.safeParse(scene).success, 'animated JSON remains schema-valid');
  testContext.deepEqual(
    ANARISceneSchema.parse(JSON.parse(JSON.stringify(scene))).clips,
    scene.clips,
    'animation declarations survive JSON serialization'
  );

  scene.nodes.child.parent = 'missing-parent';
  const invalidParent = ANARISceneSchema.safeParse(scene);
  testContext.notOk(invalidParent.success, 'unknown animated parent nodes are rejected');
  if (!invalidParent.success) {
    testContext.ok(
      invalidParent.error.issues.some(issue => issue.path.join('.') === 'nodes.child.parent'),
      'invalid parent errors identify the source JSON property'
    );
  }

  scene.nodes.child.parent = 'parent';
  scene.nodes.parent.parent = 'child';
  const cyclicHierarchy = ANARISceneSchema.safeParse(scene);
  testContext.notOk(cyclicHierarchy.success, 'multi-node animated parent cycles are rejected');
  if (!cyclicHierarchy.success) {
    testContext.ok(
      cyclicHierarchy.error.issues.some(issue => issue.message.includes('parent cycles')),
      'hierarchy cycle errors identify the invalid graph'
    );
  }

  delete scene.nodes.parent.parent;
  scene.clips[0].tracks[0].target.identifier = 'missing-target';
  const invalidTarget = ANARISceneSchema.safeParse(scene);
  testContext.notOk(invalidTarget.success, 'unknown animated scene objects are rejected');
  if (!invalidTarget.success) {
    testContext.ok(
      invalidTarget.error.issues.some(
        issue => issue.path.join('.') === 'clips.0.tracks.0.target.identifier'
      ),
      'invalid track errors identify the target JSON property'
    );
  }
  testContext.end();
});

test('ANARI animation schemas validate keyframe ordering and cubic tangent counts', testContext => {
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

  testContext.notOk(duplicateTime.success, 'duplicate keyframe times are rejected');
  testContext.notOk(
    missingCubicTangent.success,
    'cubic keyframes require input and output tangents'
  );
  testContext.end();
});

test('ANARI animation schemas preserve second texture coordinate sets', testContext => {
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

  testContext.ok(geometry.success, 'editable triangle geometry retains TEXCOORD_1');
  testContext.ok(texture.success, 'retained image samplers can select the second UV set');
  testContext.notOk(invalidTexture.success, 'unsupported texture coordinate sets are rejected');
  testContext.end();
});
