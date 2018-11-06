location.protocolVersion = Window.protocolSignature;
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

var version = '0.0.1a';
function log() {
    print('[WebWindowEx] '+[].slice.call(arguments).join(' '));
}

log('...', version, Script.resolvePath('signal.js'));
try { signal.exists; } catch(e) {
    Script.include(Script.resolvePath('signal.js'));
}
log('...', typeof signal);
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

_WebWindowEx.qml = Script.resolvePath('').replace('.js','.qml');
_WebWindowEx.OverlaySurrogate = OverlayWindow;

Function.prototype.bind = Function.prototype.bind||function(){var fn=this,s=[].slice,a=s.call(arguments),o=a.shift();return function(){return fn.apply(o,a.concat(s.call(arguments)))}};

var exports = _WebWindowEx;
exports.signal = signal;
exports._QueueMethodUntilSignaled = _QueueMethodUntilSignaled;
try {
    throw new Error('stack');
} catch(e) {
    exports.debug = /[d]ebug/.test(e.fileName);
    exports.debug && log('DEBUG MODE ENABLED', e.fileName);
}

_WebWindowEx.toString = function() {
    return '[WebWindowEx.constructor(title,url,width,height)]';
};

_WebWindowEx.prototype = Object.defineProperties({
    constructor: _WebWindowEx,
    $set: function(k,v) { try { return this._window.sendToQml({ property: k, value: v }); } catch(e) { exports.debug && log('$set error:', e); } },
    toString: function() { return '[WebWindowClass (WebWindowEx)]'; },

    _visible: false,
    getVisible: function() { return this._visible; },
    setVisible: function(v) { this.$set('visible', this._visible = v); },

    _title: '_WebWindowEx',
    getTitle: function() { return this._title; },
    setTitle: function(v) { this.$set('title', this._title = v); },

    _position: {x:-1,y:-1},
    getPosition: function() { return Object.create(this._position); },
    setPosition: function(x,y) {
        if (typeof x === 'object')
            y = x.y, x = x.x;
        this.$set('x', this._position.x = x);
        this.$set('y', this._position.y = y);
    },

    _size: { width: -1, height: -1 },
    getSize: function() { return Object.create(this._size); },
    setSize: function(w,h) {
        if (typeof w === 'object')
            h = w.height, w = w.width;
        this.$set('width', this._size.width = w);
        this.$set('height', this._size.height = h);
    },

    _url: 'about:blank',
    getURL: function(url) { return this._url; },
    setURL: function(url) { this.$set('url', this._url = url); },

    setScriptURL: function(url) { this.$set('scriptUrl', this._scriptUrl = url); },

    emitScriptEvent: function(event) {
        this._window.sendToQml({ target: 'web', origin: 'script', data: event });
    },

    deleteLater: function() { this._window.sendToQml({ target: 'qml', origin: 'script', data: 'deleteLater'}); },
    raise: function() { this._window.sendToQml({ target: 'qml', origin: 'script', data: 'raise'}); },
    close: function() { print('close', this._window); this._window && this._window.close(); }
}, {
    visible: { get: function() { return this.getVisible() }, set: function(nv) { return this.setVisible(nv); } },
    position: { get: function() { return this.getPosition() }, set: function(nv) { return this.setPosition(nv); } },
    size: { get: function() { return this.getSize() }, set: function(nv) { return this.setSize(nv); } },
    title: { get: function() { return this.getTitle() }, set: function(nv) { return this.setTitle(nv); } },
    url: { get: function() { return this.getURL() }, set: function(nv) { return this.setURL(nv); } },
});

// Note: Qt/QML seems to have a quirk where the first time loading over HTTP all the QML doesn't load in time
/*if (/^http/.test(_WebWindowEx.qml)) {
    log('prefetching QML', _WebWindowEx.qml);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', _WebWindowEx.qml, false);
    xhr.send();
    log('//prefetched QML', xhr.getAllResponseHeaders());
}*/

