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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9wcm9taXNpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFTZ0IsUyxHQUFBLFM7QUFUaEI7Ozs7Ozs7O0FBUUE7QUFDTyxTQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUI7QUFDOUIsU0FBTyxTQUFTLG1CQUFULEdBQXNDO0FBQUEsc0NBQU4sSUFBTTtBQUFOLFVBQU07QUFBQTs7QUFDM0MsV0FBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLGVBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5QixJQUF6QixFQUErQjtBQUM3QixZQUFJO0FBQ0YsY0FBSSxLQUFKLEVBQVc7QUFDVCxtQkFBTyxLQUFQO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsb0JBQVEsSUFBUjtBQUNEO0FBQ0YsU0FORCxDQU1FLE9BQU8sQ0FBUCxFQUFVO0FBQ1YsaUJBQU8sQ0FBUDtBQUNEO0FBQ0Y7QUFDRCw0QkFBUSxJQUFSLFNBQWMsUUFBZDtBQUNELEtBYk0sQ0FBUDtBQWNELEdBZkQ7QUFnQkQ7QUFDRCIsImZpbGUiOiJwcm9taXNpZnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbnZlcnRzIGEgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIGEgbm9kZSBzdHlsZSAoZXJyLCByZXN1bHQpIGNhbGxiYWNrXG4gKiBhcyB0aGUgbGFzdCBhcmd1bWVudCBpbnRvIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgc2FtZSBhcmd1bWVudHNcbiAqIGFuZCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9yIHJlamVjdHMgd2l0aCB0aGUgdmFsdWVzIHByb3ZpZGVkXG4gKiBieSB0aGUgb3JpZ2luYWwgY2FsbGJhY2tcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBmdW5jdGlvbiB0byB3cmFwXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gcHJvbWlzaWZpZWQgZnVuY3Rpb25cbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tdHJ5LWNhdGNoICovXG5leHBvcnQgZnVuY3Rpb24gcHJvbWlzaWZ5KGZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHByb21pc2lmaWVkRnVuY3Rpb24oLi4uYXJncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBmdW5jdGlvbiBjYWxsYmFjayhlcnJvciwgZGF0YSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZ1bmMoLi4uYXJncywgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9O1xufVxuLyogZXNsaW50LWVuYWJsZSBuby10cnktY2F0Y2ggKi9cbiJdfQ==