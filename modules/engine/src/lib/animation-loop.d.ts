import {
  Query,
  // TODO - remove dependency on framebuffer (bundle size impact)
  Framebuffer
} from '@luma.gl/webgl';
import { Stats } from 'probe.gl'
import { Timeline } from '../animation/timeline'

import { CreateContextOptions } from '@luma.gl/gltools/src/context/context'
import { StatsManager } from '@luma.gl/webgl/src/init';

interface AnimationProps {
  gl: WebGLRenderingContext

  stop: () => AnimationLoop
  canvas: HTMLCanvasElement | OffscreenCanvas
  framebuffer: Framebuffer
  // Initial values
  useDevicePixels: number | boolean
  needsRedraw?: string
  // Animation props
  startTime: number
  engineTime: number
  tick: number
  tock: number

  // Timeline time for back compatibility
  time: number

  width: number
  height: number
  aspect: number
  
  // Experimental
  _timeline: Timeline
  _loop: AnimationLoop    
  _animationLoop: AnimationLoop
  _mousePosition?: [number, number] // [offsetX, offsetY]
  _offScreen: boolean
}

interface AnimationLoopViewProps {
  // view parameters
  autoResizeViewport?: boolean
  autoResizeDrawingBuffer?: boolean
  useDevicePixels?: number | boolean
}

// constructor parameters
interface AnimationLoopProps extends AnimationLoopViewProps{
  onCreateContext?: (opts: CreateContextOptions) => WebGLRenderingContext // TODO: signature from createGLContext
  onAddHTML?: (div: HTMLDivElement) => string // innerHTML
  onInitialize?: (animationProps: AnimationProps) => AnimationProps | Promise<AnimationProps>
  onRender?: (animationProps: AnimationProps) => void
  onFinalize?: (animationProps: AnimationProps) => void
  onError?: (reason: any) => PromiseLike<never>
  gl?: WebGLRenderingContext
  glOptions?: CreateContextOptions // createGLContext options
  debug?: boolean
  createFramebuffer?: boolean
  stats?: Stats
}

// instance of parameters after construction
interface AnimationLoopPropsInternal {
  onCreateContext: (opts: CreateContextOptions) => WebGLRenderingContext // TODO: signature from createGLContext
  onAddHTML?: (div: HTMLDivElement) => string // innerHTML
  onInitialize: (animationProps: AnimationProps) => AnimationProps | Promise<AnimationProps>
  onRender: (animationProps: AnimationProps) => void
  onFinalize: (animationProps: AnimationProps) => void
  onError: (reason: any) => PromiseLike<never>
  gl?: WebGLRenderingContext
  glOptions: CreateContextOptions // createGLContext options
  debug: boolean
  createFramebuffer: boolean
}

export default class AnimationLoop {
  animationProps: AnimationProps
  props: AnimationLoopPropsInternal
  gl: WebGLRenderingContext
  framebuffer: Framebuffer
  timeline: Timeline
  stats: StatsManager
  cpuTime: Stats
  gpuTime: Stats
  frameRate: Stats
  offScreen: boolean

  display: any

  useDevicePixels: number | boolean
  autoResizeDrawingBuffer: boolean
  autoResizeViewport: boolean

  _initialized: boolean
  _running: boolean
  _animationFrameId?: number
  _nextFramePromise?: Promise<void>
  _resolveNextFrame?: (value: AnimationLoop) => void
  _cpuStartTime: number
  _gpuTimeQuery?: Query
  _pageLoadPromise?: Promise<Document>

  constructor(props?: AnimationLoopProps);
  delete(): void;
  setNeedsRedraw(reason: string): AnimationLoop;
  setProps(props: AnimationLoopViewProps): AnimationLoop;
  start(opts?: CreateContextOptions): AnimationLoop;
  redraw(): AnimationLoop;
  stop(): AnimationLoop;
  attachTimeline(timeline: Timeline): Timeline;
  detachTimeline(): void;
  waitForRender(): Promise<void>;
  toDataURL(): Promise<string>;
  onCreateContext(opts: CreateContextOptions): WebGLRenderingContext;
  onInitialize(animationProps: AnimationProps): AnimationProps | Promise<AnimationProps>;
  onRender(animationProps: AnimationProps): void;
  onFinalize(animationProps: AnimationProps): void;
  getHTMLControlValue(id: string, defaultValue?: number): number;
  setViewParameters(): AnimationLoop;
  _startLoop(): void;
  _getPageLoadPromise(): Promise<Document>;
  _setDisplay(display?: any): void;
  _requestAnimationFrame(renderFrameCallback: () => void): void;
  _renderFrame(animationProps: AnimationProps): void;
  _clearNeedsRedraw(): void;
  _setupFrame(): void;
  _initializeCallbackData(): void;
  _updateCallbackData(): void;
  _finalizeCallbackData(): void;
  _addCallbackData(appContext: AnimationProps): void;
  _createWebGLContext(opts: CreateContextOptions): void;
  _createInfoDiv(): void;
  _getSizeAndAspect(): {
      width: number;
      height: number;
      aspect: number;
  };
  _resizeViewport(): void;
  _resizeCanvasDrawingBuffer(): void;
  _createFramebuffer(): void;
  _resizeFramebuffer(): void;
  _beginTimers(): void;
  _endTimers(): void;
  _startEventHandling(): void;
  _onMousemove(e: MouseEvent): void;
  _onMouseleave(e: MouseEvent): void;
}