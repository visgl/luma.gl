// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, Texture} from '@luma.gl/core';
import {
  makeVolumetricFireSimulationUniformData,
  MAX_VOLUMETRIC_FIRE_EMITTERS,
  VolumetricFireSimulation,
  type VolumetricFireSimulationStepOptions
} from '@luma.gl/experimental';
import {fromHalfFloat, toHalfFloat} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const PASSIVE_STEP_OPTIONS = {
  buoyancy: 0,
  smokeWeight: 0,
  turbulence: 0,
  vorticity: 0,
  velocityDissipation: 1,
  densityDissipation: 1,
  temperatureDissipation: 1,
  fuelDissipation: 1,
  reactionRate: 0,
  heatRelease: 0,
  smokeYield: 0,
  cooling: 0,
  boundaryDamping: 1,
  obstacleThreshold: 0.5,
  emitters: [],
  reset: false
} as const satisfies Omit<VolumetricFireSimulationStepOptions, 'deltaTime'>;

test('VolumetricFireSimulation packs its fixed shader ABI', testCase => {
  const uniformData = makeVolumetricFireSimulationUniformData([8, 12, 10], {
    deltaTime: 1 / 60,
    time: 3.5,
    emitters: Array.from({length: MAX_VOLUMETRIC_FIRE_EMITTERS + 2}, (_, emitterIndex) => ({
      position: [0.2 + emitterIndex * 0.01, 0.1, 0.5] as const,
      radius: 0.08,
      density: 0.75,
      temperature: 1.25,
      fuel: 0.9,
      rate: 1.1,
      velocity: [0, 1, 0] as const,
      impulse: 1.4
    }))
  });

  testCase.equal(uniformData.length, 72, 'the cross-kernel ABI has a fixed byte layout');
  testCase.ok(
    approximatelyEqual(Array.from(uniformData.slice(0, 4)), [8, 12, 10, 1 / 60]),
    'dimensions and the deterministic time step are packed first'
  );
  testCase.equal(uniformData[4], 3.5, 'absolute simulation time is preserved');
  testCase.equal(
    uniformData[6],
    MAX_VOLUMETRIC_FIRE_EMITTERS,
    'source records are capped to the shader capacity'
  );
  testCase.ok(
    approximatelyEqual(Array.from(uniformData.slice(24, 28)), [-2.4, -4.8, 0, 0.64]),
    'normalized emitter coordinates are converted into centered grid-cell units'
  );
  testCase.throws(
    () => makeVolumetricFireSimulationUniformData([8, 8, 8], {deltaTime: 0}),
    /deltaTime/,
    'non-positive timesteps are rejected before upload'
  );
  testCase.throws(
    () =>
      makeVolumetricFireSimulationUniformData([8, 8, 8], {
        deltaTime: 1 / 60,
        emitters: [{position: [1.1, 0.5, 0.5], radius: 0.1}]
      }),
    /emitter/,
    'active emitters must stay inside the normalized volume'
  );
  testCase.end();
});

