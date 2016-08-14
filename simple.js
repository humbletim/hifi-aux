//
//    EinsteinRosenBridge -- Interface Client script example
//    2016.08.01 humbletim
//

Script.include(Script.resolvePath('EventBridgeAdapter.js'));

// 1. create your OverlayWebWindow per usual:
var window = new OverlayWebWindow({
    title: 'EinsteinRosenBridge Web Window',
    source: Script.resolvePath('simple.html'),
    width: 480,
    height: 240
});

////note: EinsteinRosenBridge in theory also works with classic WebWindows:
//  var window = new WebWindow('WebWin', Script.resolvePath('simple.html#'), 480, 240) ||
//  window.setVisible(true);

var webside; // shared Web-side methods

// 2. open a wormhole by passing the window and your options to EinsteinRosenBridge constructor:
var port = new EinsteinRosenBridge(window, {
    version: '0.0.0',
    key: 'interface-side',

    // "shared methods" automatically become available to the Web side (see simple.html)
    shared: {
        // share access for configuring Camera.mode
        setCameraMode: Camera.setModeString,

        // share access to the current hifi://location
        getCurrentLocation: function() {
            return Window.location;
        },

        // callback for receiving DOM events
        onClick: function(evt) {
            // generates a random web color
            function random_rgb() {
                function r() { return ~~(Math.random()*0xff) };
                return 'rgb('+[r(), r(), r()]+')';
            }

            print('onClick!', JSON.stringify(evt));
            if (evt.id) {
                // generate a random color locally
                // ... and applied it remotely using a jQuery.css proxy (that simple.html provides)
                webside.css('#'+evt.id, { backgroundColor: random_rgb() });
            }
        },

        // example of experimental support for the Deferred "promise" pattern
        asyncTest: function(x, y) {
            // returning a port.Deferred lets you start some long-running or async operation
            // ... and once finished later call either dfd.resolve(result) or dfd.reject(Error)
            return port.Deferred(function(dfd) {
                Script.setTimeout(function() {
                    dfd.resolve(x+y);
                    // dfd.reject(new Error('or could reject with an error'));
                }, 1000);
            });
        }
    },

    onload: function(async) {
        print('port.onload:' + this, async.key);
        print('shared methods:', async.methods.join(' | '));

        webside = async;

        // wiring example: this keeps the Web side informed of all Camera mode changes
        Camera.modeUpdated.connect(webside.modeUpdated);
        webside.modeUpdated(Camera.mode); // and value at startup

        // wiring example: switch the "axis" of the "jQuery flipper" (bottom) based on Camera mode
        Camera.modeUpdated.connect(function(mode) {
            webside.flip({ axis: /first/.test(mode) ? 'x' : 'y' });
        });
    },

    onerror: function(err) { print('port.onerror:' + err); },
    onopen: function(readyState) { print('port.onopen:' + readyState); },
    onclose: function(reason) { print('port.onclose:' + reason); },
    onmessage: function(event) { print('port.onmessage (unhandled):' + JSON.stringify(event)); },
});

window.closed.connect(Script, 'stop');
