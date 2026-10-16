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
  const slidingTime = Math.abs(slip) / (3.5 * slidingFriction * gravity);
  const rollingSpeed = speed - slip / 3.5;
  return {
    slidingTime,
    rollingSpeed,
    rollingDistance: rollingSpeed ** 2 / (2 * rollingResistance * gravity),
    sidespinStopTime: (Math.abs(sidespin) * radius) / (spinningResistance * gravity)
  };
}

export function getSphereCushionRestitution(
  restitution: number,
  velocityScale: number,
  normalSpeed: number
): number {
  return restitution / (1 + velocityScale * Math.abs(normalSpeed));
}
