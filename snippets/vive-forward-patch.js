// vive-forward-patch.js
//
//   Example Vive controller patch script for @XaosPrincess
//
//   Using "Advanced Movement For Hand Controllers,"
//    her left forward touchpad had a mechanical defect that prevented walking.
//
//   This script lets the LeftApplicationMenu button move forward instead.
//   Menus can still be accessed using the right controller's menu button.
//
// --humbletim @ 2016.12.07

var input = {
    "name": "Vive LeftApplicationMenu to Forward",
    "channels": [
        { "from": "Vive.LeftApplicationMenu", "to": "Actions.LONGITUDINAL_FORWARD" },
    ]
};

var mapping = Controller.parseMapping(JSON.stringify(input));
Script.scriptEnding.connect(mapping, 'disable');
mapping.enable();
print(Script.resolvePath(''), 'LOADED');
