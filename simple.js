//
//    EinsteinRosenBridge -- Interface Client script example
//    2016.08.01 humbletim
//

Script.include(Script.resolvePath('EventBridgeAdapter.js'));

// helper that generates a random web color
function random_rgb() {
    function r() { return ~~(Math.random()*0xff) };
    return 'rgb('+[r(), r(), r()]+')';
}

// 1. create your OverlayWebWindow per usual:
var window = new OverlayWebWindow({
    title: 'EinsteinRosenBridge Web Window',
    source: Script.resolvePath('simple.html'),
    width: 480,
    height: 240
});

// 2. open a wormhole by passing the window and your options to EinsteinRosenBridge constructor:
var port = new EinsteinRosenBridge(window, {
    version: '0.0.0',
    key: 'interface-side',

    // "shared methods" automatically become available to the Web side (see simple.html)
    shared: {
        // example: let Web side set new Camera mode strings
        setCameraMode: Camera.setModeString,

        // example: listen for DOM events from the Web side
        onclick: function(evt) {
            print('onclick!', JSON.stringify(evt));
            if (evt.id) {
                // pick a random color (locally) and then have the Web side apply it for us...
                port.async.css('#'+evt.id, {
                    backgroundColor: random_rgb()
                });
            }
        },

        // example: let Web side query current hifi://location
        getCurrentLocation: function() {
            return Window.location;
        }
    },

    onload: function(api) {
        // api === port.async

        print('port.onload! ' + api.key);

        // wiring example: keep Web side informed of all Camera mode changes
        Camera.modeUpdated.connect(api.modeUpdated);
        api.modeUpdated(Camera.mode);

        // wiring example: switch the "axis" of the "jQuery flipper" (bottom) based on Camera mode
        Camera.modeUpdated.connect(function(mode) {
            api.flip({ axis: /first/.test(mode) ? 'x' : 'y' });
        });
    },

    onerror: function(err) {
        console.error('port.onerror:' + err);
    }
});

window.closed.connect(Script, 'stop');
