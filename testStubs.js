//
//    EinsteinRosenBridge -- HTML Testing Stubs example
//    2016.08.01 humbletim
//

// ... these stubs are meant to be used when testing simple.html offling (ie: using a normal web browser)

testStubs = {
    _sendScriptEvent: function() {},
    recv: function(a,b) { this._sendScriptEvent(JSON.stringify(port._make_event(a,b))); },
    // minimalist EventBridge mock
    eventBridge: {
        emitWebEvent: function(x) {
            console.info('emitWebEvent', x);
            var evt = port.peer._parse_event(x);
            console.info('~emitWebEvent', evt);
            if (evt.data.rpc) {
                var err, result;
                if (!testStubs[evt.data.rpc])
                    err = 'testStubs: ' + evt.data.rpc + ' method not stubbed yet';
                else {
                    try {
                        result = testStubs[evt.data.rpc].apply(port.async, evt.data.args);
                    } catch(e) {
                        console.error('testStubs.'+evt.data.rpc, e);
                        err = e+'';
                    }
                }
                if (evt.data.callback && evt.data.callback !== 'HELO')
                    testStubs._sendScriptEvent(JSON.stringify(port.peer._make_event(
                        { rpc: evt.data.callback, error: err, args: [result] },
                        evt.origin
                    )));
            }
        },
        scriptEventReceived: {
            connect: function(f) { testStubs._sendScriptEvent = f; }
        }
    },
    // mocks of shared methods from the Interface-side
    methods: ['onClick','setCameraMode','getCurrentLocation'],
    onClick: function(evt) {
        console.info('testStubs.onClick', evt);
        jQuery('#'+evt.id).css('backgroundColor', '#'+Math.floor(Math.random()*16777215).toString(16));
    },
    setCameraMode: function(mode) {
        console.info('testStubs.setCameraMode', mode);
        port.async.modeUpdated(mode);
        port.async.flip({ axis: /first/.test(mode) ? 'x' : 'y' });
    },
    getCurrentLocation: function() {
        return { href: 'about:testStubs' };
    },

    // instrument the test stubs onto the provided port
    setup: function(port) {
        this.port = port;
        var peer = port.peer;
        peer.connect(this.eventBridge);
        peer.onmessage(peer._make_event(
            { rpc:'HELO', args:[{ key:'testStubs', version:'0.0.0', methods: this.methods }]}
        ));
        port.shared.modeUpdated('first person');

    }
};
