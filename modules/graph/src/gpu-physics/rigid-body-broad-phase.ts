// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {
  type GPUCommandGraph,
  type GPUCommandGraphComputeExecutable,
  type GraphDataView
} from '../gpu-core/gpu-command-graph';
import {createGPUComputeCommandNode, type GPUCommandNode} from '../gpu-core/gpu-command-node';
import {GPUSort} from '../gpu-core/gpu-sort';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewBindingRange,
  getViewElementOffset,
  validatePackedView
} from '../gpu-core/graph-data-view-utils';

export type GPURigidBodyBroadPhaseProps = {
  id?: string;
  minima: GraphDataView<'float32x3'>;
  maxima: GraphDataView<'float32x3'>;
  /** Optional lower-16-bit body ID and bit-16 dynamic flag; suppress self/static pairs. */
  /** Equal contiguous collider domains. Different domains never produce pairs. */
  partitionSize?: number;
  /** GPU compact instance queue produced by the rigid-body ensemble scheduler. */
  activeInstances?: GraphDataView<'uint32'>;
  /** Optional persistent bucket storage for clearing only previously touched buckets. */
  bucketState?: GraphDataView<'uint32'>;
  objectMetadata?: GraphDataView<'uint32'>;
  /** Canonical source-row pairs. Order is unspecified; each pair occurs once. */
  pairs: GraphDataView<'uint32x2'>;
  /** Eight uint32 words; see decodeRigidBodyBroadPhaseDiagnostics. */
  diagnostics: GraphDataView<'uint32'>;
  /** Smallest cell size. Larger shapes select coarser power-of-two levels. */
  minimumCellSize?: number;
  /** Bound dense or adversarial traversal, with explicit incomplete-query diagnostics. */
  maximumCandidateTestsPerQuery?: number;
};

export function decodeRigidBodyBroadPhaseDiagnostics(values: ArrayLike<number>) {
  return {
    pairCount: values[0],
    droppedPairs: values[1],
    invalidBounds: values[2],
    candidateTests: values[3],
    occupiedLevelMask: values[4],
    oversizedBounds: values[5],
    incompleteQueries: values[6]
  };
}

/**
 * Size-aware hierarchical hashed-grid discovery over GPU AABBs. Each object belongs
 * to one level; queries visit occupied levels at least as coarse as their own.
 * Oversized objects use a compact global list, rather than enlarging every cell.
 * Hash collisions are checked against exact level/cell identity before AABB tests.
 */
export class GPURigidBodyBroadPhase {
  readonly id: string;
  readonly props: GPURigidBodyBroadPhaseProps;