// keep track of created windows for debugging
_WebWindowEx.$windows = [];
Script.scriptEnding.connect(function() {
    _WebWindowEx.$windows.splice(0, _WebWindowEx.$windows.length).forEach(function(w) {
        if (!w.objectName) {
            log('------------ calling deleteLater on ' + w);
            w.deleteLater();
        }
    });
});
function _WebWindowEx(title, url, width, height, toolWindow) {
    if (!(this instanceof WebWindowEx))
        return new _WebWindowEx(title, url, width, height, toolWindow);

    this._title = title || this._title;
    this._url = url || this._url;
    this._visible = this._visible;
    this._position = Object.create(this._position);
    this._size = Object.create(this._size);
    if (isFinite(width))
        this._size.width = width;
    if (isFinite(height))
        this._size.height = height;
    this._toolWindow = toolWindow;

    if (typeof title === 'object') {
        var ob = title;
        if ('visible' in ob)
            this._visible = !!ob.visible;
        if (isFinite(ob.x) && isFinite(ob.y))
            this._position = { x: ob.x, y: ob.y };
        if (isFinite(ob.width))
            this._size.width = ob.width;
        if (isFinite(ob.height))
            this._size.height = ob.height;
        this._title = ob.title;
        this._url = ob.source;
        this._toolWindow = ob.toolWindow;
    }

    var qml = _WebWindowEx.qml;

    // automatically apply a cache buster (if working from the local filesystem)
    if (/^file:/.test(qml))
        qml += '#' + [ ['','debug'][+exports.debug], new Date().getTime().toString(36)].join('&')
    else if (exports.debug)
        qml += '?debug=true';

    function _createSurrogateWindow() {
        return new WebWindowEx.OverlaySurrogate({
            title: 'WebWindowEx',
            width: 128,
            height: 128,
            source: qml,
            visible: false
        });
    }

    var _window = _createSurrogateWindow();

    this._window = _window;
    this.eventBridge = this;

    // queue $settings messages until the QML side is ready to receive them
    // (by temporarily overriding $set)
    this.$ready = signal('$ready');
    var $ready2 = this.$ready2 = signal('$ready2');
    this.$ready.connect(this, function(v) {
        //if (v === 'webview')this.setVisible(true);
        exports.debug && log('$ready', v);
        if (v === 'webview')
            Script.setTimeout($ready2, 1000);
    });
    new _QueueMethodUntilSignaled(this.$ready2, this, '$set', 3000);
    new _QueueMethodUntilSignaled(this.$ready2, this, 'emitScriptEvent', 3000);

    var visibilityChanged = _window.visibilityChanged || signal('visibilityChanged');
    Object.defineProperties(this, {
        webEventReceived: { enumerable: true, value: signal('webEventReceived') },
        visibilityChanged: { enumerable: true, value: visibilityChanged },
        visibleChanged: { enumerable: true, value: visibilityChanged },
        moved: { enumerable: true, value: _window.moved },
        resized: { enumerable: true, value: _window.resized },
        closed: { enumerable: true, value: _window.closed },
        $destroyed: { value: signal('$destroyed') },
        $url: { value: signal('$url') },
    });

    _window.webEventReceived && _window.webEventReceived.connect(this, 'webEventReceived');

    if (!_window.objectName) {
        log('--------------------------' + _window);
        _WebWindowEx.$windows.push(_window);
    }
    var safeWindowStr = _window+'';
    this.$destroyed.connect(this, function() {
        this._window = null; // prevent further access from scripting
        var idx = _WebWindowEx.$windows.indexOf(_window);
        log('$destroyed -- removing $windows['+idx+']', safeWindowStr);
        if (~idx) _WebWindowEx.$windows.splice(idx,1);
    });
    Script.scriptEnding.connect(this, '$destroyed');
    this._window.fromQml.connect(this, function(event) {
        // forward HTML events back to the client script
        if (event.target === 'script')
            return this.webEventReceived(event.data);
        else if (event.target === 'WebWindowEx') {
            //log('FROMQML', JSON.stringify(event));
            if (event.data && event.data.objectName)
                this.objectName = event.data.objectName;
            // forward QML emits to local signals
            if (event.data && event.data.emit) {
                var msg = event.data,
                    emitter = msg.emit,
                    args = msg.arguments;

                exports.debug && log('emit', emitter, args);

                if (emitter === '$destroyed') {
                    // call $destroyed right away so reference gets cleared
                    this.$destroyed();
                    return;
                }
                try {
                    this[emitter].wwto && Script.clearTimeout(this[emitter].wwto);
                    this[emitter].wwto = Script.setTimeout(function()  {
                        this[emitter].wwto = null;
                        this[emitter].apply(this, args);
                    }.bind(this), 10);
                } catch(e) {
                    log('error proxying signal: ', JSON.stringify({ data: event.data, emitter: emitter, error: e+'', 'this[emitter]': this[emitter].toSource && this[emitter].toSource(), 'con': this[emitter] && this[emitter].constructor.name },0,2));
                    throw e;
                }
                return;
            }
        }
        log('_window.fromQml -- unhandled message', JSON.stringify(event));
    });

    this.resized.connect(this, function(_wh) { this._size = _wh; });
    this.moved.connect(this, function(_xy) { this._position = _xy; });
    this.visibilityChanged.connect(this, function(nv) { this._visible = nv; });

    this.setURL(this._url);
    this.setSize(this._size.width, this._size.height);
    this.setPosition(this._position.x, this._position.y);
    this.setTitle(this._title);
    this.setVisible(this._visible);
}//WebWindowEx

// queue calls to object[method] until the returned signal is fired
// (if timeout specified and not fired within that many ms then signal will be fired manually)
function _QueueMethodUntilSignaled($signal, object, method, timeout) {
    var $queued = [];
    var $old = object[method];
    exports.debug && log('_QueueMethodUntilSignaled - ', method, $signal.$name, timeout);
    object[method] = function() { $queued.push([].slice.call(arguments)); };
    var to;
    if (timeout)
        to = Script.setTimeout(function() { to=null; $signal('timeout'); }, timeout);
    $signal.connect(function once(v) {
        $signal.disconnect(once);
        if (to) { Script.clearTimeout(to); to=null; }
        exports.debug && log('//_QueueMethodUntilSignaled - restoring', method, $signal.$name, '(queued messages: '+$queued.length+')');
        object[method] = $old;
        $queued.splice(0, $queued.length).forEach(function(args) { object[method].apply(object, args); });
    });
    $signal.$queued = $queued;
    $signal.$old = $old;
    return $signal;
}

if (0) {
try { throw new Error('stack'); } catch(e) {
    var filename = e.fileName;
    var extractParameters = (Script.require)('https://cdn.rawgit.com/humbletim/hifi-aux/8780e1fd/snippets/extract-parameters.js');
    Script.include('http://cdn.xoigo.com/hifi/analytics.min.js');
    try { ua.used(extractParameters(e.fileName)); } catch(e) { }
}
}

WebWindowEx = _WebWindowEx; // export as a global
try { module.exports = exports; } catch(e) {} // and if possible as conventional module
