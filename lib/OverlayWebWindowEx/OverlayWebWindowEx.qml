//
//    Seamless HTML5 UI toolbar: The QML Document
//    2016.08.01 humbletim 
//

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtWebEngine 1.1
import QtWebChannel 1.0
import QtQuick.Controls.Styles 1.4

// Yay!! Finally found a way to make these importable remotely -- right from the github fork
import "https://raw.githubusercontent.com/humbletim/hifi/qmldir-test/interface/resources/qml/windows" as Windows
import "https://raw.githubusercontent.com/humbletim/hifi/qmldir-test/interface/resources/qml/styles-uit"
import "https://raw.githubusercontent.com/humbletim/hifi/qmldir-test/interface/resources/qml/controls-uit" as Controls

Item {
    id: root
    objectName: 'root'
    visible: true
    anchors.fill: parent
    property string userAgent: "Mozilla/5.0 Chrome/38.0 (HighFidelityInterface; OverlayWebWindowEx)"

    // QML -> Script
    signal sendToScript(var message);

    // note: QML<->Script channel shares traffic with EventBridge; breaking these out just to keep better track of them
    property var rpc: ({
        setUserAgent: function(ua) { root.userAgent = ua; },
        reloadAndBypassCache: function() { currentWebView.reloadAndBypassCache(); },
        setURL: function(url) { currentWebView.url = url; },
        emitScriptEvent: function(msg) { bridge.emitScriptEvent(msg); },
        grantFeaturePermission: function(securityOrigin, feature, yesno) {
            currentWebView.grantFeaturePermission(securityOrigin, feature, yesno);
        }
    })

    // Script -> QML
    function fromScript(event) {
        if (typeof event !== 'object')
            event = JSON.parse(event);
        console.debug('OverlayWebWindowEx.fromScript ' + JSON.stringify(event));
        if (event.data && event.data.rpc /* && (event.target === '*' || event.target === 'qml')*/) {
            // Script -> QML-level RPC call
            var msg = event.data;
            if (msg.rpc in rpc) {
                console.info('rpc', msg.rpc, msg.args);
                rpc[msg.rpc].apply(this, msg.args);
            } else {
                console.error('rpc not found', msg.rpc);
            }
        } else if (event.target === '*' || event.target === 'web') {
            // Script -> EventBridge
            bridge.emitScriptEvent(event.data);
        }
    }

    // mini "EventBridge" implementation
    QtObject {
        id: bridge
        objectName: 'bridge'
        property string $version: "0.0.0"
        WebChannel.id: "eventBridge"

        // Script -> Web
        signal scriptEventReceived(var message)
        function emitScriptEvent(message) {
            //console.info('...emitScriptEvent', message);
            scriptEventReceived(JSON.stringify(message));
        }

        // Web -> Script
        //signal webEventReceived(var message)
        function emitWebEvent(message) {
            console.info('emitWebEvent', message);
            root.sendToScript(JSON.parse(message));
        }
    }

    Rectangle { id: backdrop; anchors.fill: parent; color: 'black'; z:-1;  }

    Component.onCompleted: {
        console.warn('--------================================');
    }    

    // thin window frame replacement
    Windows.Decoration {
        id: thinFrame
        property var iconSize: 0
        property var window: null
        property var cback
        property var root: ({
            deflateDecorations: function() { console.info('deflateDecorations'); },
            inflateDecorations: function() { console.info('inflateDecorations'); }
        })
        
        // exprimenting with using Right Click to still allow live window resizing...
        MouseArea {
            id: other
            anchors.fill: parent
            acceptedButtons: Qt.RightButton
            onClicked: {
                if (!thinFrame.cback) 
                    with(thinFrame.color)thinFrame.cback = Qt.rgba(r,g,b,a);
                thinFrame.window.resizable = !thinFrame.window.resizable
                thinFrame.color = thinFrame.window.resizable ? 'blue' : thinFrame.cback;
                console.info(thinFrame.window.resizable, thinFrame.color);
            }
        }
        // tweaked resize handle (note: WIP; layout/positioning might still be specific to my screen DPI)
        MouseArea {
            acceptedButtons: Qt.LeftButton
            HifiConstants { id: hifi }
            property alias window: thinFrame.window
            // Resize handle
            id: sizeDrag
            width: hifi.dimensions.frameIconSize
            height: hifi.dimensions.frameIconSize
            enabled: window ? window.resizable : false
            hoverEnabled: true
            //x: window ? window.width + frameMarginRight - hifi.dimensions.frameIconSize : 0
            //y: window ? window.height + 4 : 0
            x: +(window && (window.width + resizeIcon.width/6))
            y: +(window && (window.height - resizeIcon.height/3))

            property vector2d pressOrigin
            property vector2d sizeOrigin
            property bool hid: false
            property var frame: ({
                deltaSize: function deltaSize(dx, dy) {
                    var newSize = Qt.vector2d(window.width + dx, window.height + dy);
                    window.width = Math.max(window.minSize.x, Math.min(window.maxSize.x, newSize.x));
                    window.height = Math.max(window.minSize.y, Math.min(window.maxSize.y, newSize.y));
                }
            })
            onPressed: {
                pressOrigin = Qt.vector2d(mouseX, mouseY)
                sizeOrigin = Qt.vector2d(window.content.width, window.content.height)
                hid = false;
            }
            onReleased: {
                if (hid) {
                    window.content.visible = true
                    hid = false;
                }
            }
            onPositionChanged: {
                if (pressed) {
                    if (window.content.visible) {
                        // live resizing is awesome for responsive sites so commented this out
                        //window.content.visible = false;
                        hid = true;
                    }
                    var delta = Qt.vector2d(mouseX, mouseY).minus(pressOrigin);
                    frame.deltaSize(delta.x, delta.y)
                }
            }
            HiFiGlyphs {
                id: resizeIcon
                property alias window: thinFrame.window
                visible: sizeDrag.enabled
                //x: -11  // Move a little to visually align
                //y: window && window.modality == Qt.ApplicationModal ? -6 : -4
                text: hifi.glyphs.resizeHandle
                size: hifi.dimensions.frameIconSize + 10
                color: sizeDrag.containsMouse || sizeDrag.pressed
                    ? hifi.colors.white
                    : (window && window.colorScheme == hifi.colorSchemes.dark ? hifi.colors.white50 : hifi.colors.lightGrayText80)
            }
        }
    } // Window.Decoration

    property var window: null

    onWindowChanged: {
        console.info('onWindowChanged', window);
        if (!window) return;

        window.resizable = false;
        window.closable = false;
        window.pinnable = false;

        // set up the replacement window frame
        thinFrame.window = window;
        thinFrame.window.mouseEntered.connect(function t() {
            thinFrame.border.color = Qt.lighter(thinFrame.border.color,10);
        });
        thinFrame.window.mouseExited.connect(function() {
            thinFrame.border.color = Qt.darker(thinFrame.border.color,10);
        });
        thinFrame.frameMarginTop = thinFrame.frameMarginBottom = 8;
        thinFrame.frameMarginLeft = thinFrame.frameMarginRight = 16;

        // and finally swap it in
        window.frame = thinFrame;
    }
    
    Timer {
        interval: 1
        running: true
        repeat: true
        id: timer
        // wait for attachment to the main OverlayWindow container
        onTriggered: if (root.parent && root.parent.width) {
            stop();
            window = root.parent.parent
        }
    }

    property alias currentWebView: webview
    ProgressBar {
        id: progressBar
        height: 3
        visible: true
        anchors.bottom: parent.top
        width: parent.width
        style: ProgressBarStyle { background: Item {} }
        z: 20;
        minimumValue: 0
        maximumValue: 100
        value: (currentWebView && currentWebView.loadProgress < 100) ? currentWebView.loadProgress : 0
        onValueChanged: {
            console.info('progress:'+value)
            $property('progress', value);
        }
    }

    WebEngineView {
        id: webview
        objectName: 'webview'
        Component.onCompleted: {
            webview.javaScriptConsoleMessage.connect(function(level, message, lineNumber, sourceID) {
                console.log("[OverlayWebWindowEx] " + (sourceID+'').split('/').pop() + ":" + lineNumber + " " +  message);
            });
        }
        url: "about:blank"
        //anchors.fill: parent
        width: root.width
        height: root.height
        visible: true
        focus: true
        webChannel.registeredObjects: [ bridge ]

        //profile.httpUserAgent: 'xx'+root.userAgent
        Binding {
            target: webview
            property: 'profile.httpUserAgent'
            value: root.userAgent
        }

        // give the Script side a heads-up for interesting web view events
        onUrlChanged: $property('url', url)
        //QtWebEngine 1.3 onScrollPositionChanged: $property('scrollPosition', scrollPosition)
        onZoomFactorChanged: $property('zoomFactor', zoomFactor)
        onTitleChanged: $property('title', title)
        onIconChanged: $property('icon', icon)
        //QtWebEngine 1.3 recentlyAudibleChanged: $propert('recentlyAudible', recentlyAudible)
        onLinkHovered: $property('hoveredUrl', hoveredUrl)
        onCertificateError: $property('certificateError', error)
        onFullScreenRequested: $property('fullscreenRequested', request)
        //onJavaScriptConsoleMessage: $property('javaScriptConsoleMessage', { level: level, value: message })
        onLoadingChanged: $property('loadRequest', loadRequest)
        onNewViewRequested: $property('newViewRequest', request)
        //QtWebEngine 1.? $property('windowCloseRequest', true)
        onFeaturePermissionRequested: $property('featurePermissionRequest', { securityOrigin: securityOrigin, feature: feature })
    } //webview

    // on the Client script side these currently become $ properties on window (eg: window.$title, window.$icon, etc.);
    function $property(k, v) {
        sendToScript({ target: 'script', data: { property: k, value: v }, tstamp: +new Date, source: 'qml' });
    }
}
