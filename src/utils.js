export function merge() {
  var mix = {};
  for (var i = 0, l = arguments.length; i < l; i++){
    var object = arguments[i];
    if (type(object) != 'object') continue;
    for (var key in object){
      var op = object[key], mp = mix[key];
      if (mp && type(op) == 'object' && type(mp) == 'object') {
        mix[key] = merge(mp, op);
      } else{
        mix[key] = detach(op);
      }
    }
  }
  return mix;
};

export function extend(to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

export function splat(a) {
  return Array.isArray(a) && a || [a];
};

export function empty() {}

var _uid = Date.now();
export function uid() {
  return _uid++;
}

function _type(e) {
  var t = Object.prototype.toString.call(e);
  return t.substr(8, t.length - 9).toLowerCase();
};

export function type(elem) {
  var elemType = _type(elem);
  if (elemType != 'object') {
    return elemType;
  }
  // rye TODO: remove this when we get rid of $$family.
  if (elem.$$family) return elem.$$family;
  return (elem && elem.nodeName && elem.nodeType == 1) ? 'element' : elemType;
}

function detach(elem) {
  var t = type(elem), ans;
  if (t == 'object') {
    ans = {};
    for (var p in elem) {
      ans[p] = detach(elem[p]);
    }
    return ans;
  } else if (t == 'array') {
    ans = [];
    for (var i = 0, l = elem.length; i < l; i++) {
      ans[i] = detach(elem[i]);
    }
    return ans;
  } else {
    return elem;
  }
}
