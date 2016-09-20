// workers.js
//
/* global Worker */
/* eslint-disable one-var, indent */

export default class WorkerGroup {

  constructor(fileName, n) {
    const workers = this.workers = [];
    while (n--) {
      workers.push(new Worker(fileName));
    }
  }

  map(func) {
    const workers = this.workers;
    const configs = this.configs = [];

    for (let i = 0, l = workers.length; i < l; i++) {
      configs.push(func && func(i));
    }

    return this;
  }

  reduce(opt) {
    const fn = opt.reduceFn;
    const workers = this.workers;
    const configs = this.configs;
    let l = workers.length;
    let acum = opt.initialValue;
    const message = e => {
      l--;
      if (acum === undefined) {
        acum = e.data;
      } else {
        acum = fn(acum, e.data);
      }
      if (l === 0) {
        opt.onComplete(acum);
      }
    };
    for (let i = 0, ln = l; i < ln; i++) {
      const w = workers[i];
      w.onmessage = message;
      w.postMessage(configs[i]);
    }

    return this;
  }

}
