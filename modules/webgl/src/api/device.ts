
import StatsManager, {lumaStats} from './stats-manager';

/**
 * WebGPU Device/WebGL context abstraction
 */
export default class Device {
  statsManager: StatsManager = lumaStats;

  // readonly canvas: HTMLCanvasElement;

  /** Check if this device type is supported on this platform */
  // static isSupported(): boolean;

  /** Create device of this type (asynchronous) */
  // static async create(props?: object): Promise<Device>;

  /** Attach to existing WebGPU device */
  // static attach(device: WebGPUDevice, props?: object): Device;

  /** Resize the context */
  // resize(width: number, height: number): void;
  // abstract getFeatures(): string[];
  // abstract getLimits(): DeviceLimits;

  // abstract createBuffer(props: BufferProps): Buffer;
  // abstract createTexture(props: TextureProps): Texture;
  // abstract createShader(props: ShaderProps): Shader;
  // abstract createRenderPipeline(props: RenderPipelineProps): RenderPipeline;
  // abstract createComputePipeline(props: ComputePipelineProps): ComputePipeline;
}
