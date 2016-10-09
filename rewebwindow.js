// rewebwindow.js -- WebWindow bootloader
//
//   This script accepts a target script via hash (or querystring) and
//      then after stubbing WebWindow from WebWindowEx tries to include-boot that script.
//
//   Put the target script URL after a hash tag when loading *this* script, eg:
//      http://{URL of this rewebwindow.js}#{URL of target client script}
//
//     -- humbletim @ 2016.10.02

var log = function() { print('[rewebwindow.js] ' + [].slice.call(arguments).join(' ')); };

// get a handle to our entire script self-URL
var self = (function() { try { throw new Error('stack'); } catch(e) { return e.fileName; }})() || Script.resolvePath(''),
    target = (self.substr(1).match(/(?:\/~\/|\b(?:https?|file|apt|data|javascript):).+$/)||[])[0];

log('...... self', self);
log('...... target', target);

if (!target) {
    log('...... ERROR: could not find the target script URL');
    log('...... the expected format is: '+ self.split(/[&#]/)[0]+'#{full URL here of script to load that uses WebWindow}')
    //print(JSON.stringify(ScriptDiscoveryService.getRunning(),0,2));
    throw new Error('!target', self);
}

Script.include(Script.resolvePath('WebWindowEx.js') + '#' + new Date().getTime().toString(36));
WebWindow = WebWindowEx;

// WIP: mini faux ToolWindow emulation
OverlayWebWindow = function(title, url, width, height, toolWindow) {
    return (function() {
        if (title.visible !== false && !toolWindow && !title.toolWindow)
            this.setVisible(true);
        this.raise = function() {
            this.setVisible(true);
            this.__proto__.raise.call(this);
        };
        if (toolWindow || title.toolWindow) {
            if (title.toolWindow)
                title = title.title;
            this.setSize({width: 800, height: 600});
            this.resized.connect(this, function(_wh) { this.size = _wh; });
            this.moved.connect(this, function(_pt) { this.position = _pt; });
            var $toolWindow = this.$toolWindow = WebWindowEx.$toolWindow;
            this.$moveto = function(pt) {
                pt && this.setPosition(pt.x, pt.y + ($toolWindow.size.height||64) + 32);
            };
            log('=========================================================================ToolWindow', title);
            //var thiz=this;
            //Script.setTimeout(function() { thiz.$ready('timeout') ;thiz.setVisible(true);}, 1000);
            this.$ready.connect(this, function once() {
                this.$ready.disconnect(this, once);
                if (once.calledtwice) throw new Error('calledtwice');
                once.calledtwice = true;

                this.$moveto($toolWindow.position);
                $toolWindow.webEventReceived.connect(this, function(msg) {
                    if (msg === title) {
                        $toolWindow.$tab = this;
                        this.raise();
                    }
                });
                $toolWindow.$tabs.push(this);
                if ($toolWindow.$tabs.length === 1)
                    $toolWindow.$tab = this;
                this.resized.connect(this, function sized(sz) {
                    if ($toolWindow.$tab === this) {
                        if (sized.to)
                            Script.clearTimeout(sized.to);
                        sized.to = Script.setTimeout(function() {
                            sized.to = 0;
                            //$toolWindow.$tabmsg(sz);
                            $toolWindow.$tabs.filter(function(t) { return t !== $toolWindow.$tab })
                                .forEach(function(t) { t.setSize(sz); });
                        }, 100);
                    }
                });
                $toolWindow.$tabmsg.connect(this, function(msg) {
                    if ($toolWindow.$tab === this)
                        return;
                    if (msg.height && JSON.stringify(msg) !== JSON.stringify(this._size) && JSON.stringify(msg) !== JSON.stringify(this.size)) {
                        this._size = this.size;
                        log('matching size', JSON.stringify(msg));
                        this.setSize(msg);
                    }
                });
                this.visibleChanged.connect(this, function(visible) {
                    this.visible = visible;
                    $toolWindow.setVisible($toolWindow.$tabs.filter(function(t) { return t.visible; }).length);
                    if (visible) {
                        $toolWindow.emitScriptEvent(title);
                        log('reposition on visible', title, this, JSON.stringify($toolWindow.position));
                        var t = this;
                        //Script.setTimeout(function() {
                        t.$moveto($toolWindow.position);
                        //}, 1000);
                        Script.setTimeout(function() {
                            if ($toolWindow.$tab)
                                $toolWindow.$tab.raise();
                        }, 500);
                    }
                });
            });
        }
        return this;
    }).call(new WebWindowEx(title, url, width, height, toolWindow));
};
if(!WebWindowEx.$toolWindow) {
    WebWindowEx.$toolWindow = new WebWindowEx(
        'ToolWindow', 'data:text/html,<style>body{background:black;zoom:1}button{float:left}</style><script>('+
            function() {
                setTimeout(function() {
                    EventBridge.scriptEventReceived.connect(function titler(title) {
                        if (!titler[title]) {
                            titler[title] = '<button onclick=EventBridge.emitWebEvent(this.innerText)>'+title+'</button>\n';
                            output.innerHTML += titler[title];
                        }
                    });
                }, 1);
            }+')()</script><div id=output></div>', 480, 64, false);
    WebWindowEx.$toolWindow.$tabmsg = WebWindowEx.signal('$tabmsg');
    WebWindowEx.$toolWindow.$tabs = [];
    WebWindowEx.$toolWindow.resized.connect(function(_wh) { WebWindowEx.$toolWindow.size = _wh; });
    WebWindowEx.$toolWindow.moved.connect(function moved(_pt) {
        WebWindowEx.$toolWindow.position = _pt;
        if (moved.to)
            Script.clearTimeout(moved.to);
        moved.to = Script.setTimeout(function() {
            moved.to = 0;
            WebWindowEx.$toolWindow.$tabs.forEach(function(t) { t.$moveto(WebWindowEx.$toolWindow.position) });
        }, 100);
    });
    WebWindowEx.$toolWindow.setPosition(0,0);
    //WebWindowEx.$toolWindow.setVisible(true);
    //WebWindowEx.$toolWindow.setVisible(false);
}

Script.setTimeout(function() {
    log('...... including:', target);
    Script.include(target);
}, 1000);
