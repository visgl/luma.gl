/** Applies standard tab navigation without reactivating the currently selected backend. */
export function handleKeyboardTabNavigation(event: {
  currentTarget: HTMLButtonElement;
  key: string;
  preventDefault: () => void;
}): void {
  const nextTab = getNextKeyboardTab(event.currentTarget, event.key);
  if (!nextTab) {
    return;
  }

  event.preventDefault();
  if (nextTab === event.currentTarget) {
    return;
  }

  nextTab.focus();
  nextTab.click();
}

/** Returns the enabled tab selected by standard horizontal-tab keyboard navigation. */
export function getNextKeyboardTab(
  currentTab: HTMLButtonElement,
  pressedKey: string
): HTMLButtonElement | null {
  const directions: Record<string, number> = {ArrowLeft: -1, ArrowRight: 1};
  if (!(pressedKey in directions) && pressedKey !== 'Home' && pressedKey !== 'End') {
    return null;
  }

  const tabList = currentTab.parentElement;
  if (!tabList) {
    return null;
  }

  const availableTabs = Array.from(
    tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')
  );
  const currentIndex = availableTabs.indexOf(currentTab);
  if (currentIndex < 0) {
    return null;
  }

  const nextIndex =
    pressedKey === 'Home'
      ? 0
      : pressedKey === 'End'
        ? availableTabs.length - 1
        : (currentIndex + directions[pressedKey] + availableTabs.length) % availableTabs.length;

  return availableTabs[nextIndex] ?? null;
}
