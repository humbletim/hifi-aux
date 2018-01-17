// localStorage.js (see also localStorage.html)
//
// HTML5-like persistence layer for Client scripts (using a wrapped QML WebEngineView)
//
// standard:
//   localStorage.getItem(key)
//   localStorage.setItem(key, value)
//   localStorage.removeItem(key)
//   localStorage.length
//   localStorage.key(nth)
//
// non-standard:
//   localStorage.$ready(handler) // allows for async initialization
//
//
// -- humbletim @ 2016.10.14

var version = '0.0.2a';
var debug = typeof Settings === 'object' && Settings.getValue('localStorage/debug', false);

// inline test and usage example
localStorage_js_example = function localStorage_js_example() {
    //Script.include('localStorage.js');

    // wait until localStorage is $ready (before storing or retrieving any values)
    localStorage.$ready(function handler() {
        var key = 'test';

        print('localStorage keys', Object.keys(localStorage));

        // defining *new* values via direct property access is NOT supported:
        //   localStorage[key] = 'string'; // won't work!

        // instead, use the standard `setItem` method:
        localStorage.setItem(key, 'string');

        // once a key exists, it is then possible to replace it with direct property access:
        localStorage[key] = 'updated string';

        // reading values via direct properties works (or you can use `getItem`)
        var val = localStorage[key];
        var val2 = localStorage.getItem(key);

        print('localStorage.getItem('+key+')', val);
        print('localStorage["'+key+'"]', val2);

        // removing values via direct property is NOT supported:
        //   delete localStorage[key]; // won't work!

        // instead, use the standard `removeItem` method:
        localStorage.removeItem(key);

        print('//localStorage keys', Object.keys(localStorage));
    });
}

function log() { print(log.prefix + [].slice.call(arguments).join(' ')); }

// this derives current script filename (including any hash fragment)
try {
    throw new Error('stacktrace');
} catch(e) {
    var filename = e.fileName || '';
}
var basename = filename.split(/[?#]/)[0].split('/').pop();
log.prefix = '['+basename+'] ';

log(version, debug ? '(debug:'+debug+')' : '');

// sibling localStorage.html page
var HTML_URL = Script.resolvePath('').replace('.js', '.html');

// check for html= override to a different .html location
//   eg: Script.include('localStorage.js#html=http://yourdomain/localStorage.html');
//   note: only pages on the same domain can see the same localStorage values...
filename.replace(/\bhtml=([^&=]+[.]html[^&=]*)/, function(_, url) {
    HTML_URL = url;
});
log('HTML_URL', HTML_URL);

// inline .bind polyfill
Function.prototype.bind = Function.prototype.bind||function(){var fn=this,s=[].slice,a=s.call(arguments),o=a.shift();return function boundFunc(){return fn.apply(o,a.concat(s.call(arguments)))}};

// NOTE: coincidentally WebEngineView stores localStorage data as a simple SQLite3 database
//  You can find it under QtWebEngine/ (a sibling of the Logs/ folder)
//  On Linux that would be:
//    ~/.local/share/High Fidelity/Interface/Logs/ <-- reference point
//    ~/.local/share/High Fidelity/Interface/QtWebEngine/qmlWebEngine/Local Storage/*.localstorage

function _Storage(url) {
    var synced = false;

    var window = new OverlayWebWindow({
        title: 'localStorage', source: 'about:blank',
        width: 0, height: 0, visible: false
    });

    // defined as non-enumerable properties
    // (so they don't show up in Object.keys or JSON.stringify(localStorage)
    Object.defineProperties(this, {
        $url: { value: url },
        $callbacks: { value: { ready: [ function(s){ debug&&log('ready!', s); }] } },
        $synced: { get: function() { return synced }, set: function(nv) { synced=nv; } },
        $window: { value: window }
    });
    this.$window.webEventReceived.connect(this, 'onWebEventReceived');
    this.$window.setURL(url.replace(/[.]html\b/,'.html?'));
};

_Storage.prototype = Object.defineProperties({
    toString: function() { return '[localStorage '+Object.keys(this)+(this.$synced?' (synced)':'')+']'; },

    // enable Client scripts to be notified when localStorage becomes available
    $ready: function(callback) {
        if (callback) {
            if (this.$synced)
                this.$try(callback);
            else {
                //log('$ready -- !synced, queued handler');
                this.$callbacks.ready.push(callback);
            }
        }
        return this.$synced;
    },

    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/key
    key: function(n) {
        return Object.keys(this)[n];
    },

    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem
    getItem: function(key) { return this[key]; },

    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem
    setItem: function(key, value) {
        if (this[key] !== value)
            this[key] = value;
        this.$withCallback({
            setItem: key,
            value: value,
        }, function(ret) {
            //log('stored...', key, ret);
        });
    },

    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/removeItem
    removeItem: function(key) {
        delete this[key]// = undefined;
        this.$withCallback({
            removeItem: key
        }, function(ret) {
            //log('removed...', key, ret);
            //delete this[key];
        });
    },

    $try: function tryit(callback) {
        //log('$try', callback);
        try { callback.call(this, this); }
        catch(e) { log('$ready error:', e); }
    },
    $withCallback: function(msg, callback) {
        msg.id = msg.id || new Date().getTime().toString(36);
        this.$callbacks[msg.id] = function(ret) {
            try { callback.call(this, ret); } finally {
                delete this.$callbacks[msg.id];
            }
        }.bind(this);
        this.$window.emitScriptEvent(JSON.stringify(msg));
    },

    // mini RPC service of EventBridge
    onWebEventReceived: function(str) {
        //log('webEventReceived', (str+'').substr(0,60)+'...');
        try {
            var msg = JSON.parse(str);
            var result;
            if (msg.localStorage) {
                //log('sync...', Object.keys(msg.localStorage));
                // clear out the previous values
                Object.keys(this).forEach(function(k) { delete this[k]; }.bind(this));
                // setup the new values
                var last = msg.localStorage;
                Object.keys(msg.localStorage).forEach(function(k) {
                    Object.defineProperty(this, k, {
                        enumerable: true,
                        configurable: true,
                        get: function() { return last[k]; },
                        set: function setter(nv) {
                            if (setter.busy) return;
                            setter.busy = true;
                            debug&&log('...set via existing property', k, nv);
                            this.setItem(k, last[k] = nv);
                            setter.busy = false;
                        }
                    }) ;
                    //this[k] = msg.localStorage[k];
                }.bind(this));
                result = true;
            }
            if (msg.id) {
                if (this.$callbacks[msg.id]) {
                    //log('$callbacks['+msg.id+']...', str);
                    this.$callbacks[msg.id].call(this, msg);
                } else
                    this.$window.emitScriptEvent(JSON.stringify({ id: msg.id, result: result }));
            }
        } catch(e) {
            log('webEvent error', msg, e);
        }

        if (!this.$synced) {
            //log('$synced!', this, this.$callbacks.ready && this.$callbacks.ready.length);
            this.$synced = true;
            if (this.$callbacks.ready)
                this.$callbacks.ready.forEach(this.$try.bind(this));
            delete this.$callbacks.ready;
        }
    },
},{
    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/length
    length: {
        enumerable: true,
        get: function() { return Object.keys(this).length; }
    }
});

try {
    // export as a module
    module.exports = localStorage;
} catch(e) {
      // export as a global for Client script access
    localStorage = new _Storage(HTML_URL);
}
