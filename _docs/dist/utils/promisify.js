"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.promisify = promisify;
/**
 * Converts a function that accepts a node style (err, result) callback
 * as the last argument into a function that takes the same arguments
 * and returns a promise that resolves or rejects with the values provided
 * by the original callback
 * @param {Function} func - function to wrap
 * @return {Function} promisified function
 */
/* eslint-disable no-try-catch */
function promisify(func) {
  return function promisifiedFunction() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      function callback(error, data) {
        try {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        } catch (e) {
          reject(e);
        }
      }
      func.apply(undefined, args.concat([callback]));
    });
  };
}
/* eslint-enable no-try-catch */
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9wcm9taXNpZnkuanMiXSwibmFtZXMiOlsicHJvbWlzaWZ5IiwiZnVuYyIsInByb21pc2lmaWVkRnVuY3Rpb24iLCJhcmdzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJjYWxsYmFjayIsImVycm9yIiwiZGF0YSIsImUiXSwibWFwcGluZ3MiOiI7Ozs7O1FBU2dCQSxTLEdBQUFBLFM7QUFUaEI7Ozs7Ozs7O0FBUUE7QUFDTyxTQUFTQSxTQUFULENBQW1CQyxJQUFuQixFQUF5QjtBQUM5QixTQUFPLFNBQVNDLG1CQUFULEdBQXNDO0FBQUEsc0NBQU5DLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUMzQyxXQUFPLElBQUlDLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDdEMsZUFBU0MsUUFBVCxDQUFrQkMsS0FBbEIsRUFBeUJDLElBQXpCLEVBQStCO0FBQzdCLFlBQUk7QUFDRixjQUFJRCxLQUFKLEVBQVc7QUFDVEYsbUJBQU9FLEtBQVA7QUFDRCxXQUZELE1BRU87QUFDTEgsb0JBQVFJLElBQVI7QUFDRDtBQUNGLFNBTkQsQ0FNRSxPQUFPQyxDQUFQLEVBQVU7QUFDVkosaUJBQU9JLENBQVA7QUFDRDtBQUNGO0FBQ0RULDRCQUFRRSxJQUFSLFNBQWNJLFFBQWQ7QUFDRCxLQWJNLENBQVA7QUFjRCxHQWZEO0FBZ0JEO0FBQ0QiLCJmaWxlIjoicHJvbWlzaWZ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb252ZXJ0cyBhIGZ1bmN0aW9uIHRoYXQgYWNjZXB0cyBhIG5vZGUgc3R5bGUgKGVyciwgcmVzdWx0KSBjYWxsYmFja1xuICogYXMgdGhlIGxhc3QgYXJndW1lbnQgaW50byBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdGhlIHNhbWUgYXJndW1lbnRzXG4gKiBhbmQgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBvciByZWplY3RzIHdpdGggdGhlIHZhbHVlcyBwcm92aWRlZFxuICogYnkgdGhlIG9yaWdpbmFsIGNhbGxiYWNrXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIC0gZnVuY3Rpb24gdG8gd3JhcFxuICogQHJldHVybiB7RnVuY3Rpb259IHByb21pc2lmaWVkIGZ1bmN0aW9uXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb21pc2lmeShmdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbiBwcm9taXNpZmllZEZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgZnVuY3Rpb24gY2FsbGJhY2soZXJyb3IsIGRhdGEpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmdW5jKC4uLmFyZ3MsIGNhbGxiYWNrKTtcbiAgICB9KTtcbiAgfTtcbn1cbi8qIGVzbGludC1lbmFibGUgbm8tdHJ5LWNhdGNoICovXG4iXX0=