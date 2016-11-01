// -------------------------------------------------------------------
// mouse-invert.js
// -------------------------------------------------------------------
//
//  Inverts the Keyboard/Mouse vertical (pitch) directions.
//
//  note: this only affects the standard input controls
//        (some scripts use their own camera keybindings / controls)
//
//  -- humbletim @ 2016.10.31
// -------------------------------------------------------------------

// verbatim copy of the standard pitch-related channels
// $ curl -s https://raw.githubusercontent.com/highfidelity/hifi/master/interface/resources/controllers/keyboardMouse.json | grep PITCH_
var channels = [
    { "from": "Keyboard.S", "when": "Keyboard.Shift", "to": "Actions.PITCH_DOWN" },
    { "from": "Keyboard.W", "when": "Keyboard.Shift", "to": "Actions.PITCH_UP" },
    { "from": "Keyboard.Down", "when": "Keyboard.Shift", "to": "Actions.PITCH_DOWN" },
    { "from": "Keyboard.Up", "when": "Keyboard.Shift", "to": "Actions.PITCH_UP" },
    { "from": "Keyboard.MouseMoveUp", "when": "Keyboard.RightMouseButton", "to": "Actions.PITCH_UP" },
    { "from": "Keyboard.MouseMoveDown", "when": "Keyboard.RightMouseButton", "to": "Actions.PITCH_DOWN" },
    { "from": "Keyboard.TouchpadDown", "to": "Actions.PITCH_DOWN" },
    { "from": "Keyboard.TouchpadUp", "to": "Actions.PITCH_UP" },
];

// helper function to "literally" invert pitch directions
function invertPitch(jsonStr) {
    return jsonStr.replace(/(PITCH_)(UP|DOWN)/g, function(_, PITCH, DIR) {
        return PITCH + ['DOWN','UP'][+(DIR === 'DOWN')]
    });
}

// https://wiki.highfidelity.com/wiki/ParseMapping()
var mapping = Controller.parseMapping(
    invertPitch(JSON.stringify({
        name: 'mouse-invert-js',
        channels: channels.filter(Boolean),
    }))
);

mapping.enable();
Script.scriptEnding.connect(mapping, 'disable');
