import dashjs from "dashjs";
import RandomBitrateRule from "./RandomBitrateRule.js";

function getMetrics(player, array, logging) {
    return function(event) {
        try {
            // see monitor sample: <http://reference.dashif.org/dash.js/nightly/samples/advanced/monitoring.html>
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

                if (logging) {
                    console.log(bufferLevel + " secs");
                    console.log(bitrate + " Kbps");
                    console.log(playbackTime + "secs");
                    console.log(frameRate + " fps");
                    console.log(resolution);
                }
                array.push(bufferLevel);
                array.push(bitrate);
                array.push(playbackTime);
                array.push(frameRate);
                array.push(resolution);
            }
        } catch {
            console.error("Media Player or Array error")
        }

    }
}
const url = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";
const settings = { 'streaming': { 'abr': { 'useDefaultABRRules': false } } };
const rule_type = 'qualitySwitchRules';
let array = [];
let player = dashjs.MediaPlayer().create();

// TODO: find out how to have longer buffer than 12 seconds
player.updateSettings(settings);
player.addABRCustomRule(rule_type, 'RandomBitrateRule', RandomBitrateRule);
player.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_COMPLETED"], getMetrics(player, array, false));

player.initialize(document.querySelector('video'), url, false);

setInterval(() => { console.log(array); }, 8000);
