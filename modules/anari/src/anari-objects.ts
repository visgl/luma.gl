import type {ANARIDevice} from './anari-device';
import type {
  ANARIArrayData,
  ANARIArrayParameters,
  ANARICameraParameters,
  ANARICameraSubtype,
  ANARIFrameParameters,
  ANARIFrameStatistics,
  ANARIGeometryParameters,
  ANARIGeometrySubtype,
  ANARIGroupParameters,
  ANARIInstanceParameters,
  ANARILightParameters,
  ANARILightSubtype,
  ANARIMaterialParameters,
  ANARIMaterialSubtype,
  ANARIObjectType,
  ANARIRendererParameters,
  ANARIRendererSubtype,
  ANARISamplerParameters,
  ANARISamplerSubtype,
  ANARISurfaceParameters,
  ANARIWorldParameters
} from './anari-types';

let nextObjectIdentifier = 0;

export class ANARIObject<Parameters extends object = Record<string, unknown>> {
  readonly device: ANARIDevice;
  readonly type: ANARIObjectType;
  readonly subtype: string;
  readonly id: string;
  version = 0;

  private pendingParameters: Partial<Parameters>;
  private committedParameters: Partial<Parameters> = {};

  constructor(
    device: ANARIDevice,
    type: ANARIObjectType,
    subtype: string,
    parameters: Partial<Parameters> = {}
  ) {
    this.device = device;
    this.type = type;
    this.subtype = subtype;
    this.id = `${type}-${++nextObjectIdentifier}`;
    this.pendingParameters = {...parameters};
    this.commitParameters();
  }

  setParameter<ParameterName extends keyof Parameters>(
    parameterName: ParameterName,
    value: Parameters[ParameterName]
  ): this {
    this.pendingParameters[parameterName] = value;
    return this;
  }

  setParameters(parameters: Partial<Parameters>): this {
    Object.assign(this.pendingParameters, parameters);
    return this;
  }

  unsetParameter(parameterName: keyof Parameters): this {
    delete this.pendingParameters[parameterName];
    return this;
  }

  getParameter<ParameterName extends keyof Parameters>(
    parameterName: ParameterName
  ): Parameters[ParameterName] | undefined {
    return this.committedParameters[parameterName];
  }

  getParameters(): Readonly<Partial<Parameters>> {
    return this.committedParameters;
  }

  commitParameters(): this {
    this.committedParameters = {...this.pendingParameters};
    this.version++;
    return this;
  }
}

export class ANARIArray extends ANARIObject<ANARIArrayParameters> {
  constructor(device: ANARIDevice, parameters: ANARIArrayParameters) {
    super(device, 'array', 'array1D', parameters);
  }

  get data(): ANARIArrayData {
    return this.getParameter('data')!;
  }

  get length(): number {
    return this.data.length;
  }
}

export class ANARIGeometry extends ANARIObject<ANARIGeometryParameters> {
  declare readonly subtype: ANARIGeometrySubtype;

  constructor(
    device: ANARIDevice,
    subtype: ANARIGeometrySubtype,
    parameters: ANARIGeometryParameters = {}
  ) {
    super(device, 'geometry', subtype, parameters);
  }
}

export class ANARIMaterial extends ANARIObject<ANARIMaterialParameters> {
  declare readonly subtype: ANARIMaterialSubtype;

  constructor(
    device: ANARIDevice,
    subtype: ANARIMaterialSubtype,
    parameters: ANARIMaterialParameters = {}
  ) {
    super(device, 'material', subtype, parameters);
  }
}

export class ANARISampler extends ANARIObject<ANARISamplerParameters> {
  declare readonly subtype: ANARISamplerSubtype;

  constructor(
    device: ANARIDevice,
    subtype: ANARISamplerSubtype,
    parameters: ANARISamplerParameters
  ) {
    super(device, 'sampler', subtype, parameters);
  }
}

export class ANARISurface extends ANARIObject<ANARISurfaceParameters> {
  constructor(device: ANARIDevice, parameters: ANARISurfaceParameters) {
    super(device, 'surface', 'default', parameters);
  }
}

export class ANARIGroup extends ANARIObject<ANARIGroupParameters> {
  constructor(device: ANARIDevice, parameters: ANARIGroupParameters = {}) {
    super(device, 'group', 'default', parameters);
  }
}

export class ANARIInstance extends ANARIObject<ANARIInstanceParameters> {
  constructor(device: ANARIDevice, parameters: ANARIInstanceParameters) {
    super(device, 'instance', 'transform', parameters);
  }
}

export class ANARIWorld extends ANARIObject<ANARIWorldParameters> {
  constructor(device: ANARIDevice, parameters: ANARIWorldParameters = {}) {
    super(device, 'world', 'default', parameters);
  }
}

export class ANARILight extends ANARIObject<ANARILightParameters> {
  declare readonly subtype: ANARILightSubtype;

  constructor(
    device: ANARIDevice,
    subtype: ANARILightSubtype,
    parameters: ANARILightParameters = {}
  ) {
    super(device, 'light', subtype, parameters);
  }
}

export class ANARICamera extends ANARIObject<ANARICameraParameters> {
  declare readonly subtype: ANARICameraSubtype;

  constructor(
    device: ANARIDevice,
    subtype: ANARICameraSubtype,
    parameters: ANARICameraParameters = {}
  ) {
    super(device, 'camera', subtype, parameters);
  }
}

export class ANARIRenderer extends ANARIObject<ANARIRendererParameters> {
  declare readonly subtype: ANARIRendererSubtype;

  constructor(
    device: ANARIDevice,
    subtype: ANARIRendererSubtype,
    parameters: ANARIRendererParameters = {}
  ) {
    super(device, 'renderer', subtype, parameters);
  }
}

export class ANARIFrame extends ANARIObject<ANARIFrameParameters> {
  statistics: ANARIFrameStatistics = {
    surfaceCount: 0,
    instanceCount: 0,
    drawCount: 0,
    triangleCount: 0
  };

  constructor(device: ANARIDevice, parameters: ANARIFrameParameters) {
    super(device, 'frame', 'default', parameters);
  }

  render(): ANARIFrameStatistics {
    this.statistics = this.device.renderFrame(this);
    return this.statistics;
  }

  destroy(): void {
    this.device.destroyFrame(this);
  }
}
