// override local tutorial URLs to pull from an arbitrary github branch
Resources.overrideUrlPrefix(
    '/~/tutorials/',
    'https://rawgit.com/humbletim/hifi/pull-8973-test/scripts/tutorials/'
);
Script.include('/~/tutorials/createPingPongGun.js');
