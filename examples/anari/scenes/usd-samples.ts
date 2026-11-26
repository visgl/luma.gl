import {load, parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {postProcessGLTF} from '@luma.gl/engine/gltf';
import {makeANARIJSONSceneFromGLTF} from './gltf-to-anari';
import {type ANARIJSONScene, preloadANARIJSONTextures} from './playground-scene';
import {USDLoader, type USDLoaderOptions} from './usd-loader/usd-loader';
import {makeANARIJSONSceneFromUSD} from './usd-to-anari';

export type SceneSample = {
  identifier: string;
  label: string;
  url: string;
  format: 'usd' | 'gltf';
  options?: USDLoaderOptions;
};

const WHEEL_VARIANT_OPTIONS: USDLoaderOptions = {
  usd: {variantSelections: {wheels: 'wheelNormal'}}
};

function resolveSceneAssetUrl(relativePath: string): string {
  return new URL(relativePath, document.baseURI).href;
}

export const SCENE_SAMPLES: readonly SceneSample[] = [
  {
    identifier: 'gltf-expressive-robot',
    label: 'glTF · Expressive Robot · 14 Animated Clips',
    url: resolveSceneAssetUrl('./gltf/RobotExpressive.glb'),
    format: 'gltf'
  },
  {
    identifier: 'gltf-animated-morphs',
    label: 'glTF · Animated Morph Targets',
    url: resolveSceneAssetUrl('./gltf/AnimatedMorphCube.glb'),
    format: 'gltf'
  },
  {
    identifier: 'gltf-animated-skin',
    label: 'glTF · Animated Skeleton',
    url: resolveSceneAssetUrl('./gltf/SimpleSkin.gltf'),
    format: 'gltf'
  },
  {
    identifier: 'gltf-animated-colors',
    label: 'glTF · Animated Colors',
    url: resolveSceneAssetUrl('./gltf/AnimatedColorsCube.glb'),
    format: 'gltf'
  },
  {
    identifier: 'gltf-antique-camera',
    label: 'glTF · Antique Camera',
    url: resolveSceneAssetUrl('./gltf/AntiqueCamera.glb'),
    format: 'gltf'
  },
  {
    identifier: 'gltf-lantern',
    label: 'glTF · Brass Lantern',
    url: resolveSceneAssetUrl('./gltf/Lantern.glb'),
    format: 'gltf'
  },
  {
    identifier: 'gltf-toy-car',
    label: 'glTF · Vintage Toy Car',
    url: resolveSceneAssetUrl('./gltf/ToyCar.glb'),
    format: 'gltf'
  },
  {
    identifier: 'porcelain-atelier',
    label: 'OpenUSD · Porcelain Atelier',
    url: resolveSceneAssetUrl('./usd/porcelain-atelier.usda'),
    format: 'usd'
  },
  {
    identifier: 'knights-gambit',
    label: 'OpenUSD · Knight’s Gambit',
    url: resolveSceneAssetUrl('./usd/knights-gambit.usda'),
    format: 'usd'
  },
  {
    identifier: 'vehicle-gallery',
    label: 'OpenUSD · Vehicle Gallery',
    url: resolveSceneAssetUrl('./usd/vehicle-gallery.usda'),
    format: 'usd',
    options: WHEEL_VARIANT_OPTIONS
  },
  {
    identifier: 'material-laboratory',
    label: 'OpenUSD · Prismatic Materials',
    url: resolveSceneAssetUrl('./usd/material-laboratory.usda'),
    format: 'usd'
  },
  {
    identifier: 'formula-racer',
    label: 'OpenUSD · Formula Racer',
    url: resolveSceneAssetUrl(
      './usd/mini-vehicles/assets/vehicles/formula/asset/formulaFullAsset.usda'
    ),
    format: 'usd',
    options: WHEEL_VARIANT_OPTIONS
  },
  {
    identifier: 'crimson-sedan',
    label: 'OpenUSD · Crimson Sedan',
    url: resolveSceneAssetUrl(
      './usd/mini-vehicles/assets/vehicles/sedan/asset/sedanFullAsset.usda'
    ),
    format: 'usd',
    options: WHEEL_VARIANT_OPTIONS
  },
  {
    identifier: 'precision-wheel',
    label: 'OpenUSD · Precision Wheel',
    url: resolveSceneAssetUrl(
      './usd/mini-vehicles/assets/wheels/wheelNormal/asset/wheelNormalAsset.usda'
    ),
    format: 'usd'
  }
];

export async function loadSceneSample(identifier: string): Promise<ANARIJSONScene> {
  const sample = SCENE_SAMPLES.find(candidate => candidate.identifier === identifier);
  if (!sample) {
    throw new Error(`Unknown 3D sample "${identifier}".`);
  }
  const name = sample.label.replace(/^(OpenUSD|glTF) · /, '').toUpperCase();
  if (sample.format === 'gltf') {
    const asset = await load(sample.url, GLTFLoader, {gltf: {loadImages: false}});
    const scene = await makeANARIJSONSceneFromGLTF(postProcessGLTF(asset), name);
    await preloadANARIJSONTextures(scene);
    return scene;
  }
  const stage = await load(sample.url, USDLoader, sample.options);
  const scene = makeANARIJSONSceneFromUSD(stage, name);
  await preloadANARIJSONTextures(scene);
  return scene;
}

export async function loadSceneFile(file: File): Promise<ANARIJSONScene> {
  const name = file.name
    .replace(/\.(usd|usda|usdz|gltf|glb)$/i, '')
    .replace(/[-_]/g, ' ')
    .toUpperCase();
  if (/\.(gltf|glb)$/i.test(file.name)) {
    const asset = await parse(await file.arrayBuffer(), GLTFLoader, {gltf: {loadImages: false}});
    const scene = await makeANARIJSONSceneFromGLTF(postProcessGLTF(asset), name);
    await preloadANARIJSONTextures(scene);
    return scene;
  }
  const stage = await USDLoader.parse(await file.arrayBuffer());
  const scene = makeANARIJSONSceneFromUSD(stage, name);
  await preloadANARIJSONTextures(scene);
  return scene;
}

/** Detailed, locally licensed material reference with a stationary ray-traced view. */
export async function loadAntiqueCameraRayStudy(): Promise<ANARIJSONScene> {
  const scene = await loadSceneSample('gltf-antique-camera');
  scene.name = 'ANTIQUE CAMERA · RAY STUDY';
  scene.lights = [
    {
      '@@id': 'study-key',
      '@@type': 'directional',
      direction: [-1, -1, -1],
      color: [1, 0.93, 0.84],
      intensity: 3
    },
    {
      '@@id': 'study-fill',
      '@@type': 'directional',
      direction: [1, -0.4, -0.5],
      color: [0.7, 0.82, 1],
      intensity: 2
    },
    {
      '@@id': 'study-rim',
      '@@type': 'directional',
      direction: [0, -1, 1],
      color: [1, 1, 1],
      intensity: 2
    }
  ];
  scene.description =
    'Antique Camera by Maximillan Kamps · CC0 · textured glTF materials and progressive PBR transport';
  delete scene.camera.orbit;
  scene.renderer = {
    '@@type': 'raytrace',
    background: [0.025, 0.03, 0.045, 1],
    ambientRadiance: 0.04,
    exposure: 1,
    toneMapMode: 3,
    transportMode: 'pbr',
    maxBounces: 4,
    samplesPerPixel: 4,
    progressive: true,
    temporalReprojection: false,
    adaptiveResolution: false,
    resolutionScale: 1,
    historySampleLimit: 256,
    emitterSampling: true,
    emitterSelection: 'power',
    fogDensity: 0
  };
  return scene;
}
