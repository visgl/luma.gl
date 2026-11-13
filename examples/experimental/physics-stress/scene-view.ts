// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  CubeGeometry,
  Geometry,
  GroupNode,
  SphereGeometry,
  TruncatedConeGeometry,
  type ScenegraphNode,
  type ScenegraphTransformBinding
} from '@luma.gl/engine';
import {SceneMeshNode, SceneRenderer, type SceneMaterial} from '@luma.gl/anari';
import type {
  GPURigidBodyShape,
  GPURigidBodyWorld,
  GPURigidBodyWorldProps
} from '@luma.gl/graph/gpu-physics';
import {Matrix4, Vector3} from '@math.gl/core';
import {CapsuleGeometry} from '@math.gl/geometry';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createLabEnvironment} from '../gpu-rigid-body-world/lab-material';

const TABLE: SceneMaterial = {
  id: 'stress-table',
  uniforms: {baseColorFactor: [0.18, 0.22, 0.25, 1], metallicRoughnessValues: [0.1, 0.7]}
};
const BODY: SceneMaterial = {
  id: 'stress-body',
  uniforms: {baseColorFactor: [0.75, 0.32, 0.08, 1], metallicRoughnessValues: [0.15, 0.35]}
};

const TWO_SIDED_TABLE: SceneMaterial = {...TABLE, id: 'stress-table-two-sided', doubleSided: true};
const TWO_SIDED_BODY: SceneMaterial = {...BODY, id: 'stress-body-two-sided', doubleSided: true};

/** Retained engine rendering, borrowing published physics poses even after recovery replaces a world. */
export class StressSceneView {
  private readonly renderer: SceneRenderer;
  private readonly environment;
  private readonly camera = new PerspectiveCamera(45, 1, 0.1, 2000);
  private readonly controls: OrbitControls;
  private root = new GroupNode();
  private world?: GPURigidBodyWorld;
  private bindings = new Map<ScenegraphNode, ScenegraphTransformBinding>();
  private framed = false;
  private extent = 20;
  private center: [number, number, number] = [0, 0, 0];

  constructor(
    private readonly device: Device,
    private readonly canvas: HTMLCanvasElement
  ) {
    this.renderer = new SceneRenderer(device);
    this.environment = createLabEnvironment(device);
    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
  }

  setWorld(world: GPURigidBodyWorld, props: GPURigidBodyWorldProps, frameCamera = false): void {
    this.renderer.destroyScene(this.root);
    this.root.destroy();
    this.world = world;
    this.bindings = new Map();
    this.root = new GroupNode({
      id: 'stress-scene',
      transformSource: {
        getFrame: () => ({
          matrices: this.world!.poseMatrices!,
          matrixCount: this.world!.count,
          revision: 0,
          bindings: this.bindings
        })
      }
    });
    const cube = new CubeGeometry();
    const sphere = new SphereGeometry({nlat: 24, nlong: 32});
    for (const [index, body] of props.bodies.entries()) {
      const colliders = body.colliders ?? [{shape: body.shape}];
      for (const [colliderIndex, collider] of colliders.entries()) {
        const localMatrix = new Matrix4()
          .translate(collider.position ?? [0, 0, 0])
          .multiplyRight(new Matrix4().fromQuaternion(collider.orientation ?? [0, 0, 0, 1]));
        const shape = collider.shape;
        let geometry: Geometry;
        if (shape.type === 'box') {
          geometry = cube;
          localMatrix.scale(shape.halfExtents);
        } else if (shape.type === 'sphere') {
          geometry = sphere;
          localMatrix.scale([shape.radius, shape.radius, shape.radius]);
        } else geometry = makeShapeGeometry(shape);
        const isStatic = body.mode === 'static' || body.mass === 0;
        const doubleSided =
          shape.type === 'triangle-mesh' || (shape.type === 'plane' && shape.doubleSided);
        const material = isStatic
          ? doubleSided
            ? TWO_SIDED_TABLE
            : TABLE
          : doubleSided
            ? TWO_SIDED_BODY
            : BODY;
        const node = new SceneMeshNode({
          id: `body-${index}-${colliderIndex}`,
          geometry,
          material
        });
        this.bindings.set(node, {matrixIndex: index, localMatrix});
        this.root.add(node);
      }
    }
    for (const [index, joint] of (props.joints ?? []).entries()) {
      if (joint.type === 'distance')
        this.root.add(
          new SceneMeshNode({
            id: `joint-${index}`,
            geometry: cube,
            material: TABLE,
            connection: {first: joint.first, second: joint.second, radius: 0.025}
          })
        );
    }
    const dynamicBodies = props.bodies.filter(body => body.mode !== 'static' && body.mass !== 0);
    const minimum = [0, 1, 2].map(axis =>
      Math.min(0, ...dynamicBodies.map(body => body.position[axis]))
    );
    const maximum = [0, 1, 2].map(axis =>
      Math.max(0, ...dynamicBodies.map(body => body.position[axis]))
    );
    this.center = [
      (minimum[0] + maximum[0]) / 2,
      (minimum[1] + maximum[1]) / 2,
      (minimum[2] + maximum[2]) / 2
    ];
    this.extent = Math.max(8, ...maximum.map((value, axis) => value - minimum[axis])) + 4;
    if (!this.framed || frameCamera) {
      this.controls.target.set(...this.center);
      this.camera.position.set(
        this.center[0] + this.extent * 1.5,
        this.center[1] - this.extent * 1.8,
        this.center[2] + this.extent * 1.3
      );
      this.controls.update();
      this.framed = true;
    }
  }

