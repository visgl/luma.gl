import {readFile} from 'node:fs/promises';
import * as coreANARI from '@luma.gl/anari';
import {type ANARIAnimationSceneDescription, ANARIDevice} from '@luma.gl/anari';
import {
  makeANARIAnimationClipsFromGLTF,
  makeANARIAnimationDataFromGLTF,
  makeANARIAnimationScene
} from '@luma.gl/anari/gltf';
import {GroupNode} from '@luma.gl/engine';
import type {GLTFAnimation, GLTFMaterialAnimationProperty, GLTFScenegraphs} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';
import {
  type ANARIJSONScene,
  createANARIJSONScene
} from '../../../examples/showcase/anari/playground-scene';

test('ANARI keeps optional glTF integration isolated from its root entry point', async testContext => {
  const packageContents = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8')
  );

  testContext.equal(
    packageContents.peerDependenciesMeta['@luma.gl/gltf'].optional,
    true,
    'the glTF integration dependency remains optional'
  );
  testContext.deepEqual(
    packageContents.exports['./gltf'],
    {
      types: './dist/gltf.d.ts',
      import: './dist/gltf.js',
      require: './dist/gltf.cjs'
    },
    'the isolated adapter declares TypeScript, ESM, and CommonJS entry points'
  );
  testContext.notOk(
    'makeANARIAnimationScene' in coreANARI,
    'loading the retained-object root does not import the optional glTF adapter'
  );
  testContext.end();
});

test('ANARI glTF projection preserves named matrix-authored meshless parents', testContext => {
  const parentTransform = Array.from(new Matrix4().translate([3, 4, 5]));
  const parent = new GroupNode({id: 'Named glTF parent', matrix: parentTransform});
  const child = new GroupNode({id: 'Named glTF child', position: [0, 2, 0]});
  const root = new GroupNode({id: 'Scene root', children: [parent]});
  parent.add(child);

  const scenegraphs = {
    scenes: [root],
    gltfNodeIdToNodeMap: new Map([
      ['source-parent', parent],
      ['source-child', child]
    ]),
    gltf: {
      nodes: [
        {id: 'source-parent', name: 'Named glTF parent', matrix: parentTransform},
        {id: 'source-child', name: 'Named glTF child'}
      ]
    },
    animations: [
      {
        name: 'Named node animation',
        channels: [
          {
            type: 'node',
            targetNodeId: 'source-child',
            path: 'translation',
            sampler: {
              input: [0, 1],
              interpolation: 'LINEAR',
              output: [
                [0, 2, 0],
                [0, 3, 0]
              ]
            }
          }
        ]
      }
    ]
  } as unknown as GLTFScenegraphs;
  const animation = makeANARIAnimationDataFromGLTF(scenegraphs, {
    nodeIdentifiers: {'source-parent': 'retained-parent', 'source-child': 'retained-child'},
    instanceIdentifiers: {'retained-child': ['retained-instance']}
  });

  testContext.deepEqual(
    animation.nodes?.['retained-parent']?.matrix,
    parentTransform,
    'named matrix-authored source nodes retain their explicit static transform'
  );
  testContext.equal(
    animation.nodes?.['retained-child']?.parent,
    'retained-parent',
    'meshless source parents remain in the serialized hierarchy'
  );
  testContext.deepEqual(
    animation.nodes?.['retained-child']?.instances,
    ['retained-instance'],
    'source mesh nodes retain shared-surface instance references'
  );
  testContext.equal(
    animation.clips?.[0]?.tracks[0]?.target.identifier,
    'retained-child',
    'animation channels use the same mapped identities as scenegraph nodes'
  );
  testContext.equal(
    animation.playback?.clip,
    'Named node animation',
    'imported animation data selects its first clip'
  );
  testContext.end();
});

