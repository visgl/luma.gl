// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphStats,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUCrossfilter} from '@luma.gl/experimental/gpu-crossfilter';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import type {GPUDataFrame} from '@luma.gl/experimental/gpu-dataframe';
import {
  CROSS_FILTER_CATEGORY_NAMES,
  CROSS_FILTER_DOMAINS,
  DEFAULT_CROSSFILTER_ROW_COUNT,
  makeCrossfilterDataset,
  type CrossfilterDataset,
  type CrossfilterDatasetOptions
} from './crossfilter-data';
import {
  createCrossfilterDataFrame,
  type CrossfilterDataFrameSchema
} from './crossfilter-dataframe';
import {CrossfilterRenderer, type CrossfilterRenderOptions} from './crossfilter-renderer';

export {
  CROSS_FILTER_CATEGORY_NAMES,
  CROSS_FILTER_DOMAINS,
  CROSS_FILTER_MAP_DOMAIN,
  DEFAULT_CROSSFILTER_ROW_COUNT,
  makeCrossfilterDataset
} from './crossfilter-data';
export type {CrossfilterDataset, CrossfilterDatasetOptions} from './crossfilter-data';
export type {CrossfilterRenderOptions, CrossfilterViewport} from './crossfilter-renderer';

export type CrossfilterRangeDimension = keyof typeof CROSS_FILTER_DOMAINS;
export type CrossfilterHistogramSummary = {bins:Uint32Array;baselineBins:Uint32Array;domain:readonly[number,number]};
export type CrossfilterSummary={rowCount:number;selectedCount:number;histograms:Record<CrossfilterRangeDimension,CrossfilterHistogramSummary>;categoryCounts:Uint32Array;encodeTimeMilliseconds:number;readbackTimeMilliseconds:number;compileTimeMilliseconds:number;nodeCount:number;executionCount:number;residentByteLength:number};
export type CrossfilterEngineOptions=CrossfilterDatasetOptions&{dataset?:CrossfilterDataset;valueBinCount?:number;riskBinCount?:number;hourBinCount?:number};
type ScalarColumn<Format extends 'float32'|'uint32'>={buffer:Buffer;data:GPUData<Format>;view:GraphDataView<Format>};
type OutputColumn={buffer:Buffer;view:GraphDataView<'uint32'>};
type HistogramOutputs={selected:OutputColumn;baseline:OutputColumn};
type SummaryOutputs={histograms:Record<CrossfilterRangeDimension,HistogramOutputs>;categories:OutputColumn;selectedCount:OutputColumn};
export type CrossfilterBounds=readonly[number,number,number,number];

/** GPU-resident linked-view dashboard backed by one shared analytical dataframe. */
export class CrossfilterEngine {
  readonly device:Device;readonly rowCount:number;readonly graph:GPUCommandGraph;readonly filter:GPUCrossfilter;
  /** Semantic analytical view over the exact source buffers consumed by GPUCrossfilter and rendering. */
  readonly dataFrame:GPUDataFrame<CrossfilterDataFrameSchema>;
  readonly residentByteLength:number;readonly nodeCount:number;readonly compileTimeMilliseconds:number;
  private readonly compiledGraph:CompiledGPUCommandGraph;private readonly renderer:CrossfilterRenderer;private readonly summaryOutputs:SummaryOutputs;private readonly packedSummaryBuffer:Buffer;private readonly ownedSourceData:Array<{destroy():void}>=[];private readonly ownedOutputBuffers:Buffer[]=[];private pendingUpdate:Promise<CrossfilterSummary>|null=null;private executionCount=0;private destroyed=false;

