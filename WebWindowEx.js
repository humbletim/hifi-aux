// WebWindowEx
//
//     An attempt to reproduce classic HiFi WebWindow's using OverlayWindow + QML
//     See also: ./WebWindowEx.qml
//
// --humbletim 2016.10.01
//
// NOTE: to use as a drop-in replacement for WebWindow scripts:
//
//   Script.include('WebWindowEx.js');
//   WebWindow = WebWindowEx;
//
//   var win = new WebWindow('business as usual, 'about:blank', 640, 480);
//   win.setVisible(true);
//

Script['this is a Client Interface script'];

var version = '0.0.0';
function log() {
    print('[WebWindowEx] '+[].slice.call(arguments).join(' '));
}
log('...', version);

// Notes and differences from WebWindow:
//
//   * "window.EventBridge" isn't automatically exposed on the HTML side.
//       - instead, on that side it works just like "OverlayWebWindow"
//         (ie: use the same qwebchannel.js, eventBridgeLoader.js, window.qt, etc.)
//
//   * Setters are partially supported:
//       - setPosition, setSize, setVisible, setTitle, setURL
//
//   * Getters are *not* supported -- (getPosition, getSize, getVisibility, getTitle, getURL)
//       (it's possible to add these, just complicated to do so reliably)
//
//   * Signals are partially supported:
//     - moved, resized, visibilityChanged, webEventReceived
//
// The different layers involved here are basically:
//   (a client script) <=> WebWindowEx.js <=> [fromQml/sendToQml]
//     WebWindowEx.qml <=> (QmlWindow-surrogate => QML ApplicationWindow)
//       [EventBridge] <=> (your HTML!)
//

_WebWindowEx.qml = Script.resolvePath('WebWindowEx.qml');

var exports = _WebWindowEx;

WebWindowEx = _WebWindowEx; // export as a global
try { module.exports = exports; } catch(e) {} // and if possible as conventional module

_WebWindowEx.toString = function() {
    return '[WebWindowEx.constructor(title,url,width,height)]';
};

_WebWindowEx.prototype = {
    $set: function(k,v) { return this._window.sendToQml({ property: k, value: v }); },
    toString: function() { return '[WebWindowClass (WebWindowEx)]'; },

    setVisible: function(v) { this.$set('visible', v); },
    setTitle: function(v) { this.$set('title', v); },
    setPosition: function(x,y) { this.$set('x', x); this.$set('y',y); },
    setSize: function(w,h) { this.$set('width',w); this.$set('height',h); },
    setURL: function(url) { this.$set('url', url); },
    emitScriptEvent: function(event) {
        this._window.sendToQml({ target: 'web', origin: 'script', data: event });
    }
};

function _WebWindowEx(title, url, width, height) {
    if (!(this instanceof WebWindowEx))
        return new _WebWindowEx(title, url, width, height);

    var qml = _WebWindowEx.qml;

    // automatically apply a cache buster (if working from the local filesystem)
    if (/^file:/.test(_WebWindowEx.qml))
        qml += '#' + new Date().toString(36);

    var _window = this._window = new OverlayWindow({
        title: title,
        width: width,
        height: height,
        source: qml,
        visible: false
    });

    this.eventBridge = this;

    // queue $settings messages until the QML side is ready to receive them
    var $queued = [];
    // (by temporarily overriding $set)
    this.$set = function(k,v) { $queued.push([k,v]); };

    this.$ready = signal('$ready');
    this.$ready.connect(this, function(v) {
        log('received ready event from QML side', v, '(queued messages: '+$queued.length+')');
        delete this.$set; // revert to using prototype's .$set
        var _this = this;
        $queued.splice(0, $queued.length).forEach(function(kv) { _this.$set(kv[0], kv[1]); });
    });

    Object.defineProperties(this, {
        webEventReceived: { enumerable: true, value: _window.webEventReceived || signal('webEventReceived') },
        visibilityChanged: { enumerable: true, value: _window.visibilityChanged || signal('visibilityChanged') },
        moved: { enumerable: true, value: _window.moved },
        resized: { enumerable: true, value: _window.resized },
        closed: { enumerable: true, value: _window.closed },
    });

    this._window.fromQml.connect(this, function(event) {
        // forward HTML events back to the client script
        if (event.target === 'script')
            return this.webEventReceived(event.data);
        else if (event.target === 'WebWindowEx') {
            // forward QML emits to local signals
            if (event.data && event.data.emit) {
                var msg = event.data,
                    emitter = msg.emit,
                    args = msg.arguments;

                exports.debug && log('emit', emitter, args);

                try {
                    this[emitter].apply(this, args);
                } catch(e) {
                    log('error proxying signal: ', msg.emit, e);
                    throw e;
                }
                return;
            }
        }
        log('_window.fromQml -- unhandled message', JSON.stringify(event));
    });
    if (url)
        this.setURL(url);
    if (width && height)
        this.setSize(width, height);
    if (title)
        this.setTitle(title);
}//WebWindowEx

// mini "signal" polyfill
function signal(name) {
    emit.$connects = [];
    function emit() {
        var args = arguments;
        emit.$connects.forEach(function(om,i) {
            try { om.func.apply(om.scope, args); } catch(e) { log('ERROR: ', name, i, e); }
        });
    }
    emit.$resolve = function(a,b) {
        var om;
        if (typeof b === 'string')
            om = { func: a[b], scope: a };
        else if (typeof b === 'function')
            om = { func: b, scope: a };
        else
            om = { func: a, scope: b||this };

        if (typeof om.func !== 'function' || !om.scope)
            throw new Error(
                'connect-'+name+' -- expected .connect(object, method) or .connect(function)'
            );
        exports.debug && log('resolved', name, 'a:'+a, 'b:'+b, 'om.func:'+om.func, 'om.scope:'+typeof om.scope);
        return om;
    };
    emit.connect = function(a,b) { return emit.$connects.push(emit.$resolve(a,b)); };
    emit.disconnect = function(a,b) {
        var om = emit.$resolve(a,b);
        var before = emit.$connects.length;
        emit.$connects = emit.$connects.filter(function(c) {
            return c.func !== om.func || c.scope !== om.scope;
        });
        log(name, 'before',before,'after',emit.$connects.length);
    };
    return emit;
}
