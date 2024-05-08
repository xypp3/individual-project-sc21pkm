/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */


function HoBRule(config) {

    // for some reason config is always empty (haven't dug into lib to find out why)
    config = config || {};
    let context = this.context;

    const factory = dashjs.FactoryMaker;
    const SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    const MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    const StreamController = factory.getSingletonFactoryByName('StreamController');

    const EventBus = factory.getSingletonFactoryByName('EventBus');
    const eventBus = EventBus(context).getInstance();

    const DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    const dashMetrics = DashMetrics(context).getInstance();

    // console.log(dashMetrics);
    let instance;

    let prevBitrate;
    let prevBitrateIndex;
    let prevBuffer;
    let prevBufferDrain;
    let prevPID;
    const windowSize = 20;
    const prevLengthPID = 20;
    const chunkLength = 4;

    const factorP = 1;
    const factorI = 1;
    const factorD = 1;
    // TODO: Determine better number
    const targetBuffer = 60;
    const redMinus = 20;
    const yellowMinus = 30;
    const green = 50;
    const yellowPlus = 70;
    const redPlus = 90;
    const BUFFER_MAX = 120;

    const startup = 111;
    const steady = 222;
    let state = startup;

    function setup() {
        eventBus.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_ABANDONED"], onFragmentLoadingAbandoned, instance);
        eventBus.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_COMPLETED"], onFragmentLoadingCompleted, instance);

        prevBitrate = [0, 0];
        prevBitrateIndex = [0, 0];
        prevBuffer = [0, 0];
        prevBufferDrain = [0, 0];
        prevPID = [];
        state = startup;
    }

    // DO NOT DELETE SEEMINGLY USELESS getMaxIndex()
    //  When dashjs library is built getSwitchRequest() gets replaced with getMaxIndex(). Why??? God knows, but I'll ask them on GitHub and see if there a method in this madness
    function getMaxIndex(rulesContext) {
        return getSwitchRequest(rulesContext);
    }

    function onFragmentLoadingAbandoned() {
        console.log("fragment abandoned");
    }

    function onFragmentLoadingCompleted(e) {
        if (e && e.request && e.mediaType === 'video') {
            const bufferLevel = dashMetrics.getCurrentBufferLevel(e.mediaType);

            prevBitrate.push(e.request.bytesTotal);
            prevBitrateIndex.push(e.request.quality);
            prevBuffer.push(bufferLevel);
            prevPID.push(0);

            // len-2 becasue len-1 === bufferLevel
            const bufferDrain = Math.min(100, (chunkLength / (chunkLength - (bufferLevel - prevBuffer[prevBuffer.length - 2]))) || 0);

            prevBufferDrain.push(bufferDrain);

            console.log(`Buffer level and drain ${bufferLevel}, ${bufferDrain}`);
            // console.log("completed fragment on load");
            // console.log(prevBitrate);
            // console.log(prevBitrateIndex);
            // console.log(prevBuffer);
        } else if (e.mediaType === "audio") {
        } else {
            console.log("error getting env on fragment loaded");
            console.log(e);
        }
    }

    function calcHarmonicMean(n, arr, err) {
        if (arr.length === 0) {
            return 0;
        }

        let value = 0;
        for (let i = Math.max(0, arr.length - n); i < arr.length; i++) {
            value += (1 / (arr[i] - err));
        }
        return n / value;
    }

    function calcEWMA(n, arr, alpha) {
        const start = Math.max(0, arr.length - n);
        // prev is avg instead of arr[start] to avoid strong bias from arr[start]
        let prev = calcHarmonicMean(n, arr, 0);

        for (let i = start + 1; i < arr.length; i++) {
            prev = (alpha * arr[i]) + (1 - alpha) * prev;
        }

        return prev;
    }

    function sigmoid(x) {
        return Math.exp(x) / (Math.exp(x) + 1);
    }

    // distance from goal from 0 to 1
    function controllerP() {
        const error = targetBuffer - prevBuffer[prevBuffer.length - 1];
        const proportionalError = 5 * (error / (BUFFER_MAX * 0.5));
        return factorP * (2 * (sigmoid(proportionalError) - 0.5));
    }

    // moving avg distance traveled recently
    function controllerI() {
        return [
            factorI * calcHarmonicMean(windowSize, prevBitrate, 0),
            factorI * calcHarmonicMean(windowSize, prevBitrateIndex, 0),
            factorI * Math.abs(calcHarmonicMean(windowSize, prevBuffer, targetBuffer))
        ];
    }

    // exponential moving average of speed travelled
    function controllerD() {
        // 0.2 set by PANDA study
        return calcEWMA(windowSize, prevBufferDrain, 0.2);
    }

    // function startupQuality(currThroughputSafe, currThroughput) {
    //     const bufferDrainRateSafe = (currThroughputSafe / prevBitrate[prevBitrate.length - 1]);
    //     const bufferDrainRate = (currThroughput / prevBitrate[prevBitrate.length - 1]);
    //     console.log("buffer fill ratio safe:" + bufferDrainRateSafe);
    //     console.log("buffer fill ratio:" + bufferDrainRate);
    //
    //     if (factorD >= 0 || 1 < factorD) {
    //         console.error("factorD must be greater than zero 0 AND less than or equal to 1, it is: " + factorD);
    //     }
    //
    //     return ((1 - factorD) * bufferDrainRateSafe) + (factorD * bufferDrainRate);
    // }


    function bitrateToBuffer(bitrate) {
        // inverse of sigmoid is just sigmoid
        const bufferLevel = sigmoid(bitrate);
        return bufferLevel;
    }

    function minBufferForBitrateLevel(bufferLevel, bitrateSet) {
        const fakeBitrate = sigmoid(bufferLevel);
        const bufferLevelLowerBound = quantizeBitrate(fakeBitrate, bitrateSet);

        return bufferLevel - bufferLevelLowerBound;
    }

    function quantizeBitrate(bitrate, bitrateSet, deltaLower = 0, deltaUpper = 0) {
        let specifiedBitrate = -1;
        let bitrateIndex = -1;

        let prevBitrate = 0;
        for (let i = 0; i < bitrateSet.length; i++) {
            if (bitrate < bitrateSet[i]) {
                specifiedBitrate = prevBitrate;
                bitrateIndex = i;
                break;
            } else {
                prevBitrate = bitrateSet[i];
            }
        }

        if (specifiedBitrate === -1) {
            console.log("error clamping bitrate");
        }

        // Dead-zone quantizing
        if (deltaLower > 0 || deltaUpper > 0) {
            const next = bitrateIndex + 1;
            const prev = bitrateIndex - 1;
            if (next < bitrateSet.length
                && next + (next * deltaUpper) <= bitrate) {
                specifiedBitrate = bitrateSet[next];
            } else if (prev >= 0
                && bitrate <= bitrateSet[bitrateIndex] - (prev * deltaLower)) {
                specifiedBitrate = bitrateSet[prev];
            }
        }

        return specifiedBitrate;
    }


    function getSwitchRequest(rulesContext) {
        try {
            const mediaInfo = rulesContext.getMediaInfo();
            const mediaType = rulesContext.getMediaType();
            const streamInfo = rulesContext.getStreamInfo();
            const isDynamic = streamInfo && streamInfo.manifestInfo ? streamInfo.manifestInfo.isDynamic : null;
            const streamId = streamInfo ? streamInfo.id : null;
            const abrController = rulesContext.getAbrController();
            const throughputHistory = abrController.getThroughputHistory();
            const throughputSafe = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic);

            const bufferLevel = prevBuffer[prevBuffer.length - 1];
            const currBitrate = prevBitrate[prevBitrate.length - 1];

            // get PID
            const errorID = Math.max(windowSize, Math.min(-1 * windowSize, controllerI()[2] * controllerD()));
            // const errorAdjustment = controllerP() * errorID;
            // // convert bitrate to buffer projection partial
            // const bufferProjectionLowerBound = bitrateToBuffer(currBitrate);
            // // get diff of current buffer from and bitrate projection
            // const bufferDifferenceFromCurrBitrateBound = bufferLevel - minBufferForBitrateLevel(bufferLevel);
            // // add two (buffer projection partial + buffer diff) = projected buffer
            // const bufferProjection = bufferProjectionLowerBound + bufferDifferenceFromCurrBitrateBound;
            //
            // let nextBitrate = currBitrate;
            // // P desired direction ID is predicted direction
            // // + + (keep at it)
            // // - - (keep at it)
            // if (errorAdjustment > 0) {
            //     nextBitrate = sigmoid(bufferProjection + errorID);
            // }
            console.log(`P: ${controllerP()}`);
            console.log(`I: ${controllerI()[2]}`);
            console.log(`D: ${controllerD()}`);
            console.log(prevBufferDrain);
            console.log(`ErrorID: ${errorID}`);
            // console.log(`Buffer projection: ${bufferProjection}`);
            // - + (want to be less but rate is high? increase BR)
            // + - (want to be more but rate is low? decrease BR)
















            let determinedQuality = prevBitrateIndex[prevBitrateIndex.length - 1];
            switch (state) {
                case startup:
                    determinedQuality = abrController.getQualityForBitrate(mediaInfo, throughputSafe, streamId);
                    break;
                case steady:
                    console.log("steady");
                    break;
                default:
                    console.error("in unknown buffer state");
                    state = startup;
                    break;
            }

            const p = controllerP();
            const i = controllerI();

            // console.table(["hello", p, i[2], prevBuffer]);

            // final request
            let switchRequest = SwitchRequest(context).create();
            switchRequest.quality = determinedQuality;
            switchRequest.reason = 'Switch according to HoB, health of buffer';
            switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
            return switchRequest;
        } catch {
            console.log("HoB Rule Switch request is throwing an error");
        }
    }

    function reset() {
        prevBitrate = [];
        prevBitrateIndex = [];
        prevBuffer = [];
        prevBufferDrain = [];
        state = startup;
    }

    instance = {
        getSwitchRequest,
        // DO NOT DELETE SEEMINGLY USELESS getMaxIndex()
        //  When dashjs library is built getSwitchRequest() gets replaced with getMaxIndex(). Why??? God knows, but I'll ask them on GitHub and see if there a method in this madness
        getMaxIndex,
        reset
    };

    setup();

    return instance;
}

HoBRule.__dashjs_factory_name = 'HoBRule';
export default dashjs.FactoryMaker.getClassFactory(HoBRule);

