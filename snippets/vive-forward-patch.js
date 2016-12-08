// vive-forward-patch.js
//
//   Example Vive controller patch script for @XaosPrincess
//   With "Advanced Movement For Hand Controllers" enabled,
//    her left forward touchpad had a mechanical defect.
//
//   This script lets the LeftApplicationMenu button move forward instead.
//   (Right controller menu button unaffected)
//
// --humbletim @ 2016.12.07

var input = {
    "name": "Vive to Standard",
    "channels": [
        { "from": "Vive.LeftApplicationMenu", "to": "Actions.LONGITUDINAL_FORWARD" },
    ]
};

var mapping = Controller.parseMapping(JSON.stringify(input));
Script.scriptEnding.connect(mapping, 'disable');
mapping.enable();
print(Script.resolvePath(''), 'LOADED');
