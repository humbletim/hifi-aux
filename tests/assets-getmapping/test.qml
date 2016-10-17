//
//  Assets.getMapping test.qml harness -- QML dialog
//
//  Created by humbletim on 29 Jul 2016
//

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import Qt.labs.settings 1.0

Rectangle {
    id: root
    readonly property var $version: '0.0.2'

    Settings {
        category: 'tests-getMapping'
        property alias path: testPath.text
    }

    signal sendToScript(var message);

    property var window: null
    // once window is fully-loaded, autostart the test using path from last run
    Component.onCompleted: init()
    Connections {
        target: parent.parent
        onParentChanged: init()
    }

    function init() {
        if (!window) {
            window = parent && parent.parent;
            console.info('window', window);
            if (window) {
                window.title = 'Assets.getMapping test v%1'.arg($version);
                // if window is closed notify test harness to stop
                window.onShownChanged.connect(sendToScript.bind(this, 'stop'));
                runTest(testPath.text)
            }
        }
    }

    function runTest(path) {
        output.text = new Date().toUTCString()
        output.text += '\n...calling Assets.getMapping(%1)'.arg(path);

        Assets.getMapping(path, function(err, hash) {
            output.text += '\n'+JSON.stringify({ path: path, err: err, hash: (hash||'(undefined)') },0,2)

            if (!err && !hash)
                output.text += '\n[ERROR] Either err or hash should have a value!!';

            var suggest = /asset not found/i.test(err);
            output.text += '\n... verifying expectation via Assets.getAllMappings()';
            Assets.getAllMappings(function(err, map) {
                var sample, found;
                console.info(JSON.stringify(map,0,2));
                for(var p in map) {
                    // track shortest ATP path to potentially recommend testing with
                    if (!sample || p.length < sample.length)
                        sample = p;
                    if (p === path)
                        found = map[p];
                }
                if (!found)
                    output.text += '\n\n[ERROR] Path not found within Assets.getAllMappings() results!';
                else if (found === hash)
                    output.text += '\n\n[OK] Assets.getAllMappings and Assets.getMapping agree!';
                else
                    output.text += '\n[note] From Assets.getAllMappings the returned hash should have been:\n '+found;

                // if the path was simply not found, recommend a found one to make retesting easier
                if (sample && suggest)
                    output.text += '\n[suggestion] here is a known ATP path to try testing with: ' + sample
            });
        });
    }

    anchors.fill: parent
    color: 'black'
    Item {
        id: bar
        width: parent.width
        height: button.height
        TextField {
            id: testPath
            text: '/test'
            anchors.left: parent.left
            anchors.right: button.left
        }
        Button {
            anchors.right: parent.right
            id: button
            text: 'retest'
            onClicked: runTest(testPath.text)
        }
    }
    TextArea {
        id: output
        text: ''
        anchors.fill: parent
        anchors.topMargin: bar.height
        backgroundVisible: false
        wrapMode: TextEdit.NoWrap
        textFormat: TextEdit.PlainText
        readOnly: true
        style: TextAreaStyle { textColor: 'white' }
    }
}
