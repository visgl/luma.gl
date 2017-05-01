import {handleActions} from 'redux-actions';

import {DEFAULT_VIEWPORT_STATE} from '../constants/defaults';
import ViewportAnimation from '../utils/map-utils';

ViewportAnimation.init();

export default handleActions({

  UPDATE_CONTEXT: (state, action) => {
    const {viewport} = action;
    return {...state, ...viewport};
  }

}, DEFAULT_VIEWPORT_STATE);
