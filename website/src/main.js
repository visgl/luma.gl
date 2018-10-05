/* global document */
import 'babel-polyfill';
import 'babel-register';

// Enable debugging
// import 'luma.gl/debug';
// import {setContextDefaults} from 'luma.gl';
// setContextDefaults({debug: true});

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import AppState from './reducers';
import Routes from './routes';

const el = document.createElement('div');
document.body.appendChild(el);

ReactDOM.render(
  <Provider store={AppState} >
    <Routes />
  </Provider>,
  el
);
