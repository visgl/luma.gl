// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ClientModule} from '@docusaurus/types';
import {
  EXAMPLE_NAVIGATION_END_EVENT,
  EXAMPLE_NAVIGATION_START_EVENT
} from '../react-luma/utils/example-lifecycle';

const EXAMPLE_ROUTE_PATTERN = /(?:^|\/)examples(?:\/|$)/;

const exampleNavigationClientModule: ClientModule = {
  onRouteUpdate({location, previousLocation}) {
    if (!previousLocation || location.pathname === previousLocation.pathname) {
      return;
    }

    if (isExampleRoute(previousLocation.pathname)) {
      window.dispatchEvent(new Event(EXAMPLE_NAVIGATION_START_EVENT));
    }
  },
  onRouteDidUpdate() {
    window.dispatchEvent(new Event(EXAMPLE_NAVIGATION_END_EVENT));
  }
};

export default exampleNavigationClientModule;

function isExampleRoute(pathname: string): boolean {
  return EXAMPLE_ROUTE_PATTERN.test(pathname);
}
