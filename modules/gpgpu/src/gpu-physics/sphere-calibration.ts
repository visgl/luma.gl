// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Analytic references in consistent length/time units, independent of the GPU solver.
 * These describe ideal Coulomb cloth and rigid impacts, not measured billiards data.
 */
export type SphereClothReference = {
  slidingTime: number;
  rollingSpeed: number;
  rollingDistance: number;
  sidespinStopTime: number;
};

export function getSphereClothReference(parameters: {
  speed: number;
  /** Angular speed in the forward rolling direction; negative for draw. */
  rollingAngularSpeed: number;
  sidespin: number;
  radius: number;
  gravity: number;
  slidingFriction: number;
  rollingResistance: number;
  spinningResistance: number;
}): SphereClothReference {
  const {
    speed,
    rollingAngularSpeed,
    sidespin,
    radius,
    gravity,
    slidingFriction,
    rollingResistance,
    spinningResistance
  } = parameters;
  const slip = speed - radius * rollingAngularSpeed;
  const slidingTime = slip === 0 ? 0 : Math.abs(slip) / (3.5 * slidingFriction * gravity);
  const rollingSpeed = slidingTime === Infinity ? speed : speed - slip / 3.5;
  return {
    slidingTime,
    rollingSpeed,
    rollingDistance: rollingSpeed === 0 ? 0 : rollingSpeed ** 2 / (2 * rollingResistance * gravity),
    sidespinStopTime:
      sidespin === 0 ? 0 : (Math.abs(sidespin) * radius) / (spinningResistance * gravity)
  };
}

export function getSphereCushionRestitution(
  restitution: number,
  velocityScale: number,
  normalSpeed: number
): number {
  return restitution / (1 + velocityScale * Math.abs(normalSpeed));
}

/** SI observations. A dataset must identify its source and whether it is measured. */
export type SphereCalibrationDataset = {
  provenance: {source: string; kind: 'measured' | 'analytic'; notes?: string};
  radius: number;
  gravity: number;
  cloth: readonly {
    initialSpeed: number;
    initialRollingAngularSpeed: number;
    slidingTime: number;
    rollingSpeed: number;
    rollingDistance: number;
    initialSidespin: number;
    sidespinStopTime: number;
  }[];
  cushions: readonly {normalSpeed: number; reboundSpeed: number}[];
};

export type SphereCalibrationResult = {
  provenance: SphereCalibrationDataset['provenance'];
  slidingFriction: number;
  rollingResistance: number;
  spinningResistance: number;
  restitution: number;
  restitutionVelocityScale: number;
  /** RMS residuals in m/s, m²/s², m/s and reciprocal restitution respectively. */
  residuals: readonly [number, number, number, number];
};

/** Fit the documented Coulomb/pace laws, without presenting model fixtures as measurements.
 * All three cloth channels and at least two distinct cushion speeds are required.
 * Compare residuals to the uncertainty of the supplied observations before using a fit.
 */
export function fitSphereCalibration(dataset: SphereCalibrationDataset): SphereCalibrationResult {
  const {radius, gravity, cloth, cushions, provenance} = dataset;
  if (
    !provenance.source.trim() ||
    !(radius > 0) ||
    !(gravity > 0) ||
    !Number.isFinite(radius + gravity) ||
    cloth.length === 0 ||
    cushions.length < 2
  ) {
    throw new Error('Incomplete sphere calibration dataset');
  }
  const channels: [number, number][][] = [[], [], []];
  for (const observation of cloth) {
    const {
      initialSpeed,
      initialRollingAngularSpeed,
      slidingTime,
      rollingSpeed,
      rollingDistance,
      initialSidespin,
      sidespinStopTime
    } = observation;
    if (
      !Object.values(observation).every(Number.isFinite) ||
      Math.min(initialSpeed, slidingTime, rollingDistance, sidespinStopTime) < 0
    ) {
      throw new Error('Invalid cloth observation');
    }
    channels[0].push([
      gravity * slidingTime,
      Math.abs(initialSpeed - radius * initialRollingAngularSpeed) / 3.5
    ]);
    channels[1].push([2 * gravity * rollingDistance, rollingSpeed ** 2]);
    channels[2].push([gravity * sidespinStopTime, Math.abs(initialSidespin) * radius]);
  }
  const fitOrigin = (samples: readonly [number, number][]): [number, number] => {
    const denominator = samples.reduce((sum, [input]) => sum + input * input, 0);
    if (!(denominator > 0)) throw new Error('Unidentifiable cloth calibration');
    const coefficient =
      samples.reduce((sum, [input, output]) => sum + input * output, 0) / denominator;
    const residual = Math.sqrt(
      samples.reduce((sum, [input, output]) => sum + (output - coefficient * input) ** 2, 0) /
        samples.length
    );
    return [coefficient, residual];
  };
  const clothFits = channels.map(fitOrigin);
  const samples = cushions.map(({normalSpeed, reboundSpeed}): [number, number] => {
    if (
      !(normalSpeed > 0) ||
      !(reboundSpeed > 0) ||
      reboundSpeed > normalSpeed ||
      !Number.isFinite(normalSpeed + reboundSpeed)
    )
      throw new Error('Invalid cushion observation');
    return [normalSpeed, normalSpeed / reboundSpeed];
  });
  const meanSpeed = samples.reduce((sum, [speed]) => sum + speed, 0) / samples.length;
  const meanResponse = samples.reduce((sum, [, response]) => sum + response, 0) / samples.length;
  const variance = samples.reduce((sum, [speed]) => sum + (speed - meanSpeed) ** 2, 0);
  if (!(variance > 0)) throw new Error('Unidentifiable cushion calibration');
  const slope =
    samples.reduce(
      (sum, [speed, response]) => sum + (speed - meanSpeed) * (response - meanResponse),
      0
    ) / variance;
  const intercept = meanResponse - slope * meanSpeed;
  if (intercept < 1 - 1e-10 || slope < -1e-10)
    throw new Error('Cushion observations do not fit a passive pace law');
  const restitution = Math.min(1, 1 / intercept);
  const restitutionVelocityScale = Math.max(0, slope / intercept);
  const cushionResidual = Math.sqrt(
    samples.reduce(
      (sum, [speed, response]) =>
        sum + (response - (1 + restitutionVelocityScale * speed) / restitution) ** 2,
      0
    ) / samples.length
  );
  return {
    provenance: {...provenance},
    slidingFriction: clothFits[0][0],
    rollingResistance: clothFits[1][0],
    spinningResistance: clothFits[2][0],
    restitution,
    restitutionVelocityScale,
    residuals: [clothFits[0][1], clothFits[1][1], clothFits[2][1], cushionResidual]
  };
}
