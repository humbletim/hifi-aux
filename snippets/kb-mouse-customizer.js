location.protocolVersion = Window.protocolSignature;
// work in progress

// -------------------------------------------------------------------
// kb-mouse-customizer.js
// -------------------------------------------------------------------
//
//  An experiment for quickly testing lots of keyboard/mouse configs.
//  (specifically those that can be expressed in terms of scaling)
//
//  Examples configs:
//
//  - Inverted mouse look + less sensitivities:
//      kb-mouse-customizer.js?y=-1,k=.5,ky=-1,ksy=-.5,m=.125,t=.5
//
//  - "Healthy Fingers" mode (for Richard.Raymaker to try)
//      kb-mouse-customizer.js?m=.25,healthyfinger=1
//
//  - Secondary Shift Precision mode (scales mouse down if Shift pressed)
//      kb-mouse-customizer.js?m=.25,shift=.25
//
//  NOTE: To get a raw JSON dump of the generated mapping add ", dump=json"
//
//  Summary of scaling factors (applied cumulatively if specified):
//   * x/y/z        scales everything on that axis
//   * m/k/t        scales all axes for mouse/keyboard/touchpad
//   * rx/rx/rz     scales that axis in right mouse button mode
//   * sx/sy/sz     scales that axis in shift key mode
//   * mx/my/mz     scales that mouse axis
//   * kx/ky/kz     scales that keyboard axis
//   * tx/ty/tz     scales that touchpad axis
//   * ksx/ksy/ksz  scales that keyboard axis in shift key mouse
//   * mrx/mry/mrz  scales that mouse axis in right mouse button mode
//   * healthyfinger -- turns "mouselook" on by default
//     (when !(SnapTurn | NavigationFocused| Shift | MiddleMouseButton))
//   * shift -- additional SHIFT key scaling for right mouse / wheel
//
//  -- humbletim @ 2016.11.01
// -------------------------------------------------------------------

Script.include('extract-parameters.js');
Script.include('highlightjs-window.js#');

log = function(ob) {
    print('kb-mouse-customizer', JSON.stringify(ob), [].slice.call(arguments, 1).join(' '));
    Messages.sendLocalMessage(Settings.getValue('log-redirector','test.js'), JSON.stringify(ob));
};

Function.prototype.bind = Function.prototype.bind||function(){var fn=this,s=[].slice,a=s.call(arguments),o=a.shift();return function(){return fn.apply(o,a.concat(s.call(arguments)))}};

try { throw new Error('stack'); } catch(e) {
    var filename = e.fileName;
    Script.include('http://cdn.xoigo.com/hifi/analytics.min.js');
    try { ua.used(extractParameters(e.fileName)); } catch(e) { log('ERROR:',e); }
}

