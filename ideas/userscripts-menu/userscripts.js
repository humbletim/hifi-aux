// userscripts.js
//
//   Adds "Tools > User Scripts' menu
//   see: https://forums.highfidelity.com/t/tools-user-scripts-menu
//
// -- humbletim @ 2016.10.15

var version = '0.0.0';

function log() { print(log.prefix + [].slice.call(arguments).join(' ')); }
try { throw new Error('stacktrace'); } catch(e) { var filename = e.fileName; }
var basename = filename.split(/[?#]/)[0].split('/').pop();
log.prefix = '['+basename+'] ';
log(version);

var USER_SCRIPTS_MENU = 'User Scripts';
var SAMPLE_LOCALSTORAGE = [ "http://google.com # Google" ];
var LOCALSTORAGE_HTML = Settings.getValue('localStorage.html');
var LOCALSTORAGE_KEY = 'userscripts';

Script.include(
    'https://cdn.rawgit.com/humbletim/hifi-aux/c91ae279/lib/localStorage/localStorage.js' +
        (LOCALSTORAGE_HTML ? '#html=' + LOCALSTORAGE_HTML : '')
);

Function.prototype.bind = Function.prototype.bind||function(){var fn=this,s=[].slice,a=s.call(arguments),o=a.shift();return function(){return fn.apply(o,a.concat(s.call(arguments)))}};

var menus = Object.create({
    _menuName: USER_SCRIPTS_MENU,

    dispose: function() { Menu.removeMenu(this._menuName); },
    create: function() { Menu.addMenu(this._menuName); },
    reset: function() { this.dispose(); this.unique = {}; this.create(); },

    _submenus: {},
    _separators: {},
    _data: {},
    softReset: function() {
        for(var p in this.unique) {
            var m = this.unique[p];
            log('removeMenuItem', m.menuName, m.menuItemName);
            Menu.removeMenuItem(m.menuName, m.menuItemName);
        }
        this.unique = {};
        if (0) {
            for(var p in this._submenus)
                Menu.removeMenu(p);
            for (var p in this._separators) {
                Menu.removeSeparator(this._menuName, p);
            }
            this._submenus = {};
            this._separators = {};
        }
    },

    unique: {},
    get: function(name) { return this.unique[name]; },
    set: function(name, m) {
        var i=0;
        var first = /([^&])([^&])/,
            last = /^(.*[^&])([^&])/,
            unique = this.unique;
        name = name.replace(first, '&$1$2');
        while (unique[name] && i++ < 100)
            name = name.replace(last,'$1&$2');

        if (unique[name]) throw new Error('failed to apply unique earmarking:' + [name, JSON.stringify(m)]);
        m._menuItemName = m.menuItemName;
        m.menuItemName = name;
        //m.grouping = 'User Scripts';
        Menu.addMenuItem( unique[name] = m );
        return name;
    },

    _register: function(name, menuItems) {
        var menuName = this._menuName + ' > ' + name;
        if (!this._submenus[menuName]) {
            Menu.addMenu(menuName);
            this._submenus[menuName] = { name: name, menuName: menuName, menuItems: menuItems };
        }
        menuItems.forEach(function(m) {
            if(typeof m === 'string')
                m = { menuItemName: m };
            m.menuName = menuName;

            var lookup = m.menuItemName,
                arr = lookup.split(/\s*[\/#]\s*/),
                name = arr.pop();

            if (!m.data)
                m.data = lookup.replace(/\s*#[^#]*$/,'');
            this.set(name, m);
        }.bind(this));
    },
    _separator: function(k, items) {
        var sep = arguments.length === 1 ? k : k+' '+items;
        if (!this._separators[sep]) {
            Menu.addSeparator(this._menuName, sep);
            this._separators[sep] = { k: k, items: items, sep: sep };
        }
    },

    _update: function(o) {
        Object.keys(o).forEach(function(k) {
            if (k in this._data)
                this._data[k] = o[k];
            else
                log('_update: key not found...skipping', k);
        }.bind(this));
        this._load(this._data);
    },


    _load: function(data) {
        this.softReset();
        this._data = data;
        data = JSON.parse(JSON.stringify(data)); // clone so original object remains unchanged
        var mods = Object.keys(data).sort();
        log('_load', mods);
        mods.filter(function(k) { return !/^_/.test(k);  })
            .forEach(function(k) {
                var items = data[k];
                if (Array.isArray(items))
                    this._register(k, data[k]);
                else
                    this._separator(k, data[k])
            }.bind(this));
        if (data._v)
            this._separator(data._v);
    }

});

loadJSON(Script.resolvePath('userscripts.json'), function(err, data) {
    var users;
    if (err) {
        //throw new Error(err);
        users = { _v: 'userscripts.json: '+err+'' };
    } else {
        users = data.users || {};
        if (data.other) // for now just append 'other' category to users map
            for(var p in data.other)
                users[p] = data.other[p];
        delete users.disabled;
    }
    users._v = users._v || data._v;

    log('waiting for localStorage...', localStorage);
    localStorage.$ready(function() {
        users['(localStorage)'] = getUserScripts();
        users['(localStorage)'].push(":edit_localStorage_menu # Edit (localStorage) menu...");
        log('LOADING', JSON.stringify(users,0,2));
        menus._load(users);
    });
});

function getUserScripts() {
    var userscripts = SAMPLE_LOCALSTORAGE;
    try {
        var record = JSON.parse(localStorage[LOCALSTORAGE_KEY]);// JSON.parse(Settings.getValue(LOCALSTORAGE_KEY));
        var arr = record._v === 0 ? record.items : record;
        if (Array.isArray(arr))
            userscripts = arr;
        else
            throw new Error('unknown localStorage.userscripts format');
    } catch(e) {
        log('getUserScripts', e, arr);
        if (LOCALSTORAGE_KEY in localStorage) {
            log('error processing localStorage.userscripts', localStorage[LOCALSTORAGE_KEY], e);
            // backup current userscripts entry
            //  ... and provide a way to inspect the old data
            var key = 'userscripts.'+ +new Date();
            localStorage.setItem(key, localStorage[LOCALSTORAGE_KEY]);
            var tmp = SAMPLE_LOCALSTORAGE.concat(); // clone
            tmp.unshift('<pre>'+JSON.stringify(localStorage[key],0,2)+'</pre> # '+key);
            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(tmp));
            userscripts = tmp;
        }
    }
    return userscripts;
}

var ctx = {
    menuItemEvent: function(name) {
        var m = menus.get(name);
        if (!m) return log('menuItemEvent', name);

        log('/menuItemEvent', JSON.stringify(m,0,2));

        if (m.data) {
            var url = m.data.split(/\s*[?#]\s*/)[0];
            // (localStorage) editor
            if (m.data === ':edit_localStorage_menu')
                return edit_localStorage_menu(m);

            // inline javascript macro
            if (/^function[\s\w]*[(]/.test(url)) { ///^function[\s\w]*[(][^)]*[)]\s*[{][^}]+[}]$/.test(url)) {
                try {
                    var macro = eval('1,'+url);
                    //if (Window.confirm('Run macro?\n' + macro)) {
                    try { macro(m); } catch(e) { Window.alert('macro error:' + e); }
                    //}
                } catch(e) {
                    Window.alert('error parsing macro:\n'+url+'\n'+e);
                }
                return;
            }

            // Script.load
            if (/[.]js$/.test(url)){
                log('Script.load', m.data);
                return Script.load(m.data);
            }

            // message broadcast
            if (/^message:\[/.test(url)) {
                try {
                    var args = JSON.parse(url.replace('message:', ''));
                    log('Messages.sendMessage('+JSON.stringify(args)+')');
                    Messages.sendMessage.apply(Messages, args);
                } catch(e) {
                    Window.alert('error parsing message:url\n'+url+'\n'+e);
                }
                return;
            }

            // popup window
            return (function(win) {
                win.visibleChanged.connect(win, 'deleteLater');
                win.closed.connect(win, 'deleteLater');

                // internet URL
                if (/^(https?|file|data):/.test(m.data)) { // |atp
                    log('setURL', m.data);
                    win.setURL(m.data);
                    return;
                }

                // local .html snippet (like calendar.html)
                if (/^\w+[.]html/.test(m.data)) {
                    var rel = Script.resolvePath(m.data);
                    log('setURL', rel, m.data);
                    win.setURL(rel);
                    return;
                }

                // raw html snippet
                if (/^\s*</.test(m.data)) {
                    log('setHTML', m.data);
                    win.setURL('data:text/html;text,'+m.data);
                    return;
                }

                // unknown
                win.setURL('data:text/plain;text,UNRECOGNIZED MENU DATA:\n'+JSON.stringify(m,0,2));
            })(new OverlayWebWindow((m.menuName + ' > ' + m.menuItemName).replace(/&/g,''), 'about:blank', 800, 600));
        }
        return;
    }
};

Script.scriptEnding.connect(function() {
    menus.dispose();
    Menu.menuItemEvent.disconnect(ctx, 'menuItemEvent');
});

Menu.menuItemEvent.connect(ctx, 'menuItemEvent');

function loadJSON(url, callback) {
    var xhr = new XMLHttpRequest;
    if (/file:/.test(url)) {
        // NOTE: loading JSON from local file:/// URIs requires custom Interface code
        Script.include('file:@humbletim/FileXMLHttpRequest.js');
        xhr = new FileXMLHttpRequest;
    }
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function(a,b,c) {
        if (this.readyState === this.DONE) {
            log('onload', this+'', this.responseText, (this.responseText||'').length);
            try {
                var json = JSON.parse(xhr.responseText||'{}');
            }
            catch(e) {
                log('error', e);
                e.xhr=this;
                callback(e, null);
                callback = null;
            }
            callback(null, json);
            callback = null;
        }
    }.bind(xhr);
    xhr.send();
}

function edit_localStorage_menu(m) {
    var win = new OverlayWebWindow(m.menuName + ' > ' + m.menuItemName, m.data, 640, 480);
    win.visibleChanged.connect(win, 'deleteLater');
    win.closed.connect(win, 'deleteLater');

    win.webEventReceived.connect(this, function(str) {
        try {
            var msg = JSON.parse(str);
            if (msg.reset) {
                var OK = msg.reset !== 'confirm' || Window.confirm('reset changes?');
                return OK && win.emitScriptEvent(
                    JSON.stringify({ userscripts: getUserScripts().join('\n') }));
            }
            if (LOCALSTORAGE_KEY in msg) {
                var local = (msg.userscripts||'').trim().split(/[\r\n]+/).filter(Boolean);
                log('new userscripts.local', JSON.stringify(local));
                localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(local));
                local.push(":edit_localStorage_menu # Edit (localStorage) menu...");
                menus._update({ '(localStorage)': local });

                win.emitScriptEvent(JSON.stringify({ status: 'OK' }));
                Script.setTimeout(win.close.bind(win), 500);
            }
        } catch(e) {
            log('edit_localStorage_menu webEvent', msg, e);
            win.emitScriptEvent(JSON.stringify({ status: 'ERROR: '+e }));
        }
    });
    win.setURL('data:text/html;text,' + [
        '<script src="qrc:///qtwebchannel/qwebchannel.js"></script>',
        '<script>('+function() {
            save = function() {
                _status.innerHTML = 'saving...';
                resetbutton.disabled = savebutton.disabled = true;
                EventBridge.emitWebEvent(JSON.stringify({
                    userscripts: userscripts.value || ' '
                }));
                EventBridge.scriptEventReceived.connect(function once() {
                    setTimeout(function() {
                        resetbutton.disabled = savebutton.disabled = false;
                    }, 1000);
                    EventBridge.scriptEventReceived.disconnect(once);
                });
            };
            reset = function(force) { EventBridge.emitWebEvent(JSON.stringify({reset:force||'confirm'})); };
            new QWebChannel(qt.webChannelTransport, function(channel) {
                EventBridge = channel.objects.eventBridgeWrapper.eventBridge;
                EventBridge.scriptEventReceived.connect(function(x){
                    var msg = JSON.parse(x);
                    if ('status' in msg)
                        _status.innerHTML = msg.status;
                    if ('userscripts' in msg) {
                        userscripts.value = msg.userscripts;
                        userscripts.disabled = false;
                    }
                    if (!/error/i.test(x))EventBridge.emitWebEvent(JSON.stringify({ message: 'unknown script event: ' + JSON.stringify(x) }));
                });
                reset(true);
            });
            window.onresize = function() {
                userscripts.style.width = (innerWidth)+'px';
                userscripts.style.height = (innerHeight - userscripts.offsetTop)+'px';
            };
            window.addEventListener('DOMContentLoaded', window.onresize);
        }+')();</script>',
        '<style>',
        'body { overflow: hidden; width: 640px; margin:0; padding:0 }',
        'button, #_status{ display:inline-block; }',
        'textarea { margin: 0; white-space: nowrap;  }',
        '</style>',
        '<button id=savebutton onclick=save()>save</button>',
        '<button id=resetbutton style=background-color:pink;transform:scale(.8) onclick=reset()>reset</button>',
        '<i style=font-size:12px id=_status>... one url#menuItemName per line</i>',
        '<br /><textarea id=userscripts disabled></textarea>',
    ].filter(Boolean).join('\n'));
};
