import dashjs from "dashjs";
import RandomBitrateRule from "./RandomBitrateRule.js";

const url = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";
const settings = { 'streaming': { 'abr': { 'useDefaultABRRules': false } } };
const rule_type = 'qualitySwitchRules';
let player = dashjs.MediaPlayer().create();

player.updateSettings(settings);

player.addABRCustomRule(rule_type, 'RandomBitrateRule', RandomBitrateRule);
// player.on(dashjs.MediaPlayer.events["REPRESENTATION_SWITCH"], console.log);
// player.on(dashjs.MediaPlayer.events["QUALITY_CHANGE_RENDERED"], console.log);
// player.on(dashjs.MediaPlayer.events["BUFFER_LEVEL_UPDATED"], console.log);
// player.on(dashjs.MediaPlayer.events["QUALITY_CHANGE_REQUESTED"], console.log);

function getMetrics(player) {
    return function(e) {
        try {
            var streamInfo = player.getActiveStream().getStreamInfo();
            var dashMetrics = player.getDashMetrics();
            var dashAdapter = player.getDashAdapter();
            var playbackTime = player.time();

            if (dashMetrics && streamInfo) {
                const periodIdx = streamInfo.index;
                var repSwitch = dashMetrics.getCurrentRepresentationSwitch('video', true);
                var bufferLevel = dashMetrics.getCurrentBufferLevel('video', true);
                var bitrate = repSwitch ? Math.round(dashAdapter.getBandwidthForRepresentation(repSwitch.to, periodIdx) / 1000) : NaN;
                var adaptation = dashAdapter.getAdaptationForType(periodIdx, 'video', streamInfo);
                var currentRep = adaptation.Representation.find(function(rep) {
                    return rep.id === repSwitch.to
                })
                var frameRate = currentRep.frameRate;
                var resolution = currentRep.width + 'x' + currentRep.height;
                console.log(bufferLevel + " secs");
                console.log(frameRate + " fps");
                console.log(bitrate + " Kbps");
                console.log(resolution);
                console.log(playbackTime + "secs");
                console.log(bufferLevel + playbackTime + "secs");
            }
        } catch {
            console.error("Media Player or Array error")
        }

    }
}
player.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_COMPLETED"], getMetrics(player));
player.initialize(document.querySelector('video'), url, false);
// TODO: find out how to have longer buffer than 12 seconds


/* Events of interest:
 *   - QUALITY_CHANGE_RENDERED
 *      - gives only quality index nothing more
 *   - THROUGHPUT_MEASUREMENT_STORED
 *   - REPRESENTATION_SWITCH
 *      - Only on CHANGE of quality but you can get bitrate data
*/
