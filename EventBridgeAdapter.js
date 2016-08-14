//
//    EventBridgeAdapter -- a potentially easier way to use EventBridge
//    2016.08.01 humbletim
//

// This script is isomorphic -- so we detect which side we're running on and adapt accordingly.
if (typeof Script === 'object' && Script.include) {
    // INTERFACE/CLIENT SIDE
    var isHiFi = true;
    var log = function() { print('[EventBridgeAdapter - hifi] ' + [].slice.call(arguments).join(' ')); };
} else {
    // WEB SIDE
    var isWeb = true;
    var log = function() { console.info('[EventBridgeAdapter - web] ' + [].slice.call(arguments).join(' ')); };
    var qwebchannel_src = 'qwebchannel.js'; //'qrc:///qtwebchannel/qwebchannel.js'
    var _include = function(src, callback) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function(evt) { callback(null, evt); };
        s.onerror = function(evt) { callback(evt.message||evt, null); };
        return (document.body || document.head).appendChild(s);
    };
}

// Adapts gnarly EventBridge naming/calling conventions into something that duck-types as HTML5 MessagePort
function _EventBridgeMessagePort() {
    var port = {
        origin: isWeb ? 'web' : isHiFi ? 'hifi' : 'unknown',
        // polarize the EventBridge names (based on current environment)
        _names: (
            isHiFi ? {
                sendToOther: 'emitScriptEvent',
                fromOther: 'webEventReceived'
            } : {
                sendToOther: 'emitWebEvent',
                fromOther: 'scriptEventReceived'
            }
        ),
        _make_event: function(data, targetOrigin) {
            return {
                origin: this.origin,
                data: data,
                target: targetOrigin || '*',
                tstamp: +new Date
            };
        },
        _parse_event: function(raw) {
            var event = raw.substr(0,1) === '{' ? JSON.parse(raw) : raw;
            if (event && event.origin)
                return event;
            throw new Error('_parse_event event w/o origin');
        },
        PENDING: 0,
        CONNECTED: 1,
        STARTED: 2,
        CLOSED: 3,
        readyState: 0,
        onreadystatechange: function() { log('port.readyState==', this.$readyState); },
        onerror: function(e) { log('(default) port.onerror handler:', e); },
        _send: function(event) {
            port.emitEvent(JSON.stringify(event));
        },
        _receive: function(raw) {
            try { port.onmessage(port._parse_event(raw)); }
            catch(e)  {
                e.raw = raw;
                port.onerror(e);
            }
        },
        _queue: [],
        start: function() {
            if (port.readyState === port.CLOSED)
                throw new Error('.start called when readyState==='+port.$readyState);
            if (port.readyState !== port.STARTED) {
                if (!port.eventBridge)
                    throw new Error('call .connect(eventBridge) first');
                if (port.readyState !== port.CONNECTED)
                    throw new Error('.start expected readyState===CONNECTED but found readyState===' + port.$readyState);
                port.readyState = port.STARTED;
                try { port.onreadystatechange(port.readyState); }
                catch(e) { log('.start -- error claling onreadystatechange:', e); port.onerror(e); }
                if (port._queue.length) {
                    log('########### draining queue (#' + port._queue.length + ' messages)');
                    port._queue.splice(0, port._queue.length).forEach(port._send);
                }
                log('//started', port.$readyState);
                return true;
            } else
                log('?? .start called when readState==' + port.$readyState, '(queue length is #'+port._queue.length+')');
        },
        postMessage: function(data, targetOrigin, transfer) {
            if (port.readyState === port.CLOSED)
                throw new Error('.postMessage called when readyState===' + port.$readyState);
            // TODO: possibly support emulated 'transfer' parameter
            if (transfer) throw new Error('postMessage third argument not yet supported');
            var event = port._make_event(data, targetOrigin);
            if (port.readyState === port.STARTED)
                return port._send(event);
            port._queue.push(event);
            log('... queued message; readyState==', port.$readyState, 'queued.length==' + port._queue.length);
        },
        close: function(reason) {
            if (port.readyState !== port.CLOSED) {
                port.readyState = port.CLOSED;
                port.onreadystatechange(port.readyState, reason);
            }
            if (port.receiveEvent) {
                port.receiveEvent.disconnect(port._receive);
                port.receiveEvent = port.emitEvent = port.eventBridge = null;
            }
            try { port.onclose(reason); }
            catch(e) { log('close -- error calling onclose:', e); port.onerror(e); }
            log('//closed', reason);
        },
        connect: function connect(eventBridge) {
            if (port.readyState)
                throw new Error('.connect called when readyState===' + port.$readyState);

            port.emitEvent = eventBridge[port._names.sendToOther];
            if (!port.emitEvent)
                return port.onerror('.' + port._names.sendToOther + ' not found in ' + eventBridge);

            port.receiveEvent = eventBridge[port._names.fromOther];
            if (!port.receiveEvent)
                return port.onerror('.' + port._names.fromOther +' signal not found in ' + eventBridge);

            port.receiveEvent.connect(port._receive);

            if (isWeb) {
                window.addEventListener('beforeunload', function() {
                    log('onbeforeunload...', port.$readyState);
                    port.close('beforeunload');
                });
            } else if (isHiFi) {
                Script.scriptEnding.connect(function() {
                    log('scriptEnding...', port.$readyState);
                    port.close('scriptEnding');
                });
            }

            log(
                '_connected', port.origin.toUpperCase(),
                'send:', [port._names.sendToOther, typeof port.emitEvent],
                'receive:', [port._names.fromOther, typeof port.receiveEvent]
            );
            port.eventBridge = eventBridge;
            port.readyState = port.CONNECTED;
            port.onreadystatechange(port.readyState);
            try { port.onopen(port.readyState, eventBridge); }
            catch(e) { log('connect -- error calling onopen:', e); port.onerror(e); }
            return port;
        }
    };
    // TODO: support port.addEventListener('message', etc.)
    return Object.defineProperties(port, {
        onmessage: {
            configurable: true,
            set: function(nv) {
                // per HTML5 MessagePort conventions, assigning the .onmessage handler automatically ensures .start() is called
                Object.defineProperty(port, 'onmessage', { configurable: true, value: nv });

                if (port.readyState === port.CONNECTED) {
                    log('.onmessage assigned; calling .start()...');
                    port.start();
                } else
                    log('.onmessage assigned; NOT calling .start() (.readyState == ' + port.$readyState + ')');
            }
        },
        $readyState: { get: function() {
            return Object.keys(port).filter(function(p) { return /^[A-Z]/.test(p) && port[p] === port.readyState && p; })+'';
        } }
    });
}

