type AnimationLoopProps = {
  onCreateContext?: (opts: object) => WebGLRenderingContext;
  onAddHTML?: () => void;
  onInitialize?: () => void;
  onRender?: () => void;
  onFinalize?: () => void;
  onError?: () => void;

  gl?: WebGL2RenderingContext;
  glOptions?: object;
  debug?: boolean;

  createFramebuffer?: boolean;

  // view parameters
  autoResizeViewport?: boolean;
  autoResizeDrawingBuffer?: boolean;
  stats: any; // TODO - use probe.gl Stat type
};

export default class AnimationLoop {
  readonly gl: WebGLRenderingContext;
  readonly canvas: any; // HTMLCanvasElement | OffscreenCanvas;

  constructor(props?: AnimationLoopProps);
  delete(): void;
  setNeedsRedraw(reason: any): this;
  setProps(props: any): this;
  start(opts?: {}): this;
  redraw(): this;
  stop(): this;
  attachTimeline(timeline: any): any;
  detachTimeline(): void;
  waitForRender(): any;
  toDataURL(): Promise<any>;
  onCreateContext(...args: any[]): any;
  onInitialize(...args: any[]): any;
  onRender(...args: any[]): any;
  onFinalize(...args: any[]): any;
  getHTMLControlValue(id: any, defaultValue?: number): number;
  setViewParameters(): this;
}