test('VolumetricFireSimulation orders steps and preserves borrowed resources', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const dimensions: [number, number, number] = [8, 8, 8];
  const obstacleData = new Uint8Array(dimensions[0] * dimensions[1] * dimensions[2]);
  obstacleData[4 + 4 * dimensions[0] + 4 * dimensions[0] * dimensions[1]] = 255;
  const obstacleTexture = device.createTexture({
    id: 'volumetric-fire-test-obstacles',
    dimension: '3d',
    width: dimensions[0],
    height: dimensions[1],
    depth: dimensions[2],
    format: 'r8unorm',
    data: obstacleData,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const simulation = new VolumetricFireSimulation(device, {
    id: 'volumetric-fire-test',
    dimensions,
    pressureIterations: 2,
    obstacleTexture
  });
  dimensions[0] = 12;

  try {
    testCase.equal(simulation.dimensions[0], 8, 'the simulation owns an immutable dimensions copy');
    testCase.deepEqual(
      simulation.stats.nodeOrder,
      [
        'advect-fire-velocity',
        'measure-divergence-and-clear-pressure',
        'project-pressure-1',
        'project-pressure-2',
        'project-fire-velocity',
        'advect-react-and-emit',
        'commit-combustion'
      ],
      'the graph exposes the complete solver sequence'
    );

    const commandEncoder = device.createCommandEncoder({id: 'volumetric-fire-ordered-steps'});
    simulation.encode(commandEncoder, {
      ...PASSIVE_STEP_OPTIONS,
      deltaTime: 1 / 60,
      reset: true,
      emitters: [
        {
          position: [0.5, 0.2, 0.5],
          radius: 0.28,
          density: 1,
          temperature: 1,
          fuel: 1,
          rate: 60,
          velocity: [0, 1, 0],
          impulse: 1.2
        }
      ]
    });
    simulation.encode(commandEncoder, {...PASSIVE_STEP_OPTIONS, deltaTime: 1 / 60});
    device.submit(commandEncoder.finish());

    const combustion = await readRgba16FloatVolume(simulation.combustionTexture, [8, 8, 8]);
    let maximumDensity = 0;
    for (let valueOffset = 0; valueOffset < combustion.length; valueOffset += 4) {
      maximumDensity = Math.max(maximumDensity, combustion[valueOffset]);
    }
    testCase.ok(
      maximumDensity > 0.1,
      'encoder-ordered uniform uploads preserve the first step before the second step advances it'
    );
    testCase.equal(
      getVolumeValue(combustion, [8, 8, 8], 4, 4, 4, 0),
      0,
      'solid voxels contain no combustion state'
    );

    const disabledEmitterEncoder = device.createCommandEncoder({
      id: 'volumetric-fire-disabled-emitter'
    });
    simulation.encode(disabledEmitterEncoder, {
      ...PASSIVE_STEP_OPTIONS,
      deltaTime: 1 / 60,
      reset: true,
      emitters: [
        {
          position: [0.5, 0.25, 0.5],
          radius: 0.3,
          rate: 0,
          velocity: [1, 1, 1],
          impulse: 100
        }
      ]
    });
    device.submit(disabledEmitterEncoder.finish());
    const disabledEmitterVelocity = await readRgba16FloatVolume(
      simulation.velocityTexture,
      [8, 8, 8]
    );
    testCase.ok(
      disabledEmitterVelocity.every(value => Math.abs(value) < 0.001),
      'a zero-rate emitter injects no momentum'
    );

    simulation.combustionTexture.writeData(
      makeRgba16FloatVolume([8, 8, 8], (x, y, z) =>
        x === 3 && y === 3 && z === 3 ? [1, 0, 0, 63.5] : [0, 0, 0, 0]
      ),
      {width: 8, height: 8, depthOrArrayLayers: 8}
    );
    const ageEncoder = device.createCommandEncoder({id: 'volumetric-fire-age-clamp'});
    simulation.encode(ageEncoder, {...PASSIVE_STEP_OPTIONS, deltaTime: 1});
    device.submit(ageEncoder.finish());
    const agedCombustion = await readRgba16FloatVolume(simulation.combustionTexture, [8, 8, 8]);
    testCase.equal(
      getVolumeValue(agedCombustion, [8, 8, 8], 3, 3, 3, 3),
      64,
      'combustion age saturates before half-float storage'
    );
  } finally {
    simulation.destroy();
    testCase.notOk(obstacleTexture.destroyed, 'the caller-owned obstacle texture is borrowed');
    obstacleTexture.destroy();
  }

  testCase.end();
});

test('VolumetricFireSimulation pressure projection reduces divergence', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const dimensions = [17, 8, 8] as const;
  const initialVelocityData = makeRgba16FloatVolume(dimensions, (xCoordinate, _y, _z) => [
    Math.sin((Math.PI * xCoordinate) / 2),
    0,
    0,
    0
  ]);
  const initialVelocity = decodePackedRgba16FloatVolume(initialVelocityData);
  const simulation = new VolumetricFireSimulation(device, {
    id: 'volumetric-fire-projection-test',
    dimensions,
    pressureIterations: 64
  });

  try {
    simulation.velocityTexture.writeData(initialVelocityData, {
      width: dimensions[0],
      height: dimensions[1],
      depthOrArrayLayers: dimensions[2]
    });
    const initialDivergence = getBackwardDivergenceRms(initialVelocity, dimensions);
    const commandEncoder = device.createCommandEncoder({id: 'volumetric-fire-projection-step'});
    simulation.encode(commandEncoder, {...PASSIVE_STEP_OPTIONS, deltaTime: 1 / 120});
    device.submit(commandEncoder.finish());

    const projectedVelocity = await readRgba16FloatVolume(simulation.velocityTexture, dimensions);
    const projectedDivergence = getBackwardDivergenceRms(projectedVelocity, dimensions);
    testCase.ok(initialDivergence > 0.5, 'the seeded velocity field is observably divergent');
    testCase.ok(
      projectedDivergence / initialDivergence < 0.25,
      `projection reduces divergence (${projectedDivergence} from ${initialDivergence})`
    );
    testCase.ok(
      projectedVelocity.every(Number.isFinite),
      'projection keeps the half-float velocity field finite'
    );
  } finally {
    simulation.destroy();
  }

  testCase.end();
});

