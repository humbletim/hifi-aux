// highlightjs-window.js
//
//   a quick hack that displays a popup web window with syntax-highlighted code
//
//   example:
//      Script.include('highlightjs-window.js');
//      var webWindow = new HighlightJSWindow({
//        filename: 'logical-filename.json',
//        code: jsonString
//      });
//
//   see also: https://highlightjs.org/
//
//    --humbletim @ 2016.11.01
//

HighlightJSWindow.theme = 'ir-black';
HighlightJSWindow.js    = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/highlight.min.js';
HighlightJSWindow.css   = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/styles/THEME.min.css';

function HighlightJSWindow(options) {
    options.title = options.title || options.filename || 'HighlightJSWindow';
    options.language = 'language' in options ? options.language : (options.filename+'').split('.');
    options.visible = 'visible' in options ? options.visible : true;
    options.width = options.width || Math.min(Overlays.width()*.8, 800);
    options.height = options.height || Math.min(Overlays.height()*.8, 600);
    options.code = options.code || 'no options.code specified to constructor...';
    options.zoom = options.zoom || .9;
    options.theme = options.theme || HighlightJSWindow.theme;
    options.header = options.header || '';
    var css = HighlightJSWindow.css.replace('THEME', options.theme);
    var win = { __proto__: new OverlayWebWindow(options) };
    win.setURL(
        'data:text/html;html,<!--?--><html><body>'+[
            options.header,
            '<style>body { background-color: black; margin: 0; zoom: '+options.zoom+'; }</style>',
            '<pre><code class='+JSON.stringify(options.language)+'>'+options.code+'</code></pre>',
            '<link rel="stylesheet" href="'+css+'">',
            '<script src="'+HighlightJSWindow.js+'"></script>',
            '<script>hljs.initHighlightingOnLoad();</script>'
        ].join('')+'</body></html><!---->');
    win.closed.connect(win, function onClosed() {
        print('HighlightJSWindow.deletedLater', options.title);
        win.__proto__.deleteLater && win.__proto__.deleteLater();
        win.__proto__ = { visible: false, close: function() {}, deleteLater: function() {} };
    });
    return win;
}

(1,eval)('this').HighlightJSWindow = HighlightJSWindow;
try { module.exports = HighlightJSWindow; } catch(e) {}

if (0) {
try { throw new Error('stack'); } catch(e) {
    var filename = e.fileName;
    Script.include('extract-parameters.js#hjs');
    Script.include('http://cdn.xoigo.com/hifi/analytics.min.js');
    try { ua.used(extractParameters(e.fileName)); } catch(e) { }
}
}
/* known hljs themes to try out (not all might be available via CDN though)

default, agate, androidstudio, arduino-light, arta, ascetic,
atelier-cave-dark, atelier-cave-light, atelier-dune-dark, atelier-dune-light,
atelier-estuary-dark, atelier-estuary-light, atelier-forest-dark,
atelier-forest-light, atelier-heath-dark, atelier-heath-light,
atelier-lakeside-dark, atelier-lakeside-light, atelier-plateau-dark,
atelier-plateau-light, atelier-savanna-dark, atelier-savanna-light,
atelier-seaside-dark, atelier-seaside-light, atelier-sulphurpool-dark,
atelier-sulphurpool-light, atom-one-dark, atom-one-light, brown-paper,
codepen-embed, color-brewer, darcula, dark, darkula, docco, dracula, far,
foundation, github-gist, github, googlecode, grayscale, gruvbox-dark,
gruvbox-light, hopscotch, hybrid, idea, ir-black, kimbie.dark, kimbie.light,
magula, mono-blue, monokai-sublime, monokai, obsidian, ocean, paraiso-dark,
paraiso-light, pojoaque, purebasic, qtcreator_dark, qtcreator_light,
railscasts, rainbow, school-book, solarized-dark, solarized-light, sunburst,
tomorrow-night-blue, tomorrow-night-bright, tomorrow-night-eighties,
tomorrow-night, tomorrow, vs, xcode, xt256, zenburn
*/
