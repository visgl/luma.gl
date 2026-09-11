// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type CompiledGPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUJacobiPCG} from '@luma.gl/gpgpu/gpu-core/gpu-pcg';
import {
  applyPoissonCSR,
  makeManufacturedPoissonProblem,
  type PoissonProblem2D
} from './poisson-problem';

const DEFAULT_PCG_ITERATIONS=64;
export type PoissonLabMetrics={resolution:number;unknowns:number;nonZeros:number;graphNodes:number;spmvStrategy:string;preconditioner:'jacobi';iterations:number;relativeResidual:number|null;relativeError:number|null};
export type PoissonLabBuffers={rowOffsets:Buffer;columnIndices:Buffer;values:Buffer;rhs:Buffer;solution:Buffer};

/** GPU-resident Poisson solve whose persistent solution buffer is the renderer source of truth. */
export class PoissonLabEngine{
  readonly device:Device;readonly problem:PoissonProblem2D;readonly buffers:PoissonLabBuffers;readonly graph:CompiledGPUCommandGraph<{}>;readonly metrics:PoissonLabMetrics;
  private measurementPromise:Promise<PoissonLabMetrics>|null=null;
  constructor(device:Device,resolution=128,iterations=DEFAULT_PCG_ITERATIONS){if(device.type!=='webgpu')throw new Error('Poisson Lab requires WebGPU.');this.device=device;this.problem=makeManufacturedPoissonProblem(resolution);const n=this.problem.rhs.length;this.buffers={rowOffsets:makeBuffer(device,'poisson-row-offsets',this.problem.rowOffsets,Buffer.STORAGE),columnIndices:makeBuffer(device,'poisson-columns',this.problem.columnIndices,Buffer.STORAGE),values:makeBuffer(device,'poisson-values',this.problem.values,Buffer.STORAGE),rhs:makeBuffer(device,'poisson-rhs',this.problem.rhs,Buffer.STORAGE),solution:device.createBuffer({id:'poisson-solution',byteLength:n*4,usage:Buffer.STORAGE|Buffer.COPY_SRC|Buffer.COPY_DST})};const built=this.createGraph(iterations);this.graph=built.graph;this.metrics={resolution,unknowns:n,nonZeros:this.problem.values.length,graphNodes:this.graph.stats.nodeOrder.length,spmvStrategy:built.spmvStrategy,preconditioner:'jacobi',iterations:built.iterations,relativeResidual:null,relativeError:null};}
  solve():void{this.graph.encode(this.device.commandEncoder,{parameters:{}});}
  /** One-time diagnostic readback of the real GPU solution. Rendering never depends on this. */
  measureAsync():Promise<PoissonLabMetrics>{if(!this.measurementPromise)this.measurementPromise=this.readMetrics();return this.measurementPromise;}
  destroy():void{this.graph.destroy();for(const buffer of Object.values(this.buffers))buffer.destroy();}
  private async readMetrics():Promise<PoissonLabMetrics>{const bytes=await this.buffers.solution.readAsync();const solution=new Float32Array(bytes);const applied=applyPoissonCSR(this.problem,solution);let residual2=0,rhs2=0,error2=0,exact2=0;for(let i=0;i<solution.length;i++){const residual=this.problem.rhs[i]-applied[i];residual2+=residual*residual;rhs2+=this.problem.rhs[i]*this.problem.rhs[i];const error=solution[i]-this.problem.exact[i];error2+=error*error;exact2+=this.problem.exact[i]*this.problem.exact[i];}this.metrics.relativeResidual=Math.sqrt(residual2/Math.max(rhs2,Number.MIN_VALUE));this.metrics.relativeError=Math.sqrt(error2/Math.max(exact2,Number.MIN_VALUE));return this.metrics;}
  private createGraph(iterations:number):{graph:CompiledGPUCommandGraph<{}>;spmvStrategy:string;iterations:number}{const graph=new GPUCommandGraph<{}>(this.device,{id:'poisson-lab-pcg'});const n=this.problem.rhs.length;const rowOffsets=importView(graph,this.buffers.rowOffsets,'rowOffsets','uint32',n+1),columns=importView(graph,this.buffers.columnIndices,'columns','uint32',this.problem.columnIndices.length),values=importView(graph,this.buffers.values,'values','float32',this.problem.values.length),rhs=importView(graph,this.buffers.rhs,'rhs','float32',n),solution=importView(graph,this.buffers.solution,'solution','float32',n);const result=new GPUJacobiPCG({id:'poisson-pcg',rowOffsets,columnIndices:columns,values,rhs,solution,columns:n,iterations,spmvStatistics:{maxNonZerosPerRow:5,shortRowFraction:1}}).addToGraph(graph);return{graph:graph.compile(),spmvStrategy:result.spmvStrategy,iterations:result.iterations};}
}
function makeBuffer(device:Device,id:string,data:ArrayBufferView,usage:number):Buffer{return device.createBuffer({id,byteLength:data.byteLength,usage:usage|Buffer.COPY_DST,data});}
function importView<Format extends'uint32'|'float32'>(graph:GPUCommandGraph<{}>,buffer:Buffer,id:string,format:Format,length:number):GraphDataView<Format>{const handle=graph.importBuffer({id,byteLength:buffer.byteLength,usage:buffer.usage},buffer);return graph.createDataView(handle,{format,length});}
