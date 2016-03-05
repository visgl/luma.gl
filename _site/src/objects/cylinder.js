import TruncatedCone from './truncated-cone';

export default class Cylinder extends TruncatedCone {
  constructor(config = {}) {
    super({
      ...config,
      bottomRadius: config.radius,
      topRadius: config.radius
    });
  }
}
