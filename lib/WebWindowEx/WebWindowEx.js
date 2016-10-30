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

var version = '0.0.1';
function log() {
    print('[WebWindowEx] '+[].slice.call(arguments).join(' '));
}
log('...', version, Script.resolvePath('signal.js'));

Script.include(Script.resolvePath('signal.js'));

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

WebWindowEx = _WebWindowEx; // export as a global
try { module.exports = exports; } catch(e) {} // and if possible as conventional module

_WebWindowEx.toString = function() {
    return '[WebWindowEx.constructor(title,url,width,height)]';
};

_WebWindowEx.prototype = {
    constructor: _WebWindowEx,
    $set: function(k,v) { try { return this._window.sendToQml({ property: k, value: v }); } catch(e) { exports.debug && log('$set error:', e); } },
    toString: function() { return '[WebWindowClass (WebWindowEx)]'; },

    setVisible: function(v) { this.$set('visible', v); },
    setTitle: function(v) { this.$set('title', v); },
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
    setURL: function(url) { this.$set('url', url); },
    emitScriptEvent: function(event) {
        this._window.sendToQml({ target: 'web', origin: 'script', data: event });
    },

    deleteLater: function() { this._window.sendToQml({ target: 'qml', origin: 'script', data: 'deleteLater'}); },
    raise: function() { this._window.sendToQml({ target: 'qml', origin: 'script', data: 'raise'}); },
    close: function() { this._window.close(); }
};

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
        w.deleteLater();
    });
});
function _WebWindowEx(title, url, width, height, toolWindow) {
    if (!(this instanceof WebWindowEx))
        return new _WebWindowEx(title, url, width, height, toolWindow);

    if (typeof title === 'object') {
        var ob = title;
        var visible = ob.visible;
        var x = ob.x, y = ob.y;
        log('VISIBLE', visible);
        title = ob.title, url = ob.source, width = ob.width, height = ob.height, toolWindow = ob.toolWindow;
    }

    var qml = _WebWindowEx.qml;

    // automatically apply a cache buster (if working from the local filesystem)
    if (/^file:/.test(qml))
        qml += '#' + [ ['','debug'][+exports.debug], new Date().getTime().toString(36)].join('&')
    else if (exports.debug)
        qml += '?debug=true';

    function _createSurrogateWindow() {
        return new OverlayWindow({
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
        webEventReceived: { enumerable: true, value: _window.webEventReceived || signal('webEventReceived') },
        visibilityChanged: { enumerable: true, value: visibilityChanged },
        visibleChanged: { enumerable: true, value: visibilityChanged },
        moved: { enumerable: true, value: _window.moved },
        resized: { enumerable: true, value: _window.resized },
        closed: { enumerable: true, value: _window.closed },
        $destroyed: { value: signal('$destroyed') },
    });

    _WebWindowEx.$windows.push(_window);
    this.$destroyed.connect(this, function() {
        var idx = _WebWindowEx.$windows.indexOf(_window);
        log('$destroyed -- removing $windows['+idx+']', _window);
        if (~idx) _WebWindowEx.$windows.splice(idx,1);
        this._window = null; // prevent further access from scripting
    });

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

    url && this.setURL(url);
    (width !== undefined && height !== undefined) && this.setSize(width, height);
    (x !== undefined && y !== undefined) && this.setPosition(x,y);
    title && this.setTitle(title);
    visible && this.setVisible(visible);
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

