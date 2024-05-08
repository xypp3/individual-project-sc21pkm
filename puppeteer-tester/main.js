import puppeteer from 'puppeteer';

const bitrateConv = new Map();
bitrateConv.set('', '');

let counter = 0;

// Profiles gotten from BOLA paper:
// <https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=9110784>
const networkSettings = {
	profile1:
	{
		name: "Profile_1",
		profileArr: [[5, 38], [4, 50], [3, 75], [2, 88], [1.5, 100], [2, 88], [3, 75], [4, 50]]
	},
	profile2:
	{
		name: "Profile_2",
		profileArr: [[1.5, 100], [2, 88], [3, 75], [4, 50], [5, 38], [4, 50], [3, 75], [2, 88]]
	}
};


// const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const pollHasEnded = (milliseconds, page, foo) => new Promise((resolve) => {
	foo();
	counter += 1;

	const intId = setInterval(async () => {
		await page.waitForSelector("#hasEnded");
		const element = await page.$('#hasEnded');
		const span = await page.evaluate(element => element.textContent, element);

		if (span && span.trim() === "true") {
			clearInterval(intId);
			return resolve();
		}

		foo();
		counter += 1;
		console.log("loser");
	}, milliseconds);
});



async function networkThrottleForSec(page, Mbis, latency) {
	await page.emulateNetworkConditions({ download: Mbis, latency: latency, upload: Mbis });

	const mbisInput = await page.$("#Mbis");
	// select input to clear when typing
	await mbisInput.click({ clickCount: 3 })
	await mbisInput.type("" + Mbis);

	const latencyInput = await page.$("#latency");
	// select input to clear when typing
	await latencyInput.click({ clickCount: 3 })
	await latencyInput.type("" + latency);
}

(async () => {
	let url = 'http://127.0.0.1:5173';
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.goto(url);
	await page.setViewport({ width: 1080, height: 1024 });

	// setup
	let rule = "BBARule";
	const profile = networkSettings.profile1;
	const desc = profile.name;
	const mbisList = profile.profileArr;

	await page.type("#selectRule", rule);
	await page.type("#text-sim-desc", desc);
	await page.click("button");


	await pollHasEnded(30 * 1000, page, () => {
		let mbis = mbisList[counter % mbisList.length][0] * 1000 * 1000; // convert to bytes
		let latency = mbisList[counter % mbisList.length][1];
		console.log(`Mbis: ${mbis}  Latency: ${latency}`);

		networkThrottleForSec(page, mbis, latency);
	});



	await browser.close();

})();
