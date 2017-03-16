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
    objectName: 'webwindowex-'+new Date().getTime().toString(36)

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
        onWebEventReceived: {
            // if (message.slice(0, 17) === "CLARA.IO DOWNLOAD")
            //     return ApplicationInterface.addAssetToWorldFromURL(event.slice(18));
            // forward incoming HTML messages to the Script side
            sendToScript({ origin: 'web', data: message, target: 'script', tstamp: +new Date });
        }
    }

    // QML -> Script
    signal sendToScript(var message);
    // Script -> QML
    function fromScript(event) {
        if (event.property) {
            try {
                debug && log('fromScript', event.property, JSON.stringify(event.value));
                if (typeof event.value === 'undefined')
                    return debug && log('fromScript', event.property, 'ignoring undefined value');
                if (event.property === 'url' && appwin.webview)
                    return appwin.webview.url = event.value;
                else if (event.property === 'scriptUrl' && appwin.webview)
                    return appwin.webview.userScriptUrl = event.value;
                else if (event.property in appwin)
                    return appwin[event.property] = event.value;
                else
                    log('-- property not recognized', event.property, event.value);
            } catch(e) {
                log('property error:', JSON.stringify(event), event.property, event.value);
            }
        }
        //log('fromScript', JSON.stringify(event));

        if (event.target === 'qml') {
            log(event.target, event.data);
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

            Binding { target: popoutwin; property: 'flags'; value: Qt.Tool; when:  /nofocus/i.test(title) }

            Component.onCompleted: $emit('$ready', 'popoutwin')
            Component.onDestruction: {
                console.info('popoutwin.onDestruction', title);
                $emit('$destroyed', 'popoutwin');
                window && window.close && window.close();
                window && window.destroy && window.destroy();
                $emit('closed','popoutwin');
            }

            onClosing: {
                console.info('popoutwin.onClosing', title, close.accepted);
                $emit('closed', 'popoutwin');
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
                property string userScriptUrl: ""
                anchors.fill: parent
                focus: true
                webChannel.registeredObjects: [bridge]
                profile.httpUserAgent:  "Mozilla/5.0 Chrome (HighFidelityInterface; WebWindowEx)"
                function getqwebchannel_src(url) {
                    url = url || "qrc:///qtwebchannel/qwebchannel.js";
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, false);
                    xhr.send();
                    return '//@ sourceURL='+url+'\n'+(xhr.responseText+'').replace(
                        'channel.execCallbacks[message.id]',
                        '(channel.execCallbacks[message.id]||console.warn.bind(console, "!channel.execCallbacks[message.id] "+JSON.stringify(message)))');
                    //return xhr.response;
                }
                userScripts: [
                    // WebEngineScript {
                    //     sourceCode: webview.getqwebchannel_src()
                    //     injectionPoint: WebEngineScript.DocumentCreation
                    //     worldId: WebEngineScript.MainWorld
                    // },
                    WebEngineScript {
                        sourceCode: [
                            "//@ sourceURL=WebWindowEx.qml:165+\n",
                            "var WebChannel, EventBridge, QWebChannel, openEventBridge;",
                            "function __WebWindowExInit__() {console.info('__WebWindowExInit__' + location);Object.defineProperty(window, 'EventBridge',{ value: { ",
                            "  emitWebEvent: function(msg) { return this.__proto__.emitWebEvent(msg); },",
                            "  __proto__: { ",
                            "     emits: [], connects: [], disconnects: [],",
                            "     scriptEventReceived: { ",
                            "       connect: function(f) { EventBridge.connects.push(f);  }, ",
                            "       disconnect: function(f) { EventBridge.disconnects.push(f); } ",
                            "    },",
                            "    emitWebEvent: function(msg) { EventBridge.emits.push(msg); } ",
                            "  }",
                            "}});",
                    //     ].join('\n')
                    //     injectionPoint: WebEngineScript.DocumentCreation
                    //     worldId: WebEngineScript.MainWorld
                    // },
                    // WebEngineScript {
                    //     sourceCode: [
                            "//@ sourceURL=WebWindowEx.qml:189+\n",
                            "__WebWindowExInit__.QWebChannel = QWebChannel; QWebChannel = null;",
                            "Object.defineProperty(window, 'openEventBridge', { value: function(cb) { console.info('openEventBridge noop');if (EventBridge.channel)cb(EventBridge);else __WebWindowExInit__.bbb = cb; }});",
                            "Object.defineProperty(window, 'QWebChannel', { value: function(a,cb) { console.info('~~QWebChannel noop'+[typeof WebChannel,typeof EventBridge.channel,typeof window.WebChannel]);if(EventBridge.channel)cb(EventBridge.channel);else __WebWindowExInit__.qqq=cb;; }});",
                            "new __WebWindowExInit__.QWebChannel(qt.webChannelTransport, function (channel) { ",
                            "Object.defineProperty(window, 'WebChannel', { value: EventBridge.channel = channel }); ",
                            " var old = EventBridge.__proto__; ",
                            "console.info('QWebChannel provisioned; queue:'+[old.connects&&old.connects.length,old.disconnects&&old.disconnects.length,old.emits&&old.emits.length] + location);",
                            " EventBridge.__proto__ = channel.objects.eventBridgeWrapper.eventBridge; " +
                                "  (old.connects||[]).forEach(function(f) { EventBridge.scriptEventReceived.connect(f); });",
                            "  (old.disconnects||[]).forEach(function(f) { EventBridge.scriptEventReceived.disconnect(f); });",
                            "  (old.emits||[]).forEach(function(msg) { EventBridge.emitWebEvent(msg); });",
                            "if (__WebWindowExInit__.qqq) {console.info('deferedqqq'); __WebWindowExInit__.qqq.call(this, EventBridge.channel); }",
                            "if (__WebWindowExInit__.bbb) {console.info('deferedbbb'); __WebWindowExInit__.bbb.call(this, EventBridge); }",
                            " });",
                            "}",
                            webview.getqwebchannel_src(),
                            "location.protocol !== 'about:' && __WebWindowExInit__();"
                        ].join('\n')
                        injectionPoint: WebEngineScript.DocumentCreation
                        worldId: WebEngineScript.MainWorld
                    },
                    WebEngineScript {
                        sourceCode: "if(0)console.warn('disabling context menu to workaround QML Popup issue');window.addEventListener('contextmenu', function(evt) { evt.preventDefault(); });"
                        injectionPoint: WebEngineScript.DocumentReady
                        worldId: WebEngineScript.MainWorld
                    },
                    // Detect when may want to raise and lower keyboard.
                    WebEngineScript {
                        id: raiseAndLowerKeyboard
                        injectionPoint: WebEngineScript.Deferred
                        sourceUrl: resourceDirectoryUrl + "/html/raiseAndLowerKeyboard.js"
                        worldId: WebEngineScript.MainWorld
                    },
                    // User script.
                    WebEngineScript {
                        id: userScript
                        sourceUrl: webview.userScriptUrl
                        injectionPoint: WebEngineScript.DocumentReady  // DOM ready but page load may not be finished.
                        worldId: WebEngineScript.MainWorld
                    }
                ]

                Component.onCompleted: {
                    sendToScript({ target: 'WebWindowEx', origin: 'qml', data: { objectName: fauxroot.objectName }})
                    $emit('$ready', 'webview');
                }
                onJavaScriptConsoleMessage: log((sourceID+'').split('/').pop() + ":" + lineNumber + " " +  message)

                onLoadingChanged: {
                    // Required to support clicking on "hifi://" links
                    if (WebEngineView.LoadStartedStatus == loadRequest.status) {
                        var url = loadRequest.url.toString();
                        log('testing canHandleUrl', url);
                        if (/^hifi:|mpassets/.test(url) || urlHandler.canHandleUrl(url)) {
                            log('calling handleUrl!', url)
                            if (urlHandler.handleUrl(url)) {
                                webview.stop();
                            }
                        }
                    }
                }
            }
        }
    }
}
