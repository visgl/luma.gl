// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix3} from '@math.gl/core';

export type PBRTextureTransform = {
  offset: [number, number];
  rotation: number;
  scale: [number, number];
};

export function getTextureTransformMatrix(transform: PBRTextureTransform): number[] {
  const translationMatrix = new Matrix3().set(
    1,
    0,
    0,
    0,
    1,
    0,
    transform.offset[0],
    transform.offset[1],
    1
  );
  const rotationMatrix = new Matrix3().set(
    Math.cos(transform.rotation),
    Math.sin(transform.rotation),
    0,
    -Math.sin(transform.rotation),
    Math.cos(transform.rotation),
    0,
    0,
    0,
    1
  );
  const scaleMatrix = new Matrix3().set(
    transform.scale[0],
    0,
    0,
    0,
    transform.scale[1],
    0,
    0,
    0,
    1
  );

  return Array.from(translationMatrix.multiplyRight(rotationMatrix).multiplyRight(scaleMatrix));
}

export function getTextureTransformDeltaMatrix(
  baseTransform: PBRTextureTransform,
  currentTransform: PBRTextureTransform
): number[] {
  const baseMatrix = new Matrix3(getTextureTransformMatrix(baseTransform));
  const currentMatrix = new Matrix3(getTextureTransformMatrix(currentTransform));
  const inverseBaseMatrix = new Matrix3(baseMatrix).invert();
  return Array.from(currentMatrix.multiplyRight(inverseBaseMatrix));
}
