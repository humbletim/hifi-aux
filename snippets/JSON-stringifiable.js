// JSON-stringifiable.js
//
// --humbletim @ 2016.10.18

JSON.stringifiable = stringifiable;
JSON.stringified = JSON.stringified || stringified;

// default maximums
stringifiable.MAX_COMPLEXITY = 1000;
stringifiable.MAX_DEPTH = 2;

// * returns a "clone" of the input value that's definitely JSON.stringify'able
function stringifiable(input, options) {
    options = options || {};
    options.exclude = 'exclude' in options ? (Array.isArray(options.exclude) ? options.exclude : [options.exclude]) : [];
    options.maxComplexity = options.maxComplexity || stringifiable.MAX_COMPLEXITY;
    options.maxDepth = options.maxDepth || stringifiable.MAX_DEPTH;
    options.input = input;
    options.quiet = 'quiet' in options ? options.quiet : false;
    if (isFinite(options.extraDepth))
        options.maxDepth += options.extraDepth;
    return _toPOJO(options);
}

function stringified(input, replacerOrOptions, indent) {
    var options, replacer = replacerOrOptions;
    if (replacer && typeof replacer === 'object') {
        options = replacer;
        replacer = options.replacer;
    }
    return JSON.stringify(JSON.stringifiable(input, options), replacer, indent);
};

var global = (1,eval)('this');
global._toPOJO = _toPOJO;
_toPOJO.earmark = earmark;
_toPOJO.make_replacer = make_replacer;

function _toPOJO(options) {
    var ret = JSON.stringify(options.input, _toPOJO.make_replacer(options));
    if (ret === undefined)
        return ret;
    try { return JSON.parse(ret); }
    catch(e) { typeof log === 'function' && log('_toPOJO Error:', ret, e); throw new Error('topojo error:'+e); }
}

function make_replacer(options) {
    var seen = replacer.seen = Array.isArray(options.seen) ? options.seen : [];
    var hint = replacer.hint = Array.isArray(options.hint) ? options.hint : [];
    replacer.complexity = options.complexity || 0;
    replacer.maxComplexity = options.maxComplexity || stringifiable.MAX_COMPLEXITY;
    replacer.depth = options.depth || 0;
    replacer.maxDepth = options.maxDepth || stringifiable.MAX_DEPTH;
    replacer.localComplexity = replacer.localComplexity || 0;
    replacer.path = Array.isArray(options.path) ? options.path : [''];

    replacer.bail = typeof options.quiet === 'function' ? options.quiet :
        options.quiet === true ? function(k,v,msg) {}
    : options.quiet === false ? function(k,v,msg) { return msg; }
    : function(k,v,msg) { return options.quiet; };

    if (!~seen.indexOf(global)) {
        seen.push(global);
        hint.push('(global)');
    }
    return replacer;
    function replacer(key, value) {
        //print._print && print._print(key,typeof value);
        //if (value && typeof value === 'object' && !value.$constructor) {
        if (replacer.depth > replacer.maxDepth)
            return replacer.bail(key, value, 'too deep to stringify: ' + [replacer.depth, replacer.maxDepth].join('>') + ' '+replacer.path.join('/'));
        if (typeof value !== 'function') {
            if (replacer.complexity++ > replacer.maxComplexity)
                return replacer.bail(key, value, 'too complex to stringify: ' + [replacer.complexity, replacer.maxComplexity].join('>') + ' '+replacer.path.join('/'));
            if (replacer.localComplexity++ > replacer.maxComplexity)
                return replacer.bail(key, value, 'too locally complex to stringify: ' + [replacer.localComplexity, replacer.maxComplexity].join('>') + ' '+replacer.path.join('/'));
        }
        //}
        if (value !== null && typeof value === 'object') {
            try { var valueStr = value+'';} catch(e) { valueStr = e.message; }

            _toPOJO.earmark(value);
            if (~seen.indexOf(value)) {
                var hint = replacer.hint[seen.indexOf(value)];
                return typeof hint === 'string' ? hint : '**cycle**'+hint.join('/')+(
                    value.objectName ? '::'+value.objectName : '');
            }
            if (Array.isArray(value))
                return value.map(function(x,i) {
                    replacer.path.push(i);
                    replacer.depth++;
                    try {
                        return replacer(i, x);
                    } finally {
                        replacer.depth--;
                        replacer.path.pop();
                    }
                });

            if (value instanceof Error) {
                var ob = {};
                'type,message,stack,filename,linenumber,lineno,linenum,linenumber,sourceId'
                    .split(',')
                    .forEach(function(k) { ob[k] = k in value ? value[k] : value[k.replace(/^(.*?)n/, '$1N')] });
                return ob;
                return {
                    type: value.constructor.name,
                    message: value.message,
                    stack: value.stack,
                    fileName: value.fileName,
                    linenumber: value.linenumber,
                    lineno: value.lineno,
                    linenum: value.linenum,
                    lineNumber: value.lineNumber,
                    lineNum: value.lineNum,
                    sourceFile: value.sourceFile,
                    expressionBeginOffset: value.expressionBeginOffset,
                    expressionCaretOffset: value.expressionCaretOffset,
                    expressionEndOffset: value.expressionEndOffset,
                    sourceId: value.sourceId,
                };
            }
            seen.push(value);
            replacer.hint[seen.indexOf(value)] = replacer.path.slice();
            var ret = {};

            var isQML = /Qml|QML/.test(valueStr);
            for(var p in value) {
                var v = value[p];
                if (isQML && /parent/i.test(p))
                    ret[p] = v+''
                else if (/bool|num|str/.test(typeof v))
                    ret[p] = v;
                else {
                    replacer.path.push(p);
                    replacer.depth++;
                    try {
                        if (replacer.path.length < 10)
                            ret[p] = replacer(p, v);
                        else
                            ret[p] = '(no recursing)';
                    } finally {
                        replacer.depth--;
                        replacer.path.pop();
                    }
                }
            }
            return ret;
            if ("length" in value)
                return [].slice.call(value).map(function(x,i) {
                    replacer.depth++;
                    try {
                        return replacer(i, x);
                    } finally {
                        replacer.depth--;
                    }
                });
        }
        if (typeof value === 'function')
            return (value+'').split('{')[0].trim().replace(/[)][(][)]$/,')').replace(/\s/g,'').replace(/^function/,'$& ');
        return value;
    };
}

function earmark(thing) {
    try {
        if (thing && typeof thing === 'object' && !thing.$constructor)
        {
            var $constructor = thing.$constructor || ((thing+'').split('(')[0]).replace(/\[object Object\]|undefined/g,'');
            if($constructor) Object.defineProperty(thing, '$constructor', {
                configurable: true,
                enumerable: true,
                value: $constructor
            });
        }
    } catch(e) { }
    return thing;
};

