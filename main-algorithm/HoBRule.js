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
    const BITRATE_MAX = 14931538;

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
            const bufferDrain = Math.max(-20, Math.min(20, (chunkLength / (chunkLength - (bufferLevel - prevBuffer[prevBuffer.length - 2]))) || 0));

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

    function calcEWMA(n, arr, alpha, prev = 0) {
        const start = Math.max(0, arr.length - n);

        // prev is avg instead of arr[start] to avoid strong bias from arr[start]
        if (prev === 0) {
            prev = calcHarmonicMean(n, arr, 0);
        }

        for (let i = start + 1; i < arr.length; i++) {
            prev = (alpha * arr[i]) + (1 - alpha) * prev;
        }

        return prev;
    }

    function sigmoid(x) {
        return Math.exp(x) / (Math.exp(x) + 1);
    }

    function shiftSigmoid(x, maxX, maxY) {
        const a = sigmoid(x / maxX * 10);

        return a * maxY;
    }

    // distance from goal from 0 to 1
    function controllerP() {
        const error = prevBuffer[prevBuffer.length - 1] - targetBuffer;
        console.log("buffer error: " + error);
        const proportionalError = 5 * (error / (BUFFER_MAX));
        console.log("proprional error: " + proportionalError);
        console.log("sigmoid error: " + sigmoid(proportionalError));
        return factorP * (sigmoid(proportionalError) - 0.5);
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

    function bitrateToBuffer(bitrate) {
        // inverse of sigmoid is just sigmoid
        const bufferLevel = shiftSigmoid(bitrate, BITRATE_MAX, BUFFER_MAX);
        return bufferLevel;
    }

    function minBufferForBitrateLevel(bufferLevel, bitrateSet) {
        const fakeBitrateContinious = shiftSigmoid(bufferLevel, BUFFER_MAX, BITRATE_MAX);
        const fakeBitrate = quantizeBitrate(fakeBitrateContinious, bitrateSet);
        const bufferLevelLowerBound = shiftSigmoid(fakeBitrate, BITRATE_MAX, BUFFER_MAX);

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

    function getBitrateIndex(bitrate, bitrateSet) {
        for (let i = 0; i < bitrateSet.length; i++) {
            if (bitrate == bitrateSet[i]) {
                return i;
            }
        }
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
            var bitrates = mediaInfo.bitrateList.map(function(b) {
                return b.bandwidth;
            });
            console.log(`All bitrates: ${bitrates}`);

            const bufferLevel = prevBuffer[prevBuffer.length - 1];
            const currBitrate = prevBitrate[prevBitrate.length - 1];

            // get PID
            const errorID = Math.min(windowSize, Math.max(-1 * windowSize, controllerI()[2] * controllerD()));
            const errorAdjustment = controllerP() * errorID;
            // convert bitrate to buffer projection partial
            const bufferProjectionLowerBound = bitrateToBuffer(currBitrate);
            // get diff of current buffer from and bitrate projection
            const minBuffer = minBufferForBitrateLevel(bufferLevel, bitrates);
            const bufferDifferenceFromCurrBitrateBound = bufferLevel + minBuffer;

            // // add two (buffer projection partial + buffer diff) = projected buffer
            const bufferProjection = bufferProjectionLowerBound + bufferDifferenceFromCurrBitrateBound;
            const newContinousBitrate = shiftSigmoid(bufferProjection - errorAdjustment, BUFFER_MAX, BITRATE_MAX);
            const smoothedBitrate = calcEWMA(5, prevBitrate, 0.5, newContinousBitrate);
            let newBitrate = getBitrateIndex(quantizeBitrate(smoothedBitrate, bitrates, 0.1, 0), bitrates);



            console.log(`P: ${controllerP()}`);
            console.log(`I: ${controllerI()[2]}`);
            console.log(`D: ${controllerD()}`);
            console.log(prevBufferDrain);
            console.log(`ErrorID: ${errorID}`);
            console.log(`lower bound: ${bufferProjectionLowerBound}`);
            console.log(`difference : ${bufferLevel}-${minBufferForBitrateLevel(bufferLevel, bitrates)} == ${bufferDifferenceFromCurrBitrateBound}`);
            console.log(`BufferProjection: ${bufferProjection}`);
            console.log(`newContinousBitrate: ${newContinousBitrate}`);
            console.log("New smoothed bitrate !!!" + smoothedBitrate);
            console.log("New bitrate !!!" + newBitrate);
            // console.log(`Buffer projection: ${bufferProjection}`);

            let determinedQuality = prevBitrateIndex[prevBitrateIndex.length - 1];
            determinedQuality = abrController.getQualityForBitrate(mediaInfo, throughputSafe, streamId);
            console.log("ACTUAL bitrate !!!" + determinedQuality);



            // console.table(["hello", p, i[2], prevBuffer]);

            // final request
            let switchRequest = SwitchRequest(context).create();
            switchRequest.quality = newBitrate;
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

