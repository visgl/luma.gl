// Installs polyfills to support a subset of WebGL2 APIs on WebGL1 contexts

export {default as polyfillContext} from './polyfill/polyfill-context';

// unified parameter APIs
export {
  getParameters,
  setParameters,
  resetParameters
} from './state-tracker/unified-parameter-api/unified-parameter-api';

// state tracking
export {
  default as trackContextState,
  pushContextState,
  popContextState
} from './state-tracker/state-tracking/track-context-state';

export {withParameters} from './state-tracker/state-tracking/with-parameters';
