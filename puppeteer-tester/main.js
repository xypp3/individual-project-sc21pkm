import puppeteer from 'puppeteer';

const bitrateConv = new Map();

(async () => {
	let url = 'http://127.0.0.1:5173';
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.goto(url);
	await page.setViewport({ width: 1080, height: 1024 });

	// setup
	let rule = "RandomBitrateRule";
	await page.type("#selectRule", rule);
	let desc = "Bandwidth:10kbi/s";
	await page.type("#text-sim-desc", desc);
	await page.click("button");

	// intercept requests and apply bandwidth
	// TODO: 1. Find bandwidth calculation
	// 2. Make value programmable
	// 3. Make it variable (ala zipf function)
	let interceptBandwidth = 700;
	await page.setRequestInterception(true);
	page.on('request', interceptedRequest => {
		if (interceptedRequest.isInterceptResolutionHandled()) return;
		const reqUrl = interceptedRequest.url();
		if (reqUrl.endsWith(".m4v")) {
			// map req url to birate
			console.log(reqUrl);
			console.log(reqUrl.match("_([0-9]*)k_")[1])
			const bitrate = bitrateConv.get(reqUrl.match("_([0-9]*)k_")[1]);
			console.log(bitrate);
			const timeDelay = bitrate / interceptBandwidth;
			setTimeout(async () => { await interceptedRequest.continue() }, timeDelay);
		} else {
			interceptedRequest.continue();
		}
	});

	// TODO: make this propah
	setTimeout(async () => { await browser.close() }, 10000);

})();
