// JSON-stringifiable.js
//
// --humbletim @ 2016.10.18

JSON.stringifiable = stringifiable;
JSON.stringified = JSON.stringified || stringified;

// * limits scanning of nested objects to maxRecursions
// * disregards values identical to members of excludeThese[] (default: [])
// * returns a "clone" of the input value that's definitely JSON.stringify'able
function stringifiable(input, maxRecursions, excludeThese) {
    excludeThese = excludeThese || [];
    maxRecursions = maxRecursions || 2048;
    excludeThese.maxComplexity = maxRecursions;
    return _toPOJO(input, excludeThese);
}

function stringified(input, replacer, indent) {
    return JSON.stringify(JSON.stringifiable(input), replacer, indent);
};

(1,eval)('this')._toPOJO = _toPOJO;
function _toPOJO(thing, seen) {
    seen = seen || [ global ];
    seen.hint = seen.hint || [ '[(global)]' ];
    seen.complexity = seen.complexity || 0;
    seen.maxComplexity = seen.maxComplexity || 100;
    seen.depth = seen.depth || 0;
    seen.maxDepth = seen.maxDepth || 3;
    seen.localComplexity = seen.localComplexity || 0;
    seen.path = seen.path || ['/'];
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
    }
    
    var ret = JSON.stringify(
        thing, function replacer(key,value) {
            //print._print && print._print(key,typeof value);
            //if (value && typeof value === 'object' && !value.$constructor) {
            if (seen.depth > seen.maxDepth)
                return 'too deep to stringify: ' + [seen.depth, seen.maxDepth].join('>') + ' '+seen.path.join('/');
            if (typeof value !== 'function') {
                if (seen.complexity++ > seen.maxComplexity)
                    return 'too complex to stringify: ' + [seen.complexity, seen.maxComplexity].join('>') + ' '+seen.path.join('/');
                if (seen.localComplexity++ > seen.maxComplexity)
                    return 'too locally complex to stringify: ' + [seen.localComplexity, seen.maxComplexity].join('>') + ' '+seen.path.join('/');
            }
            //}
            if (value !== null && typeof value === 'object') {
                try { var valueStr = value+'';} catch(e) { valueStr = e.message; }
                
                earmark(value);
                if (~seen.indexOf(value)) {
                    var hint = seen.hint[seen.indexOf(value)];
                    return typeof hint === 'string' ? hint : '**cycle**'+hint.join('/')+(
                        value.objectName ? '::'+value.objectName : '');
                }
                if (Array.isArray(value))
                    return value.map(function(x,i) {
                        seen.path.push(i);
                        seen.depth++;
                        try {
                            return replacer(i, x);
                        } finally {
                            seen.depth--;
                            seen.path.pop();
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
                seen.hint[seen.indexOf(value)] = seen.path.slice();
                var ret = {};

                var isQML = /Qml|QML/.test(valueStr);
                for(var p in value) {
                    var v = value[p];
                    if (isQML && /parent/i.test(p))
                        ret[p] = v+''
                    else if (/bool|num|str/.test(typeof v))
                        ret[p] = v;
                    else {
                        seen.path.push(p);
                        seen.depth++;
                        try {
                            if (seen.path.length < 10)
                                ret[p] = replacer(p, v);
                            else
                                ret[p] = '(no recursing)';
                        } finally {
                            seen.depth--;
                            seen.path.pop();
                        }
                    }
                }
                return ret;
                if ("length" in value)
                    return [].slice.call(value).map(function(x,i) {
                        seen.depth++;
                        try {
                            return replacer(i, x);
                        } finally {
                            seen.depth--;
                        }
                    });
            }
            if (typeof value === 'function')
                return (value+'').split('{')[0].trim().replace(/[)][(][)]$/,')').replace(/\s/g,'').replace(/^function/,'$& ');
            return value;
        }
    );
    if (ret === undefined)
        return ret;
    try { return JSON.parse(ret); }
    catch(e) { typeof log === 'function' && log('_toPOJO Error:', ret, e); throw new Error('topojo error:'+e); }
}
