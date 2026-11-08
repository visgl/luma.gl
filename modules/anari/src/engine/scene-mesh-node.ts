// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GeometryNode, type GeometryNodeProps} from '@luma.gl/engine';
import type {SceneMaterial, SceneEnvironment} from './scene-renderer';

export type SceneMeshNodeProps = GeometryNodeProps & {
  material: SceneMaterial;
  /** Optional local reflection probe, retaining the scene's direct lighting. */
  environment?: SceneEnvironment;
  /** A box aligned between two GPU matrix origins; useful for ropes and rods. */
  connection?: {first: number; second: number; radius: number};
};

/** Declarative PBR mesh; SceneRenderer owns the compiled models. */
export class SceneMeshNode extends GeometryNode {
  material: SceneMaterial;
  environment?: SceneEnvironment;
  connection?: SceneMeshNodeProps['connection'];
  constructor(props: SceneMeshNodeProps) {
    super(props);
    this.material = props.material;
    this.environment = props.environment;
    this.connection = props.connection;
  }
}
