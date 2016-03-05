import TruncatedCone from './truncated-cone';

export default class Cone extends TruncatedCone {
  constructor(config = {}) {
    super({
      ...config,
      topRadius: 0,
      topCap: Boolean(config.cap),
      bottomCap: Boolean(config.cap),
      bottomRadius: config.radius || 3
    });
  }
}
