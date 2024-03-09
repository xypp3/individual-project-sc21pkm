import { MediaPlayer } from 'dashjs';
import { LowestBitrateRule } from './LowestBitrateRule.js';

let url = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";

let player = MediaPlayer().create();
player.updateSettings({streaming: {abr: { useDefaultABRRules: false }}});
player.addABRCustomRule('qualitySwitchRules', 'LowestBitrateRule', LowestBitrateRule);

player.initialize(document.querySelector("video"), url, false);
