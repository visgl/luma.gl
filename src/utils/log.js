import {Log} from 'probe.gl';

// TODO - move this code to probe.gl
Log.prototype.LOG_THROTTLE_TIMEOUT = 1000;

const cache = {};

function throttle(tag, timeout) {
  const prevTime = cache[tag];
  const time = Date.now();
  if (!prevTime || (time - prevTime > timeout)) {
  	cache[tag] = time;
  	return true;
  }
  return false;
}

function stringifyTable(table) {
  //.return JSON.stringify(table);
  for (const key in table) {
  	for (const title in table[key]) {
	  return title || 'untitled';
	}
  }
  return 'empty';
}

Log.prototype.table = function table(priority, table, columns) {
  if (priority <= this.priority && table) {
  	const tag = stringifyTable(table);
  	if (throttle(tag, this.LOG_THROTTLE_TIMEOUT)) {
  	  if (columns) {
      	console.table(table, columns);
      } else {
      	console.table(table);
      }
    }
  }
};

export default new Log({id: 'luma'});
