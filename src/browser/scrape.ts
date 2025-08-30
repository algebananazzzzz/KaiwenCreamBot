import { Page } from "puppeteer-core";
import { JobParams } from "../types/urlparams";
import { buildAmazonJobsUrl } from "../urls/build_url";
import { logStep } from "../helpers";
import { Job } from "../types/jobs";

export async function scrapeAmazonJobs(page: Page, params: JobParams): Promise<Job[]> {
    let step = performance.now();
    const url = buildAmazonJobsUrl(params);

    await page.goto(url, { waitUntil: "networkidle2" });
    logStep(`🌱 Navigate to search page: ${url}`, step);

    // Race between jobs or empty state
    step = performance.now();
    const result = await Promise.race([
        page.waitForSelector(".job-tile", { timeout: 5000 }).then(() => "jobs"),
        page.waitForSelector("#search-empty", { timeout: 5000 }).then(() => "empty"),
    ]).catch(() => "timeout");
    logStep("Wait for site to fully load", step);

    // Scrape job title + link
    step = performance.now();
    let jobs: Job[] = [];

    if (result === "jobs") {
        jobs = await page.$$eval(".job-tile", (tiles) =>
            tiles.map((tile) => {
                const jobId = tile.querySelector(".job")?.getAttribute("data-job-id") || "";
                const descEl = tile.querySelector(".qualifications-preview");
                const linkEl = tile.querySelector<HTMLAnchorElement>(".job-title a");
                return {
                    job_id: jobId,
                    title: linkEl?.textContent?.trim() || "",
                    description: descEl?.textContent?.trim() || "",
                    url: linkEl
                        ? new URL(linkEl.href, "https://www.amazon.jobs").toString()
                        : "",
                };
            })
        );
    } else if (result === "empty") {
        console.log("❌ No jobs found for given criteria.");
    } else {
        console.log("⚠️ Timeout waiting for jobs or empty state.");
    }

    logStep("Finished scraping jobs", step);

    return jobs;
}