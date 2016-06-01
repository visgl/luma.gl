/* eslint-disable no-console */
/* global console */
/* global window */

const lumaLog = {
  priority: 0,
  table(priority, table) {
    if (priority <= lumaLog.priority && table) {
      console.table(table);
    }
  },
  log(priority, ...args) {
    if (priority <= lumaLog.priority) {
      console.debug(...args);
    }
  }
};

if (typeof window !== 'undefined') {
  window.lumaLog = lumaLog;
}

export default lumaLog;
