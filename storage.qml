//
//  qml-storage-test.js
//
//  Created by humbletim on 14 Jul 2016
//

import QtQuick 2.5
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import Qt.labs.settings 1.0

import QtQuick.LocalStorage 2.0

Column {
    id: root
    spacing: 6
    property var window: null
    anchors.fill: parent
    Row {
        id: log_row
        spacing: 6
    }
    Row {
        id: icons_row
        spacing: 6
        width: parent.width
        visible: true
    }
    Row {
        id: debug_row
        width: parent.width
        spacing: 6
        Item {
            height: root.height - icons_row.height - 18
            width: parent.width
            Rectangle {
                width: parent.width
                visible: true
                height: parent.height
                color: 'black'
                opacity: .95
            }
            ScrollView {
                id: scrollArea
                horizontalScrollBarPolicy: Qt.ScrollBarAlwaysOn
                verticalScrollBarPolicy: Qt.ScrollBarAsNeeded
                anchors.fill: parent
                visible: true
                onHeightChanged: { flickableItem.contentY = flickableItem.contentHeight - viewport.height; }
                TextEdit {
                    property var lines
                    property alias flickableItem: scrollArea.flickableItem
                    property alias viewport: scrollArea.viewport
                    id: debug
                    onTextChanged: { flickableItem.contentY = flickableItem.contentHeight - viewport.height; }
                    readOnly: true
                    visible: true
                    selectByKeyboard: true
                    selectByMouse: true
                    color: '#fff'
                    antialiasing: false
                    smooth: false
                    font.pixelSize: 10
                    textFormat: TextEdit.RichText
                    font.family: 'system' || ','+myfont.name+',Inconsolata,sans-serif,monospace'
                }
                style: ScrollViewStyle {
                    padding.right: -4
                    padding.bottom: -6
                    corner: Item { visible: false }
                    scrollBarBackground: Item {
                        visible: false
                        implicitWidth: 10
                        implicitHeight: 10
                    }
                    incrementControl: Item { visible: false }
                    decrementControl: Item { visible: false }
                    handle: Item {
                        implicitWidth: 4
                        implicitHeight: 4
                        Rectangle {
                            color: '#fff'
                            opacity: .5
                            anchors.fill: parent
                        }
                    }
                }
            }
        }
    }
    Row {
        id: console_row
        width: parent.width
        spacing: 6
        Item {
            height: root.height - icons_row.height - debug_row.height
            width: parent.width
            y: -2
            Rectangle {
                y: -2
                //anchors.fill: parent
                width: parent.width
                visible: true
                height: parent.height
                color: 'black'
                opacity: .98
            }
            TextEdit {
                color: 'lime'
                antialiasing: false
                smooth: false
                font.pixelSize: 10
                font.family: 'system' || ','+myfont.name+',Inconsolata,sans-serif,monospace'
                id: input
                focus: true
                width: parent.width
                property var history
                property var index: -1
                Settings {
                    category: 'sqlite/storage.qml'
                    property alias history: input.history
                }
                Component.onCompleted: {
                    history = history || [
                        'SELECT * FROM sqlite_master',
                        'SELECT * FROM tim_settings LIMIT 10'
                    ];
                    history = history.reverse().slice(0,99).reverse();
                    index = history.length;
                    text = history[history.length-1];
                    cursorPosition = text.length;
                }
                onFocusChanged: {
                    if (input.focus)
                        window.pinned = true;
                    else
                        window.pinned = false;
                    input.color = input.focus ? 'lime' : 'green'
                    //log('focusChanged', window, JSON.stringify([input.focus, window && window.pinned]));
                }
                Keys.onPressed: {
                    if (event.key === Qt.Key_Up) {
                        if (text && index === history.length-1 && history[index] !== text)
                            history.push(text);
                        --index;
                        if (index < 0) index = 0;
                        if (index > history.length) index = history.length;

                        text = history[index] || '';
                    } else if (event.key === Qt.Key_Down) {
                        ++index;
                        if (index < 0) index = 0;
                        if (index > history.length) index = history.length;
                        text = history[index] || '';
                    } else {
                        return;
                    }
                    cursorPosition = text.length;
                    console.log('history['+index+'] / length', history.length);
                }
                Keys.onReturnPressed: {
                    console.log(event.key)
                    if (text.length) {
                        log.info('<i>'+ text+'</i>');
                        
                        if (text === 'clear')
                            debug.text = ''
                        else {
                            var result = db.$execute(text);
                            if (result && result.code && result.message)
                                log.error(result.message, 'error code: '+result.code+'<br />');
                            else
                                log({ date: ' ', text: '<pre style="font-size:12px;margin:0px;padding:0px;margin-left:4px;">'+JSON.stringify(result,0,2)+'</pre>&nbsp;<br />'});
                        }
                        if (history[history.length-1] !== text)
                            history.push(text);
                        index = history.length;
                        text = '';
                    }
                }
            }
        }
    }
    //FontLoader { id: myfont; source: "interface/resources/fonts/FiraSans-Regular.ttf"; }
    Component.onDestruction: {
        (log || console.info)('onDestruction...');
        sendToScript({ id: 'destroyed' });
    }
    property var waiter: Timer {
        interval: 100
        repeat: true
        running: true
        property var ready
        onTriggered: {
            if (typeof Overlays === 'object') {
                if (!ready) {
                    ready = true;
                    sendToScript({ id: 'storage-ready', result: commands});
                    //interval = 1000;
                    stop();
                }
            }
        }
    }

    property alias lines: debug.lines
    Component { id: textBuilder; Text {} }
    Component.onCompleted: {
        waiter.readyChanged.connect(function once() {
            waiter.readyChanged.disconnect(once);
            window = parent.parent;
            //log('parent', parent.destroyOnCloseButton);
            //log('parent.parent', parent.parent, parent.parent.destroyOnCloseButton);
            //log('parent.parent.parent', parent.parent.parent, parent.parent.parent.destroyOnCloseButton);
            try {
                window.height += debug_row.height
                window.destroyOnCloseButton = true
                window.destroyOnHidden = true
            } catch(e) {
                log(e);
            }
            lines = new Array(25).join(',').split(',').map(function(x,i) {
                return { date: 'hh:mm:ss.zzz', icon: '', text: 'debug line '+i+'' };
            }).reverse();
            function mk(name, color) {
                log[name] = function() {
                    log({
                        //icon: '<img width=14 height=14 src="log-'+name+'.png" />',
                        text: '<span style="color:'+color+'">' + [].slice.call(arguments).join(' ')+'</span>'
                    });
                };
            };
            mk('debug', '#ccc');
            mk('warn', '#da0');
            mk('info', '#6af');
            mk('error', '#f11');

            log.info('ARGV: ' + Qt.application.arguments);

            ['debug','warn','info','error'].forEach(function(i) {
                log[i](i, 'test');
            });
            
            db = getDatabase('settings');
            //setTimeout(function() {
            log.info('SQLite Database loaded (table = '+db.table+')');
            log.debug(JSON.stringify(db.$execute('SELECT COUNT(*) FROM '+db.table)[0]));
        });
    }

    // ------------------------------------------------------------------------
    // logging stuff
    function log(_line) {
        var line;
        if (_line) {
            if (typeof _line == 'object' && 'text' in _line) {
                line = _line;
            } else {
                line = {
                    text: [].slice.call(arguments).join(' ')
                }
            }
            line.text = line.text || '';
            console.log('[storage.qml] ', line.text.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,''));
            line.date = line.date || Qt.formatDateTime(new Date(),'hh:mm:ss.zzz');
            line.icon = line.icon || '&nbsp;';
            lines = lines.slice(-25);
            if (lines[lines.length-1].text.split('\t')[0] === line.text)
                lines[lines.length-1].text = line.text+'\t...repeated\t'+((lines[lines.length-1].text.split('\t').pop()*1||1)+1);
            else
                lines.push(line);
        }
        debug.text = lines.map(function(x) {
            return /<pre/.test(x.text) ? [x.date, x.icon, x.text].join(' ') : '<table cellspacing=0 cellpadding=0 border=0 style="min-height:16px"><tr><td>['+(x.date||'')+']</td>'+
                //'<td width=14 align=center valign=middle>'+x.icon+'</td>'+
                '<td style="padding-left:8px;white-space:nowrap;">'+x.text+'</td></tr></table>'; })
            .join('\n');//+'<br />'+new Array(0).join('&nbsp;');
    }

    // ------------------------------------------------------------------------
    // SQLite stuff
    property var db
    property var commands: ['$version', '$execute', 'get','set','delete','getObject','setObject','getProperty','setProperty','getAll']
    signal sendToScript(var message);
    function fromScript(msg) {
        if (msg.rpc) {
            log('RPC', msg.rpc, (msg.args+'').substr(0,50)+'...');
            var logline = lines[lines.length-1];
            if (~commands.indexOf(msg.rpc)) {
                msg.result = db[msg.rpc].apply(db, msg.args);
                logline.text += ' OK';
                log();
                sendToScript(msg);
            } else {
                msg.error = 'rpc method not found: '+JSON.stringify(msg.rpc);
                logline.text += msg.error;
                sendToScript(msg);
            }
        }
    }
    function getDatabase(_table) {
        var table = 'tim_'+_table.replace(/[^_A-Za-z0-9]/g,'_');
        if (!getDatabase[table]) {
            var ret = getDatabase[table] = {
                $version: function() { return '0.0.0'; },
                _table: table,
                toString: function() { return '[timDatabase '+_table+' ('+table+')]'; },
                table: table,
                db: LocalStorage.openDatabaseSync("HelloApp", "0.1", "HelloAppDatabase", 100),
                log: function() {
                    (log||console.log)(this+' '+[].slice.call(arguments).join(' '));
                },
                $execute: function(sql) { return $execute.apply(this, arguments); },
                getAll: function() { return $rows.call(this); },
                dump: function() {
                    $rows.call(this).forEach(function(row) {
                        this.log(row);
                    }.bind(this));
                },
                get: function(key, default_value) { return $get.apply(this, arguments); },
                getObject: function(key, default_value) {
                    var json = this.get(key, null);
                    if (json === null)
                        return default_value;
                    try {
                        return JSON.parse(json);
                    } catch(e) {
                        this.log('getObject failed for key:', key);
                        return default_value;
                    }
                },
                getProperty: function(key, property, default_value) {
                    try {
                        var ob = this.getObject(key, null);
                        if (ob === null)
                            return ob;
                        if (key in ob)
                            return ob[key];
                    } catch(e) {
                        this.log('getProperty failed for key,prop: ', key, property, e);
                        return default_value;
                    }
                },
                delete: function(key, value) { return $delete.apply(this, arguments); },
                set: function(key, value) { return $set.apply(this, arguments); },
                setObject: function(key, value) {
                    try {
                        var json = JSON.stringify(value,0,2);
                        return this.set(key, json);
                    } catch(e) {
                        this.log('setObject failed for key:', key, e);
                        return e;
                    }
                },
                setProperty: function(key, property, value) {
                    try {
                        var ob = this.getObject(key, null);
                        if (ob === null) {
                            var tmp = {};
                            tmp[property] = value;
                            return this.setObject(key, tmp);
                        }
                        if (key in ob)
                            this.log('setProperty -- replacing ', key, property);
                        ob[key] = value;
                        return this.setObject(key, ob);
                    } catch(e) {
                        this.log('setProperty failed for key,prop: ', key, property, e);
                        return default_value;
                    }
                }
            };
            ret.db.transaction(function(tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS '+ret.table+'(setting TEXT UNIQUE, value TEXT)');
            });
        }
        return getDatabase[table];
    }

    function $set(setting, value) {
        var res = "";
        try {
            this.db.transaction(function(tx) {
                var rs = tx.executeSql('INSERT OR REPLACE INTO '+this.table+' VALUES (?,?);', [setting,value]);
                if (rs.rowsAffected > 0) {
                    res = rs.rowsAffected;
                } else {
                    res = "Error";
                }
            }.bind(this));
        } catch (err) {
            console.log(this.db.table+".set error:" + err);
            res = err;
        };
        return res;
    }

    function $delete(setting) {
        var res = 0;
        try {
            this.db.transaction(function(tx) {
                var rs = tx.executeSql('DELETE FROM '+this.table+' WHERE setting=?;', [setting]);
                if (rs.rowsAffected > 0) {
                    res = rs.rowsAffected;
                } else {
                    res = "Error";
                }
            }.bind(this));
        } catch (err) {
            console.log(this.db.table+".delete error:" + err);
            res = err;
        };
        return res;
    }

    function $execute(sql, args) {
        var ret = [];
        try {
            this.db.transaction(function(tx) {
                var rs = args ? tx.executeSql(sql, args) : tx.executeSql(sql);
                // for(var p in rs)
                //     log(p, rs[p]);
                var rows = rs.rows,
                    len = rows.length;
                for(var i=0; i < len; i++)
                    ret.push(rows.item(i));
                if (ret.length === 0 && /^\s*(insert|update|delete)/.test(sql))
                    ret = {
                        rowsAffected: rs.rowsAffected,
                        insertId: rs.insertId
                    };
            }.bind(this))
        } catch(err) {
            console.log(this.db+".execute error:" + err);
            err.toJSON = function() {
                return { code: this.code, message: this.message };
            };
            return err;
        }
        return ret;
    }

    function $rows() {
        var ret = [];
        try {
            this.db.transaction(function(tx) {
                var rs = tx.executeSql('SELECT * FROM '+this.table),
                    rows = rs.rows,
                    len = rows.length;
                for(var i=0; i < len; i++)
                    ret.push([rows.item(i).setting, rows.item(i).value]);
            }.bind(this))
        } catch(err) {
            console.log(this.db.table+".rows error:" + err);
        }
        return ret;
    }
    
    function $get(setting, default_value) {
        var res="";
        try {
            this.db.transaction(function(tx) {
                var rs = tx.executeSql('SELECT value FROM '+this.table+' WHERE setting=?;', [setting]);
                if (rs.rows.length > 0) {
                    res = rs.rows.item(0).value;
                } else {
                    res = default_value;
                }
            }.bind(this))
        } catch (err) {
            console.log(this.db.table+".get error:" + err);
            res = default_value;
        };
        return res
    }

    // ------------------------------------------------------------------------
    // setTimeout / clearTimeout polyfills using QML Timer as a clock source...
    property var _update: Timer {
        id: _update
        interval: 1000/60
        repeat: true
        running: true
    }

    function setTimeout(func, ms) {
        timer.id = 'timer-'+(setTimeout.i = (setTimeout.i||0)+1);
        function timer(dt) {
            if (timer.cleared !== 0) {
                if (timer.connected !== false) {
                    timer.connected = false;
                    _update.onTriggered.disconnect(timer);
                }
            }
            timer.pending -= dt;
            if (+new Date() >= timer.at) {
                console.log('setTimeout -- timeout!', timer.id);
                _update.onTriggered.disconnect(timer);
                func();
            }
        }
        timer.pending = ms/1000;
        timer.at = +new Date + ms;
        timer.cleared = 0;
        timer.connected = true;
        _update.onTriggered.connect(timer);
        return timer;
    }
    
    function clearTimeout(timer) {
        console.log('clearTimeout ', timer.id, timer.pending, timer.cleared);
        var old = timer.cleared;
        timer.cleared++;
        return !old;
    }
}


