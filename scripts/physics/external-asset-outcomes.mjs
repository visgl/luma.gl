// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Check the intended physical outcome of each pinned upstream fixture. */
export function checkExternalAssetOutcome(fixture, {bodies, initial, checkpoints}) {
  const findBody = name => bodies.findIndex(body => body.name === name);
  const at = (tick, name) =>
    checkpoints.find(checkpoint => checkpoint.tick === tick)?.state[findBody(name)];
  switch (fixture) {
    case 'MotionProperties': {
      const balloons = bodies.flatMap((body, index) =>
        body.name?.startsWith('Balloon_') ? [index] : []
      );
      const first = checkpoints.find(checkpoint => checkpoint.tick === 30);
      const wheelIndex = findBody('Wheel_InfiniteMassFiniteInertia');
      const wheel = at(240, 'Wheel_InfiniteMassFiniteInertia');
      return (
        balloons.length === 4 &&
        balloons.every(index => first?.state[index].velocity[1] > 0.5) &&
        wheel &&
        Math.hypot(
          ...wheel.position.map((value, axis) => value - initial[wheelIndex].position[axis])
        ) < 1e-5
      );
    }
    case 'Materials_Restitution':
      return (
        at(90, 'Basketball')?.velocity[1] > 0.2 &&
        Math.abs(at(90, 'Bowlingball')?.velocity[1]) < 0.1
      );
    case 'Materials_Friction': {
      const soap = at(210, 'Soap2.001');
      const honeycomb = at(210, 'HoneyCombWalls');
      return soap && honeycomb && soap.position[2] - honeycomb.position[2] > 1;
    }
    case 'Filtering':
      return (
        at(210, 'DynamicGreen')?.position[1] > 3 &&
        at(210, 'DynamicBlue')?.position[1] < 1 &&
        at(210, 'DynamicGreen.001')?.position[1] < 1
      );
    default:
      return false;
  }
}