test('ANARI projects glTF node, material, and UV pointer channels without parsing glTF', testContext => {
  const scalarSampler = {input: [0, 1], interpolation: 'LINEAR', output: [[0], [1]]};
  const animations: GLTFAnimation[] = [
    {
      name: 'Source clip',
      channels: [
        {
          type: 'node',
          targetNodeId: 'source-parent',
          path: 'translation',
          sampler: {
            input: [0, 1],
            interpolation: 'LINEAR',
            output: [
              [0, 0, 0],
              [2, 0, 0]
            ]
          }
        },
        {
          type: 'material',
          pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor/0',
          targetMaterialIndex: 0,
          property: 'baseColorFactor',
          component: 0,
          sampler: scalarSampler
        },
        {
          type: 'textureTransform',
          pointer:
            '/materials/0/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset/1',
          targetMaterialIndex: 0,
          textureSlot: 'baseColor',
          path: 'offset',
          component: 1,
          baseTransform: {offset: [0.25, 0], rotation: 0, scale: [1, 1]},
          sampler: scalarSampler
        },
        {
          type: 'node',
          targetNodeId: 'source-parent',
          path: 'weights',
          sampler: scalarSampler
        }
      ]
    }
  ];

  const clips = makeANARIAnimationClipsFromGLTF(animations, {
    nodeIdentifiers: {'source-parent': 'retained-parent'},
    materialIdentifiers: ['retained-material'],
    samplerIdentifiers: {'0:baseColor': 'retained-sampler'}
  });

  testContext.equal(clips.length, 1, 'the parsed source animation becomes one declarative clip');
  testContext.equal(
    clips[0].tracks.length,
    4,
    'transform, material, sampler, and morph-weight channels are preserved'
  );
  testContext.deepEqual(
    clips[0].tracks.map(track => track.target),
    [
      {type: 'node', identifier: 'retained-parent', path: 'translation'},
      {type: 'material', identifier: 'retained-material', path: 'baseColor', component: 0},
      {type: 'sampler', identifier: 'retained-sampler', path: 'offset', component: 1},
      {type: 'node', identifier: 'retained-parent', path: 'weights'}
    ],
    'format-owned channels target stable retained scene objects'
  );
  testContext.deepEqual(
    clips[0].tracks[2].baseTransform,
    {offset: [0.25, 0], rotation: 0, scale: [1, 1]},
    'texture-pointer tracks preserve their authored base transform'
  );
  testContext.end();
});

test('ANARI maps advanced glTF material channels onto canonical retained property names', testContext => {
  const properties: {
    property: GLTFMaterialAnimationProperty;
    component?: number;
    expected: string;
  }[] = [
    {property: 'anisotropyStrength', expected: 'anisotropyStrength'},
    {property: 'specularIntensityFactor', expected: 'specularIntensity'},
    {property: 'iridescenceIor', expected: 'iridescenceIndexOfRefraction'},
    {
      property: 'iridescenceThicknessRange',
      component: 0,
      expected: 'iridescenceThicknessMinimum'
    },
    {
      property: 'iridescenceThicknessRange',
      component: 1,
      expected: 'iridescenceThicknessMaximum'
    }
  ];
  const animations: GLTFAnimation[] = [
    {
      name: 'Advanced material',
      channels: properties.map(({property, component}) => ({
        type: 'material',
        pointer: `/materials/0/extensions/${property}`,
        targetMaterialIndex: 0,
        property,
        ...(component === undefined ? {} : {component}),
        sampler: {input: [0, 1], interpolation: 'LINEAR', output: [[0], [1]]}
      }))
    }
  ];
  const [clip] = makeANARIAnimationClipsFromGLTF(animations, {
    materialIdentifiers: ['retained-material']
  });

  testContext.deepEqual(
    clip.tracks.map(track => track.target.path),
    properties.map(({expected}) => expected),
    'glTF extension channels use the shared ANARI physical-material vocabulary'
  );
  testContext.ok(
    clip.tracks.slice(-2).every(track => track.target.component === undefined),
    'packed iridescence ranges become independent retained scalar properties'
  );
  testContext.end();
});

test('ANARI animation pointers preserve authored alpha-mode and blended opacity', testContext => {
  const animations: GLTFAnimation[] = [
    {
      name: 'Base color',
      channels: [
        {
          type: 'material',
          pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor',
          targetMaterialIndex: 0,
          property: 'baseColorFactor',
          sampler: {
            input: [0, 1],
            interpolation: 'LINEAR',
            output: [
              [1, 0, 0, 0.2],
              [0, 1, 0, 0.8]
            ]
          }
        },
        {
          type: 'material',
          pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor/3',
          targetMaterialIndex: 0,
          property: 'baseColorFactor',
          component: 3,
          sampler: {input: [0, 1], interpolation: 'LINEAR', output: [[0.2], [0.8]]}
        }
      ]
    }
  ];
  const [transparentClip] = makeANARIAnimationClipsFromGLTF(animations, {
    materialIdentifiers: ['material'],
    materialAlphaModes: ['BLEND']
  });
  const [opaqueClip] = makeANARIAnimationClipsFromGLTF(animations, {
    materialIdentifiers: ['material'],
    materialAlphaModes: ['OPAQUE']
  });

  testContext.deepEqual(
    transparentClip.tracks.map(track => track.target.path),
    ['baseColor', 'opacity', 'opacity'],
    'RGBA and alpha-component pointers both update retained blend opacity'
  );
  testContext.deepEqual(
    transparentClip.tracks[1].values,
    [[0.2], [0.8]],
    'full base-color tracks preserve their authored alpha keyframes'
  );
  testContext.deepEqual(
    opaqueClip.tracks.map(track => track.target.path),
    ['baseColor'],
    'opaque materials ignore alpha-only pointers and remain opaque'
  );

  const device = new ANARIDevice(new NullDevice({}));
  const material = device.newMaterial('physicallyBased', {
    baseColor: [1, 0, 0],
    opacity: 0.2,
    alphaMode: 'blend'
  });
  const playback = makeANARIAnimationScene(
    {clips: [transparentClip], playback: {clip: 'Base color'}},
    {instances: new Map(), materials: new Map([['material', material]])}
  );
  playback.update(2);
  playback.update(2.5);

  testContext.ok(
    Math.abs((material.getParameter('opacity') || 0) - 0.5) < 1e-10,
    'shared mixer updates the opacity parameter consumed by the shared PBR renderer'
  );
  testContext.equal(
    material.version,
    3,
    'color and duplicate alpha tracks still commit once per frame'
  );

  device.destroy();
  testContext.end();
});

