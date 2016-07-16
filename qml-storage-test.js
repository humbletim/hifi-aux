//
//  qml-storage-test.js
//
//  Created by humbletim on 14 Jul 2016
//

var cache_buster = (+new Date).toString(36);
//note:
//  '#' cache busters are not sent over HTTP -- they just coerce Interface to reload the resource
//  '?' cache busters are sent to the server -- more reliable, but often unnecessary

var qmlURL = Script.resolvePath('storage.qml#' + cache_buster);

// FIXME: for some reason 304 Not Modifieds trip-up Interface if only busting with '#' here...
var bluebirdURL = Script.resolvePath('hifi-bluebird.js') + '?' + cache_buster; 

Script.include(bluebirdURL);

var log = print.bind(this, '[qml-storage-test]');

// TODO: refactor the different puzzle pieces into own modules
storage = {
    // signal handlers
    messageReceived: function onmsg(channel, message, sender, local) {
        if (channel == 'qml-storage' && local) {
            log('onmsg', channel, message, sender, local);
        }
    },
    scriptEnding: function() {
        this.cleanup();
        this.window && this.window.close();
    },

    // QML OverlayWindow
    qml: qmlURL,
    window: null,

    // mini RPC tango (HiFi Scripting <-> QML Scripting)
    callbacks: {
        'destroyed': {
            resolve: Script.stop.bind(Script)
        },
        'storage-ready': {
            reject: function(err) {
                log('storage-ready error: ', err);
                throw new Error(err);
            },
            resolve: function(commands) {
                storage.SQL.commands = commands;
                commands.forEach(function(command) {
                    log('binding SQL.'+command);
                    storage.SQL[command] = storage.rpc.bind(storage, command);
                });
                storage.SQL.ready.forEach(function(f) {
                    try { f.call(storage.SQL, commands); } catch(e) { log('error in ready handler: ', e); }
                });
                storage.SQL.ready.splice(0, storage.SQL.ready.length);
            }
        }
    },
    fromQml: function(ctx) {
        log('fromQml', typeof ctx, JSON.stringify(ctx));
        if (ctx.id in this.callbacks) {
            var dfd = this.callbacks[ctx.id];
            log('rpc...', ctx.id, dfd);
            if (ctx.error)
                dfd.reject(new Error(ctx.error));
            else
                dfd.resolve(ctx.result);
            return;
        }
        if (ctx === 'storage-ready')
            Messages.sendLocalMessage('qml-storage', this.window.objectName);
    },
    rpc: function rpccall(func, varargs) {
        var args = [].slice.call(arguments, 1);
        var dfd = {
            message: {
                id: 'rpc-'+func+'-'+(+ new Date + Math.round(1e6*Math.random())).toString(36),
                rpc: func,
                args: args
            },
            send: this.window.sendToQml.bind(this.window)
        };
        this.callbacks[dfd.message.id] = dfd;
        return dfd.promise = new Promise(function(resolve, reject) {
            dfd.reject = reject;
            dfd.resolve = resolve;
            dfd.send(dfd.message);
        }).bind(dfd)
          .timeout(5000)
          ['finally'](function() {
              delete storage.callbacks[dfd.message.id];
          })
          ['catch'](function(err) {
              log('rpc error: ' + err);
              throw err;
          });
    },

    // SQLite stuff -- this Object gets populated with the API commands (received async from the QML side during initialization)
    SQL: {
        commands: null,
        ready: [function() { log('ready'); }],
        init: function() {
            if (this.commands)
                return Promise.resolve(this.commands).bind(this);
            return new Promise(function(resolve, reject) {
                storage.rpc.exists;
                storage.SQL.ready.push(resolve);
                log('waiting for storage-ready event from QML...');
            }).bind(this).timeout(5000)['catch'](function(err) {log(err); throw err; });
        }
    },

    // signal management
    connects: [],
    connect: function(ob, signal, handler, scope) {
        if (scope)
            handler = handler[scope];
        else if (arguments.length === 2)
            handler = this[signal].bind(this);
        if (!handler)
            throw new Error('!handler', signal);
        var ret = ob[signal].connect(handler);
        this.connects.push({
            toString: function() { return signal; },
            dispose: function() {
                ob[signal].disconnect(handler);
            }
        });
        return ret;
    },
    cleanup: function() {
        this.connects.splice(0,this.connects.length).forEach(function(f,i) {
            log('storage.cleanup', i, f);
            try { f.dispose() } catch(e) { log('storage.cleanup error: ', e); }
        });
    }
};

storage.connect(Messages, 'messageReceived');
storage.connect(Script, 'scriptEnding');

storage.window = new OverlayWindow({
    title: 'SQLite Console',
    source: storage.qml,
    visible: true,
    width: 480,
    height: 128
});
storage.window.objectName = 'qml-storage';
storage.connect(storage.window, 'fromQml');

// note: eventually everything above this line won't be seen in practice...
// instead it'll work something more like this:
//  Script.include('qml-sqlite-settings.js');
//  SQLiteSettings.get('settingsname', 'defaultvalue').then(function(val) { print('settings value: ', val); });

storage.SQL.init().then(function(commands) {
    log('SQLite ready; available wrapper commands are: '+commands);
    storage.SQL.get('count').then(log);
});
