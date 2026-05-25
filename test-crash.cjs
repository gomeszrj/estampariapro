const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        
        console.log("Navigating to http://localhost:5173 ...");
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        
        console.log("Waiting 2 seconds...");
        await new Promise(r => setTimeout(r, 2000));
        
        await browser.close();
        console.log("Done.");
    } catch (err) {
        console.error("Script failed:", err.message);
        process.exit(1);
    }
})();
