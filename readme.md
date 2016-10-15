#### localStorage.js + localStorage.html

These two files work together to provide a subset of the HTML5 `localStorage` API to Client scripts:

* MDN: [localStorage.getItem](https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem)
* MDN: [localStorage.setItem](https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem)
* MDN: [localStorage.removeItem](https://developer.mozilla.org/en-US/docs/Web/API/Storage/removeItem)

Compared to HiFi's built-in [Settings API](https://readme.highfidelity.com/docs/settings-api), Qt's WebEngineView `localStorage` data is saved *separately from `Interface.ini`*, so is generally able to survive a full cache/settings reset.

See also:

* This gist: [localStorage.js](#file-localstorage-js)
* MDN: [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage)

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
