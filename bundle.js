(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
/*
 * game-of-life-logic
 *
 * Copyright (c) 2015 David da Silva
 * Licensed under the MIT license.
 */

'use strict'

module.exports = require('./lib/game-of-life-logic')

},{"./lib/game-of-life-logic":6}],6:[function(require,module,exports){
'use strict'

var util = require('util')
var LoopingMatrix = require('looping-matrix')

function GameOfLife (width, height) {
  LoopingMatrix.apply(this, arguments)
  this.reset(GameOfLife.states.DEAD)
}
util.inherits(GameOfLife, LoopingMatrix)

var states = []
;['DEAD', 'ALIVE', 'INDESTRUCTIBLE'].forEach(function (name, index) {
  states[name] = index
  states.push(index)
})
GameOfLife.states = states

GameOfLife.prototype.aliveNeighbours = function GameOfLife$prototype$aliveNeighbours (i, j) {
  var aliveNeighbours = 0
  for (var oi = -1; oi <= 1; ++oi) {
    for (var oj = -1; oj <= 1; ++oj) {
      if (oi === 0 && oj === 0) {
        continue
      }
      var neighbourState = this.getCell(i + oi, j + oj)
      if (neighbourState !== states.DEAD) {
        ++aliveNeighbours
      }
    }
  }
  return aliveNeighbours
}

GameOfLife.prototype.evolve = function GameOfLife$prototype$evolve (i, j) {
  var state = this.getCell(i, j)
  // indestructible cells will always stay indestructible, so skip
  // calculating neighbour sum for them
  if (state === states.INDESTRUCTIBLE) {
    return state
  }
  var aliveNeighbours = this.aliveNeighbours(i, j)
  switch (state) {
    case states.ALIVE:
      // death by under-population / over-population
      if (aliveNeighbours < 2 || aliveNeighbours > 3) {
        return states.DEAD
      }
      // otherwise it stays alive
      return states.ALIVE
    case states.DEAD:
        // birth by reproduction
        if (aliveNeighbours === 3) {
          return states.ALIVE
        }
        // otherwise stays dead
        return states.DEAD
    default:
      throw new Error('Invalid evolve state: ' + state)
  }
}

GameOfLife.prototype.tick = function GameOfLife$prototype$tick () {
  var nextGameState = this.clone()
  for (var i = 0; i < this.height; ++i) {
    for (var j = 0; j < this.width; ++j) {
      var nextCellState = this.evolve(i, j)
      nextGameState.setCell(i, j, nextCellState)
    }
  }
  this.matrix = nextGameState.matrix
}

module.exports = GameOfLife


},{"looping-matrix":7,"util":4}],7:[function(require,module,exports){
/*
 * looping-matrix
 *
 * Copyright (c) 2015 David da Silva
 * Licensed under the MIT license.
 */

'use strict'

/**
 * @typedef Position
 * @type Object
 * @property {number} i The column index of the position
 * @property {number} j The row index of the position
 */

/**
 * A matrix that loops indexes from edge to edge.
 * @constructor
 * @param width {number}
 * @param height {number}
 */
function LoopingMatrix (width, height) {
  this.width = width
  this.height = height
  this.matrix = new Array(height)
  for (var i = 0; i < height; ++i) {
    var row = new Array(width)
    this.matrix[i] = row
  }
}

/**
 * Reset all the positions in the matrix to a given value.
 * @param value {number} value to be set on all the matrix' positions
 */
LoopingMatrix.prototype.reset = function LoopingMatrix$prototype$reset (value) {
  for (var i = 0; i < this.height; ++i) {
    for (var j = 0; j < this.width; ++j) {
      this.matrix[i][j] = value
    }
  }
}

/**
 * In case the given position lays outside the matrix, loop the position from edge to edge.
 * @param i {number} the column index of the position
 * @param j {number} the row index of the position
 * @return {Position} the looped position
 */
LoopingMatrix.prototype.loopPosition = function LoopingMatrix$prototype$loopPosition (i, j) {
  if (i < 0) {
    i -= Math.floor(i / this.height) * this.height
  } else if (i >= this.height) {
    i %= this.height
  }
  if (j < 0) {
    j -= Math.floor(j / this.width) * this.width
  } else if (j >= this.width) {
    j %= this.width
  }
  return {i: i, j: j}
}

/**
 * Returns the value of the given position.
 * @param i {number} the column index of the position
 * @param j {number} the row index of the position
 * @return {*} the value of the position
 */
LoopingMatrix.prototype.getCell = function LoopingMatrix$prototype$getCell (i, j) {
  var pos = this.loopPosition(i, j)
  return this.matrix[pos.i][pos.j]
}

/**
 * Set the value of the given position.
 * @param i {number} the column index of the position
 * @param j {number} the row index of the position
 * @param val {*} the value to set in the given position
 */
LoopingMatrix.prototype.setCell = function LoopingMatrix$prototype$setCell (i, j, val) {
  var pos = this.loopPosition(i, j)
  this.matrix[pos.i][pos.j] = val
}

/**
 * Copy a source matrix into this matrix starting at the given position of this matrix.
 * @param i {number} the column index of the start position
 * @param j {number} the row index of the start position
 */
LoopingMatrix.prototype.copyMatrixAt = function LoopingMatrix$prototype$copyMatrixAt (i, j, source) {
  for (var mi = 0; mi < source.length; ++mi) {
    var row = source[mi]
    for (var mj = 0; mj < row.length; ++mj) {
      this.setCell(i + mi, j + mj, row[mj])
    }
  }
}

/**
 * Makes a copy of this matrix.
 * @return {LoopingMatrix} the clone
 */
LoopingMatrix.prototype.clone = function LoopingMatrix$prototype$clone () {
  var copy = new this.constructor(0, 0)
  copy.width = this.width
  copy.height = this.height
  copy.matrix = new Array(copy.height)
  for (var i = 0; i < copy.height; ++i) {
    copy.matrix[i] = this.matrix[i].slice(0)
  }
  return copy
}

module.exports = LoopingMatrix


},{}],8:[function(require,module,exports){
/**
 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseFlatten = require('lodash._baseflatten');

/**
 * Flattens `array` a single level.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to flatten.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * _.flatten([1, [2, 3, [4]]]);
 * // => [1, 2, 3, [4]]
 */
function flatten(array) {
  var length = array ? array.length : 0;
  return length ? baseFlatten(array) : [];
}

module.exports = flatten;

},{"lodash._baseflatten":9}],9:[function(require,module,exports){
/**
 * lodash 4.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict, result) {
  result || (result = []);

  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    if (isArrayLikeObject(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, isDeep, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null &&
    !(typeof value == 'function' && isFunction(value)) && isLength(getLength(value));
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object, else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array constructors, and
  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is loosely based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = baseFlatten;

},{}],10:[function(require,module,exports){
/**
 * lodash 3.1.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991,
    NAN = 0 / 0;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeCeil = Math.ceil,
    nativeMax = Math.max;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * The base implementation of `_.range` and `_.rangeRight` which doesn't
 * coerce arguments to numbers.
 *
 * @private
 * @param {number} start The start of the range.
 * @param {number} end The end of the range.
 * @param {number} step The value to increment or decrement by.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Array} Returns the new array of numbers.
 */
function baseRange(start, end, step, fromRight) {
  var index = -1,
      length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
      result = Array(length);

  while (length--) {
    result[fromRight ? length : ++index] = start;
    start += step;
  }
  return result;
}

/**
 * Creates a `_.range` or `_.rangeRight` function.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new range function.
 */
function createRange(fromRight) {
  return function(start, end, step) {
    if (step && typeof step != 'number' && isIterateeCall(start, end, step)) {
      end = step = undefined;
    }
    // Ensure the sign of `-0` is preserved.
    start = toNumber(start);
    start = start === start ? start : 0;
    if (end === undefined) {
      end = start;
      start = 0;
    } else {
      end = toNumber(end) || 0;
    }
    step = step === undefined ? (start < end ? 1 : -1) : (toNumber(step) || 0);
    return baseRange(start, end, step, fromRight);
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    return eq(object[index], value);
  }
  return false;
}

/**
 * Performs a [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null &&
    !(typeof value == 'function' && isFunction(value)) && isLength(getLength(value));
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array constructors, and
  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is loosely based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3);
 * // => 3
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3');
 * // => 3
 */
function toNumber(value) {
  if (isObject(value)) {
    var other = isFunction(value.valueOf) ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

/**
 * Creates an array of numbers (positive and/or negative) progressing from
 * `start` up to, but not including, `end`. A step of `-1` is used if a negative
 * `start` is specified without an `end` or `step`. If `end` is not specified
 * it's set to `start` with `start` then set to `0`.
 *
 * **Note:** JavaScript follows the IEEE-754 standard for resolving
 * floating-point values which can produce unexpected results.
 *
 * @static
 * @memberOf _
 * @category Util
 * @param {number} [start=0] The start of the range.
 * @param {number} end The end of the range.
 * @param {number} [step=1] The value to increment or decrement by.
 * @returns {Array} Returns the new array of numbers.
 * @example
 *
 * _.range(4);
 * // => [0, 1, 2, 3]
 *
 * _.range(-4);
 * // => [0, -1, -2, -3]
 *
 * _.range(1, 5);
 * // => [1, 2, 3, 4]
 *
 * _.range(0, 20, 5);
 * // => [0, 5, 10, 15]
 *
 * _.range(0, -4, -1);
 * // => [0, -1, -2, -3]
 *
 * _.range(1, 4, 0);
 * // => [1, 1, 1]
 *
 * _.range(0);
 * // => []
 */
var range = createRange();

module.exports = range;

},{}],11:[function(require,module,exports){
(function(global,factory){if(typeof define === 'function' && define.amd){define(['exports','module','preact'],factory);}else if(typeof exports !== 'undefined' && typeof module !== 'undefined'){factory(exports,module,require('preact'));}else {var mod={exports:{}};factory(mod.exports,mod,global.preact);global.preactSvg = mod.exports;}})(this,function(exports,module,_preact){'use strict';var _extends=Object.assign || function(target){for(var i=1;i < arguments.length;i++) {var source=arguments[i];for(var key in source) {if(Object.prototype.hasOwnProperty.call(source,key)){target[key] = source[key];}}}return target;};function _objectWithoutProperties(obj,keys){var target={};for(var i in obj) {if(keys.indexOf(i) >= 0)continue;if(!Object.prototype.hasOwnProperty.call(obj,i))continue;target[i] = obj[i];}return target;}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError('Cannot call a class as a function');}}function _inherits(subClass,superClass){if(typeof superClass !== 'function' && superClass !== null){throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__ = superClass;}var DOM=typeof document !== 'undefined' && !!document.createElement;var PROP_TO_ATTR_MAP={'className':'class'};var updateMode=false;if(DOM){(function(){var div=document.createElement('div');var oldCreate=document.createElement;document.createElement = function(name){if(updateMode || name === 'svg'){var el=document.createElementNS('http://www.w3.org/2000/svg',name);for(var i in el) {if(!(i in div) || PROP_TO_ATTR_MAP.hasOwnProperty(i)){try{Object.defineProperty(el,i,contentPropertyDef(i));}catch(e) {}}}return el;}return oldCreate.call(document,name);};})();}var memoize=function memoize(fn){var mem=arguments.length <= 1 || arguments[1] === undefined?{}:arguments[1];return function(k){return mem.hasOwnProperty(k)?mem[k]:mem[k] = fn(k);};};var contentPropertyDef=memoize(function(prop){var attr=arguments.length <= 1 || arguments[1] === undefined?PROP_TO_ATTR_MAP[prop] || prop:arguments[1];return (function(){return {set:function set(v){if(v === null || v === undefined)this.removeAttribute(attr);else this.setAttribute(attr,v);},get:function get(){return this.getAttribute(attr);}};})();});var SVG=(function(_Component){_inherits(SVG,_Component);function SVG(){_classCallCheck(this,SVG);_Component.apply(this,arguments);}SVG.prototype.componentWillUpdate = function componentWillUpdate(){updateMode = true;};SVG.prototype.componentDidUpdate = function componentDidUpdate(){updateMode = false;};SVG.prototype.render = function render(_ref){var children=_ref.children;var props=_objectWithoutProperties(_ref,['children']);if(!this.hasRendered){this.hasRendered = updateMode = true;this.setState({},this.componentDidUpdate);}return _preact.h('svg',_extends({version:'1.1',xmlns:'http://www.w3.org/2000/svg'},props),children);};return SVG;})(_preact.Component);module.exports = SVG;});


},{"preact":12}],12:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.preact = factory());
}(this, function () { 'use strict';

  var NO_RENDER = { render: false };
  var SYNC_RENDER = { renderSync: true };
  var DOM_RENDER = { build: true };

  var EMPTY = {};
  var EMPTY_BASE = '';

  // is this a DOM environment
  var HAS_DOM = typeof document !== 'undefined';
  var TEXT_CONTENT = !HAS_DOM || 'textContent' in document ? 'textContent' : 'nodeValue';

  var ATTR_KEY = '__preactattr_';

  // DOM properties that should NOT have "px" added when numeric
  var NON_DIMENSION_PROPS = {
  	boxFlex: 1, boxFlexGroup: 1, columnCount: 1, fillOpacity: 1, flex: 1, flexGrow: 1,
  	flexPositive: 1, flexShrink: 1, flexNegative: 1, fontWeight: 1, lineClamp: 1, lineHeight: 1,
  	opacity: 1, order: 1, orphans: 1, strokeOpacity: 1, widows: 1, zIndex: 1, zoom: 1
  };

  /** Copy own-properties from `props` onto `obj`.
   *	@returns obj
   *	@private
   */

  function extend(obj, props) {
  	for (var i in props) {
  		if (hasOwnProperty.call(props, i)) {
  			obj[i] = props[i];
  		}
  	}return obj;
  }

  /** Create a caching wrapper for the given function.
   *	@private
   */

  function memoize(fn, mem) {
  	mem = mem || {};
  	return function (k) {
  		return hasOwnProperty.call(mem, k) ? mem[k] : mem[k] = fn(k);
  	};
  }

  /** Get a deep property value from the given object, expressed in dot-notation.
   *	@private
   */

  function delve(obj, key) {
  	for (var p = key.split('.'), i = 0; i < p.length && obj; i++) {
  		obj = obj[p];
  	}
  	return obj;
  }

  /** Convert an Array-like object to an Array
   *	@private
   */

  function toArray(obj) {
  	var arr = [],
  	    i = obj.length;
  	while (i--) arr[i] = obj[i];
  	return arr;
  }

  /** @private is the given object a Function? */
  var isFunction = function isFunction(obj) {
  	return 'function' === typeof obj;
  };

  /** @private is the given object a String? */
  var isString = function isString(obj) {
  	return 'string' === typeof obj;
  };

  /** @private Safe reference to builtin hasOwnProperty */
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  /** Check if a value is `null` or `undefined`.
   *	@private
   */
  var empty = function empty(x) {
  	return x === null || x === undefined;
  };

  /** Convert a hashmap of styles to CSSText
   *	@private
   */

  function styleObjToCss(s) {
  	var str = '';
  	for (var prop in s) {
  		if (hasOwnProperty.call(s, prop)) {
  			var val = s[prop];
  			str += jsToCss(prop);
  			str += ': ';
  			str += val;
  			if (typeof val === 'number' && !NON_DIMENSION_PROPS[prop]) {
  				str += 'px';
  			}
  			str += '; ';
  		}
  	}
  	return str;
  }

  /** Convert a hashmap of CSS classes to a space-delimited className string
   *	@private
   */

  function hashToClassName(c) {
  	var str = '';
  	for (var prop in c) {
  		if (c[prop]) {
  			if (str) str += ' ';
  			str += prop;
  		}
  	}
  	return str;
  }

  /** Convert a JavaScript camel-case CSS property name to a CSS property name
   *	@private
   *	@function
   */
  var jsToCss = memoize(function (s) {
  	return s.replace(/([A-Z])/, '-$1').toLowerCase();
  });

  /** Global options
   *	@public
   *	@namespace options {Object}
   */
  var options = {

  	/** If `true`, `prop` changes trigger synchronous component updates.
    *	@boolean
    */
  	syncComponentUpdates: true,

  	/** Processes all created VNodes.
    *	@param {VNode} vnode	A newly-created VNode to normalize/process
    *	@protected
    */
  	vnode: function vnode(n) {
  		var attrs = n.attributes;
  		if (!attrs || isFunction(n.nodeName)) return;

  		// normalize className to class.
  		var p = attrs.className;
  		if (p) attrs['class'] = p;
  		delete attrs.className;

  		normalize(attrs, 'class', hashToClassName);
  		normalize(attrs, 'style', styleObjToCss);
  	}
  };

  function normalize(obj, prop, fn) {
  	var v = obj[prop];
  	if (v && !isString(v)) {
  		obj[prop] = fn(v);
  	}
  }

  function VNode(nodeName, attributes, children) {
  	/** @type {string|function} */
  	this.nodeName = nodeName;

  	/** @type {object<string>|undefined} */
  	this.attributes = attributes;

  	/** @type {array<VNode>|undefined} */
  	this.children = children;
  }

  /** Invoke a "hook" method with arguments if it exists.
   *	@private
   */

  function hook(obj, name) {
  	var fn = obj[name];

  	for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
  		args[_key - 2] = arguments[_key];
  	}

  	if (fn && isFunction(fn)) return fn.apply(obj, args);
  }

  /** Invoke hook() on a component and child components (recursively)
   *	@private
   */

  function deepHook(obj) {
  	for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
  		args[_key2 - 1] = arguments[_key2];
  	}

  	do {
  		hook.apply(undefined, [obj].concat(args));
  	} while (obj = obj._component);
  }

  var SHARED_TEMP_ARRAY = [];

  /** JSX/hyperscript reviver
   *	@see http://jasonformat.com/wtf-is-jsx
   *	@public
   *  @example
   *  /** @jsx h *\/
   *  import { render, h } from 'preact';
   *  render(<span>foo</span>, document.body);
   */
  function h(nodeName, attributes) {
  	var len = arguments.length,
  	    children = undefined,
  	    arr = undefined,
  	    lastSimple = undefined;

  	if (len > 2) {
  		children = [];
  		for (var i = 2; i < len; i++) {
  			var _p = arguments[i];
  			if (empty(_p)) continue;
  			if (_p.join) {
  				arr = _p;
  			} else {
  				arr = SHARED_TEMP_ARRAY;
  				arr[0] = _p;
  			}
  			for (var j = 0; j < arr.length; j++) {
  				var child = arr[j],
  				    simple = !empty(child) && !(child instanceof VNode);
  				if (simple) child = String(child);
  				if (simple && lastSimple) {
  					children[children.length - 1] += child;
  				} else if (!empty(child)) {
  					children.push(child);
  				}
  				lastSimple = simple;
  			}
  		}
  	}

  	if (attributes && attributes.children) {
  		delete attributes.children;
  	}

  	var p = new VNode(nodeName, attributes || undefined, children || undefined);
  	hook(options, 'vnode', p);
  	return p;
  }

  /** Create an Event handler function that sets a given state property.
   *	@param {Component} component	The component whose state should be updated
   *	@param {string} key				A dot-notated key path to update in the component's state
   *	@param {string} eventPath		A dot-notated key path to the value that should be retrieved from the Event or component
   *	@returns {function} linkedStateHandler
   *	@private
   */

  function createLinkedState(component, key, eventPath) {
  	var path = key.split('.'),
  	    p0 = path[0],
  	    len = path.length;
  	return function (e) {
  		var _component$setState;

  		var t = this,
  		    s = component.state,
  		    obj = s,
  		    v = undefined,
  		    i = undefined;
  		if (isString(eventPath)) {
  			v = delve(e, eventPath);
  			if (empty(v) && (t = t._component)) {
  				v = delve(t, eventPath);
  			}
  		} else {
  			v = (t.nodeName + t.type).match(/^input(checkbox|radio)$/i) ? t.checked : t.value;
  		}
  		if (isFunction(v)) v = v.call(t);
  		if (len > 1) {
  			for (i = 0; i < len - 1; i++) {
  				obj = obj[path[i]] || (obj[path[i]] = {});
  			}
  			obj[path[i]] = v;
  			v = s[p0];
  		}
  		component.setState((_component$setState = {}, _component$setState[p0] = v, _component$setState));
  	};
  }

  var items = [];
  var itemsOffline = [];
  function enqueueRender(component) {
  	if (items.push(component) !== 1) return;

  	var d = options.debounceRendering;
  	if (d) d(rerender);else setTimeout(rerender, 0);
  }

  function rerender() {
  	var currentItems = items,
  	    len = currentItems.length;
  	if (!len) return;
  	items = itemsOffline;
  	items.length = 0;
  	itemsOffline = currentItems;
  	while (len--) {
  		if (currentItems[len]._dirty) {
  			renderComponent(currentItems[len]);
  		}
  	}
  }

  /** Check if a VNode is a reference to a stateless functional component.
   *	A function component is represented as a VNode whose `nodeName` property is a reference to a function.
   *	If that function is not a Component (ie, has no `.render()` method on a prototype), it is considered a stateless functional component.
   *	@param {VNode} vnode	A VNode
   *	@private
   */

  function isFunctionalComponent(_ref) {
    var nodeName = _ref.nodeName;

    return isFunction(nodeName) && !nodeName.prototype.render;
  }

  /** Construct a resultant VNode from a VNode referencing a stateless functional component.
   *	@param {VNode} vnode	A VNode with a `nodeName` property that is a reference to a function.
   *	@private
   */

  function buildFunctionalComponent(vnode, context) {
    return vnode.nodeName(getNodeProps(vnode), context) || EMPTY_BASE;
  }

  /** Check if two nodes are equivalent.
   *	@param {Element} node
   *	@param {VNode} vnode
   *	@private
   */

  function isSameNodeType(node, vnode) {
  	if (node.nodeType === 3) return isString(vnode);
  	if (isFunctionalComponent(vnode)) return true;
  	var nodeName = vnode.nodeName;
  	if (isFunction(nodeName)) return node._componentConstructor === nodeName;
  	return node.nodeName.toLowerCase() === nodeName;
  }

  /** Reconstruct Component-style `props` from a VNode
   *	@todo: determine if it would be acceptible to drop the extend() clone here for speed
   *	@private
   */

  function getNodeProps(vnode) {
  	var props = extend({}, vnode.attributes);
  	if (vnode.children) {
  		props.children = vnode.children;
  	}
  	return props;
  }

  function ensureNodeData(node) {
  	return node[ATTR_KEY] || (node[ATTR_KEY] = {});
  }

  /** Append multiple children to a Node.
   *	Uses a Document Fragment to batch when appending 2 or more children
   *	@private
   */

  function appendChildren(parent, children) {
  	var len = children.length;
  	if (len <= 2) {
  		parent.appendChild(children[0]);
  		if (len === 2) parent.appendChild(children[1]);
  		return;
  	}

  	var frag = document.createDocumentFragment();
  	for (var i = 0; i < len; i++) {
  		frag.appendChild(children[i]);
  	}parent.appendChild(frag);
  }

  /** Retrieve the value of a rendered attribute
   *	@private
   */

  function getAccessor(node, name, value, cache) {
  	if (name !== 'type' && name in node) return node[name];
  	if (name === 'class') return node.className;
  	if (name === 'style') return node.style.cssText;
  	var attrs = node[ATTR_KEY];
  	if (cache !== false && attrs && hasOwnProperty.call(attrs, name)) return attrs[name];
  	return value;
  }

  /** Set a named attribute on the given Node, with special behavior for some names and event handlers.
   *	If `value` is `null`, the attribute/handler will be removed.
   *	@param {Element} node	An element to mutate
   *	@param {string} name	The name/key to set, such as an event or attribute name
   *	@param {any} value		An attribute value, such as a function to be used as an event handler
   *	@param {any} previousValue	The last value that was set for this name/node pair
   *	@private
   */

  function setAccessor(node, name, value) {
  	if (name === 'class') {
  		node.className = value;
  	} else if (name === 'style') {
  		node.style.cssText = value;
  	} else if (name === 'dangerouslySetInnerHTML') {
  		node.innerHTML = value.__html;
  	} else if (name in node && name !== 'type') {
  		node[name] = value;
  	} else {
  		setComplexAccessor(node, name, value);
  	}

  	ensureNodeData(node)[name] = getAccessor(node, name, value, false);
  }

  /** For props without explicit behavior, apply to a Node as event handlers or attributes.
   *	@private
   */
  function setComplexAccessor(node, name, value) {
  	if (name.substring(0, 2) === 'on') {
  		var _type = normalizeEventName(name),
  		    l = node._listeners || (node._listeners = {}),
  		    fn = !l[_type] ? 'add' : !value ? 'remove' : null;
  		if (fn) node[fn + 'EventListener'](_type, eventProxy);
  		l[_type] = value;
  		return;
  	}

  	var type = typeof value;
  	if (value === null) {
  		node.removeAttribute(name);
  	} else if (type !== 'function' && type !== 'object') {
  		node.setAttribute(name, value);
  	}
  }

  /** Proxy an event to hooked event handlers
   *	@private
   */
  function eventProxy(e) {
  	var fn = this._listeners[normalizeEventName(e.type)];
  	if (fn) return fn.call(this, hook(options, 'event', e) || e);
  }

  /** Convert an Event name/type to lowercase and strip any "on*" prefix.
   *	@function
   *	@private
   */
  var normalizeEventName = memoize(function (t) {
  	return t.replace(/^on/i, '').toLowerCase();
  });

  /** Get a hashmap of node properties, preferring preact's cached property values over the DOM's
   *	@private
   */

  function getNodeAttributes(node) {
  	return node[ATTR_KEY] || getRawNodeAttributes(node) || EMPTY;
  	// let list = getRawNodeAttributes(node),
  	// 	l = node[ATTR_KEY];
  	// return l && list ? extend(list, l) : (l || list || EMPTY);
  }

  /** Get a node's attributes as a hashmap, regardless of type.
   *	@private
   */
  function getRawNodeAttributes(node) {
  	var list = node.attributes;
  	if (!list || !list.getNamedItem) return list;
  	if (list.length) return getAttributesAsObject(list);
  }

  /** Convert a DOM `.attributes` NamedNodeMap to a hashmap.
   *	@private
   */
  function getAttributesAsObject(list) {
  	var attrs = undefined;
  	for (var i = list.length; i--;) {
  		var item = list[i];
  		if (!attrs) attrs = {};
  		attrs[item.name] = item.value;
  	}
  	return attrs;
  }

  var components = {};

  function collectComponent(component) {
  	var name = component.constructor.name,
  	    list = components[name];
  	if (list) list.push(component);else components[name] = [component];
  }

  function createComponent(ctor, props, context) {
  	var list = components[ctor.name];
  	if (list && list.length) {
  		for (var i = list.length; i--;) {
  			if (list[i].constructor === ctor) {
  				return list.splice(i, 1)[0];
  			}
  		}
  	}
  	return new ctor(props, context);
  }

  /** DOM node pool, keyed on nodeName. */

  var nodes = {};

  var normalizeName = memoize(function (name) {
  	return name.toUpperCase();
  });

  function collectNode(node) {
  	cleanNode(node);
  	var name = normalizeName(node.nodeName),
  	    list = nodes[name];
  	if (list) list.push(node);else nodes[name] = [node];
  }

  function createNode(nodeName) {
  	var name = normalizeName(nodeName),
  	    list = nodes[name],
  	    node = list && list.pop() || document.createElement(nodeName);
  	ensureNodeData(node);
  	return node;
  }

  function cleanNode(node) {
  	if (node.parentNode) node.parentNode.removeChild(node);

  	if (node.nodeType === 3) return;

  	var attrs = node[ATTR_KEY];
  	for (var i in attrs) {
  		if (hasOwnProperty.call(attrs, i)) {
  			setAccessor(node, i, null, attrs[i]);
  		}
  	}

  	node[ATTR_KEY] = node._component = node._componentConstructor = null;

  	// if (node.childNodes.length>0) {
  	// 	console.warn(`Warning: Recycler collecting <${node.nodeName}> with ${node.childNodes.length} children.`);
  	// 	toArray(node.childNodes).forEach(recycler.collect);
  	// }
  }

  /** Apply differences in a given vnode (and it's deep children) to a real DOM Node.
   *	@param {Element} [dom=null]		A DOM node to mutate into the shape of the `vnode`
   *	@param {VNode} vnode			A VNode (with descendants forming a tree) representing the desired DOM structure
   *	@returns {Element} dom			The created/mutated element
   *	@private
   */
  function build(dom, vnode, context) {
  	var out = dom,
  	    nodeName = vnode.nodeName;

  	if (isFunction(nodeName) && !nodeName.prototype.render) {
  		vnode = buildFunctionalComponent(vnode, context);
  		nodeName = vnode.nodeName;
  	}

  	if (isFunction(nodeName)) {
  		return buildComponentFromVNode(dom, vnode, context);
  	}

  	if (isString(vnode)) {
  		if (dom) {
  			if (dom.nodeType === 3) {
  				dom[TEXT_CONTENT] = vnode;
  				return dom;
  			} else if (dom.nodeType === 1) {
  				collectNode(dom);
  			}
  		}
  		return document.createTextNode(vnode);
  	}

  	if (empty(nodeName)) {
  		nodeName = 'x-undefined-element';
  	}

  	if (!dom) {
  		out = createNode(nodeName);
  	} else if (dom.nodeName.toLowerCase() !== nodeName) {
  		out = createNode(nodeName);
  		appendChildren(out, toArray(dom.childNodes));
  		// reclaim element nodes
  		if (dom.nodeType === 1) collectNode(dom);
  	}

  	// apply attributes
  	var old = getNodeAttributes(out) || EMPTY,
  	    attrs = vnode.attributes || EMPTY;

  	// removed attributes
  	if (old !== EMPTY) {
  		for (var _name in old) {
  			if (hasOwnProperty.call(old, _name)) {
  				var o = attrs[_name];
  				if (empty(o)) {
  					setAccessor(out, _name, null, old[_name]);
  				}
  			}
  		}
  	}

  	// grab children prior to setting attributes to ignore children added via dangerouslySetInnerHTML
  	var children = toArray(out.childNodes);

  	// new & updated attributes
  	if (attrs !== EMPTY) {
  		for (var _name2 in attrs) {
  			if (hasOwnProperty.call(attrs, _name2)) {
  				var value = attrs[_name2];
  				if (!empty(value)) {
  					var prev = getAccessor(out, _name2, old[_name2]);
  					if (value != prev) {
  						setAccessor(out, _name2, value, prev);
  					}
  				}
  			}
  		}
  	}

  	var keyed = {};
  	for (var i = children.length; i--;) {
  		var t = children[i].nodeType;
  		var key = undefined;
  		if (t === 3) {
  			key = t.key;
  		} else if (t === 1) {
  			key = children[i].getAttribute('key');
  		} else {
  			continue;
  		}
  		if (key) keyed[key] = children.splice(i, 1)[0];
  	}
  	var newChildren = [];

  	if (vnode.children) {
  		for (var i = 0, vlen = vnode.children.length; i < vlen; i++) {
  			var vchild = vnode.children[i];
  			// if (isFunctionalComponent(vchild)) {
  			// 	vchild = buildFunctionalComponent(vchild);
  			// }
  			var _attrs = vchild.attributes,
  			    key = undefined,
  			    child = undefined;
  			if (_attrs) {
  				key = _attrs.key;
  				child = key && keyed[key];
  			}

  			// attempt to pluck a node of the same type from the existing children
  			if (!child) {
  				var len = children.length;
  				if (children.length) {
  					for (var j = 0; j < len; j++) {
  						if (isSameNodeType(children[j], vchild)) {
  							child = children.splice(j, 1)[0];
  							break;
  						}
  					}
  				}
  			}

  			// morph the matched/found/created DOM child to match vchild (deep)
  			newChildren.push(build(child, vchild, context));
  		}
  	}

  	// apply the constructed/enhanced ordered list to the parent
  	for (var i = 0, len = newChildren.length; i < len; i++) {
  		// we're intentionally re-referencing out.childNodes here as it is a live NodeList
  		if (out.childNodes[i] !== newChildren[i]) {
  			var child = newChildren[i],
  			    c = child._component,
  			    next = out.childNodes[i + 1];
  			if (c) deepHook(c, 'componentWillMount');
  			if (next) {
  				out.insertBefore(child, next);
  			} else {
  				out.appendChild(child);
  			}
  			if (c) deepHook(c, 'componentDidMount');
  		}
  	}

  	// remove orphaned children
  	for (var i = 0, len = children.length; i < len; i++) {
  		var child = children[i],
  		    c = child._component,
  		    p = child.parentNode;
  		if (c) hook(c, 'componentWillUnmount');
  		if (p) p.removeChild(child);
  		if (c) {
  			hook(c, 'componentDidUnmount');
  			collectComponent(c);
  		} else if (child.nodeType === 1) {
  			collectNode(child);
  		}
  	}

  	return out;
  }

  /** Mark component as dirty and queue up a render.
   *	@param {Component} component
   *	@private
   */

  function triggerComponentRender(component) {
  	if (!component._dirty) {
  		component._dirty = true;
  		enqueueRender(component);
  	}
  }

  /** Set a component's `props` (generally derived from JSX attributes).
   *	@param {Object} props
   *	@param {Object} [opts]
   *	@param {boolean} [opts.renderSync=false]	If `true` and {@link options.syncComponentUpdates} is `true`, triggers synchronous rendering.
   *	@param {boolean} [opts.render=true]			If `false`, no render will be triggered.
   */

  function setComponentProps(component, props, opts, context) {
  	var d = component._disableRendering;
  	component._disableRendering = true;

  	opts = opts || EMPTY;

  	if (context) {
  		if (!component.prevContext) component.prevContext = extend({}, component.context);
  		component.context = context;
  	}

  	hook(component, 'componentWillReceiveProps', props, component.context);

  	if (!component.prevProps) component.prevProps = extend({}, component.props);
  	component.props = props;

  	component._disableRendering = d;

  	if (opts.render !== false) {
  		if (opts.renderSync || options.syncComponentUpdates) {
  			renderComponent(component);
  		} else {
  			triggerComponentRender(component);
  		}
  	}
  }

  /** Render a Component, triggering necessary lifecycle events and taking High-Order Components into account.
   *	@param {Component} component
   *	@param {Object} [opts]
   *	@param {boolean} [opts.build=false]		If `true`, component will build and store a DOM node if not already associated with one.
   *	@private
   */

  function renderComponent(component, opts) {
  	if (component._disableRendering) return;

  	var skip = undefined,
  	    rendered = undefined,
  	    props = component.props,
  	    state = component.state,
  	    context = component.context,
  	    previousProps = component.prevProps || props,
  	    previousState = component.prevState || state,
  	    previousContext = component.prevContext || context,
  	    isUpdate = component.base;

  	if (isUpdate) {
  		component.props = previousProps;
  		component.state = previousState;
  		component.context = previousContext;
  		if (hook(component, 'shouldComponentUpdate', props, state, context) === false) {
  			skip = true;
  		} else {
  			hook(component, 'componentWillUpdate', props, state, context);
  		}
  		component.props = props;
  		component.state = state;
  		component.context = context;
  	}

  	component.prevProps = component.prevState = component.prevContext = null;
  	component._dirty = false;

  	if (!skip) {
  		rendered = hook(component, 'render', props, state, context);

  		var childComponent = rendered && rendered.nodeName,
  		    childContext = component.getChildContext ? component.getChildContext() : context,
  		    base = undefined;

  		if (isFunction(childComponent) && childComponent.prototype.render) {
  			// set up high order component link

  			var inst = component._component;
  			if (inst && inst.constructor !== childComponent) {
  				unmountComponent(inst.base, inst, false);
  				inst = null;
  			}

  			var childProps = getNodeProps(rendered);

  			if (inst) {
  				setComponentProps(inst, childProps, SYNC_RENDER, childContext);
  			} else {
  				inst = createComponent(childComponent, childProps, childContext);
  				inst._parentComponent = component;
  				component._component = inst;
  				if (component.base) deepHook(inst, 'componentWillMount');
  				setComponentProps(inst, childProps, NO_RENDER, childContext);
  				renderComponent(inst, DOM_RENDER);
  				if (component.base) deepHook(inst, 'componentDidMount');
  			}

  			base = inst.base;
  		} else {
  			// destroy high order component link
  			if (component._component) {
  				unmountComponent(component.base, component._component);
  			}
  			component._component = null;

  			if (component.base || opts && opts.build) {
  				base = build(component.base, rendered || EMPTY_BASE, childContext);
  			}
  		}

  		if (component.base && base !== component.base) {
  			var p = component.base.parentNode;
  			if (p) p.replaceChild(base, component.base);
  		}

  		component.base = base;
  		if (base) {
  			base._component = component;
  			base._componentConstructor = component.constructor;
  		}

  		if (isUpdate) {
  			hook(component, 'componentDidUpdate', previousProps, previousState, previousContext);
  		}
  	}

  	var cb = component._renderCallbacks;
  	if (cb) {
  		for (var i = cb.length; i--;) {
  			cb[i]();
  		}cb.length = 0;
  	}

  	return rendered;
  }

  /** Apply the Component referenced by a VNode to the DOM.
   *	@param {Element} dom	The DOM node to mutate
   *	@param {VNode} vnode	A Component-referencing VNode
   *	@returns {Element} dom	The created/mutated element
   *	@private
   */

  function buildComponentFromVNode(dom, vnode, context) {
  	var c = dom && dom._component;

  	if (isFunctionalComponent(vnode)) {
  		var p = build(dom, buildFunctionalComponent(vnode, context), context);
  		p._componentConstructor = vnode.nodeName;
  		return p;
  	}

  	var isOwner = c && dom._componentConstructor === vnode.nodeName;
  	while (c && !isOwner && (c = c._parentComponent)) {
  		isOwner = c.constructor === vnode.nodeName;
  	}

  	if (isOwner) {
  		setComponentProps(c, getNodeProps(vnode), SYNC_RENDER, context);
  	} else {
  		if (c) {
  			unmountComponent(dom, c);
  			dom = null;
  		}
  		dom = createComponentFromVNode(vnode, dom, context);
  	}

  	return dom;
  }

  /** Instantiate and render a Component, given a VNode whose nodeName is a constructor.
   *	@param {VNode} vnode
   *	@private
   */
  function createComponentFromVNode(vnode, dom, context) {
  	var props = getNodeProps(vnode);
  	var component = createComponent(vnode.nodeName, props, context);
  	if (dom) component.base = dom;
  	setComponentProps(component, props, NO_RENDER, context);
  	renderComponent(component, DOM_RENDER);

  	// let node = component.base;
  	//if (!node._component) {
  	//	node._component = component;
  	//	node._componentConstructor = vnode.nodeName;
  	//}

  	return component.base;
  }

  /** Remove a component from the DOM and recycle it.
   *	@param {Element} dom			A DOM node from which to unmount the given Component
   *	@param {Component} component	The Component instance to unmount
   *	@private
   */
  function unmountComponent(dom, component, remove) {
  	// console.warn('unmounting mismatched component', component);

  	hook(component, 'componentWillUnmount');
  	if (remove !== false) {
  		if (dom._component === component) {
  			delete dom._component;
  			delete dom._componentConstructor;
  		}
  		var base = component.base;
  		if (base && base.parentNode) {
  			base.parentNode.removeChild(base);
  		}
  	}
  	component._parentComponent = null;
  	hook(component, 'componentDidUnmount');
  	collectComponent(component);
  }

  /** Base Component class, for he ES6 Class method of creating Components
   *	@public
   *
   *	@example
   *	class MyFoo extends Component {
   *		render(props, state) {
   *			return <div />;
   *		}
   *	}
   */
  function Component(props, context) {
  	/** @private */
  	this._dirty = this._disableRendering = false;
  	/** @private */
  	this._linkedStates = {};
  	/** @private */
  	this._renderCallbacks = [];
  	/** @public */
  	this.prevState = this.prevProps = this.prevContext = this.base = null;
  	/** @public */
  	this.context = context || null;
  	/** @type {object} */
  	this.props = props || hook(this, 'getDefaultProps') || {};
  	/** @type {object} */
  	this.state = hook(this, 'getInitialState') || {};
  }

  extend(Component.prototype, {

  	/** Returns a `boolean` value indicating if the component should re-render when receiving the given `props` and `state`.
    *	@param {object} nextProps
    *	@param {object} nextState
    *	@param {object} nextContext
    *	@returns {Boolean} should the component re-render
    *	@name shouldComponentUpdate
    *	@function
    */
  	// shouldComponentUpdate() {
  	// 	return true;
  	// },

  	/** Returns a function that sets a state property when called.
    *	Calling linkState() repeatedly with the same arguments returns a cached link function.
    *
    *	Provides some built-in special cases:
    *		- Checkboxes and radio buttons link their boolean `checked` value
    *		- Inputs automatically link their `value` property
    *		- Event paths fall back to any associated Component if not found on an element
    *		- If linked value is a function, will invoke it and use the result
    *
    *	@param {string} key				The path to set - can be a dot-notated deep key
    *	@param {string} [eventPath]		If set, attempts to find the new state value at a given dot-notated path within the object passed to the linkedState setter.
    *	@returns {function} linkStateSetter(e)
    *
    *	@example Update a "text" state value when an input changes:
    *		<input onChange={ this.linkState('text') } />
    *
    *	@example Set a deep state value on click
    *		<button onClick={ this.linkState('touch.coords', 'touches.0') }>Tap</button
    */
  	linkState: function linkState(key, eventPath) {
  		var c = this._linkedStates,
  		    cacheKey = key + '|' + (eventPath || '');
  		return c[cacheKey] || (c[cacheKey] = createLinkedState(this, key, eventPath));
  	},

  	/** Update component state by copying properties from `state` to `this.state`.
    *	@param {object} state		A hash of state properties to update with new values
    */
  	setState: function setState(state, callback) {
  		var s = this.state;
  		if (!this.prevState) this.prevState = extend({}, s);
  		extend(s, isFunction(state) ? state(s, this.props) : state);
  		if (callback) this._renderCallbacks.push(callback);
  		triggerComponentRender(this);
  	},

  	/** @private */
  	setProps: function setProps(props, opts) {
  		return setComponentProps(this, props, opts);
  	},

  	/** Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
    *	Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
    *	@param {object} props		Props (eg: JSX attributes) received from parent element/component
    *	@param {object} state		The component's current state
    *	@returns VNode
    */
  	render: function render() {
  		// return h('div', null, props.children);
  		return null;
  	}

  });

  /** Render JSX into a `parent` Element.
   *	@param {VNode} vnode		A (JSX) VNode to render
   *	@param {Element} parent		DOM element to render into
   *	@param {Element} [merge]	Attempt to re-use an existing DOM tree rooted at `merge`
   *	@public
   *
   *	@example
   *	// render a div into <body>:
   *	render(<div id="hello">hello!</div>, document.body);
   *
   *	@example
   *	// render a "Thing" component into #foo:
   *	const Thing = ({ name }) => <span>{ name }</span>;
   *	render(<Thing name="one" />, document.querySelector('#foo'));
   */
  function render(vnode, parent, merge) {
    var existing = merge && merge._component && merge._componentConstructor === vnode.nodeName,
        built = build(merge, vnode),
        c = !existing && built._component;

    if (c) deepHook(c, 'componentWillMount');

    if (built.parentNode !== parent) {
      parent.appendChild(built);
    }

    if (c) deepHook(c, 'componentDidMount');

    return built;
  }

  var preact = {
  	h: h,
  	Component: Component,
  	render: render,
  	rerender: rerender,
  	options: options,
  	hooks: options
  };

  return preact;

}));

},{}],13:[function(require,module,exports){
'use strict';

var _gameOfLifeLogic = require('game-of-life-logic');

var _gameOfLifeLogic2 = _interopRequireDefault(_gameOfLifeLogic);

var _lodash = require('lodash.flatten');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.range');

var _lodash4 = _interopRequireDefault(_lodash3);

var _preact = require('preact');

var _preactSvg = require('preact-svg');

var _preactSvg2 = _interopRequireDefault(_preactSvg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Domain
var createBuffer = function createBuffer(x, y) {
  var rate = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];
  return (0, _lodash4.default)(y).map(function (_) {
    return (0, _lodash4.default)(x).map(function (_) {
      return Math.random() < rate ? 1 : 0;
    });
  });
}; /** @jsx h */


var createGameOfLife = function createGameOfLife(x, y) {
  var rate = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

  var gol = new _gameOfLifeLogic2.default(x, y);
  var buf = createBuffer(x, y, rate);
  gol.copyMatrixAt(0, 0, buf);
  return gol;
};

// Component
function GameOfLifeComponent(_ref) {
  var matrix = _ref.matrix;
  var size = _ref.size;

  return (0, _preact.h)(
    _preactSvg2.default,
    { width: '640', height: '480' },
    (0, _lodash2.default)(matrix.map(function (row, y) {
      return row.map(function (val, x) {
        return (0, _preact.h)('rect', {
          x: x * size,
          y: y * size,
          width: size,
          height: size,
          style: { fill: val ? "#000" : "#fff" }
        });
      });
    }))
  );
}

// Controller
var SIZE_X = 30;
var SIZE_Y = 10;
var INITIAL_ACTIVE_RATE = 0.3;

var gol = createGameOfLife(SIZE_X, SIZE_Y, INITIAL_ACTIVE_RATE);

var startApp = function startApp(el) {
  (function _update() {
    (0, _preact.render)((0, _preact.h)(GameOfLifeComponent, { matrix: gol.matrix, size: 15 }), el, el.lastChild);
    gol.tick();
    setTimeout(_update, 1000);
  })();
};

window.addEventListener("DOMContentLoaded", function () {
  var el = document.querySelector(".main");
  startApp(el);
});

},{"game-of-life-logic":5,"lodash.flatten":8,"lodash.range":10,"preact":12,"preact-svg":11}]},{},[13]);
