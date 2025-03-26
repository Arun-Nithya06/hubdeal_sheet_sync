import { middyfy } from "@libs/lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayEvent, SQSEvent } from "aws-lambda";
import dealSyncService from "src/services/dealSync.service";
import { WebhookEventType } from "src/services/vendors/hubspot/interface/deal.webhook";
import sqsService from "src/services/sqs/sqs.service";
import signatureValidator from "src/middleware/validator.service";
const logger = new Logger({ serviceName: "Funstions" });

const processMessage = async (
  deal: WebhookEventType,
  receiptHandle?: string,
  queueUrl?: string
) => {
  await dealSyncService.syncDealById(deal.objectId.toString());
  await sqsService.deleteFromQueue(receiptHandle, queueUrl);
};

const dealHandler = async (event: APIGatewayEvent) => {
  logger.info(`Deal process started: ${new Date().toISOString()}`);
  logger.debug(`Event : ${JSON.stringify(event)}`);
  try {
    if (!(await signatureValidator.validate(event))) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Unauthorized request" }),
      };
    }
    const body =
      typeof event.body === "string" ? event.body : JSON.stringify(event.body); // Ensure it's a string
    const parseData = JSON.parse(body) as WebhookEventType[];
    await dealSyncService.PushToSQS(parseData);
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: true,
      }),
    };
  } catch (e) {
    logger.error(`Failed to process deal pushing process`, { error: e });

    return {
      statusCode: 500,
      body: JSON.stringify({
        status: false,
        message: "Internal Server Error",
        error: e.message || "Unknown error occurred",
      }),
    };
  }
};

const gSheet = async (event: SQSEvent) => {
  try {
    const data = event?.Records?.[0]?.body;
    // const data = event?.body;
    const queueUrl = process.env.G_SHEET_SYNC_SQS ?? "";
    const parseData = JSON.parse(data);
    await processMessage(
      parseData["hubSpotDeal"],
      event?.Records[0]?.receiptHandle,
      queueUrl
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Messages processed successfully.",
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: false,
        message: "Internal Server Error",
        error: e.message || "Unknown error occurred",
      }),
    };
  }
};

export const gSheetSync = gSheet;
export const dealSync = middyfy(dealHandler);
