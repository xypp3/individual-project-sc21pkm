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

    console.log(dashMetrics);
    let instance;

    let prevBitrate;
    let prevBitrateIndex;
    let prevBufferError;
    const prevLength = 20;

    const factorP = 1;
    const factorI = 1;
    const factorD = 0.4; // closer 0 one means more safe
    // TODO: Determine better number
    const targetBuffer = 60;
    const redMinus = 20;
    const yellowMinus = 30;
    const green = 50;
    const yellowPlus = 70;
    const redPlus = 90;
    const bufferMax = 100;

    const startup = 111;
    const steady = 222;
    let state = startup;

    function setup() {
        eventBus.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_ABANDONED"], onFragmentLoadingAbandoned, instance);
        eventBus.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_COMPLETED"], onFragmentLoadingCompleted, instance);

        prevBitrate = [];
        prevBitrateIndex = [];
        prevBufferError = [];
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
            // dequeue 
            if (prevBufferError.length === prevLength
                && prevBitrateIndex.length === prevLength
                && prevBitrate.length == prevLength
            ) {
                prevBitrate.shift();
                prevBitrateIndex.shift();
                prevBufferError.shift();
            } else {
                console.log(prevBitrate.length, prevBitrateIndex.length, prevBufferError.length, prevLength);
            }

            const bufferLevel = dashMetrics.getCurrentBufferLevel(e.mediaType);
            console.log(bufferLevel);

            // enqueue
            prevBitrate.push(e.request.bytesTotal);
            prevBitrateIndex.push(e.request.quality);
            prevBufferError.push(bufferLevel - targetBuffer);

            console.log("completed fragment on load");
            console.log(prevBitrate);
            console.log(prevBitrateIndex);
            console.log(prevBufferError);
        } else if (e.mediaType === "audio") {
        } else {
            console.log("error getting env on fragment loaded");
            console.log(e);
        }
    }

    function calcHarmonicMean(n, arr) {
        let value = 0;
        for (let i = 0; i < arr.length; i++) {
            value += (1 / arr[i]);
        }
        return n / value;
    }

    function sigmoid(x) {
        return Math.exp(x) / (Math.exp(x) + 1);
    }

    function controllerP() {
        const currBufferErrorInstance = prevBufferError[prevBufferError.length - 1];

        return sigmoid(factorP * currBufferErrorInstance);
    }

    function controllerI() {
        return [
            factorI * calcHarmonicMean(prevBitrate.length, prevBitrate),
            factorI * calcHarmonicMean(prevBitrateIndex.length, prevBitrateIndex),
            factorI * calcHarmonicMean(prevBufferError.length, prevBufferError)
        ];
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

            const bufferLevel = prevBufferError[prevBufferError.length - 1] + targetBuffer;

            if (bufferLevel > yellowMinus) {
                state = steady;
            } else if (bufferLevel <= 1) {
                state = startup;
            }

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
        prevBufferError = [];
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

