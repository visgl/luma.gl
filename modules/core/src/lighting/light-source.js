import {Vector3} from 'math.gl';
import ScenegraphNode from '../scenegraph/scenegraph-node';

// default light source parameters
const DEFAULT_LIGHT_COLOR = [255, 255, 255];
const DEFAULT_LIGHT_INTENSITY = 1.0;
const DEFAULT_ATTENUATION = [0, 0, 1];

const DEFAULT_LIGHT_DIRECTION = [0.0, 0.0, -1.0];

const DEFAULT_LIGHT_POSITION = [0.0, 0.0, 1.0];

const DEFAULT_INNER_CONE_ANGLE = 0;
const DEFAULT_OUTER_CONE_ANGLE = Math.PI / 4;

// Support
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
// TODO - does not support range per
// Recommended implementation for this attenuation with a cutoff range:
// attenuation = max( min( 1.0 - ( current_distance / range )4, 1 ), 0 ) / current_distance2

class LightSource extends ScenegraphNode {
  constructor(props) {
    super(props);
    const {color = DEFAULT_LIGHT_COLOR} = props;
    this.color = color;
    const {intensity = DEFAULT_LIGHT_INTENSITY} = props;
    this.intensity = intensity;
  }

  // PRIVATE

  // Helper: Extracts attenuation from either `props.attenuation`` or `props.intensity``
  // Supports both sophisticated light model and the classic intensity prop
  _getAttenuation(props) {
    if ('attenuation' in props) {
      return props.attenuation;
    }
    if ('intensity' in props) {
      return [0, 0, props.intensity];
    }
    return DEFAULT_ATTENUATION;
  }
}

export class AmbientLight extends LightSource {
  constructor(props) {
    super(props);
    this.type = 'ambient';
  }
}

export class DirectionalLight extends LightSource {
  constructor(props) {
    super(props);
    this.type = 'directional';
    const {direction = DEFAULT_LIGHT_DIRECTION} = props;
    this.direction = new Vector3(direction).normalize().toArray();
  }
}

export class PointLight extends LightSource {
  constructor(props) {
    super(props);
    this.type = 'point';
    const {position = DEFAULT_LIGHT_POSITION} = props;
    this.position = position;
    this.attenuation = this._getAttenuation(props);
  }
}

export class SpotLight extends LightSource {
  constructor(props) {
    super(props);

    this.type = 'spot';

    const {
      position = DEFAULT_LIGHT_POSITION,
      innerConeAngle = DEFAULT_INNER_CONE_ANGLE,
      outerConeAngle = DEFAULT_OUTER_CONE_ANGLE
    } = props;

    this.position = position;
    this.attenuation = this._getAttenuation(props);
    this.innerConeAngle = innerConeAngle;
    this.outerConeAngle = outerConeAngle;
  }
}
