//
//    EventBridgeAdapter -- a potentially easier way to use EventBridge
//    2016.08.01 humbletim 
//

// The adapter is isomorphic, so first detect which side we're running on...
if (typeof Script === 'object' && Script.include) {
    // INTERFACE CLIENT SIDE
    var isHiFi = true;
    var log = function() { print('[helper.js - hifi] ' + [].slice.call(arguments).join(' ')); };
} else {
    // WEB SIDE
    var isWeb = true;
    var log = function() { console.info('[helper.js - web] ' + [].slice.call(arguments).join(' ')); };
    var qwebchannel_src = 'qwebchannel.js'; //'qrc:///qtwebchannel/qwebchannel.js'
    var _include = function(src, callback) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function(evt) { callback(null, evt); };
        s.onerror = function(evt) { callback(evt.message||evt, null); };
        return (document.body || document.head).appendChild(s);
    };
}

// mini Deferred implementation (incomplete; works similarly to jQuery.Deferred)
function _Deferred(beforeStart) {
    if (!(this instanceof _Deferred))
        return new _Deferred(beforeStart);
    var dfd = this;
    var callback = function callback(err, val) {
        // in theory callback will be replaced, but if failing in beforeStart need to memoize
        log('early deferred callback...', err, val);
        dfd.error = err;
        dfd.value = val;
    };
    Object.defineProperty(dfd, 'callback', {
        get: function() { return callback; },
        set: function(nv) {
            callback = nv;
            // handle the case of early reject/resolve
            if ('error' in dfd || 'value' in dfd) {
                log('early rapid-fire callback', dfd.error, dfd.value);
                callback(dfd.error, dfd.value);
            }
        }
    });
    dfd._callback = function(err, val) { log('_callback', err, val); dfd.callback(err, val); };
    dfd.resolve = function(val) { dfd._callback(null, val); };
    dfd.reject = function(err) { dfd._callback(err, null); };
    // TODO: maybe wire-up .then, .done, etc.
    try { beforeStart && beforeStart(dfd); }
    catch(e) { dfd.reject(e); }
}

