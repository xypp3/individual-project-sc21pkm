import LowestBitrateRule from './myRule.js';
// import Bola from "./Bola.js";

let url = "https://dash.akamaized.net/envivio/Envivio-dash2/manifest.mpd";
let player = dashjs.MediaPlayer().create();
const rule_type = 'qualitySwitchRules';
const rule = 'LowestBitrateRule';
// const settings = { streaming: { abr: { useDefaultABRRules: false } } };
const settings = {
    abr: {
        activeRules: {
            throughputRule: {
                active: false
            },
            bolaRule: {
                active: false
            },
            insufficientBufferRule: {
                active: false
            },
            switchHistoryRule: {
                active: false
            },
            droppedFramesRule: {
                active: false
            },
            abandonRequestsRule: {
                active: false
            }
        }
    }
};

player.updateSettings(settings);
//player.addABRCustomRule('qualitySwitchRules', 'BolaRule', Bola);
player.addABRCustomRule(rule_type, rule, LowestBitrateRule);

player.initialize(document.querySelector('video'), url, false);
