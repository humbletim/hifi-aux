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
    target = (self.substr(1).match(/\b(?:https?|file|apt|data|javascript):.+$/)||[])[0];

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

log('...... including:', target);
Script.include(target);
