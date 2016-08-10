//
//    Seamless HTML5 UI toolbar: The Client Script
//    2016.08.01 humbletim 
//

// NOTE: plan is to spilt OverlayWebWindowEx into its own module later
//   ... for now, all Client side code is inlined below for gisting

// note: base36 cache buster helps keep URL and line numbers visually distinct in error messages
var cache_buster = /^file:/.test(Script.resolvePath('.')) ?
    '#' + (+ new Date()).toString(36) : '';

// create an OverlayWebWindowEx "Seamless HTML5 UI toolbar" window
var window = new _OverlayWebWindowEx({
    userAgent: 'Some UserAgent',
    source: Script.resolvePath('index.html' + cache_buster),
    x: 50,
    y: 50,
    width: 480,
    height: 240,

    //title: 'hi there', // thin frame has no title
    //chrome: false, // wishful thinking

    // Web -> Script events will arrive here
    onmessage: function(event) {
        print(event.origin + ' -> ' + event.target, 'message:', JSON.stringify(event.data));
        if (event.data === 'ping')
            this.postMessage('pong! local time is: ' + new Date, event.origin);
    }
});

// send a Script -> Web message
window.postMessage('hi there from the Client Script!', 'web');

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// OverlayWindow -> OverlayWebWindowEx adaptor class
// TODO: proxy moved, sized, closed, etc. signals over the QML channel
// (export as global for later Script.include use)
OverlayWebWindowEx = _OverlayWebWindowEx;

function _OverlayWebWindowEx(options) {
    var window = new OverlayWindow({
        source: Script.resolvePath('OverlayWebWindowEx.qml' + cache_buster),
        width: options.width || 400,
        height: options.height || 200,
        visible: options.visible || true,
        title: options.title || 'OverlayWebWindowEx',
        x: options.x,
        y: options.y
    });

    window._postMessage = function(message, targetOrigin) {
        window.sendToQml(JSON.stringify({
            target: targetOrigin || '*',
            data: message,
            source: 'script',
            tstamp: +new Date
        }));
    };

    // queue web-destined messages until first signal from Web side is received
    var toPost = [];
    window.postMessage = function(message, targetOrigin) {
        if (targetOrigin === 'web' || targetOrigin === '*')
            toPost.push([message, 'web']);
        if (targetOrigin === 'qml' || targetOrigin === '*')
            window._postMessage(message, targetOrigin);
    };

    window.fromQml.connect(function(data) {
        //print('fromQml!!', typeof data, JSON.stringify(data));
        data.origin = data.source || '[qml]';
        data.target = data.target || '*';
        data.tstamp = data.tstamp || + new Date;
        delete data.source;

        if (data.origin === 'qml' && data.data && data.data.property) {
            var msg = data.data;
            print('$property', msg.property, msg.value);
            window['$'+msg.property] = msg.value;
        }
        else if (data.target === '*' || data.target === 'script')
            window.onmessage(data);
        else
            print('... unhandled case: ', JSON.stringify({ origin: data.origin, target: data.target }))
    });

    window.onmessage = function(event) {
        print('(debug) first window.onmessage', event.tstamp, event.origin + ' -> ' + event.target, event.data);
        options.onmessage && options.onmessage.call(this, event);

        print('draining queue of #' + toPost.length + ' messages');
        window.postMessage = window._postMessage;
        toPost.slice(0, toPost.length).forEach(function(args) {
            window.postMessage(args[0], args[1]);
        });
        window.onmessage = options.onmessage || function() {};
        window.postMessage('synchronized with Client Script!', 'web');
    };

    Object.defineProperties(window, {
        toString: function() { return '[OverlayWebWindowEx url='+this.$url+' title='+this.$title+']'; },
        url: {
            get: function() { return window.$url },
            set: function(nv) { window.postMessage({ rpc: 'setURL', args:[nv] }, 'qml') }
        },
        title: { get: function() { window.$title; } }
    });

    window.setURL = function(url) { window.url = url; };
    window.setTitle = function() { throw new Error('seamless .title property is readonly and set by documents <title>tag</title>'); };

    if (options.userAgent)
        window.postMessage({ rpc: 'setUserAgent', args:[options.userAgent] }, 'qml');
    if (options.source)
        window.url = options.source;
    if ('x' in options)
        window.setPosition(options.x, options.y);
    window.setSize(options.width, options.height);
    return window;
}