// Mini "Deferred" implementation; incomplete, but works similarly to jQuery.Deferred.
// * currently used as a way for shared methods to return an async callback placeholder
// * could switch to Promises, but that requires significant polyfills to work on Interface side
function _Deferred(beforeStart) {
    if (!(this instanceof _Deferred))
        return new _Deferred(beforeStart);
    var dfd = this;
    var $callback = function $callback(err, val) {
        // normally callback will be replaced, but if failing in beforeStart need to memoize
        log('early deferred callback...', err, val);
        dfd.error = err;
        dfd.value = val;
    };
    Object.defineProperty(dfd, '$callback', {
        get: function() { return $callback; },
        set: function(nv) {
            $callback = nv;
            // handle the case of early reject/resolve
            if ('error' in dfd || 'value' in dfd) {
                log('early rapid-fire $callback', dfd.error, dfd.value);
                $callback(dfd.error, dfd.value);
            }
        }
    });
    dfd._callback = function(err, val) { log('_callback', err, val); dfd.$callback(err, val); };
    dfd.resolve = function(val) { dfd._callback(null, val); };
    dfd.reject = function(err) { dfd._callback(err, null); };

    try { beforeStart && beforeStart(dfd); }
    catch(e) { dfd.reject(e); }
}

// bootstrap an eventBridge object by whatever means are necessary to do so
// supporting the following scenarios:
//   [ WebWindow, OverlayWebWindow, "OverlayWebWindowEx" prototype, testingStubs ]
function _openEventBridge(maybeEventBridge, qwebchannel_src, callback) {
    // if the first argument duck-types as an EventBridge, use that
    if (maybeEventBridge && typeof maybeEventBridge === 'object' && "emitScriptEvent" in maybeEventBridge)
        return callback(null, maybeEventBridge); // hifi-side and web-side WebWindow

    // we only have other options to try on the Web side
    if (!isWeb)
        return callback(new Error('unknown EventBridge scenario...'), null);

    // first make sure this is a QWebChannel candidate scenario
    if (typeof qt !== 'object')
        return callback(new Error('typeof qt !== "object" (expected to be running in a Qt >= 5.5.1 WebChannel-enabled WebEngineView...)'));

    // if not already available then include qwebchannel.js and provision afterwards
    if (typeof QWebChannel !== 'function') {
        log('-------------------------- including QWebChannel from:', qwebchannel_src);
        return _include(qwebchannel_src, provision);
    }

    // QWebChannel is already available, should be able to provision immediately
    return provision();

    function provision(err, evt) {
        var WebChannel = new QWebChannel(qt.webChannelTransport, function (channel) {
            EventBridge = WebChannel.objects.eventBridge || // "OverlayWebWindowEx"
            WebChannel.objects.eventBridgeWrapper.eventBridge; // OverlayWebWindow
            callback(err, EventBridge);
        });
        _openEventBridge.WebChannel = WebChannel; // expose for debugging
    }
}

