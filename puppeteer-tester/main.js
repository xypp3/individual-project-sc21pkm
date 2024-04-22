import puppeteer from 'puppeteer';


(async () => {
	// Launch the browser and open a new blank page
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();

	// Navigate the page to a URL
	await page.goto('http://127.0.0.1:5173');

	// Set screen size
	await page.setViewport({ width: 1080, height: 1024 });

	await page.screenshot({ path: 'screenshot.png' });

	// // Type into search box
	// await page.type('.devsite-search-field', 'automate beyond recorder');
	//
	// // Wait and click on first result
	// const searchResultSelector = '.devsite-result-item-link';
	// await page.waitForSelector(searchResultSelector);
	// await page.click(searchResultSelector);
	//
	// // Locate the full title with a unique string
	// const textSelector = await page.waitForSelector(
	// 	'text/Customize and automate'
	// );
	// const fullTitle = await textSelector?.evaluate(el => el.textContent);
	//
	// // Print the full title
	// console.log('The title of this blog post is "".', fullTitle);

	await browser.close();
})();
