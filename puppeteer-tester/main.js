import puppeteer from 'puppeteer';

const bitrateConv = new Map();
bitrateConv.set('', '');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const pollHasEnded = (milliseconds, page, foo) => new Promise((resolve) => {
	foo();
	const intId = setInterval(async () => {
		await page.waitForSelector("#hasEnded");
		const element = await page.$('#hasEnded');
		const span = await page.evaluate(element => element.textContent, element);

		if (span && span.trim() === "true") {
			clearInterval(intId);
			return resolve();
		}

		foo();
		console.log("loser");
	}, milliseconds);
});

async function applyProfile(page, mbisList) {
	let mbis;
	let latency;
	let i = 0;

	console.log("network: " + mbis + " " + latency);
	// i 0
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
	console.log("network: " + mbis + " " + latency);

	// i 1
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
	console.log("network: " + mbis + " " + latency);

	// i 2
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
	console.log("network: " + mbis + " " + latency);

	// i 3
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
	console.log("network: " + mbis + " " + latency);

	// i 4
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
	console.log("network: " + mbis + " " + latency);

	// i 5
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
	console.log("network: " + mbis + " " + latency);

	// i 6
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
	console.log("network: " + mbis + " " + latency);

	// i 7
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 8
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 9
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 10
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 11
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 12
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 13
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 14
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 15
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 16
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 17
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 18
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;

	// i 19
	mbis = mbisList[i % mbisList.length][0] * 1000 * 1000; // convert to bytes
	latency = mbisList[i % mbisList.length][1];
	await networkThrottleForSec(page, mbis, latency);
	i += 1;
}

async function networkThrottleForSec(page, Mbis, latency) {
	await page.emulateNetworkConditions({ download: Mbis, latency: latency, upload: Mbis });
	await delay(5 * 1000);
}

(async () => {
	let url = 'http://127.0.0.1:5173';
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.goto(url);
	await page.setViewport({ width: 1080, height: 1024 });

	// setup
	let rule = "BBARule";
	await page.type("#selectRule", rule);
	let desc = "9Mbi-per-sec";
	await page.type("#text-sim-desc", desc);
	await page.click("button");

	applyProfile(page, [[5, 38], [4, 50], [3, 75], [2, 88]]);
	await pollHasEnded(1000, page, () => { console.log("hi") });
	console.log("done intervalling");
	// applyProfile(page, [[5, 38], [4, 50], [3, 75], [2, 88]]);



	await browser.close();

})();
