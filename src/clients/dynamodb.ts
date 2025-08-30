import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Job } from "../types/jobs";


export let dynamodbClient: DynamodbClient

export function initializeDynamodbClient(tableName: string) {
    dynamodbClient = new DynamodbClient(tableName)
}

class DynamodbClient {
    private tableName: string;
    private docClient: DynamoDBDocumentClient;


    constructor(tableName: string) {
        if (!tableName) {
            throw new Error("Table name must be specified.");
        }
        this.tableName = tableName;

        const client = new DynamoDBClient({ region: "ap-southeast-1" });
        this.docClient = DynamoDBDocumentClient.from(client);
    }

    async getJob(jobId: string): Promise<Job | null> {
        const result = await this.docClient.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { job_id: jobId },
            })
        );

        return result.Item ? (result.Item as Job) : null;
    }

    async putJob(job: Job): Promise<void> {
        await this.docClient.send(
            new PutCommand({
                TableName: this.tableName,
                Item: {
                    ...job,
                    ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30-day expiration
                },
            })
        );
    }
}