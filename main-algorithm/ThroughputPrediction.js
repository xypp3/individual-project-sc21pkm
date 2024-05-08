function ThroughputPrediction(config) {

    // for some reason config is always empty (haven't dug into lib to find out why)
    config = config || {};
    let context = this.context;

    const factory = dashjs.FactoryMaker;
    const SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let instance;

    function setup() { }

    // DO NOT DELETE SEEMINGLY USELESS getMaxIndex()
    //  When dashjs library is built getSwitchRequest() gets replaced with getMaxIndex(). Why??? God knows, but I'll ask them on GitHub and see if there a method in this madness
    function getMaxIndex(rulesContext) {
        return getSwitchRequest(rulesContext);
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


            const determinedQuality = abrController.getQualityForBitrate(mediaInfo, throughputSafe, streamId);
            console.log("Throughput prediction: " + determinedQuality);

            // final request
            let switchRequest = SwitchRequest(context).create();
            switchRequest.quality = determinedQuality;
            switchRequest.reason = 'Safe throughput prediction';
            switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
            return switchRequest;
        } catch {
            console.log("Througput prediction throwing error");
        }
    }

    function reset() {
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

ThroughputPrediction.__dashjs_factory_name = 'ThroughputPrediction';
export default dashjs.FactoryMaker.getClassFactory(ThroughputPrediction);

