const modifierEventKeyMap = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Meta: 'metaKey',
  Shift: 'shiftKey'
};

export function createGetModifierState(rawEvent) {
  return function getModifierState(modifierKeyName) {
    if (rawEvent.getModifierState) {
      return rawEvent.getModifierState(modifierKeyName);
    }
    const modifierEventKey = modifierEventKeyMap[modifierKeyName];
    if (modifierEventKey) {
      return rawEvent[modifierEventKey] || false;
    }
    return false;
  };
}

export function getElementRelativePosition(element, eventPosition) {
  const elementBoundingBox = element.getBoundingClientRect();
  return {
    x: eventPosition.clientX - elementBoundingBox.left,
    y: eventPosition.clientY - elementBoundingBox.top
  };
}
