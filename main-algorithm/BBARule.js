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

function BBARule(config) {

    // for some reason config is always empty (haven't dug into lib to find out why)
    config = config || {};
    let context = this.context;

    const factory = dashjs.FactoryMaker;
    const SwitchRequest = factory.getClassFactoryByName('SwitchRequest');

    const DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    const dashMetrics = DashMetrics(context).getInstance();

    let instance;
    let bitrateIndexPrev = 0;

    const minIndex = 0;
    const maxIndex = 9;

    function setup() {
    }

    // DO NOT DELETE SEEMINGLY USELESS getMaxIndex()
    //  When dashjs library is built getSwitchRequest() gets replaced with getMaxIndex(). Why??? God knows, but I'll ask them on GitHub and see if there a method in this madness
    function getMaxIndex(rulesContext) {
        return getSwitchRequest(rulesContext);
    }
    function shouldAbandon(rulesContext, streamId) {
        console.log("Abandoning all hope");
    }

    function bufferToIndex(buffer) {
        let cushion = 108 - 45;
        let buffInCushion = buffer - 45;

        return Math.floor((buffInCushion / cushion) * (maxIndex + 1));
    }

    function getSwitchRequest(rulesContext) {
        try {
            const abrController = rulesContext.getAbrController();
            // console.log(abrController.getPossibleVoRepresentations(rulesContext.getMediaType()));

            let bitratePlus = bitrateIndexPrev;
            if (bitrateIndexPrev === maxIndex) {
                bitratePlus = maxIndex;
            } else {
                bitratePlus = bitrateIndexPrev + 1;
            }
            let bitrateMinus = bitrateIndexPrev;
            if (bitrateIndexPrev === minIndex) {
                bitrateMinus = minIndex;
            } else {
                bitrateMinus = bitrateIndexPrev - 1;
            }

            const buffer = dashMetrics.getCurrentBufferLevel(rulesContext.getMediaType());
            const indexFromBuffer = bufferToIndex(buffer);
            console.log("Level: " + buffer);
            console.log("Index from Buffer: " + indexFromBuffer);

            // halving BBA study buffer as 124seconds gives Buffer exceeded warning and crashes at around 140seconds of buffer
            let bitrateIndexNext = bitrateIndexPrev;
            if (buffer <= 45) {
                bitrateIndexNext = minIndex;
            } else if (buffer >= 108) {
                bitrateIndexNext = maxIndex;
            } else if (indexFromBuffer >= bitratePlus) {
                bitrateIndexNext = indexFromBuffer;
            } else if (indexFromBuffer <= bitrateMinus) {
                bitrateIndexNext = indexFromBuffer;
            }

            console.log(bitrateIndexNext);

            // final request
            let switchRequest = SwitchRequest(context).create();
            switchRequest.quality = bitrateIndexNext;
            switchRequest.reason = 'Switch according to Netflix BBA';
            switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
            return switchRequest;
        } catch {
            console.log("Switch request threw an error");
        }
    }

    function reset() {
        bitrateIndexPrev = 0;
    }

    instance = {
        getSwitchRequest,
        // DO NOT DELETE SEEMINGLY USELESS getMaxIndex()
        //  When dashjs library is built getSwitchRequest() gets replaced with getMaxIndex(). Why??? God knows, but I'll ask them on GitHub and see if there a method in this madness
        getMaxIndex,
        shouldAbandon,
        reset
    };

    setup();

    return instance;
}

BBARule.__dashjs_factory_name = 'BBARule';
export default dashjs.FactoryMaker.getClassFactory(BBARule);

