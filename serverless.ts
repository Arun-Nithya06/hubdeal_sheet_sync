import type { AWS } from "@serverless/typescript";
import { hubDealHandler, gsheetSQSWorker } from "src/handler/event";

const serverlessConfiguration: AWS = {
  service: "NPDI",
  frameworkVersion: "3",
  plugins: [
    "serverless-esbuild",
    "serverless-offline",
    "serverless-plugin-scripts",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    region: "us-east-2",
    stage: "dev",
    profile: "NPDI",
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

      // Load credentials from AWS SSM
      G_SHEET_ACCOUNT_TYPE:
        process.env.G_SHEET_ACCOUNT_TYPE || "${ssm:g_sheet_account_type}",
      G_SHEET_AUTH_PROVIDER_X509_CERT_URL:
        process.env.G_SHEET_AUTH_PROVIDER_X509_CERT_URL ||
        "${ssm:g_sheet_auth_provider_x509_cert_url}",
      G_SHEET_AUTH_URI:
        process.env.G_SHEET_AUTH_URI || "${ssm:g_sheet_auth_uri}",
      G_SHEET_CLIENT_EMAIL:
        process.env.G_SHEET_CLIENT_EMAIL || "${ssm:g_sheet_client_email}",
      G_SHEET_CLIENT_ID:
        process.env.G_SHEET_CLIENT_ID || "${ssm:g_sheet_client_id}",
      G_SHEET_CLIENT_X509_CERT_URL:
        process.env.G_SHEET_CLIENT_X509_CERT_URL ||
        "${ssm:g_sheet_client_x509_cert_url}",
      G_SHEET_PRIVATE_KEY:
        process.env.G_SHEET_PRIVATE_KEY || "${ssm:g_sheet_private_key}",
      G_SHEET_PRIVATE_KEY_ID:
        process.env.G_SHEET_PRIVATE_KEY_ID || "${ssm:g_sheet_private_key_id}",
      G_SHEET_PROJECT_ID:
        process.env.G_SHEET_PROJECT_ID || "${ssm:g_sheet_project_id}",
      G_SHEET_TOKEN_URI:
        process.env.G_SHEET_TOKEN_URI || "${ssm:g_sheet_token_uri}",
      G_SHEET_UNIVERSE_DOMAIN:
        process.env.G_SHEET_UNIVERSE_DOMAIN || "${ssm:g_sheet_universe_domain}",
      G_SHEET_NAME: process.env.G_SHEET_NAME || "${ssm:g_sheet_name}",
      G_SHEET_SPREADSHEET_ID:
        process.env.G_SHEET_SPREADSHEET_ID || "${ssm:g_sheet_spreadsheet_id}",
      HUBSPOT_API_KEY: process.env.HUBSPOT_API_KEY || "${ssm: hubspot_api_key}",
    },
  },

  resources: {
    Resources: {
      hubspotDealToGSheetSyncSQS: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "${self:provider.stage}-npdi-gsheet-sync.fifo",
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
