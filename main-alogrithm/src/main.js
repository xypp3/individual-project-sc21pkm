import dashjs from "../dash.js-development/index.js";
// import LowestBitrateRule from './myRule.js';
// import Bola from "./Bola.js";

let url = "https://dash.akamaized.net/envivio/Envivio-dash2/manifest.mpd";
let player = dashjs.MediaPlayer().create();

// player.updateSettings({ streaming: { abr: { useDefaultABRRules: false } } });
// player.addABRCustomRule('qualitySwitchRules', 'BolaRule', Bola);

player.initialize(document.querySelector('video'), url, true);
