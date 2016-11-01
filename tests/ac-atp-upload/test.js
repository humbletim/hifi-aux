var ATP_PATH = '/test/atp-upload.js',
    RESULTS  = [],
    UNIQUE   = new Date().getTime().toString(36),
    LOG      = function() { print('---- test-ac-atp |', [].join.call(arguments, ' ')); },
    JS       = '('+testfunc.toString()+')('+JSON.stringify(UNIQUE)+')';

function testfunc(unique) {
    var self = Script.resolvePath('');
    print('==== hello |', 'unique', unique, '@', self);
    RESULTS.push(unique);
}

main();

function main() {
    LOG('Waiting for Entities.serversExist...');
    var timer = Script.setInterval(function() {
        if (Entities.serversExist()) {
            LOG('...serversExist!');
            Script.clearInterval(timer);
            test_ATP_uploadData(JS, ATP_PATH);
        }
    }, 100);
}

function test_ATP_uploadData(data, path) {
    LOG('Attempting ATP upload...', data.length);
    Assets.uploadData(
        data, function(url) {
            var hash = url.replace('atp:','');
            if (!hash) {
                LOG('ERROR: did not receive ATP hash; aborting test.', url, hash);
                return;
            }
            LOG('ATP upload successful; hash=', hash);
            test_ATP_setMapping(path, hash);
        });
}

function test_ATP_setMapping(path, hash) {
    LOG('Attempting to set path mapping', hash, '->', path);
    Assets.setMapping(path, hash, function(_err, _path) {
        LOG('(mapping probably created)', _err, _path);
        test_Script_include('atp:'+path);
    });
}

function test_Script_include(url) {
    LOG('Performing Script.include test...', url);
    Script.include(url);
    testfunc(UNIQUE);
    if (RESULTS.length !== 2)
        return LOG('ERROR: expected RESULTS.length === 2', RESULTS);
    if (RESULTS.reduce(function(ok, v) { return ok && v === UNIQUE; }, true)) {
        LOG('Script.include SUCCESS!');
        LOG('RESULTS:', RESULTS);
    } else
        LOG('ERROR: RESULTS did not all match...', RESULTS);
}
