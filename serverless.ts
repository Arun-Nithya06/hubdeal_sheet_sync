import type { AWS } from "@serverless/typescript";
import { hubDealHandler, gsheetSQSWorker } from "src/handler/event";

const serverlessConfiguration: AWS = {
  service: "hubdeal-gsheet-sync",
  frameworkVersion: "3",
  plugins: [
    "serverless-esbuild",
    "serverless-offline",
    "serverless-plugin-scripts",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    region: "us-east-1",
    stage: "dev",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["lambda:InvokeFunction", "lambda:InvokeAsync"],
        Resource: [
          {
            "Fn::Sub":
              "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:hubspot-gsheet-sync-${self:provider.stage}-hubDealHandler",
          },
          {
            "Fn::Sub":
              "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:hubspot-gsheet-sync-${self:provider.stage}-gsheetSQSWorker",
          },
        ],
      },
    ],
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
  },

  resources: {
    Resources: {
      hubspotDealToGSheetSyncSQS: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "${self:provider.stage}-hubDeal-gsheet-sync.fifo",
          FifoQueue: true,
          VisibilityTimeout: 910,
          MessageRetentionPeriod: 345600,
        },
      },
    },
  },

  functions: { hubDealHandler, gsheetSQSWorker },
  package: { individually: true },

  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node16",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