test('ANARI initially paused clips remain seekable before first playback', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const material = device.newMaterial('physicallyBased', {roughness: 0.2});
  const animations = makeANARIAnimationScene(
    {
      clips: [
        {
          name: 'Paused clip',
          tracks: [
            {
              target: {type: 'material', identifier: 'material', path: 'roughness'},
              times: [0, 1],
              values: [[0.2], [0.8]]
            }
          ]
        }
      ],
      playback: {clip: 'Paused clip', playing: false}
    },
    {instances: new Map(), materials: new Map([['material', material]])}
  );

  animations.seek(0.5);
  testContext.ok(
    Math.abs((material.getParameter('roughness') || 0) - 0.5) < 1e-10,
    'an initially paused clip can still be scrubbed to a visible pose'
  );
  testContext.ok(animations.mixer.getAction('Paused clip')?.paused, 'scrubbing preserves pause');

  device.destroy();
  testContext.end();
});

test('ANARI authored clip tracks take precedence over legacy procedural instance animation', testContext => {
  const device = new ANARIDevice(new NullDevice({}));
  const description: ANARIJSONScene = {
    version: 1,
    name: 'Mixed animation',
    camera: {'@@type': 'perspective'},
    geometries: {sphere: {'@@type': 'sphere'}},
    materials: {material: {'@@type': 'physicallyBased'}},
    surfaces: {surface: {geometry: 'sphere', material: 'material'}},
    instances: [
      {
        '@@id': 'animated-instance',
        surface: 'surface',
        animation: {'@@type': 'bob', amplitude: 1, speed: 1}
      }
    ],
    nodes: {parent: {instances: ['animated-instance']}},
    clips: [
      {
        name: 'Authored translation',
        tracks: [
          {
            target: {type: 'node', identifier: 'parent', path: 'translation'},
            times: [0, 1],
            values: [
              [0, 0, 0],
              [1, 0, 0]
            ]
          }
        ]
      }
    ]
  };
  const scene = createANARIJSONScene(device, description);
  const world = scene.frame.getParameter('world');
  const retainedInstances = world.getParameter('instance');
  if (!Array.isArray(retainedInstances) || !retainedInstances[0]) {
    testContext.fail('the mixed scene should expose one retained instance');
    return;
  }
  const instance = retainedInstances[0];

  scene.update(0);
  const initialVersion = instance.version;
  scene.update(0.5);

  testContext.equal(
    instance.version,
    initialVersion + 1,
    'authored and procedural declarations do not commit the same instance twice'
  );
  testContext.equal(
    instance.getParameter('transform')?.[12],
    0.5,
    'the authored clip controls the retained instance transform'
  );
  testContext.equal(
    instance.getParameter('transform')?.[13],
    0,
    'legacy bob animation does not overwrite an authored transform track'
  );

  scene.destroy();
  device.destroy();
  testContext.end();
});

