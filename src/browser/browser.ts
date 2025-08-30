import puppeteer from "puppeteer-core";
import { performance } from "perf_hooks";
import { logStep } from "../helpers";
const chromium = require("@sparticuz/chromium");

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

export async function launchBrowser(isProduction: boolean) {
    const start = performance.now();

    const headlessType = isProduction ? "shell" : false;
    const browser = await puppeteer.launch({
        args: isProduction
            ? puppeteer.defaultArgs({ args: chromium.args, headless: headlessType })
            : [],
        defaultViewport: chromium.defaultViewport,
        executablePath: isProduction
            ? await chromium.executablePath()
            : "/usr/bin/google-chrome",
        headless: headlessType,
    });

    logStep("Browser launch", start);
    return browser;
}

/**
 * Launches a browser, opens a new page, fetches cookies from SSM, sets cookies on page,
 * and returns { browser, page } for further use.
 * 
 * @param {string} ssmPath - SSM parameter path to retrieve cookies JSON.
 * @returns {Promise<{ browser: import('puppeteer').Browser, page: import('puppeteer').Page }>}
 */
export async function launchSinglePage(isProduction: boolean) {
    const browser = await launchBrowser(isProduction);
    const page = await browser.newPage();

    page.on('dialog', async dialog => {
        await dialog.accept();
    });
    return { browser, page };
}
