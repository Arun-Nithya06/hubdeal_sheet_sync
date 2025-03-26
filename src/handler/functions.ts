import { middyfy } from "@libs/lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayEvent, SQSEvent } from "aws-lambda";
import { DealSyncService } from "src/services/dealSync.service";
const logger = new Logger({ serviceName: "Funstions" });

const dealHandler = async (event: APIGatewayEvent) => {
  logger.info(`Deal process started: ${new Date().toISOString()}`);
  try {
    const body =
      typeof event.body === "string" ? event.body : JSON.stringify(event.body); // Ensure it's a string
    const parseData = JSON.parse(body);
    // const sqsUrl = process.env.LAKE_LAND_PIPEDRIVE_HUBSPOT_SYNC_SQS ?? "";
    await new DealSyncService().syncDealById("35078835832"); // 35078835832   21189441079

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
  } catch (e) {}
};

export const gSheetSync = middyfy(gSheet);
export const dealSync = middyfy(dealHandler);
