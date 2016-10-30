// extracts querystring / hash fragment parameters from URL-like values

function extract_parameters_js_example() {
    var values = extractParameters('something.js?debug=true&a=A%2f&b={"x":5}#b={"y":"asdf"}&xx%3axx=XX%3aXX');

    // extract from own script URL
    // (most reliable right now is getting that URL from a stack trace)
    try { throw new Error('stack'); } catch(e) {
        extractParameters(e.fileName || Script.resolvePath(''), values);
    }

    // extract JSON encode values (which if an object will be depth-one merged into any existing values)
    extractParameters('config=' + encodeURIComponent(JSON.stringify({
        name: 'config test',
        other: { foo: 'bar' },
        size: Vec3.HALF
    })));

    // in general the last-extracted value for a key replaces previous values
    extractParameters('debug=false', values);

    print('extract_parameters_js_example', JSON.stringify(values, 0, 2));
    print('extract_parameters_js_example.$object', JSON.stringify(values.$object, 0, 2));
    print('extract_parameters_js_example.$array', JSON.stringify(values.$array, 0, 2));
    print('extract_parameters_js_example.$url', JSON.stringify(values.$url, 0, 2));
    return values;
}

// eg: something.js?a=A%2f&b={"x":5}#b={"y":"asdf"}
//  ==>
//  {
//      "0": "something.js",
//      "a": "A/",
//      "b": "{\"y\":\"asdf\"}",
//      "something.js": "",
//      "$object": { "b": { "x": 5, "y": "asdf" } },
//      "$array": { "0": [ "something.js" ], /*...*/, "a": [ "A/" ], "b": [ "{\"x\":5}", "{\"y\":\"asdf\"}" ] },
//      "$url": { ...}
//  }
function extractParameters(url, mergeInto) {
    mergeInto = mergeInto || {};
    if (!mergeInto.$object)
        Object.defineProperty(mergeInto, '$object', { value: {} });
    if (!mergeInto.$array)
        Object.defineProperty(mergeInto, '$array', { value: {} });

    function _mergeArray(k,v) {
        mergeInto.$array[k] = mergeInto.$array[k] || [];
        mergeInto.$array[k].push(v);
    }

    function _merge(k,v) {
        mergeInto[k] = v;
        _mergeArray(k,v);
        try {
            var parsed = JSON.parse(v);
            if (parsed !== undefined) {
                if (parsed && typeof parsed === 'object') {
                    mergeInto.$object[k] = mergeInto.$object[k] || (Array.isArray(parsed) ? [] : {});
                    for(var p in parsed)
                        mergeInto.$object[k][p] = parsed[p];
                } else
                    mergeInto.$object[k] = parsed;
            }
        } catch(e) {}
    }

    var length = url
        .split(/[&#?]/)
        .map(function(kvp, i) {
            if (!kvp.length)
                return _mergeArray(i, kvp);
            var arr = kvp.split('='),
                k = unescape(arr.shift()).replace('[]', ''),
                v = unescape(arr.join('='));
            _merge(k,v);

            if (!~kvp.indexOf('='))
                _merge(kvp, undefined);
            _mergeArray(i, kvp);
        }).length;

    if (!('length' in mergeInto.$array))
        Object.defineProperty(mergeInto.$array, 'length', { value: length })

    if (!mergeInto.$url) {
        var parts = url.match(/^((\w+:)[\/][\/]([^\/#?]+))(.*)$/)||['','','','',''],
            protocol = parts[2] || url.split(':',1)[0]+':',
            hostname = parts[3].split(':')[0],
            port = parts[3].split(':')[1] || '',
            host = parts[3],
            origin = parts[1] || null,
            pathname = parts[4].split(/[#?]/)[0] || url.replace(/^\w+:(?:\/\/)?/,'').split(/[?#]/)[0],
            search = (url.match(/[?].*$/)||[''])[0].split('#')[0],
            hash = (url.match(/#.*$/)||[])[0] || '';

        Object.defineProperty(mergeInto, '$url', { value: {
            hash: hash,
            search: search,
            pathname: pathname,
            port: port,
            hostname: hostname,
            host: host,
            protocol: protocol,
            origin: origin,
            href: url,
            dirname: pathname.replace(/[\/][^\/]+$/,''),
            basename: pathname.replace(/^.*[\/]/,''),
            extname: pathname.split('.').pop()
        } });
    }
    return mergeInto;
}

// exports
try { var global = module.exports = extractParameters;  } catch(e) { global = (1,eval)('this'); }
global.extractParameters = extractParameters;
global.extract_parameters_js_example = extract_parameters_js_example;


// support for debug=selftest
try { throw new Error('stack'); } catch(e) {
    var filename = e.fileName || '';
    if (!filename && typeof Script === 'object')
        filename = Script.resolvePath('');
    if ('selftest' === extractParameters(filename).debug)
        print(
            filename.split(/[?#]/)[0].split('/').pop(), '| selftest |',
            JSON.stringify(extractParameters(filename),0,2)
        );
}

