import {readFile} from 'node:fs/promises';
import * as coreANARI from '@luma.gl/scene';
import {type ANARIAnimationSceneDescription, ANARIDevice} from '@luma.gl/scene';
import {
  makeANARIAnimationClipsFromGLTF,
  makeANARIAnimationDataFromGLTF,
  makeANARIAnimationScene
} from '@luma.gl/scene/gltf';
import {GroupNode} from '@luma.gl/engine';
import type {GLTFAnimation, GLTFMaterialAnimationProperty, GLTFScenegraphs} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';
import {
  type ANARIJSONScene,
  createANARIJSONScene
} from '../../../examples/showcase/scene/playground-scene';

it('ANARI keeps optional glTF integration isolated from its root entry point', async () => {
  const packageContents = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8')
  );

  expect(
    packageContents.peerDependenciesMeta['@luma.gl/gltf'].optional,
    'the glTF integration dependency remains optional'
  ).toBe(true);
  expect(
    packageContents.exports['./gltf'],
    'the isolated adapter declares TypeScript, ESM, and CommonJS entry points'
  ).toEqual({
    types: './dist/gltf.d.ts',
    import: './dist/gltf.js',
    require: './dist/gltf.cjs'
  });
  expect(
    Boolean('makeANARIAnimationScene' in coreANARI),
    'loading the retained-object root does not import the optional glTF adapter'
  ).toBe(false);
  void 0;
});

it('ANARI glTF projection preserves named matrix-authored meshless parents', () => {
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

  expect(
    animation.nodes?.['retained-parent']?.matrix,
    'named matrix-authored source nodes retain their explicit static transform'
  ).toEqual(parentTransform);
  expect(
    animation.nodes?.['retained-child']?.parent,
    'meshless source parents remain in the serialized hierarchy'
  ).toBe('retained-parent');
  expect(
    animation.nodes?.['retained-child']?.instances,
    'source mesh nodes retain shared-surface instance references'
  ).toEqual(['retained-instance']);
  expect(
    animation.clips?.[0]?.tracks[0]?.target.identifier,
    'animation channels use the same mapped identities as scenegraph nodes'
  ).toBe('retained-child');
  expect(animation.playback?.clip, 'imported animation data selects its first clip').toBe(
    'Named node animation'
  );
  void 0;
});

it('ANARI projects glTF node, material, and UV pointer channels without parsing glTF', () => {
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

  expect(clips.length, 'the parsed source animation becomes one declarative clip').toBe(1);
  expect(
    clips[0].tracks.length,
    'transform, material, sampler, and morph-weight channels are preserved'
  ).toBe(4);
  expect(
    clips[0].tracks.map(track => track.target),
    'format-owned channels target stable retained scene objects'
  ).toEqual([
    {type: 'node', identifier: 'retained-parent', path: 'translation'},
    {type: 'material', identifier: 'retained-material', path: 'baseColor', component: 0},
    {type: 'sampler', identifier: 'retained-sampler', path: 'offset', component: 1},
    {type: 'node', identifier: 'retained-parent', path: 'weights'}
  ]);
  expect(
    clips[0].tracks[2].baseTransform,
    'texture-pointer tracks preserve their authored base transform'
  ).toEqual({offset: [0.25, 0], rotation: 0, scale: [1, 1]});
  void 0;
});

it('ANARI maps advanced glTF material channels onto canonical retained property names', () => {
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

  expect(
    clip.tracks.map(track => track.target.path),
    'glTF extension channels use the shared ANARI physical-material vocabulary'
  ).toEqual(properties.map(({expected}) => expected));
  expect(
    Boolean(clip.tracks.slice(-2).every(track => track.target.component === undefined)),
    'packed iridescence ranges become independent retained scalar properties'
  ).toBe(true);
  void 0;
});

