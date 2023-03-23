import {Matrix4} from '@math.gl/core';

export type ScenegraphNodeProps = {};

export default class ScenegraphNode {
  readonly id: string;
  readonly matrix: Matrix4;

  constructor(props?: ScenegraphNodeProps);
  delete(): void;
  setProps(props: ScenegraphNodeProps): this;
  toString(): string;
  getBounds(): [number[], number[]] | null;
  setPosition(position: any): this;
  setRotation(rotation: any): this;
  setScale(scale: any): this;
  setMatrix(matrix: any, copyMatrix?: boolean): void;
  setMatrixComponents(components: {
    position?: any;
    rotation?: any;
    scale?: any;
    update?: boolean;
  }): this;
  updateMatrix(): this;
  update(options?: {position: any; rotation: any; scale: any}): this;
  getCoordinateUniforms(
    viewMatrix: any,
    modelMatrix?: any
  ): {
    viewMatrix: any;
    modelMatrix: any;
    objectMatrix: any;
    worldMatrix: any;
    worldInverseMatrix: any;
    worldInverseTransposeMatrix: any;
  };
  _setScenegraphNodeProps(props: any): void;
}
