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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pby91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQVNnQixTLEdBQUEsUzs7Ozs7Ozs7OztBQUFULFNBQVMsU0FBVCxDQUFtQixJQUFuQixFQUF5QjtBQUM5QixTQUFPLFNBQVMsbUJBQVQsR0FBc0M7QUFBQSxzQ0FBTixJQUFNO0FBQU4sVUFBTTtBQUFBOztBQUMzQyxXQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsZUFBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCLElBQXpCLEVBQStCO0FBQzdCLFlBQUk7QUFDRixjQUFJLEtBQUosRUFBVztBQUNULG1CQUFPLEtBQVA7QUFDRCxXQUZELE1BRU87QUFDTCxvQkFBUSxJQUFSO0FBQ0Q7QUFDRixTQU5ELENBTUUsT0FBTyxDQUFQLEVBQVU7QUFDVixpQkFBTyxDQUFQO0FBQ0Q7QUFDRjtBQUNELDRCQUFRLElBQVIsU0FBYyxRQUFkO0FBQ0QsS0FiTSxDQUFQO0FBY0QsR0FmRDtBQWdCRCIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29udmVydHMgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBub2RlIHN0eWxlIChlcnIsIHJlc3VsdCkgY2FsbGJhY2tcbiAqIGFzIHRoZSBsYXN0IGFyZ3VtZW50IGludG8gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHRoZSBzYW1lIGFyZ3VtZW50c1xuICogYW5kIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgb3IgcmVqZWN0cyB3aXRoIHRoZSB2YWx1ZXMgcHJvdmlkZWRcbiAqIGJ5IHRoZSBvcmlnaW5hbCBjYWxsYmFja1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIGZ1bmN0aW9uIHRvIHdyYXBcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBwcm9taXNpZmllZCBmdW5jdGlvblxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2ggKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9taXNpZnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24gcHJvbWlzaWZpZWRGdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGZ1bmN0aW9uIGNhbGxiYWNrKGVycm9yLCBkYXRhKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuYyguLi5hcmdzLCBjYWxsYmFjayk7XG4gICAgfSk7XG4gIH07XG59XG4vKiBlc2xpbnQtZW5hYmxlIG5vLXRyeS1jYXRjaCAqL1xuIl19