
import StatsManager, {lumaStats} from './stats-manager';
import type {Buffer, BufferProps} from './buffer';
import type {Shader, ShaderProps} from './shader';

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

  createBuffer(props: BufferProps): Buffer { throw new Error('not implemented'); }
  // createTexture(props: TextureProps): Texture;
  createShader(props: ShaderProps): Shader  { throw new Error('not implemented'); }
  // abstract createRenderPipeline(props: RenderPipelineProps): RenderPipeline;
  // abstract createComputePipeline(props: ComputePipelineProps): ComputePipeline;
}
