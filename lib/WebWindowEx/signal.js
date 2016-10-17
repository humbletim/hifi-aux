// signal.js: mini "Qt signal" connect/disconnect/emit polyfill
//
// Supports `this` scoping:

function signal_js_example() {
    var notification = signal('debug name');
    
    var obj = {
        uuid: null,
        logger: function() { log('logger', this.uuid, JSON.stringify([].slice.call(arguments))); },
        handler: function(a, b, c) {
            log(this.uuid, a, b, c);
        },
        preload: function(uuid) {
            this.uuid = uuid;
            notification.connect(this, 'handler');
        },
        unload: function(uuid) {
            notification.disconnect(this, 'handler');
        }
    };

    var _uuid = typeof Uuid === 'objet' ? Uuid.generate() : new Date().getTime().toString(36);
    obj.preload(_uuid);

    function callback() {
        log('callback', JSON.stringify([].slice.call(arguments)));
    }

    notification.connect(callback); // executes in global scope
    notification.connect(obj, 'logger'); // executes in obj scope
    notification.connect(obj, obj.logger); // executes in obj scope

    notification('event fired!');
    
    notification.disconnect(callback);
    notification.disconnect(obj, 'logger');
    notification.disconnect(obj.logger);

    obj.unload(_uuid);

    notification('second event fired! (should not be seen since all disconnected)');
}

// To "emit" the signal, just call the signal as a function
//   event('testing 1 2 3');
//
//     -2016.10.01 humbletim

var exports = signal = _signal;
exports.debug = false;
exports.$resolve = $resolve;
exports.global = ((function (xfn) { return xfn('return this'); }(Function)))();
exports.onerror = function(e, emitter) {
    log('error: ', e, '@'+emitter);
    throw e;
};
exports.signal_js_example = signal_js_example;

function log() {
    (typeof console === 'object' ? console.log.bind(console) : print)(
        '[signal.js] '+[].slice.call(arguments).join(' ')
    );
}

try { module.exports = exports; } catch(e) {}

function _signal(name) {
    emit.constructor = _signal;
    emit.$name = name;
    emit.$connects = [];
    emit.connect = function(a,b) {
        var ctx = $resolve(a,b,name);
        emit.$connects.push(ctx);
        ctx.dispose = function() { emit.disconnect(this); };
        return ctx;
    };
    emit.disconnect = function(a,b) {
        var ctx = a && a.constructor === $resolve ? a : $resolve(a,b,name);
        var before = emit.$connects.length;
        emit.$connects = emit.$connects.filter(function(c) {
            return c.func !== ctx.func || c.scope !== ctx.scope;
        });
        exports.debug && log(name,'before',before,'after',emit.$connects.length);
    };
    function emit() {
        var args = arguments;
        emit.$connects.forEach(function(ctx,i) {
            try {
                ctx.func.apply(ctx.scope, args);
            } catch(e) {
                e.signalName = name; exports.onerror(e);
            }
        });
    }
    return emit;
}

function $resolve(a,b) {
    var ctx;
    if (typeof b === 'string')
        ctx = { func: a[b], scope: a, prop: b };
    else if (typeof b === 'function')
        ctx = { func: b, scope: a };
    else
        ctx = { func: a, scope: b || exports.global };
    
    if (typeof ctx.func !== 'function' || !ctx.scope)
        exports.onerror(new Error(
            '[signal.js] .$resolve error: expected (object, methodName), (object, function) or (function)'
        ));
    ctx.constructor = $resolve;
    exports.debug && log('resolved', name, 'a:'+a, 'b:'+b, 'ctx.func:'+ctx.func, 'ctx.scope:'+typeof ctx.scope);
    return ctx;
}
