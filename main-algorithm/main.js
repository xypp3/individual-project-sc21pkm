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
                    console.log("Buffer level: " + bufferLevel + " secs");
                    console.log(bitrate + " Kbps");
                    console.log(playbackTime + "secs");
                    console.log(frameRate + " fps");
                    console.log(resolution);
                }
                array.push(array.length / 6);
                array.push(bufferLevel);
                // this is the bitrate for the fragment at (bufferLevel + playbackTime)
                //      where a fragment is smaller than a chunk +-1sec where a chunk now is 4sec
                array.push(bitrate);
                array.push(playbackTime);
                array.push(frameRate);
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

    let str = "Index, Buffer Level, Bitrate, Playback Timestamp, Frame Rate, Resolution\n";
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
const settingsBuffer = { streaming: { buffer: { initialBufferLevel: NaN, stableBufferTime: 20, longFormContentDurationThreshold: 600, bufferTimeAtTopQualityLongForm: 90 } } };
const ruleType = 'qualitySwitchRules';

// default values
let ruleName = '';
let rule;
let simulationDesc = "default-desc";

let array = []; //TODO: Figure out how to do static array 
let player = dashjs.MediaPlayer().create();

window.onload = () => {
    document.querySelector("#selectRule").value = "default";
    document.querySelector("#hasEnded").innerHTML = false;
}
document.querySelector("#selectRule").addEventListener("change", (e) => {
    let selected = e.target.value;
    if (selected === "RandomBitrateRule") {
        console.log("selected RandomBitrateRule");
        ruleName = selected;
        rule = RandomBitrateRule;
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

    player.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_COMPLETED"], getMetrics(player, array, true));
    player.on(dashjs.MediaPlayer.events["PLAYBACK_ENDED"], (e) => {
        saveTextAsFile(arrayToCsv(array), `dashjs_data_${ruleName}_${simulationDesc}_.csv`);
        document.querySelector("#hasEnded").innerHTML = true;
    });


    player.initialize(document.querySelector("video"), url, true);
});
