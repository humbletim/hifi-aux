// this intermediary file just applies the global=exportName parameter and otherwise loads popup-console-window.js
Script.include(Script.resolvePath('').replace('popup-remote.js','popup-console-window.js')+'?global=console');
