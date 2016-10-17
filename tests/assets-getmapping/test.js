//
//  Assets.getMapping test.qml harness -- client script
//
//  Created by humbletim on 29 Jul 2016
//

window = new OverlayWindow({
    title: 'Assets.getMapping test.js/qml',
    source: Script.resolvePath('test.qml'),
    width: 640,
    height: 240
});

// stop this script runner if QML dialog advises to do so
// note: this prevents accumulating a bunch of hidden scripts in Running Scripts...
window.fromQml.connect(Script, 'stop');
