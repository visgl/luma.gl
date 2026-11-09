// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type GPURigidBodyJointLimit = {
  angular?: boolean;
  axes: readonly number[];
  minimum?: number;
  maximum?: number;
  stiffness?: number;
  damping?: number;
};
export type GPURigidBodyJointDrive = {
  angular?: boolean;
  axis: number;
  mode?: 'force' | 'acceleration';
  positionTarget?: number;
  velocityTarget?: number;
  stiffness?: number;
  damping?: number;
  maximumForce?: number;
};
