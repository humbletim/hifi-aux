observeLocation = _observe; // export
observeLocation.$Thread = $Thread;
observeLocation.decodeURL = decodeURL;
function _observe(location) {
    var ctx = _observe._observing;

    if (ctx) {
        if (location)
            _observe(null);
        else {
            print('unobserving', ctx.location);
            if (ctx.thread)
                ctx.thread.stop('unobserving');
            var cam = ctx.Camera;
            for(var p in cam) {
                print('restoring Camera.'+p, cam[p])
                Camera[p] = cam[p];
            }
            var my = ctx.MyAvatar;
            for(var p in my) {
                print('restoring MyAvatar.'+p, my[p])
                MyAvatar[p] = my[p];
            }
            return _observe._observing = null;
        }
    }
    if (!location)
        return;
    var ctx = _observe._observing = {
        camera: decodeURL(location),
        Camera: {
            mode: Camera.mode,
            position: Camera.position,
            orientation: Camera.orientation
        },
        MyAvatar: {
            audioListenerMode: MyAvatar.audioListenerMode
        }
    };
    var cam = ctx.camera;
    cam.mode = 'independent';
    var audioListenerMode = MyAvatar.audioListenerModeCamera;
    print('observing', location);
    print('setting Camera to:', JSON.stringify(cam,0,2));
    return ctx.thread = new $Thread({
        ctx: ctx,
        id: 'camera tweener',
        onerror: function(evt) {
            print(this.id, 'ERROR:', evt.exception);
        },
        onstarted: function(evt) {
            this.step(0); // workaround Interface bug where Script.updatedesktop-save


        },
        step: function(dt) {
            Camera.mode = cam.mode;
            Camera.position = cam.position;
            Camera.orientation = cam.orientation;
            MyAvatar.audioListenerMode = audioListenerMode;
            this.stop('done');
        }
    });
}

function $Thread(main) {
    var self;
    if (main && typeof main === 'object') {
        self = Object.create(main);
    } else if (typeof main === 'function') {
        self = this;
        self.step = main;
    }
    self.id = self.id || 'thread-'+ new Date().getTime().toString(36);
    self.$step = function(dt) {
        if (!self.step || self.stopped) return;
        try {
            self.step(dt);
        } catch(e) {
            print('thread error:', self.id, e);
            var stop = true;
            if (self.onerror)
                self.onerror({
                    type: 'error', target: self, detail: data, timeStamp: self.started,
                    exception: e, source: e, preventDefault: function() { stop=false; }
                });
            if (stop)
                self.stop(e);
        }
    };
    self.stop = function(exitCode) {
        self.exitCode = exitCode;
        if (self.stopped) {
            print('warning: thread already stopped', self.id);
            return self;
        }
        Script.update.disconnect(self, '$step');
        self._started = self.started; self.started = undefined;
        self.stopped = +new Date;
        print('//thread stopped', self.id, self.stopped, self.exitCode);
        if (self.onstopped)
            self.onstopped({ type: 'stop', target: self, detail: exitCode, timeStamp: self.stopped });
        return self;
    };
    self.start = function(data) {
        if (self.started) {
            data && print('warning: thread already started (.start(data) data argument will be ignored...)', self.id);
            self._data = self._data || data;
            return self;
        }
        self._stopped = self.stopped; self.stopped = undefined;
        self.started = +new Date;
        self.data = data;
        Script.update.connect(self, '$step');
        print('thread started', self.id, self.started, 'typeof self.data: ' + self.data);
        if (self.onstarted)
            self.onstarted({ type: 'start', target: self, detail: data, timeStamp: self.started });
        return self;
    };
    if (!self.step && main === 'deferred') {
        print('will autostart thread when .step is first assigned', self.id);
        Object.defineProperties(self, {
            step: {
                configurable: true,
                set: function(nv) {
                    self.step = nv;
                    print('autostarting thread', self.id);
                    self.start(main);
                }
            }
        });
    } else if (self.step && self.started !== false) {
        self.start('.constructor');
    }
    return self;
}

function decodeURL(hifiLocation) {
    var tmp = hifiLocation.split('//')[1],
        hpo = tmp.split('/'),
        host = hpo.shift(),
        pos = _xyzwify( hpo.shift().split(',') ),
        rot = _xyzwify( hpo.shift().split(',') );
    return Object.defineProperties({
        position: Vec3.sum(Vec3.ZERO, pos),
        orientation: Quat.normalize(rot)
    }, {
        location: { configurable: true, value: hifiLocation },
        host: { configurable: true, value: host }
    });
    function _xyzwify(arr) {
        ['x','y','z','w'].forEach(function(k,i) { arr[k] = arr[i]; }); return arr;
    }
}

try { module.exports = _observe; } catch(e) {}
