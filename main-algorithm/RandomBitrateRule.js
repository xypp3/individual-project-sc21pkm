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


// Rule that selects the lowest possible bitrate
function RandomBitrateRule(config) {

    // console.log("Config::");
    // console.log(config);
    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    let StreamController = factory.getSingletonFactoryByName('StreamController');

    let context = this.context;
    let instance;
    // console.log("Class context:");
    // console.log(context);

    function setup() {
    }

    // DO NOT DELETE SEEMINGLY USELESS getMaxIndex()
    //  When dashjs library is built getSwitchRequest() gets replaced with getMaxIndex(). Why??? God knows, but I'll ask them on GitHub and see if there a method in this madness
    function getMaxIndex(rulesContext) {
        return getSwitchRequest(rulesContext);
    }
    // Always use lowest bitrate
    function getSwitchRequest(rulesContext) {
        // console.log("Rules Context:");
        // console.log(rulesContext);
        // here you can get some informations aboit metrics for example, to implement the rule
        // let metricsModel = MetricsModel(context).getInstance();
        // var mediaType = rulesContext.getMediaInfo().type;
        // var metrics = metricsModel.getMetricsFor(mediaType, true);

        // A smarter (real) rule could need analyze playback metrics to take
        // bitrate switching decision. Printing metrics here as a reference
        // console.log(metrics);
        //
        // console.log("plspls");
        // console.log("plspls HELL YEAH!!!");
        // console.log("plspls");
        // Get current bitrate
        // let streamController = StreamController(context).getInstance();
        // let abrController = rulesContext.getAbrController();
        // let current = abrController.getQualityFor(mediaType, streamController.getActiveStreamInfo().id);
        //
        // If already in lowest bitrate, don't do anything
        // if (current === 0) {
        //     return SwitchRequest(context).create();
        // }

        // Ask to switch to the lowest bitrate
        let switchRequest = SwitchRequest(context).create();
        switchRequest.quality = Math.floor(Math.random() * 10);
        switchRequest.reason = 'Always switch to a random bitrate';
        switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
        return switchRequest;
    }

    function reset() {
        // TODO: Investigate: reset data probably BUT I don't know how often it resets
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

RandomBitrateRule.__dashjs_factory_name = 'RandomBitrateRule';
export default dashjs.FactoryMaker.getClassFactory(RandomBitrateRule);