  /** Recovery may replace all GPU allocations without changing the authored scene. */
  updateWorld(world: GPURigidBodyWorld): void {
    this.world = world;
  }

  draw(): void {
    if (!this.world?.poseMatrices) return;
    this.camera.aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.camera.updateMatrixWorld();
    const projection = new Matrix4([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
    ]).multiplyRight(this.camera.projectionMatrix.elements);
    const position: [number, number, number] = [
      this.center[0] - this.extent,
      this.center[1] - this.extent,
      this.extent * 3
    ];
    const directionVector = new Vector3(this.center).subtract(position).normalize();
    const direction: [number, number, number] = [
      directionVector[0],
      directionVector[1],
      directionVector[2]
    ];
    const spotlight = {
      type: 'spot' as const,
      position,
      direction,
      color: [1, 0.92, 0.8] as const,
      intensity: 3,
      innerConeAngle: 0.3,
      outerConeAngle: 0.7
    };
    this.renderer.render({
      scene: this.root,
      camera: {
        viewMatrix: new Matrix4(this.camera.matrixWorldInverse.elements),
        projectionMatrix: projection,
        position: this.camera.position.toArray(),
        near: 0.1,
        far: 2000,
        clipDepth: 'zero-to-one'
      },
      environment: this.environment,
      background: [0.055, 0.07, 0.085, 1],
      lights: [spotlight, {type: 'ambient', color: [1, 1, 1], intensity: 0.25}],
      spotShadows: {
        spotLights: [
          {
            position,
            direction,
            outerConeAngle: 0.7,
            range: this.extent * 6,
            normalBias: 0.008,
            sourceRadius: 0.04,
            depthBias: 2,
            depthBiasSlopeScale: 2
          }
        ]
      }
    });
    this.device.submit();
  }

  destroy(): void {
    this.controls.dispose();
    this.renderer.destroy();
    this.root.destroy();
    this.environment.destroy();
  }
}

function makeShapeGeometry(shape: Exclude<GPURigidBodyShape, {type: 'box' | 'sphere'}>): Geometry {
  if (shape.type === 'capsule') {
    const geometry = new CapsuleGeometry({
      height: shape.height,
      radiusBottom: shape.radiusBottom,
      radiusTop: shape.radiusTop
    });
    return new Geometry({...geometry, attributes: geometry.attributes});
  }
  if (shape.type === 'cylinder')
    return new TruncatedConeGeometry({
      height: shape.height,
      bottomRadius: shape.radiusBottom,
      topRadius: shape.radiusTop,
      verticalAxis: 'y',
      topCap: true,
      bottomCap: true
    });
  if (shape.type === 'plane')
    return new Geometry({
      topology: 'triangle-list',
      attributes: {
        POSITION: {
          size: 3,
          value: new Float32Array([
            -(shape.sizeX ?? 40) / 2,
            0,
            -(shape.sizeZ ?? 40) / 2,
            -(shape.sizeX ?? 40) / 2,
            0,
            (shape.sizeZ ?? 40) / 2,
            (shape.sizeX ?? 40) / 2,
            0,
            (shape.sizeZ ?? 40) / 2,
            (shape.sizeX ?? 40) / 2,
            0,
            -(shape.sizeZ ?? 40) / 2
          ])
        },
        NORMAL: {size: 3, value: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0])}
      },
      indices: new Uint16Array([0, 1, 2, 0, 2, 3])
    });
  const positions: number[] = [],
    normals: number[] = [];
  for (let index = 0; index < shape.geometry.indices.length; index += 3) {
    const vertices = [0, 1, 2].map(corner => {
      const offset = shape.geometry.indices[index + corner] * 3;
      return new Vector3(Array.from(shape.geometry.positions.slice(offset, offset + 3)));
    });
    const normal = vertices[1]
      .clone()
      .subtract(vertices[0])
      .cross(vertices[2].clone().subtract(vertices[0]))
      .normalize();
    for (const vertex of vertices) {
      positions.push(...vertex);
      normals.push(...normal);
    }
  }
  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array(positions)},
      NORMAL: {size: 3, value: new Float32Array(normals)}
    }
  });
}
