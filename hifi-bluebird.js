//
//  hifi-bluebird.js
//
//  Created by humbletim on 01 Jul 2016
//
//  This HiFi polyfill loads the bluebird.js Promises implementation via CDN
//    see: https://github.com/petkaantonov/bluebird/
//    see: 'https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.4/bluebird.js'

var CDNURL = 'https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.4/bluebird.js';

// inline polyfill for function.bind
if (!Function.prototype.bind)
    Function.prototype.bind = function(){
        var fn=this,a=[].slice.call(arguments),o=a.shift();return function(){return fn.apply(o,a.concat([].slice.call(arguments)));};
    };

var log = print.bind(this, '[hifi-bluebird]');

// before overridding let's capture any existing global variable called 'self'
try {
    var oldself = self;
} catch(e) {}

self = this;
log('... loading Promise (bluebird) via cdnjs');
Script.include(CDNURL);
Promise = this.Promise;
self = oldself;

if (typeof Promise !== 'function')
    throw new Error('Promise !== function '+[typeof Promise, typeof P, typeof self.Promise]);

log('... Promise loaded');

// bluebird requires a "scheduler" which here I polyfill via Script.update
Promise.setScheduler(function(fn) {
    Script.update.connect(function once() {
        Script.update.disconnect(once);
        fn();
    });
});
log('Promise.setScheduler set to use Script.update');

// FIXME: HiFi's native Script.setTimeout and async XMLHttpRequests don't play nice together
//   (and currently seems to crash Interface very regularly when used)
//// setTimeout = Script.setTimeout;
//// clearTimeout = Script.clearTimeout;

if (typeof setTimeout === 'function')
    throw new Error('are you sure your existing setTimeout global function is thread-safe? (if so comment-out this guard)');
    
// polyfills for setTimeout/clearTimeout -- again using Script.update as a clock source
setTimeout = function(func, ms) {
    timer.pending = ms/1000;
    timer.at = +new Date + ms;
    timer.cleared = 0;
    timer.connected = true;
    Script.update.connect(timer);
    return timer;
    function timer(dt) {
        if (timer.cleared !== 0) {
            if (timer.connected !== false) {
                timer.connected = false;
                Script.update.disconnect(timer);
            }
        }
        timer.pending -= dt;
        if (+new Date() >= timer.at) {
            Script.update.disconnect(timer);
            func();
        }
    }
};

clearTimeout = function(func) {
    //log('clearTimeout ', func.pending, func.cleared);
    var old = func.cleared;
    func.cleared++;
    return !old;
};

log('global setTimeout/clearTimeout set to use Script.update');

log('//finished loading');
