/* global window, document */
import isBrowser from './is-browser';

export let isPageLoaded = false;

export const pageLoadPromise = isBrowser ?
  new Promise((resolve, reject) => {
    window.onload = () => {
      isPageLoaded = true;
      resolve(document);
    };
  }) :
  Promise.resolve({});

