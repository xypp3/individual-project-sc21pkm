import dashjs from "dashjs";
import RandomBitrateRule from "./RandomBitrateRule.js";
import BBARule from "./BBARule.js";
import HoBRule from "./HoBRule.js";

function calculateQoE(prevQoE, currBuffer, currBitrate) {
    if (prevQoE.k < 2) {
        prevQoE.k += 1;
        prevQoE.prevBitrate = currBuffer;

        return 0;
    }
    console.log(prevQoE.avgQuality, prevQoE.var, prevQoE.rebuffer);

    let quality = (prevQoE.avgQuality + currBitrate);
    let variation = (prevQoE.var + Math.abs(currBitrate - prevQoE.prevBitrate));
    let rebuffers = (currBuffer < 0.5) ? 1 : 0;

    console.log(quality, variation, rebuffers)

    prevQoE.avgQuality = quality;
    prevQoE.var = variation;
    prevQoE.rebuffer += rebuffers;
    prevQoE.prevBitrate = currBitrate;
    prevQoE.k += 1;

    // 3000 const gotten from MPC study: <https://dl.acm.org/doi/pdf/10.1145/2785956.2787486>
    return (prevQoE.avgQuality / prevQoE.k) - (prevQoE.var / (prevQoE.k - 1)) - (3000 * prevQoE.rebuffer);
}

function getMetrics(player, array, logging, prevQoE) {
    return function(event) {
        try {
            // see monitor sample: <http://reference.dashif.org/dash.js/nightly/samples/advanced/monitoring.html>
            var streamInfo = player.getActiveStream().getStreamInfo();
            var dashMetrics = player.getDashMetrics();
            var dashAdapter = player.getDashAdapter();
            var playbackTime = player.time();

            if (dashMetrics && streamInfo) {
                const periodIdx = streamInfo.index;
                let repSwitch = dashMetrics.getCurrentRepresentationSwitch('video', true);
                let bufferLevel = dashMetrics.getCurrentBufferLevel('video', true);
                let bitrate = repSwitch ? Math.round(dashAdapter.getBandwidthForRepresentation(repSwitch.to, periodIdx) / 1000) : NaN;
                let adaptation = dashAdapter.getAdaptationForType(periodIdx, 'video', streamInfo);
                let currentRep = adaptation.Representation.find(function(rep) {
                    return rep.id === repSwitch.to
                });
                let resolution = currentRep.width + 'x' + currentRep.height;

                let qoe = calculateQoE(prevQoE, bufferLevel, bitrate);

                if (logging) {
                    console.log("Buffer level: " + bufferLevel + " secs");
                    console.log(bitrate + " Kbps");
                    console.log(playbackTime + "secs");
                    console.log("QoE: " + qoe);
                    console.log(resolution);
                }

                array.push(array.length / 6);
                array.push(bufferLevel);
                // this is the bitrate for the fragment at (bufferLevel + playbackTime)
                //      where a fragment is smaller than a chunk +-1sec where a chunk now is 4sec
                array.push(bitrate);
                array.push(playbackTime);
                array.push(qoe);
                array.push(`"${resolution}"`);
            }
        } catch {
            console.error("Media Player or Array error")
        }

    }
}


function arrayToCsv(array) {
    let arrayLen = 6;
    if (array.length % arrayLen != 0) {
        return "data format is wrong, abort CSV conversion";
    }

    let str = "Index, Buffer Level, Bitrate, Playback Timestamp, QoE, Resolution\n";
    if (str.match(new RegExp(",", "g")).length != arrayLen - 1) {
        return "data column titles don't match the number of data columns";
    }

    for (let i = 0; i < array.length; i++) {
        str += array[i];

        if (i % arrayLen === arrayLen - 1) {
            str += "\n";
        } else {
            str += ",";
        }
    }

    return str;
}
/* Epic code gotten from:
 * <https://stackoverflow.com/questions/21012580/is-it-possible-to-write-data-to-file-using-only-javascript>
 *      (Look I tried understing the MDN APIs, it's midnight, the brain is not braining
 *
 *  Saves file to ~/Downloads
*/
function saveTextAsFile(text, filename) {
    var textToWrite = text;
    var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
    var fileNameToSaveAs = filename;
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null) {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}


const url = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";
/* Disable Caching:
 *  - lastMedia and lastBitrate disable saving the data from previous stream and loading the new stream with those settings
 *  - cacheLoadThreshold disables loading from browser cache
*/
const settingsGeneral = { streaming: { lastMediaSettingsCachingInfo: { enabled: false }, lastBitrateCachingInfo: { enabled: false }, cacheLoadThresholds: { video: 0, audio: 0 }, cacheInitSegments: false } };
const settingsABR = { streaming: { abr: { useDefaultABRRules: false }, } };
// NOTE: use half of Netflix buffer as default
//      halving BBA study buffer as 124seconds gives Buffer exceeded warning and crashes at around 140seconds of buffer
let settingsBuffer = { streaming: { buffer: { stableBufferTime: 120, longFormContentDurationThreshold: 600, bufferTimeAtTopQualityLongForm: 108 } } };
const ruleType = 'qualitySwitchRules';

// default values
let ruleName = '';
let rule;
let simulationDesc = "default-desc";

// NOTE: To improve performance, make static allocation at begining
let array = [];
let player = dashjs.MediaPlayer().create();

document.querySelector("#selectRule").value = "default";
document.querySelector("#hasEnded").textContent = false;
document.querySelector("#text-sim-desc").value = simulationDesc;

document.querySelector("#selectRule").addEventListener("change", (e) => {
    let selected = e.target.value;

    if (selected === "RandomBitrateRule") {
        console.log("selected RandomBitrateRule");
        ruleName = selected;
        rule = RandomBitrateRule;
    } else if (selected === "BBARule") {
        console.log("selected BBARule");
        ruleName = selected;
        rule = BBARule;
    } else if (selected === "HoBRule") {
        console.log("selected HoBRule");
        ruleName = selected;
        rule = HoBRule;
    } else {
        console.log("Rule not selected");
    }
});

document.querySelector("#text-sim-desc").addEventListener("input", (e) => {
    simulationDesc = e.target.value;
});

document.querySelector("button").addEventListener("click", () => {
    if (ruleName === "") {
        console.log("rule not selected");
        return;
    }

    player.updateSettings(settingsGeneral);
    player.updateSettings(settingsABR);
    player.updateSettings(settingsBuffer);

    player.addABRCustomRule(ruleType, ruleName, rule);

    let prevQoE = {
        "k": 0,
        "avgQuality": 0,
        "var": 0,
        "rebuffer": 0,
        "prevBitrate": 0
    };

    player.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_COMPLETED"], getMetrics(player, array, true, prevQoE));
    player.on(dashjs.MediaPlayer.events["PLAYBACK_ENDED"], (e) => {
        saveTextAsFile(arrayToCsv(array), `dashjs_data_${ruleName}_${simulationDesc}_.csv`);
        document.querySelector("#hasEnded").textContent = true;
    });


    player.initialize(document.querySelector("video"), url, true);
});
