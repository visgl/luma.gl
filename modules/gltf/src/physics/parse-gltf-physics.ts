// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {isGLTFPhysicsPropertyPointer} from '../parsers/parse-gltf-physics-pointer';
import {parsePhysicsJoints} from './parse-physics-joints';
import {Matrix4, Quaternion} from '@math.gl/core';
import {collectNodeCollisionGeometry} from './node-collision-geometry';
import {getMeshBoxBounds} from './mesh-box-shape';
import {
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  getRigidBodyShapeProperties
} from '@luma.gl/graph/gpu-physics';
import type {GPURigidBodyMaterial, GPURigidBodyShape} from '@luma.gl/graph/gpu-physics';
import type {
  GLTFPhysicsDescription,
  GLTFPhysicsDocument,
  GLTFPhysicsBody,
  ParseGLTFPhysicsOptions
} from './physics-types';
import {
  decomposePhysicsTransform,
  readPhysicsRotation,
  readPhysicsVector,
  transformPhysicsVector
} from './physics-transforms';

const PHYSICS = 'KHR_physics_rigid_bodies';
const SHAPES = 'KHR_implicit_shapes';
export const GLTF_PHYSICS_DRAFT = {
  rigidBodies: '13ffdd2d681736c3fdbac0d53b4f490770c178e4',
  implicitShapes: 'f817a1b252dcee25fa14174a49bc219310f61ddb'
} as const;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as Record<string, unknown>;
}
function array(value: unknown): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Expected an array');
  return value;
}
function scalar(value: unknown, fallback: number, nonnegative = true): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || (nonnegative && value < 0))
    throw new Error('Expected a finite scalar');
  return value;
}
function index(value: unknown, values: readonly unknown[]): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= values.length)
    throw new Error('Reference is out of range');
  return value;
}
function checkFields(value: Record<string, unknown>, fields: readonly string[]): void {
  for (const key of Object.keys(value))
    if (
      key !== 'extras' &&
      key !== 'name' &&
      !(key === 'extensions' && Object.keys(record(value[key])).length === 0) &&
      !fields.includes(key)
    )
      throw new Error(`Unsupported draft field: ${key}`);
}
function strings(value: unknown): string[] {
  const values = array(value);
  if (!values.every(item => typeof item === 'string')) throw new Error('Expected system names');
  return values as string[];
}
type Filter = {systems: string[]; include?: string[]; exclude?: string[]};
function parseFilter(value: unknown): Filter {
  if (value === undefined) return {systems: []};
  const source = record(value);
  checkFields(source, ['collisionSystems', 'collideWithSystems', 'notCollideWithSystems']);
  if (source['collideWithSystems'] !== undefined && source['notCollideWithSystems'] !== undefined)
    throw new Error('Collision filter must use include or exclude, not both');
  return {
    systems: strings(source['collisionSystems']),
    include:
      source['collideWithSystems'] === undefined
        ? undefined
        : strings(source['collideWithSystems']),
    exclude:
      source['notCollideWithSystems'] === undefined
        ? undefined
        : strings(source['notCollideWithSystems'])
  };
}
function allowsFilter(subject: Filter, target: Filter): boolean {
  return (
    (!target.include || subject.systems.some(system => target.include!.includes(system))) &&
    !subject.systems.some(system => target.exclude?.includes(system))
  );
}
function parseMaterial(value: unknown): GPURigidBodyMaterial {
  const source = value === undefined ? {} : record(value);
  checkFields(source, [
    'staticFriction',
    'dynamicFriction',
    'restitution',
    'frictionCombine',
    'restitutionCombine'
  ]);
  const policy = (value: unknown): GPURigidBodyMaterial['frictionCombine'] => {
    if (value === undefined) return 'average';
    if (value === 'average' || value === 'minimum' || value === 'maximum' || value === 'multiply')
      return value;
    throw new Error('Unsupported material combine policy');
  };
  const restitution = scalar(source['restitution'], value === undefined ? 0.1 : 0);
  if (restitution > 1) throw new Error('Restitution must be at most one');
  return {
    staticFriction: scalar(source['staticFriction'], 0.6),
    dynamicFriction: scalar(source['dynamicFriction'], 0.6),
    restitution,
    frictionCombine: policy(source['frictionCombine']),
    restitutionCombine: policy(source['restitutionCombine'])
  };
}
function parseShape(value: unknown, scale: readonly number[]): GPURigidBodyShape {
  const source = record(value);
  if (source['type'] === 'sphere') {
    checkFields(source, ['type', 'sphere']);
    const sphere = record(source['sphere'] ?? {});
    checkFields(sphere, ['radius']);
    const absolute = scale.map(Math.abs);
    if (Math.max(...absolute) - Math.min(...absolute) > 1e-5 * Math.max(...absolute))
      throw new Error('Nonuniformly scaled spheres need ellipsoid support');
    const radius = scalar(sphere['radius'], 0.5) * absolute[0];
    if (!(radius > 0)) throw new Error('Sphere radius must be positive');
    return {type: 'sphere', radius};
  }
  if (source['type'] === 'plane') {
    checkFields(source, ['type', 'plane']);
    const parameters = record(source['plane'] ?? {});
    checkFields(parameters, ['sizeX', 'sizeZ', 'doubleSided']);
    if (parameters['doubleSided'] !== undefined && typeof parameters['doubleSided'] !== 'boolean')
      throw new Error('doubleSided must be boolean');
    const shape: GPURigidBodyShape = {
      type: 'plane',
      sizeX:
        parameters['sizeX'] === undefined
          ? undefined
          : scalar(parameters['sizeX'], 1) * Math.abs(scale[0]),
      sizeZ:
        parameters['sizeZ'] === undefined
          ? undefined
          : scalar(parameters['sizeZ'], 1) * Math.abs(scale[2]),
      doubleSided: parameters['doubleSided'] === true
    };
    getRigidBodyShapeProperties(shape);
    return shape;
  }
  if (source['type'] === 'box') {
    checkFields(source, ['type', 'box']);
    const box = record(source['box'] ?? {});
    checkFields(box, ['size']);
    const size = readPhysicsVector(box['size'], [1, 1, 1]);
    if (size.some(value => value <= 0)) throw new Error('Box size must be positive');
    return {
      type: 'box',
      halfExtents: [
        (size[0] * Math.abs(scale[0])) / 2,
        (size[1] * Math.abs(scale[1])) / 2,
        (size[2] * Math.abs(scale[2])) / 2
      ]
    };
  }
  if (source['type'] === 'capsule' || source['type'] === 'cylinder') {
    const type = source['type'];
    checkFields(source, ['type', type]);
    const parameters = record(source[type] ?? {});
    checkFields(parameters, ['height', 'radiusBottom', 'radiusTop']);
    const absolute = scale.map(Math.abs);
    if (
      Math.abs(absolute[0] - absolute[2]) > 1e-5 * Math.max(...absolute) ||
      (type === 'capsule' && Math.abs(absolute[0] - absolute[1]) > 1e-5 * Math.max(...absolute))
    )
      throw new Error('Unsupported nonuniform tapered shape scale');
    const shape: GPURigidBodyShape = {
      type,
      height: scalar(parameters['height'], type === 'capsule' ? 1 : 2) * absolute[1],
      radiusBottom: scalar(parameters['radiusBottom'], 0.5) * absolute[0],
      radiusTop: scalar(parameters['radiusTop'], 0.5) * absolute[0]
    };
    getRigidBodyShapeProperties(shape);
    return shape;
  }
  throw new Error(`Unsupported implicit shape: ${String(source['type'])}`);
}

