// example of using WebWindowEx as a drop-in replacement for WebWindow
// -- humbletim 2016.10.01

Script.include(Script.resolvePath('WebWindowEx.js'));
WebWindow = WebWindowEx;

// then it's back to business as usual
var win = new WebWindow('latest forum posts', 'https://forums.highfidelity.com/latest', 800, 600);
win.setVisible(true);
