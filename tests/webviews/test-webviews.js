// test-webviews.js -- Interface Client test script
//
// Created by humbletim on 31 Jul 2016
//
// This script creates various kinds of similar-sized web views.
// Each includes a countdown timer (to test scripting) and can be clicked (to test interactivity)
//
// (close either the WebWindow or OverlayWebWindow to terminate this script)

Script.scriptEnding.connect(atexit);

var UUID = Uuid.generate(),
    front = Vec3.sum(MyAvatar.position, Quat.getFront(MyAvatar.orientation)),
    offset = Quat.getRight(MyAvatar.orientation);

// Web Entity
var id = Entities.addEntity({
    type: 'Web',
    name: 'test-webviews.js Web Entity',
    sourceUrl: mkDataURI('Web Entity', 'steelblue', 'transform: scale(6);'),
    dimensions: { x: 4/3, y: 3/4, z: .1 },
    position:  Vec3.sum(front, offset),
    rotation: MyAvatar.orientation,
    lifetime: 60
});
atexit(function() { Entities.deleteEntity(id); });

// Web3D Overlay
var oid = Overlays.addOverlay("web3d", {
    url: mkDataURI('web3d Overlay', 'orange', 'transform:scale(3);'),
    size: { width: 3, height: 2 },
    position: Vec3.sum(front, Vec3.multiply(-1, offset)),
    rotation: MyAvatar.orientation
});
atexit(function() { Overlays.deleteOverlay(oid); });

// WebWindow / OverlayWebWindow
function webwindow(type, offset) {
    var win = new this[type](type, 'about:blank', 300, 150);
    win.setPosition(32 + offset*200, 32);
    win.setVisible(true);
    win.setURL(mkDataURI(type, ['pink', 'lime'][offset]));

    // grr ... this signal only works for WebWindows (not OverlayWebWindows)
    // ... and it doesn't actually mean the WebWindow's resources will be freed :(
    win.closed.connect(Script, 'stop');

    win.visibleChanged && win.visibleChanged.connect(function() {
        win.autoclose && Script.clearTimeout(win.autoclose);
        print('visibleChanged', win, win.visible);
        if (!win.visible)
            win.autoclose = Script.setTimeout(function() { win.autoclose = null; if (!win.visible) Script.stop(); }, 3000);
        else
            win.autoclose = null;
    });

    return win;
}
windows = ['WebWindow', 'OverlayWebWindow'].map(webwindow);

atexit(function() { windows.splice(0,windows.length).forEach(function(win) {
    win.setSize(0,0)
    win.close && win.close();
    win.deleteLater();
}); });

// ------------------------------------------
// utility functions

// generates content as a data URI (to avoid any external dependencies)
function mkDataURI(type, color, style) {
    return 'data:text/html;text,'+
        '<html>'+
        '<head>'+
        '<title>'+UUID+'</title>'+
        '<style>'+
        'body {background-color: rgba(0,0,100,0.3);width:100%;height:100%;position:relative;overflow:hidden;}'+
        'button {color:white;font-size:.8em;margin:0px;text-align:center;width:32px;height:32px;border:none;}'+
        'div {transform-origin:top left;'+style+';}'+
        'h3 {margin: 0}'+
        '</style>'+
        '</head>'+
        '<body><div>'+
        '<h3 style=background-color:'+color+' onclick=this.style.backgroundColor="gray">'+type+'</h3>'+
        '<button style=background-color:red>red</button>'+
        '<button style=background-color:green>green</button>'+
        '<button style=background-color:blue>blue</button>'+
        '<br />testing <span id=counter></span>...'+
        '<br/ ><audio id=audio src="http://mpassets.highfidelity.com/1f08bb51-d5cf-45f5-bf83-5bd77a19150c-v1/C2.L.wav" controls="true"></audio>'+
        '<script>!'+function(type) {
            window.onclick = function( ){ alert(type+' clicked'); };
            var st = +new Date;
            window.onunload = function() {
                console.info('onunload!!!');
            };
            window.onbeforeunload = clearInterval.bind(this, setInterval(
                function() {
                    counter.innerText = ~~((+new Date-st)/1000);
                    if (counter.innerText > 20 || !innerWidth || !innerHeight) {
                        window.onbeforeunload(); // workaround Interface bug where WebWindows live forever
                        window.close();
                    }
                },
                1000));
        }+'("'+type+'");</script>'+
        '</div></body>'+
        '</html>';
}

atexit.execute = function() {
    if (atexit.cleanups) {
        print('atexit.execute');
        atexit.cleanups.forEach(function(f, i) {
            try { print('atexit['+i+']', f()); } catch(e) { print('atexit err:', i, e); }
        });
        atexit.cleanups.splice(0,atexit.cleanups.length);
    }
};

function atexit(f) {
    if ('function' !== typeof f) return atexit.execute();
    (atexit.cleanups = atexit.cleanups || []).push(f);
}