test('VolumetricFireSimulation advances transport and reaction', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const dimensions = [16, 6, 6] as const;
  const simulation = new VolumetricFireSimulation(device, {
    id: 'volumetric-fire-transport-test',
    dimensions,
    pressureIterations: 1
  });

  try {
    simulation.velocityTexture.writeData(
      makeRgba16FloatVolume(dimensions, () => [2, 0, 0, 0]),
      {width: dimensions[0], height: dimensions[1], depthOrArrayLayers: dimensions[2]}
    );
    simulation.combustionTexture.writeData(
      makeRgba16FloatVolume(dimensions, (x, y, z) =>
        x === 3 && y === 3 && z === 3 ? [1, 0, 0, 0] : [0, 0, 0, 0]
      ),
      {width: dimensions[0], height: dimensions[1], depthOrArrayLayers: dimensions[2]}
    );

    let previousCenterX = 3;
    for (let stepIndex = 0; stepIndex < 2; stepIndex++) {
      const commandEncoder = device.createCommandEncoder({
        id: `volumetric-fire-transport-step-${stepIndex}`
      });
      simulation.encode(commandEncoder, {...PASSIVE_STEP_OPTIONS, deltaTime: 0.5});
      device.submit(commandEncoder.finish());
      const combustion = await readRgba16FloatVolume(simulation.combustionTexture, dimensions);
      const {mass, centerX} = getDensityMassAndCenter(combustion, dimensions);
      testCase.ok(mass > 0.8 && mass < 1.2, `step ${stepIndex + 1} preserves density mass`);
      testCase.ok(
        centerX - previousCenterX > 0.75,
        `step ${stepIndex + 1} advects density along the velocity field`
      );
      testCase.ok(
        Math.abs(centerX - (stepIndex + 4)) < 0.25,
        `step ${stepIndex + 1} moves density approximately one grid cell`
      );
      previousCenterX = centerX;
    }

    simulation.velocityTexture.writeData(
      makeRgba16FloatVolume(dimensions, () => [0, 0, 0, 0]),
      {width: dimensions[0], height: dimensions[1], depthOrArrayLayers: dimensions[2]}
    );
    simulation.combustionTexture.writeData(
      makeRgba16FloatVolume(dimensions, (x, y, z) =>
        x === 8 && y === 3 && z === 3 ? [0, 1, 1, 0] : [0, 0, 0, 0]
      ),
      {width: dimensions[0], height: dimensions[1], depthOrArrayLayers: dimensions[2]}
    );
    const reactionEncoder = device.createCommandEncoder({id: 'volumetric-fire-reaction-step'});
    simulation.encode(reactionEncoder, {
      ...PASSIVE_STEP_OPTIONS,
      deltaTime: 0.1,
      reactionRate: 2,
      heatRelease: 1,
      smokeYield: 0.5
    });
    device.submit(reactionEncoder.finish());
    const reactedCombustion = await readRgba16FloatVolume(simulation.combustionTexture, dimensions);
    const density = getVolumeValue(reactedCombustion, dimensions, 8, 3, 3, 0);
    const temperature = getVolumeValue(reactedCombustion, dimensions, 8, 3, 3, 1);
    const fuel = getVolumeValue(reactedCombustion, dimensions, 8, 3, 3, 2);
    testCase.ok(fuel < 0.9, 'reaction consumes hot fuel');
    testCase.ok(temperature > 1.1, 'reaction releases heat');
    testCase.ok(density > 0.05, 'reaction produces smoke density');
  } finally {
    simulation.destroy();
  }

  testCase.end();
});

