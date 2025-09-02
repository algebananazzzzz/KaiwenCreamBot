import dotenv from "dotenv";
import { initializeTelegramClient, telegramClient } from "./clients/telegram";

const TIMEZONE = "Asia/Singapore";

const isProduction = process.env.ENVIRONMENT === "production";
if (!isProduction) {
    dotenv.config();
}

async function main() {
    console.log('🌱 Starting web scraping automation...');
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChannelId = process.env.TELEGRAM_CHANNEL_ID;
    console.log('✅ Environment variables loaded:');


    if (!telegramBotToken || !telegramChannelId) {
        const missing: string[] = [];
        if (!telegramBotToken) missing.push('TELEGRAM_BOT_TOKEN');
        if (!telegramChannelId) missing.push('TELEGRAM_CHANNEL_ID');

        throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    }
    initializeTelegramClient(telegramBotToken, telegramChannelId)



    await telegramClient.sendCream();
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