/** Decode the pinned raw-JSON draft without allocating GPU resources or modifying its source. */
export function parseGLTFPhysics(
  document: GLTFPhysicsDocument,
  options: ParseGLTFPhysicsOptions = {}
): GLTFPhysicsDescription {
  const source = structuredClone(document);
  const result: GLTFPhysicsDescription = {
    draft: {...GLTF_PHYSICS_DRAFT},
    supported: false,
    issues: [],
    bodies: [],
    colliders: [],
    joints: [],
    triggers: [],
    sceneJoints: [],
    animatedBodyIndices: [],
    animatedColliderIndices: [],
    querySelections: [],
    sceneNodes: new Map(),
    sceneRoots: [],
    source
  };
  const report = (code: string, path: string, error: unknown) =>
    result.issues.push({
      code,
      path,
      message: error instanceof Error ? error.message : String(error)
    });
  const nodes = source.nodes ?? [];
  const worlds = new Map<number, Matrix4>();
  const parents = new Map<number, number>();
  const filters: Filter[] = [];
  const density = options.density ?? 1000;
  if (!(density > 0) || !Number.isFinite(density))
    report('invalid-density', '/', 'Density must be positive');
  if (
    source.extensions?.['KHR_collision_shapes'] ||
    source.extensionsRequired?.includes('KHR_collision_shapes')
  )
    report(
      'draft-mismatch',
      '/extensions/KHR_collision_shapes',
      'Use the pinned KHR_implicit_shapes revision; legacy spellings are not aliases'
    );
  let shapes: unknown[] = [];
  let materials: unknown[] = [];
  let collisionFilters: unknown[] = [];
  try {
    const root =
      source.extensions?.[PHYSICS] === undefined ? {} : record(source.extensions[PHYSICS]);
    checkFields(root, ['physicsMaterials', 'collisionFilters', 'physicsJoints']);
    materials = array(root['physicsMaterials']);
    collisionFilters = array(root['collisionFilters']);
    const shapeRoot =
      source.extensions?.[SHAPES] === undefined ? {} : record(source.extensions[SHAPES]);
    checkFields(shapeRoot, ['shapes']);
    shapes = array(shapeRoot['shapes']);
  } catch (error) {
    report('invalid-extension', '/extensions', error);
  }
  const bodyByNode = new Map<number, GLTFPhysicsBody>();
  function visit(
    nodeIndex: number,
    parentWorld: Matrix4,
    owner: number | undefined,
    ancestry: Set<number>
  ): void {
    const path = `/nodes/${nodeIndex}`;
    try {
      index(nodeIndex, nodes);
      if (ancestry.has(nodeIndex) || worlds.has(nodeIndex))
        throw new Error('Cyclic or multiply-parented scene node');
      const node = nodes[nodeIndex];
      if (node.matrix && (node.translation || node.rotation || node.scale))
        throw new Error('Node must use matrix or TRS');
      const local = node.matrix
        ? new Matrix4(node.matrix)
        : new Matrix4()
            .translate(readPhysicsVector(node.translation, [0, 0, 0]))
            .multiplyRight(new Matrix4().fromQuaternion(readPhysicsRotation(node.rotation)))
            .scale(readPhysicsVector(node.scale, [1, 1, 1]));
      if (node.matrix && node.matrix.length !== 16) throw new Error('Expected a 4x4 matrix');
      const world = new Matrix4(parentWorld).multiplyRight(local);
      worlds.set(nodeIndex, world);
      const extension =
        node.extensions?.[PHYSICS] === undefined ? {} : record(node.extensions[PHYSICS]);
      checkFields(extension, ['motion', 'collider', 'trigger', 'joint']);
      if (
        node.extensions?.['EXT_mesh_gpu_instancing'] &&
        (extension['motion'] !== undefined || extension['collider'] !== undefined)
      )
        report(
          'unsupported-physics-instancing',
          path,
          'Authored render instances do not define independent physics bodies'
        );

      if (
        extension['motion'] !== undefined ||
        ((extension['collider'] !== undefined ||
          (extension['trigger'] !== undefined &&
            record(extension['trigger'])['geometry'] !== undefined)) &&
          owner === undefined)
      ) {
        const transform = decomposePhysicsTransform(world);
        const motion = extension['motion'] === undefined ? {} : record(extension['motion']);
        checkFields(motion, [
          'isKinematic',
          'mass',
          'centerOfMass',
          'inertiaDiagonal',
          'inertiaOrientation',
          'linearVelocity',
          'angularVelocity',
          'gravityFactor'
        ]);
        if (motion['isKinematic'] !== undefined && typeof motion['isKinematic'] !== 'boolean')
          throw new Error('isKinematic must be boolean');
        if (motion['inertiaOrientation'] !== undefined && motion['inertiaDiagonal'] === undefined)
          throw new Error(
            'Authored inertia orientation requires an authored diagonal in this backend'
          );
        if (extension['motion'] !== undefined && transform.scale.some(value => value < 0))
          throw new Error('Reflected motion frames are unsupported');
        if (
          motion['inertiaDiagonal'] !== undefined &&
          Math.max(...transform.scale) - Math.min(...transform.scale) >
            1e-5 * Math.max(...transform.scale)
        )
          throw new Error('Scaled authored inertia requires a transformed tensor');
        const rotation = new Matrix4().fromQuaternion(transform.rotation);
        const authoredCenter = readPhysicsVector(motion['centerOfMass'], [0, 0, 0]);
        const centerWorld = transformPhysicsVector(world, authoredCenter);
        const center = transformPhysicsVector(new Matrix4(rotation).invert(), centerWorld);
        const bodyIndex = result.bodies.length;
        const definition: GLTFPhysicsBody = {
          id: `node-${nodeIndex}`,
          nodeIndex,
          bodyIndex,
          colliderIndices: [],
          centerOfMass: center,
          worldMatrix: Array.from(world),
          body: {
            colliders: [],
            position: transform.position,
            orientation: transform.rotation,
            mode:
              extension['motion'] === undefined
                ? 'static'
                : motion['isKinematic']
                  ? 'kinematic'
                  : 'dynamic',
            centerOfMass: center,
            mass: motion['mass'] === undefined ? undefined : scalar(motion['mass'], 1),
            inertiaDiagonal:
              motion['inertiaDiagonal'] === undefined
                ? undefined
                : readPhysicsVector(motion['inertiaDiagonal'], [0, 0, 0]),
            inertiaOrientation:
              motion['inertiaOrientation'] === undefined
                ? undefined
                : readPhysicsRotation(motion['inertiaOrientation']),
            velocity: transformPhysicsVector(
              world,
              readPhysicsVector(motion['linearVelocity'], [0, 0, 0])
            ),
            angularVelocity: transformPhysicsVector(
              rotation,
              readPhysicsVector(motion['angularVelocity'], [0, 0, 0])
            ),
            gravityFactor: scalar(motion['gravityFactor'], 1, false)
          }
        };
        if (definition.body['inertiaDiagonal']?.some(value => value < 0))
          throw new Error('Inertia must be nonnegative');
        result.bodies.push(definition);
        bodyByNode.set(nodeIndex, definition);
        owner = nodeIndex;
      }
      for (const kind of ['collider', 'trigger'] as const) {
        if (
          extension[kind] !== undefined &&
          (kind === 'collider' || record(extension[kind])['geometry'] !== undefined) &&
          owner !== undefined &&
          !decomposePhysicsTransform(world).scale.every(value => value === 0)
        ) {
          const collider = record(extension[kind]);
          checkFields(
            collider,
            kind === 'collider'
              ? ['geometry', 'physicsMaterial', 'collisionFilter']
              : ['geometry', 'collisionFilter']
          );
          const geometry = record(collider['geometry']);
          checkFields(
            geometry,
            options.resolveLegacyMeshPositions || options.resolveLegacyMeshGeometry
              ? ['shape', 'node', 'convexHull', 'mesh']
              : ['shape', 'node', 'convexHull']
          );
          const isNodeGeometry = geometry['node'] !== undefined;
          const isMesh = geometry['mesh'] !== undefined || isNodeGeometry;
          if (
            (geometry['mesh'] !== undefined && isNodeGeometry) ||
            (geometry['shape'] === undefined && !isMesh) ||
            (geometry['shape'] !== undefined && isMesh)
          )
            throw new Error('Mesh-derived collision geometry is unsupported');
          if (geometry['convexHull'] !== undefined && typeof geometry['convexHull'] !== 'boolean')
            throw new Error('convexHull must be boolean');
          let shapeIndex: number | undefined;
          let meshIndex: number | undefined;
          let geometryNodeIndex: number | undefined;
          let shape: unknown;
          let meshShape: GPURigidBodyShape | undefined;
          let meshCenter: readonly number[] = [0, 0, 0];
          if (isMesh) {
            if (
              !isNodeGeometry &&
              !options.resolveLegacyMeshGeometry &&
              (geometry['convexHull'] !== true || !options.resolveLegacyMeshPositions)
            )
              throw new Error('Legacy meshes require an explicit convex hull resolver');
            const value = isNodeGeometry ? geometry['node'] : geometry['mesh'];
            if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
              throw new Error('Invalid legacy mesh index');
            if (isNodeGeometry) geometryNodeIndex = index(value, nodes);
            else meshIndex = value;
            if (isNodeGeometry && !options.resolveNodeMeshGeometry)
              throw new Error('Node geometry requires an initial mesh snapshot resolver');
            if (isNodeGeometry || options.resolveLegacyMeshGeometry) {
              const resolved = isNodeGeometry
                ? collectNodeCollisionGeometry(
                    source,
                    geometryNodeIndex!,
                    options.resolveNodeMeshGeometry!
                  )
                : options.resolveLegacyMeshGeometry!(meshIndex!);
              const transform = decomposePhysicsTransform(world);
              const positions = Array.from(
                resolved.positions,
                (value, index) => value * transform.scale[index % 3]
              );
              if (geometry['convexHull'] === true) {
                try {
                  const bounds = getMeshBoxBounds(positions);
                  meshCenter = bounds.center.map((value, index) => value / transform.scale[index]);
                  shape = {
                    type: 'box',
                    box: {
                      size: bounds.size.map(
                        (value, index) => value / Math.abs(transform.scale[index])
                      )
                    }
                  };
                } catch {
                  meshShape = {type: 'convex-hull', geometry: makeConvexHullGeometry(positions)};
                }
              } else if (geometry['convexHull'] === false)
                meshShape = {
                  type: 'triangle-mesh',
                  geometry: makeTriangleMeshGeometry(positions, resolved.indices)
                };
              else throw new Error('Mesh convexHull must be explicit');
            } else {
              const bounds = getMeshBoxBounds(options.resolveLegacyMeshPositions!(meshIndex!));
              meshCenter = bounds.center;
              shape = {type: 'box', box: {size: bounds.size}};
            }
          } else {
            shapeIndex = index(geometry['shape'], shapes);
            shape = shapes[shapeIndex];
          }
          const transform = decomposePhysicsTransform(world);
          const definition = bodyByNode.get(owner)!;
          const bodyRotation = readPhysicsRotation(definition.body.orientation);
          const inverseRotation = new Matrix4().fromQuaternion(bodyRotation).invert();
          const bodyPosition = definition.body.position;
          const colliderCenter = Array.from(world.transformAsPoint(meshCenter));
          const offset = colliderCenter.map((value, axis) => value - bodyPosition[axis]);
          const relativeRotation = new Quaternion([
            -bodyRotation[0],
            -bodyRotation[1],
            -bodyRotation[2],
            bodyRotation[3]
          ])
            .multiplyRight(transform.rotation)
            .normalize();
          const materialIndex =
            collider['physicsMaterial'] === undefined
              ? undefined
              : index(collider['physicsMaterial'], materials);
          const filterIndex =
            collider['collisionFilter'] === undefined
              ? undefined
              : index(collider['collisionFilter'], collisionFilters);
          const filter = parseFilter(
            filterIndex === undefined ? undefined : collisionFilters[filterIndex]
          );
          const normalized = {
            isTrigger: kind === 'trigger',
            shape: meshShape ?? parseShape(shape, transform.scale),
            position: transformPhysicsVector(inverseRotation, offset),
            orientation: readPhysicsRotation(Array.from(relativeRotation)),
            material: parseMaterial(
              materialIndex === undefined ? undefined : materials[materialIndex]
            ),
            excludedColliders: [] as number[]
          };
          const colliderIndex = result.colliders.length;
          result.colliders.push({
            id: `node-${nodeIndex}-${kind}`,
            nodeIndex,
            bodyIndex: definition.bodyIndex,
            colliderIndex,
            localMatrix: new Matrix4().translate(meshCenter),
            shapeIndex,
            meshIndex,
            geometryNodeIndex,
            materialIndex,
            filterIndex,
            collider: normalized
          });
          definition.colliderIndices.push(colliderIndex);
          filters.push(filter);
        }
      }
      const nextAncestry = new Set(ancestry).add(nodeIndex);
      for (const child of node.children ?? []) {
        if (parents.has(child) || worlds.has(child)) {
          report('invalid-hierarchy', `${path}/children`, 'Cyclic or multiply-parented scene node');
          continue;
        }
        parents.set(child, nodeIndex);
        visit(child, world, owner, nextAncestry);
      }
    } catch (error) {
      report('unsupported-or-invalid-node', path, error);
    }
  }
  try {
    const scenes = source.scenes ?? [];
    const sceneIndex = index(options.scene ?? source.scene ?? 0, scenes);
    for (const root of scenes[sceneIndex].nodes ?? [])
      visit(root, new Matrix4(), undefined, new Set());
  } catch (error) {
    report('invalid-scene', '/scenes', error);
  }
  try {
    parsePhysicsJoints(result, worlds, parents);
  } catch (error) {
    report('invalid-joints', '/extensions/KHR_physics_rigid_bodies/physicsJoints', error);
  }
  // Body and collider identities occupy sixteen bits in the sparse GPU backend.
  if (result.bodies.length > 65535 || result.colliders.length > 65535) {
    report(
      'capacity-exceeded',
      '/',
      'The GPU backend supports at most 65535 bodies and 65535 colliders'
    );
    return result;
  }
  const hasFiltering = filters.some(
    filter => filter.include !== undefined || (filter.exclude?.length ?? 0) > 0
  );
  if (hasFiltering && result.colliders.length > 128) {
    report(
      'filtered-capacity-exceeded',
      '/',
      'Filtered descriptions currently support at most 128 colliders; large-world GPU filter groups are not implemented'
    );
    return result;
  }
  for (const definition of result.bodies) {
    const colliders = definition.colliderIndices.map(
      colliderIndex => result.colliders[colliderIndex]['collider']
    );
    definition.body.colliders = colliders;
    const properties = colliders.map(({shape}) => getRigidBodyShapeProperties(shape));
    const volumes = properties.map((property, index) =>
      colliders[index].isTrigger ? 0 : property.volume
    );
    const volume = volumes.reduce((sum, value) => sum + value, 0);
    if (definition.body['mass'] === undefined)
      definition.body['mass'] = definition.body.mode === 'static' ? 0 : density * volume;
    const motion = record(
      record(nodes[definition.nodeIndex]?.extensions?.[PHYSICS] ?? {})['motion'] ?? {}
    );
    if (motion['centerOfMass'] === undefined) {
      const center: [number, number, number] = [0, 0, 0];
      for (const [colliderIndex, collider] of colliders.entries())
        for (let axis = 0; axis < 3; axis++)
          center[axis] +=
            volume > 0
              ? (((collider.position?.[axis] ?? 0) +
                  new Matrix4()
                    .fromQuaternion(readPhysicsRotation(collider.orientation))
                    .transformAsVector(properties[colliderIndex].center)[axis]) *
                  volumes[colliderIndex]) /
                volume
              : 0;
      definition['centerOfMass'] = center;
      definition.body['centerOfMass'] = center;
    }
    if (!Number.isFinite(definition.body.mass) || !definition.centerOfMass.every(Number.isFinite))
      report(
        'invalid-mass-properties',
        `/nodes/${definition.nodeIndex}`,
        'Computed primitive mass properties exceed the supported numeric range'
      );
  }
  // The backend flattens colliders by body, which can differ from source DFS order
  // when an independent child motion appears between its parent's colliders.
  result.colliders.sort(
    (first, second) =>
      first.bodyIndex - second.bodyIndex || first.colliderIndex - second.colliderIndex
  );
  const orderedFilters = result.colliders.map(collider => filters[collider.colliderIndex]);
  filters.splice(0, filters.length, ...orderedFilters);
  for (const [colliderIndex, collider] of result.colliders.entries())
    collider.colliderIndex = colliderIndex;
  for (const definition of result.bodies) definition.colliderIndices = [];
  for (const collider of result.colliders)
    result.bodies[collider.bodyIndex].colliderIndices.push(collider.colliderIndex);

  const exclusions: number[][] = result.colliders.map(() => []);
  for (let first = 0; hasFiltering && first < filters.length; first++)
    for (let second = first + 1; second < filters.length; second++) {
      if (
        !allowsFilter(filters[first], filters[second]) ||
        !allowsFilter(filters[second], filters[first])
      ) {
        exclusions[first].push(second);
        exclusions[second].push(first);
      }
    }
  for (const [colliderIndex, collider] of result.colliders.entries())
    collider.collider.excludedColliders = exclusions[colliderIndex];
  try {
    result.querySelections = collisionFilters.map(value => {
      const filter = parseFilter(value);
      return result.colliders
        .filter(
          collider =>
            allowsFilter(filter, filters[collider.colliderIndex]) &&
            allowsFilter(filters[collider.colliderIndex], filter)
        )
        .map(collider => collider.colliderIndex);
    });
  } catch (error) {
    report('invalid-query-filter', '/extensions/KHR_physics_rigid_bodies/collisionFilters', error);
  }
  const resolveTrigger = (
    nodeIndex: number,
    ancestors = new Set<number>()
  ): {collider: number; filters: ReturnType<typeof parseFilter>[]}[] => {
    if (ancestors.has(nodeIndex)) throw new Error('Cyclic compound trigger');
    const declaration = record(record(nodes[nodeIndex].extensions?.[PHYSICS] ?? {})['trigger']);
    checkFields(declaration, ['geometry', 'nodes', 'collisionFilter']);
    if ((declaration['geometry'] === undefined) === (declaration['nodes'] === undefined))
      throw new Error('Trigger requires geometry or nodes');
    const localFilters =
      declaration['collisionFilter'] === undefined
        ? []
        : [parseFilter(collisionFilters[index(declaration['collisionFilter'], collisionFilters)])];
    if (declaration['geometry'] !== undefined) {
      const sensors = result.colliders.filter(
        collider => collider.collider.isTrigger && collider.nodeIndex === nodeIndex
      );
      if (sensors.length !== 1) throw new Error('Missing trigger geometry');
      return [{collider: sensors[0].colliderIndex, filters: localFilters}];
    }
    const children = array(declaration['nodes']).map(value => index(value, nodes));
    if (!children.length) throw new Error('Empty compound trigger');
    const nextAncestors = new Set([...ancestors, nodeIndex]);
    return [
      ...new Set(
        children.flatMap(child => {
          let ancestor = parents.get(child);
          while (ancestor !== undefined && ancestor !== nodeIndex) ancestor = parents.get(ancestor);
          if (ancestor !== nodeIndex) throw new Error('Compound trigger needs descendant nodes');
          return resolveTrigger(child, nextAncestors).map(source => ({
            collider: source.collider,
            filters: [...localFilters, ...source.filters]
          }));
        })
      )
    ];
  };
  for (const nodeIndex of worlds.keys()) {
    const trigger = record(nodes[nodeIndex].extensions?.[PHYSICS] ?? {})['trigger'];
    if (trigger === undefined) continue;
    try {
      const declaration = record(trigger);
      const branches = resolveTrigger(nodeIndex);
      const sources = [...new Set(branches.map(branch => branch.collider))];
      const filter = parseFilter(
        declaration['collisionFilter'] === undefined
          ? undefined
          : collisionFilters[index(declaration['collisionFilter'], collisionFilters)]
      );
      const targets = result.colliders
        .filter(
          collider =>
            !collider.collider.isTrigger &&
            (declaration['collisionFilter'] === undefined ||
              (allowsFilter(filter, filters[collider.colliderIndex]) &&
                allowsFilter(filters[collider.colliderIndex], filter)))
        )
        .map(collider => collider.colliderIndex);
      const excludedPairs: [number, number][] = [];
      for (const source of sources)
        for (const target of targets) {
          const accepted = branches.some(
            branch =>
              branch.collider === source &&
              branch.filters.every(
                filter =>
                  allowsFilter(filter, filters[target]) && allowsFilter(filters[target], filter)
              )
          );
          if (!accepted) excludedPairs.push([source, target]);
        }
      result.triggers.push({
        nodeIndex,
        trigger: {colliders: sources, targets, excludedPairs, perCollider: true}
      });
    } catch (error) {
      report(
        'unsupported-or-invalid-trigger',
        `/nodes/${nodeIndex}/extensions/${PHYSICS}/trigger`,
        error
      );
    }
  }
  const relevant = new Set<number>();
  for (const {nodeIndex} of [...result.bodies, ...result.colliders]) {
    let current: number | undefined = nodeIndex >= 0 ? nodeIndex : undefined;
    while (current !== undefined) {
      relevant.add(current);
      current = parents.get(current);
    }
  }
  const geometryNodes = new Set<number>();
  const geometryDescendants = new Set<number>();
  const skinTransforms = new Set<number>();
  const allParents = new Map<number, number>();
  for (const [parent, node] of nodes.entries())
    for (const child of node.children ?? []) allParents.set(child, parent);
  const collectGeometryDependencies = (
    nodeIndex: number,
    descendant: boolean,
    visited = new Set<number>()
  ) => {
    if (visited.has(nodeIndex)) return;
    visited.add(nodeIndex);
    geometryNodes.add(nodeIndex);
    if (descendant) geometryDescendants.add(nodeIndex);
    const node = nodes[nodeIndex];
    const ancestorsOf = (index: number) => {
      const ancestors = new Set<number>();
      let ancestor: number | undefined = index;
      while (ancestor !== undefined && !ancestors.has(ancestor)) {
        ancestors.add(ancestor);
        ancestor = allParents.get(ancestor);
      }
      return ancestors;
    };
    if (node.skin !== undefined)
      for (const joint of source.skins?.[node.skin]?.joints ?? []) {
        const meshAncestors = ancestorsOf(nodeIndex);
        const jointAncestors = ancestorsOf(joint);
        // A common ancestor moves the mesh and its bones together and cancels in the skin palette.
        for (const ancestor of new Set([...meshAncestors, ...jointAncestors]))
          if (meshAncestors.has(ancestor) !== jointAncestors.has(ancestor))
            skinTransforms.add(ancestor);
      }
    for (const child of node.children ?? []) collectGeometryDependencies(child, true, visited);
  };
  for (const collider of result.colliders)
    if (collider.geometryNodeIndex !== undefined)
      collectGeometryDependencies(collider.geometryNodeIndex, false);
  for (const [animationIndex, animation] of (source.animations ?? []).entries())
    for (const channel of animation.channels) {
      const pointerExtension = channel.target.extensions?.['KHR_animation_pointer'];
      const pointer =
        pointerExtension && typeof pointerExtension === 'object'
          ? record(pointerExtension)['pointer']
          : undefined;
      const nodeMatch =
        typeof pointer === 'string'
          ? pointer.match(/^\/nodes\/(\d+)\/(translation|rotation|scale|weights)$/)
          : null;
      if (
        options.propertyBindings &&
        typeof pointer === 'string' &&
        isGLTFPhysicsPropertyPointer(pointer)
      )
        continue;
      const physicsPointer =
        typeof pointer === 'string' &&
        (pointer.includes(PHYSICS) ||
          pointer.includes(SHAPES) ||
          Boolean(nodeMatch && relevant.has(Number(nodeMatch[1]))));
      const targetNode = nodeMatch ? Number(nodeMatch[1]) : channel.target.node;
      const targetPath = nodeMatch ? nodeMatch[2] : channel.target.path;
      if (
        targetNode !== undefined &&
        ((targetPath === 'weights' && geometryNodes.has(targetNode)) ||
          (['translation', 'rotation', 'scale'].includes(targetPath ?? '') &&
            (geometryDescendants.has(targetNode) || skinTransforms.has(targetNode))))
      ) {
        report(
          'animation-requires-collider-rebuild',
          `/animations/${animationIndex}`,
          'Animated collision mesh snapshots require explicit reconstruction'
        );
        continue;
      }
      if (
        options.animationOwnership === 'scenegraph' &&
        targetNode !== undefined &&
        ['translation', 'rotation'].includes(targetPath ?? '')
      ) {
        const affected = result.bodies.filter(body => {
          let ancestor: number | undefined = body.nodeIndex;
          while (ancestor !== undefined && ancestor >= 0) {
            if (ancestor === targetNode) return true;
            ancestor = parents.get(ancestor);
          }
          return false;
        });
        const affectedColliders = result.colliders.filter(collider => {
          let ancestor: number | undefined = collider.nodeIndex;
          const owner = result.bodies[collider.bodyIndex].nodeIndex;
          while (ancestor !== undefined && ancestor !== owner) {
            if (ancestor === targetNode) return true;
            ancestor = parents.get(ancestor);
          }
          return false;
        });
        for (const collider of affectedColliders)
          if (!result.animatedColliderIndices.includes(collider.colliderIndex))
            result.animatedColliderIndices.push(collider.colliderIndex);
        if (affected.length || affectedColliders.length) {
          for (const body of affected) {
            body.body.mode = 'kinematic';
            if (!result.animatedBodyIndices.includes(body.bodyIndex))
              result.animatedBodyIndices.push(body.bodyIndex);
          }
          continue;
        }
      }
      if (
        (channel.target['node'] !== undefined &&
          relevant.has(channel.target['node']) &&
          ['translation', 'rotation', 'scale'].includes(channel.target.path ?? '')) ||
        physicsPointer
      )
        report(
          'animation-requires-runtime-binding',
          `/animations/${animationIndex}`,
          'Animation/physics ownership binding is tranche 20D; supply kinematic targets explicitly'
        );
    }
  if (!result.bodies.length)
    report('empty-world', '/', 'No supported physics bodies in the selected scene');
  if (result.issues.length === 0) {
    try {
      // Validate backend pair capabilities before advertising a simulatable description.
      const world = new GPURigidBodyWorld({
        failurePolicy: 'rollback',
        bodies: result.bodies.map(definition => definition.body),
        joints: result.joints.map(definition => definition.joint),
        triggers: result.triggers.map(definition => definition.trigger)
      });
      world.destroy();
    } catch (error) {
      report('unsupported-backend-configuration', '/', error);
    }
  }
  result.supported = result.issues.length === 0;
  return result;
}
