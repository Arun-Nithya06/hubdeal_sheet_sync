import { DeleteMessageCommand, ListQueuesCommand, SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@aws-lambda-powertools/logger';
import * as dotenv from 'dotenv';
dotenv.config();

class SQSService {
  logger = new Logger({ serviceName: SQSService.name });
  private readonly sqs: SQSClient;

  constructor() {
    this.sqs = new SQSClient({ region: process.env.AWS_REGION });
  }

  generateUId(): string {
    return uuidv4();
  }

  public async deleteFromQueue(receiptHandle: string, queueUrl: string): Promise<void> {
    this.logger.info(`Delete queue message from ${queueUrl}: ${receiptHandle}`);
    const deleteParams = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    };

    try {
      const command = new DeleteMessageCommand(deleteParams);
      const isDel = await this.sqs.send(command);
      if (isDel) this.logger.info(`Message deleted successfully from SQS`);
    } catch (error) {
      this.logger.error(`Failed to delete message from SQS: ${error}`);
    }
  }

  public async pushToQueue(data: any, queueUrl: string): Promise<void> {
    this.logger.info(`Push to queue data : ${JSON.stringify(data)}`);
    const uid = this.generateUId();

    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(data),
      MessageGroupId: `g-${uid}`,
      MessageDeduplicationId: `dd-${uid}`,
      DelaySeconds: 0,
      MessageAttributes: {},
    };

    try {
      const command = new SendMessageCommand(params);
      const response = await this.sqs.send(command); // Send message to SQS
      if (response) this.logger.info(`Message sent to SQS:${response?.MessageId}`);
    } catch (error) {
      this.logger.error(`Failed to send message to SQS: ${error}`);
    }
  }

  async getQueueUrlByName(queueName: string): Promise<string> {
    try {
      const command = new ListQueuesCommand({});
      const response = await this.sqs.send(command);

      if (!response.QueueUrls || response.QueueUrls.length === 0) {
        throw new Error('No SQS queues found in this region.');
      }

      // Find the queue URL that matches the provided queue name
      const queueUrl = response.QueueUrls.find(url => url.endsWith(queueName));
      if (!queueUrl) {
        throw new Error(`Queue with name "${queueName}" not found.`);
      }

      return queueUrl;
    } catch (error) {
      throw new Error(`Failed to fetch queue URL for "${queueName}": ${error.message}`);
    }
  }
}

const sqsService = new SQSService();
export default sqsService;
