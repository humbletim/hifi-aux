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
            bg.source = ''
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
        source: ''
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
    QtObject {
        id: settings
        property alias gravity: gravity.checked
        property alias createPlaceholder: createPlaceholder.checked
    }
    Row {
        anchors.bottom: root.bottom
        z: 1
        anchors.bottomMargin: -24
        property var styleCB: Component { id: styleCB; CheckBoxStyle { label: Text { text: control.text; color: 'white' } } }
        CheckBox { id: gravity; checked: true; text: 'gravity';  style: styleCB }
        CheckBox { id: createPlaceholder; checked: true; text: 'create clientOnly frame (if no rez rights)'; style: styleCB }
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
        property var placeholderText: [
            '(snapshot detection enabled)',
            'you can hit (x) or ESC to hide this dialog',
            'and redisplay with last snapshot under the Display menu'
        ].join('\n')
        property var permsText: 'click to generate a photo frame\n(note: requires canWriteAssets && canRez*Entities)'
        text: placeholderText
        onClicked: {
            console.info('click!', filename, mapping, (bg.source+'').substr(0,32));

            if (!filename || !Entities.serversExist() || (!Entities.canRezTmp() && !Entities.canRez())) {
                if (settings.createPlaceholder) {
                    return sendToScript({
                        type: 'addFrame',
                        //src: bg.source,
                        //hash: hash,
                        //mapping: mapping,
                        //path: filename,
                        settings: settings
                    });
                } else
                    return error += !Entities.serversExist() ? '!serversExist()' : 'no rez permissions';
            }

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
                        if (settings.createPlaceholder) {
                            return sendToScript({
                                type: 'addFrame',
                                //src: bg.source,
                                //hash: hash,
                                //mapping: mapping,
                                //path: filename,
                                settings: settings
                            });
                        }

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
                            path: filename,
                            settings: settings
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

    // hook into MenuInterface
    property var menu
    property var menuname: 'SnapshotRezzer'
    Binding { target: root; property: 'menu'; value: MenuInterface }
    Connections {
        target: root
        onMenuChanged: {
            //console.info('MENU', menu);
            menu.addMenuItem("Display", menuname);
        }
        Component.onDestruction: {
            menu.removeMenuItem("Display", menuname);
        }
    }
    Connections {
        target: menu || null
        onMenuItemEvent: menuItem === menuname && onSnapshotTaken()
    }

    function show(b) { window.shown = b; }

    /*
    Connections {
        target: Window
        onSnapshotTaken: onSnapshotTaken
    }
    */

    Component.onCompleted: {
        Window.onSnapshotTaken.connect(onSnapshotTaken);
        if (Settings.getValue('SnapshotRezzer-lastSnapshot')) {
            button.text = button.permsText;
            onSnapshotTaken();
        }
    }
    Component.onDestruction: Window.onSnapshotTaken.disconnect(onSnapshotTaken)
    function onSnapshotTaken(path) {
        {
            path = path || Settings.getValue('SnapshotRezzer-lastSnapshot');
            Settings.setValue('SnapshotRezzer-lastSnapshot', path);
            console.info('SNAPSHOT DETECTED', path, button.text);
            filename = path;
            bg.source = 'file://'+filename;
            mapping = '/snapshots/'+filename.split(/[\\/]/).pop().split(/[#?]/)[0];
            show(true);
            _debug.text = ''
            log('SNAPSHOT detected');
            log('<pre>current perms: '+JSON.stringify({
                canRez: Entities.canRez(),
                canRezTmp: Entities.canRezTmp(),
                canWriteAssets: Entities.canWriteAssets(),
            },0,2).trim().replace(/\n/g,'<br />')+'</pre>');
            log('image: '+filename);
            log('mapping: '+mapping);
            button.enabled = true
            button.text = button.permsText;
            button.forceActiveFocus()
        }
    }
}
