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
// machine generated mapping as of 2016.11.23
var VERSIONS = {
  "byRelease": {
    "Beta Release 10": {
      "release": "Beta Release 10",
      "tag": "RELEASE-4855"
    },
    "Beta Release 11": {
      "release": "Beta Release 11",
      "tag": "RELEASE-4901"
    },
    "Beta Release 12": {
      "release": "Beta Release 12",
      "tag": "RELEASE-4968"
    },
    "Beta Release 13": {
      "release": "Beta Release 13",
      "tag": "RELEASE-5027"
    },
    "Beta Release 14": {
      "release": "Beta Release 14",
      "tag": "RELEASE-5068"
    },
    "Beta Release 15": {
      "release": "Beta Release 15",
      "tag": "RELEASE-5103"
    },
    "Beta Release 16": {
      "release": "Beta Release 16",
      "tag": "RELEASE-5179",
      "protocolVersion": "c5ggHVakCjpB1pypIDjJjw=="
    },
    "Beta Release 17": {
      "release": "Beta Release 17",
      "tag": "RELEASE-5206",
      "protocolVersion": "c5ggHVakCjpB1pypIDjJjw=="
    },
    "Beta Release 18": {
      "release": "Beta Release 18",
      "tag": "RELEASE-5240",
      "protocolVersion": "glPTM03xmviVGxSFw9NT9g=="
    },
    "Beta Release 19": {
      "release": "Beta Release 19",
      "tag": "RELEASE-5298",
      "protocolVersion": "glPTM03xmviVGxSFw9NT9g=="
    },
    "Beta Release 20": {
      "release": "Beta Release 20",
      "tag": "RELEASE-5335",
      "protocolVersion": "dn7MHlVJtcVGrL66DSrg3A=="
    },
    "Beta Release 21": {
      "release": "Beta Release 21",
      "tag": "RELEASE-5396",
      "protocolVersion": "WYNuoFQq0ssJ0oYf+4Cnuw=="
    },
    "Beta Release 22": {
      "release": "Beta Release 22",
      "tag": "RELEASE-5424",
      "protocolVersion": "WYNuoFQq0ssJ0oYf+4Cnuw=="
    },
    "Beta Release 24": {
      "release": "Beta Release 24",
      "tag": "RELEASE-5572",
      "protocolVersion": "rv2J9jEsL4Y5Ja305uGQUQ=="
    },
    "Beta Release 25": {
      "release": "Beta Release 25",
      "tag": "RELEASE-5622",
      "protocolVersion": "qSSjFrvX4sCykLyqIGobog=="
    },
    "Beta Release 26": {
      "release": "Beta Release 26",
      "tag": "RELEASE-5667",
      "protocolVersion": "qSSjFrvX4sCykLyqIGobog=="
    },
    "Beta Release 27": {
      "release": "Beta Release 27",
      "tag": "RELEASE-5693",
      "protocolVersion": "Bi6uXx49SajPhG6yxsmjRQ=="
    },
    "Beta Release 28": {
      "release": "Beta Release 28",
      "tag": "RELEASE-5723",
      "protocolVersion": "cje11WLQUk/12oReimhsKg=="
    },
    "Beta Release 29": {
      "release": "Beta Release 29",
      "tag": "RELEASE-5731",
      "protocolVersion": "j87v1Bkdmhn4Chza0gPrOw=="
    }
  },
  "byProtocol": {
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
      "protocolVersion": "c5ggHVakCjpB1pypIDjJjw=="
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
      "protocolVersion": "glPTM03xmviVGxSFw9NT9g=="
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
      "protocolVersion": "dn7MHlVJtcVGrL66DSrg3A=="
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
      "protocolVersion": "WYNuoFQq0ssJ0oYf+4Cnuw=="
    },
    "rv2J9jEsL4Y5Ja305uGQUQ==": {
      "release": "Beta Release 24",
      "releases": [
        "Beta Release 24"
      ],
      "tag": "RELEASE-5572",
      "tags": [
        "RELEASE-5572"
      ],
      "protocolVersion": "rv2J9jEsL4Y5Ja305uGQUQ=="
    },
    "qSSjFrvX4sCykLyqIGobog==": {
      "release": "Beta Release 26",
      "releases": [
        "Beta Release 25",
        "Beta Release 26"
      ],
      "tag": "RELEASE-5667",
      "tags": [
        "RELEASE-5622",
        "RELEASE-5667"
      ],
      "protocolVersion": "qSSjFrvX4sCykLyqIGobog=="
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
      "protocolVersion": "Bi6uXx49SajPhG6yxsmjRQ=="
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
      "protocolVersion": "cje11WLQUk/12oReimhsKg=="
    },
    "j87v1Bkdmhn4Chza0gPrOw==": {
      "release": "Beta Release 29",
      "releases": [
        "Beta Release 29"
      ],
      "tag": "RELEASE-5731",
      "tags": [
        "RELEASE-5731"
      ],
      "protocolVersion": "j87v1Bkdmhn4Chza0gPrOw=="
    }
  },
  "byTag": {
    "RELEASE-4855": {
      "tag": "RELEASE-4855",
      "release": "Beta Release 10"
    },
    "RELEASE-4901": {
      "tag": "RELEASE-4901",
      "release": "Beta Release 11"
    },
    "RELEASE-4968": {
      "tag": "RELEASE-4968",
      "release": "Beta Release 12"
    },
    "RELEASE-5027": {
      "tag": "RELEASE-5027",
      "release": "Beta Release 13"
    },
    "RELEASE-5068": {
      "tag": "RELEASE-5068",
      "release": "Beta Release 14"
    },
    "RELEASE-5103": {
      "tag": "RELEASE-5103",
      "release": "Beta Release 15"
    },
    "RELEASE-5179": {
      "tag": "RELEASE-5179",
      "release": "Beta Release 16",
      "proto": "c5ggHVakCjpB1pypIDjJjw=="
    },
    "RELEASE-5206": {
      "tag": "RELEASE-5206",
      "release": "Beta Release 17",
      "proto": "c5ggHVakCjpB1pypIDjJjw=="
    },
    "RELEASE-5240": {
      "tag": "RELEASE-5240",
      "release": "Beta Release 18",
      "proto": "glPTM03xmviVGxSFw9NT9g=="
    },
    "RELEASE-5298": {
      "tag": "RELEASE-5298",
      "release": "Beta Release 19",
      "proto": "glPTM03xmviVGxSFw9NT9g=="
    },
    "RELEASE-5335": {
      "tag": "RELEASE-5335",
      "release": "Beta Release 20",
      "proto": "dn7MHlVJtcVGrL66DSrg3A=="
    },
    "RELEASE-5396": {
      "tag": "RELEASE-5396",
      "release": "Beta Release 21",
      "proto": "WYNuoFQq0ssJ0oYf+4Cnuw=="
    },
    "RELEASE-5424": {
      "tag": "RELEASE-5424",
      "release": "Beta Release 22",
      "proto": "WYNuoFQq0ssJ0oYf+4Cnuw=="
    },
    "RELEASE-5572": {
      "tag": "RELEASE-5572",
      "release": "Beta Release 24",
      "proto": "rv2J9jEsL4Y5Ja305uGQUQ=="
    },
    "RELEASE-5622": {
      "tag": "RELEASE-5622",
      "release": "Beta Release 25",
      "proto": "qSSjFrvX4sCykLyqIGobog=="
    },
    "RELEASE-5667": {
      "tag": "RELEASE-5667",
      "release": "Beta Release 26",
      "proto": "qSSjFrvX4sCykLyqIGobog=="
    },
    "RELEASE-5693": {
      "tag": "RELEASE-5693",
      "release": "Beta Release 27",
      "proto": "Bi6uXx49SajPhG6yxsmjRQ=="
    },
    "RELEASE-5723": {
      "tag": "RELEASE-5723",
      "release": "Beta Release 28",
      "proto": "cje11WLQUk/12oReimhsKg=="
    },
    "RELEASE-5731": {
      "tag": "RELEASE-5731",
      "release": "Beta Release 29",
      "proto": "j87v1Bkdmhn4Chza0gPrOw=="
    }
  }
}
