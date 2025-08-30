import dotenv from "dotenv";
import { launchSinglePage } from './browser/browser';
import { initializeTelegramClient, telegramClient } from "./clients/telegram";
import { Job } from "./types/jobs";
import { scrapeAmazonJobs } from "./browser/scrape";
import { DateTime } from "luxon";
import { dynamodbClient, initializeDynamodbClient } from "./clients/dynamodb";

const TIMEZONE = "Asia/Singapore";

const isProduction = process.env.ENVIRONMENT === "production";
if (!isProduction) {
    dotenv.config();
}

async function filterNewJobs(jobs: Job[]): Promise<Job[]> {
    const newJobs: Job[] = [];

    for (const job of jobs) {
        const existing = await dynamodbClient.getJob(job.job_id);
        if (!existing) {
            newJobs.push(job);
            await dynamodbClient.putJob(job);
        }
    }

    return newJobs;
}

async function main() {
    console.log('🌱 Starting web scraping automation...');
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChannelId = process.env.TELEGRAM_CHANNEL_ID;
    const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME;
    console.log('✅ Environment variables loaded:');


    if (!telegramBotToken || !telegramChannelId || !dynamodbTableName) {
        const missing: string[] = [];
        if (!telegramBotToken) missing.push('TELEGRAM_BOT_TOKEN');
        if (!telegramChannelId) missing.push('TELEGRAM_CHANNEL_ID');
        if (!dynamodbTableName) missing.push('DYNAMODB_TABLE_NAME');

        throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    }
    initializeTelegramClient(telegramBotToken, telegramChannelId)
    initializeDynamodbClient(dynamodbTableName)

    const { browser, page } = await launchSinglePage(isProduction);

    const internJobs: Job[] = await scrapeAmazonJobs(page, {
        offset: 0,
        result_limit: 10,
        sort: "recent",
        country: "SGP",
        distanceType: "Mi",
        radius: "24km",
        industry_experience: "less_than_1_year",
        base_query: "intern"
    });

    const saJobs: Job[] = await scrapeAmazonJobs(page, {
        offset: 0,
        result_limit: 10,
        sort: "recent",
        country: "SGP",
        distanceType: "Mi",
        radius: "24km",
        industry_experience: "less_than_1_year",
        base_query: "solutions architect"
    });

    const allJobs = [...saJobs, ...internJobs]
    console.log(`📋 Found ${allJobs.length} in total`)
    const newJobs = await filterNewJobs(allJobs);

    const timestamp = DateTime.now()
        .setZone(TIMEZONE)
        .toFormat("ccc, dd LLL, HH:mm");

    if (newJobs.length === 0) {
        console.log("📭 No new jobs found.");
        await telegramClient.sendMessage(`📭 No new jobs found.\n🕒 ${timestamp} (SGT)`);
    } else {
        const message = [
            `📋 <b>New Amazon Jobs</b>`,
            `🕒 ${timestamp} (SGT)`,
            ...newJobs.map(
                (job, idx) => `${idx + 1}. ${job.title}\n${job.description}\n🔗 ${job.url}`
            )
        ].join("\n\n");

        await telegramClient.sendMessage(message);
    }

    await browser.close();
}

export const handler = async (event) => {
    await main();
    const response = {
        statusCode: 200,
        body: JSON.stringify('✅ Web scraping automation completed'),
    };
    return response;
};

if (!isProduction) {
    main()
}