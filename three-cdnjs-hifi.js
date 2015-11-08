// dynamically load and patch three.js...
//   -humbletim

// load three.js source code from cdnjs.com
var src = (
   function(xhr){
      xhr.open("GET", 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.js', false);
      xhr.send();
      return xhr.responseText;
   }
)(new XMLHttpRequest);

// monkey-patch it
[
   [ /var THREE =/, "THREE ="], // export a global for Script.include
   [ /[.]delete\b/g, "['delete']"], // delete is a reserved keyword
   [ / boolean /g, ' $$boolean '], // boolean is a reserved keyword
   
   // this changes [sg]et x() {... -> [sg]et$x: function() { ...
   [ /^(\s*[sg]et)\s+(\w+)\s*\(/mg, '$1$$$2: function(' ]
].forEach(
   function(rep) {
      print('monkey-patch:', rep);
      src = src.replace(rep[0],rep[1]);
   });

self=this; // note: THREE references 'self' somewhere

Script.evaluate(src, '#patched-three.js');

THREE.REVISION += ' [monkey-patched]';

// rework P.get$x as function() { ... }
//    into Object.defineProperty(P,'x',{ get: function() {... }})
Object.keys(THREE)
  .forEach(
    function(k) {
  	 var v = THREE[k];
  	 var proto = v&&v.prototype;
  	 if (proto) {
  	   Object.keys(proto)
  	   .filter(function(gs){return /^[sg]et[$]/.test(gs)})
  	   .forEach(
  	     function(gs) {
  	       var tmp = gs.split('$');
  		     //print("patching", k, tmp)
  		     var cfg = { configurable: true };
  		     cfg[tmp[0]] = proto[gs];
  		     Object.defineProperty(proto, tmp[1], cfg);
  		  });
  	 }
    }
  );

print("THREE.REVISION == " + THREE.REVISION);

// sanity check for getters/setters
THREE.$$test = function test() {
   print("new THREE.Quaternion(1,2,3,4).w == ", new THREE.Quaternion(1,2,3,4).w);
   var q = new THREE.Quaternion(1,2,3,4);
   q.w = Math.PI;
   print("new THREE.Quaternion(1,2,3,4).w = PI; toArray == ", q.toArray());
};
//THREE.$$test();
