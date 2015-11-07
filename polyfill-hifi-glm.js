Function.prototype.bind=function(){var fn=this,a=[].slice.call(arguments),o=a.shift();return function(){return fn.apply(o,a.concat([].slice.call(arguments)));};};
$GLM_console_log = function() { print(["[glm]"].concat([].slice.call(arguments)).join(" ")); };
Script.include('http://humbletim.github.io/glm-js/code/build/glm-gl-matrix.min.js')
