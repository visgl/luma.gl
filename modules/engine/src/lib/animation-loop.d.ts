// TODO - remove dependency on framebuffer (bundle size impact)
import {Query, Framebuffer} from '@luma.gl/webgl';
import { Stats } from '@probe.gl/stats'
import { Timeline } from '../animation/timeline'

import {CreateGLContextOptions} from '@luma.gl/gltools'
import {StatsManager} from '@luma.gl/webgl/src/init';

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

type AnimationLoopViewProps = {
  // view parameters
  autoResizeViewport?: boolean
  autoResizeDrawingBuffer?: boolean
  useDevicePixels?: number | boolean
}

// constructor parameters
type AnimationLoopProps = AnimationLoopViewProps & {
  onCreateContext?: (opts: CreateGLContextOptions) => WebGLRenderingContext // TODO: signature from createGLContext
  onAddHTML?: (div: HTMLDivElement) => string // innerHTML
  onInitialize?: (animationProps: AnimationProps) => AnimationProps | Promise<AnimationProps>
  onRender?: (animationProps: AnimationProps) => void
  onFinalize?: (animationProps: AnimationProps) => void
  onError?: (reason: any) => PromiseLike<never>
  gl?: WebGLRenderingContext
  glOptions?: CreateGLContextOptions // createGLContext options
  debug?: boolean
  createFramebuffer?: boolean
  stats?: Stats
}

// instance of parameters after construction
type AnimationLoopPropsInternal = {
  onCreateContext: (opts: CreateGLContextOptions) => WebGLRenderingContext // TODO: signature from createGLContext
  onAddHTML?: (div: HTMLDivElement) => string // innerHTML
  onInitialize: (animationProps: AnimationProps) => AnimationProps | Promise<AnimationProps>
  onRender: (animationProps: AnimationProps) => void
  onFinalize: (animationProps: AnimationProps) => void
  onError: (reason: any) => PromiseLike<never>
  gl?: WebGLRenderingContext
  glOptions: CreateGLContextOptions // createGLContext options
  debug: boolean
  createFramebuffer: boolean
}

export default class AnimationLoop {
  readonly animationProps: AnimationProps
  readonly props: AnimationLoopPropsInternal
  readonly gl: WebGLRenderingContext
  readonly canvas: HTMLCanvasElement | OffscreenCanvas
  readonly framebuffer: Framebuffer
  readonly timeline: Timeline
  readonly stats: Stats
  readonly cpuTime: Stats
  readonly gpuTime: Stats
  readonly frameRate: Stats
  readonly offScreen: boolean

  readonly display: any

  readonly useDevicePixels: number | boolean
  readonly autoResizeDrawingBuffer: boolean
  readonly autoResizeViewport: boolean

  constructor(props?: AnimationLoopProps);
  delete(): void;
  setNeedsRedraw(reason: string): AnimationLoop;
  setProps(props: AnimationLoopViewProps): AnimationLoop;
  start(opts?: CreateGLContextOptions): AnimationLoop;
  redraw(): AnimationLoop;
  stop(): AnimationLoop;
  attachTimeline(timeline: Timeline): Timeline;
  detachTimeline(): void;
  waitForRender(): Promise<void>;
  toDataURL(): Promise<string>;
  setViewParameters(): AnimationLoop;
  getHTMLControlValue(id: string, defaultValue?: number): number;
  isContextLost(): boolean;

  // Callbacks
  onCreateContext(opts: CreateGLContextOptions): WebGLRenderingContext;
  onInitialize(animationProps: object): object | Promise<object> | void;
  onRender(animationProps: object): void;
  onFinalize(animationProps: object): void;
  // TODO
  // onInitialize(animationProps: AnimationProps): AnimationProps | Promise<AnimationProps>;
  // onRender(animationProps: AnimationProps): void;
  // onFinalize(animationProps: AnimationProps): void;

  /*
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
  _createWebGLContext(opts: CreateGLContextOptions): void;
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

  _initialized: boolean
  _running: boolean
  _animationFrameId?: number
  _nextFramePromise?: Promise<void>
  _resolveNextFrame?: (value: AnimationLoop) => void
  _cpuStartTime: number
  _gpuTimeQuery?: Query
  _pageLoadPromise?: Promise<Document>

  */
}
