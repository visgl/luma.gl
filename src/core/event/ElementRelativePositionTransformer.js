import autobind from 'autobind-decorator';

export default class ElementRelativePositionTransformer {
  constructor(element) {
    this._element = element;
  }

  @autobind fromViewportRelative(eventPosition) {
    const elementBoundingBox = this._element.getBoundingClientRect();
    return {
      x: eventPosition.clientX - elementBoundingBox.left,
      y: eventPosition.clientY - elementBoundingBox.top
    };
  }
}
