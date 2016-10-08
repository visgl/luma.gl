'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process */

var isNode = exports.isNode = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && String(process) === '[object process]' && !process.browser;

var isBrowser = exports.isBrowser = !isNode;

exports.default = isBrowser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9pcy1icm93c2VyLmpzIl0sIm5hbWVzIjpbImlzTm9kZSIsInByb2Nlc3MiLCJTdHJpbmciLCJicm93c2VyIiwiaXNCcm93c2VyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBO0FBQ0E7QUFDQTs7QUFFTyxJQUFNQSwwQkFDWCxRQUFPQyxPQUFQLHlDQUFPQSxPQUFQLE9BQW1CLFFBQW5CLElBQ0FDLE9BQU9ELE9BQVAsTUFBb0Isa0JBRHBCLElBRUEsQ0FBQ0EsUUFBUUUsT0FISjs7QUFLQSxJQUFNQyxnQ0FBWSxDQUFDSixNQUFuQjs7a0JBRVFJLFMiLCJmaWxlIjoiaXMtYnJvd3Nlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXMgZnVuY3Rpb24gaXMgbmVlZGVkIGluIGluaXRpYWxpemF0aW9uIHN0YWdlcyxcbi8vIG1ha2Ugc3VyZSBpdCBjYW4gYmUgaW1wb3J0ZWQgaW4gaXNvbGF0aW9uXG4vKiBnbG9iYWwgcHJvY2VzcyAqL1xuXG5leHBvcnQgY29uc3QgaXNOb2RlID1cbiAgdHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmXG4gIFN0cmluZyhwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nICYmXG4gICFwcm9jZXNzLmJyb3dzZXI7XG5cbmV4cG9ydCBjb25zdCBpc0Jyb3dzZXIgPSAhaXNOb2RlO1xuXG5leHBvcnQgZGVmYXVsdCBpc0Jyb3dzZXI7XG4iXX0=