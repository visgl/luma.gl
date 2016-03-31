import {default as Fx} from './fx';
import {default as WorkerGroup} from './workers';
import * as helpers from './helpers';
import * as saveBitmap from './save-bitmap';

export {default as Fx} from './fx';
export {default as WorkerGroup} from './workers';
export * from './helpers';
export * from './save-bitmap';

/* global window */
if (typeof window !== 'undefined' && window.LumaGL) {
  window.LumaGL.addons = {
    Fx: Fx,
    WorkerGroup: WorkerGroup
  };
  Object.assign(window.LumaGL.addons, helpers);
  Object.assign(window.LumaGL.addons, saveBitmap);
}