// WIP
function _EventBridgeAdapter(window, options) {
    var bridge = new _EventBridgeMessagePort(options);
    options.debug && log('_EventBridgeAdapter -- bridge.readyState: ' + bridge.$readyState);
    var adapter = new _EinsteinRosenChannel(bridge, options);

    try {
        _openEventBridge(
            options.eventBridge || window.eventBridge || window.EventBridge || window,
            options.qwebchannel_src || qwebchannel_src,
            function(err, eventBridge) {
                if (err) throw err;
                bridge.connect(eventBridge);
            }
        );
    } catch(e) {
        log('_openEventBridge error: ', e);
        isWeb && window.setTimeout(adapter.onerror.bind(adapter, e));
    }

    options.debug && log('//adapter created:', adapter);
    return adapter;
}

// creates a new channel and wires to/from MessagePort-like peer
// options:
//           version: earmark indicating local version
//            shared: { methods: function() {} } -- auto-bridged methods
//            onload: (optional) event handler callbacks
//            onopen: (optional) ""
//           onclose: (optional) ""
//           onerror: (optional) ""
//               key: (optional) earmark indicating a local key hint
//             debug: (optional) enable/disable more verbose logging
//   qwebchannel_src: (optional) URL to pull qwebchannel.js from (if/when needed)
//
function _EinsteinRosenChannel(peer, options) {
    var self = {
        peer: peer,
        options: options,
        _meta: {
            origin: isWeb ? 'web' : isHiFi ? 'hifi' : 'unknown',
            version: options.version,
            key: options.key,
            methods: Object.keys(options.shared||{}).filter(function(k) { return typeof options.shared[k] === 'function' })
        },
        debug: 'debug' in options ? options.debug : (isWeb ? /\bdebug\b/.test(window.location) : false),
        toString: function() {
            var async = this.async || {};
            return '[EinsteinRosenChannel'+
                ' self='+this._meta.origin+'@'+this._meta.version+
                ' peer='+async.origin+'@'+async.version+
                ']';
        },

        onerror: options.onerror || function(err) { throw new Error(err); },
        onload: options.onload || function() {},
        onopen: options.onopen || function() {},
        onclose: options.onclose || function() {},
        onmessage: options.onmessage || function(event) { self.debug,1 && log('(default .onmessage)', event); },

        Deferred: _Deferred,
        shared: options.shared,
        // note: JSON-P-like rpc invocations get attached to .callbacks (and can be inspected to help debug any messaging issues)
        callbacks: {
            CLOSED: function(event) {
                log('received CLOSED event from peer side; reason:', event.data.reason);
                self.close('peer:'+event.data.reason);
            }
        },
        _handshake: function() {
            log('handshaking w/', this.peer.origin, typeof this.peer.eventBridge);
            // notify "other" side about "our" available shared methods
            this.peer.postMessage({ rpc: 'HELO', args:[this._meta], callback: !this.async && 'HELO' }, this.peer.origin);
        },
        _become_friends: function(msg) {
            log('HELO friend!!');
            var _asyncProto = (msg.args && msg.args[0]) || {};
            var async = self.async = Object.create(_asyncProto);
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
                        self.callbacks[out.callback] = function(event) {
                            delete self.callbacks[out.callback];
                            log(name, 'callback!', JSON.stringify(event));
                            callback.call(async, event.data.error, event.data.args && event.data.args[0]);
                        };
                    }
                    out.args = args;
                    self.postMessage(out, peer.origin);
                };
            });

            // emulate async versions of the locally-defined shared functions too
            // this allows calling sync "self.shared.css(...)" as async "self.async.css(..., function(err, val) { ... })"
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
                            result.$callback = callback;
                        else
                            callback.call(async, error, result);
                    }
                };
            });

            var result = JSON.parse(JSON.stringify(self._meta));
            try { result.loadresult = self.onload(self.async) }
            catch(e) {
                log('self.onload error:', e, e.lineNumber, e.message, e.stack);
                result.loadresult = e + '';
            }
            return result;
        },
        _onmessage: function(event) {
            try {
                var result, error;
                var msg = event.data;
                self.debug && log('_receive:', event.origin, '->', event.target, JSON.stringify(msg));
                if (msg.rpc) {
                    if (msg.rpc === 'HELO') {
                        result = self._become_friends(msg);
                    } else {
                        if (self.callbacks[msg.rpc]) {
                            self.debug && log('...calling self.callbacks.'+msg.rpc);
                            try { result = self.callbacks[msg.rpc](event); } catch(e) { error = e+''; }
                        } else if (options.shared[msg.rpc]) {
                            self.debug && log('...calling self.shared.'+msg.rpc);
                            try { result = options.shared[msg.rpc].apply(self.async, msg.args); } catch(e) { error = e+''; }
                        } else
                            error = new Error('shared method not found: ' + msg.rpc)+'';
                        if (error)
                            log('_receive.rpc error: ' + error);
                    }

                    if (msg.callback) {
                        var postBack = function(err, val) {
                            err && log('...postBack includes an error message:', err);
                            if (err === null || err === undefined)
                                err = undefined;
                            else
                                err = err+'';
                            self.postMessage({ rpc: msg.callback, error: err, args:[val] }, event.origin);
                        };
                        if (error)
                            log('_receive msg.callback early error: '+ error);
                        if (result && typeof result === 'object' && result instanceof _Deferred)
                            result.$callback = postBack;
                        else
                            postBack(error, result);
                    }
                } else {
                    log('_receive !msg.rpc', JSON.stringify(event));
                    self.onmessage(event);
                }
            } catch(e) {
                log('_receive error:', e, e.lineNumber, JSON.stringify(event));
            }
        },
        close: function(reason) {
            if (peer.readyState !== peer.CLOSED) {
                peer.postMessage({ rpc: 'CLOSED', reason: reason }, peer.origin);
                delete self.async;
                peer.close(reason);
                self.onclose && self.onclose(reason);
            }
        }
    };

    peer.onopen = function(readyState) {
        log('peer.onopen! wiring handlers', peer.eventBridge);
        self.postMessage = peer.postMessage; // OUTPUT: Adapter ==> EventBridge
        peer.onmessage   = self._onmessage;  //  INPUT: EventBridge ==> Adapter
        try { self.onopen(readyState); }
        catch(e) { log('self.onopen error: ', e); self.onerror(e); }
        self._handshake();
    };
    peer.onclose = function(reason) {
        log('peer.onclose! unwiring handlers');
        self.postMessage = null;
        peer.onmessage = null;
        self.close(reason || 'peer-side closed');
    };

    peer.onerror = function(err) {
        log('peer.onerror: ', err);
        if (err.raw)
            self.onmessage(err.raw);
        else
            self.onerror(err);
    };

    // if already connected then onopen isn't going to be fired...
    if (peer.readyState) {
        log('-==-=-=-=-==-=-=--==-=- peer already connected, manually calling onopen');
        log('-==-=-=-=-==-=-=--==-=- peer already connected, manually calling onopen');
        log('-==-=-=-=-==-=-=--==-=- peer already connected, manually calling onopen');
        //peer.onopen(peer.readyState);
    }

    return Object.defineProperties(self, {
        $readyState: { get: function() { return peer.$readyState; } }
    });
}

// global "exports"
// FIXME: switch back to simple name once local refactoring is complete
//EventBridgeAdapter  = _EventBridgeAdapter;
EinsteinRosenBridge = _EventBridgeAdapter;
