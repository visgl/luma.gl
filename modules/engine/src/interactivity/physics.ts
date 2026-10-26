// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Host physics contract for behavior graphs; independent of asset format and GPU backend. */
export type InteractivityPhysics = {
  applyImpulse(node: number, linear: readonly number[], angular: readonly number[]): void;
  applyPointImpulse(node: number, impulse: readonly number[], position: readonly number[]): void;
  rayCast(
    start: readonly number[],
    end: readonly number[],
    filter: number
  ): Promise<{
    node: number;
    fraction: number;
    normal: readonly number[];
  } | null>;
  isTriggerNode(node: number): boolean;
};
