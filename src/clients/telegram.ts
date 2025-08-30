const TELEGRAM_MAX_LENGTH = 4096;

export let telegramClient: TelegramClient

export function initializeTelegramClient(botToken: string, channelId: string) {
    telegramClient = new TelegramClient(botToken, channelId)
    console.log('✅ Telegram client initialized');
}

class TelegramClient {
    private botToken: string;
    private channelId: string;

    constructor(botToken: string, channelId: string) {
        if (!botToken || !channelId) {
            throw new Error("Telegram bot token and channel id must be specified.");
        }
        this.botToken = botToken;
        this.channelId = channelId
    }

    public async sendMessage(message: string, maxRetries = 5) {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

        const chunks = splitMessage(message, TELEGRAM_MAX_LENGTH);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const payload = {
                chat_id: this.channelId,
                text: chunk,
                parse_mode: 'HTML',
            };

            let success = false;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    const result = await response.json();

                    if (!result.ok) {
                        throw new Error(`Telegram API error: ${result.description}`);
                    }

                    success = true;
                    break;
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    const isLastAttempt = attempt === maxRetries;
                    const delay = Math.pow(2, attempt) * 500;

                    console.warn(`⚠️ Telegram message chunk ${i + 1} failed (attempt ${attempt + 1}): ${errorMessage}${isLastAttempt ? '' : `. Retrying in ${delay}ms...`}`);

                    if (isLastAttempt) {
                        throw new Error(`❌ Failed to send message chunk ${i + 1} after ${maxRetries + 1} attempts.`);
                    }

                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            if (success && i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500)); // slight delay between chunks
            }
        }
    }
}

function splitMessage(message: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let remaining = message;

    while (remaining.length > maxLength) {
        const slice = remaining.slice(0, maxLength);
        const lastBreak = Math.max(
            slice.lastIndexOf("\n"),
        );
        const splitPoint = lastBreak > 0 ? lastBreak + 1 : maxLength;
        chunks.push(remaining.slice(0, splitPoint));
        remaining = remaining.slice(splitPoint);
    }

    if (remaining) {
        chunks.push(remaining);
    }

    return chunks;
}