test('ANARI animation propagates meshless parents and commits each retained object once', testContext => {
  const graphicsDevice = new NullDevice({});
  const device = new ANARIDevice(graphicsDevice);
  const group = device.newGroup();
  const initialTransform = Array.from(new Matrix4().translate([1, 2, 0]));
  const firstInstance = device.newInstance({group, transform: initialTransform});
  const secondInstance = device.newInstance({group, transform: initialTransform});
  const material = device.newMaterial('physicallyBased', {roughness: 0.2, metallic: 0.3});
  const image = graphicsDevice.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
  const sampler = device.newSampler('image2D', {
    image,
    transform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
  });
  const light = device.newLight('point', {intensity: 2});
  const camera = device.newCamera('perspective', {position: [0, 0, 4]});
  const description: ANARIAnimationSceneDescription = {
    nodes: {
      parent: {translation: [1, 0, 0]},
      child: {
        parent: 'parent',
        translation: [0, 2, 0],
        instances: ['first-instance', 'second-instance']
      }
    },
    clips: [
      {
        name: 'Hierarchy',
        tracks: [
          {
            target: {type: 'node', identifier: 'parent', path: 'translation'},
            times: [0, 1],
            values: [
              [1, 0, 0],
              [3, 0, 0]
            ]
          },
          {
            target: {type: 'node', identifier: 'child', path: 'scale'},
            times: [0, 1],
            values: [
              [1, 1, 1],
              [2, 2, 2]
            ]
          },
          {
            target: {type: 'material', identifier: 'material', path: 'roughness'},
            times: [0, 1],
            values: [[0.2], [0.8]]
          },
          {
            target: {type: 'material', identifier: 'material', path: 'metallic'},
            times: [0, 1],
            values: [[0.3], [0.9]]
          },
          {
            target: {type: 'sampler', identifier: 'sampler', path: 'offset', component: 0},
            times: [0, 1],
            values: [[0], [0.5]]
          },
          {
            target: {type: 'sampler', identifier: 'sampler', path: 'offset', component: 1},
            times: [0, 1],
            values: [[0], [1]]
          },
          {
            target: {type: 'light', identifier: 'light', path: 'intensity'},
            times: [0, 1],
            values: [[2], [4]]
          },
          {
            target: {type: 'camera', identifier: 'camera', path: 'position'},
            times: [0, 1],
            values: [
              [0, 0, 4],
              [0, 0, 6]
            ]
          }
        ]
      }
    ],
    playback: {clip: 'Hierarchy', playing: true, loop: 'repeat'}
  };
  const animations = makeANARIAnimationScene(description, {
    instances: new Map([
      ['first-instance', firstInstance],
      ['second-instance', secondInstance]
    ]),
    materials: new Map([['material', material]]),
    samplers: new Map([['sampler', sampler]]),
    lights: new Map([['light', light]]),
    camera
  });

  animations.update(10);
  testContext.equal(
    material.version,
    1,
    'unchanged initial samples do not create redundant commits'
  );
  animations.update(10.5);

  testContext.equal(
    firstInstance.version,
    2,
    'multiple parent tracks commit the first instance once'
  );
  testContext.equal(secondInstance.version, 2, 'shared surface placements remain independent');
  testContext.equal(material.version, 2, 'multiple material tracks create one retained commit');
  testContext.equal(sampler.version, 2, 'multiple UV tracks create one retained sampler commit');
  testContext.equal(light.version, 2, 'animated light properties commit once');
  testContext.equal(camera.version, 2, 'animated camera properties commit once');
  testContext.equal(
    firstInstance.getParameter('transform')?.[12],
    2,
    'parent translation reaches child'
  );
  testContext.equal(
    firstInstance.getParameter('transform')?.[13],
    2,
    'child translation is preserved'
  );
  testContext.equal(firstInstance.getParameter('transform')?.[0], 1.5, 'child scale is composed');
  testContext.ok(
    Math.abs((material.getParameter('roughness') || 0) - 0.5) < 1e-10,
    'shared mixer interpolates material parameters'
  );
  testContext.deepEqual(
    sampler.getParameter('transform')?.slice(6, 8),
    [0.25, 0.5],
    'UV pointer components update their shared sampler transform'
  );

  animations.pause();
  animations.update(11);
  testContext.equal(
    material.version,
    2,
    'paused scenes do not repeatedly commit unchanged objects'
  );
  animations.seek(0.75);
  testContext.ok(
    Math.abs((material.getParameter('roughness') || 0) - 0.65) < 1e-10,
    'scrubbing updates a paused clip'
  );
  animations.play();
  animations.update(11.25);
  testContext.ok(
    Math.abs((material.getParameter('roughness') || 0) - 0.2) < 1e-10,
    'resumed playback advances from scrubbed time and respects repeat boundaries'
  );
  animations.setSpeed(2);
  animations.update(11.5);
  testContext.ok(
    Math.abs((material.getParameter('roughness') || 0) - 0.5) < 1e-10,
    'speed changes scale future frame deltas without jumping to wall-clock time'
  );

  device.destroy();
  testContext.end();
});
