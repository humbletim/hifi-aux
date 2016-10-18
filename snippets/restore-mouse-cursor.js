// restoreMouseCursor.js
//
// restoreMouseCursor() attempts to bring the desktop mouse cursor back
// (including when using a real mouse from HMD mode)
//
//  -- humbletim @ 2016.10.18

var version = '0.0.0';
function log() { print('restore-mouse-cursor |', [].slice.call(arguments).join(' ')); }

Function.prototype.bind=Function.prototype.bind||function(){var fn=this,s=[].slice,a=s.call(arguments),o=a.shift();return function(){return fn.apply(o,a.concat(s.call(arguments)))}};

var global = (1,eval)('this');
global.restoreMouseCursor = restoreMouseCursor; // export

try { throw new Error('stack'); } catch(e) {
    var scriptURL = e.fileName || Script.resolvePath('');
    var debug = /debug/.test(scriptURL);
    var at = (scriptURL.match(/at=([^&?#]+)/)||[])[1];
}

log('version', version, scriptURL.replace(/^[^#?]+/,''));

if (at === 'both' || at === 'start') {
    log('restoring mouse cursor at start');
    restoreMouseCursor(debug);
} else if (at === 'both' || at === 'stop') {
    log('arranging to restore mouse cursor when script is stopped');
    Script.scriptEnding.connect(restoreMouseCursor.bind({}, debug));
} else {
    log('NOTE: assuming Script.include mode; call restoreMouseCursor()');
}

function restoreMouseCursor(debug) {
    log('restoring mouse cursor');
    // make sure the mouse is being "captured" by the application
    Reticle.allowMouseCapture = true;

    // make sure the cursor becomes visible again
    Reticle.visible = true;

    // reposition cursor to the exact point (in HUD space) that the user is looking at
    // (note that in HMD mode this can fall beyond the standard overlay area)
    var eyecontact = HMD.overlayFromWorldPoint(
        Vec3.sum(Camera.position, Quat.getFront(Camera.orientation))
    );
    Reticle.position = eyecontact;
    debug && log(JSON.stringify(Reticle,0,2));
}
