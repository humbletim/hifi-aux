// override local tutorial URLs to pull from github master
Resources.overrideUrlPrefix(
    '/~/tutorials/',
    'https://raw.githubusercontent.com/highfidelity/hifi/master/scripts/tutorials/'
);
Script.include('/~/tutorials/createPingPongGun.js');
