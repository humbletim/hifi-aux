// ProtocolVersions.js
//
//   correlates RELEASE-NNNN, human release names and protocol versions
//
//   -- humbletim @ 2016.11.03
//
//
//  EXAMPLE: var named = ProtocolVersions.getRelease(location.protocolVersion(), 'unknown release');

// export
(1,eval)('this').ProtocolVersions = ProtocolVersions;
function ProtocolVersions() { }
ProtocolVersions.getRelease = function(protocolVersion, def) {
    return (this.get(protocolVersion)||{release:def}).release;
};
ProtocolVersions.getTag = function(protocolVersion, def) {
    return (this.get(protocolVersion)||{tag:def}).tag;
};
ProtocolVersions.get = function(protocolVersion) {
    return this.fromProtocolVersion(protocolVersion || location.protocolVersion());
};
ProtocolVersions.fromTag = function(tag) { return VERSIONS.byTag[tag]; }
ProtocolVersions.fromRelease = function(rel) { return VERSIONS.byRelease[tag]; }
ProtocolVersions.fromProtocolVersion = function(proto) { return VERSIONS.byProtocol[proto]; }

// ### SNIP ###
// machine generated mapping as of 2017.05.08
var VERSIONS = {
  "byRelease": {
    "Beta Release 10": {
      "release": "Beta Release 10",
      "tag": "RELEASE-4855",
      "protocolVersion": "QVFrMrFzhBZSgrilnoTL6w==",
      "date": "2016-05-06T22:49:51.000Z"
    },
    "Beta Release 11": {
      "release": "Beta Release 11",
      "tag": "RELEASE-4901",
      "protocolVersion": "QVFrMrFzhBZSgrilnoTL6w==",
      "date": "2016-05-17T01:18:15.000Z"
    },
    "Beta Release 12": {
      "release": "Beta Release 12",
      "tag": "RELEASE-4968",
      "protocolVersion": "D5OuKoIxUmX5GMhigz/pFg==",
      "date": "2016-05-28T01:12:15.000Z"
    },
    "Beta Release 13": {
      "release": "Beta Release 13",
      "tag": "RELEASE-5027",
      "protocolVersion": "3TZlZ0Gi+TihPtluPzNbOg==",
      "date": "2016-06-15T17:41:38.000Z"
    },
    "Beta Release 14": {
      "release": "Beta Release 14",
      "tag": "RELEASE-5068",
      "protocolVersion": "TILhcecnBpWwX0pxOGuN7w==",
      "date": "2016-06-25T01:54:50.000Z"
    },
    "Beta Release 15": {
      "release": "Beta Release 15",
      "tag": "RELEASE-5103",
      "protocolVersion": "TILhcecnBpWwX0pxOGuN7w==",
      "date": "2016-07-02T00:03:58.000Z"
    },
    "Beta Release 16": {
      "release": "Beta Release 16",
      "tag": "RELEASE-5179",
      "protocolVersion": "c5ggHVakCjpB1pypIDjJjw==",
      "date": "2016-07-20T21:59:11.000Z"
    },
    "Beta Release 17": {
      "release": "Beta Release 17",
      "tag": "RELEASE-5206",
      "protocolVersion": "c5ggHVakCjpB1pypIDjJjw==",
      "date": "2016-07-26T00:16:24.000Z"
    },
    "Beta Release 18": {
      "release": "Beta Release 18",
      "tag": "RELEASE-5240",
      "protocolVersion": "glPTM03xmviVGxSFw9NT9g==",
      "date": "2016-08-06T15:21:38.000Z"
    },
    "Beta Release 19": {
      "release": "Beta Release 19",
      "tag": "RELEASE-5298",
      "protocolVersion": "glPTM03xmviVGxSFw9NT9g==",
      "date": "2016-08-23T02:06:04.000Z"
    },
    "Beta Release 20": {
      "release": "Beta Release 20",
      "tag": "RELEASE-5335",
      "protocolVersion": "dn7MHlVJtcVGrL66DSrg3A==",
      "date": "2016-08-31T23:17:44.000Z"
    },
    "Beta Release 21": {
      "release": "Beta Release 21",
      "tag": "RELEASE-5396",
      "protocolVersion": "WYNuoFQq0ssJ0oYf+4Cnuw==",
      "date": "2016-09-23T23:43:43.000Z"
    },
    "Beta Release 22": {
      "release": "Beta Release 22",
      "tag": "RELEASE-5424",
      "protocolVersion": "WYNuoFQq0ssJ0oYf+4Cnuw==",
      "date": "2016-10-04T00:10:22.000Z"
    },
    "Beta Release 24": {
      "release": "Beta Release 24",
      "tag": "RELEASE-5572",
      "protocolVersion": "rv2J9jEsL4Y5Ja305uGQUQ==",
      "date": "2016-10-25T13:52:33.000Z"
    },
    "Beta Release 25": {
      "release": "Beta Release 25",
      "tag": "RELEASE-5622",
      "protocolVersion": "rv2J9jEsL4Y5Ja305uGQUQ==",
      "date": "2016-10-28T23:52:15.000Z"
    },
    "Beta Release 26": {
      "release": "Beta Release 26",
      "tag": "RELEASE-5667",
      "protocolVersion": "rv2J9jEsL4Y5Ja305uGQUQ==",
      "date": "2016-11-08T01:34:40.000Z"
    },
    "Beta Release 27": {
      "release": "Beta Release 27",
      "tag": "RELEASE-5693",
      "protocolVersion": "Bi6uXx49SajPhG6yxsmjRQ==",
      "date": "2016-11-12T00:26:34.000Z"
    },
    "Beta Release 28": {
      "release": "Beta Release 28",
      "tag": "RELEASE-5723",
      "protocolVersion": "cje11WLQUk/12oReimhsKg==",
      "date": "2016-11-19T02:20:11.000Z"
    },
    "Beta Release 29": {
      "release": "Beta Release 29",
      "tag": "RELEASE-5782",
      "protocolVersion": "j87v1Bkdmhn4Chza0gPrOw==",
      "date": "2016-12-09T20:20:47.000Z"
    },
    "Beta Release 30": {
      "release": "Beta Release 30",
      "tag": "RELEASE-5822",
      "protocolVersion": "Qql3Ea+ydE5Y2mNEmu1QGQ==",
      "date": "2016-12-20T15:38:53.000Z"
    },
    "Beta Release 31": {
      "release": "Beta Release 31",
      "tag": "RELEASE-5885",
      "protocolVersion": "cJNrQZ4urWA2426aytay+A==",
      "date": "2017-01-11T19:28:49.000Z"
    },
    "Beta Release 32": {
      "release": "Beta Release 32",
      "tag": "RELEASE-5909",
      "protocolVersion": "cJNrQZ4urWA2426aytay+A==",
      "date": "2017-01-17T22:17:26.000Z"
    },
    "Beta Release 33": {
      "release": "Beta Release 33",
      "tag": "RELEASE-6008",
      "protocolVersion": "LS1a0CfdOyh81Cu2uSgclA==",
      "date": "2017-02-07T19:20:47.000Z"
    },
    "Beta Release 34": {
      "release": "Beta Release 34",
      "tag": "RELEASE-6095",
      "protocolVersion": "+27JgWUe9kM5HRFOsuBcWg==",
      "date": "2017-02-28T17:33:47.000Z"
    },
    "Beta Release 35": {
      "release": "Beta Release 35",
      "tag": "RELEASE-6128",
      "protocolVersion": "+27JgWUe9kM5HRFOsuBcWg==",
      "date": "2017-03-07T19:32:38.000Z"
    },
    "Beta Release 36": {
      "release": "Beta Release 36",
      "tag": "RELEASE-6227",
      "protocolVersion": "+27JgWUe9kM5HRFOsuBcWg==",
      "date": "2017-03-29T23:08:01.000Z"
    },
    "Beta Release 37": {
      "release": "Beta Release 37",
      "tag": "RELEASE-6336",
      "protocolVersion": "s9OslX3yNC/rURfZkks20A==",
      "date": "2017-04-18T15:43:22.000Z"
    },
    "Beta Release 38": {
      "release": "Beta Release 38",
      "tag": "RELEASE-6428",
      "protocolVersion": "ztIzQxVFfiVYM+VEsFD3FQ==",
      "date": "2017-05-03T22:21:03.000Z"
    }
  },
  "byProtocol": {
    "QVFrMrFzhBZSgrilnoTL6w==": {
      "release": "Beta Release 11",
      "releases": [
        "Beta Release 10",
        "Beta Release 11"
      ],
      "tag": "RELEASE-4901",
      "tags": [
        "RELEASE-4855",
        "RELEASE-4901"
      ],
      "protocolVersion": "QVFrMrFzhBZSgrilnoTL6w==",
      "date": "2016-05-17T01:18:15.000Z"
    },
    "D5OuKoIxUmX5GMhigz/pFg==": {
      "release": "Beta Release 12",
      "releases": [
        "Beta Release 12"
      ],
      "tag": "RELEASE-4968",
      "tags": [
        "RELEASE-4968"
      ],
      "protocolVersion": "D5OuKoIxUmX5GMhigz/pFg==",
      "date": "2016-05-28T01:12:15.000Z"
    },
    "3TZlZ0Gi+TihPtluPzNbOg==": {
      "release": "Beta Release 13",
      "releases": [
        "Beta Release 13"
      ],
      "tag": "RELEASE-5027",
      "tags": [
        "RELEASE-5027"
      ],
      "protocolVersion": "3TZlZ0Gi+TihPtluPzNbOg==",
      "date": "2016-06-15T17:41:38.000Z"
    },
    "TILhcecnBpWwX0pxOGuN7w==": {
      "release": "Beta Release 15",
      "releases": [
        "Beta Release 14",
        "Beta Release 15"
      ],
      "tag": "RELEASE-5103",
      "tags": [
        "RELEASE-5068",
        "RELEASE-5103"
      ],
      "protocolVersion": "TILhcecnBpWwX0pxOGuN7w==",
      "date": "2016-07-02T00:03:58.000Z"
    },
    "c5ggHVakCjpB1pypIDjJjw==": {
      "release": "Beta Release 17",
      "releases": [
        "Beta Release 16",
        "Beta Release 17"
      ],
      "tag": "RELEASE-5206",
      "tags": [
        "RELEASE-5179",
        "RELEASE-5206"
      ],
      "protocolVersion": "c5ggHVakCjpB1pypIDjJjw==",
      "date": "2016-07-26T00:16:24.000Z"
    },
    "glPTM03xmviVGxSFw9NT9g==": {
      "release": "Beta Release 19",
      "releases": [
        "Beta Release 18",
        "Beta Release 19"
      ],
      "tag": "RELEASE-5298",
      "tags": [
        "RELEASE-5240",
        "RELEASE-5298"
      ],
      "protocolVersion": "glPTM03xmviVGxSFw9NT9g==",
      "date": "2016-08-23T02:06:04.000Z"
    },
    "dn7MHlVJtcVGrL66DSrg3A==": {
      "release": "Beta Release 20",
      "releases": [
        "Beta Release 20"
      ],
      "tag": "RELEASE-5335",
      "tags": [
        "RELEASE-5335"
      ],
      "protocolVersion": "dn7MHlVJtcVGrL66DSrg3A==",
      "date": "2016-08-31T23:17:44.000Z"
    },
    "WYNuoFQq0ssJ0oYf+4Cnuw==": {
      "release": "Beta Release 22",
      "releases": [
        "Beta Release 21",
        "Beta Release 22"
      ],
      "tag": "RELEASE-5424",
      "tags": [
        "RELEASE-5396",
        "RELEASE-5424"
      ],
      "protocolVersion": "WYNuoFQq0ssJ0oYf+4Cnuw==",
      "date": "2016-10-04T00:10:22.000Z"
    },
    "rv2J9jEsL4Y5Ja305uGQUQ==": {
      "release": "Beta Release 26",
      "releases": [
        "Beta Release 24",
        "Beta Release 25",
        "Beta Release 26"
      ],
      "tag": "RELEASE-5667",
      "tags": [
        "RELEASE-5572",
        "RELEASE-5622",
        "RELEASE-5667"
      ],
      "protocolVersion": "rv2J9jEsL4Y5Ja305uGQUQ==",
      "date": "2016-11-08T01:34:40.000Z"
    },
    "Bi6uXx49SajPhG6yxsmjRQ==": {
      "release": "Beta Release 27",
      "releases": [
        "Beta Release 27"
      ],
      "tag": "RELEASE-5693",
      "tags": [
        "RELEASE-5693"
      ],
      "protocolVersion": "Bi6uXx49SajPhG6yxsmjRQ==",
      "date": "2016-11-12T00:26:34.000Z"
    },
    "cje11WLQUk/12oReimhsKg==": {
      "release": "Beta Release 28",
      "releases": [
        "Beta Release 28"
      ],
      "tag": "RELEASE-5723",
      "tags": [
        "RELEASE-5723"
      ],
      "protocolVersion": "cje11WLQUk/12oReimhsKg==",
      "date": "2016-11-19T02:20:11.000Z"
    },
    "j87v1Bkdmhn4Chza0gPrOw==": {
      "release": "Beta Release 29",
      "releases": [
        "Beta Release 29"
      ],
      "tag": "RELEASE-5782",
      "tags": [
        "RELEASE-5782"
      ],
      "protocolVersion": "j87v1Bkdmhn4Chza0gPrOw==",
      "date": "2016-12-09T20:20:47.000Z"
    },
    "Qql3Ea+ydE5Y2mNEmu1QGQ==": {
      "release": "Beta Release 30",
      "releases": [
        "Beta Release 30"
      ],
      "tag": "RELEASE-5822",
      "tags": [
        "RELEASE-5822"
      ],
      "protocolVersion": "Qql3Ea+ydE5Y2mNEmu1QGQ==",
      "date": "2016-12-20T15:38:53.000Z"
    },
    "cJNrQZ4urWA2426aytay+A==": {
      "release": "Beta Release 32",
      "releases": [
        "Beta Release 31",
        "Beta Release 32"
      ],
      "tag": "RELEASE-5909",
      "tags": [
        "RELEASE-5885",
        "RELEASE-5909"
      ],
      "protocolVersion": "cJNrQZ4urWA2426aytay+A==",
      "date": "2017-01-17T22:17:26.000Z"
    },
    "LS1a0CfdOyh81Cu2uSgclA==": {
      "release": "Beta Release 33",
      "releases": [
        "Beta Release 33"
      ],
      "tag": "RELEASE-6008",
      "tags": [
        "RELEASE-6008"
      ],
      "protocolVersion": "LS1a0CfdOyh81Cu2uSgclA==",
      "date": "2017-02-07T19:20:47.000Z"
    },
    "+27JgWUe9kM5HRFOsuBcWg==": {
      "release": "Beta Release 36",
      "releases": [
        "Beta Release 34",
        "Beta Release 35",
        "Beta Release 36"
      ],
      "tag": "RELEASE-6227",
      "tags": [
        "RELEASE-6095",
        "RELEASE-6128",
        "RELEASE-6227"
      ],
      "protocolVersion": "+27JgWUe9kM5HRFOsuBcWg==",
      "date": "2017-03-29T23:08:01.000Z"
    },
    "s9OslX3yNC/rURfZkks20A==": {
      "release": "Beta Release 37",
      "releases": [
        "Beta Release 37"
      ],
      "tag": "RELEASE-6336",
      "tags": [
        "RELEASE-6336"
      ],
      "protocolVersion": "s9OslX3yNC/rURfZkks20A==",
      "date": "2017-04-18T15:43:22.000Z"
    },
    "ztIzQxVFfiVYM+VEsFD3FQ==": {
      "release": "Beta Release 38",
      "releases": [
        "Beta Release 38"
      ],
      "tag": "RELEASE-6428",
      "tags": [
        "RELEASE-6428"
      ],
      "protocolVersion": "ztIzQxVFfiVYM+VEsFD3FQ==",
      "date": "2017-05-03T22:21:03.000Z"
    }
  },
  "byTag": {
    "RELEASE-4855": {
      "tag": "RELEASE-4855",
      "release": "Beta Release 10",
      "proto": "QVFrMrFzhBZSgrilnoTL6w==",
      "date": "2016-05-06T22:49:51.000Z"
    },
    "RELEASE-4901": {
      "tag": "RELEASE-4901",
      "release": "Beta Release 11",
      "proto": "QVFrMrFzhBZSgrilnoTL6w==",
      "date": "2016-05-17T01:18:15.000Z"
    },
    "RELEASE-4968": {
      "tag": "RELEASE-4968",
      "release": "Beta Release 12",
      "proto": "D5OuKoIxUmX5GMhigz/pFg==",
      "date": "2016-05-28T01:12:15.000Z"
    },
    "RELEASE-5027": {
      "tag": "RELEASE-5027",
      "release": "Beta Release 13",
      "proto": "3TZlZ0Gi+TihPtluPzNbOg==",
      "date": "2016-06-15T17:41:38.000Z"
    },
    "RELEASE-5068": {
      "tag": "RELEASE-5068",
      "release": "Beta Release 14",
      "proto": "TILhcecnBpWwX0pxOGuN7w==",
      "date": "2016-06-25T01:54:50.000Z"
    },
    "RELEASE-5103": {
      "tag": "RELEASE-5103",
      "release": "Beta Release 15",
      "proto": "TILhcecnBpWwX0pxOGuN7w==",
      "date": "2016-07-02T00:03:58.000Z"
    },
    "RELEASE-5179": {
      "tag": "RELEASE-5179",
      "release": "Beta Release 16",
      "proto": "c5ggHVakCjpB1pypIDjJjw==",
      "date": "2016-07-20T21:59:11.000Z"
    },
    "RELEASE-5206": {
      "tag": "RELEASE-5206",
      "release": "Beta Release 17",
      "proto": "c5ggHVakCjpB1pypIDjJjw==",
      "date": "2016-07-26T00:16:24.000Z"
    },
    "RELEASE-5240": {
      "tag": "RELEASE-5240",
      "release": "Beta Release 18",
      "proto": "glPTM03xmviVGxSFw9NT9g==",
      "date": "2016-08-06T15:21:38.000Z"
    },
    "RELEASE-5298": {
      "tag": "RELEASE-5298",
      "release": "Beta Release 19",
      "proto": "glPTM03xmviVGxSFw9NT9g==",
      "date": "2016-08-23T02:06:04.000Z"
    },
    "RELEASE-5335": {
      "tag": "RELEASE-5335",
      "release": "Beta Release 20",
      "proto": "dn7MHlVJtcVGrL66DSrg3A==",
      "date": "2016-08-31T23:17:44.000Z"
    },
    "RELEASE-5396": {
      "tag": "RELEASE-5396",
      "release": "Beta Release 21",
      "proto": "WYNuoFQq0ssJ0oYf+4Cnuw==",
      "date": "2016-09-23T23:43:43.000Z"
    },
    "RELEASE-5424": {
      "tag": "RELEASE-5424",
      "release": "Beta Release 22",
      "proto": "WYNuoFQq0ssJ0oYf+4Cnuw==",
      "date": "2016-10-04T00:10:22.000Z"
    },
    "RELEASE-5572": {
      "tag": "RELEASE-5572",
      "release": "Beta Release 24",
      "proto": "rv2J9jEsL4Y5Ja305uGQUQ==",
      "date": "2016-10-25T13:52:33.000Z"
    },
    "RELEASE-5622": {
      "tag": "RELEASE-5622",
      "release": "Beta Release 25",
      "proto": "rv2J9jEsL4Y5Ja305uGQUQ==",
      "date": "2016-10-28T23:52:15.000Z"
    },
    "RELEASE-5667": {
      "tag": "RELEASE-5667",
      "release": "Beta Release 26",
      "proto": "rv2J9jEsL4Y5Ja305uGQUQ==",
      "date": "2016-11-08T01:34:40.000Z"
    },
    "RELEASE-5693": {
      "tag": "RELEASE-5693",
      "release": "Beta Release 27",
      "proto": "Bi6uXx49SajPhG6yxsmjRQ==",
      "date": "2016-11-12T00:26:34.000Z"
    },
    "RELEASE-5723": {
      "tag": "RELEASE-5723",
      "release": "Beta Release 28",
      "proto": "cje11WLQUk/12oReimhsKg==",
      "date": "2016-11-19T02:20:11.000Z"
    },
    "RELEASE-5782": {
      "tag": "RELEASE-5782",
      "release": "Beta Release 29",
      "proto": "j87v1Bkdmhn4Chza0gPrOw==",
      "date": "2016-12-09T20:20:47.000Z"
    },
    "RELEASE-5822": {
      "tag": "RELEASE-5822",
      "release": "Beta Release 30",
      "proto": "Qql3Ea+ydE5Y2mNEmu1QGQ==",
      "date": "2016-12-20T15:38:53.000Z"
    },
    "RELEASE-5885": {
      "tag": "RELEASE-5885",
      "release": "Beta Release 31",
      "proto": "cJNrQZ4urWA2426aytay+A==",
      "date": "2017-01-11T19:28:49.000Z"
    },
    "RELEASE-5909": {
      "tag": "RELEASE-5909",
      "release": "Beta Release 32",
      "proto": "cJNrQZ4urWA2426aytay+A==",
      "date": "2017-01-17T22:17:26.000Z"
    },
    "RELEASE-6008": {
      "tag": "RELEASE-6008",
      "release": "Beta Release 33",
      "proto": "LS1a0CfdOyh81Cu2uSgclA==",
      "date": "2017-02-07T19:20:47.000Z"
    },
    "RELEASE-6095": {
      "tag": "RELEASE-6095",
      "release": "Beta Release 34",
      "proto": "+27JgWUe9kM5HRFOsuBcWg==",
      "date": "2017-02-28T17:33:47.000Z"
    },
    "RELEASE-6128": {
      "tag": "RELEASE-6128",
      "release": "Beta Release 35",
      "proto": "+27JgWUe9kM5HRFOsuBcWg==",
      "date": "2017-03-07T19:32:38.000Z"
    },
    "RELEASE-6227": {
      "tag": "RELEASE-6227",
      "release": "Beta Release 36",
      "proto": "+27JgWUe9kM5HRFOsuBcWg==",
      "date": "2017-03-29T23:08:01.000Z"
    },
    "RELEASE-6336": {
      "tag": "RELEASE-6336",
      "release": "Beta Release 37",
      "proto": "s9OslX3yNC/rURfZkks20A==",
      "date": "2017-04-18T15:43:22.000Z"
    },
    "RELEASE-6428": {
      "tag": "RELEASE-6428",
      "release": "Beta Release 38",
      "proto": "ztIzQxVFfiVYM+VEsFD3FQ==",
      "date": "2017-05-03T22:21:03.000Z"
    }
  }
}
