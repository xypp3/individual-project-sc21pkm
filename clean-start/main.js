import dashjs from "dashjs";
import RandomBitrateRule from "./RandomBitrateRule.js";

const url = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";
const settings = { 'streaming': { 'abr': { 'useDefaultABRRules': false } } };
const rule_type = 'qualitySwitchRules';
let player = dashjs.MediaPlayer().create();

player.updateSettings(settings);

player.addABRCustomRule(rule_type, 'RandomBitrateRule', RandomBitrateRule);

player.initialize(document.querySelector('video'), url, false);

