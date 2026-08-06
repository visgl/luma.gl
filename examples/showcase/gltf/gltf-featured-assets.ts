// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A deliberately selected, freely reusable asset in the glTF Animation Studio. */
export type GLTFFeaturedAsset = {
  name: string;
  label: string;
  category: 'animation' | 'materials' | 'native-extensions';
  description: string;
  features: readonly string[];
  license: 'CC0-1.0';
  bundledFilename?: string;
  upstreamUrl?: string;
};

const THREE_SAMPLE_REVISION = '24595fb65bb662ea1e70984bb18301af06637b07';
const KHRONOS_SAMPLE_REVISION = '2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf';

/** Small CC0 hero assets are bundled; larger Khronos examples remain lazy-loaded. */
export const GLTF_FEATURED_ASSETS: readonly GLTFFeaturedAsset[] = [
  {
    name: 'RobotExpressive',
    label: 'Expressive Robot · 14 Clips',
    category: 'animation',
    description: 'Fourteen named clips, two animated skeletons, and three facial expressions.',
    features: ['14 animation clips', 'two skeletons', 'three facial morphs', 'crossfades'],
    license: 'CC0-1.0',
    bundledFilename: 'RobotExpressive.glb',
    upstreamUrl: `https://raw.githubusercontent.com/mrdoob/three.js/${THREE_SAMPLE_REVISION}/examples/models/gltf/RobotExpressive/RobotExpressive.glb`
  },
  {
    name: 'AnimatedMorphCube',
    label: 'Animated Morph Targets',
    category: 'animation',
    description: 'A compact authored glTF morph-target and animation-channel example.',
    features: ['morph targets', 'animated weights'],
    license: 'CC0-1.0',
    bundledFilename: 'AnimatedMorphCube.glb',
    upstreamUrl: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/${KHRONOS_SAMPLE_REVISION}/Models/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb`
  },
  {
    name: 'SimpleSkin',
    label: 'Animated Skeleton',
    category: 'animation',
    description: 'A minimal joint hierarchy with inverse-bind matrices and skeletal animation.',
    features: ['skeletal animation', 'joint palettes'],
    license: 'CC0-1.0',
    bundledFilename: 'SimpleSkin.gltf',
    upstreamUrl: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/${KHRONOS_SAMPLE_REVISION}/Models/SimpleSkin/glTF-Embedded/SimpleSkin.gltf`
  },
  {
    name: 'SimpleInstancing',
    label: 'GPU Instancing',
    category: 'native-extensions',
    description: 'Source-authored transforms rendered with native GPU instancing.',
    features: ['EXT_mesh_gpu_instancing'],
    license: 'CC0-1.0'
  },
  {
    name: 'CubeVisibility',
    label: 'Animated Visibility',
    category: 'native-extensions',
    description: 'Recursive node visibility driven by typed glTF animation pointers.',
    features: ['KHR_node_visibility', 'KHR_animation_pointer'],
    license: 'CC0-1.0'
  },
  {
    name: 'TransmissionTest',
    label: 'Physical Transmission',
    category: 'materials',
    description: 'Transparent physical surfaces with authored transmission factors.',
    features: ['KHR_materials_transmission'],
    license: 'CC0-1.0'
  },
  {
    name: 'IridescenceSuzanne',
    label: 'Spectral Iridescence',
    category: 'materials',
    description: 'Thin-film interference on the familiar Suzanne reference model.',
    features: ['KHR_materials_iridescence'],
    license: 'CC0-1.0'
  },
  {
    name: 'SheenChair',
    label: 'Fabric Sheen',
    category: 'materials',
    description: 'Fabric fibers represented by the authored physical sheen extension.',
    features: ['KHR_materials_sheen'],
    license: 'CC0-1.0'
  },
  {
    name: 'DiffuseTransmissionTeacup',
    label: 'Translucent Porcelain · Preview',
    category: 'materials',
    description: 'A freely licensed diffuse-transmission release-candidate reference asset.',
    features: ['KHR_materials_diffuse_transmission', 'release candidate'],
    license: 'CC0-1.0'
  },
  {
    name: 'ScatteringSkull',
    label: 'Subsurface Scattering · Experimental',
    category: 'materials',
    description: 'An experimental volume-scattering and diffuse-transmission reference model.',
    features: ['KHR_materials_volume_scatter', 'experimental proposal'],
    license: 'CC0-1.0'
  }
];

export function getFeaturedGLTFAsset(name: string): GLTFFeaturedAsset | undefined {
  return GLTF_FEATURED_ASSETS.find(asset => asset.name === name);
}

/** Resolves assets shared with the independently built ANARI showcase. */
export function getBundledGLTFAssetUrl(
  asset: GLTFFeaturedAsset,
  location: Pick<Location, 'href' | 'pathname'>,
  website: boolean
): string | undefined {
  if (!asset.bundledFilename) {
    return undefined;
  }

  if (!website) {
    return asset.upstreamUrl;
  }

  const examplesPathIndex = location.pathname.indexOf('/examples/');
  const websiteBasePath =
    examplesPathIndex < 0 ? '/' : `${location.pathname.slice(0, examplesPathIndex)}/`;
  return new URL(
    `${websiteBasePath}standalone-examples/anari/gltf/${asset.bundledFilename}`,
    location.href
  ).href;
}
