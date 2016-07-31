// test-webviews.js -- Interface Client test script
//
// Created by humbletim on 31 Jul 2016
//
// This script creates various kinds of similar-sized web views.
// Each includes a countdown timer (to test scripting) and can be clicked (to test interactivity)
//

var front = Vec3.sum(MyAvatar.position, Quat.getFront(MyAvatar.orientation)),
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
    var win = new this[type](type, 'about:blank', 200, 100);
    win.setPosition(32 + offset*200, 32);
    win.setVisible(true);
    win.setURL(mkDataURI(type, ['pink', 'lime'][offset]));
    return win;
}
windows = ['WebWindow', 'OverlayWebWindow'].map(webwindow);

atexit(function() { windows.forEach(function(win) {
    win.close ? win.close() : (win.setSize(0,0),win.deleteLater());
}); });

// ------------------------------------------
// utility functions

// generates content as a data URI (to avoid any external dependencies)
function mkDataURI(type, color, style) {
    return 'data:text/html;text,'+
        '<html>'+
        '<head>'+
        '<title>'+type+'</title>'+
        '<style>'+
        'body {background-color: rgba(0,0,100,0.3);width:100%;height:100%;position:relative;overflow:hidden;}'+
        'button {color:white;width:32px;height:32px;border:none;}'+
        'div {transform-origin:top left;'+style+';}'+
        '</style>'+
        '</head>'+
        '<body><div>'+
        '<h3 style=background-color:'+color+' onclick=this.style.backgroundColor="gray">'+type+'</h3>'+
        '<button style=background-color:red>red</button>'+
        '<button style=background-color:green>green</button>'+
        '<button style=background-color:blue>blue</button>'+
        'testing <span id=counter></span>...'+
        '<script>!'+function(type) {
            window.onclick = function( ){ alert(type+' clicked'); };
            var st = +new Date;
            window.onbeforeunload = clearInterval.bind(this, setInterval(
                function() {
                    console.info(
                        type + ' ' +
                            [innerWidth,innerHeight].join('x') + ' ' +
                            (counter.innerText = ~~((+new Date-st)/1000))
                    );
                    if (!innerWidth || !innerHeight)
                        window.onbeforeunload(); // workaround Interface bug where WebWindows live forever
                },
                1000));
        }+'("'+type+'");</script>'+
        '</div></body>'+
        '</html>';
}

function atexit(f) { (atexit.cleanups = atexit.cleanups || []).push(f); }

Script.scriptEnding.connect(function() {
    (atexit.cleanups||[]).forEach(function(f) {
        try { f(); } catch(e) { print(e); }
    });
});
