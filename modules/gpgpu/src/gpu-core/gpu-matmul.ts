// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';

const TILE = 16;

export type GPUMatMulProps = {
  id?: string;
  /** Row-major MxK matrix. */
  left: GraphDataView<'float32'>;
  /** Row-major KxN matrix. */
  right: GraphDataView<'float32'>;
  /** Row-major MxN output matrix. */
  output: GraphDataView<'float32'>;
  /** Output row count. */
  m: number;
  /** Shared inner dimension. */
  k: number;
  /** Output column count. */
  n: number;
};

/** Dense tiled row-major float32 matrix multiplication: `output = left * right`. */
export class GPUMatMul {
  readonly id: string;
  readonly left: GraphDataView<'float32'>;
  readonly right: GraphDataView<'float32'>;
  readonly output: GraphDataView<'float32'>;
  readonly m: number;
  readonly k: number;
  readonly n: number;

  constructor(props: GPUMatMulProps) {
    this.id = props.id ?? 'gpu-matmul';
    this.left = props.left;
    this.right = props.right;
    this.output = props.output;
    this.m = props.m;
    this.k = props.k;
    this.n = props.n;

    validatePackedView(this.left, ['float32'], `${this.id} left`);
    validatePackedView(this.right, ['float32'], `${this.id} right`);
    validatePackedView(this.output, ['float32'], `${this.id} output`);
    for (const [name, value] of Object.entries({m: this.m, k: this.k, n: this.n})) {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${this.id} ${name} must be a non-negative integer`);
      }
    }
    if (this.left.length !== this.m * this.k) throw new Error(`${this.id} left length must equal m * k`);
    if (this.right.length !== this.k * this.n) throw new Error(`${this.id} right length must equal k * n`);
    if (this.output.length !== this.m * this.n) throw new Error(`${this.id} output length must equal m * n`);
    if (this.output.buffer === this.left.buffer || this.output.buffer === this.right.buffer) {
      throw new Error(`${this.id} output must use a separate buffer`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.left, this.right, this.output]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.m === 0 || this.n === 0) return;

    const source = makeShaderSource(this);
    const workgroupsX = Math.ceil(this.n / TILE);
    const workgroupsY = Math.ceil(this.m / TILE);
    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUMatMul',
        commandCount: 1,
        maximumWorkgroupCount: workgroupsX * workgroupsY,
        maximumInvocationCount: workgroupsX * workgroupsY * TILE * TILE,
        readByteLength: (this.left.length + this.right.length) * 4,
        writeByteLength: this.output.length * 4
      },
      resources: [
        {buffer: this.left, usage: 'storage-read'},
        {buffer: this.right, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {bindings: [
            {name: 'leftValues', type: 'read-only-storage', group: 0, location: 0},
            {name: 'rightValues', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputValues', type: 'storage', group: 0, location: 2}
          ]}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              leftValues: getViewBinding(this.left, getBuffer),
              rightValues: getViewBinding(this.right, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer)
            };
            computation.setBindings(bindings);
            computation.dispatch(computePass, workgroupsX, workgroupsY, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}

function makeShaderSource(matmul: GPUMatMul): string {
  return `const M:u32=${matmul.m}u; const K:u32=${matmul.k}u; const N:u32=${matmul.n}u;
const LEFT_OFFSET:u32=${getViewElementOffset(matmul.left)}u; const RIGHT_OFFSET:u32=${getViewElementOffset(matmul.right)}u; const OUTPUT_OFFSET:u32=${getViewElementOffset(matmul.output)}u;
@group(0) @binding(0) var<storage,read> leftValues:array<f32>;
@group(0) @binding(1) var<storage,read> rightValues:array<f32>;
@group(0) @binding(2) var<storage,read_write> outputValues:array<f32>;
var<workgroup> tileA:array<array<f32,${TILE}>,${TILE}>;
var<workgroup> tileB:array<array<f32,${TILE}>,${TILE}>;
@compute @workgroup_size(${TILE},${TILE},1)
fn main(@builtin(workgroup_id) wg:vec3u,@builtin(local_invocation_id) local:vec3u){
  let row=wg.y*${TILE}u+local.y;
  let col=wg.x*${TILE}u+local.x;
  var sum=0.0;
  var tileStart=0u;
  loop {
    if(tileStart>=K){break;}
    let aCol=tileStart+local.x;
    let bRow=tileStart+local.y;
    tileA[local.y][local.x]=select(0.0,leftValues[LEFT_OFFSET+row*K+aCol],row<M && aCol<K);
    tileB[local.y][local.x]=select(0.0,rightValues[RIGHT_OFFSET+bRow*N+col],bRow<K && col<N);
    workgroupBarrier();
    var i=0u;
    loop { if(i>=${TILE}u){break;} sum += tileA[local.y][i]*tileB[i][local.x]; i+=1u; }
    workgroupBarrier();
    tileStart+=${TILE}u;
  }
  if(row<M && col<N){outputValues[OUTPUT_OFFSET+row*N+col]=sum;}
}`;
}
