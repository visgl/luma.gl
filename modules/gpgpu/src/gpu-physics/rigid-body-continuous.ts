// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GraphBufferHandle,
  GPUCommandGraphComputeExecutable
} from '../gpu-core/gpu-command-graph';
import {RIGID_BODY_QUERY_GEOMETRY_SHADER} from './rigid-body-query-geometry';

export type GPURigidBodyContinuousOptions = {
  /** Centered single-sphere dynamic bodies. Other dynamic pairs retain discrete response. */
  bodies: readonly number[];
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
  allocate: (name: string, data: number | Uint32Array) => Buffer
) {
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
 var position=continuousPrevious[body].xyz;var motion=positions[body].xyz-position;var velocity=velocities[body].xyz;var remaining=settings.gravity.w;
 for(var impact=0u;impact<=${maximumImpacts}u;impact++){
  let magnitude=length(motion);if(magnitude<=1e-8){positions[body]=vec4f(position,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  var nearest=magnitude;var hitCollider=0xffffffffu;var hitNormal=vec3f(0);
  for(var collider=0u;collider<COLLIDER_COUNT;collider++){
   if(bodies.bodies[colliderBody(collider)].motion.x!=0.0||bodies.colliders[collider].material.w!=0.0||excludes(movingCollider,collider)||excludes(collider,movingCollider)){continue;}
   let origin=colliderLocal(collider,position-colliderPosition(collider));let direction=colliderLocal(collider,motion/magnitude);
   let result=sweepSphere(collider,origin,direction,magnitude,radius);
   if(result.complete==0u){continuousStatus[body].x=1u;return;}
   if(result.hit==0u){continue;}
   let normal=rotate(colliderRotation(collider),result.normal);
   // Touching and separating bodies must not repeatedly collide at time zero.
   if(result.distance<=1e-5&&dot(motion,normal)>=0.0&&length(normal)>0.5){continue;}
   if(length(normal)<0.5){continuousStatus[body].x=1u;return;}
   if(result.distance<=nearest){nearest=result.distance;hitCollider=collider;hitNormal=normal;}
  }
  if(hitCollider==0xffffffffu){positions[body]=vec4f(position+motion,positions[body].w);velocities[body]=vec4f(velocity,velocities[body].w);return;}
  if(impact==${maximumImpacts}u){continuousStatus[body].x=1u;return;}
  position+=motion*(nearest/magnitude)+hitNormal*1e-5;
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
        'continuousStatus'
      ])
  };
}
