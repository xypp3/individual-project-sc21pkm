import dashjs from 'dashjs'

import LowestBitrateRule from './myRule.js';

let url = "https://dash.akamaized.net/envivio/Envivio-dash2/manifest.mpd";
let player = dashjs.MediaPlayer().create();

player.updateSettings({streaming: {abr: {useDefaultABRRules: false}}});

player.addABRCustomRule('qualitySwitchRules', 'LowestBitrateRule', LowestBitrateRule);
player.initialize(document.querySelector('video'), url, true);
