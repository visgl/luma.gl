// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from './log';

// Install stubs for removed methods
export function stubRemovedMethods(
  instance: any,
  className: string,
  version: string,
  methodNames: string[]
) {
  const upgradeMessage = `See luma.gl ${version} Upgrade Guide at \
https://luma.gl/docs/upgrade-guide`;

  const prototype = Object.getPrototypeOf(instance);

  methodNames.forEach((methodName: string): void => {
    if (prototype.methodName) {
      return;
    }

    prototype[methodName] = () => {
      log.removed(`Calling removed method ${className}.${methodName}: `, upgradeMessage)();
      throw new Error(methodName);
    };
  });
}
