//  WebWindowEx.qml
//
// --humbletim 2016.10.01

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtWebEngine 1.1
import QtWebChannel 1.0

Item {
    id: fauxroot
    readonly property var log: console.info.bind(console, '[WebWindowEx.qml]')

    // note: QmlWindow eventually places OverlayWindow content into a HiFi Window component
    //  so we wait until we're attached in order to get a reference to the actual window
    property var window: null
    Binding { target: fauxroot; property :'window'; value: parent.parent; when: Boolean(parent.parent) }

    // once we have that reference, we use it as a hidden surrogate to boot and track appwin
    property var appwin: null
    property alias bridge: bridge
    onWindowChanged: {
        if (!window || appwin) return;
        appwin = windowMaker.createObject(null, { window: window, bridge: fauxroot.bridge });
    }
    Connections {
        target: window
        Component.onDestruction: appwin && appwin.destroy()
    }

    // a mini "EventBridge" implementation
    QtObject {
        id: bridge
        property var eventBridge: bridge
        objectName: 'bridge'
        WebChannel.id: "eventBridgeWrapper"

        // (Script -> Web)
        signal scriptEventReceived(var message)
        function emitWebEvent(message) { webEventReceived(message); }

        // (Web -> Script)
        signal webEventReceived(var message)
        function emitScriptEvent(message) { return scriptEventReceived(message); }
    }
    Connections {
        target: bridge
        // forward incoming HTML messages to the Script side
        onWebEventReceived: sendToScript({ origin: 'web', data: message, target: 'script', tstamp: +new Date })
    }
  
    // QML -> Script
    signal sendToScript(var message);
    // Script -> QML
    function fromScript(event) {
        if (event.property) {
            log('fromScript', event.property, event.value);
            if (event.property === 'url' && appwin.webview)
                appwin.webview.url = event.value;
            else if (event.property in appwin)
                appwin[event.property] = event.value;
            else
                log('-- property not recognized', event.property, event.value);
        }        
        //log('fromScript', JSON.stringify(event));

        // forward incoming Script messages to the HTML side
        if (event.target === '*' || event.target === 'web')
            bridge.scriptEventReceived(event.data);
    }

    Component {
        id: windowMaker
        ApplicationWindow {
            id: popoutwin
            property var window: null
            property var bridge: null
            x: 0
            y: 0
            width: 640
            height: 480
            title: window.title || 'WebWindowEx'
            visible: window.visible

            // forward internal signals to WebWindowEx
            function $emit(signal, value) {
                sendToScript({
                    target: 'WebWindowEx',
                    origin: 'qml',
                    data: { emit: signal, arguments: [].slice.call(arguments,1) }
                });
            }

            Component.onDestruction: {
                console.info('popoutwin.onDestruction', title);
                window && window.destroy && window.destroy();
            }

            onClosing: {
                console.info('popoutwin.onClosing', title, close.accepted);
                $emit('closed');
                //window.windowClosed && window.windowClosed();
            }

            property var position: ({ x: x, y: y })
            property var size: ({ width: width, height: height })

            onPositionChanged: $emit('moved', position)
            onSizeChanged: $emit('resized', size)
            onVisibleChanged: $emit('visibilityChanged', visible)
            //onTitleChanged: $emit('title', title)
            
            property alias webview: webview
            WebEngineView {
                id: webview
                url: "about:blank"
                anchors.fill: parent
                focus: true
                webChannel.registeredObjects: [bridge]
            }
        }
    }
}
