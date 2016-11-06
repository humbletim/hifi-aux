// override local tutorial URLs to pull from a different branch
Resources.overrideUrlPrefix(
    '/~/tutorials/',
    'https://rawgit.com/humbletim/hifi/pull-8973-test/scripts/tutorials/'
    //'https://raw.githubusercontent.com/highfidelity/hifi/master/scripts/tutorials/'
);
Script.include('/~/tutorials/createPingPongGun.js');
