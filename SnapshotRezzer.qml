//
//    snapshot-to-entity (proof-of-concept)
//    2016.08.20 humbletim
//

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4

FocusScope {
    id: root
    objectName: 'root'
    anchors.fill: parent
    focus: true

    property var filename: ''
    property var mapping: ''

    signal sendToScript(var message)
    function fromScript(event) {
        console.info('fromScript', JSON.stringify(event));
        if (event.type === 'frameAdded' && event.uuid !== Uuid.toString(0)) {
            //sendToScript({ type: 'close' });
            show(false);
            button.text = button.placeholderText
            enabled = true
        }
    }

    property var window: null
    Binding { target: root; property: 'window'; value: parent.parent; when: Boolean(parent && parent.parent) }
    onWindowChanged: window && window.forceActiveFocus()
    Image {
        id: bg
        z:0
        focus: true
        anchors.fill: parent
        visible: Boolean(source)
        source: filename ? 'file://'+filename : ''
    }

    property var error: ''
    onErrorChanged: {
        if (error) {
            _debug.text = _debug.text + '<font color=red>' + error + '</font><br />';
            error = '';
        }
    }
    function log(x) { _debug.text = _debug.text  + x + '' }
    Rectangle {
        z: 0;
        anchors.top: parent.top
        width: parent.width
        height: _debug.height
        color: 'gray'
        opacity: .9
        TextEdit {
            id: _debug
            z: 0; color: 'white'
            anchors.margins: 0
            text: '<b></b>';
            textFormat: TextEdit.RichText
            readOnly: true
            wrapMode: Text.WordWrap;
            selectByMouse: true; selectByKeyboard: true; font.pixelSize: 12;
            verticalAlignment: Text.AlignTop
            horizontalAlignment: Text.AlignLeft
        }
    }
    Button {
        z:1
        id: button
        height: parent.height/3
        width: parent.width
        anchors.bottom: parent.bottom
        opacity: .8
        visible: true
        enabled: true
        focus: true
        property var placeholderText: '(snapshot detection enabled)\nyou can hit (x) or ESC to hide this dialog'
        property var permsText: 'click to generate a photo frame\n(note: requires canWriteToAssetServer && canRez*Entities)'
        text: placeholderText
        onClicked: {
            console.info('click!', filename, mapping, (bg.source+'').substr(0,32));

            if (enabled && filename && mapping) {
                enabled = false; // prevent fallthru clicking bug

                _debug.text = 'Assets.uploadFile...';
                Assets.uploadFile(filename, mapping, function started() {
                    log('started...')
                    console.info('started', mapping);
                }, function completed(err, url) {
                    console.info('completed', mapping, err, url);
                    if (err) {
                        error += err;
                        window.forceActiveFocus()
                        return enabled = true;
                    } else
                        log('completed... ' + url);

                    // verify it actually worked (by resolving the mapping into its ATP hash)
                    Assets.getMapping(mapping, function(err, hash) {
                        console.info('gotMapping', mapping, err, hash);
                        if (err) {
                            error += 'getMapping error: ' + err;
                            return enabled = true
                        }

                        bg.source = 'atp:'+mapping;
                        log('\nDONE: ' + bg.source)

                        sendToScript({
                            type: 'addFrame',
                            src: bg.source,
                            hash: hash,
                            mapping: mapping,
                            path: filename
                        });
                    });
                }, false);
            }
        }//button.onClicked

        // MouseArea {
        //     id: mouseArea
        //     anchors.fill: parent
        //     hoverEnabled: true
        // }
        // style: ButtonStyle {
        //     background: Rectangle {
        //         color: mouseArea.containsMouse ? '#fefefe' : '#efefef'
        //         border.color: enabled ? 'lime' : 'white'
        //         radius: 8
        //     }
        //     label: Component {
        //         Text {
        //             focus: true
        //             text: button.text
        //             wrapMode: Text.WordWrap
        //             verticalAlignment: Text.AlignTop
        //             horizontalAlignment: Text.AlignLeft
        //             anchors.fill: parent
        //             font.pixelSize: 11
        //         }
        //     }
        // }
    }

    Keys.onPressed: {
        console.info('onPressed', event);
        if (!visible)
            return;
        switch (event.key) {
        case Qt.Key_Escape:
        case Qt.Key_Back:
            event.accepted = true
            show(false);
            break

        case Qt.Key_Enter:
        case Qt.Key_Return:
            event.accepted = true
            button.enabled && button.clicked(event)
            break
        }
    }

    Connections {
        target: window
        onVisibleChanged: if (!visible && !mapping) button.text = button.placeholderText
        onFocusChanged: { console.info('focus', window.focus); if (!focus && button.enabled) show(false) }
    }

    function show(b) { window.shown = b; }

    Connections {
        target: Window
        onSnapshotTaken: {
            console.info('SNAPSHOT DETECTED', path, button.text);
            filename = path;
            mapping = '/snapshots/'+filename.split(/[\\/]/).pop().split(/[#?]/)[0];
            show(true);
            _debug.text = ''
            log('SNAPSHOT detected');
            log('<pre>current perms: '+JSON.stringify({
                canRez: Entities.canRez(),
                canRezTmp: Entities.canRezTmp(),
                canWriteToAssetServer: '(permissions check unavailable)'
            },0,2).trim().replace(/\n/g,'<br />')+'</pre>');
            log('image: '+filename);
            log('mapping: '+mapping);
            button.enabled = true
            button.text = button.permsText;

            button.forceActiveFocus()
        }
    }
}