  constructor(props: GPURigidBodyBroadPhaseProps) {
    this.id = props.id ?? 'rigid-body-broad-phase';
    this.props = props;
    validatePackedView(props.minima, ['float32x3'], 'broad-phase minima');
    validatePackedView(props.maxima, ['float32x3'], 'broad-phase maxima');
    validatePackedView(props.pairs, ['uint32x2'], 'broad-phase pairs');
    validatePackedView(props.diagnostics, ['uint32'], 'broad-phase diagnostics');
    if (props.objectMetadata)
      validatePackedView(props.objectMetadata, ['uint32'], 'broad-phase object metadata');
    if (props.activeInstances) {
      validatePackedView(props.activeInstances, ['uint32'], 'active instances');
      if (
        !props.partitionSize ||
        props.activeInstances.length !== 16 + (9 * props.minima.length) / props.partitionSize
      )
        throw new Error('Invalid active instance queue');
    }
    const count = props.minima.length;
    if (props.bucketState) {
      validatePackedView(props.bucketState, ['uint32'], 'persistent buckets');
      if (
        !props.activeInstances ||
        props.bucketState.buffer.transient ||
        props.bucketState.length !== 2 ** Math.ceil(Math.log2(Math.max(1, count * 2))) + count + 2
      )
        throw new Error('Invalid persistent bucket storage');
    }
    const maximumCandidates = props.maximumCandidateTestsPerQuery ?? 4096;
    const cellSize = props.minimumCellSize ?? 1 / 1024;
    if (
      (props.partitionSize !== undefined &&
        (!Number.isSafeInteger(props.partitionSize) ||
          props.partitionSize < 1 ||
          count % props.partitionSize !== 0)) ||
      count !== props.maxima.length ||
      (props.objectMetadata && props.objectMetadata.length !== count) ||
      count > 65535 ||
      props.diagnostics.length < 8 ||
      !Number.isFinite(cellSize) ||
      cellSize <= 0 ||
      !Number.isSafeInteger(maximumCandidates) ||
      maximumCandidates < 1 ||
      maximumCandidates > 65535
    )
      throw new Error('Invalid rigid-body broad-phase layout');
    const writable = [props.pairs, props.diagnostics];
    for (const output of writable)
      for (const input of [
        props.minima,
        props.maxima,
        ...(props.objectMetadata ? [props.objectMetadata] : []),
        ...(props.activeInstances ? [props.activeInstances] : []),
        ...(props.bucketState ? [props.bucketState] : []),
        ...writable.filter(view => view !== output)
      ])
        if (output.buffer === input.buffer) {
          const outputRange = getViewBindingRange(output);
          const inputRange = getViewBindingRange(input);
          if (
            doGraphDataViewsOverlap(output, input) ||
            (outputRange.offset < inputRange.offset + inputRange.size &&
              inputRange.offset < outputRange.offset + outputRange.size)
          )
            throw new Error('Broad-phase storage bindings overlap');
        }
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {minima, maxima, pairs, diagnostics} = this.props;
    const count = minima.length;
    const keys = createTransientView(graph, `${this.id}-keys`, 'uint32', count);
    const values = createTransientView(graph, `${this.id}-values`, 'uint32', count);
    const sortedKeys = createTransientView(graph, `${this.id}-sorted-keys`, 'uint32', count);
    const sortedValues = createTransientView(graph, `${this.id}-sorted-values`, 'uint32', count);
    const levels = createTransientView(
      graph,
      `${this.id}-levels`,
      'uint32',
      count * (this.props.activeInstances ? 2 : 1)
    );
    const oversized = this.props.activeInstances
      ? graph.createDataView(levels.buffer, {
          format: 'uint32',
          length: count,
          byteOffset: count * 4
        })
      : createTransientView(graph, `${this.id}-oversized`, 'uint32', count);
    const views = {
      minima,
      maxima,
      keys,
      values,
      sortedKeys,
      sortedValues,
      levels,
      oversized,
      pairs,
      diagnostics,
      objectMetadata: this.props.objectMetadata ?? values,
      ...(this.props.activeInstances
        ? {
            activeInstances: this.props.activeInstances,
            heads:
              this.props.bucketState ??
              createTransientView(
                graph,
                `${this.id}-heads`,
                'uint32',
                2 ** Math.ceil(Math.log2(Math.max(1, count * 2))) + count + 2
              )
          }
        : {})
    };
    const names = Object.keys(views) as (keyof typeof views)[];
    const source = makeBroadPhaseShader(this.props, views);
    const passDescriptions: Record<string, string> = {
      clear: 'Reset broad-phase diagnostics and candidate counts.',
      assign: 'Assign collider bounds to hierarchical spatial grid cells.',
      discover: 'Discover potentially overlapping collider pairs from the sorted grid.'
    };
    const pass = (
      entryPoint: string,
      active: readonly (keyof typeof views)[],
      writable: readonly (keyof typeof views)[],
      workgroups: number
    ) => {
      active = active.filter(
        name => !this.props.activeInstances || !['keys', 'oversized'].includes(name)
      );
      const bindings = active.map(name => ({
        name,
        group: 0,
        location: names.indexOf(name),
        type: ['keys', 'values', 'levels', 'oversized', 'pairs', 'diagnostics', 'heads'].includes(
          name
        )
          ? ('storage' as const)
          : ('read-only-storage' as const)
      }));
      const makeExecutable = (): GPUCommandGraphComputeExecutable<Parameters> => {
        const kernel = new Kernel(graph.device, {
          id: `${this.id}-${entryPoint}`,
          source,
          entryPoint,
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolved: Record<string, Binding> = {};
            for (const name of active) resolved[name] = getViewBinding(views[name]!, getBuffer);
            if (this.props.activeInstances && ['assign', 'discover'].includes(entryPoint)) {
              kernel.dispatchIndirect(computePass, {
                bindings: resolved,
                indirectBuffer: getBuffer(this.props.activeInstances.buffer),
                indirectOffset: getViewBindingRange(this.props.activeInstances).offset + 32
              });
            } else kernel.dispatch(computePass, {bindings: resolved, x: workgroups, y: 1, z: 1});
          },
          destroy: () => kernel.destroy()
        };
      };
      return createGPUComputeCommandNode<Parameters>({
        id: `${this.id}-${entryPoint}`,
        description: passDescriptions[entryPoint],
        workload: {commandCount: 1},
        resources: [
          ...(this.props.activeInstances && ['assign', 'discover'].includes(entryPoint)
            ? [{buffer: this.props.activeInstances, usage: 'indirect' as const}]
            : []),
          ...active.map(name => ({
            buffer: views[name]!,
            usage: writable.includes(name)
              ? ('storage-read-write' as const)
              : ('storage-read' as const)
          }))
        ],
        compile: makeExecutable
      });
    };
    return [
      pass('clear', ['diagnostics'], ['diagnostics'], 1),
      ...(this.props.activeInstances ? [pass('clearBuckets', ['heads'], ['heads'], 1)] : []),
      pass(
        'assign',
        [
          'minima',
          'maxima',
          'keys',
          'values',
          'levels',
          'oversized',
          'diagnostics',
          ...(this.props.objectMetadata ? ['objectMetadata' as const] : []),
          ...(this.props.activeInstances ? ['heads' as const, 'activeInstances' as const] : [])
        ],
        [
          'keys',
          'values',
          'levels',
          'oversized',
          'diagnostics',
          ...(this.props.activeInstances ? ['heads' as const] : [])
        ],
        Math.max(1, Math.ceil(count / 64))
      ),
      ...(this.props.activeInstances
        ? []
        : new GPUSort({
            id: `${this.id}-sort`,
            keys,
            values,
            outputKeys: sortedKeys,
            outputValues: sortedValues
          }).getCommandNodes(graph)),
      pass(
        'discover',
        [
          'minima',
          'maxima',
          ...(this.props.activeInstances ? [] : ['sortedKeys' as const, 'sortedValues' as const]),
          'levels',
          'oversized',
          'pairs',
          'diagnostics',
          ...(this.props.activeInstances
            ? ['heads' as const, 'keys' as const, 'values' as const, 'activeInstances' as const]
            : [])
        ],
        ['pairs', 'diagnostics'],
        Math.max(1, Math.ceil(count / 64))
      )
    ];
  }
}

