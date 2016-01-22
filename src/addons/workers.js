// workers.js
//

export default class WorkerGroup {

  constructor(fileName, n) {
    var workers = this.workers = [];
    while (n--) {
      workers.push(new Worker(fileName));
    }
  }

  map(callback) {
    var workers = this.workers;
    var configs = this.configs = [];

    for (var i = 0, l = workers.length; i < l; i++) {
      configs.push(callback && callback(i));
    }

    return this;
  }

  reduce(opt) {
    var fn = opt.reduceFn,
        workers = this.workers,
        configs = this.configs,
        l = workers.length,
        acum = opt.initialValue,
        message = function (e) {
          l--;
          if (acum === undefined) {
            acum = e.data;
          } else {
            acum = fn(acum, e.data);
          }
          if (l == 0) {
            opt.onComplete(acum);
          }
        };
    for (var i = 0, ln = l; i < ln; i++) {
      var w = workers[i];
      w.onmessage = message;
      w.postMessage(configs[i]);
    }

    return this;
  }

}
