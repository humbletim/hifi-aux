#### localStorage.js + localStorage.html

These two files work together to provide a `localStorage` API for Client scripts.

Unlike HiFi's built-in [Settings API](https://readme.highfidelity.com/docs/settings-api), Qt's WebEngineView `localStorage` is saved separately so is currently able to survive a full reset of `Interface.ini`.

See [localStorage.js](#file-localstorage-js) for more info.

```javascript
Script.include('localStorage.js');

var SCRIPT_KEY = 'my-script-key';
var config;

// most reliable way to access is with .$ready(callback)
localStorage.$ready(function() {
  config = JSON.parse(localStorage.getItem() || '{}');
  
  // ... do stuff with config...
  
  // could save config back at script exit
  Script.scriptEnding.connect(function() {
    localStorage.setItem(SCRIPT_KEY, JSON.stringify(config));
  });
});

// in some designs it might be cleaner to assume initialization will have completed
// (which can be verified by calling $ready() without any arguments)
function saveClicked() {
    if (!localStorage.$ready())
        throw new Error('save called before localStorage was ready!');
    localStorage.setItem(SCRIPT_KEY, JSON.stringify(config));
}
```
