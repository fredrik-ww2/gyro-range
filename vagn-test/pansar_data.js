// Värden ur vagn_pansarregler.json (version 1.0). Inga nya pansartal.
export const REGLER = {
  "version": "1.0",
  "kalla": "vagn_pansarregler.json",
  "vagnar": {
    "tiger_i": {
      "id": "tiger_i",
      "namn": "Tiger I (KwK 36)",
      "kort": "Tiger I",
      "vapen": "kwk36_l56",
      "zoner": {
        "mantel": {
          "mm": 120,
          "lutning": 0
        },
        "torn_front": {
          "mm": 100,
          "lutning": 10
        },
        "torn_sida": {
          "mm": 80,
          "lutning": 0
        },
        "torn_bak": {
          "mm": 80,
          "lutning": 0
        },
        "torn_tak": {
          "mm": 25,
          "lutning": 90
        },
        "skrov_front_overbyggnad": {
          "mm": 100,
          "lutning": 9
        },
        "skrov_nos": {
          "mm": 100,
          "lutning": 25
        },
        "skrov_glacis_kort": {
          "mm": 60,
          "lutning": 80
        },
        "skrov_sida_overbyggnad": {
          "mm": 80,
          "lutning": 0
        },
        "skrov_sida_nedre": {
          "mm": 60,
          "lutning": 0
        },
        "skrov_bak": {
          "mm": 80,
          "lutning": 8
        },
        "skrov_tak": {
          "mm": 25,
          "lutning": 90
        }
      }
    },
    "sherman_m4_75": {
      "id": "sherman_m4_75",
      "namn": "Sherman M4 (75 mm M3)",
      "kort": "Sherman 75 mm",
      "vapen": "m3_75",
      "zoner": {
        "skrov_front_ovre": {
          "mm": 51,
          "lutning": 56
        },
        "skrov_nos": {
          "mm": 51,
          "lutning": 30
        },
        "skrov_sida": {
          "mm": 38,
          "lutning": 0
        },
        "skrov_bak": {
          "mm": 38,
          "lutning": 10
        },
        "mantel": {
          "mm": 89,
          "lutning": 0
        },
        "torn_front": {
          "mm": 76,
          "lutning": 30
        },
        "torn_sida": {
          "mm": 51,
          "lutning": 5
        },
        "tak": {
          "mm": 19,
          "lutning": 90
        }
      }
    },
    "sherman_m4a3_76w": {
      "id": "sherman_m4a3_76w",
      "namn": "Sherman M4A3(76)W (76 mm M1)",
      "kort": "Sherman 76 mm",
      "vapen": "m1_76",
      "zoner": {
        "skrov_front_ovre": {
          "mm": 64,
          "lutning": 47
        },
        "skrov_nos": {
          "mm": 51,
          "lutning": 30
        },
        "skrov_sida": {
          "mm": 38,
          "lutning": 0
        },
        "skrov_bak": {
          "mm": 38,
          "lutning": 10
        },
        "mantel": {
          "mm": 89,
          "lutning": 0
        },
        "torn_front": {
          "mm": 64,
          "lutning": 42
        },
        "torn_sida": {
          "mm": 64,
          "lutning": 0
        },
        "torn_bak": {
          "mm": 64,
          "lutning": 0
        },
        "skrov_tak": {
          "mm": 19,
          "lutning": 90
        },
        "torn_tak": {
          "mm": 25,
          "lutning": 90
        }
      }
    }
  },
  "kanoner": {
    "kwk36_l56": {
      "id": "kwk36_l56",
      "namn": "8,8 cm KwK 36 L/56",
      "kaliber": 88,
      "ap": {
        "id": "pzgr39",
        "namn": "8,8 cm Pzgr. 39",
        "familj": "APCBC",
        "kurva": {
          "100": 146,
          "500": 134,
          "1000": 122,
          "1500": 111,
          "2000": 102
        }
      },
      "he": {
        "id": "sprgr_az",
        "namn": "8,8 cm Sprgr. L/4,5 m. A.Z. 23/28"
      }
    },
    "m3_75": {
      "id": "m3_75",
      "namn": "75 mm Gun M3 (L/40)",
      "kaliber": 75,
      "ap": {
        "id": "m61",
        "namn": "APC M61/M61A1",
        "familj": "APCBC",
        "kurva": {
          "100": 88,
          "500": 81,
          "1000": 73,
          "1500": 65,
          "2000": 59
        }
      },
      "he": {
        "id": "m48",
        "namn": "HE M48 (supercharge)"
      }
    },
    "m1_76": {
      "id": "m1_76",
      "namn": "76 mm Gun M1A1/M1A2 (L/52)",
      "kaliber": 76.2,
      "ap": {
        "id": "m62",
        "namn": "APC M62A1",
        "familj": "APCBC",
        "kurva": {
          "100": 125,
          "500": 116,
          "1000": 106,
          "1500": 97,
          "2000": 89
        }
      },
      "he": {
        "id": "m42a1",
        "namn": "HE M42A1"
      }
    }
  },
  "faktorer": {
    "APCBC": {
      "0": 1.0,
      "30": 0.82,
      "45": 0.62,
      "55": 0.43,
      "60": 0.34,
      "65": 0.25,
      "70": 0.15
    },
    "APBC_trubbnos": {
      "0": 1.0,
      "30": 0.82,
      "45": 0.64,
      "55": 0.45,
      "60": 0.37,
      "65": 0.27,
      "70": 0.17
    },
    "AP_spets_ohattad": {
      "0": 1.0,
      "30": 0.8,
      "45": 0.58,
      "55": 0.4,
      "60": 0.3,
      "65": 0.21,
      "70": 0.12
    },
    "APCR_HVAP": {
      "0": 1.0,
      "30": 0.73,
      "45": 0.47,
      "55": 0.27,
      "60": 0.2,
      "65": 0.13,
      "70": 0.07
    },
    "APDS": {
      "0": 1.0,
      "30": 0.73,
      "45": 0.55,
      "55": 0.4,
      "60": 0.33,
      "65": 0.24,
      "70": 0.14
    }
  },
  "overmatch": {
    "kvot": 1.5,
    "vinkel": 30,
    "konstant": 0.62
  },
  "rikoschett": {
    "APCBC": 70,
    "APBC_trubbnos": 70,
    "AP_spets_ohattad": 65,
    "APCR_HVAP": 60,
    "APDS": 65
  },
  "strombrytare": {
    "he_mot_pansar": false,
    "skada_utan_genomslag": false,
    "rikoschett": true
  },
  "sikten": {
    "sherman_m4_75": [
      {
        "id": "m70f",
        "text": "M70F 3×",
        "forstoring": 3,
        "synfalt": 12.316666666666666
      }
    ],
    "sherman_m4a3_76w": [
      {
        "id": "m71d",
        "text": "M71D 5×",
        "forstoring": 5,
        "synfalt": 13
      }
    ],
    "tiger_i": [
      {
        "id": "tzf9b",
        "text": "TZF 9b 2,5×",
        "forstoring": 2.5,
        "synfalt": 25.5
      },
      {
        "id": "tzf9c25",
        "text": "TZF 9c 2,5×",
        "forstoring": 2.5,
        "synfalt": 25.5
      },
      {
        "id": "tzf9c5",
        "text": "TZF 9c 5×",
        "forstoring": 5,
        "synfalt": 12.75
      }
    ]
  }
};
