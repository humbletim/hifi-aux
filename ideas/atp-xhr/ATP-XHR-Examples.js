// asynchronous examples
function upload(data, callback) {
  var atp = new XMLHttpRequest();
  atp.open("POST", "atp:", true);
  atp.onload = function() {
    callback( atp.status === 201 && atp.getResponseHeader('Location') );
  };
  atp.send(JSON.stringify({ data: "stuff" })));
}

function download(url, errback, callback) {
  var atp = new XMLHttpRequest();
  atp.open("GET", url, true);
  atp.onprogress = function(e) { // Phase II
    print(Math.round((e.loaded/e.total)*100 + '% downloaded');
  };
  atp.onerror = function(err) { errback(err); };
  atp.onload = function() { callback(atp.responseText); };
  atp.send();  
}

// synchronous examples
function uploadMappedFile(data, mapping) {
  var atp = new XMLHttpRequest();
  atp.open("PUT", mapping, false); // Phase II
  atp.send(JSON.stringify({ data: "stuff" })));
  return atp.status === 201;
}

function remove(url) {
  var atp = new XMLHttpRequest();
  atp.open("DELETE", url, false);
  apt.send();
  return apt.status === 200 || apt.status === 204;
}