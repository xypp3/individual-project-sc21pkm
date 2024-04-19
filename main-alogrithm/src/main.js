// import CustomThroughputRule from './custom-throughput.js';
// import Bola from "./Bola.js";
import dashjs from 'dashjs';
import { LowestBitrateRule } from './LowestBitrateRule.js';
// const url = "https://dash.akamaized.net/envivio/Envivio-dash2/manifest.mpd";
const url = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
let player = dashjs.MediaPlayer().create();
const rule_type = 'qualitySwitchRules';
const rule = 'LowestBitrateRule';
const rule2 = 'CustomThroughputRule';
const settings = { streaming: { abr: { useDefaultABRRules: false } } };

player.updateSettings(settings);
player.addABRCustomRule(rule_type, rule, LowestBitrateRule);
// player.addABRCustomRule(rule_type, rule2, CustomThroughputRule);

player.initialize(document.querySelector('video'), url, false);