  constructor(device:Device,options:CrossfilterEngineOptions={}){
    if(device.type!=='webgpu')throw new Error('Crossfilter showcase requires a WebGPU device');
    this.device=device;const dataset=options.dataset??makeCrossfilterDataset({rowCount:options.rowCount??DEFAULT_CROSSFILTER_ROW_COUNT,seed:options.seed});this.rowCount=dataset.rowCount;this.graph=new GPUCommandGraph(device,{id:'million-row-crossfilter-graph'});
    let initializedFilter:GPUCrossfilter|undefined;let initializedGraph:CompiledGPUCommandGraph|undefined;let initializedRenderer:CrossfilterRenderer|undefined;let initializedDataFrame:GPUDataFrame<CrossfilterDataFrameSchema>|undefined;
    try{
      const longitude=this.createSourceColumn('longitude',dataset.longitude,'float32');const latitude=this.createSourceColumn('latitude',dataset.latitude,'float32');const value=this.createSourceColumn('value',dataset.value,'float32');const risk=this.createSourceColumn('risk',dataset.risk,'float32');const hour=this.createSourceColumn('hour',dataset.hour,'float32');const category=this.createSourceColumn('category',dataset.category,'uint32');
      initializedDataFrame=createCrossfilterDataFrame({longitude:longitude.data,latitude:latitude.data,value:value.data,risk:risk.data,hour:hour.data,category:category.data});
      const histogramOutputs:Record<CrossfilterRangeDimension,HistogramOutputs>={value:this.createHistogramOutputs('value',options.valueBinCount??48),risk:this.createHistogramOutputs('risk',options.riskBinCount??40),hour:this.createHistogramOutputs('hour',options.hourBinCount??24)};const categories=this.createOutputColumn('category-counts',CROSS_FILTER_CATEGORY_NAMES.length,true);const selectedCount=this.createOutputColumn('selected-count',1,true);const selectionMask=this.createOutputColumn('global-selection-mask',this.rowCount,false);const visibleIndices=this.createOutputColumn('visible-indices',this.rowCount,false);this.summaryOutputs={histograms:histogramOutputs,categories,selectedCount};const packedSummaryByteLength=getSummaryOutputColumns(this.summaryOutputs).reduce((byteLength,output)=>byteLength+output.buffer.byteLength,0);this.packedSummaryBuffer=device.createBuffer({id:'crossfilter-packed-summary-readback',byteLength:packedSummaryByteLength,usage:Buffer.MAP_READ|Buffer.COPY_DST});this.ownedOutputBuffers.push(this.packedSummaryBuffer);
      initializedFilter=new GPUCrossfilter(this.graph,{id:'million-row-crossfilter',dimensions:[{id:'map',kind:'bounds',x:longitude.view,y:latitude.view},{id:'scatter',kind:'bounds',x:value.view,y:risk.view},{id:'value',kind:'range',input:value.view},{id:'risk',kind:'range',input:risk.view},{id:'hour',kind:'range',input:hour.view},{id:'category',kind:'range',input:category.view}],views:[{id:'value-baseline',kind:'histogram',dimension:'value',input:value.view,domain:CROSS_FILTER_DOMAINS.value,output:histogramOutputs.value.baseline.view},{id:'value-selected',kind:'histogram',dimension:'value',includeOwnSelection:true,input:value.view,domain:CROSS_FILTER_DOMAINS.value,output:histogramOutputs.value.selected.view},{id:'risk-baseline',kind:'histogram',dimension:'risk',input:risk.view,domain:CROSS_FILTER_DOMAINS.risk,output:histogramOutputs.risk.baseline.view},{id:'risk-selected',kind:'histogram',dimension:'risk',includeOwnSelection:true,input:risk.view,domain:CROSS_FILTER_DOMAINS.risk,output:histogramOutputs.risk.selected.view},{id:'hour-baseline',kind:'histogram',dimension:'hour',input:hour.view,domain:CROSS_FILTER_DOMAINS.hour,output:histogramOutputs.hour.baseline.view},{id:'hour-selected',kind:'histogram',dimension:'hour',includeOwnSelection:true,input:hour.view,domain:CROSS_FILTER_DOMAINS.hour,output:histogramOutputs.hour.selected.view},{id:'category-groups',kind:'group',dimension:'category',keys:category.view,output:categories.view},{id:'visible-transactions',kind:'visibility',output:visibleIndices.view,count:selectedCount.view}],outputMask:selectionMask.view});initializedFilter.addToGraph(this.graph);const compilationStart=nowMilliseconds();initializedGraph=this.graph.compile();this.compileTimeMilliseconds=nowMilliseconds()-compilationStart;this.nodeCount=initializedGraph.stats.nodeOrder.length;this.residentByteLength=initializedGraph.stats.importedBufferBytes+initializedGraph.stats.physicalTransientBytes+this.packedSummaryBuffer.byteLength;initializedRenderer=new CrossfilterRenderer(device,{rowCount:this.rowCount,longitude:longitude.buffer,latitude:latitude.buffer,value:value.buffer,risk:risk.buffer,category:category.buffer,selectionMask:selectionMask.buffer});this.dataFrame=initializedDataFrame;this.filter=initializedFilter;this.compiledGraph=initializedGraph;this.renderer=initializedRenderer;
    }catch(error){initializedRenderer?.destroy();initializedGraph?.destroy();initializedFilter?.destroy();initializedDataFrame?.destroy();this.releaseOwnedBuffers();throw error;}
  }
  get graphStats():GPUCommandGraphStats{return this.compiledGraph.stats;}
  setMapBounds(bounds:CrossfilterBounds|null):this{this.assertAvailable();if(bounds)this.filter.setBounds('map',bounds);else this.filter.clear('map');return this;}
  setScatterBounds(bounds:CrossfilterBounds|null):this{this.assertAvailable();if(bounds)this.filter.setBounds('scatter',bounds);else this.filter.clear('scatter');return this;}
  setRange(dimension:CrossfilterRangeDimension,range:readonly[number,number]|null):this{this.assertAvailable();if(range)this.filter.setRange(dimension,range);else this.filter.clear(dimension);return this;}
  setCategory(category:number|null):this{this.assertAvailable();if(category===null){this.filter.clear('category');return this;}if(!Number.isInteger(category)||category<0||category>=CROSS_FILTER_CATEGORY_NAMES.length)throw new Error('Crossfilter category is outside the available dense group range');this.filter.setRange('category',[category,category]);return this;}
  clearAll():this{this.assertAvailable();this.filter.clearAll();return this;}
  update():Promise<CrossfilterSummary>{this.assertAvailable();if(this.pendingUpdate)return this.pendingUpdate;const pendingUpdate=this.executeUpdate();this.pendingUpdate=pendingUpdate;const clear=()=>{if(this.pendingUpdate===pendingUpdate)this.pendingUpdate=null;};void pendingUpdate.then(clear,clear);return pendingUpdate;}
  render(options:CrossfilterRenderOptions):void{this.assertAvailable();this.renderer.render(options);}
  destroy():void{if(this.destroyed)return;this.destroyed=true;this.renderer.destroy();this.compiledGraph.destroy();this.filter.destroy();this.dataFrame.destroy();this.releaseOwnedBuffers();}
  private async executeUpdate():Promise<CrossfilterSummary>{const commandEncoder=this.device.createCommandEncoder({id:`crossfilter-update-${this.executionCount}`});const encoding=this.compiledGraph.encode(commandEncoder,{parameters:undefined});const summaryColumns=getSummaryOutputColumns(this.summaryOutputs);let destinationOffset=0;for(const output of summaryColumns){commandEncoder.copyBufferToBuffer({sourceBuffer:output.buffer,destinationBuffer:this.packedSummaryBuffer,destinationOffset,size:output.buffer.byteLength});destinationOffset+=output.buffer.byteLength;}this.device.submit(commandEncoder.finish());this.executionCount++;const readbackStart=nowMilliseconds();const packedSummaryBytes=await this.packedSummaryBuffer.readAsync();let sourceOffset=0;const summaryValues=summaryColumns.map(output=>{const values=new Uint32Array(packedSummaryBytes.buffer,packedSummaryBytes.byteOffset+sourceOffset,output.view.length);sourceOffset+=output.buffer.byteLength;return values;});const[valueSelected,valueBaseline,riskSelected,riskBaseline,hourSelected,hourBaseline,categoryCounts,selectedCount]=summaryValues;return{rowCount:this.rowCount,selectedCount:selectedCount[0],histograms:{value:{bins:valueSelected,baselineBins:valueBaseline,domain:CROSS_FILTER_DOMAINS.value},risk:{bins:riskSelected,baselineBins:riskBaseline,domain:CROSS_FILTER_DOMAINS.risk},hour:{bins:hourSelected,baselineBins:hourBaseline,domain:CROSS_FILTER_DOMAINS.hour}},categoryCounts,encodeTimeMilliseconds:encoding.stats.cpuEncodeTimeMilliseconds,readbackTimeMilliseconds:nowMilliseconds()-readbackStart,compileTimeMilliseconds:this.compileTimeMilliseconds,nodeCount:this.nodeCount,executionCount:this.executionCount,residentByteLength:this.residentByteLength};}
  private createSourceColumn<Format extends 'float32'|'uint32'>(name:string,values:Float32Array|Uint32Array,format:Format):ScalarColumn<Format>{const buffer=this.device.createBuffer({id:`crossfilter-source-${name}`,data:values,usage:Buffer.STORAGE|Buffer.COPY_DST});const data=new GPUData<Format>({buffer,format,length:values.length,ownsBuffer:true});this.ownedSourceData.push(data);return{buffer,data,view:this.graph.importGPUData(`crossfilter-source-${name}`,data)};}
  private createHistogramOutputs(dimension:CrossfilterRangeDimension,binCount:number){if(!Number.isSafeInteger(binCount)||binCount<=0)throw new Error('Crossfilter histogram requires a positive, integral bin count');return{selected:this.createOutputColumn(`${dimension}-selected-bins`,binCount,true),baseline:this.createOutputColumn(`${dimension}-baseline-bins`,binCount,true)};}
  private createOutputColumn(name:string,length:number,readable:boolean):OutputColumn{const buffer=this.device.createBuffer({id:`crossfilter-output-${name}`,byteLength:length*Uint32Array.BYTES_PER_ELEMENT,usage:Buffer.STORAGE|Buffer.COPY_DST|(readable?Buffer.COPY_SRC:0)});this.ownedOutputBuffers.push(buffer);const handle=this.graph.importBuffer({id:`crossfilter-output-${name}`,byteLength:buffer.byteLength,usage:buffer.usage},buffer);return{buffer,view:this.graph.createDataView(handle,{format:'uint32',length})};}
  private releaseOwnedBuffers():void{for(const buffer of this.ownedOutputBuffers.splice(0))buffer.destroy();for(const data of this.ownedSourceData.splice(0))data.destroy();}
  private assertAvailable():void{if(this.destroyed)throw new Error('Crossfilter showcase engine has been destroyed');}
}
function getSummaryOutputColumns(outputs:SummaryOutputs):readonly OutputColumn[]{return[outputs.histograms.value.selected,outputs.histograms.value.baseline,outputs.histograms.risk.selected,outputs.histograms.risk.baseline,outputs.histograms.hour.selected,outputs.histograms.hour.baseline,outputs.categories,outputs.selectedCount];}
function nowMilliseconds():number{return typeof performance==='undefined'?Date.now():performance.now();}
