//
//    snapshot-to-entity (proof-of-concept)
//    2016.08.20 humbletim
//
//    ... opens a QML Window dialog that listeners for screenshots
//     and offers to upload the latest one via ATP and generate an in-world
//     photoframe from it

Script.require.debug = true;
var addFrame = Script.require('./addFrame.js');
var observeLocation = Script.require('./observeLocation.js');

function log() { print('[SnapshotRezzer]', [].slice.call(arguments).join(' ')); }

var modelURL = 'http://192.241.189.145:8083/hifi/pod_frame.fbx#20160712';

var qmlURL = Script.resolvePath('').replace('.js','.qml');

// note: only useful during file: dev (forces .qml to be reloaded with the .js)
var cache_buster = /^file:/.test(qmlURL) ? '#'+new Date().getTime().toString(36) : '';

var window = new OverlayWindow({
    source: qmlURL + cache_buster,
    width: 480,
    height: 320,
    title: 'SnapshotRezzer v0.0.4'
});

window.fromQml.connect(function(event) {
    if (event.type === 'addFrame') {
        event.callback = function(frame) {
            window.sendToQml({ type: 'frameAdded', uuid: frame });
        };
        addFrame(event);
    } else if (event.type === 'close') {
        window.close();
        Script.stop();
    }
});

var controllerEvents = {
    API: Controller,
    keyPressEvent: function(evt) {
        Object.keys(evt).filter(function(x) { return /^is/.test(x); }).forEach(function(x) {
            //            print(x,
            controllerEvents[x] = evt[x]
                //print(x, evt[x]);
            //               );
        });
        //!evt.isAutoRepeat && log('keyPressEvent', JSON.stringify(evt));
    },
    keyReleaseEvent: function(evt) {
        Object.keys(evt).concat(Object.keys(controllerEvents)).filter(function(x) { return /^is/.test(x); })
            .forEach(function(x) {
                //    print(x,
                controllerEvents[x] = evt[x] || undefined
                //         );
            });
        //!evt.isAutoRepeat && log('keyReleaseEvent', JSON.stringify(evt));
    }
};

var entityEvents = {
    API: Entities,
    clickDownOnEntity: function cdoe(uuid, evt) {
        if (cdoe.busy)
            return;
        try {
            var location = JSON.parse(Entities.getEntityProperties(uuid, ['userData']).userData).location;
        } catch(e) {}
        if (controllerEvents.isControl && location && !controllerEvents.isShifted) {
            0&&log('controllerEvents', JSON.stringify({
                isShifted: controllerEvents.isShifted,
                isControl: controllerEvents.isControl,
                location: location
            },0,2));
            observeLocation(location);
        } else if ((controllerEvents.isShifted && controllerEvents.isControl) && location) {
            try {
                var str = Entities.getEntityProperties(uuid, ['textures']).textures;
                var src = JSON.parse(str).backlight;
            } catch(e) { print(e); }
            cdoe.busy = true;
            var tmp = Window.prompt('image src'+str, src||'');
            if (tmp) {
                var re = /^(https?|file|atp|data):/;
                if (!re.test(tmp))
                    tmp = '';
                Entities.editEntity(uuid, { textures: tmp ? JSON.stringify({ backlight: tmp }) : undefined });
            }
            Script.setTimeout(function() { cdoe.busy = false; }, 500);
        }
        //log('clickDownOnEntity', uuid, location, tmp);
    },
    clickReleaseOnEntity: function(uuid, evt) {
        try {
            var location = JSON.parse(Entities.getEntityProperties(uuid, ['userData']).userData).location;
        } catch(e) {}
        observeLocation(null);
        //log('clickReleaseOnEntity', uuid, location);
    },
    _holdingClickOnEntity: function(uuid, evt) {
        try {
            var location = JSON.parse(Entities.getEntityProperties(uuid, ['userData']).userData).location;
        } catch(e) {}
        log('holdingClickOnEntity', uuid, location);
    },
    mousePressOnEntity: function(uuid, evt) {
        try {
            var location = JSON.parse(Entities.getEntityProperties(uuid, ['userData']).userData).location;
        } catch(e) {}
        //log('mousePressOnEntity', uuid, location);
    },
    mouseReleaseOnEntity: function(uuid, evt) {
        try {
            var location = JSON.parse(Entities.getEntityProperties(uuid, ['userData']).userData).location;
        } catch(e) {}
        //log('mouseReleaseOnEntity', uuid, location);
    }
};

initialize();

///////////////////////////////////////////////////////////////////////////////

function $ManagedEvents(Events) {
    if (Events.$signals)
        return Events;
    Object.defineProperties(Events, {
        toString: { value: function() { return '['+this.API+']' } },
        _apply: { value: function(operation) {
            var self = this;
            self.$signals.forEach(function(signalName) {
                log(self, operation+'ing', signalName, typeof self[signalName]);
                self.API[signalName][operation](self, signalName);
            });
        }},
        connect: { value: function() { this._apply('connect'); } },
        disconnect: { value: function() { this._apply('disconnect'); }},
        $signals: { value: (function() {
            var ret = [];
            for(var signalName in Events) {
                if (/^[$_A-Z]/.test(signalName) || typeof Events[signalName] !== 'function')
                    continue;
                ret.push(signalName);
            }
            return ret;
        })() }
    });
    Events.connect();
    Script.scriptEnding.connect(Events, 'disconnect');
    return Events;
}

function initialize() {
    _entityEvents = new $ManagedEvents(entityEvents);
    _controllerEvents = new $ManagedEvents(controllerEvents);
}
