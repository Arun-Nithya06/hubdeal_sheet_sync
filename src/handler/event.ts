import { handlerPath } from "@libs/handler-resolver";
import { AWSFunction } from "@libs/lambda";

export const hubDealHandler: AWSFunction = {
  handler: `${handlerPath(__dirname)}/functions.dealSync`, // Ensure "functions.ts" is spelled correctly
  timeout: 900,
  events: [
    {
      http: {
        method: "post",
        path: "g-sheet-sync",
      },
    },
  ],
};

export const gsheetSQSWorker: AWSFunction = {
  handler: `${handlerPath(__dirname)}/functions.gSheetSync`,
  timeout: 900,
  events: [
    {
      sqs: {
        arn: {
          "Fn::GetAtt": ["hubspotDealToGSheetSyncSQS", "Arn"],
        },
        batchSize: 1,
      },
    },
  ],
};
