// ... script to help test AC ATP upload / permissions
//
// gist of the testing strategy:
//
//   1) Use `Assets.uploadData` to define a new .js "blob"
//      * containing a baked-in uniq timestamp along with JavaScript that emits it when executed
//      ==> if successful this step yields a new ATP hash
//
//   2) Use `Assets.setMapping` to map that ATP hash to "atp:/test/ac-upload.js"
//      ==> if successful well... callback(err, path) args aren't currently returned by the API, so...
//
//   3) Use `Script.include` as a different way to prove the mapping actually worked
//      ==> if successful the included scripts emits its timestamp both to the log and global Array variable
//
//   4) Compare emitted timestamp with expected value (which changes each test run)
//      ==> if matching then in theory there's no way everything didn't work?
//

var version = '0.0.1';

var ATP_PATH = '/test/atp-upload.js',
    RESULTS  = [],
    UNIQUE   = new Date().getTime().toString(36),
    LOG      = function() { print('---- test-ac-atp |', [].join.call(arguments, ' ')); },
    JS       = '('+testfunc.toString()+')('+JSON.stringify(UNIQUE)+')';

LOG(version);

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
