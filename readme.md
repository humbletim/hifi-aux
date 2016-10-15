#### localStorage.js + localStorage.html

Together these two files operate a hidden OverlayWebWindow to enable `localStorage` access from Client scripts.

Unlike HiFi's built-in [Settings API](https://readme.highfidelity.com/docs/settings-api), Qt's WebEngineView `localStorage` is saved separately
and is generally able to survive `Interface.ini` resets.

See [localStorage.js](#file-localStorage.js) for more info.

```javascript
Script.include('localStorage.js');

var config;

localStorage.$ready(function() {
  config = JSON.parse(localStorage.get('my-script-key') || '{}');
  
  // ... do stuff with config...
  
  // save config back to localStorage at script exit
  Script.scriptEnding.connect(function() {
    localStorage.setItem('my-script-key', JSON.stringify(config));
  });
});
```