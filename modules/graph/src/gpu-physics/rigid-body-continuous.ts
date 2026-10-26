// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/gpgpu';
import type {
  GPUCommandGraph,
  GraphBufferHandle,
  GPUCommandGraphComputeExecutable
} from '../gpu-core/gpu-command-graph';
import {RIGID_BODY_SUPPORT_SHADER} from './rigid-body-support-shaders';
import {getConvexContinuousShader} from './rigid-body-convex-continuous-shader';
import {RIGID_BODY_QUERY_GEOMETRY_SHADER} from './rigid-body-query-geometry';

export type GPURigidBodyContinuousOptions = {
  /** Default sphere-static path; convex mode supports single-convex dynamic bodies and moving convex obstacles. */
  mode?: 'sphere-static' | 'convex';
  /** Maximum swept candidates, rebuilt on GPU after each impact. Overflow rejects the step. */
  maximumCandidates?: number;
  /** Selected dynamic body indices. Convex CCD also responds to nonselected convex obstacles. */
  bodies: readonly number[];
  /** Per selected sphere in sphere-static mode; global per-step earliest impacts in convex mode. */
  maximumImpacts?: number;
};
type BoundBuffer = {name: string; buffer: Buffer; resource: GraphBufferHandle; location: number};

export function addRigidBodyContinuous<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  source: string,
  count: number,
  selected: Uint32Array,
  maximumImpacts: number,
  bindings: BoundBuffer[],
  allocate: (name: string, data: number | Uint32Array) => Buffer,
  hasJoints = false,
  convexCapacity = 0,
  colliderCount = count,
  extended = false,
  hasHulls = false
) {
  if (convexCapacity)
    return addConvexContinuous(
      graph,
      id,
      extended ? source : source + RIGID_BODY_SUPPORT_SHADER,
      count,
      selected,
      maximumImpacts,
      bindings,
      allocate,
      convexCapacity,
      colliderCount,
      hasHulls
    );
  const previous = allocate('continuous-previous', count * 16);
  const selection = allocate('continuous-selection', selected);
  const status = allocate('continuous-status', count * 16);
  const extra = [
    {name: 'continuousPrevious', buffer: previous, location: 12},
    {name: 'continuousSelection', buffer: selection, location: 13},
    {name: 'continuousStatus', buffer: status, location: 14}
  ].map(binding => ({
    ...binding,
    resource: graph.importBuffer(
      {id: `${id}-${binding.name}`, byteLength: binding.buffer.byteLength, usage: Buffer.STORAGE},
      binding.buffer
    )
  }));
  const shader =
    source +
    RIGID_BODY_QUERY_GEOMETRY_SHADER +
    /* wgsl */ `
@group(0) @binding(12) var<storage,read_write> continuousPrevious:array<vec4f>;
@group(0) @binding(13) var<storage,read> continuousSelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> continuousStatus:array<vec4u>;
@compute @workgroup_size(64) fn saveContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}continuousPrevious[body]=positions[body];continuousStatus[body]=vec4u(0);
}
@compute @workgroup_size(64) fn resolveContinuous(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT||continuousSelection[body]==0u){return;}
 let movingCollider=continuousSelection[body]-1u;let radius=bodies.colliders[movingCollider].shape.x;
 let tolerance=max(1e-8,radius*1e-5);
 var position=continuousPrevious[body].xyz;var motion=positions[body].xyz-position;var velocity=velocities[body].xyz;var remaining=settings.gravity.w;
 for(var impact=0u;impact<=${maximumImpacts}u;impact++){
  let magnitude=length(motion);if(magnitude<=1e-8){positions[body]=vec4f(position,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  var nearest=magnitude;var hitCollider=0xffffffffu;var hitNormal=vec3f(0);
  for(var collider=0u;collider<COLLIDER_COUNT;collider++){
   if(bodies.bodies[colliderBody(collider)].motion.x!=0.0||bodies.colliders[collider].material.w!=0.0||excludes(movingCollider,collider)||excludes(collider,movingCollider)){continue;}
   // Initial penetration belongs to the discrete solver; still sweep other obstacles.
   let initialOrigin=colliderLocal(collider,continuousPrevious[body].xyz-colliderPosition(collider));
   let initialSurface=closestSurface(collider,initialOrigin);
   if(initialSurface.complete==0u){continuousStatus[body].x=1u;return;}
   if(initialSurface.distance<radius-tolerance){continue;}
   let origin=colliderLocal(collider,position-colliderPosition(collider));let direction=colliderLocal(collider,motion/magnitude);
   let result=sweepSphere(collider,origin,direction,magnitude,radius,true);
   if(result.complete==0u){continuousStatus[body].x=1u;return;}
   if(result.hit==0u){continue;}
   let normal=rotate(colliderRotation(collider),result.normal);
   // Touching and separating bodies must not repeatedly collide at time zero.
   if(result.distance<=tolerance&&dot(motion,normal)>=0.0&&length(normal)>0.5){continue;}
   if(length(normal)<0.5){continuousStatus[body].x=1u;return;}
   if(result.distance<=nearest){nearest=result.distance;hitCollider=collider;hitNormal=normal;}
  }
  if(hitCollider==0xffffffffu){positions[body]=vec4f(position+motion,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  if(impact==${maximumImpacts}u){continuousStatus[body].x=1u;return;}
  position+=motion*(nearest/magnitude)+hitNormal*tolerance;
  remaining*=max(0.0,1.0-nearest/magnitude);
  let closing=dot(velocity,hitNormal);
  let restitution=select(0.0,combineMaterial(bodies.colliders[movingCollider].material.x,bodies.colliders[hitCollider].material.x,bodies.colliders[movingCollider].policies.x,bodies.colliders[hitCollider].policies.x,false),-closing>settings.solver.z);
  if(closing<0.0){velocity-=hitNormal*closing*(1.0+restitution);}
  continuousStatus[body].y++;
  motion=velocity*remaining;
  if(remaining<=1e-8){positions[body]=vec4f(position,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
 }
 // The complete step is rejected by the transactional wrapper when the impact budget ends.
 continuousStatus[body].x=1u;
}
`;
  const addStage = (entryPoint: string, names: string[]) => {
    const selectedBindings = [...bindings, ...extra].filter(binding =>
      names.includes(binding.name)
    );
    const properties = {
      id: `${id}-${entryPoint}`,
      source: shader,
      entryPoint,
      shaderLayout: {
        bindings: selectedBindings.map((binding): BindingDeclaration => {
          const base = {name: binding.name, location: binding.location, group: 0};
          if (binding.name === 'settings') return {...base, type: 'uniform'};
          return {
            ...base,
            type: ['bodies', 'continuousSelection'].includes(binding.name)
              ? 'read-only-storage'
              : 'storage'
          };
        })
      },
      bindings: Object.fromEntries(selectedBindings.map(binding => [binding.name, binding.buffer]))
    };
    const executable = (
      computation: Computation
    ): GPUCommandGraphComputeExecutable<Parameters> => ({
      encode: ({computePass}) => {
        computation.dispatch(computePass, Math.ceil(count / 64));
      },
      destroy: () => computation.destroy()
    });
    graph.addComputePass({
      id: properties.id,
      resources: selectedBindings.map(binding => ({
        buffer: binding.resource,
        usage:
          binding.name === 'settings'
            ? ('uniform' as const)
            : ['bodies', 'continuousSelection'].includes(binding.name)
              ? ('storage-read' as const)
              : ('storage-read-write' as const)
      })),
      compile: () => executable(new Computation(graph.device, properties)),
      compileAsync: async () => executable(await Computation.createAsync(graph.device, properties))
    });
  };
  addStage('saveContinuous', ['positions', 'continuousPrevious', 'continuousStatus']);
  return {
    status: {buffer: status, resource: extra[2].resource},
    finish: () =>
      addStage('resolveContinuous', [
        'settings',
        'positions',
        'orientations',
        'velocities',
        'bodies',
        'continuousPrevious',
        'continuousSelection',
        'continuousStatus',
        ...(hasJoints ? ['targets'] : [])
      ])
  };
}

