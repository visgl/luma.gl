// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {createPBRMaterial, PBREnvironmentGenerator} from '@luma.gl/anari';
import type {GPURigidBody} from '@luma.gl/graph/gpu-physics';
import type {RigidBodyScene} from './scenes';
import {WRECKING_BALL_BODY_INDEX} from './wrecking-ball';

/** Instance material parameters remain data; the shared material owns the lighting equations. */
export function createLabMaterial(device: Device, bodies: GPURigidBody[], scene: RigidBodyScene) {
  const parameters = new Uint8Array(bodies.length * 4);
  for (let index = 0; index < bodies.length; index++) {
    const steel = scene === 'wreckingBall' && index === WRECKING_BALL_BODY_INDEX;
    const roughness = steel ? 0.18 : index === 0 ? 0.82 : scene === 'dominoSpiral' ? 0.43 : 0.72;
    parameters.set([255, Math.round(roughness * 255), steel ? 255 : 0, 255], index * 4);
  }
  const materialTexture = device.createTexture({
    id: 'lab-material-parameters',
    width: bodies.length,
    height: 1,
    format: 'rgba8unorm',
    data: parameters,
    sampler: {minFilter: 'nearest', magFilter: 'nearest'}
  });
  const material = createPBRMaterial(device, {
    id: 'lab-pbr-material',
    uniforms: {metallicRoughnessValues: [1, 1], metallicRoughnessUVSet: 1, IBLenabled: true},
    bindings: {pbr_metallicRoughnessSampler: materialTexture}
  });
  const environment = createLabEnvironment(device);
  return {
    material,
    environment,
    destroy() {
      material.destroy();
      materialTexture.destroy();
      environment.destroy();
    }
  };
}

/** Shared studio lighting for retained and procedural lab renderers. */
export function createLabEnvironment(device: Device) {
  const pixels = new Uint8Array(64 * 32 * 4);
  for (let row = 0; row < 32; row++) {
    const brightness = row < 16 ? 220 : 140;
    for (let column = 0; column < 64; column++)
      pixels.set([brightness, brightness, brightness, 255], (row * 64 + column) * 4);
  }
  const panorama = device.createTexture({
    width: 64,
    height: 32,
    format: 'rgba8unorm',
    data: pixels
  });
  const generator = new PBREnvironmentGenerator(device);
  const environment = generator.prepare({
    source: panorama,
    sourceEncoding: 'srgb',
    size: 32,
    sampleCount: 32
  });
  generator.destroy();
  panorama.destroy();
  return environment;
}
