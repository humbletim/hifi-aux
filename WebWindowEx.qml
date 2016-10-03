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
    readonly property var __filename: (function() { try { throw new Error('stacktrace'); } catch(e) { return e.fileName; } })()
    readonly property var debug: /[d]ebug/.test(__filename)

    // note: QmlWindow eventually places OverlayWindow content into a HiFi Window component
    //  so we wait until we're attached in order to get a reference to the actual window
    property var window: null
    Binding { target: fauxroot; property :'window'; value: parent.parent; when: Boolean(parent.parent) }

    // once we have that reference, we use it as a hidden surrogate to boot and track appwin
    property var appwin: null
    property alias bridge: bridge
    onWindowChanged: {
        if (appwin) appwin.window = window;
        if (!window || appwin) return;
        appwin = windowMaker.createObject(null, { window: window, bridge: fauxroot.bridge });
        $emit('$ready', 'fauxroot');
    }
    Connections {
        target: window
        Component.onDestruction: {
            log('window.onDestruction', appwin, window);
            $emit('$destroyed', 'window');
            appwin && appwin.destroy()
            window = null
        }
        onWindowDestroyed: {
            log('window.onWindowDestroyed', appwin, window);
            $emit('$destroyed', 'windowDestroyed');
            appwin && appwin.destroy()
            window = null
        }
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
            debug && log('fromScript', event.property, JSON.stringify(event.value));
            if (typeof event.value === 'undefined')
                return debug && log('fromScript', event.property, 'ignoring undefined value');
            if (event.property === 'x' && typeof event.value === 'object') {
                appwin.x = event.value.x;
                appwin.y = event.value.y;
                return;
            }
            if (event.property === 'width' && typeof event.value === 'object') {
                appwin.width = event.value.width;
                appwin.height = event.value.height;
                return;
            }
            if (event.property === 'url' && appwin.webview)
                return appwin.webview.url = event.value;
            else if (event.property in appwin)
                return appwin[event.property] = event.value;
            else
                log('-- property not recognized', event.property, event.value);
        }
        //log('fromScript', JSON.stringify(event));

        if (event.target === 'qml') {
            if (event.data === 'deleteLater')
                return appwin.destroy();
            else if (event.data === 'raise')
                return appwin.raise();
            return;
        }
        // forward incoming Script messages to the HTML side
        if (event.target === '*' || event.target === 'web')
            bridge.scriptEventReceived(event.data);
    }

    // forward internal signals to the WebWindowEx layer
    function $emit(signal, value) {
        sendToScript({
            target: 'WebWindowEx',
            origin: 'qml',
            data: { emit: signal, arguments: [].slice.call(arguments,1) }
        });
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
            title: (window && window.title) || 'WebWindowEx'
            visible: false

            Component.onCompleted: $emit('$ready', 'popoutwin')
            Component.onDestruction: {
                console.info('popoutwin.onDestruction', title);
                $emit('$destroyed', 'popoutwin');
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
                profile.httpUserAgent:  "Mozilla/5.0 Chrome (HighFidelityInterface; WebWindowEx)"
                function getqwebchannel_src() {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', "qrc:///qtwebchannel/qwebchannel.js", false);
                    xhr.send();
                    return xhr.response;
                }
                userScripts: [
                    WebEngineScript {
                        sourceCode: "EventBridge = { "+
                            "  __proto__: { "+
                            "     emits: [], connects: [], disconnects: [],"+
                            "     scriptEventReceived: { "+
                            "       connect: function(f) { EventBridge.connects.push(f);  }, "+
                            "       disconnect: function(f) { EventBridge.disconnects.push(f); } "+
                            "    },"+
                            "    emitWebEvent: function(msg) { EventBridge.emits.push(msg); } "+
                            "  }"+
                            "};"
                        injectionPoint: WebEngineScript.DocumentCreation
                        worldId: WebEngineScript.MainWorld
                    },
                    WebEngineScript {
                        sourceCode: (
                            webview.getqwebchannel_src() + '\n' +
                                "new QWebChannel(qt.webChannelTransport, function (channel) { "+
                                "var old = EventBridge.__proto__; EventBridge.__proto__ = channel.objects.eventBridgeWrapper.eventBridge; " +
                                "  (old.connects||[]).forEach(function(f) { EventBridge.connect(f); });"+
                                "  (old.disconnects||[]).forEach(function(f) { EventBridge.disconnect(f); });"+
                                "  (old.emits||[]).forEach(function(msg) { EventBridge.emitWebEvent(msg); });"+
                                "} );"
                        )
                        injectionPoint: WebEngineScript.DocumentCreation
                        worldId: WebEngineScript.MainWorld
                    }
                ]
                Component.onCompleted: $emit('$ready', 'webview');
                onJavaScriptConsoleMessage: log((sourceID+'').split('/').pop() + ":" + lineNumber + " " +  message)
            }
        }
    }
}
