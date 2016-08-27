// ** WORK IN PROGRESS PROTOTYPE **
// QML dialog button for recollecting Overlays back into the visible viewport area
// 2016.08.27 humbletim

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
//import Qt.labs.settings 1.0

Item {
    id: root
    property var margin: 16

    signal sendToScript(var message);
    Component.onDestruction: sendToScript({type:'stop'})
    function fromScript(evt) { if (evt.type === 'recollect') window ? recollect(evt) : recollect.scheduled = evt; }

    anchors.fill: parent
    // Settings {
    //     id: settings
    //     category: 'recollectOverlays'
    //     property alias margin: root.margin
    // }
    Rectangle {
        anchors.fill: parent
        color: 'black'
        Item {
            id: bar
            height: button.height
            Keys.onEscapePressed: window.shown = false
            Keys.onPressed:  (event.modifiers & Qt.ControlModifier) && event.key === Qt.Key_F1 && Keys.onEscapePressed(event)
            Button {
                id: button
                text: 'recollect'
                implicitWidth: 128
                implicitHeight: 128
                width: Math.max(implicitWidth, root.width)
                onClicked: recollect({ margin: root.margin })
                focus: true
            }
        }
        TextArea {
            visible: root.height > bar.height*1.5
            id: output
            text: margin
            anchors.fill: parent
            anchors.topMargin: bar.height
            backgroundVisible: false
            wrapMode: TextEdit.NoWrap
            textFormat: TextEdit.PlainText
            readOnly: true
            style: TextAreaStyle { textColor: 'white' }
        }
    }

    // hook into our container Window
    property var window
    Binding { target: root; property: 'window'; value: parent.parent }
    Binding { target: root.window; property: 'minSize'; value: Qt.vector2d(button.implicitWidth,button.implicitHeight) }
    Binding { target: root.window; property: 'pinnable'; value: false }
    Binding { target: root.window; property: 'destroyOnHidden'; value: false }
    Binding { target: root.window; property: 'closable'; value: true }
    Binding { target: root.window; property: 'width'; value: button.width; when: !window.width }
    Binding { target: root.window; property: 'height'; value: button.height; when: !window.height }
    Connections {
        target: window || null
        onVisibleChanged: window.visible && button.forceActiveFocus()
    }
    onWindowChanged: {
        if (!window) return;
        window.x = window.frame.frameMarginLeft + margin;
        window.y = window.frame.frameMarginTop + margin;
        recollect.scheduled && recollect(recollect.scheduled)
    }

    // hook into MenuInterface
    property var menu
    Binding { target: root; property: 'menu'; value: MenuInterface }
    Connections {
        target: root
        onMenuChanged: {
            //console.info('MENU', menu);
            menu.addSeparator("Display", "--recollector--");
            menu.addMenuItem("Display","Recollector","CTRL+F1");
        }
        Component.onDestruction: {
            menu.removeMenuItem("Display","Recollector");
            menu.removeSeparator("Display", "--recollector--");
        }
    }
    Connections {
        target: menu || null
        onMenuItemEvent: arguments[0] === 'Recollector' && (window.shown = !window.shown)
    }

    // recollection logic
    function getLogicalViewport(margin) {
        return {
            x: desktop.x + margin,
            y: desktop.y + margin,
            width: desktop.width - margin*2,
            height: desktop.height - margin*2
        }
    }

    function findChildren(obj, index, seen) {
        //if (!/QQuick|Proxy|Shadow|Constants/.test(obj))print('findChildren', obj.frame, obj, index, seen.length);
        if (!obj || typeof obj !== 'object') return;
        if (!~seen.indexOf(obj))
            seen.push(obj);
        obj.children && [].forEach.call(obj.children, function(o,i) {
            findChildren(o,i,seen);
        });
        return seen;
    }

    // heuristics for identifying Mini Mirror, floating toolbars and OverlayWindows
    function findOverlays() {
        return findChildren(desktop, 0, [])
            .filter(function(c,i) {
                return c.objectName === 'AvatarInputs' || ('frame' in c && 'x' in c && 'width' in c && 'visible' in c)
            });
    }

    function recollect(evt) {
        recollect.scheduled = null;
        output.text = margin+'\n'+JSON.stringify(evt)+'';
        if (evt && !isNaN(evt.margin))
            margin = evt.margin;
        var print = function() {
            var message = [].slice.call(arguments).join(' ');
            output.text += '\n' + message;
            console.info(message);
        };
        print('recollect', window);

        var viewport = getLogicalViewport(0);
        print('viewport', viewport.x, viewport.y, viewport.x+viewport.width, viewport.y+viewport.height);

        var bounds = getLogicalViewport(margin);

        var floaters = findOverlays();

        var backup = {}; // WIP; in future could save and restore placement snapshots or something
        floaters.forEach(function(c) {
            var X=c.x, Y=c.y, ID=c.title||c.name||c.objectName;

            //print('checking', ID, c.x, c.y, c.x+c.width, c.y+c.height, '('+c+')');

            if (true || c.width < bounds.x) {
                if ((c.x+c.width) > (bounds.x+bounds.width))
                    X = bounds.width - c.width;
                else if (c.x < bounds.x)
                    X = bounds.x;
            }
            if (true || c.height < bounds.y) {
                if ((c.y+c.height) > (bounds.y+bounds.height))
                    Y = bounds.height - c.height;
                else if (c.y < bounds.y)
                    Y = bounds.y;
            }
            if (c.x !== X || c.y !== Y) {
                if (ID) backup[ID] = { x: c.x, y: c.y, width: c.width, height: c.height };
                c.x = X;
                c.y = Y;
                print('recollected', ID, c.x, c.y, c.x+c.width, c.y+c.height, '('+c+')');
            }
        });
        print('backup:', JSON.stringify(backup,0,2));
        return backup;
    }
}