// WIP
function _EventBridgeAdapter(window, options) {
    var port = {
        Deferred: _Deferred,
        shared: options.shared,
        debug: 'debug' in options ? options.debug : (isWeb ? /\bdebug\b/.test(window.location) : false),
        callbacks: {}, // JSON-P like rpc invocations get attached here                
        origin: isWeb ? 'web' : isHiFi ? 'hifi' : 'unknown',
        _meta: {
            version: options.version,
            key: options.key,
            methods: Object.keys(options.shared).filter(function(k) { return typeof options.shared[k] === 'function' })
        },
        _ports: ( // polarize EventBridge's gnarly naming conventions
            isHiFi ? {
                send: 'emitScriptEvent',
                recv: 'webEventReceived'
            } : {
                send: 'emitWebEvent',
                recv: 'scriptEventReceived'
            }
        ),
        _connect: function _connect(eventBridge) {
            this.emitEvent = eventBridge[this._ports.send];
            if (!this.emitEvent)
                return this.onerror('.' + this._ports.send + ' not found in ' + eventBridge);

            this.receiveEvent = eventBridge[this._ports.recv];
            if (!this.receiveEvent)
                return this.onerror('.' + this._ports.recv +' signal not found in ' + eventBridge);

            this.receiveEvent.connect(this._receive);
            if (isWeb) {
                window.addEventListener('beforeunload', function() {
                    log('onbeforeunload -- receiveEvent.disconnect...');
                    this.receiveEvent.disconnect(this._receive);
                }.bind(this));
            }
            log(
                '_connected', this.origin.toUpperCase(),
                'send:', [this._ports.send, typeof this.emitEvent],
                'receive:', [this._ports.recv, typeof this.receiveEvent]
            );
            this._eventBridge = eventBridge;
            return this._handshake();
        },
        _handshake: function() {
            log('handshaking...', typeof this._eventBridge);
            // notify "other" side about "our" available shared methods
            this._send(this._make_event({ rpc: 'HELO', args:[this._meta], callback: !this.async && 'HELO' }, '*'));
        },
        _become_friends: function(msg) {
            log('HELO friend!!');
            port.readyState++;
            port.onreadystatechange();
            var _asyncProto = msg.args[0] || {};
            var async = port.async = Object.create(_asyncProto);
            log('-- HELO', async.key, async.version, async.loadresult, async.methods);
            async.methods = async.methods || [];
            async.methods.forEach(function(name) {
                log('[proxy] .async.'+name);
                async[name] = function() {
                    var args = [].slice.call(arguments);
                    var out = { rpc: name };
                    if ('function' === typeof args[args.length-1]) {
                        var callback = args.pop();
                        out.callback = 'rpc-'+name+'-'+Math.random().toString(36).substr(2);
                        port.callbacks[out.callback] = function(event) {
                            delete port.callbacks[out.callback];
                            log(name, 'callback!', JSON.stringify(event));
                            callback.call(async, event.data.error, event.data.args[0]);
                        };
                    }
                    out.args = args;
                    port.postMessage(out, '*');
                };
            });

            // emulate async versions of the locally-defined shared functions too
            // this allows calling sync "port.shared.css(...)" as async "port.async.css(..., function(err, val) { ... })"
            Object.keys(options.shared).forEach(function(name) {
                log('[local] .async.'+name);
                _asyncProto[name] = function() {
                    log('note: invoking shared local func as async: ' + name);
                    var args = [].slice.call(arguments);
                    var error, result;
                    if ('function' === typeof args[args.length-1])
                        var callback = args.pop();
                    try {
                        result = options.shared[name].apply(async, args);
                    } catch(e) {
                        error = e+'';
                        log('virtual async error: ', name, error);
                    }
                    if (callback) {
                        if (result && typeof result === 'object' && result instanceof _Deferred)
                            result.callback = callback;
                        else
                            callback.call(async, error, result);
                    }
                };
            });

            var result = JSON.parse(JSON.stringify(port._meta));
            try { result.loadresult = port.onload(async) }
            catch(e) {
                log('port.onload error:', e, e.lineNumber, e.message, e.stack);
                result.loadresult = e + '';
            }
            return result;
        },
        readyState: 0,
        onreadystatechange: function() { log('readyState=', this.readyState); },
        onerror: function(err) { throw new Error(err); },
        onload: options.onload || function() {},
        onmessage: options.onmessage || function(event) { port.debug && log('(default .onmessage)', event); },
        _queue: [],
        _make_event: function(data, targetOrigin) {
            return {
                origin: port.origin,
                data: data,
                target: targetOrigin || '*', 
                tstamp: +new Date
            };
        },
        _send: function(event) { port.emitEvent(JSON.stringify(event)); },
        _receive: function(raw) {
            try {
                var result, error;
                var event = raw.substr(0,1) === '{' ? JSON.parse(raw) : raw;
                if (event && event.origin) {
                    var msg = event.data;
                    port.debug && log('_receive:', event.origin, '->', event.target, JSON.stringify(msg));
                    if (msg.rpc) {
                        if (msg.rpc === 'HELO') {
                            result = port._become_friends(msg);
                        } else {
                            if (port.callbacks[msg.rpc]) {
                                port.debug && log('...calling port.callbacks.'+msg.rpc);
                                try { result = port.callbacks[msg.rpc](event); } catch(e) { error = e+''; }
                            } else if (options.shared[msg.rpc]) {
                                port.debug && log('...calling port.shared.'+msg.rpc);
                                try { result = options.shared[msg.rpc].apply(port.async, msg.args); } catch(e) { error = e+''; }
                            } else
                                error = new Error('shared method not found: ' + msg.rpc)+'';
                            if (error)
                                log('_receive.rpc error: ' + error);
                        }

                        if (msg.callback) {
                            var postBack = function(err, val) {
                                err && log('...postBack includes an error message:', err);
                                if (err === null)
                                    err = undefined;
                                else
                                    err = err+'';
                                port.postMessage({ rpc: msg.callback, error: err, args:[val] }, event.origin);
                            };
                            if (error)
                                log('_receive msg.callback early error: '+ error);
                            if (result && typeof result === 'object' && result instanceof _Deferred)
                                result.callback = postBack;
                            else
                                postBack(error, result);
                        }
                    } else {
                        log('_receive !msg.rpc', JSON.stringify(event));
                        port.onmessage(event);
                    }
                } else {
                    log('_received event w/o origin:', event);
                }
            } catch(e) {
                log('_receive error:', e, e.lineNumber, raw);
            }

            if (port._queue.length) {
                port.debug && log('########### draining queue (#' + port._queue.length + ' messages)');
                port._queue.splice(0, port._queue.length)
                    .forEach(port._send);
            }
        },
        postMessage: function(data, targetOrigin, transfer) {
            var event = this._make_event(data, targetOrigin);
            if (this.readyState > 0)
                return this._send(event);
            this._queue.push(event);
            log('... queued message; readyState:', this.readyState, '#' + this._queue.length);
        }
    };

    // bootstrap eventBridge (jumping through QWebChannel hoops where needed)
    var eventBridge = window.eventBridge || window.EventBridge || window;
    if ("emitScriptEvent" in eventBridge)
        port._connect(eventBridge); // WebWindow
    else if (isWeb) {
        var src = options.qwebchannel_src || qwebchannel_src;
        log('-------------------------- including QWebChannel from:', src);
        _include(src, function(err, evt) {
            WebChannel = new QWebChannel(qt.webChannelTransport, function (channel) {
                EventBridge = WebChannel.objects.eventBridge || // "OverlayWebWindowEx"
                WebChannel.objects.eventBridgeWrapper.eventBridge; // OverlayWebWindow
                port._connect(EventBridge);
            });
        });
    } else {
        throw new Error('unknown EventBridgge scenario...');
    }
        
    return port;
}

// global "exports"
// FIXME: switch back to simple name once local refactoring is complete
//EventBridgeAdapter  = _EventBridgeAdapter;
EinsteinRosenBridge = _EventBridgeAdapter;
