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

    let prevBitrateIndex;
    let prevBuffer;
    const prevLength = 20;

    function setup() {
        eventBus.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_ABANDONED"], onFragmentLoadingAbandoned, instance);
        eventBus.on(dashjs.MediaPlayer.events["FRAGMENT_LOADING_COMPLETED"], onFragmentLoadingCompleted, instance);

        prevBitrateIndex = [];
        prevBuffer = [];
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
            if (prevBuffer.length === prevLength && prevBitrateIndex.length === prevLength) {
                prevBitrateIndex.shift();
                prevBuffer.shift();
            } else {
                console.log(prevBitrateIndex.length, prevBuffer.length, prevLength);
            }

            const bufferLevel = dashMetrics.getCurrentBufferLevel(e.mediaType);
            console.log(bufferLevel);

            // enqueue
            prevBitrateIndex.push(e.request.quality);
            prevBuffer.push(bufferLevel);

            console.log("completed fragment on load");
            console.log(prevBitrateIndex);
            console.log(prevBuffer);
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

    function getSwitchRequest(rulesContext) {
        try {
            // const buffer = dashMetrics.getCurrentBufferLevel(rulesContext.getMediaType());
            let bitrateIndexNext = Math.floor(Math.random() * 10);


            // final request
            let switchRequest = SwitchRequest(context).create();
            switchRequest.quality = bitrateIndexNext;
            switchRequest.reason = 'Switch according to HoB, health of buffer';
            switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
            return switchRequest;
        } catch {
            console.log("HoB Rule Switch request is throwing an error");
        }
    }

    function reset() {
        prevBitrateIndex = [];
        prevBuffer = [];
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