function makeBroadPhaseShader(
  props: GPURigidBodyBroadPhaseProps,
  views: Record<string, GraphDataView>
): string {
  const names = Object.keys(views);
  const offsets = Object.fromEntries(names.map(name => [name, getViewElementOffset(views[name])]));
  const writable = new Set([
    'keys',
    'values',
    'levels',
    'oversized',
    'pairs',
    'diagnostics',
    'heads'
  ]);
  let source = /* wgsl */ `
${names.map((name, index) => `@group(0) @binding(${index}) var<storage, ${writable.has(name) ? 'read_write' : 'read'}> ${name}:array<${name === 'minima' || name === 'maxima' ? 'f32' : ['diagnostics', 'heads'].includes(name) ? 'atomic<u32>' : 'u32'}>;`).join('\n')}
const BODY_COUNT:u32=${props.minima.length}u;
const PAIR_CAPACITY:u32=${props.pairs.length}u;
const BASE_CELL:f32=${props.minimumCellSize ?? 1 / 1024};
const MAXIMUM_CANDIDATES:u32=${props.maximumCandidateTestsPerQuery ?? 4096}u;
fn minimum(index:u32)->vec3f{let offset=${offsets['minima']}u+index*3u;return vec3f(minima[offset],minima[offset+1u],minima[offset+2u]);}
fn maximum(index:u32)->vec3f{let offset=${offsets['maxima']}u+index*3u;return vec3f(maxima[offset],maxima[offset+1u],maxima[offset+2u]);}
fn valid(index:u32)->bool{let lower=minimum(index);let upper=maximum(index);return all(lower<=upper)&&all(abs(lower)<=vec3f(3.4028234663852886e38))&&all(abs(upper)<=vec3f(3.4028234663852886e38));}
fn center(index:u32)->vec3f{return minimum(index)*0.5+maximum(index)*0.5;}
fn cell(index:u32,level:u32)->vec3i{return vec3i(floor(center(index)/(BASE_CELL*exp2(f32(level)))));}
fn domain(index:u32)->u32{return ${props.partitionSize ? `index/${props.partitionSize}u` : '0u'};}
fn hash(coordinate:vec3i,level:u32,domainIndex:u32)->u32{
 let words=bitcast<vec3u>(coordinate);var result=(words.x*73856093u)^(words.y*19349663u)^(words.z*83492791u)^(level*2654435761u)^(domainIndex*1597334677u);
 result=(result^(result>>16u))*2246822519u;return result^(result>>13u);
}
@compute @workgroup_size(8) fn clear(@builtin(local_invocation_index) index:u32){atomicStore(&diagnostics[${offsets['diagnostics']}u+index],0u);}
@compute @workgroup_size(64) fn assign(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=BODY_COUNT){return;}
 values[${offsets['values']}u+index]=index;
 if(!valid(index)){keys[${offsets['keys']}u+index]=0xffffffffu;levels[${offsets['levels']}u+index]=33u;atomicAdd(&diagnostics[${offsets['diagnostics']}u+2u],1u);return;}
 let extent=maximum(index)-minimum(index);let size=max(extent.x,max(extent.y,extent.z));
 let required=ceil(log2(max(size*2.0/BASE_CELL,1.0)));
 var level=u32(clamp(required,0.0,32.0));
 // Very remote tiny objects cannot be represented by signed integer cell coordinates.
 if(level<32u&&any(abs(center(index)/(BASE_CELL*exp2(f32(level))))>vec3f(1048576.0))){level=32u;}
 levels[${offsets['levels']}u+index]=level|(${props.objectMetadata ? `(objectMetadata[${offsets['objectMetadata']}u+index]&0x1ffffu)` : '(index|(1u<<16u))'}<<6u);
 if(level>=32u){let slot=atomicAdd(&diagnostics[${offsets['diagnostics']}u+5u],1u);oversized[${offsets['oversized']}u+slot]=index;keys[${offsets['keys']}u+index]=0xffffffffu;return;}
 atomicOr(&diagnostics[${offsets['diagnostics']}u+4u],1u<<level);keys[${offsets['keys']}u+index]=hash(cell(index,level),level,domain(index));
}
fn lowerBound(key:u32)->u32{var lower=0u;var upper=BODY_COUNT;loop{if(lower>=upper){break;}let middle=(lower+upper)/2u;if(sortedKeys[${offsets['sortedKeys']}u+middle]<key){lower=middle+1u;}else{upper=middle;}}return lower;}
fn emit(first:u32,second:u32){
 if(domain(first)!=domain(second)){return;}
 let firstMetadata=levels[${offsets['levels']}u+first]>>6u;let secondMetadata=levels[${offsets['levels']}u+second]>>6u;
 if((firstMetadata&0xffffu)==(secondMetadata&0xffffu)||((firstMetadata|secondMetadata)&0x10000u)==0u){return;}
 if(any(maximum(first)<minimum(second))||any(maximum(second)<minimum(first))){return;}
 let slot=atomicAdd(&diagnostics[${offsets['diagnostics']}u],1u);
 if(slot>=PAIR_CAPACITY){atomicAdd(&diagnostics[${offsets['diagnostics']}u+1u],1u);return;}
 pairs[${offsets['pairs']}u+slot*2u]=min(first,second);pairs[${offsets['pairs']}u+slot*2u+1u]=max(first,second);
}
@compute @workgroup_size(64) fn discover(@builtin(global_invocation_id) invocation:vec3u){
 let first=invocation.x;if(first>=BODY_COUNT){return;}let ownLevel=levels[${offsets['levels']}u+first]&63u;if(ownLevel==33u){return;}
 var tested=0u;var occupied=0u;if(ownLevel<32u){occupied=atomicLoad(&diagnostics[${offsets['diagnostics']}u+4u])&(0xffffffffu<<ownLevel);}
 loop{if(occupied==0u){break;}let level=firstTrailingBit(occupied);occupied&=~(1u<<level);let origin=cell(first,level);
  for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
   let coordinate=origin+vec3i(x,y,z);let key=hash(coordinate,level,domain(first));var cursor=lowerBound(key);
   loop{if(cursor>=BODY_COUNT||sortedKeys[${offsets['sortedKeys']}u+cursor]!=key){break;}let second=sortedValues[${offsets['sortedValues']}u+cursor];cursor++;
    if(tested>=MAXIMUM_CANDIDATES){atomicAdd(&diagnostics[${offsets['diagnostics']}u+6u],1u);return;}tested++;atomicAdd(&diagnostics[${offsets['diagnostics']}u+3u],1u);
    if((levels[${offsets['levels']}u+second]&63u)!=level||(level==ownLevel&&second<=first)){continue;}
    if(domain(first)!=domain(second)||any(cell(second,level)!=coordinate)){continue;}
    emit(first,second);
   }
  }}}
 }
 let oversizedCount=atomicLoad(&diagnostics[${offsets['diagnostics']}u+5u]);
 for(var index=0u;index<oversizedCount;index++){let second=oversized[${offsets['oversized']}u+index];if(domain(first)!=domain(second)||second==first||(ownLevel==32u&&second<first)){continue;}
  if(tested>=MAXIMUM_CANDIDATES){atomicAdd(&diagnostics[${offsets['diagnostics']}u+6u],1u);return;}tested++;atomicAdd(&diagnostics[${offsets['diagnostics']}u+3u],1u);emit(first,second);
 }
}
`;
  if (props.activeInstances) {
    const instances = props.minima.length / props.partitionSize!;
    const queueOffset = offsets['activeInstances'] + 16 + instances * 8;
    const bucketCount = 2 ** Math.ceil(Math.log2(Math.max(1, props.minima.length * 2)));
    const bucketMask = bucketCount - 1;
    source += `
fn activeCount()->u32{return activeInstances[${offsets['activeInstances']}u]*${props.partitionSize}u;}
fn activeObject(index:u32)->u32{return activeInstances[${queueOffset}u+index/${props.partitionSize}u]*${props.partitionSize}u+index%${props.partitionSize}u;}
@compute @workgroup_size(64) fn clearBuckets(@builtin(global_invocation_id) invocation:vec3u){
 // First use initializes the table; subsequent steps clear only buckets touched last step.
 let initialized=${props.bucketState ? `atomicLoad(&heads[${bucketCount + 1}u])` : '0u'};
 let count=select(${bucketCount}u,atomicLoad(&heads[${bucketCount}u]),initialized!=0u);
 for(var index=invocation.x;index<count;index+=64u){
  var bucket=index;if(initialized!=0u){bucket=atomicLoad(&heads[${bucketCount + 2}u+index]);}
  atomicStore(&heads[bucket],0xffffffffu);
 }
 storageBarrier();
 if(invocation.x==0u){atomicStore(&heads[${bucketCount}u],0u);atomicStore(&heads[${bucketCount + 1}u],1u);}
}
`;
    source = source
      .replace('var tested=0u;', 'var tested=0u;var bucketVisits=0u;')
      .replace(
        'let index=invocation.x;if(index>=BODY_COUNT){return;}',
        'let work=invocation.x;if(work>=activeCount()){return;}let index=activeObject(work);'
      )
      .replace(
        'let first=invocation.x;if(first>=BODY_COUNT){return;}',
        'let work=invocation.x;if(work>=activeCount()){return;}let first=activeObject(work);'
      )
      .replace(
        'keys[' + offsets['keys'] + 'u+index]=hash(cell(index,level),level,domain(index));',
        `let key=hash(cell(index,level),level,domain(index));let bucket=key&${bucketMask}u;let previous=atomicExchange(&heads[bucket],index);values[${offsets['values']}u+index]=previous;
 if(previous==0xffffffffu){let touched=atomicAdd(&heads[${bucketCount}u],1u);atomicStore(&heads[${bucketCount + 2}u+touched],bucket);}`
      )
      .replace('var cursor=lowerBound(key);', `var cursor=atomicLoad(&heads[key&${bucketMask}u]);`)
      .replace(
        `if(cursor>=BODY_COUNT||sortedKeys[${offsets['sortedKeys']}u+cursor]!=key){break;}let second=sortedValues[${offsets['sortedValues']}u+cursor];cursor++;`,
        `if(cursor>=BODY_COUNT){break;}if(bucketVisits>=${Math.min(0xffffffff, (props.maximumCandidateTestsPerQuery ?? 4096) * 32)}u){atomicAdd(&diagnostics[${offsets['diagnostics']}u+6u],1u);return;}bucketVisits++;let second=cursor;cursor=values[${offsets['values']}u+second];if(domain(first)!=domain(second)||(levels[${offsets['levels']}u+second]&63u)!=level||any(cell(second,level)!=coordinate)){continue;}`
      );
    source = source.replace(/keys\[[^\]]+\]=0xffffffffu;/g, '').replace(/oversized\[/g, 'levels[');
  }
  return source;
}
