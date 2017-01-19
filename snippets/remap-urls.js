// remap-urls.js
//
//   Helper functions for managing resource URL overrides.
//
//   Can be used for example to more easily manage replacement parts for defaultScripts.js.
//
//    -- humbletim @ 2017.01.17

// Sample "myDefaultScripts.js"
function myDefaultScripts_js_example() {
    Script.include('remap-urls.js');

    var MAPPINGS = {
        // EXAMPLE: use a custom version of "away.js"
        'system/away.js': 'file:///C:/Users/you/Desktop/myaway.js',
        
        // EXAMPLE: effectively disable handControllerPointer.js:
        'system/controllers/handControllerPointer.js': 'file:///dev/null # handControllerPointer',
        
        // EXAMPLE: test drive dev version of handControllerGrab.js (ie: in master branch on github)
        'system/controllers/handControllerGrab.js':
        'https://raw.githubusercontent.com/highfidelity/hifi/master/scripts/system/controllers/handControllerGrab.js',
    };
    remapURL(MAPPINGS);


    // EXAMPLE: use the Simple Robot as a default avatar for self and others
    //   (ie: when avatar is not specified this will be used as a default instead of being_of_light)
    remapURL(
        PathUtils.resourcesPath() + 'meshes/defaultAvatar_full.fst',
        'http://mpassets.highfidelity.com/1b7e1e7c-6c0b-4f20-9cd0-1d5ccedae620-v1/bb64e937acf86447f6829767e958073c.fst'
    );

    // With remappings in place you can now just include the standard defaultScripts.js:
    Script.include('/~/defaultScripts.js');
}

// exported globals
var global = (1,eval)('this');
global.remapURL = remapURL;

// remapURL(String fromURL, String toURL) -- map one input URL to a replacement
// remapURL(Object fromToMapping) -- map all keys to their values
function remapURL(overrides) {
    if (typeof overrides === 'object') {
        for(var p in overrides) {
            var from = p + '', to = overrides[p];
            var basename = from.split(/[?#]/)[0].split('/').pop();
            debugPrint('remapURL', basename);
            _remapURL(from, to);
        }
    } else {
        _remapURL.apply(this, arguments);
    }
}

// Override a URL prefix -- with automatic restore if script is unloaded.
function _remapURL(from, to) {
    Script.scriptEnding.connect(function() {
        debugPrint('--- remapURL restoring ', from);
        Resources.restoreUrlPrefix(from);
    });
    debugPrint('+++ remapURL', from, '->', to);
    return Resources.overrideUrlPrefix(from, to);
}

function debugPrint() {
    print('remap-urls | ' + [].slice.call(arguments).join(' '));
}