/** Queue generation and TOI searches run in parallel; one invocation owns impact publication. */
function addConvexContinuous<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  source: string,
  count: number,
  selected: Uint32Array,
  maximumImpacts: number,
  bindings: BoundBuffer[],
  allocate: (name: string, data: number | Uint32Array) => Buffer,
  capacity: number,
  colliderCount: number,
  hasHulls: boolean
) {
  const spatialCapacity = 2 ** Math.ceil(Math.log2(Math.max(1, colliderCount)));
  const extra = [
    {name: 'continuousSelection', buffer: allocate('continuous-selection', selected), location: 13},
    {name: 'continuousStatus', buffer: allocate('continuous-status', count * 16), location: 14},
    {
      name: 'continuousWork',
      buffer: allocate('continuous-work', 64 + spatialCapacity * 32 + count * 64 + capacity * 48),
      location: 15
    },
    {name: 'continuousDispatch', buffer: allocate('continuous-dispatch', 16), location: 16}
  ].map(binding => ({
    ...binding,
    resource: graph.importBuffer(
      {
        id: `${id}-${binding.name}`,
        byteLength: binding.buffer.byteLength,
        usage: Buffer.STORAGE | (binding.name === 'continuousDispatch' ? Buffer.INDIRECT : 0)
      },
      binding.buffer
    )
  }));
  const shader =
    source +
    `
@group(0) @binding(13) var<storage,read> continuousSelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> continuousStatus:array<vec4u>;
` +
    getConvexContinuousShader(capacity, maximumImpacts, hasHulls, spatialCapacity);
  const add = (stage: string, stages: {entryPoint: string; groups: number}[], names: string[]) => {
    const active = [...bindings, ...extra].filter(binding => names.includes(binding.name));
    const entryBindings: Record<string, string[]> = {
      saveConvexContinuous: ['positions', 'orientations', 'continuousWork', 'continuousStatus'],
      prepareConvexContinuous: [
        'settings',
        'positions',
        'orientations',
        'velocities',
        'bodies',
        'continuousWork'
      ],
      boundContinuousQueue: ['positions', 'velocities', 'bodies', 'continuousWork'],
      resetContinuousQueue: ['continuousWork', 'continuousDispatch'],
      buildContinuousQueue: [
        'bodies',
        'continuousSelection',
        'continuousWork',
        'continuousDispatch'
      ],
      findContinuousImpacts: [
        'positions',
        'orientations',
        'velocities',
        'angularVelocities',
        'bodies',
        'continuousWork'
      ],
      resolveConvexContinuous: [
        'settings',
        'positions',
        'orientations',
        'velocities',
        'angularVelocities',
        'bodies',
        'sleepStates',
        'continuousWork',
        'continuousStatus'
      ],
      checkConvexContinuous: [
        'positions',
        'orientations',
        'bodies',
        'continuousWork',
        'continuousStatus'
      ]
    };
    const properties = (entryPoint: string) => {
      const entries = active.filter(binding =>
        (entryBindings[entryPoint] ?? ['continuousWork']).includes(binding.name)
      );
      return {
        id: `${id}-${entryPoint}`,
        source: shader,
        entryPoint,
        shaderLayout: {
          bindings: entries.map((binding): BindingDeclaration => {
            const base = {name: binding.name, location: binding.location, group: 0};
            if (binding.name === 'settings') return {...base, type: 'uniform'};
            return {
              ...base,
              type: ['bodies', 'continuousSelection'].includes(binding.name)
                ? 'read-only-storage'
                : 'storage'
            };
          })
        },
        bindings: Object.fromEntries(entries.map(binding => [binding.name, binding.buffer]))
      };
    };
    const executable = (
      computations: Computation[]
    ): GPUCommandGraphComputeExecutable<Parameters> => ({
      encode: ({computePass}) => {
        if (stage === 'resolve') {
          computations[0].dispatch(computePass, Math.ceil(count / 64));
          for (let impact = 0; impact <= maximumImpacts; impact++) {
            for (let index = 1; index < computations.length - 1; index++)
              if (stages[index].entryPoint === 'findContinuousImpacts')
                computations[index].dispatchIndirect(computePass, extra[3].buffer, 0);
              else computations[index].dispatch(computePass, stages[index].groups);
          }
          computations[computations.length - 1].dispatch(computePass, Math.ceil(count / 64));
        } else computations[0].dispatch(computePass, Math.ceil(count / 64));
      },
      destroy: () => computations.forEach(computation => computation.destroy())
    });
    graph.addComputePass({
      id: `${id}-${stage}-convex-continuous`,
      description:
        stage === 'save'
          ? 'Checkpoint convex CCD trajectories.'
          : 'Rebuild bounded swept queues, find TOIs in parallel and resolve impacts with exclusive ownership.',
      resources: [
        ...(stage === 'resolve' ? [{buffer: extra[3].resource, usage: 'indirect' as const}] : []),
        ...active.map(binding => ({
          buffer: binding.resource,
          usage:
            binding.name === 'settings'
              ? ('uniform' as const)
              : ['bodies', 'continuousSelection'].includes(binding.name)
                ? ('storage-read' as const)
                : ('storage-read-write' as const)
        }))
      ],
      compile: () =>
        executable(
          stages.map(stage => new Computation(graph.device, properties(stage.entryPoint)))
        ),
      compileAsync: async () =>
        executable(
          await Promise.all(
            stages.map(stage => Computation.createAsync(graph.device, properties(stage.entryPoint)))
          )
        )
    });
  };
  add(
    'save',
    [{entryPoint: 'saveConvexContinuous', groups: Math.ceil(count / 64)}],
    ['positions', 'orientations', 'continuousWork', 'continuousStatus']
  );
  return {
    status: {buffer: extra[1].buffer, resource: extra[1].resource},
    finish: () =>
      add(
        'resolve',
        [
          {entryPoint: 'prepareConvexContinuous', groups: Math.ceil(count / 64)},
          {entryPoint: 'boundContinuousQueue', groups: Math.ceil(spatialCapacity / 64)},
          {entryPoint: 'resetContinuousQueue', groups: 1},
          ...Array.from({length: Math.log2(spatialCapacity)}, (_, level) =>
            Array.from({length: level + 1}, (_, pass) => ({
              entryPoint: `sortContinuous${2 ** (level + 1)}_${2 ** (level - pass)}`,
              groups: Math.ceil(spatialCapacity / 64)
            }))
          ).flat(),
          {entryPoint: 'buildContinuousQueue', groups: Math.ceil(colliderCount / 64)},
          {entryPoint: 'findContinuousImpacts', groups: Math.ceil(capacity / 64)},
          {entryPoint: 'resolveConvexContinuous', groups: 1},
          {entryPoint: 'checkConvexContinuous', groups: 1}
        ],
        [
          'settings',
          'positions',
          'orientations',
          'velocities',
          'angularVelocities',
          'sleepStates',
          'bodies',
          'continuousWork',
          'continuousSelection',
          'continuousStatus',
          'continuousDispatch'
        ]
      )
  };
}
