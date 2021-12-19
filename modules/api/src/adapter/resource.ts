//
import Device from './device';
// import {uid} from '../utils';

export type ResourceProps = {
  id?: string;
  handle?: any;
  userData?: {[key: string]: any};
}

export const DEFAULT_RESOURCE_PROPS: Required<ResourceProps> = {
  id: undefined,
  handle: undefined,
  userData: {}
};

/**
 * Base class for GPU (WebGPU/WebGL) Resources
 */
export default abstract class Resource<Props extends ResourceProps> {
  abstract get [Symbol.toStringTag](): string;

  /** props.id, for debugging. */
  id: string;
  readonly props: Required<Props>;
  readonly userData: {[key: string]: any} = {};
  abstract readonly device: Device;
  private _device: Device;

  // For resources that allocate GPU memory
  private allocatedBytes: number = 0;

  /**
   * Create a new Resource. Called from Subclass
   */
  constructor(device: Device, props: Props, defaultProps: Required<Props>) {
    if (!device) {
      throw new Error('no device');
    }
    this._device = device;
    this.props = this.initializeProps(props, defaultProps);
    this.id = this.props.id || 'no-id'; // TODO uid(this[Symbol.toStringTag] || this.constructor.name);
    this.userData = this.props.userData || {};
    this.addStats();
  }

  /**
   * destroy can be called on any resource to release it before it is garbage collected.
   */
  destroy(): void {
    this.removeStats();
  }

  /** @deprecated Use destroy() */
  delete(): this {
    this.destroy();
    return this;
  }

  toString(): string {
    return `${this[Symbol.toStringTag] || this.constructor.name}(${this.id})`;
  }

  /**
   * Combines a map of user props and default props, only including props from defaultProps
   * @returns returns a map of overridden default props
   */
  getProps(): object {
    return this.props;
  }

  // PROTECTED METHODS

  /** Called by subclass to track memory allocations */
  protected trackAllocatedMemory(bytes, name = this[Symbol.toStringTag]) {
    const stats = this._device.statsManager.getStats('Resource Counts');
    stats.get('GPU Memory').addCount(bytes);
    stats.get(`${name} Memory`).addCount(bytes);
    this.allocatedBytes = bytes;
  }

  /** Called by subclass to track memory deallocations */
  protected trackDeallocatedMemory(name = this[Symbol.toStringTag]) {
    const stats = this._device.statsManager.getStats('Resource Counts');
    stats.get('GPU Memory').subtractCount(this.allocatedBytes);
    stats.get(`${name} Memory`).subtractCount(this.allocatedBytes);
    this.allocatedBytes = 0;
  }

  /** Called by subclass .destroy() to track object destruction */
  protected removeStats() {
    const stats = this._device.statsManager.getStats('Resource Counts');
    const name = this[Symbol.toStringTag];
    stats.get(`${name}s Active`).decrementCount();
  }

  // PRIVATE METHODS

  /** Called by constructor to track object creation */
  private addStats() {
    const stats = this._device.statsManager.getStats('Resource Counts');
    const name = this[Symbol.toStringTag];
    stats.get('Resources Created').incrementCount();
    stats.get(`${name}s Created`).incrementCount();
    stats.get(`${name}s Active`).incrementCount();
  }

  /**
   * Combines a map of user props and default props, only including props from defaultProps
   * @param props
   * @param defaultProps
   * @returns returns a map of overridden default props
   */
   private initializeProps(props: Props, defaultProps: Required<Props>): Required<Props> {
    const mergedProps = {...defaultProps};
    for (const key in props) {
      if (props[key] !== undefined) {
        mergedProps[key] = props[key];
      }
    }
    return mergedProps;
  }
}
