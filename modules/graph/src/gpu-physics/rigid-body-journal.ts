// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyMaterial} from './rigid-body-properties';
import type {GPURigidBodyJoint} from './rigid-body-joints';
import type {
  GPURigidBodyWorld,
  GPURigidBodyCapture,
  GPURigidBodyParameters
} from './gpu-rigid-body-world';

export type GPURigidBodyCommand =
  | {
      type: 'impulse';
      body: number;
      impulse: readonly [number, number, number];
      point?: readonly [number, number, number];
    }
  | {
      type: 'kinematic-target';
      body: number;
      position: readonly [number, number, number];
      orientation: readonly [number, number, number, number];
    }
  | {type: 'angular-impulse'; body: number; impulse: readonly [number, number, number]}
  | {
      type: 'collider-transform';
      collider: number;
      position: readonly [number, number, number];
      orientation: readonly [number, number, number, number];
    }
  | {type: 'collider-material'; collider: number; material: GPURigidBodyMaterial}
  | {type: 'body-parameters'; body: number; parameters: GPURigidBodyParameters}
  | {type: 'joint-parameters'; joint: number; parameters: GPURigidBodyJoint}
  | {type: 'joint-enabled'; joint: number; enabled: boolean};
export type GPURigidBodyReplay = {
  version: 1;
  capture: GPURigidBodyCapture;
  commands: {tick: number; command: GPURigidBodyCommand}[];
};

/** Ordered external mutations paired with a complete GPU checkpoint. Ticks are application-owned. */
export class GPURigidBodyCommandJournal {
  private commands: GPURigidBodyReplay['commands'] = [];
  private capture?: GPURigidBodyCapture;
  constructor(private readonly world: GPURigidBodyWorld) {}
  apply(tick: number, command: GPURigidBodyCommand): void {
    if (
      !this.capture ||
      !Number.isSafeInteger(tick) ||
      tick < 0 ||
      tick < (this.commands.at(-1)?.tick ?? 0)
    )
      throw new Error('Invalid command tick');
    const saved = structuredClone(command);
    applyRigidBodyCommand(this.world, saved);
    this.commands.push({tick, command: saved});
  }
  /** Call after prior GPU submissions finish, before recording the new segment. */
  async begin(): Promise<GPURigidBodyCapture> {
    const capture = await this.world.captureState();
    this.commands = [];
    this.capture = capture;
    return structuredClone(capture);
  }
  export(): GPURigidBodyReplay {
    if (!this.capture) throw new Error('Journal has not begun');
    return structuredClone({version: 1, capture: this.capture, commands: this.commands});
  }
}

export function applyRigidBodyCommand(
  world: GPURigidBodyWorld,
  command: GPURigidBodyCommand
): void {
  switch (command.type) {
    case 'impulse':
      world.applyImpulse(command.body, command.impulse, command.point);
      break;
    case 'kinematic-target':
      world.setKinematicTarget(command.body, command.position, command.orientation);
      break;
    case 'angular-impulse':
      world.applyAngularImpulse(command.body, command.impulse);
      break;
    case 'collider-transform':
      world.setColliderTransform(command.collider, command.position, command.orientation);
      break;
    case 'collider-material':
      world.setColliderMaterial(command.collider, command.material);
      break;
    case 'body-parameters':
      world.setBodyParameters(command.body, command.parameters);
      break;
    case 'joint-parameters':
      world.setJointParameters(command.joint, command.parameters);
      break;
    case 'joint-enabled':
      world.setJointEnabled(command.joint, command.enabled);
      break;
  }
}

/** Restores a checkpoint and replays commands before each tick, preserving same-tick insertion order. */
export async function replayRigidBodyCommands(
  world: GPURigidBodyWorld,
  replay: GPURigidBodyReplay,
  endTick: number,
  advance: (tick: number) => Promise<void>
): Promise<void> {
  if (
    replay.version !== 1 ||
    !Number.isSafeInteger(endTick) ||
    endTick < 0 ||
    replay.commands.some(
      (entry, index) =>
        !Number.isSafeInteger(entry.tick) ||
        entry.tick < 0 ||
        entry.tick >= endTick ||
        entry.tick < (replay.commands[index - 1]?.tick ?? 0)
    )
  )
    throw new Error('Invalid replay');
  world.restoreState(replay.capture);
  let index = 0;
  for (let tick = 0; tick < endTick; tick++) {
    while (replay.commands[index]?.tick === tick)
      applyRigidBodyCommand(world, replay.commands[index++].command);
    await advance(tick);
  }
}