it('ANARI animation pointers preserve authored alpha-mode and blended opacity', () => {
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

  expect(
    transparentClip.tracks.map(track => track.target.path),
    'RGBA and alpha-component pointers both update retained blend opacity'
  ).toEqual(['baseColor', 'opacity', 'opacity']);
  expect(
    transparentClip.tracks[1].values,
    'full base-color tracks preserve their authored alpha keyframes'
  ).toEqual([[0.2], [0.8]]);
  expect(
    opaqueClip.tracks.map(track => track.target.path),
    'opaque materials ignore alpha-only pointers and remain opaque'
  ).toEqual(['baseColor']);

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

  expect(
    Boolean(Math.abs((material.getParameter('opacity') || 0) - 0.5) < 1e-10),
    'shared mixer updates the opacity parameter consumed by the shared PBR renderer'
  ).toBe(true);
  expect(material.version, 'color and duplicate alpha tracks still commit once per frame').toBe(3);

  device.destroy();
  void 0;
});

it('ANARI initially paused clips remain seekable before first playback', () => {
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
  expect(
    Boolean(Math.abs((material.getParameter('roughness') || 0) - 0.5) < 1e-10),
    'an initially paused clip can still be scrubbed to a visible pose'
  ).toBe(true);
  expect(
    Boolean(animations.mixer.getAction('Paused clip')?.paused),
    'scrubbing preserves pause'
  ).toBe(true);

  device.destroy();
  void 0;
});

it('ANARI authored clip tracks take precedence over legacy procedural instance animation', () => {
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
    expect(false, 'the mixed scene should expose one retained instance').toBe(true);
    return;
  }
  const instance = retainedInstances[0];

  scene.update(0);
  const initialVersion = instance.version;
  scene.update(0.5);

  expect(
    instance.version,
    'authored and procedural declarations do not commit the same instance twice'
  ).toBe(initialVersion + 1);
  expect(
    instance.getParameter('transform')?.[12],
    'the authored clip controls the retained instance transform'
  ).toBe(0.5);
  expect(
    instance.getParameter('transform')?.[13],
    'legacy bob animation does not overwrite an authored transform track'
  ).toBe(0);

  scene.destroy();
  device.destroy();
  void 0;
});

it('ANARI animation propagates meshless parents and commits each retained object once', () => {
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
  expect(material.version, 'unchanged initial samples do not create redundant commits').toBe(1);
  animations.update(10.5);

  expect(firstInstance.version, 'multiple parent tracks commit the first instance once').toBe(2);
  expect(secondInstance.version, 'shared surface placements remain independent').toBe(2);
  expect(material.version, 'multiple material tracks create one retained commit').toBe(2);
  expect(sampler.version, 'multiple UV tracks create one retained sampler commit').toBe(2);
  expect(light.version, 'animated light properties commit once').toBe(2);
  expect(camera.version, 'animated camera properties commit once').toBe(2);
  expect(firstInstance.getParameter('transform')?.[12], 'parent translation reaches child').toBe(2);
  expect(firstInstance.getParameter('transform')?.[13], 'child translation is preserved').toBe(2);
  expect(firstInstance.getParameter('transform')?.[0], 'child scale is composed').toBe(1.5);
  expect(
    Boolean(Math.abs((material.getParameter('roughness') || 0) - 0.5) < 1e-10),
    'shared mixer interpolates material parameters'
  ).toBe(true);
  expect(
    sampler.getParameter('transform')?.slice(6, 8),
    'UV pointer components update their shared sampler transform'
  ).toEqual([0.25, 0.5]);

  animations.pause();
  animations.update(11);
  expect(material.version, 'paused scenes do not repeatedly commit unchanged objects').toBe(2);
  animations.seek(0.75);
  expect(
    Boolean(Math.abs((material.getParameter('roughness') || 0) - 0.65) < 1e-10),
    'scrubbing updates a paused clip'
  ).toBe(true);
  animations.play();
  animations.update(11.25);
  expect(
    Boolean(Math.abs((material.getParameter('roughness') || 0) - 0.2) < 1e-10),
    'resumed playback advances from scrubbed time and respects repeat boundaries'
  ).toBe(true);
  animations.setSpeed(2);
  animations.update(11.5);
  expect(
    Boolean(Math.abs((material.getParameter('roughness') || 0) - 0.5) < 1e-10),
    'speed changes scale future frame deltas without jumping to wall-clock time'
  ).toBe(true);

  device.destroy();
  void 0;
});