test('VolumetricFireSimulation enforces obstacle faces and blocks tunneling', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const cornerDimensions = [8, 8, 8] as const;
  const cornerObstacles = new Uint8Array(
    cornerDimensions[0] * cornerDimensions[1] * cornerDimensions[2]
  );
  cornerObstacles[getScalarOffset(cornerDimensions, 5, 4, 4)] = 255;
  const cornerObstacleTexture = device.createTexture({
    id: 'volumetric-fire-positive-face-obstacle',
    dimension: '3d',
    width: cornerDimensions[0],
    height: cornerDimensions[1],
    depth: cornerDimensions[2],
    format: 'r8unorm',
    data: cornerObstacles,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const cornerSimulation = new VolumetricFireSimulation(device, {
    id: 'volumetric-fire-face-test',
    dimensions: cornerDimensions,
    pressureIterations: 1,
    obstacleTexture: cornerObstacleTexture
  });

  try {
    const initialVelocity = makeRgba16FloatVolume(cornerDimensions, (x, y, z) =>
      x === 4 && y === 4 && z === 4 ? [-1, 0, 0, 0] : [0, 0, 0, 0]
    );
    cornerSimulation.velocityTexture.writeData(initialVelocity, {
      width: cornerDimensions[0],
      height: cornerDimensions[1],
      depthOrArrayLayers: cornerDimensions[2]
    });
    const commandEncoder = device.createCommandEncoder({id: 'volumetric-fire-face-step'});
    cornerSimulation.encode(commandEncoder, {...PASSIVE_STEP_OPTIONS, deltaTime: 0.001});
    device.submit(commandEncoder.finish());
    const constrainedVelocity = await readRgba16FloatVolume(
      cornerSimulation.velocityTexture,
      cornerDimensions
    );
    testCase.ok(
      Math.abs(getVolumeValue(constrainedVelocity, cornerDimensions, 4, 4, 4, 0)) < 0.02,
      'a solid positive face removes normal flux regardless of its sign'
    );
  } finally {
    cornerSimulation.destroy();
    cornerObstacleTexture.destroy();
  }

  const wallDimensions = [12, 6, 6] as const;
  const wallObstacles = new Uint8Array(wallDimensions[0] * wallDimensions[1] * wallDimensions[2]);
  for (let zCoordinate = 0; zCoordinate < wallDimensions[2]; zCoordinate++) {
    for (let yCoordinate = 0; yCoordinate < wallDimensions[1]; yCoordinate++) {
      wallObstacles[getScalarOffset(wallDimensions, 6, yCoordinate, zCoordinate)] = 255;
    }
  }
  const wallObstacleTexture = device.createTexture({
    id: 'volumetric-fire-wall-obstacles',
    dimension: '3d',
    width: wallDimensions[0],
    height: wallDimensions[1],
    depth: wallDimensions[2],
    format: 'r8unorm',
    data: wallObstacles,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const wallSimulation = new VolumetricFireSimulation(device, {
    id: 'volumetric-fire-wall-test',
    dimensions: wallDimensions,
    pressureIterations: 1,
    obstacleTexture: wallObstacleTexture
  });

  try {
    wallSimulation.velocityTexture.writeData(
      makeRgba16FloatVolume(wallDimensions, xCoordinate =>
        xCoordinate >= 7 ? [4, 0, 0, 0] : [0, 0, 0, 0]
      ),
      {
        width: wallDimensions[0],
        height: wallDimensions[1],
        depthOrArrayLayers: wallDimensions[2]
      }
    );
    wallSimulation.combustionTexture.writeData(
      makeRgba16FloatVolume(wallDimensions, xCoordinate =>
        xCoordinate === 1 || xCoordinate === 3 || xCoordinate === 4 ? [1, 0, 0, 0] : [0, 0, 0, 0]
      ),
      {
        width: wallDimensions[0],
        height: wallDimensions[1],
        depthOrArrayLayers: wallDimensions[2]
      }
    );
    const commandEncoder = device.createCommandEncoder({id: 'volumetric-fire-wall-step'});
    wallSimulation.encode(commandEncoder, {...PASSIVE_STEP_OPTIONS, deltaTime: 1});
    device.submit(commandEncoder.finish());
    const combustion = await readRgba16FloatVolume(
      wallSimulation.combustionTexture,
      wallDimensions
    );
    let farSideDensity = 0;
    let totalDensity = 0;
    for (let zCoordinate = 0; zCoordinate < wallDimensions[2]; zCoordinate++) {
      for (let yCoordinate = 0; yCoordinate < wallDimensions[1]; yCoordinate++) {
        for (let xCoordinate = 0; xCoordinate < wallDimensions[0]; xCoordinate++) {
          const density = getVolumeValue(
            combustion,
            wallDimensions,
            xCoordinate,
            yCoordinate,
            zCoordinate,
            0
          );
          totalDensity += density;
          if (xCoordinate >= 7) {
            farSideDensity += density;
          }
        }
      }
    }
    testCase.ok(totalDensity > 0.5, 'the wall fixture preserves transported combustion mass');
    testCase.ok(farSideDensity < 0.01, 'a one-voxel wall blocks long advection backtraces');
  } finally {
    wallSimulation.destroy();
    wallObstacleTexture.destroy();
  }

  testCase.end();
});

function approximatelyEqual(actual: number[], expected: number[], epsilon = 1e-5): boolean {
  return actual.every((value, index) => Math.abs(value - expected[index]) <= epsilon);
}

function makeRgba16FloatVolume(
  dimensions: readonly [number, number, number],
  getValue: (
    xCoordinate: number,
    yCoordinate: number,
    zCoordinate: number
  ) => readonly [number, number, number, number]
): Uint16Array {
  const data = new Uint16Array(dimensions[0] * dimensions[1] * dimensions[2] * 4);
  for (let zCoordinate = 0; zCoordinate < dimensions[2]; zCoordinate++) {
    for (let yCoordinate = 0; yCoordinate < dimensions[1]; yCoordinate++) {
      for (let xCoordinate = 0; xCoordinate < dimensions[0]; xCoordinate++) {
        const valueOffset = getValueOffset(dimensions, xCoordinate, yCoordinate, zCoordinate, 0);
        const value = getValue(xCoordinate, yCoordinate, zCoordinate);
        for (let channel = 0; channel < 4; channel++) {
          data[valueOffset + channel] = toHalfFloat(value[channel]);
        }
      }
    }
  }
  return data;
}

function decodePackedRgba16FloatVolume(data: Uint16Array): Float32Array {
  return Float32Array.from(data, fromHalfFloat);
}

async function readRgba16FloatVolume(
  texture: Texture,
  dimensions: readonly [number, number, number]
): Promise<Float32Array> {
  const readOptions = {
    width: dimensions[0],
    height: dimensions[1],
    depthOrArrayLayers: dimensions[2]
  };
  const layout = texture.computeMemoryLayout(readOptions);
  const readback = texture.device.createBuffer({
    id: `${texture.id}-test-readback`,
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer(readOptions, readback);
    const bytes = await readback.readAsync();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const values = new Float32Array(dimensions[0] * dimensions[1] * dimensions[2] * 4);
    for (let zCoordinate = 0; zCoordinate < dimensions[2]; zCoordinate++) {
      for (let yCoordinate = 0; yCoordinate < dimensions[1]; yCoordinate++) {
        for (let xCoordinate = 0; xCoordinate < dimensions[0]; xCoordinate++) {
          const valueOffset = getValueOffset(dimensions, xCoordinate, yCoordinate, zCoordinate, 0);
          const byteOffset =
            zCoordinate * layout.bytesPerImage +
            yCoordinate * layout.bytesPerRow +
            xCoordinate * layout.bytesPerPixel;
          for (let channel = 0; channel < 4; channel++) {
            values[valueOffset + channel] = fromHalfFloat(
              view.getUint16(byteOffset + channel * Uint16Array.BYTES_PER_ELEMENT, true)
            );
          }
        }
      }
    }
    return values;
  } finally {
    readback.destroy();
  }
}

function getBackwardDivergenceRms(
  velocity: Float32Array,
  dimensions: readonly [number, number, number]
): number {
  let squaredDivergence = 0;
  let sampleCount = 0;
  for (let zCoordinate = 2; zCoordinate < dimensions[2] - 2; zCoordinate++) {
    for (let yCoordinate = 2; yCoordinate < dimensions[1] - 2; yCoordinate++) {
      for (let xCoordinate = 2; xCoordinate < dimensions[0] - 2; xCoordinate++) {
        const divergence =
          getVolumeValue(velocity, dimensions, xCoordinate, yCoordinate, zCoordinate, 0) -
          getVolumeValue(velocity, dimensions, xCoordinate - 1, yCoordinate, zCoordinate, 0) +
          getVolumeValue(velocity, dimensions, xCoordinate, yCoordinate, zCoordinate, 1) -
          getVolumeValue(velocity, dimensions, xCoordinate, yCoordinate - 1, zCoordinate, 1) +
          getVolumeValue(velocity, dimensions, xCoordinate, yCoordinate, zCoordinate, 2) -
          getVolumeValue(velocity, dimensions, xCoordinate, yCoordinate, zCoordinate - 1, 2);
        squaredDivergence += divergence * divergence;
        sampleCount++;
      }
    }
  }
  return Math.sqrt(squaredDivergence / sampleCount);
}

function getDensityMassAndCenter(
  combustion: Float32Array,
  dimensions: readonly [number, number, number]
): {mass: number; centerX: number} {
  let mass = 0;
  let weightedX = 0;
  for (let zCoordinate = 0; zCoordinate < dimensions[2]; zCoordinate++) {
    for (let yCoordinate = 0; yCoordinate < dimensions[1]; yCoordinate++) {
      for (let xCoordinate = 0; xCoordinate < dimensions[0]; xCoordinate++) {
        const density = getVolumeValue(
          combustion,
          dimensions,
          xCoordinate,
          yCoordinate,
          zCoordinate,
          0
        );
        mass += density;
        weightedX += density * xCoordinate;
      }
    }
  }
  return {mass, centerX: mass > 0 ? weightedX / mass : 0};
}

function getVolumeValue(
  values: Float32Array,
  dimensions: readonly [number, number, number],
  xCoordinate: number,
  yCoordinate: number,
  zCoordinate: number,
  channel: number
): number {
  return values[getValueOffset(dimensions, xCoordinate, yCoordinate, zCoordinate, channel)];
}

function getValueOffset(
  dimensions: readonly [number, number, number],
  xCoordinate: number,
  yCoordinate: number,
  zCoordinate: number,
  channel: number
): number {
  return getScalarOffset(dimensions, xCoordinate, yCoordinate, zCoordinate) * 4 + channel;
}

function getScalarOffset(
  dimensions: readonly [number, number, number],
  xCoordinate: number,
  yCoordinate: number,
  zCoordinate: number
): number {
  return (zCoordinate * dimensions[1] + yCoordinate) * dimensions[0] + xCoordinate;
}
