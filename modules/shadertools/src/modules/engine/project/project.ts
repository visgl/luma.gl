// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4, Vector3} from '@math.gl/core';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import type {NumberArray3, NumberArray16} from '@math.gl/core';

const IDENTITY_MATRIX: Readonly<NumberArray16> = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/**
 * @note Projection uniforms are normally constant across draw calls,
 * at least for each view.
 */
export type ProjectionProps = {
  viewMatrix?: Readonly<Matrix4 | NumberArray16>;
  projectionMatrix?: Readonly<Matrix4 | NumberArray16>;
  cameraPositionWorld?: Readonly<Vector3 | NumberArray3>;
};

/**
 * @note Projection uniforms are normally constant across draw calls,
 * at least for each view.
 */
export type ProjectionUniforms = {
  viewMatrix?: Readonly<Matrix4 | NumberArray16>;
  projectionMatrix?: Readonly<Matrix4 | NumberArray16>;
  viewProjectionMatrix?: Readonly<Matrix4 | NumberArray16>;
  cameraPositionWorld?: Readonly<Vector3 | NumberArray3>;
};

const DEFAULT_MODULE_OPTIONS: Required<ProjectionUniforms> = {
  viewMatrix: IDENTITY_MATRIX,
  projectionMatrix: IDENTITY_MATRIX,
  viewProjectionMatrix: IDENTITY_MATRIX,
  cameraPositionWorld: [0, 0, 0]
};

function getUniforms(
  opts: ProjectionProps = DEFAULT_MODULE_OPTIONS,
  prevUniforms: ProjectionUniforms = {}
): ProjectionUniforms {
  // const viewProjectionInverse = viewProjection.invert();
  // viewInverseMatrix: view.invert(),
  // viewProjectionInverseMatrix: viewProjectionInverse

  const uniforms: Record<string, any> = {};
  if (opts.viewMatrix !== undefined) {
    uniforms.viewMatrix = opts.viewMatrix;
  }
  if (opts.projectionMatrix !== undefined) {
    uniforms.projectionMatrix = opts.projectionMatrix;
  }
  if (opts.cameraPositionWorld !== undefined) {
    uniforms.cameraPositionWorld = opts.cameraPositionWorld;
  }
  // COMPOSITE UNIFORMS
  if (opts.projectionMatrix !== undefined || opts.viewMatrix !== undefined) {
    uniforms.viewProjectionMatrix = new Matrix4(uniforms.projectionMatrix).multiplyRight(
      uniforms.viewMatrix
    );
  }

  return uniforms;
}

/**
 * Projection uniforms are normally constant across draw calls,
 * at least for each view.
 * @note varyings must match vertex shader
 * @note project module uses unprefixed uniforms to match conventions
 */
const vs = /* glsl */ `\
varying vec4 project_vPositionWorld;
varying vec3 project_vNormalWorld;

// Project uniform block
uniform Project {
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 viewProjectionMatrix;
  vec3 cameraPositionWorld;
} project;

struct World {
  vec3 position;
  vec3 normal;
};

World world;

void project_setPosition(vec4 position) {
  project_vPositionWorld = position;
}

void project_setNormal(vec3 normal) {
  project_vNormalWorld = normal;
}

void project_setPositionAndNormal_World(vec3 position, vec3 normal) {
  world.position = position;
  world.normal = normal;
}

void project_setPositionAndNormal_Model(vec3 position, vec3 normal, mat4 modelMatrix) {
  world.position = (modelMatrix * vec4(position, 1.)).xyz;
  world.normal = mat3(modelMatrix) * normal;
}

vec4 project_model_to_clipspace(vec4 position) {
  return project.viewProjectionMatrix * position;
}

vec4 project_model_to_clipspace_Model(vec3 position, mat4 modelMatrix) {
  return project.viewProjectionMatrix * modelMatrix * vec4(position, 1.);
}

vec4 project_world_to_clipspace(vec3 position) {
  return project.viewProjectionMatrix * vec4(position, 1.);
}

vec4 project_view_to_clipspace(vec3 position) {
  return project.projectionMatrix * vec4(position, 1.);
}

vec4 project_to_clipspace(vec3 position) {
  return project.viewProjectionMatrix * vec4(position, 1.);
}
`;

/**
 * Functions to get the position and normal from the vertex shader
 * @note varyings must match vertex shader
 */
const fs = /* glsl */ `\
varying vec4 project_vPositionWorld;
varying vec3 project_vNormalWorld;

vec4 project_getPosition_World() {
  return project_vPositionWorld;
}

vec3 project_getNormal_World() {
  return project_vNormalWorld;
}
`;

/**
 * Projects coordinates
 */
export const projection = {
  name: 'projection',
  // Note: order and types MUST match declarations in shader
  uniformTypes: {
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    viewProjectionMatrix: 'mat4x4<f32>',
    cameraPositionWorld: 'vec3<f32>'
  },
  getUniforms,
  vs,
  fs
} as const satisfies ShaderModule<ProjectionProps, ProjectionUniforms>;
