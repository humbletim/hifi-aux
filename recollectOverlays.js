// ** WORK IN PROGRESS PROTOTYPE **
// Client Script for recollecting Overlays back into the visible viewport area
// 2016.08.27 humbletim

// NOTE: recollection could also be triggered from another script via message; eg:
//   Messages.sendMessage('recollectOverlays', 8, true /*localOnly*/)

// QML has better access to the "desktop" so all the heavy lifting is currently done on that side
var window = new OverlayWindow({
    title: '   ( ͡° ͜ʖ ͡°)',
    source: Script.resolvePath('recollectOverlays.qml'),
    //source: Script.resolvePath('recollectOverlays.qml#' + new Date().getTime().toString(36)),
    visible: true,
    width: 320,
    height: 240
});
window.fromQml.connect(function(evt) { evt.type === 'stop' && Script.stop(); });

// experimental Messages triggering
Messages.subscribe('recollectOverlays');
Messages.messageReceived.connect(receiver);
Script.scriptEnding.connect(function() {
    Messages.unsubscribe('recollectOverlays');
    Messages.messageReceived.disconnect(receiver);
});
function receiver(channel, message, sender, local) {
    if (!local || channel !== 'recollectOverlays') return;
    var evt = { type: 'recollect' };
    try { evt.margin = !isNaN(message) ? message*1 : 1*JSON.parse(message).margin; } catch(e) { print('recollectOverlays.js receiver error:', e); }
    window.sendToQml(evt);
}