if (!/[?#]/.test(filename)) {
    filename = Window.prompt('kb-mouse-customizer', Settings.getValue('kb-mouse-customizer', 'mouse.y=-1, touch.y=-1, keyboard.shift.y=-1, mouse=.125'));
    if (filename)
        Settings.setValue('kb-mouse-customizer', filename);
    else
        Script.stop();
}

log(filename);

var spec = filename.replace(/^(file|http)[^?#]+[?#]/,'');
var normalized = spec
    .replace(/shift\s*[=:]/ig,'Shift=')
    .replace(/(mouse|touch(?:pad)?|keyboard|right)/g,function(x) { return x.substr(0,1) })
    .replace(/[\/|,; ]+/g,'&')
    .replace(/([a-z])[.]/g, '$1')
    .replace(/:/g,'=');

log(normalized);

params = extractParameters(normalized)

params.scale = (isFinite(params.scale) && params.scale) || 1.0;
params.x = params.x || 1.0;
params.y = params.y || 1.0;
params.z = params.z || 1.0;

params.Shift = (isFinite(params.Shift) && params.Shift) || 1.0;
params.mboom = params.mboom || -.2;
params.kboom = params.kboom || .01;
var scale = {
    mouse: recompose_axis('m'),
    touchpad: recompose_axis('t'),
    keyboard: recompose_axis('k'),
};

var channels = [
].concat([
    // WASD | ULDR
    {
        from: { makeAxis: [
            ["Keyboard.W", "Keyboard.Up"],
            ["Keyboard.S", "Keyboard.Down"]
        ]},
        to: "Actions.LONGITUDINAL_BACKWARD",
        filters: scale.keyboard.yfilter
    },
    {
        from: { makeAxis: [
            ["Keyboard.A", "Keyboard.Left"],
            ["Keyboard.D", "Keyboard.Right"]
        ]},
        to: "Actions.Yaw",
        filters: scale.keyboard.xfilter
    },
    // SHIFT + (WASDEC | ULDR)
    SHIFTED({
        from: { makeAxis: [
            ["Keyboard.A", "Keyboard.Left"],
            ["Keyboard.D", "Keyboard.Right"]
        ]},
        to: "Actions.LATERAL_RIGHT",
        filters: scale.keyboard.sxfilter
    }),
    SHIFTED({
        from: { makeAxis: [
            ["Keyboard.W", "Keyboard.Up"],
            ["Keyboard.S", "Keyboard.Down"]
        ]},
        to: "Actions.Pitch",
        filters: scale.keyboard.syfilter
    }),
    SHIFTED({
        from: { makeAxis: [
            ["Keyboard.E"],
            ["Keyboard.C"]
        ]},
        to: "Actions.BOOM_OUT",
        filters: RESCALE(scale.keyboard.zfilter, params.kboom)
    }),
]).concat([
    // MOUSE WHEEL
    {
        from: { makeAxis: ["Keyboard.MouseWheelLeft", "Keyboard.MouseWheelRight"] },
        to: "Actions.BOOM_OUT",
        filters: RESCALE(scale.mouse.zfilter, params.mboom)
    },

    // TOUCHPAD (which I don't have at moment so these are purely speculative)
    {
        from: { makeAxis: ["Keyboard.TouchpadUp", "Keyboard.TouchpadDown"] },
        to: "Actions.Pitch",
        filters: scale.touchpad.yfilter
    },
    {
        from: { makeAxis: ["Keyboard.TouchpadLeft", "Keyboard.TouchpadRight"] },
        to: "Actions.Yaw",
        filters: scale.touchpad.xfilter
    },

    // RIGHT MOUSE BUTTON + MOUSE MOVE
    RMB({
        from: { makeAxis: (
            ["Keyboard.MouseMoveLeft", "Keyboard.MouseMoveRight"]
        )},
        to: "Actions.Yaw",
        filters: scale.mouse.rxfilter
    }),
    RMB({
        from: { makeAxis: (
            ["Keyboard.MouseMoveUp", "Keyboard.MouseMoveDown"]
        )},
        to: "Actions.Pitch",
        filters: scale.mouse.ryfilter
    }),
]).concat( params.Shift && params.Shift !== 1.0 && LABEL("High Precision secondary mode ("+params.Shift+")", [
    // SHIFT + (RIGHT MOUSE BUTTON | MOUSE WHEEL)
    //  (increases mouse accuracy when SHIFT key is added to RIGHT MOUSE BUTTON)
    SHIFTED(RMB(
        {
        from: { makeAxis: (
            ["Keyboard.MouseMoveLeft", "Keyboard.MouseMoveRight"]
        )},
        to: "Actions.Yaw",
            filters: RESCALE(scale.mouse.rxfilter, params.Shift)
        }
    )),
    SHIFTED(RMB({
        from: { makeAxis: (
            ["Keyboard.MouseMoveUp", "Keyboard.MouseMoveDown"]
        )},
        to: "Actions.Pitch",
        filters: RESCALE(scale.mouse.ryfilter, params.Shift)
    })),
    SHIFTED({
        from: { makeAxis: ["Keyboard.MouseWheelLeft", "Keyboard.MouseWheelRight"] },
        to: "Actions.BOOM_OUT",
        filters: RESCALE(scale.mouse.zfilter, params.mboom * params.Shift)
    }),
])).concat(/healthy/.test(params.$url.href) && LABEL("Richardus.Raymaker mode!!", (
    // HEALTHY FINGER MODE
    ANYWHEN(
        ["Keyboard.MiddleMouseButton", "Application.NavigationFocused", "Application.SnapTurn", "Keyboard.Shift"],
        {
            from: { makeAxis:  ["Keyboard.MouseMoveLeft", "Keyboard.MouseMoveRight"] },
            // hackaround -- this route cancels-out the below route when any of the conditions above are true
            // (looked for an actual noop endpoint... but this "Grounding" rod seems to do the trick for now)
            to: "Application.Grounded",
            filters: scale.mouse.rxfilter
        },
        {
            from: { makeAxis:  ["Keyboard.MouseMoveUp", "Keyboard.MouseMoveDown"] },
            to: "Application.Grounded",
            filters: scale.mouse.ryfilter
        }
    ).concat([
        {
            from: { makeAxis: ["Keyboard.MouseMoveLeft", "Keyboard.MouseMoveRight"] },
            to: "Actions.Yaw",
            filters: scale.mouse.rxfilter
        },
        {
            from: { makeAxis: ["Keyboard.MouseMoveUp", "Keyboard.MouseMoveDown"] },
            to: "Actions.Pitch",
            filters: scale.mouse.ryfilter
        },
    ])
)));

function LABEL(label, o) {
    if (Array.isArray(o))
        return o.map(function(o) { return LABEL(label, o); });
    else {
        o.comment = label;
        return o;
    }
}

function recompose_axis(name) {
    var s = params[name] || 1.0;
    s = isFinite(s) ? s : 1.0;
    var axis = params.$object[name] || {};
    axis.scale = axis.scale || s;
    'x,y,z,rx,ry,rz,sx,sy,sz'.split(',').forEach(function(p) {
        axis[p] = (axis[p] || params[name+p] || 1.0);
        if (p.length > 1)
            axis[p] *= axis[p.substr(-1)]
        else
            axis[p] *= params[p.substr(-1)]
        Object.defineProperty(axis, p+'filter', { enumerable: true, get: function() {
            return { "type": "scale", "scale": this[p] * this.scale * params.scale };
        }});
    });
    return axis;
}

function ANYWHEN(arr, route) {
    return [].slice.call(arguments, 1).map(function(route) {
        return arr.map(function(when) {
            var tmp = JSON.parse(JSON.stringify(route));
            tmp.when = when;
            return tmp;
        });
    }).reduce(function(out, v) { return out.concat(v); }, []);
}

function RESCALE(filter, scale) {
    filter = JSON.parse(JSON.stringify(filter));
    filter.scale *= scale;
    return filter;
}

function SHIFTED(o) {
    o.when = [o.when,"Keyboard.Shift"].reduce(function(out,v) { return out.concat(v) },[]).filter(Boolean);
    return o;
}

function RMB(o) {
    o.when = [o.when,"Keyboard.RightMouseButton"].reduce(function(out,v) { return out.concat(v) },[]).filter(Boolean);
    return o;
}

           
function size(o) {
    if (!o) return 0;
    if (typeof o === 'string') return 1;
    if (Array.isArray(o)) return o.length;
    throw new Error('size huh? '+JSON.stringify(o));
}

// -------------------------------------------------------------------
// note: routes need to be sorted into "most complex first" ordering
//   (so that less-specific rules run last)
channels = channels.filter(Boolean).sort(function(a,b) {
    var A = size(a.when), B = size(b.when);
    return A < B ? -1 : A > B ? 1 : 0;
}).reverse();

var _name = (Account.username + '-mapping').replace(/[^-A-Z0-9a-z_]/g,'_')+'.json';

var _mapping = {
    name: _name,
    channels: channels,
};

var json = JSON.stringify(_mapping,0,2);

var YYYYMMDDHHMMSS = new Date().toJSON().match(/\d/g).slice(0,14).join('');

if (params.dump)
    new HighlightJSWindow({
        filename: YYYYMMDDHHMMSS+'-'+_mapping.name,
        code: json
    });

var oid = Overlays.addOverlay('text', {
    text: '     '+spec,
    font: { size: 8 },
    y: -10,
    color: { red: 0x11, green: 0x11, blue: 0x11 },
    backgroundColor: { red: 0xff, green: 0xff, blue: 0xff },
});
Script.scriptEnding.connect(Overlays.deleteOverlay.bind(Overlays,oid));

var basename = extractParameters(Script.resolvePath('')).$url.basename;
function reload() {
    ScriptDiscoveryService.getRunning()
        .filter(function(s){
            return ~s.path.indexOf(basename);
        })
        .forEach(function(s,i) {
            log([i,basename,s.path]);
            ScriptDiscoveryService.stopScript(s.path, !i);
        });
}
function ifoverlay(evt) {
    var id = Overlays.getOverlayAtPoint(evt);
    if (id !== oid) return;
    if ((+new Date - ifoverlay.last) < 1250) {
        if (++ifoverlay.slowclicks > 1) {
            ifoverlay.slowclicks = ifoverlay.last = 0;
            log('reloading...'+JSON.stringify(evt));
            reload();
        }
    } else
        ifoverlay.slowclicks = 0;
    var v = 1-ifoverlay.slowclicks/3;
    Overlays.editOverlay(oid, { backgroundAlpha: v });
    if (ifoverlay.to) Script.clearTimeout(ifoverlay.to);
    ifoverlay.to = Script.setTimeout(function() {
        ifoverlay.to = null;
        Overlays.editOverlay(oid, { backgroundAlpha: .5 });
    },2500);
        
    ifoverlay.last = +new Date;
}
ifoverlay.slowclicks = 0;
Controller.mousePressEvent.connect(ifoverlay);
Script.scriptEnding.connect(Controller.mousePressEvent.disconnect.bind(Controller.mousePressEvent, ifoverlay));

var ts = Overlays.textSize(oid, spec);
ts.x = Overlays.width() - ts.width/2;
ts.y = 0;//Overlays.height() - ts.height;
ts.height = ts.height / 2 * 1.2;
ts.width *= .8;
Overlays.editOverlay(oid, ts);

var mapping = Controller.parseMapping(json)
log(channels.length);
Script.scriptEnding.connect(mapping, 'disable');
mapping.enable();
