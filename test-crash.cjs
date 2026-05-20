const puppeteer = require('puppeteer');
(async () => {
    try {
        console.log("Launching browser...");
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('pageerror', error => {
            console.log('--- PAGE ERROR CAUGHT ---');
            console.log(error.message);
            console.log(error.stack);
            console.log('-------------------------');
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('CONSOLE ERROR:', msg.text());
            }
        });

        console.log("Navigating to local preview...");
        await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 10000 });
        
        console.log("Waiting a bit for any delayed errors...");
        await new Promise(r => setTimeout(r, 6000)); // Wait 6 seconds for the Auth timeout to trigger the render crash
        
        await browser.close();
        console.log("Done.");
    } catch (e) {
        console.error("Script error:", e);
    }
})();
