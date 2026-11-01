// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Scene,
  PerspectiveCamera,
  DirectionalLight,
  Color,
  Box3,
  Vector3,
  DataTexture,
  FloatType,
  RGBAFormat,
  EquirectangularReflectionMapping,
  LinearFilter,
  PMREMGenerator,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PCFShadowMap,
  AnimationMixer,
  InstancedMesh,
  BoxGeometry,
  Object3D,
  Group,
  SphereGeometry,
  MeshPhysicalMaterial,
  type Renderer
} from 'three/webgpu';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export type GLTFSceneKind = 'gltf' | 'morph' | 'skin' | 'instances' | 'materials' | 'transmission';

/** Shared fixtures for standard materials, deformation and instanced animation. */
export async function createGLTFScene(renderer: Renderer, kind: GLTFSceneKind = 'gltf') {
  const assetUrls = {
    gltf: new URL('../../anari/scenes/public/gltf/Lantern.glb', import.meta.url).href,
    morph: new URL('../../anari/scenes/public/gltf/AnimatedMorphCube.glb', import.meta.url).href,
    skin: new URL('../../anari/scenes/public/gltf/RobotExpressive.glb', import.meta.url).href
  };
  const gltf =
    kind === 'instances' || kind === 'materials' || kind === 'transmission'
      ? {scene: new Group(), animations: []}
      : await new GLTFLoader().loadAsync(assetUrls[kind]);
  let instances: InstancedMesh<BoxGeometry, MeshStandardMaterial> | undefined;
  const transformation = new Object3D();
  const physicalMaterials: MeshPhysicalMaterial[] = [];
  if (kind === 'materials' || kind === 'transmission') {
    const materials =
      kind === 'materials'
        ? [
            new MeshPhysicalMaterial({
              color: 0x4169e1,
              roughness: 0.25,
              clearcoat: 1,
              clearcoatRoughness: 0.08
            }),
            new MeshPhysicalMaterial({
              color: 0x803040,
              roughness: 0.6,
              sheen: 1,
              sheenColor: new Color(0xffb0d0),
              sheenRoughness: 0.3
            }),
            new MeshPhysicalMaterial({
              color: 0xb0c0d0,
              metalness: 0.8,
              roughness: 0.2,
              iridescence: 1,
              iridescenceThicknessRange: [100, 400]
            }),
            new MeshPhysicalMaterial({
              color: 0xd0a060,
              metalness: 1,
              roughness: 0.3,
              anisotropy: 0.9,
              anisotropyRotation: Math.PI / 4
            })
          ]
        : [
            new MeshPhysicalMaterial({
              color: 0xffffff,
              roughness: 0.04,
              transmission: 1,
              thickness: 0.8,
              ior: 1.5
            }),
            new MeshPhysicalMaterial({
              color: 0xffffff,
              roughness: 0.25,
              transmission: 1,
              thickness: 1.2,
              attenuationColor: new Color(0x40d0a0),
              attenuationDistance: 0.6,
              dispersion: 0.1
            })
          ];
    physicalMaterials.push(...materials);
    for (let index = 0; index < materials.length; index++) {
      const sphere = new Mesh(new SphereGeometry(0.55, 48, 32), materials[index]);
      sphere.position.set(
        ((index % 2) - 0.5) * 1.35,
        kind === 'materials' ? (0.5 - Math.floor(index / 2)) * 1.35 : 0,
        0
      );
      gltf.scene.add(sphere);
    }
    if (kind === 'transmission') {
      for (let index = 0; index < 9; index++) {
        const backdrop = new Mesh(
          new BoxGeometry(0.4, 2.2, 0.15),
          new MeshStandardMaterial({
            color: new Color().setHSL(index / 9, 0.75, 0.45),
            roughness: 0.8
          })
        );
        backdrop.position.set((index - 4) * 0.4, 0, -1.1);
        gltf.scene.add(backdrop);
      }
    }
  }
  if (kind === 'instances') {
    instances = new InstancedMesh(
      new BoxGeometry(0.3, 0.3, 0.3),
      new MeshStandardMaterial({roughness: 0.35, metalness: 0.3}),
      64
    );
    for (let index = 0; index < instances.count; index++) {
      transformation.position.set(
        ((index % 8) - 3.5) * 0.4,
        0,
        (Math.floor(index / 8) - 3.5) * 0.4
      );
      transformation.updateMatrix();
      instances.setMatrixAt(index, transformation.matrix);
      instances.setColorAt(index, new Color().setHSL(index / instances.count, 0.65, 0.5));
    }
    gltf.scene.add(instances);
  }
  const mixer = new AnimationMixer(gltf.scene);
  const clip =
    gltf.animations.find(animation => animation.name === 'Walking') || gltf.animations[0];
  if (clip) mixer.clipAction(clip).play();
  const scene = new Scene();
  scene.background = new Color(0.04, 0.06, 0.08);
  const bounds = new Box3().setFromObject(gltf.scene);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const scale = 2.8 / Math.max(size.x, size.y, size.z);
  gltf.scene.position.copy(center).multiplyScalar(-scale);
  gltf.scene.scale.setScalar(scale);
  scene.add(gltf.scene);
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(3, 1.2, 4);
  camera.lookAt(0, 0, 0);
  const light = new DirectionalLight(0xffe2c0, 3);
  light.position.set(3, 4, 2);
  scene.add(light);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = light.shadow.camera.bottom = -3;
  light.shadow.camera.right = light.shadow.camera.top = 3;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 12;
  light.shadow.normalBias = 0.015;
  light.shadow.camera.updateProjectionMatrix();
  const groundGeometry = new PlaneGeometry(8, 8);
  const groundMaterial = new MeshStandardMaterial({color: 0x89949b, roughness: 0.9, metalness: 0});
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.4;
  ground.receiveShadow = true;
  scene.add(ground);
  const width = 256;
  const height = 128;
  const pixels = new Float32Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const offset = (row * width + column) * 4;
      const sky = 0.15 + 0.6 * (1 - row / height);
      const panel = Math.exp(-((column / width - 0.3) ** 2 + (row / height - 0.35) ** 2) * 200) * 8;
      pixels[offset] = sky * 0.7 + panel;
      pixels[offset + 1] = sky * 0.85 + panel * 0.9;
      pixels[offset + 2] = sky + panel * 0.7;
      pixels[offset + 3] = 1;
    }
  }
  const environment = new DataTexture(pixels, width, height, RGBAFormat, FloatType);
  environment.mapping = EquirectangularReflectionMapping;
  environment.minFilter = environment.magFilter = LinearFilter;
  environment.needsUpdate = true;
  const generator = new PMREMGenerator(renderer);
  const environmentTarget = generator.fromEquirectangular(environment);
  generator.dispose();
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 1;
  let materialCount = 0;
  gltf.scene.traverse(object => {
    if (object instanceof Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial))
          throw new Error('Expected glTF MeshStandardMaterial');
        materialCount++;
      }
    }
  });
  return {
    scene,
    camera,
    light,
    materialCount,
    ground,
    animationCount: gltf.animations.length,
    physicalMaterials,
    update: (seconds: number) => {
      mixer.setTime(seconds);
      if (instances) {
        for (let index = 0; index < instances.count; index++) {
          transformation.position.set(
            ((index % 8) - 3.5) * 0.4,
            Math.sin(seconds * 2 + index * 0.3) * 0.3,
            (Math.floor(index / 8) - 3.5) * 0.4
          );
          transformation.rotation.set(seconds + index * 0.1, seconds * 0.5, 0);
          transformation.updateMatrix();
          instances.setMatrixAt(index, transformation.matrix);
        }
        instances.instanceMatrix.needsUpdate = true;
        instances.computeBoundingSphere();
      }
    },
    dispose: () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
      instances?.dispose();
      gltf.scene.traverse(object => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            for (const value of Object.values(material)) {
              if (
                value &&
                typeof value === 'object' &&
                'isTexture' in value &&
                'dispose' in value &&
                typeof value.dispose === 'function'
              )
                value.dispose();
            }
            material.dispose();
          }
        }
      });
      environmentTarget.dispose();
      environment.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      light.shadow.dispose();
    }
  };
}
