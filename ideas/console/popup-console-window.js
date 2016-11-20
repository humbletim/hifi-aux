// work in progress
//
// popup-console-window.js
//
//  Use to create a popup console for debug output (or to log to an existing console from other local scripts).
//
// -- humbletim @ 2016.11.02

// HiFi Client mode
if (typeof Script === 'object') {
    Script.include(Script.resolvePath('../../snippets/extract-parameters.js'));
    Script.include(Script.resolvePath('../../snippets/JSON-stringifiable.js'));
    //Script.include(Script.resolvePath('../lib/WebWindowEx/signal.js'));
    Script.include('https://git.io/glm-js.min.js');
    Function.prototype.bind = Function.prototype.bind||function(){var fn=this,s=[].slice,a=s.call(arguments),o=a.shift();return function(){return fn.apply(o,a.concat(s.call(arguments)))}};
    var log = function log() { print('popup-console-window | ' + [].join.call(arguments, ' ')); };
    var params;
    try { throw new Error('stack'); } catch(e) {
        params = extractParameters(e.fileName);
        Script.include('http://cdn.xoigo.com/hifi/analytics.min.js');
        try { ua.used(params); } catch(e) { log(e); }
    }
    
    var _FONTS = ["Indie Flower", "Coming Soon", "Neucha", "Bad Script", "Nothing You Could Do", "Electrolize","Orbitron","Russo One","Allerta Stencil", "Architects Daughter", "Space Mono", "Inconsolata", "Share Tech Mono", "Nova Mono", "Open Sans", "Roboto", "Lato", "PT Sans", "Source Sans Pro", "Exo", "Exo 2", "Ubuntu", "Istok Web", "Nobile"];

    if (params.font)
        _FONTS.unshift(params.font);

    var defaultOptions = {
        title: 'popup console logger',
        visible: true,
        width: glm.clamp(Overlays.width()*.8, 320, 800),
        height: glm.clamp(Overlays.height()*.8, 240, 600),
        hljstheme: 'ir-black',
        zoom: 1,
        styles: '',
        autoshow: true,
        channel: 'console',
        global: 'console',
        invert: false,
        uicfg: false,
    };
    defaultOptions.FONTS = _FONTS;
    defaultOptions.font = 'Electrolize';//_FONTS[Math.floor(Math.random() * _FONTS.length)];
    defaultOptions._styles = '';//getDefaultStyles();

    var settings = defaultOptions;
    for(var p in params)
        settings[p] = params[p];

    // module systems magic dance
    var global = (1,eval)('this');
    global.PopupConsoleWindow = PopupConsoleWindow;
    try { module.exports = PopupConsoleWindow; } catch(e) {}

    var methods = 'clear,log,debug,info,warn,error'.split(',');

    PopupConsoleWindow.print = PopupConsoleWindow._print;
    PopupConsoleWindow.proxy = function(channel, print) {
        function noop(){}
        channel = channel || settings.channel;
        return  methods
            .reduce(
                function(con, v) {
                    con[v] = function() {
                        (print || PopupConsoleWindow.print || noop)('['+v+']', [].slice.call(arguments).join(' '));
                        Messages.sendLocalMessage(channel, JSON.stringify({
                            level: v,
                            args: JSON.stringifiable([].slice.call(arguments), { maxDepth: 3 })
                        }));
                    };
                    return con;
                },
                {
                    toString: function() { return '[PopupConsoleWindow remote channel='+channel+']'; },
                    clear: Messages.sendLocalMessage.bind(Messages, channel, ':clear:'),
                    print: function() {
                        var args = [].join.call(arguments, ' ');
                        (print || PopupConsoleWindow.print || noop)(args);
                        Messages.sendLocalMessage(channel, args);
                    },
                    pretty: (function() {
                        var _pretty = function(v) {
                            //print('_pretty', v);
                            try {  var args = JSON.stringifiable([].slice.call(arguments, 1), { maxDepth: 3 }); }
                            catch(e) { args = JSON.stringifiable(e); }
                            (print || PopupConsoleWindow.print || noop)(
                                [].map.call(args, PopupConsoleWindow.prototype.prettify.bind(PopupConsoleWindow.prototype))
                            );
                            Messages.sendLocalMessage(channel, JSON.stringify({
                                level: v, pretty: true, args: args
                            }));
                        };
                        var pretty = _pretty.bind(_pretty, 'log');
                        methods.forEach(function(v) { pretty[v] = _pretty.bind(_pretty, v); });
                        pretty.print = print;
                        return pretty;
                    })(),
                }
            );
    };
    
    function PopupConsoleWindow(_options) {
        _options = _options || {};
        _options.uicfg = 'uicfg' in _options ? _options.uicfg : 'uicfg' in params ? params.uicfg : defaultOptions.uicfg;
        var options = JSON.parse(JSON.stringify(settings)); // clone
        for(var p in _options)
            options[p] = _options[p];

        // for sanity reasons "there can only be one" popup window per channel
        options.TCOBO = options.TCOBO || Uuid.generate();

        log('options', JSON.stringify(options,0,2));
        //log('height',options.height);
        // nest in __proto__ so references can be easily disabled if/when native window is destroyed
        // (avoiding segfaults)
        var win = {  __proto__: new OverlayWebWindow(options) };
        for(var p in PopupConsoleWindow.prototype)
            win[p] = PopupConsoleWindow.prototype[p];

        win._options = _options;
        win.options = options;
        win.send_queue = [];

        var mksender = function mksender(n) { return win.send.bind(win, ':'+n+':'); }
        win.print = win.console.print = mksender('text');
        methods
            .reduce(function(con, v) { con[v] = mksender(v); return con; }, win.console);
        win.pretty = function() { win.log.apply(win, [].map.call(arguments, win.prettify.bind(win))); };
        //win.pretty.print = win.pretty;
        win.bound = win.print.bind(win);
        //win.bound.print = win.bound;
        methods.concat('print').forEach(function(v) {
            win.pretty[v] = function() {
                win[v].apply(win, [].map.call(arguments, win.prettify.bind(win)));
            };
            win.bound[v] = win.console[v].bind(win.console);
        });
        for(var p in win.console)
            win[p] = win.console[p];

        win.webEventReceived.connect(win, 'onWebEventReceived');

        var cleanups = win.cleanups = [];
        Script.scriptEnding.connect(win, 'cleanup');
        {
            Messages.subscribe(options.channel);
            Messages.messageReceived.connect(win, 'onMessageReceived');
            cleanups.push(Messages.unsubscribe.bind(Messages, options.channel));
            cleanups.push(Messages.messageReceived.disconnect.bind(Messages.messageReceived, win, 'onMessageReceived'));
        }

        var highlightjs_base = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0';

        win.setURL(Script.resolvePath('').replace('.js','.html')+'#options='+encodeURIComponent(JSON.stringify(
            { font: options.font, hljstheme: options.hljstheme, now: new Date() }
        )));

        win.visibilityChanged && win.visibilityChanged.connect(win, 'onVisibilityChanged');
        win.visibleChanged && win.visibleChanged.connect(win, 'onVisibleChanged');
        win.closed && win.closed.connect(win, 'onClosed');

        return win;
    }//PopupConsoleWindow

    PopupConsoleWindow.prototype = {
        send_queue: null,
        FONTS: _FONTS,
        cleanup: function() {
            this.cleanups.splice(0,this.cleanups.length)
                .forEach(function(f) { try { f(); } catch(e) { log('cleanup error:',e); } });
        },
        destroy: function() {
            this.cleanup();
            try {
                // prevent segfaults once underlying window is deleted
                var w = this.__proto__;
                this.__proto__ = {};
                w.deleteLater && w.deleteLater();
            } catch(e) {
                log(e);
            }
            log('destroyed');
        },
        onMessageReceived: function(c,m,s,l) {
            if (!l || c !== this.options.channel) return;
            if (~m.indexOf('TCOBO:')) {
                if (this.options.TCOBO && this.options.TCOBO !== Settings.getValue('TCOBO/'+this.options.channel, this.options.TCOBO)) {
                    log(m, 'terminating in favor of new '+this.options.channel+' instance');
                    //Script.stop();
                    this.destroy();
                }
                return;
            }
            try { var msg = JSON.parse(m); } catch(e) {}
            if (Array.isArray(msg && msg.args) && msg.level in this.console) {
                if (msg.pretty)
                    this.pretty[msg.level].apply(this.pretty, msg.args);
                else
                    this.console[msg.level].apply(this.console, msg.args);
            } else
                this.print('(msg)', m);
        },
        test: function() {
            this.print('check check');
            for (var p in this.console)
                p !== 'clear' && this.console[p](p, "check",1,2,3,{},[]);
            this.setZoom(.5);
            Script.setTimeout(this.setZoom.bind(this,1), 1000);
            //this.setStyleSheet([ '.log { font-family: "Comic Sans MS", Fantasy; }', 'body { background-color: #333; }']);
            //this.setStyleSheet('https//rawgit.com/...../.css');
            //this.setStyleSheet(null);
            
            Script.setTimeout(this.setStyleSheet.bind(this, null), 1500);
            this.pretty('MyAvatar.position', MyAvatar.position);
            this.pretty('MyAvatar.orientation', MyAvatar.orientation);
        },
        send: function send(fmt) {
            if (this.send_queue) {
                this.send_queue.push([].slice.call(arguments));
                return false;
            }
            if (~fmt.indexOf('%s'))
                this.emitScriptEvent(fmt.replace('%s', [].slice.call(arguments,1).join(' ')));
            else
                this.emitScriptEvent([].join.call(arguments, ' '));
            if (!!this.options.autoshow === true) {
                var v = this.visible;
                this.visible = true;
                if (!v)this.raise();
            }
        },
        onWebEventReceived: function(msg) {
            log('onWebEventReceived', msg, (this.send_queue && this.send_queue.length)+'');
            var options = this.options;
            if (msg === 'ready') {
                var send_queue = this.send_queue;
                this.send_queue = null;

                Settings.setValue('TCOBO/'+options.channel, options.TCOBO);
                Messages.sendLocalMessage(options.channel, 'TCOBO:'+options.TCOBO);

                if (options.invert)
                    this.send(':debug:invert='+options.invert);
                this.send(':styles:', options._styles);
                this.send(':FONTS:' + (!options.uicfg ? [] : options.FONTS));
                if (options.styles)
                    this.setStyleSheet(options.styles);
                if (options.css)
                    this.setStyleSheet(options.css);
                if(isFinite(options.zoom) && options.zoom !== this.zoom)
                    this.setZoom(options.zoom);
                if(options.font !== this.font)
                    this.setFont(options.font);
                if (options.test) {
                    this.test();
                    this.pretty(options);
                }
                this.pretty('(params)', params);

                if (send_queue) {
                    this.print('processing send_queue #'+send_queue.length);
                    send_queue.forEach(function(args) {
                        this.send.apply(this, args);
                    }.bind(this));
                }
            }
        },
        setZoom: function(z) { this.send(':zoom:'+(this.zoom=z)); },
        setFont: function(f) { this.send(':font:'+(this.font=f)); },
        setTheme: function(t) { this.send(':theme:'+(this.theme=t)); },
        setStyleSheet: function(o) {
            if (o === null) {
                this.send(':style:');
                this.send(':stylesheet:');
                return;
            }
            var s = (Array.isArray(o) ? o : [].slice.call(arguments)).join('\n');
            if (~s.indexOf('{'))
                this.send(':style:', s);
            else
                this.send(':stylesheet:', s);
        },
        prettify: function prettify(o) {
            // if(typeof p==='string' && typeof o === 'object' && p in(o||{}))
            // o = o[p];
            glmize.depth = 0;
            function glmize(o, precision, recurse) {
                glmize.depth++;
                if (o && typeof o === 'object') {
                    if ('w' in o)
                        o = glm.$to_glsl(glm.degrees(glm.eulerAngles(glm.quat(o))), { precision: precision }).replace('vec3','degrees');
                    else if ('z' in o)
                        o = glm.$to_glsl(glm.vec3(o), { precision: precision });
                    else if (o.r0c0) {
                        var m4 = glm.transpose(glm.mat4(Object.keys(o).sort().map(function(x){ return o[x]})));
                        o = glm.$to_glsl(m4);
                        if (~o.indexOf(','))
                            o = glm.$to_string(m4,{ precision: precision}).replace('4x4','4');
                    }
                    else if (recurse > glmize.depth) {
                        var O={};
                        for(var p in o)
                            O[p] = glmize(o[p], precision, recurse);
                        o = O;
                    }
                    if (typeof o === 'string')
                        o = o.replace(/\(0[.]0+\)/,'(0)');
                }
                glmize.depth--;
                return o;
            }                
            try {
                o = glmize(o, 1, 3);
                //p = p ? p+' = ' : '';
                if (o && typeof o === 'object')
                    o = this.stringify(o);
            } catch(e) {}
            
            return o;
        },
        console: {
            // dir: function(obj, prop) {
            //     var hint = (obj+'').split(/\W/)[0];

            //     if (obj && typeof obj === 'object') {
            //         if (typeof prop === 'string' && prop in obj)
            //             obj = obj[prop];
            //         if (!obj || typeof obj !== 'object')
            //             return this.json(obj);
            //         prop = prop || '';
            //         hint = ((obj+'').split(/\W/)[0]||hint)+'.';
            //         obj = JSON.parse(win.stringify(obj));
            //         for(var p in obj)
            //             this.send(':dir:'+hint+prop+p+': '+win.stringify(obj[p]));
            //     } else
            //         this.json(obj);
            // },
        },
        _rollups: {
            matvec: /[{][\s\n]+(?:"\w+": [-.0-9e]+,[\n\s]+)+"\w+": [-.0-9e]+[\n\s]+[}]/g,
            arrstr: /\[[^{}\[\]()]+\]/g,
        },
        stringify: function(obj) {
            var str = JSON.stringify(JSON.stringifiable(obj, { maxDepth:3 }),0,2) || '';
            for(var p in this._rollups)
                str = str.replace(this._rollups[p], function(_) { return _.replace(/\n/g,' ').replace(/  +/g,' '); });
            return str;
        },
        // try to handle shown vs. visible vs. temporary roving hiding etc.
        maybeDestroy: function maybeDestroy() {
            try {
                function ignore(reason) { log('ignoring onclose event:',reason); }
                if (!this.destroy)
                    return ignore('!this.destroy');
                if (this.visible === true)
                    return ignore('this.visible==='+this.visible);
                if (this.options.autoshow)
                    return ignore('autoshow==='+this.options.autoshow + ' (window will be reshown with any next console log entry)');
                try {
                    var roving = Toolbars.getToolbar('com.highfidelity.interface.toolbar.system').readProperty('width') < 100;
                    if (roving)
                        return ignore('roving==='+roving);
                } catch(e) {}
                this.destroy();
            } catch(e) {
                log('maybeDestroy error:', e);
            }
        },
        maybeClosed: function maybeClosed(event) {
            log('maybeClosed', event);
            try {
                maybeClosed.busy = true;
                var delta = (this.$maybeClosed = +new Date) - this.$onclosed;
                //log('maybeClosed', delta, this.$maybeClosed, this.visible);
                if ((delta < 500 && !this.visible) || delta < 100) {
                    if (this.visible)
                        this.visible = false;
                    this.maybeDestroy();
                }
            } finally {
                maybeClosed.busy = false;
            }
        },
        onClosed: function onClosed() {
            this.$onclosed = +new Date;
            log('onClosed', this.$onclosed);
        },
        onVisibleChanged: function onVisibleChanged(v) { this.maybeClosed('onVisibleChanged', v); },
        onVisibilityChanged: function onVisibilityChanged(v) { this.maybeClosed('onVisibilityChanged', v); },
    };

    // if visible specified in URL start up the window
    if (params.visible) {
        print('declaring direct console as', settings['global']);
        global[settings['global']] = new PopupConsoleWindow();
    } else if (params['global']) {
        print('exporting remote console as', settings['global']);
        global[settings['global']] = PopupConsoleWindow.proxy();
    }
    
} else {
    // HTMLmode
    var log = function log() { console.log('popup-console-window |' + [].join.call(arguments, ' ')); };

    var options = {};
    location.href.replace(/\boptions=([^&#?]+)/, function(_, json) {
        options = JSON.parse(unescape(json));
    });
    console.info('options' + JSON.stringify(options,0,2) + typeof FONTS);

    function popup_console_initialize_dom() {
        //console.info('window_onload '+ document.body.previousSibling.outerHTML);
        var n=0, ms=100;
        var i = setInterval(function() {
            n++;
            if (!window.EventBridge) {
                if (n % (1000/ms)) return;
                var secs = n/(1000/ms);
                if (secs > 2) {
                    clearInterval(i);
                    document.body.style.backgroundColor='#f33';
                    output.innerHTML += '<button onclick=location.reload()>EventBridge not found -- click to reload</button>';
                }
                return output.innerHTML += '<div>waiting on EventBridge...'+secs+'</div>';
            }
            clearInterval(i);
            window.EventBridge.scriptEventReceived.connect(onmsg=function(msg) {
                var mode=msg.split(":",2)[1],str=mode&&msg.substr(mode.length+2).trim();
                //console.info(['scriptEventReceived',msg,mode,str.replace(/\n/g,'\\n')].join('|'));
                if(mode === "clear")
                    output.innerText="";
                else if (/^(?:log|debug|info|warn|error)/.test(mode)) {
                    if (mode === 'debug') {
                        str.replace(/^(invert(?:ed)?|bold|fonts)=(on|off|1|0|true|false|toggle)/, function(_, k, v) {
                            if (/^invert/.test(k)) {
                                invert(null, v === 'toggle' ? undefined : /1|true|on/.test(v));
                            } else if (k === 'fonts') {
                                var cur = window.getComputedStyle(uicfg).display;
                                var next = (
                                    v === 'toggle' ?
                                        (cur === 'none' ? 'block' : 'none') :
                                    (/1|true|on/.test(v) ? 'block' : 'none')
                                );
                                uicfg.style.display = next;
                                return [cur, next, uicfg.style.display];
                            }
                        });
                    }
                    var highlight;
                    dummy.innerHTML =
                        "<div class='row "+mode+"'>"+(
                            "<span class=level>["+('     '+mode).substr(-5).replace(/ /g,'&nbsp;')+"]</span>" + (function() {
                                try {
                                    var prefix, json = str.replace(/^([^\{\[]+\s*)([\{\[])/, function(_, a, b) { prefix = a; return b; });
                                    var v = JSON.parse(json);
                                    if (typeof v === 'object') {
                                        highlight = true;
                                        json = json.replace(/: ("(?:vec3|mat4|degrees)\([^\"]+\)")/g, function(_, s) {
                                            return ': '+JSON.parse(s);
                                        });
                                        return encode(prefix) + "<pre class=hljs><code class=js>"+encode(json)+"</code></pre>";
                                    }
                                    return encode(str);
                                } catch(e) {
                                    return encode(str);
                                }})()
                        )+"</div>";
                    output.appendChild(dummy.firstChild);
                    if (highlight)
                        hljs.highlightBlock([].slice.call(output.querySelectorAll('pre code')).pop());
                } else if (mode === "print"||mode==="text")
                    dummy.innerHTML="<div class=row><pre>"+encode(str)+"</pre></div>",output.appendChild(dummy.firstChild);
                else if (mode==="html")
                    dummy.innerHTML="<div class=row>"+encode(str)+"</div>",output.appendChild(dummy.firstChild);
                else if (mode==="styles")
                    styles.innerText = str;
                else if (mode==="style")
                    userstyles.innerText = str;
                else if (mode==="stylesheet")
                    console.info(userstylesheet.href = /[?]$/.test(str) ? str + new Date().getTime().toString(36) : str);
                else if (mode==="zoom")
                    onmsg(':text:zoom='+((CLEAR.style.zoom=output.style.zoom=1*str)).toFixed(1));
                else if (mode==="js") {
                    dummy.innerHTML="<pre class=hljs><code class=js>"+encode(str)+"</code></pre>",output.appendChild(dummy.firstChild);
                    hljs.highlightBlock([].slice.call(output.querySelectorAll('pre code')).pop());
                } else if (mode==="json") {
                    dummy.innerHTML="<pre class=hljs><code class=json>"+encode(str)+"</code></pre>",output.appendChild(dummy.firstChild);
                    hljs.highlightBlock([].slice.call(output.querySelectorAll('pre code')).pop());
                } else if (mode==="FONTS") {
                    FONTS.innerHTML = str.split(',').map(function(f) { return '<button onclick="setfont(this)">'+f+'</button>'; }).join('');
                    uicfg.style.display = str ? 'block' : 'none';
                } else if (mode==="font") {
                    font.href = font.href.split('=')[0]+'='+str;
                    fontstyle.innerText = '* { font-family: "'+str+'"; }';
                    onmsg(':text:font='+font.href);
                    [].forEach.call(FONTS.childNodes, function(n) {
                        n.className = ['','current'][+(n.innerText === str)];
                    });
                    setTimeout(function() {
                        document.body.scrollTop = document.body.scrollHeight*2;
                    }, 1000);
                } else if (mode==="theme") {
                    var tmp = theme.href.split('/');
                    tmp.pop();
                    tmp.push(str+'.min.css');
                    theme.href = tmp.join('/');
                    onmsg(':text:theme='+theme.href);
                }
                // else if (mode==="dir") {
                //     var b = str.split(':',1);
                //     str = str.substr(b.length+2);
                //     dummy.innerHTML="<pre class=hljs><code class=js><b>"+b+"</b>"+encode(' '||str)+"</code></pre>",output.appendChild(dummy.firstChild);
                //     hljs.highlightBlock([].slice.call(document.querySelectorAll('pre code')).pop());
                // }
                else console.error(["errrm",msg]);
                document.body.scrollTop = document.body.scrollHeight*2;
                while(output.childNodes.length > 2048)
                    output.removeChild(output.firstChild);
            });
            onmsg(":print:EventBridge bridged");
            EventBridge.emitWebEvent("ready");
            setfont = function(n) { onmsg(":font:"+n.innerText) };
            zoom = function(n) { onmsg(":zoom:"+((output.style.zoom*1||1) + (n.innerText==='+'?+.1:-.1))); };
            invert = function(n, val) {
                var c = document.body.className;
                var inverted = val === undefined ? !/inverted/.test(c) : val;
                document.body.className = c.replace(/ inverted/g,'') + (inverted ? ' inverted' : '');
                onmsg(":text:invert="+inverted);
            };
            bold = function(n) {
                var c = document.body.className;
                document.body.className = c.replace(/ bold/g,'') + (/bold/.test(c) ? '' : ' bold');
                n.className = /bold/.test(document.body.className) ? 'bold' : '';
                onmsg(":text:body.className="+document.body.className);
            };
            onerror = function(e)  { console.error('onerror:'+e); }
        },ms);
        function encode(r){
            r = r+'';
            // allow simple font, bold and italic through unscathed
            r = r.replace(/<\/?(font|b|i)[^>]*>/g, function(_, tag) {
                return _.replace('<', '__LT__').replace('>','__GT__').replace(/\"/g,'__QUOT__');
            });
            r = r.replace(/[\x26\x0A\<>'"]/g,function(r){return"&#"+r.charCodeAt(0)+";"});
            return r.replace(/__LT__/g, '<').replace(/__GT__/g, '>').replace(/__QUOT__/g,'"');
        }
    }
}//HTMLmode
